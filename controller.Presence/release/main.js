"use strict";

var _sdl = _interopRequireDefault(require("@kmamal/sdl"));
var _enum = _interopRequireDefault(require("enum"));
var _UI = _interopRequireDefault(require("./UI"));
var _config = _interopRequireDefault(require("./config.js"));
var _PTZController = _interopRequireDefault(require("./PTZController"));
var _FestoController = _interopRequireDefault(require("./FestoController"));
var _DMX = _interopRequireDefault(require("./DMX"));
var _OBS = _interopRequireDefault(require("./OBS"));
var _Tools = require("./common/Tools.js");
var _Gamepad = _interopRequireDefault(require("./Gamepad"));
var _Recorder = _interopRequireDefault(require("./Recorder"));
var _Math = require("./common/Math.js");
var _nodeFileDialog = _interopRequireDefault(require("node-file-dialog"));
var _nodeFs = _interopRequireDefault(require("node:fs"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
//import Gamepad from "./Gamepad";

process.title = _config.default.window.title;
const window = _sdl.default.video.createWindow(_config.default.window);
const recorder = new _Recorder.default({
  ..._config.default.RECORDER,
  log: _config.default.RECORDER.log ? (...data) => console.log(`RECORDER ${_config.default.RECORDER.name} : `, ...data) : () => {}
});
const gamepad = new _Gamepad.default(_sdl.default.joystick.devices, {
  ..._config.default.CONTROLLER,
  log: _config.default.CONTROLLER.log ? (...data) => console.log(`GAMEPAD ${_config.default.CONTROLLER.name} : `, ...data) : () => {}
});
const robots = [new _FestoController.default({
  ..._config.default.ROBOTS[0],
  log: _config.default.ROBOTS[0].log ? (...data) => console.log(`ROBOT ${_config.default.ROBOTS[0].name} : `, ...data) : () => {}
}), new _FestoController.default({
  ..._config.default.ROBOTS[1],
  log: _config.default.ROBOTS[1].log ? (...data) => console.log(`ROBOT ${_config.default.ROBOTS[1].name} : `, ...data) : () => {}
})];
const camera = new _PTZController.default({
  ..._config.default.CAMERA,
  log: _config.default.CAMERA.log ? (...data) => console.log(`CAMERA ${_config.default.CAMERA.name} : `, ...data) : () => {}
});
const obs = new _OBS.default({
  ..._config.default.OBS,
  log: _config.default.OBS.log ? (...data) => console.log(`OBS ${_config.default.OBS.name} : `, ...data) : () => {}
});
const ui = new _UI.default(window, gamepad, robots, camera, recorder, obs);

/* UI CONTROL */
{
  ui.onButtonEvent(async event => {
    if (event.target == "robot") {
      if (event.eventName == "connection") {
        robots[event.id].connect();
      } else if (event.eventName == "HOME") {
        console.log("Homing");
        robots[event.id].homing();
      } else if (event.eventName == "ZERO") {
        robots[event.id].setZero();
      }
    } else if (event.target == "camera") {
      if (event.eventName == "connection") {
        camera.connect();
        await (0, _Tools.pWait)(1000);
        await obs.changeScene("Scène");
      } else if (event.eventName == "ZERO") {
        camera.setZero();
      }
    } else if (event.target == "recorder") {
      if (event.eventName == "REC") {
        await obs.startRecord();
      } else if (event.eventName == "STOP") {
        recorder.stop();
        await obs.stopRecord();
      } else if (event.eventName == "PLAY") {
        await obs.playRecord();
      } else if (event.eventName == "PAUSE") {
        await obs.pauseRecord();
      } else if (event.eventName == "load") {
        (0, _nodeFileDialog.default)({
          type: 'open-file'
        }).then(([dir]) => {
          recorder.channels = JSON.parse(_nodeFs.default.readFileSync(dir, "utf8")).map(item => {
            if (item.name == "ROBOT X") {
              item.target = robots[0];
            } else if (item.name == "ROBOT Y") {
              item.target = robots[1];
            } else {
              item.target = camera;
            }
            return item;
          });
        }).catch(err => console.log(err));
      } else {
        if (obs.status == _OBS.default.OBSStatus.OBS_WEBSOCKET_OUTPUT_RESUMED || obs.status == _OBS.default.OBSStatus.OBS_WEBSOCKET_OUTPUT_STARTED) {
          return;
        }
        const chan = recorder.channels.find(({
          name
        }) => name == event.eventName);
        if (event.id == 0) {
          chan.record = !chan.record;
          chan.target.recMode = chan.record;
        } else if (event.id == 1) {
          chan.play = !chan.play;
          chan.target.playMode = chan.play;
        }
      }
    }
  });
}

/* OBS CONTROL */
{
  obs.on("OBS_WEBSOCKET_OUTPUT_STARTED", () => {
    recorder.start();
  });
  obs.on("OBS_WEBSOCKET_OUTPUT_STOPPED", () => {
    //recorder.stop();
  });
  obs.on("OBS_WEBSOCKET_OUTPUT_PAUSED", () => {
    recorder.pause();
  });
  obs.on("OBS_WEBSOCKET_OUTPUT_RESUMED", () => {
    recorder.play();
  });
}

/* RECORDER CONTROL */
{
  recorder.channels = [{
    name: "ROBOT X",
    target: robots[0],
    zero: 0
  }, {
    name: "ROBOT Y",
    target: robots[1],
    zero: 0
  }, ...camera.controllable.map(name => {
    return {
      name,
      target: camera,
      zero: {
        pan: 0.5,
        tilt: 0.5,
        zoom: 0,
        iris: 0
      }
    };
  })];
  recorder.on("play", ({
    c: eventDesc,
    v: value
  }) => {
    if (camera.controllable.includes(eventDesc)) {
      camera.inject(value);
    } else if (eventDesc == "ROBOT X" && robots[0].playMode) {
      robots[0].inject(Buffer.from(value));
    } else if (eventDesc == "ROBOT Y" && robots[1].playMode) {
      robots[1].inject(Buffer.from(value));
    }
  });
  recorder.on("lastFrame", async () => {
    await obs.changeScene("Scène 2");
    await obs.stopRecord();
    await (0, _Tools.pWait)(5000);
    await obs.changeScene("Scène");
    await (0, _Tools.pWait)(500);
    await Promise.all([camera.reset(), robots[0].reset(), robots[1].reset()]);
    await (0, _Tools.pWait)(1000);
    await obs.startRecord();
    await (0, _Tools.pWait)(1000);
  });
  camera.on("request", event => {
    if (obs.status == _OBS.default.OBSStatus.OBS_WEBSOCKET_OUTPUT_RESUMED || obs.status == _OBS.default.OBSStatus.OBS_WEBSOCKET_OUTPUT_STARTED) {
      const [name] = event.match(/(#[A-Za-z]+)/);
      recorder.rec({
        name,
        value: event
      });
    }
  });
  robots[0].on("request", event => {
    if (obs.status == _OBS.default.OBSStatus.OBS_WEBSOCKET_OUTPUT_RESUMED || obs.status == _OBS.default.OBSStatus.OBS_WEBSOCKET_OUTPUT_STARTED) {
      recorder.rec({
        name: "ROBOT X",
        value: event
      });
    }
  });
  robots[1].on("request", event => {
    if (obs.status == _OBS.default.OBSStatus.OBS_WEBSOCKET_OUTPUT_RESUMED || obs.status == _OBS.default.OBSStatus.OBS_WEBSOCKET_OUTPUT_STARTED) {
      recorder.rec({
        name: "ROBOT Y",
        value: event
      });
    }
  });
}

/* GAMEPAD CONTROL */
{
  gamepad.on("JOYSTICK_LEFT_HORIZONTAL", event => {
    if (!robots[0].playMode) {
      robots[0].speed(robots[0].conf.reverseCtrl * (event.target.getValue() * 2 - 1));
    }
  });
  gamepad.on("JOYSTICK_LEFT_VERTICAL", event => {
    if (!robots[1].playMode) {
      robots[1].speed(robots[1].conf.reverseCtrl * (event.target.getValue() * 2 - 1));
    }
  });
  gamepad.on("JOYSTICK_RIGHT_HORIZONTAL", event => {
    camera.setPanTiltSpeed(camera.conf.panReverseCtrl ? 1 - event.target.getValue() : event.target.getValue(), camera.tilt);
  });
  gamepad.on("JOYSTICK_RIGHT_VERTICAL", event => {
    camera.setPanTiltSpeed(camera.pan, camera.conf.tiltReverseCtrl ? 1 - event.target.getValue() : event.target.getValue());
  });
  gamepad.on("TRIGGER_LEFT", event => {
    camera.setZoom((0, _Math.lerp)(0.5, 1, event.target.getValue()));
  });
  gamepad.on("TRIGGER_RIGHT", event => {
    camera.setZoom((0, _Math.lerp)(0.5, 0, event.target.getValue()));
  });
  let irisRun;
  gamepad.on("BUTTON_TRIGGER_LEFT", event => {
    clearInterval(irisRun);
    if (event.target.getValue() != 0) {
      irisRun = setInterval(() => {
        camera.setIris(-1 * event.target.getValue() * 0.05);
      }, 50);
    }
  });
  gamepad.on("BUTTON_TRIGGER_RIGHT", event => {
    clearInterval(irisRun);
    if (event.target.getValue() != 0) {
      irisRun = setInterval(() => {
        camera.setIris(event.target.getValue() * 0.2);
      }, 50);
    }
  });
  gamepad.on("BUTTON_HOME", event => {
    if (event.target.getValue() == 1) {
      robots[0].reset();
      robots[1].reset();
      camera.reset();
    }
  });
  gamepad.on("BUTTON_SELECT", event => {
    if (event.target.getValue() == 1) {
      robots[0].setZero();
      robots[1].setZero();
      camera.setZero();
    }
  });
  gamepad.on("BUTTON_B", event => {
    if (event.target.getValue() == 1) {
      obs.toggleRecord();
    }
  });
}

/* ON CLOSE */
{
  const terminate = async () => {
    await robots[0].close();
    await robots[1].close();
    await camera.close();
    await ui.close();
    await recorder.close();
    await gamepad.close();
    process.exit();
  };
  process.on('SIGINT', terminate);
  window.on('close', terminate);
}
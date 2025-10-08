"use strict";

var _sdl = _interopRequireDefault(require("@kmamal/sdl"));
var _enum = _interopRequireDefault(require("enum"));
var _UI = _interopRequireDefault(require("./UI"));
var _config = _interopRequireDefault(require("./config.js"));
var _PTZController = _interopRequireDefault(require("./PTZController"));
var _FestoController = _interopRequireDefault(require("./FestoController"));
var _Light = _interopRequireDefault(require("./Light"));
var _OBS = _interopRequireDefault(require("./OBS"));
var _Tools = require("./common/Tools.js");
var _Gamepad = _interopRequireDefault(require("./Gamepad"));
var _Player = _interopRequireDefault(require("./Player"));
var _Timeline = _interopRequireDefault(require("./Timeline"));
var _Math = require("./common/Math.js");
var _nodeFileDialog = _interopRequireDefault(require("node-file-dialog"));
var _nodeFs = _interopRequireDefault(require("node:fs"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
//import Gamepad from "./Gamepad";

process.title = _config.default.window.title;
const window = _sdl.default.video.createWindow(_config.default.window);
const timeline = new _Timeline.default({
  ..._config.default.TIMELINE,
  log: _config.default.TIMELINE.log ? (...data) => console.log(`TIMELINE ${_config.default.TIMELINE.name} : `, ...data) : () => {}
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
camera.on('connect', async () => {
  await obs.changeScene("Scène");
  await (0, _Tools.wait)(1000);
  camera.trigger("ready");
});
const obs = new _OBS.default({
  ..._config.default.OBS,
  log: _config.default.OBS.log ? (...data) => console.log(`OBS ${_config.default.OBS.name} : `, ...data) : () => {}
});
const player = new _Player.default({
  ..._config.default.PLAYER,
  log: _config.default.PLAYER.log ? (...data) => console.log(`PLAYER ${_config.default.CAMERA.name} : `, ...data) : () => {}
});
const light = new _Light.default({
  ..._config.default.LIGHT,
  log: _config.default.LIGHT.log ? (...data) => console.log(`LIGHT ${_config.default.LIGHT.name} : `, ...data) : () => {}
});
const ui = new _UI.default(window, gamepad, robots, camera, timeline, obs);

/* UI CONTROL */
{
  ui.onButtonEvent(async event => {
    if (event.target == "robot") {
      if (event.eventName == "connection") {
        robots[event.id].connect();
      } else if (event.eventName == "HOME") {
        await robots[event.id].homing();
      } else if (event.eventName == "ZERO") {
        robots[event.id].setZero();
      }
    } else if (event.target == "camera") {
      if (event.eventName == "connection") {
        camera.connect();
      } else if (event.eventName == "ZERO") {
        camera.setZero();
      }
    } else if (event.target == "timeline") {
      if (event.eventName == "REC") {
        await obs.startRecord();
      } else if (event.eventName == "STOP") {
        timeline.stop();
        await obs.stopRecord();
      } else if (event.eventName == "load") {
        (0, _nodeFileDialog.default)({
          type: 'open-file'
        }).then(([dir]) => {
          timeline.channels = JSON.parse(_nodeFs.default.readFileSync(dir, "utf8")).map(item => {
            if (item.name == "ROBOT X") {
              item.target = robots[0];
            } else if (item.name == "ROBOT Y") {
              item.target = robots[1];
            } else if (item.name == "CAMERA") {
              item.target = camera;
            } else if (item.name == "LIGHT") {
              item.target = light;
            }
            return item;
          });
        }).catch(err => console.log(err));
      } else {
        if (obs.status == _OBS.default.OBSStatus.OBS_WEBSOCKET_OUTPUT_RESUMED || obs.status == _OBS.default.OBSStatus.OBS_WEBSOCKET_OUTPUT_STARTED) {
          return;
        }
        const chan = timeline.channels.find(({
          name
        }) => name == event.eventName);
        chan.target.nextMode();
      }
    }
  });
}

/* timeline CONTROL */
{
  timeline.channels = [{
    name: "ROBOT X",
    target: robots[0],
    zero: 0
  }, {
    name: "ROBOT Y",
    target: robots[1],
    zero: 0
  }, {
    name: "CAMERA",
    target: camera,
    zero: {
      pan: 0.5,
      tilt: 0.5,
      zoom: 0,
      iris: 0
    }
  }, {
    name: "LIGHT",
    target: light,
    zero: {
      pos: 64,
      amp: 27,
      min: 0,
      max: 127
    }
  }];
  timeline.on("trig", ({
    c: eventDesc,
    v: value
  }) => {
    switch (eventDesc) {
      case 0:
        robots[0].isConnected && robots[0].inject(value);
        break;
      case 1:
        robots[1].isConnected && robots[1].inject(value);
        break;
      case 2:
        camera.isConnected && camera.inject(value);
        break;
      case 3:
        console.log(light, value);
        light.isConnected && light.inject(value);
        break;
    }
  });
  robots[0].on("request", event => {
    if (!timeline.isRecording) return;
    timeline.rec(0, event);
  });
  robots[1].on("request", event => {
    if (!timeline.isRecording) return;
    timeline.rec(1, event);
  });
  camera.on("request", event => {
    if (!timeline.isRecording) return;
    timeline.rec(2, event);
  });
  light.on("request", event => {
    if (!timeline.isRecording) return;
    timeline.rec(3, event);
  });
  timeline.on("endRecord", async () => {
    await obs.stopRecord();
    await Promise.all([camera.reset(), robots[0].reset(), robots[1].reset()]);
    timeline.stop();
  });
  timeline.on("lastFrame", async () => {
    await obs.changeScene("Black");
    await (0, _Tools.wait)(5000);
    await obs.stopRecord();
    timeline._hasToRun = false;
    timeline.cursorAt = 0;
    await (0, _Tools.wait)(1000);
    await Promise.all([camera.reset(), robots[0].reset(), robots[1].reset()]);
    await (0, _Tools.wait)(1000);
    await player.play("play");
    await obs.changeScene("Scène");
    await obs.startRecord();
  });
}

/* OBS CONTROL */
{
  obs.on("OBS_WEBSOCKET_OUTPUT_STARTED", () => {
    timeline.start();
  });
  obs.on("OBS_WEBSOCKET_OUTPUT_STOPPED", () => {
    //timeline.stop();
  });
}

/* GAMEPAD CONTROL */
{
  gamepad.on("JOYSTICK_LEFT_HORIZONTAL", event => {
    if (!robots[0].isPlayMode) {
      robots[0].speed(robots[0].conf.reverseCtrl * (event.target.getValue() * 2 - 1));
    }
  });
  gamepad.on("JOYSTICK_LEFT_VERTICAL", event => {
    if (!robots[1].isPlayMode) {
      robots[1].speed(robots[1].conf.reverseCtrl * (event.target.getValue() * 2 - 1));
    }
  });
  gamepad.on("JOYSTICK_RIGHT_HORIZONTAL", event => {
    if (!camera.isPlayMode) {
      camera.setPanTiltSpeed(camera.conf.panReverseCtrl ? 1 - event.target.getValue() : event.target.getValue(), camera.tilt);
    }
  });
  gamepad.on("JOYSTICK_RIGHT_VERTICAL", event => {
    if (!camera.isPlayMode) {
      camera.setPanTiltSpeed(camera.pan, camera.conf.tiltReverseCtrl ? 1 - event.target.getValue() : event.target.getValue());
    }
  });
  gamepad.on("TRIGGER_LEFT", event => {
    if (!camera.isPlayMode) {
      camera.setZoom((0, _Math.lerp)(0.5, 1, event.target.getValue()));
    }
  });
  gamepad.on("TRIGGER_RIGHT", event => {
    if (!camera.isPlayMode) {
      camera.setZoom((0, _Math.lerp)(0.5, 0, event.target.getValue()));
    }
  });
  gamepad.on("BUTTON_TRIGGER_LEFT", event => {
    if (event.target.getValue() == 1) {
      if (!robots[1].isPlayMode) {
        robots[1].prevSpeed();
      }
      if (!robots[0].isPlayMode) {
        robots[0].prevSpeed();
      }
    }

    // if(!camera.isPlayMode){
    //     clearInterval(irisRun);
    //     if(event.target.getValue() != 0){
    //         irisRun = setInterval(()=>{
    //             camera.setIris(-1 * event.target.getValue() * 0.05);    
    //         }, 50);
    //     }
    // }
  });
  gamepad.on("BUTTON_TRIGGER_RIGHT", event => {
    if (event.target.getValue() == 1) {
      // SPEED UP
      if (!robots[1].isPlayMode) {
        robots[1].nextSpeed();
      }
      if (!robots[0].isPlayMode) {
        robots[0].nextSpeed();
      }
    }

    // if(!camera.isPlayMode){
    //     clearInterval(irisRun);
    //     if(event.target.getValue() != 0){
    //         irisRun = setInterval(()=>{
    //             camera.setIris(event.target.getValue() * 0.1);    
    //         }, 50);
    //     }
    // }
  });
  let irisRun;
  gamepad.on("CROSS_LEFT", event => {
    if (!camera.isPlayMode) {
      clearInterval(irisRun);
      if (event.target.getValue() != 0) {
        irisRun = setInterval(() => {
          camera.setIris(-1 * event.target.getValue() * 0.05);
        }, 50);
      }
    }
  });
  gamepad.on("CROSS_RIGHT", event => {
    if (!camera.isPlayMode) {
      clearInterval(irisRun);
      if (event.target.getValue() != 0) {
        irisRun = setInterval(() => {
          camera.setIris(event.target.getValue() * 0.1);
        }, 50);
      }
    }
  });
  let focusRun;
  gamepad.on("CROSS_UP", event => {
    if (!camera.isPlayMode) {
      clearInterval(focusRun);
      if (event.target.getValue() != 0) {
        focusRun = setInterval(() => {
          camera.setFocus(event.target.getValue() * 0.1);
        }, 50);
      }
    }
  });
  gamepad.on("CROSS_DOWN", event => {
    if (!camera.isPlayMode) {
      clearInterval(focusRun);
      if (event.target.getValue() != 0) {
        focusRun = setInterval(() => {
          camera.setFocus(-1 * event.target.getValue() * 0.1);
        }, 50);
      }
    }
  });
  gamepad.on("BUTTON_HOME", event => {
    if (event.target.getValue() == 1) {
      if (!robots[0].isPlayMode) {
        robots[0].reset();
      }
      if (!robots[1].isPlayMode) {
        robots[1].reset();
      }
      if (!camera.isPlayMode) {
        camera.reset();
      }
    }
  });
  gamepad.on("BUTTON_SELECT", event => {
    if (event.target.getValue() == 1) {
      if (!robots[0].isPlayMode) {
        robots[0].setZero();
      }
      if (!robots[1].isPlayMode) {
        robots[1].setZero();
      }
      if (!camera.isPlayMode) {
        camera.setZero();
      }
    }
  });

  // gamepad.on("BUTTON_B", event=>{
  //     if(event.target.getValue() == 1){
  //         obs.toggleRecord();
  //     }
  // });
}

/* ON EVERYTHING IS READY */
{
  Promise.all([robots[0].isReady, robots[1].isReady, camera.isReady]).then(async () => {
    console.log("OK TO GO");
    if (_config.default.APP.autoPlay) {
      timeline.channels = JSON.parse(_nodeFs.default.readFileSync(_config.default.APP.perfFile, "utf8")).map(item => {
        if (item.name == "ROBOT X") {
          item.target = robots[0];
        } else if (item.name == "ROBOT Y") {
          item.target = robots[1];
        } else {
          item.target = camera;
        }
        return item;
      });
      const chan = timeline.channels.map(({
        target
      }) => target.nextMode());
      await (0, _Tools.wait)(1000);
      await Promise.all([camera.reset(), robots[0].reset(), robots[1].reset()]);
      await (0, _Tools.wait)(1000);
      await obs.startRecord();
    }
  });
}

/* ON CLOSE */
{
  const terminate = async () => {
    await player.close();
    await obs.close();
    await robots[0].close();
    await robots[1].close();
    await camera.close();
    await ui.close();
    await timeline.close();
    await gamepad.close();
    process.exit();
  };
  process.on('SIGINT', terminate);
  window.on('close', terminate);
}
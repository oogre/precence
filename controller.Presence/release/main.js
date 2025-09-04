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

// const dmx = new DMX(config.DMX);

// setInterval(()=>{
//     dmx.set(1, Math.floor(Math.random() * 256));
// }, 30);

const recorder = new _Recorder.default(_config.default.RECORDER);
const gamepad = new _Gamepad.default(_sdl.default.joystick.devices, _config.default.CONTROLLER);
const robots = [new _FestoController.default(_config.default.ROBOTS[0]), new _FestoController.default(_config.default.ROBOTS[1])];
const camera = new _PTZController.default(_config.default.CAMERA);
const obs = new _OBS.default(_config.default.OBS);
const ui = new _UI.default(window, gamepad, robots, camera, recorder, obs);
ui.onButtonEvent(async event => {
  if (event.target == "robot") {
    if (event.eventName == "connection") {
      robots[event.id].connect();
    } else if (event.eventName == "HOME") {
      console.log("Homing");
      robots[event.id].homing();
    }
  } else if (event.target == "camera") {
    if (event.eventName == "connection") {
      camera.connect();
      await (0, _Tools.pWait)(1000);
      camera.reset();
      await (0, _Tools.pWait)(1000);
      await obs.changeScene("Scène");
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
        recorder.channels = JSON.parse(_nodeFs.default.readFileSync(dir, "utf8"));
      }).catch(err => console.log(err));
    } else {
      if (obs.status == _OBS.default.OBSStatus.OBS_WEBSOCKET_OUTPUT_RESUMED || obs.status == _OBS.default.OBSStatus.OBS_WEBSOCKET_OUTPUT_STARTED) {
        return;
      }
      const chan = recorder.channels.find(({
        name
      }) => name == event.eventName);
      chan.record = !chan.record;
    }
  }
});
obs.on("OBS_WEBSOCKET_OUTPUT_STARTED", () => {
  recorder.start();
});
obs.on("OBS_WEBSOCKET_OUTPUT_STOPPED", () => {
  recorder.stop();
});
obs.on("OBS_WEBSOCKET_OUTPUT_PAUSED", () => {
  recorder.pause();
});
obs.on("OBS_WEBSOCKET_OUTPUT_RESUMED", () => {
  recorder.play();
});
recorder.channels = gamepad.in.controls.filter(({
  visible
}) => visible).map(({
  name
}) => {
  return {
    name
  };
});
recorder.on("play", ({
  c: eventDesc,
  v: value
}) => {
  gamepad.trigger(eventDesc, {
    target: {
      getValue: () => value
    }
  });
});
recorder.on("lastFrame", async () => {
  await obs.changeScene("Scène 2");
  await obs.stopRecord();
  await (0, _Tools.wait)(5000);
  await obs.changeScene("Scène");
  await (0, _Tools.wait)(500);
  camera.reset();
  await (0, _Tools.wait)(3000);
  // robots[0].speed(-1);
  // robots[1].speed(-1);
  await (0, _Tools.wait)(5000);
  await obs.startRecord();
});
gamepad.on("*", ({
  target: {
    getValue,
    name
  }
}) => {
  recorder.rec({
    name,
    value: getValue()
  });
});
gamepad.on("JOYSTICK_LEFT_HORIZONTAL", event => {
  //console.log("JLH", event.target.getValue());
  robots[0].speed(1 * (event.target.getValue() * 2 - 1));
});
gamepad.on("JOYSTICK_LEFT_VERTICAL", event => {
  //console.log("JLV", event.target.getValue());
  robots[1].speed(-1 * (event.target.getValue() * 2 - 1));
});
gamepad.on("JOYSTICK_RIGHT_HORIZONTAL", event => {
  camera.setPanTiltSpeed(1 - event.target.getValue(), camera.tilt);
});
gamepad.on("JOYSTICK_RIGHT_VERTICAL", event => {
  camera.setPanTiltSpeed(camera.pan, 1 - event.target.getValue());
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
gamepad.on("BUTTON_B", event => {
  console.log(event);
  if (event.target.getValue() == 1) {
    obs.toggleRecord();
  }
});
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
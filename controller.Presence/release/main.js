"use strict";

var _sdl = _interopRequireDefault(require("@kmamal/sdl"));
var _enum = _interopRequireDefault(require("enum"));
var _UI = _interopRequireDefault(require("./UI"));
var _config = _interopRequireDefault(require("./config.js"));
var _PTZController = _interopRequireDefault(require("./PTZController"));
var _FestoController = _interopRequireDefault(require("./FestoController"));
var _DMX = _interopRequireDefault(require("./DMX"));
var _OBS = _interopRequireDefault(require("./OBS"));
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
const camera = new _PTZController.default(_config.default.RECORDER);
const obs = new _OBS.default(_config.default.OBS);
const ui = new _UI.default(window, gamepad, robots, camera, recorder);
ui.onButtonEvent(event => {
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
    }
  } else if (event.target == "recorder") {
    if (event.eventName == "rec") {
      console.log(event);
      if (recorder.isRecording()) {
        recorder.stop();
      } else {
        recorder.start();
      }
    } else if (event.eventName == "load") {
      (0, _nodeFileDialog.default)({
        type: 'open-file'
      }).then(([dir]) => {
        recorder.channels = JSON.parse(_nodeFs.default.readFileSync(dir, "utf8"));
      }).catch(err => console.log(err));
    } else {
      const chan = recorder.channels.find(({
        name
      }) => name == event.eventName);
      chan.record = !chan.record;
    }
  }
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
  robots[0].speed(1 * (event.target.getValue() * 2 - 1));
});
gamepad.on("JOYSTICK_LEFT_VERTICAL", event => {
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
"use strict";

var _sdl = _interopRequireDefault(require("@kmamal/sdl"));
var _enum = _interopRequireDefault(require("enum"));
var _UI = _interopRequireDefault(require("./UI"));
var _config = _interopRequireDefault(require("./config.js"));
var _PTZController = _interopRequireDefault(require("./PTZController"));
var _FestoController = _interopRequireDefault(require("./FestoController"));
var _Gamepad = _interopRequireDefault(require("./Gamepad"));
var _Math = require("./common/Math.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
//import Gamepad from "./Gamepad";

process.title = _config.default.window.title;
const window = _sdl.default.video.createWindow(_config.default.window);
const gamepad = new _Gamepad.default(_sdl.default.joystick.devices, _config.default.controller);
const robots = [new _FestoController.default(_config.default.robots[0]), new _FestoController.default(_config.default.robots[1])];
const camera = new _PTZController.default(_config.default.camera);
const ui = new _UI.default(window, gamepad, robots, camera);
ui.onButtonEvent(event => {
  if (event.target == "robot") {
    if (event.eventName == "connection") {
      robots[event.id].connect();
    } else if (event.eventName == "homing") {
      robots[event.id].homing();
    }
  } else if (event.target == "camera") {
    if (event.eventName == "connection") {
      camera.connect();
    }
  }
});
gamepad.on("JOYSTICK_LEFT_HORIZONTAL", event => {
  camera.setPanTiltSpeed(event.target.getValue(), camera.tilt);
});
gamepad.on("JOYSTICK_LEFT_VERTICAL", event => {
  camera.setPanTiltSpeed(camera.pan, event.target.getValue());
});
gamepad.on("TRIGGER_RIGHT", event => {
  camera.setZoom((0, _Math.lerp)(0.5, 1, event.target.getValue()));
});
gamepad.on("TRIGGER_LEFT", event => {
  camera.setZoom((0, _Math.lerp)(0.5, 0, event.target.getValue()));
});
const terminate = async () => {
  await robots[0].close();
  await robots[1].close();
  await camera.close();
  await gamepad.close();
  await ui.close();
  process.exit();
};
process.on('SIGINT', terminate);
window.on('close', terminate);
"use strict";

var _sdl = _interopRequireDefault(require("@kmamal/sdl"));
var _enum = _interopRequireDefault(require("enum"));
var _UI = _interopRequireDefault(require("./UI"));
var _config = _interopRequireDefault(require("./config.js"));
var _PTZController = _interopRequireDefault(require("./PTZController"));
var _FestoController = _interopRequireDefault(require("./FestoController"));
var _Gamepad = _interopRequireDefault(require("./Gamepad"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
//import Gamepad from "./Gamepad";

process.title = _config.default.window.title;
const window = _sdl.default.video.createWindow(_config.default.window);
const ui = new _UI.default(window, _config.default);
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
const gamepad = new _Gamepad.default(_sdl.default.joystick.devices, _config.default.controller);
const camera = new _PTZController.default(_config.default.camera);
const robots = [new _FestoController.default(_config.default.robots[0]), new _FestoController.default(_config.default.robots[1])];
gamepad.on(_Gamepad.default.EVENT_DESC.JOYSTICK_LEFT, async event => {
  if (event.axis == 0) {
    _config.default.controller.axes[0].values[0].position = event.value * 0.5 + 0.5;
    robots[0].speed(event.value);
  } else if (event.axis == 1) {
    _config.default.controller.axes[0].values[1].position = event.value * -0.5 + 0.5;
    robots[1].speed(event.value);
  }
}).on(_Gamepad.default.EVENT_DESC.JOYSTICK_RIGHT, async event => {
  if (event.axis == 2) {
    //config.controller.axes[1].values[0].position = event.value * 0.5 + 0.5;
    camera.setPanTiltSpeed(event.value, camera.tilt);
  } else if (event.axis == 3) {
    //config.controller.axes[1].values[1].position = event.value * -0.5 + 0.5;
    camera.setPanTiltSpeed(camera.pan, event.value);
  }
}).on(_Gamepad.default.EVENT_DESC.LEFT_TRIGGER, async event => {
  _config.default.controller.axes[2].values[0].position = event.value;
}).on(_Gamepad.default.EVENT_DESC.RIGHT_TRIGGER, async event => {
  _config.default.controller.axes[2].values[1].position = event.value;
}).on(_Gamepad.default.EVENT_DESC.UP_LEFT_PRESS, async event => {
  _config.default.controller.axes[3].values[0].position = 1;
}).on(_Gamepad.default.EVENT_DESC.UP_LEFT_RELEASE, async event => {
  _config.default.controller.axes[3].values[0].position = 0;
}).on(_Gamepad.default.EVENT_DESC.UP_RIGHT_PRESS, async event => {
  _config.default.controller.axes[3].values[1].position = 1;
}).on(_Gamepad.default.EVENT_DESC.UP_RIGHT_RELEASE, async event => {
  _config.default.controller.axes[3].values[1].position = 0;
}).on(_Gamepad.default.EVENT_DESC.A_PRESS, async event => {
  _config.default.controller.axes[4].position = 1;
}).on(_Gamepad.default.EVENT_DESC.A_RELEASE, async event => {
  _config.default.controller.axes[4].position = 0;
}).on(_Gamepad.default.EVENT_DESC.B_PRESS, async event => {
  _config.default.controller.axes[5].position = 1;
}).on(_Gamepad.default.EVENT_DESC.B_RELEASE, async event => {
  _config.default.controller.axes[5].position = 0;
}).on(_Gamepad.default.EVENT_DESC.X_PRESS, async event => {
  _config.default.controller.axes[6].position = 1;
}).on(_Gamepad.default.EVENT_DESC.X_RELEASE, async event => {
  _config.default.controller.axes[6].position = 0;
}).on(_Gamepad.default.EVENT_DESC.Y_PRESS, async event => {
  _config.default.controller.axes[7].position = 1;
}).on(_Gamepad.default.EVENT_DESC.Y_RELEASE, async event => {
  _config.default.controller.axes[7].position = 0;
});
const terminate = async () => {
  await robots[0].close();
  await robots[1].close();
  await camera.close();
  await ui.close();
  await gamepad.close();
  process.exit();
};
process.on('SIGINT', terminate);
window.on('close', terminate);
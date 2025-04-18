"use strict";

var _sdl = _interopRequireDefault(require("@kmamal/sdl"));
var _enum = _interopRequireDefault(require("enum"));
var _UI = _interopRequireDefault(require("./UI"));
var _config = _interopRequireDefault(require("./config.js"));
var _FestoController = _interopRequireDefault(require("./FestoController"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
//import Gamepad from "./Gamepad";

process.title = _config.default.window.title;
const window = _sdl.default.video.createWindow(_config.default.window);
const robots = [new _FestoController.default(_config.default.robots[0]), new _FestoController.default(_config.default.robots[1])];
const ui = new _UI.default(window, _config.default, robots);
ui.onButtonEvent(event => {
  event.target.out.get(event.eventName)?.toggle();
});
const terminate = async () => {
  await ui.close();
  await robots[0].close();
  //await robots[1].close();

  process.exit();
};

//robots[0].connect("10.211.55.2", 5000);

// setInterval(()=>{
//   robots[0].speed(Math.random() * 2 - 1)
// }, 500);

process.on('SIGINT', terminate);
window.on('close', terminate);
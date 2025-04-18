#!/usr/local/bin/node
"use strict";

var _Gamepad = _interopRequireDefault(require("./Gamepad"));
var _PTZController = _interopRequireDefault(require("./PTZController"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
process.title = "controllerPTZ";
process.on('SIGINT', async () => {
  await gamepad.close();
  await camera.close();
  process.exit();
});
const camera = new _PTZController.default("192.168.0.10");
const gamepad = new _Gamepad.default();
gamepad.onJoystick(_Gamepad.default.JOYSTIC_DESC.RIGHT, async event => {
  await camera.setPanTiltSpeed(event.data.horizontal, event.data.vertical).then((...data) => {
    if (data[0] !== false) console.log(data);
  }).catch(error => {
    console.log(error);
  });
  //camera.setZoom(event.data.horizontal);
});
camera.getPanTiltZoomFocusIris();
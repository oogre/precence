"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _dotenv = _interopRequireDefault(require("dotenv"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const {
  CTRL_NAME,
  CTRL_LOG,
  ROBT_X_HOST,
  ROBT_X_LOG,
  ROBT_Y_HOST,
  ROBT_Y_LOG,
  TITLE,
  UI_WIDTH,
  UI_HEIGHT,
  CAME_HOST,
  CAME_LOG
} = _dotenv.default.config().parsed;
var _default = exports.default = {
  window: {
    title: TITLE,
    width: parseInt(UI_WIDTH),
    height: parseInt(UI_HEIGHT)
  },
  controller: {
    name: CTRL_NAME,
    log: parseInt(CTRL_LOG)
  },
  robots: [{
    name: "Horizontal",
    host: ROBT_X_HOST.split(":")[0],
    port: parseInt(ROBT_X_HOST.split(":")[1]),
    maxPos: 196,
    maxSpeed: 0x64,
    log: parseInt(ROBT_X_LOG)
  }, {
    name: "Vertical",
    host: ROBT_Y_HOST.split(":")[0],
    port: parseInt(ROBT_Y_HOST.split(":")[1]),
    maxPos: 196,
    maxSpeed: 0x64,
    log: parseInt(ROBT_Y_LOG)
  }],
  camera: {
    name: "AW-UE100",
    host: CAME_HOST.split(":")[0],
    port: parseInt(CAME_HOST.split(":")[1]),
    log: parseInt(CAME_LOG)
  }
};
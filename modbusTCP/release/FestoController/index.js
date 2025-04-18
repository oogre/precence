"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _net = _interopRequireDefault(require("net"));
var _enum = _interopRequireDefault(require("enum"));
var _nodeBuffer = require("node:buffer");
var _ModBus = _interopRequireDefault(require("./ModBus.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class FestoController extends _ModBus.default {
  static RobotStatus = new _enum.default(['NOT_CONNECTED', 'NOT_HOMED', 'RUNNING', 'ERROR']);
  constructor(conf) {
    super();
    this.conf = conf;
    this.conf.status = FestoController.RobotStatus.NOT_CONNECTED;
    this.out.get("OPM1").toggle();
    this.out.get("HALT").toggle();
    this.out.get("STOP").toggle();
    this.out.get("ENABLE").toggle();
  }
  async close() {
    if (this.isPolling) {
      this.stopPolling();
      this.speed(0);
      await this.send();
    }
    super.close();
  }
  homing() {
    this.out.get("HOME").toggle();
  }
  speed(value) {
    if (value > 0) {
      // FURTHEST OF HOME
      this.out.get("POSITION").setValue(this.conf.maxPos);
    } else {
      // CLOSEST TO HOME
      this.out.get("POSITION").setValue(0);
      value = Math.abs(value);
    }
    this.out.get("SPEED").setValue(value * 0x64);
    if (!this.out.get("START").getValue()) {
      this.out.get("START").toggle();
    }
  }
}
exports.default = FestoController;
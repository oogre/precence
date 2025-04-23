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
  static RobotStatus = new _enum.default(['NOT_CONNECTED', 'CONNECTED', 'ERROR']);
  constructor(conf) {
    super(conf.log ? (...data) => console.log(`Robot ${conf.name} : `, ...data) : undefined);
    this.conf = conf;
    this.conf.status = FestoController.RobotStatus.NOT_CONNECTED;
    this.out.get("OPM1").toggle();
    this.out.get("HALT").toggle();
    this.out.get("STOP").toggle();
    this.out.get("ENABLE").toggle();
    this.in.get("POSITION").minimum = 0;
    this.in.get("POSITION").maximum = this.conf.maxPos;
    this.in.get("SPEED").minimum = 0;
    this.in.get("SPEED").maximum = this.conf.maxSpeed;
  }
  connect(host, port) {
    super.connect(this.conf.host, this.conf.port, () => {
      this.conf.status = FestoController.RobotStatus.CONNECTED;
    }, error => {
      this.conf.status = FestoController.RobotStatus.ERROR;
    });
  }
  async close() {
    if (this.isPolling) {
      this.stopPolling();
      this.speed(0);
      await this.send();
    }
    super.close();
  }
  isError() {
    return this.conf.status == FestoController.RobotStatus.ERROR;
  }
  isConnected() {
    return this.conf.status == FestoController.RobotStatus.CONNECTED;
  }
  isReferenced() {
    return this.in.get("REF").getValue();
  }
  homing() {
    this.out.get("HOME").toggle();
  }
  speed(value) {
    //converter takes value [-1->1] in multiple of 1/8th 
    const converter = value => Math.round(value * 8) / 8;
    value = converter(value);
    if (Math.abs(value * this.conf.maxSpeed) == this.in.get("SPEED").getValue()) {
      console.log(".");
      return;
    }
    if (value > 0) {
      // GO FURTHER TO HOME
      this.out.get("POSITION").setValue(this.conf.maxPos);
    } else {
      // GO CLOSET TO HOME
      this.out.get("POSITION").setValue(0);
      value = Math.abs(value);
    }
    this.out.get("SPEED").setValue(value * this.conf.maxSpeed);
    if (!this.out.get("START").getValue()) {
      this.out.get("START").toggle();
    }
  }
}
exports.default = FestoController;
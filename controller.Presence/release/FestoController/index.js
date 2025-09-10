"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _net = _interopRequireDefault(require("net"));
var _enum = _interopRequireDefault(require("enum"));
var _nodeBuffer = require("node:buffer");
var _Tools = require("../common/Tools.js");
var _ModBus = _interopRequireDefault(require("./ModBus.js"));
var _Constants = require("../common/Constants.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class FestoController extends _ModBus.default {
  static RobotStatus = new _enum.default(['NOT_CONNECTED', 'CONNECTING', 'CONNECTED', 'ERROR']);
  static ChannelStatus = _Constants.ChannelStatus;
  constructor(conf) {
    super(conf);
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
    this.out.get("DESTINATION").minimum = 0;
    this.out.get("DESTINATION").maximum = this.conf.maxPos;
    this.out.get("SPEED").minimum = 0;
    this.out.get("SPEED").maximum = this.conf.maxSpeed;
    this._zero = 0;
    this._mode = FestoController.ChannelStatus.NONE;
  }
  get isError() {
    return this.status == _ModBus.default.ModBusStatus.ERROR || this.conf.status == FestoController.RobotStatus.ERROR;
  }
  get isConnected() {
    return this.conf.status == FestoController.RobotStatus.CONNECTED;
  }
  get isConnecting() {
    return this.conf.status == FestoController.RobotStatus.CONNECTING;
  }
  get isReferenced() {
    return this.in.get("REF").getValue();
  }
  get zero() {
    return this._zero;
  }
  set zero(value) {
    this._zero = value;
  }
  setZero() {
    this.zero = this.in.get("POSITION").getRawValue();
  }
  nextMode() {
    this._mode = (0, _Constants.nextChannel)(this._mode);
    if (this.isPlayMode) {
      this.stopPolling();
    } else {
      this.startPolling();
    }
  }
  get mode() {
    return this._mode.value;
  }
  get isRecordMode() {
    return this._mode == FestoController.ChannelStatus.RECORD;
  }
  get isPlayMode() {
    return this._mode == FestoController.ChannelStatus.PLAY;
  }
  get isNoneMode() {
    return this._mode == FestoController.ChannelStatus.NONE;
  }
  async connect(host, port) {
    try {
      this.conf.status = FestoController.RobotStatus.CONNECTING;
      await super.connect(this.conf.host, this.conf.port, this.conf.timeout, error => {
        this.conf.status = FestoController.RobotStatus.ERROR;
      });
      await (0, _Tools.wait)(100);
      await this.homing();
      this.startPolling();
      this.conf.status = FestoController.RobotStatus.CONNECTED;
    } catch (error) {
      console.log(error);
      this.conf.status = FestoController.RobotStatus.ERROR;
    }
  }
  async close() {
    if (this.isPolling) {
      this.stopPolling();
      this.speed(0);
      await this.send();
    }
    super.close();
  }
  async homing(forced = false) {
    if (forced) {
      this.out.get("HOME").toggle();
      this.in.get("REF").toggle();
    }
    let homeTrigged = false;
    return new Promise(async resolve => {
      while (!this.isReferenced) {
        this.send(false);
        await (0, _Tools.wait)(50);
        if (!homeTrigged && !this.isReferenced) {
          this.out.get("HOME").toggle();
          homeTrigged = true;
        }
      }
      resolve();
    });
  }
  async reset() {
    if (!this.isConnected) return;
    this.out.get("DESTINATION").setValue(this._zero);
    this.out.get("SPEED").setValue(this.conf.maxSpeed);
    this.out.get("START").toggle();
    return new Promise(async resolve => {
      while (0 != this._zero - this.in.get("POSITION").getRawValue()) {
        await (0, _Tools.wait)(100);
      }
      this.log("OK");
      resolve();
    });
  }
  speed(input) {
    //converter takes value [-1->1] in multiple of 1/8th 
    const converter = value => Math.round(value * 8) / 8;
    let value = converter(input);
    if (Math.abs(Math.abs(value) - this.out.get("SPEED").getValue()) < 0.05) {
      return;
    }
    if (value > 0) {
      // GO FURTHER TO HOME
      this.out.get("DESTINATION").setValue(this.conf.maxPos);
    } else {
      // GO CLOSET TO HOME
      this.out.get("DESTINATION").setValue(0);
      value = Math.abs(value);
    }
    this.out.get("SPEED").setValue(value * this.conf.maxSpeed);
    if (!this.out.get("START").getValue()) {
      this.out.get("START").toggle();
    }
    //this.log(this.out.get("SPEED").getValue());
  }
}
exports.default = FestoController;
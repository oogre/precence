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
  static RobotSpeed = new _enum.default({
    'MOUNTAIN': 0,
    'SNAIL': 1,
    'WIND': 2,
    'ALPHAJET': 3,
    "LIGHT": 4
  });
  static SpeedValue = [0.1, 0.3, 0.5, 0.7, 1.0];
  constructor(conf) {
    super(conf);
    this.conf = conf;
    this.conf.status = FestoController.RobotStatus.NOT_CONNECTED;
    this.in.get("POSITION").minimum = 0;
    this.in.get("POSITION").maximum = this.conf.maxPos;
    this.in.get("SPEED").minimum = 0;
    this.in.get("SPEED").maximum = this.conf.maxSpeed;
    this.DEFAULT_OUT.get("DESTINATION").minimum = 0;
    this.DEFAULT_OUT.get("DESTINATION").maximum = this.conf.maxPos;
    this.DEFAULT_OUT.get("SPEED").minimum = 0;
    this.DEFAULT_OUT.get("SPEED").maximum = this.conf.maxSpeed;
    this._zero = 0;
    this._mode = FestoController.ChannelStatus.NONE;
    this.isReady = new Promise(resolve => {
      this.trigReady = resolve;
    });
    this.on("ready", () => {
      this.trigReady();
    });
    this._robotSpeed = FestoController.RobotSpeed.WIND;
    this._lastSpeedInput = 0;
    this._speed = 0;
    this._dest = 0;
    this._goTo = false;
    this._goHome = false;
    setTimeout(() => {
      this.conf.autoConnect && this.connect();
    }, 1000);
  }
  nextSpeed() {
    this._robotSpeed = FestoController.RobotSpeed.get(Math.min(this._robotSpeed.value + 1, FestoController.RobotSpeed.enums.length - 1));
    console.log("ROBOT", this._robotSpeed.key);
    this.speed(this._lastSpeedInput);
  }
  prevSpeed() {
    this._robotSpeed = FestoController.RobotSpeed.get(Math.max(this._robotSpeed.value - 1, 0));
    console.log("ROBOT", this._robotSpeed.key);
    this.speed(this._lastSpeedInput);
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
      this.startPolling();
      await (0, _Tools.wait)(100);
      if (this.conf.autoHome) {
        await this.homing();
      }
      this.conf.status = FestoController.RobotStatus.CONNECTED;
      this.trigger("connect", "ok");
      if (!this.conf.autoHome) {
        this.trigger("ready");
      }
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
  async homing() {
    this._goHome = true;
    while (true) {
      await (0, _Tools.wait)(100);
      if (this.isReferenced) {
        this._goHome = false;
        this.sendingHome = false;
        break;
      }
    }
    this.trigger("ready");
  }
  async reset() {
    if (!this.isConnected) return;
    await this.goTo(this._zero);
  }
  async goTo(position) {
    this._goTo = Math.max(0, Math.min(Math.floor(position), this.conf.maxPos));
    this.isPlayMode && this.send();
    while (Math.abs(this._goTo - this.in.get("POSITION").getRawValue()) > 0) {
      this.isPlayMode && this.send();
      await (0, _Tools.wait)(100);
    }
    this._goTo = false;
  }
  speed(input) {
    this._lastSpeedInput = input;
    //converter takes value [-1->1] in multiple of 1/8th 
    const converter = value => Math.round(value * 8) / 8;
    let value = converter(input);
    if (value > 0) {
      // GO FURTHER TO HOME
      this._dest = this.conf.maxPos;
    } else {
      // GO CLOSET TO HOME
      this._dest = 0;
      value = Math.abs(value);
    }
    this._speed = Math.floor(value * this.conf.maxSpeed * FestoController.SpeedValue[this._robotSpeed.value]);
  }
}
exports.default = FestoController;
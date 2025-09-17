"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _net = _interopRequireDefault(require("net"));
var _FHPP = require("./FHPP.js");
var _nodeBuffer = require("node:buffer");
var _Tools = require("../common/Tools.js");
var _tool = require("./tool.js");
var _enum = _interopRequireDefault(require("enum"));
var _nodeProcess = require("node:process");
var _Constants = require("../common/Constants.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class ModBus extends _Tools.EventManager {
  static ModBusStatus = new _enum.default(['STOPED', 'RUNNING', 'ERROR']);
  constructor(conf) {
    super("ModBus", ["request"]);
    this.log = conf.log;
    this.lost = 0;
    this.DEFAULT_OUT = new _FHPP.FHPP_OUT();
    this.DEFAULT_OUT.get("OPM1").toggle();
    this.DEFAULT_OUT.get("HALT").toggle();
    this.DEFAULT_OUT.get("STOP").toggle();
    this.DEFAULT_OUT.get("ENABLE").toggle();
    this.in = new _FHPP.FHPP_IN();
    this.isPolling = false;
    this.status = ModBus.ModBusStatus.STOPED;
    this.client = new _net.default.Socket();
    this.client.on('end', this.onEnd.bind(this));
    this.client.on('error', this.onError.bind(this));
    this.client.on('close', this.onClose.bind(this));
    this._lastSpeed = -1;
    this._lastDest = -1;
    this.sendingHome = false;
  }
  get nullRequest() {
    const out = new _FHPP.FHPP_OUT();
    out.data = this.DEFAULT_OUT.data;
    return out;
  }
  async connect(host, port, timeout, error = () => {}) {
    console.log(host, port);
    await Promise.race([new Promise(async (resolve, reject) => {
      await (0, _Tools.wait)(timeout);
      reject("timeout");
    }), new Promise(resolve => {
      this.client.connect(port, host, () => resolve());
    })]);
    this.client.on('error', error.bind(this));
    this.client.on('close', error.bind(this));
    this.client.on('end', error.bind(this));
  }
  startPolling() {
    if (this.isPolling) return;
    this.isPolling = true;
    this.status = ModBus.ModBusStatus.RUNNING;
    this.send();
  }
  stopPolling() {
    this.isPolling = false;
  }
  async inject(request) {
    const rq = this.nullRequest;
    rq.data = _nodeBuffer.Buffer.from(request);
    this.send(rq);
  }
  async send(request = this.nullRequest) {
    let hasToRec = false;
    if (this.sendingHome) {} else if (this._goHome) {
      request.get("HOME").toggle();
      this.in.get("REF").toggle();
      this.sendingHome = true;
    } else if (Number.isInteger(this._goTo)) {
      request.get("DESTINATION").setValue(this._goTo);
      request.get("SPEED").setValue(this.conf.maxSpeed);
      request.get("START").toggle();
      hasToRec = true;
    } else if (this._speed != this._lastSpeed || this._dest != this._lastDest) {
      request.get("DESTINATION").setValue(this._dest);
      request.get("SPEED").setValue(this._speed);
      request.get("START").toggle();
      this._lastSpeed = this._speed;
      this._lastDest = this._dest;
      hasToRec = true;
    }
    try {
      this.log("->", request.data);
      this.isRecordMode && hasToRec && this.trigger("request", [...request.data]);
      this.in.data = await (0, _tool.call)(this.client, request.data);
      await (0, _Tools.wait)(30);
      await this._TRIG_("START", request);
      await this._TRIG_("HOME", request);
      this.isPolling && this.send();
    } catch (error) {
      console.log("ERROROR ");
      console.log(error, request.data);
    }
  }
  async _TRIG_(name, request) {
    if (!(name == "START" || name == "HOME")) return;
    if (request.get(name).getValue()) {
      while (this.in.get("ACK").getValue() != 1) {
        this.log("~>", request.data);
        this.in.data = await (0, _tool.call)(this.client, request.data);
        await (0, _Tools.wait)(5);
      }
      request.get(name).toggle();
      while (this.in.get("ACK").getValue() != 0) {
        this.log("•>", request.data);
        this.in.data = await (0, _tool.call)(this.client, request.data);
        await (0, _Tools.wait)(5);
      }
    }
  }
  close() {
    this.client.destroy();
  }
  onEnd() {
    this.stopPolling();
    this.log('disconnected from server');
    this.status = ModBus.ModBusStatus.STOPED;
  }
  onError(err) {
    this.stopPolling();
    console.log('Error : ', err);
    this.status = ModBus.ModBusStatus.ERROR;
  }
  onClose() {
    this.stopPolling();
    this.log('socket closed');
    this.status = ModBus.ModBusStatus.STOPED;
  }
}
exports.default = ModBus;
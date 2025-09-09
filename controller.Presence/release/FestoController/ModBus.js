"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _net = _interopRequireDefault(require("net"));
var _FHPP = require("./FHPP.js");
var _nodeBuffer = require("node:buffer");
var _Tools = require("../common/Tools.js");
var _enum = _interopRequireDefault(require("enum"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class ModBus {
  static ModBusStatus = new _enum.default(['STOPED', 'RUNNING', 'ERROR']);
  constructor(log = () => {}) {
    this.log = log;
    this.outHeader = _nodeBuffer.Buffer.from([0x00, 0X00, 0X00, 0X00, 0X00, 0X13, 0X00, 0X17, 0X00, 0X00, 0X00, 0X04, 0X00, 0X00, 0X00, 0X04, 0X08]);
    this.out = new _FHPP.FHPP_OUT(log);
    this.in = new _FHPP.FHPP_IN(log);
    this.isPolling = false;
    this.status = ModBus.ModBusStatus.STOPED;
    this.client = new _net.default.Socket();
    this.client.on('data', this.onData.bind(this));
    this.client.on('end', this.onEnd.bind(this));
    this.client.on('error', this.onError.bind(this));
    this.client.on('close', this.onClose.bind(this));
    this.readjustSpeedDelay = null;
    this.handlers = {
      request: []
    };
    this.NULL_BUFFER = _nodeBuffer.Buffer.from([0x43, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    this._playMode = false;
    this._recMode = false;
    this.oldRequest = _nodeBuffer.Buffer.from([]);
  }
  set playMode(value) {
    this._playMode = value;
  }
  get playMode() {
    return this._playMode;
  }
  set recMode(value) {
    this._recMode = value;
  }
  get recMode() {
    return this._recMode;
  }
  on(description, callback) {
    if (!Object.keys(this.handlers).includes(description)) throw new Error(`onRequest wait for ModBus.EVENT_DESC as first parameter. You give "${description}".`);
    if (typeof callback !== 'function') throw new Error(`onRequest wait for function as second parameter. You give "${typeof callback}".`);
    this.handlers[description].push(callback);
    return this;
  }
  trigger(eventDesc, event) {
    [...this.handlers[eventDesc] /*, ...this.handlers["*"]*/].forEach(handler => {
      handler(event);
    });
  }
  connect(host, port, callback = () => {}, error = () => {}) {
    this.client.connect(port, host, () => {
      this.log(`connected to ${host} : ${port}`);
      callback();
      this.startPolling();
    });
    this.client.on('error', error.bind(this));
    this.client.on('close', error.bind(this));
    this.client.on('end', error.bind(this));
  }
  startPolling() {
    this.isPolling = true;
    this.status = ModBus.ModBusStatus.RUNNING;
    this.send();
  }
  stopPolling() {
    this.isPolling = false;
  }
  inject(request) {
    this.out.data = request;
  }
  async send(loop = true) {
    //increment values of 2 firsts bytes of header
    this.outHeader.writeUInt16BE((this.outHeader.readUInt16BE(0) + 1) % 0XFFFF);

    // prepare the waiter for the response
    this.waitForDataSuccess = null;
    this.waitForDataReject = null;
    this.waitForData = new Promise((resolve, reject) => {
      this.waitForDataSuccess = resolve;
      this.waitForDataReject = reject;
    });
    const request = _nodeBuffer.Buffer.from([...this.out.data]);
    if (0 != _nodeBuffer.Buffer.compare(request, this.oldRequest)) {
      this.log(this._playMode ? `~>` : `->`, request);
      this.client.write(_nodeBuffer.Buffer.concat([this.outHeader, request]));
      this._recMode && this.trigger("request", request);
      this.oldRequest = _nodeBuffer.Buffer.from([...request]);
      try {
        this.in.data = await this.waitForData;
        // /* FAKE REFERENCED FOR DEBUG */ this.in.get("REF").toggle();
        //this.log(`<-`, this.in.data);
        this.status = ModBus.ModBusStatus.RUNNING;

        // if(!this._playMode){
        // Start and Home has to be strobed to be applied
        // So if one is UP this turn it down and send
        const [isStart, isHome] = [this.out.get("START").getValue(), this.out.get("HOME").getValue()];
        if (isStart || isHome) {
          isStart && this.out.get("START").toggle();
          isHome && this.out.get("HOME").toggle();
          this.send(false);
        }
        let deltaV = Math.abs(this.in.get("SPEED").getValue() - this.out.get("SPEED").getValue());
        if (!this.readjustSpeedDelay && deltaV > 0.11) {
          this.readjustSpeedDelay = setTimeout(() => {
            this.out.get("START").toggle();
            this.readjustSpeedDelay = null;
          }, 40);
        }
        //}
      } catch (error) {
        this.log(error);
        this.status = ModBus.ModBusStatus.ERROR;
      }
    }
    await (0, _Tools.pWait)(50);
    // it cannot be faster than 50 send per second
    loop && this.isPolling && this.send();
  }
  close() {
    this.client.destroy();
  }
  onData(data) {
    const d = _nodeBuffer.Buffer.copyBytesFrom(data, 9, 8);
    if (d.length != 8) {
      setTimeout(() => this.waitForDataReject("wrong response"), 1);
    } else {
      setTimeout(() => this.waitForDataSuccess(d), 1);
    }
  }
  onEnd() {
    this.stopPolling();
    this.log('disconnected from server');
  }
  onError(err) {
    this.stopPolling();
    this.log('Error : ', err);
  }
  onClose() {
    this.stopPolling();
    this.log('socket closed');
  }
}
exports.default = ModBus;
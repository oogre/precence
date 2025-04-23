"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _net = _interopRequireDefault(require("net"));
var _FHPP = require("./FHPP.js");
var _nodeBuffer = require("node:buffer");
var _Tools = require("../common/Tools.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class ModBus {
  constructor(log = () => {}) {
    this.log = log;
    this.outHeader = _nodeBuffer.Buffer.from([0x00, 0X00, 0X00, 0X00, 0X00, 0X13, 0X00, 0X17, 0X00, 0X00, 0X00, 0X04, 0X00, 0X00, 0X00, 0X04, 0X08]);
    this.out = new _FHPP.FHPP_OUT();
    this.in = new _FHPP.FHPP_IN();
    this.isPolling = false;
    this.client = new _net.default.Socket();
    this.client.on('data', this.onData.bind(this));
    this.client.on('end', this.onEnd.bind(this));
    this.client.on('error', this.onError.bind(this));
    this.client.on('close', this.onClose.bind(this));
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
    this.send();
  }
  stopPolling() {
    this.isPolling = false;
  }
  async send(loop = true) {
    this.log(`->`, this.out.data);

    //increment values of 2 firsts bytes of header
    this.outHeader.writeUInt16BE((this.outHeader.readUInt16BE(0) + 1) % 0XFFFF);

    // prepare the waiter for the response
    this.waitForDataSuccess = null;
    this.waitForData = new Promise(resolve => {
      this.waitForDataSuccess = resolve;
    });

    // send and wait for the response
    this.client.write(_nodeBuffer.Buffer.concat([this.outHeader, this.out.data]));
    this.in.data = await this.waitForData;
    this.log(`<-`, this.in.data);

    // Start and Home has to be strobed to be applied
    // So if one is UP this turn it down and send
    const [isStart, isHome] = [this.out.get("START").getValue(), this.out.get("HOME").getValue()];
    if (isStart || isHome) {
      isStart && this.out.get("START").toggle();
      isHome && this.out.get("HOME").toggle();
      this.send(false);
    }

    // it cannot be faster than 50 send per second
    await (0, _Tools.wait)(20);
    loop && this.isPolling && this.send();
  }
  close() {
    this.client.destroy();
  }
  onData(data) {
    const d = _nodeBuffer.Buffer.copyBytesFrom(data, 9, 8);
    setTimeout(() => this.waitForDataSuccess(d), 1);
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
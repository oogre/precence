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
  constructor() {
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
  connect(host, port) {
    this.client.connect(port, host, () => {
      console.log(`connected to ${host} : ${port}`);
      this.startPolling(20);
    });
  }
  startPolling() {
    this.isPolling = true;
    this.send();
  }
  stopPolling() {
    this.isPolling = false;
  }
  async send(loop = true) {
    console.log(`->`, this.out.data);

    //increment values of 2 firsts bytes of header
    this.outHeader.writeUInt16BE((this.outHeader.readUInt16BE(0) + 1) % 0XFFFF);

    // prepare the waiter for the response
    this.waitResponseOK = null;
    this.waitResponse = new Promise(resolve => {
      this.waitResponseOK = resolve;
    });

    // send and wait for the response
    this.client.write(_nodeBuffer.Buffer.concat([this.outHeader, this.out.data]));
    const response = await this.waitResponse;
    this.in.data = _nodeBuffer.Buffer.from(response);
    console.log(`<-`, this.in.data);

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
    setTimeout(() => this.waitResponseOK(d), 1);
  }
  onEnd() {
    this.stopPolling();
    console.log('disconnected from server');
  }
  onError(err) {
    this.stopPolling();
    console.log('Error : ', err);
  }
  onClose() {
    this.stopPolling();
    console.log('socket closed');
  }
}
exports.default = ModBus;
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _RequestHolder = _interopRequireDefault(require("./RequestHolder.js"));
var _Tools = require("../common/Tools.js");
var _got = _interopRequireDefault(require("got"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class HTTPRoutine {
  constructor(log = () => {}) {
    this.log = log;
    this.out = new _RequestHolder.default();
    this.in = new _RequestHolder.default();
    this.isPolling = false;
    this.errorHandler = () => {};
    this.waitForDataSuccess = () => {};
    this.waitForDataReject = () => {};
    this.requestWaitingList = [];
    this.getData = false;
  }
  connect(host, port, callback = () => {}, error = () => {}) {
    this.host = host;
    this.port = port;
    this.errorHandler = error.bind(this);
    this.log("connect");
    this.httpCall(this.out.get("GET_PAN_TILT_ZOOM_FOCUS_IRIS").data.toRequest()).then(({
      body
    }) => {
      this.log("<-", body);
      callback(body);
      this.startPolling();
    }).catch(error => {
      console.log(error);
    });
    //this.requestWaitingList.push("OSA:87:21"); // set Freq to 24fps
    this.requestWaitingList.push("#D30"); // set IrisMode to manual
  }
  startPolling() {
    this.log("startPolling");
    this.isPolling = true;
    this.send();
  }
  stopPolling() {
    this.isPolling = false;
  }
  httpCall(request) {
    return (0, _got.default)(`http://${this.host}:${this.port}/cgi-bin/aw_ptz`, {
      method: 'GET',
      searchParams: {
        cmd: request,
        res: 1
      },
      timeout: {
        lookup: 100,
        connect: 1000,
        socket: 1000,
        send: 1000,
        response: 1000
      }
    }).catch(error => {
      this.log("x-", error.code);
      this.onError(error);
    });
  }
  addRequest(request) {
    const id = this.requestWaitingList.findIndex(req => req.startsWith(`#${request.data.cmd}`));
    if (id >= 0) {
      this.requestWaitingList[id] = request.data.toRequest();
    } else {
      this.requestWaitingList.push(request.data.toRequest());
    }
  }
  async send(loop = true) {
    let request = this.out.get("GET_PAN_TILT_ZOOM_FOCUS_IRIS").data.toRequest();
    if (this.requestWaitingList.length > 0 && this.getData) {
      request = this.requestWaitingList.shift();
      this.getData = false;
    }
    this.log(`->`, request);

    // prepare the waiter for the response
    this.waitForData = new Promise((resolve, reject) => {
      this.waitForDataSuccess = resolve;
      this.waitForDataReject = reject;
    });

    // send and wait for the response
    this.httpCall(request).then(({
      body
    }) => {
      this.onData(body);
    }).catch(error => {
      console.log(error);
    });
    ;
    const data = await this.waitForData;
    this.log(`<-`, data);
    if (data.toLowerCase().startsWith(this.in.get("GET_PAN_TILT_ZOOM_FOCUS_IRIS").data.cmd.toLowerCase())) {
      this.in.get("GET_PAN_TILT_ZOOM_FOCUS_IRIS").data.values = data.substr(3);
      this.getData = true;
    }

    // it cannot be faster than 40 send per second
    await (0, _Tools.wait)(50);
    loop && this.isPolling && this.send();
  }
  onData(data) {
    setTimeout(() => this.waitForDataSuccess(data), 1);
  }
  onError(err) {
    this.stopPolling();
    this.log('Error : ', err);
    this.errorHandler(err);
    setTimeout(() => this.waitForDataReject(err), 1);
  }
}
exports.default = HTTPRoutine;
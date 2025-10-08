"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _RequestHolder = _interopRequireDefault(require("./RequestHolder.js"));
var _Tools = require("../common/Tools.js");
var _tools = require("./tools.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class HTTPRoutine extends _Tools.EventManager {
  constructor(conf) {
    super("HTTPRoutine", ["request", "connect", "ready"]);
    this.log = conf.log;
    this.out = new _RequestHolder.default(conf);
    this.in = new _RequestHolder.default(conf);
    this.isPolling = false;
    this.errorHandler = () => {};
    this.requestWaitingList = [];
  }
  async connect(host, port, callback = () => {}, error = () => {}) {
    this.host = host;
    this.port = port;
    this.errorHandler = error.bind(this);
    this.log("connect");
    try {
      const req = this.out.get("GET_PAN_TILT_ZOOM_FOCUS_IRIS").data.toRequest();
      const body = await (0, _tools.call)(`${this.host}:${this.port}`, req);
      this.log("<-", body);
      callback(body);
      this.startPolling();

      //this.requestWaitingList.push("OFT:0"); // disable ND filter
      //this.requestWaitingList.push("OSA:87:21"); // set 4K 24fps
      this.requestWaitingList.push("#D30"); // set IrisMode to manual
      this.requestWaitingList.push("#D10"); // set FocusMode to manual
    } catch (error) {
      this.onError(error);
    }
  }
  startPolling() {
    this.log("startPolling");
    this.isPolling = true;
    this.send();
  }
  stopPolling() {
    this.isPolling = false;
  }
  inject(request) {
    this.requestWaitingList.push(request);
  }
  addRequest(request) {
    // const id = this.requestWaitingList.findIndex(req => req.startsWith(`#${request.data.cmd}`));
    // if(id>=0){
    // 	this.requestWaitingList[id] = request.data.toRequest();
    // }
    // else{
    this.requestWaitingList.push(request.data.toRequest());
    // }
  }
  async send(loop = true) {
    let request = this.out.get("GET_PAN_TILT_ZOOM_FOCUS_IRIS").data.toRequest();
    let autoRqst = true;
    if (this.requestWaitingList.length > 0) {
      autoRqst = false;
      request = this.requestWaitingList.shift();
    }
    if (!autoRqst) {
      this.log(this.isPlayMode ? `~>` : `->`, request);
      this.isRecordMode && this.trigger("request", request);
    }
    const data = await (0, _tools.call)(`${this.host}:${this.port}`, request);
    if (autoRqst) {
      this.in.get("GET_PAN_TILT_ZOOM_FOCUS_IRIS").data.values = data.substr(3);
    } else {
      this.log(`<-`, data);
    }

    // it cannot be faster than 40 send per second
    await (0, _Tools.wait)(50);
    loop && this.isPolling && this.send();
  }
  onError(err) {
    this.stopPolling();
    this.log('Error : ', err);
    this.errorHandler(err);
  }
}
exports.default = HTTPRoutine;
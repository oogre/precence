"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _enum = _interopRequireDefault(require("enum"));
var _HTTPRoutine = _interopRequireDefault(require("./HTTPRoutine.js"));
var _Math = require("../common/Math.js");
var _Tools = require("../common/Tools.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
//converter takes value [0->1] and turn it to [0/8 1/8 2/8 3/8 4/8 5/8 6/8 7/8 8/8]		
const converter = value => Math.round(value * 8) / 8;
class PTZController extends _HTTPRoutine.default {
  static CameraStatus = new _enum.default(['NOT_CONNECTED', 'RUNNING', 'ERROR']);
  constructor(conf) {
    super(conf.log ? (...data) => console.log(`CAMERA ${conf.name} : `, ...data) : undefined);
    this.conf = conf;
    this.conf.status = PTZController.CameraStatus.NOT_CONNECTED;
  }
  isError() {
    return this.conf.status == PTZController.CameraStatus.ERROR;
  }
  isConnected() {
    return this.conf.status == PTZController.CameraStatus.CONNECTED;
  }
  connect() {
    super.connect(this.conf.host, this.conf.port, () => {
      this.conf.status = PTZController.CameraStatus.CONNECTED;
    }, error => {
      this.conf.status = PTZController.CameraStatus.ERROR;
    });
  }
  async reset() {
    // REANIMATOR ANIMATION
    // for(let i = 0 ; i < 5 ; i ++){
    // 	this.out.get("RESET").data.params.pan.value = lerp(0.3, 0.7, Math.random());
    // 	//this.out.get("RESET").data.params.tilt.value = 0.5;
    // 	this.addRequest(this.out.get("RESET"));
    // 	await wait(500);
    // }
    // await wait(500);
    this.out.get("RESET").data.params.pan.value = 0.5;
    this.out.get("RESET").data.params.tilt.value = 0.5;
    this.addRequest(this.out.get("RESET"));
  }
  setPanTiltSpeed(pan, tilt) {
    const oPan = this.out.get("PAN_TILT").data.params.pan.value;
    const oTilt = this.out.get("PAN_TILT").data.params.tilt.value;
    this.out.get("PAN_TILT").data.params.pan.amp = (0, _Math.lerp)(0.7, 0.1, this.in.get("GET_PAN_TILT_ZOOM_FOCUS_IRIS").data.params.zoom._value);
    this.out.get("PAN_TILT").data.params.tilt.amp = (0, _Math.lerp)(0.7, 0.1, this.in.get("GET_PAN_TILT_ZOOM_FOCUS_IRIS").data.params.zoom._value);
    const nPan = converter(pan);
    const nTilt = converter(tilt);
    if (oPan != nPan || oTilt != nTilt) {
      this.out.get("PAN_TILT").data.params.pan.value = nPan;
      this.out.get("PAN_TILT").data.params.tilt.value = nTilt;
      this.addRequest(this.out.get("PAN_TILT"));
    }
  }
  setIris(value) {
    const oValue = this.out.get("IRIS").data.params.iris.value;
    const nValue = (0, _Math.clamp)(oValue + value, 0, 1);
    this.out.get("IRIS").data.params.iris.value = nValue;
    this.addRequest(this.out.get("IRIS"));
  }
  setZoom(value) {
    const oValue = this.out.get("ZOOM").data.params.zoom.value;
    const nValue = converter(value);
    if (oValue != nValue) {
      this.out.get("ZOOM").data.params.zoom.value = nValue;
      this.addRequest(this.out.get("ZOOM"));
    }
  }
  setFocus(value) {
    const oValue = this.out.get("FOCUS").data.params.focus.value;
    const nValue = converter(value);
    if (oValue != nValue) {
      this.out.get("FOCUS").data.params.focus.value = nValue;
      this.addRequest(this.out.get("FOCUS"));
    }
  }
  get pan() {
    return this.out.get("PAN_TILT").data.params.pan.value;
  }
  get tilt() {
    return this.out.get("PAN_TILT").data.params.tilt.value;
  }
  close() {
    this.stopPolling();
    this.conf.status = PTZController.CameraStatus.NOT_CONNECTED;
  }
}
exports.default = PTZController;
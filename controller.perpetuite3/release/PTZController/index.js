"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _enum = _interopRequireDefault(require("enum"));
var _got = _interopRequireDefault(require("got"));
var _Param = _interopRequireDefault(require("./Param.js"));
var _Control = _interopRequireDefault(require("./Control.js"));
var _config = _interopRequireDefault(require("../config.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const Controls = {
  PanTiltSpeed: new _Control.default("PTS", new _Param.default("pan", 3, 97), new _Param.default("tilt", 3, 97)).setter(),
  Zoom: new _Control.default("Z", new _Param.default("zoom", 1, 99)).setter(),
  Focus: new _Control.default("F", new _Param.default("focus", 0X555, 0XFFF, 16, 3)).setter(),
  Iris: new _Control.default("I", new _Param.default("iris", 1, 99)).setter(),
  GetPanTiltZoomFocusIris: new _Control.default("PTD", new _Param.default("pan", 0x0000, 0xFFFF, 16, 4), new _Param.default("tilt", 0x0000, 0xFFFF, 16, 4), new _Param.default("zoom", 0x000, 0x3E7, 16, 3), new _Param.default("focus", 0x00, 0x63, 16, 2), new _Param.default("iris", 0x00, 0xFF, 16, 2)).getter(),
  GetGainColorTemperatureShutterND: new _Control.default("PTG").getter()
};
class PTZController {
  static CameraStatus = new _enum.default(['NOT_CONNECTED', 'RUNNING', 'ERROR']);
  constructor(conf) {
    this.conf = conf;
    this.conf.status = PTZController.CameraStatus.NOT_CONNECTED;
    const axesNames = this.conf.axes.map(({
      name
    }) => name);
    this.axesNameToId = Object.fromEntries(Object.entries(axesNames).map(([k, v]) => [v, parseInt(k)]));
  }
  connect() {
    this.conf.status = PTZController.CameraStatus.RUNNING;
    this.connection = setInterval(() => {
      this.getPanTiltZoomFocusIris();
    }, 100);
  }
  async close() {
    clearInterval(this.connection);
  }
  call(data) {
    //console.log(`->`, `http://${this.conf.host}:${this.conf.port}/cgi-bin/aw_ptz?cmd=#${data.toRequest()}`);
    return (0, _got.default)(`http://${this.conf.host}:${this.conf.port}/cgi-bin/aw_ptz`, {
      method: 'GET',
      searchParams: {
        cmd: `#${data.toRequest()}`,
        res: 1
      },
      timeout: {
        lookup: 100,
        connect: 50,
        socket: 1000,
        send: 1000,
        response: 1000
      }
    }).then(({
      body
    }) => {
      //console.log("<-", body);
      return body;
    }).catch(error => {
      console.log("x-", error.code);
    });
  }
  send(controls) {
    if (this.conf.status != PTZController.CameraStatus.RUNNING) {
      return;
    }
    if (Object.values(controls.params).every(param => !param.hasToUpdate())) {
      return;
    }
    return this.call(controls).then(data => {
      if (!data) return;
      return data;
    });
  }
  setPanTiltSpeed(pan, tilt) {
    //converter takes value [-1->1] and turn it to [0/8 1/8 2/8 3/8 4/8 5/8 6/8 7/8 8/8]
    const converter = value => Math.round((value * 0.5 + 0.5) * 8) / 8;
    const pPan = Controls.PanTiltSpeed.params.pan;
    const pTilt = Controls.PanTiltSpeed.params.tilt;
    pPan.value = converter(pan);
    pTilt.value = converter(tilt);
    this.send(Controls.PanTiltSpeed);
  }
  get pan() {
    return Controls.PanTiltSpeed.params.pan.value * 2 - 1;
  }
  get tilt() {
    return Controls.PanTiltSpeed.params.tilt.value * 2 - 1;
  }
  setZoom(zoom) {
    Controls.Zoom.params.zoom.value = zoom;
    this.send(Controls.Zoom);
  }
  setFocus(focus) {
    Controls.Focus.params.focus.value = focus;
    this.send(Controls.Focus);
  }
  setIris(iris) {
    Controls.Iris.params.iris.value = iris;
    this.send(Controls.Iris);
  }
  getPanTiltZoomFocusIris() {
    this.send(Controls.GetPanTiltZoomFocusIris).then(data => {
      if (data) {
        Controls.GetPanTiltZoomFocusIris.values = data.substr(3);
        this.conf.axes[this.axesNameToId.Pan].position = Controls.GetPanTiltZoomFocusIris.params.pan.value;
        this.conf.axes[this.axesNameToId.Tilt].position = Controls.GetPanTiltZoomFocusIris.params.tilt.value;
        this.conf.axes[this.axesNameToId.Zoom].position = Controls.GetPanTiltZoomFocusIris.params.zoom.value;
        this.conf.axes[this.axesNameToId.Iris].position = Controls.GetPanTiltZoomFocusIris.params.iris.value;
        this.conf.axes[this.axesNameToId.Focus].position = Controls.GetPanTiltZoomFocusIris.params.focus.value;
      }
    });
  }
}

// const cam = new PTZController(config.camera_simulation)
// cam.getPanTiltZoomFocusIris();
exports.default = PTZController;
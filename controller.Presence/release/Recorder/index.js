"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _enum = _interopRequireDefault(require("enum"));
var _nodeFs = _interopRequireDefault(require("node:fs"));
var _nodeProcess = require("node:process");
var _precisionTimeoutInterval = require("precision-timeout-interval");
var _canvas = require("@napi-rs/canvas");
var _Math = require("../common/Math.js");
var _nodeFileDialog = _interopRequireDefault(require("node-file-dialog"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class Recorder {
  static RecorderStatus = new _enum.default(['STOP', 'PAUSE', "RECORDING"]);
  constructor(conf) {
    this.conf = conf;
    this.status = Recorder.RecorderStatus.STOP;
    this.log = (...data) => console.log(`RECORDER : `, ...data);
    this.startRecordAt = _nodeProcess.hrtime.bigint();
    this.cursorAt = 0;
    this.loop = null;
    this._channels = [];
    this.DURATION_NORMALIZER = 0.001 / this.conf.duration;
  }
  set channels(channels) {
    this._channels = channels.map(({
      name,
      data = [],
      record = false
    }) => {
      const canvas = (0, _canvas.createCanvas)(this.conf.duration, 16);
      const ctx = canvas.getContext('2d');
      data.map(({
        t,
        v
      }) => {
        ctx.save();
        console.log(canvas.width * t * this.DURATION_NORMALIZER * 0.000001);
        ctx.translate(canvas.width * t * this.DURATION_NORMALIZER * 0.000001, 0);
        ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
        ctx.beginPath(); // Start a new path
        ctx.moveTo(0, 0); // Move the pen to (30, 50)
        ctx.lineTo(0, canvas.height * v); // Draw a line to (150, 100)
        ctx.stroke(); // Render the path
        ctx.restore();
      });
      return {
        name,
        canvas,
        ctx: canvas.getContext('2d'),
        data,
        record
      };
    });
  }
  get channels() {
    return this._channels;
  }
  start() {
    if (this.status == Recorder.RecorderStatus.RECORDING) {
      return;
    }
    this.startRecordAt = _nodeProcess.hrtime.bigint();
    this.status = Recorder.RecorderStatus.RECORDING;
    //this.workingOn = this._channels.filter(({record})=>).map(chan=>{

    //});

    this.loop = (0, _precisionTimeoutInterval.prcInterval)(50, () => {
      this.cursorAt = Number(_nodeProcess.hrtime.bigint() - this.startRecordAt);
      //const index = this.workingOn.findIndex(({t})=> t < this.cursorAt);
      //if(index == -1){
      //	return
      //}
      //this.workingOn.splice(0, 1+index);
    });
  }
  stop(name = "*") {
    console.log("stop");
    if (this.status != Recorder.RecorderStatus.RECORDING) {
      return;
    }
    this.status = Recorder.RecorderStatus.STOP;
    this.loop.cancel();
    (0, _nodeFileDialog.default)({
      type: 'save-file'
    }).then(([dir]) => {
      _nodeFs.default.writeFile(dir, JSON.stringify(this._channels.map(({
        name,
        data,
        record
      }) => {
        return {
          name,
          data,
          record
        };
      })), () => {});
    }).catch(err => console.log(err));
  }
  isRecording() {
    return this.status == Recorder.RecorderStatus.RECORDING;
  }
  rec({
    name,
    value
  }) {
    if (this.status != Recorder.RecorderStatus.RECORDING) return;
    const chan = this._channels.find(({
      record,
      name: n
    }) => record && n == name);
    if (!chan) return;
    const time = Number(_nodeProcess.hrtime.bigint() - this.startRecordAt);
    chan.data.push({
      t: time,
      v: value
    });
    chan.ctx.save();
    chan.ctx.translate(chan.canvas.width * time * this.DURATION_NORMALIZER * 0.000001, 0);
    chan.ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
    chan.ctx.beginPath(); // Start a new path
    chan.ctx.moveTo(0, 0); // Move the pen to (30, 50)
    chan.ctx.lineTo(0, chan.canvas.height * value); // Draw a line to (150, 100)
    chan.ctx.stroke(); // Render the path
    chan.ctx.restore();
  }
  currentTimeNormalized() {
    return this.cursorAt * this.DURATION_NORMALIZER * 0.000001;
  }
  async close() {
    return new Promise(resolve => {
      const file = JSON.stringify(this.data);
      _nodeFs.default.writeFile(this.conf.recFile, file, () => {
        resolve();
      });
    });
  }
}
exports.default = Recorder;
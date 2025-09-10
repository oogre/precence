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
var _Tools = require("../common/Tools.js");
var _nodeFileDialog = _interopRequireDefault(require("node-file-dialog"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class Recorder extends _Tools.EventManager {
  static RecorderStatus = new _enum.default(['STOP', 'PAUSE', "RECORDING"]);
  constructor(conf) {
    super("Recorder", ["play", "lastFrame"]);
    this.log = conf.log;
    this.conf = conf;
    this.status = Recorder.RecorderStatus.STOP;
    this.startRecordAt = _nodeProcess.hrtime.bigint();
    this.cursorAt = 0;
    this.loop = null;
    this._channels = [];
    this.hasToSaveRecord = false;
    this.DURATION_NORMALIZER = 0.001 / this.conf.duration;
  }
  set channels(channels) {
    this._channels = channels.map(({
      target,
      zero,
      name,
      data = [],
      record = false,
      play = false
    }, id) => {
      const canvas = (0, _canvas.createCanvas)(this.conf.duration, 16);
      const ctx = canvas.getContext('2d');
      data.map(({
        t,
        v
      }) => {
        ctx.save();
        ctx.translate(canvas.width * t * this.DURATION_NORMALIZER * 0.000001, 0);
        ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
        ctx.beginPath(); // Start a new path
        ctx.moveTo(0, 0); // Move the pen to (30, 50)
        ctx.lineTo(0, canvas.height); // Draw a line to (150, 100)
        ctx.stroke(); // Render the path
        ctx.restore();
      });
      target.zero = zero;
      return {
        id,
        target,
        name,
        canvas,
        ctx: canvas.getContext('2d'),
        data,
        record,
        play
      };
    });
  }
  get channels() {
    return this._channels;
  }
  isRecordingMode() {
    return this.channels.map(({
      record
    }) => record).some(t => t);
  }
  start() {
    this.hasToSaveRecord = false;
    this.workingOn = this._channels.map(({
      name,
      data
    }) => {
      return data.map(({
        t,
        v
      }) => {
        return {
          c: this._channels[this._channels.findIndex(({
            name: n
          }) => n == name)].name,
          t,
          v
        };
      });
    }).flat().sort(({
      t: a
    }, {
      t: b
    }) => a - b);
    this.startRecordAt = _nodeProcess.hrtime.bigint();
    this.play();
  }
  play() {
    this.startRecordAt = _nodeProcess.hrtime.bigint() - BigInt(this.cursorAt);
    this.loop && this.loop.cancel();
    this.loop = (0, _precisionTimeoutInterval.prcIntervalWithDelta)(50, async delta => {
      this.log(delta);
      this.cursorAt = Number(_nodeProcess.hrtime.bigint() - this.startRecordAt);
      if (this.currentTimeNormalized() >= 1) {
        this.trigger("lastFrame");
        return;
      }
      const index = this.workingOn.findLastIndex(({
        t
      }) => t + 50000000 < this.cursorAt);
      if (index == -1) {
        return;
      }
      const toDoList = this.workingOn.splice(0, 1 + index).filter(({
        c
      }) => !this._channels.find(({
        name
      }) => name == c).record);
      let t = 0;
      for (const item of toDoList) {
        this.cursorAt = Number(_nodeProcess.hrtime.bigint() - this.startRecordAt);
        const dT = (this.cursorAt - item.t) * 0.000001;
        // this.log(dT);
        if (dT >= 4) {
          await (0, _Tools.pWait)(dT);
        }
        this.trigger("play", item);
      }
    });
  }
  pause() {
    this.loop && this.loop.cancel();
  }
  async stop() {
    this.pause();
    this.cursorAt = 0;
    if (!this.hasToSaveRecord) return;
    return new Promise(resolve => {
      (0, _nodeFileDialog.default)({
        type: 'save-file'
      }).then(([dir]) => {
        _nodeFs.default.writeFile(dir, JSON.stringify(this._channels.map(({
          name,
          target: {
            zero
          },
          data
        }) => {
          return {
            name,
            zero,
            data
          };
        })), () => {
          resolve();
        });
      }).catch(err => {
        console.log(err);
        resolve();
      });
    });
  }
  rec({
    name,
    value
  }) {
    const chan = this._channels.find(({
      record,
      name: n
    }) => record && n == name);
    if (!chan) return;
    chan.data.push({
      c: chan.id,
      t: Number(_nodeProcess.hrtime.bigint() - this.startRecordAt),
      v: value
    });
    const time = chan.data[chan.data.length - 1].t;
    this.hasToSaveRecord = true;
    setTimeout(() => {
      chan.ctx.save();
      chan.ctx.translate(chan.canvas.width * time * this.DURATION_NORMALIZER * 0.000001, 0);
      chan.ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
      chan.ctx.beginPath(); // Start a new path
      chan.ctx.moveTo(0, 0); // Move the pen to (30, 50)
      chan.ctx.lineTo(0, chan.canvas.height); // Draw a line to (150, 100)
      chan.ctx.stroke(); // Render the path
      chan.ctx.restore();
    }, 1);
  }
  currentTimeNormalized() {
    return this.cursorAt * this.DURATION_NORMALIZER * 0.000001;
  }
  async close() {
    return new Promise(resolve => {
      resolve();
    });
  }
}
exports.default = Recorder;
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Recorder = void 0;
var _Tools = require("../common/Tools.js");
var _Constants = require("../common/Constants.js");
var _canvas = require("@napi-rs/canvas");
var _nodeProcess = require("node:process");
var _nodeFileDialog = _interopRequireDefault(require("node-file-dialog"));
var _nodeFs = _interopRequireDefault(require("node:fs"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class Recorder extends _Tools.EventManager {
  constructor(...param) {
    super(...param);
    this._channels = [];
    this.workingOn = [];
    this.hasNewRecord = false;
  }
  get channels() {
    return this._channels;
  }
  get isRecordMode() {
    return this.channels.map(({
      target: {
        isRecordMode
      }
    }) => isRecordMode).some(t => t);
  }
  get isNoneMode() {
    return this.channels.map(({
      target: {
        isNoneMode
      }
    }) => isNoneMode).every(t => t);
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
      const draw = ({
        t
      }) => {
        ctx.save();
        ctx.translate(canvas.width * t * this.DURATION_NORMALIZER * _Constants.NANO_TO_MILLIS, 0);
        ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
        ctx.beginPath(); // Start a new path
        ctx.moveTo(0, 0); // Move the pen to (30, 50)
        ctx.lineTo(0, canvas.height); // Draw a line to (150, 100)
        ctx.stroke(); // Render the path
        ctx.restore();
      };
      data.map(draw);
      target.zero = zero;
      return {
        id,
        target,
        name,
        canvas,
        draw,
        data
      };
    });
  }
  async start() {
    this.hasNewRecord = false;
    this.workingOn = this._channels.map(({
      data
    }) => data).flat().filter(({
      t
    }) => t > this.cursorAt) /* <= LAST ADD  */.sort(({
      t: a
    }, {
      t: b
    }) => a - b);
  }
  async stop() {
    if (!this.hasNewRecord) return;
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
        this.log(err);
        resolve();
      });
    });
  }
  async loop() {
    const index = this.workingOn.findLastIndex(({
      t
    }) => t + this.loopDelay * _Constants.MILLIS_TO_NANO < this.cursorAt);
    if (index == -1) {
      return;
    }
    // this.workingOn.forEach((e, k)=>{
    // 	this.log(e, k == index ? ' < ' : '')
    // });

    const toDoList = this.workingOn.splice(0, 1 + index).filter(({
      c
    }) => {
      return this._channels[c].target.isPlayMode;
    });
    toDoList.forEach(async item => {
      do {
        this.updateCursor();
      } while (this.cursorAt < item.t);
      // const dT = Math.floor((this.cursorAt - item.t) * NANO_TO_MILLIS);
      // this.log(dT);
      this.trigger("trig", item);
    });
  }
  rec(id, value) {
    const chan = this._channels[id];
    if (!chan.target.isRecordMode) return;
    chan.data.push({
      c: chan.id,
      t: Number(_nodeProcess.hrtime.bigint() - this.startRecordAt),
      v: value
    });
    const time = chan.data[chan.data.length - 1].t;
    this.hasNewRecord = true;
    chan.draw({
      t: time
    });
  }
}
exports.Recorder = Recorder;
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _enum = _interopRequireDefault(require("enum"));
var _nodeFs = _interopRequireDefault(require("node:fs"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const filePath = './data/record.json';
class Recorder {
  static RecorderStatus = new _enum.default(['STOP', 'PAUSE', 'PLAYING', "RECORDING"]);
  constructor() {
    this.status = Recorder.RecorderStatus.STOP;
    this.log = (...data) => console.log(`RECORDER : `, ...data);
    this.startRecordAt = -1;
    this.data = JSON.parse(_nodeFs.default.readFileSync(filePath, "utf8"));
    this.lastRecordAt = this.data[this.data.length - 1].t;
  }
  startRecord(name = "*") {
    this.startRecordAt = new Date().getTime();
    this.status = Recorder.RecorderStatus.RECORDING;
  }
  stopRecord(name = "*") {
    this.startRecordAt = -1;
    this.status = Recorder.RecorderStatus.STOP;
    JSON.stringify(this.data).length();
  }
  isPlaying() {
    return this.status == Recorder.RecorderStatus.PLAYING;
  }
  isRecording() {
    return this.status == Recorder.RecorderStatus.RECORDING;
  }
  update({
    id,
    time,
    value
  }) {
    if (this.status != Recorder.RecorderStatus.RECORDING) {
      return;
    }
    time -= this.startRecordAt;
    this.data.push({
      t: time,
      n: id,
      v: value.toFixed(4)
    });
  }
  async close() {
    return new Promise(resolve => {
      const file = JSON.stringify(this.data);
      _nodeFs.default.writeFile(filePath, file, () => {
        resolve();
      });
    });
  }
}
exports.default = Recorder;
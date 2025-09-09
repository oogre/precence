"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _obsWebsocketJs = require("obs-websocket-js");
var _enum = _interopRequireDefault(require("enum"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class OBS {
  static OBSStatus = new _enum.default(['NOT_CONNECTED', 'CONNECTED', 'OBS_WEBSOCKET_OUTPUT_PAUSED', 'OBS_WEBSOCKET_OUTPUT_RESUMED', 'OBS_WEBSOCKET_OUTPUT_STOPPED', 'OBS_WEBSOCKET_OUTPUT_STARTED']);
  constructor(conf) {
    this.log = conf.log;
    this.conf = conf;
    this.obsController = new _obsWebsocketJs.OBSWebSocket();
    this.obsController.connect(`ws://${conf.host}:${conf.port}`).then((...data) => {
      this.status = OBS.OBSStatus.CONNECTED;
      this.obsController.call("GetRecordStatus").then(async ({
        outputPaused,
        outputActive
      }) => {
        if (outputPaused) {
          await this.obsController.call('ToggleRecordPause');
        }
        if (outputActive) {
          await this.obsController.call('StopRecord');
        }
        this.status = OBS.OBSStatus.OBS_WEBSOCKET_OUTPUT_STOPPED;
      });
    });
    this.waiting = {
      for: "",
      action: () => {}
    };
    this.handlers = {
      NOT_CONNECTED: [],
      CONNECTED: [],
      OBS_WEBSOCKET_OUTPUT_PAUSED: [],
      OBS_WEBSOCKET_OUTPUT_RESUMED: [],
      OBS_WEBSOCKET_OUTPUT_STOPPED: [],
      OBS_WEBSOCKET_OUTPUT_STARTED: []
    };
    this.flag = true;
    this.obsController.on('RecordStateChanged', ({
      outputState
    }) => {
      this.status = OBS.OBSStatus[outputState] || this.conf.status;
    });
    this.status = OBS.OBSStatus.NOT_CONNECTED;
  }
  on(description, callback) {
    if (!Object.keys(this.handlers).includes(description)) throw new Error(`onObs wait for OBS.EVENT_DESC as first parameter. You give "${description}".`);
    if (typeof callback !== 'function') throw new Error(`onObs wait for function as second parameter. You give "${typeof callback}".`);
    this.handlers[description].push(callback);
    return this;
  }
  trigger(eventDesc, event) {
    [...this.handlers[eventDesc] /*, ...this.handlers["*"]*/].forEach(handler => {
      handler(event);
    });
  }
  set status(value) {
    this.log("set status :", value.key);
    this.conf.status = value;
    if (this.waiting.for == value.key) {
      this.waiting.action && this.waiting.action();
      this.trigger(value.key);
    }
  }
  get status() {
    return this.conf.status;
  }
  async stopRecord() {
    return new Promise(async resolve => {
      if (this.status == OBS.OBSStatus.OBS_WEBSOCKET_OUTPUT_PAUSED) {
        await new Promise(async r => {
          this.waiting.for = "OBS_WEBSOCKET_OUTPUT_RESUMED";
          this.waiting.action = r;
          await this.obsController.call('ToggleRecordPause');
        });
      }
      if (this.status != OBS.OBSStatus.OBS_WEBSOCKET_OUTPUT_STOPED) {
        this.waiting.for = "OBS_WEBSOCKET_OUTPUT_STOPPED";
        this.waiting.action = resolve;
        await this.obsController.call('StopRecord');
      } else {
        resolve();
      }
    });
  }
  async startRecord() {
    return new Promise(async resolve => {
      if (this.status == OBS.OBSStatus.OBS_WEBSOCKET_OUTPUT_PAUSED) {
        await new Promise(async r => {
          this.waiting.for = "OBS_WEBSOCKET_OUTPUT_RESUMED";
          this.waiting.action = r;
          await this.obsController.call('ToggleRecordPause');
        });
      }
      if (!(this.status == OBS.OBSStatus.OBS_WEBSOCKET_OUTPUT_STARTED || this.status == OBS.OBSStatus.OBS_WEBSOCKET_OUTPUT_RESUMED)) {
        this.waiting.for = "OBS_WEBSOCKET_OUTPUT_STARTED";
        this.waiting.action = resolve;
        await this.obsController.call('StartRecord');
      } else {
        resolve();
      }
    });
  }
  async playRecord() {
    return new Promise(async resolve => {
      if (this.status == OBS.OBSStatus.OBS_WEBSOCKET_OUTPUT_PAUSED) {
        this.waiting.for = "OBS_WEBSOCKET_OUTPUT_RESUMED";
        this.waiting.action = resolve;
        await this.obsController.call('ToggleRecordPause');
      } else {
        resolve();
      }
    });
  }
  async pauseRecord() {
    return new Promise(async resolve => {
      if (this.status == OBS.OBSStatus.OBS_WEBSOCKET_OUTPUT_STARTED || this.status == OBS.OBSStatus.OBS_WEBSOCKET_OUTPUT_RESUMED) {
        this.waiting.for = "OBS_WEBSOCKET_OUTPUT_PAUSED";
        this.waiting.action = resolve;
        await this.obsController.call('ToggleRecordPause');
      } else {
        resolve();
      }
    });
  }
  async changeScene(name) {
    await this.obsController.call('SetCurrentProgramScene', {
      sceneName: name
    });
  }
}
exports.default = OBS;
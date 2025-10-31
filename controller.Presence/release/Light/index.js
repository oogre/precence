"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _enum = _interopRequireDefault(require("enum"));
var _Tools = require("../common/Tools.js");
var _nodeOsc = require("node-osc");
var _MidiTools = require("./Midi/MidiTools.js");
var _Constants = require("../common/Constants.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const knobs = [{
  name: "pos",
  value: 64
}, {
  name: "amp",
  value: 27
}, {
  name: "min",
  value: 1
}, {
  name: "max",
  value: 127
}, {
  name: "1",
  value: 0
}, {
  name: "2",
  value: 0
}, {
  name: "3",
  value: 0
}, {
  name: "4",
  value: 0
}, {
  name: "5",
  value: 0
}, {
  name: "6",
  value: 0
}, {
  name: "7",
  value: 0
}, {
  name: "8",
  value: 0
}, {
  name: "9",
  value: 0
}, {
  name: "10",
  value: 0
}, {
  name: "11",
  value: 0
}, {
  name: "12",
  value: 0
}];
class LightController extends _Tools.EventManager {
  static LightStatus = new _enum.default(['NOT_CONNECTED', "CONNECTING", "CONNECTED", 'ERROR']);
  static ChannelStatus = _Constants.ChannelStatus;
  constructor(conf) {
    super("LightController", ["request", "connect", "ready"]);
    this.conf = conf;
    this.log = conf.log;
    this.oscClient = new _nodeOsc.Client(conf.host, conf.port);
    this.conf.status = LightController.LightStatus.CONNECTED;
    this._mode = LightController.ChannelStatus.NONE;
    this._zero = 0;
    try {
      this.displayInterface = (0, _MidiTools.connectOutput)(conf.name);
      this.midiInterface = (0, _MidiTools.connectInput)(conf.name);
      this.midiInterface.onCC(async (channel, number, value, deltaTime) => {
        if (!knobs[number]) {
          return;
        }
        knobs[number].value += value - 64;
        knobs[number].value = Math.min(128, Math.max(0, knobs[number].value));
        (0, _MidiTools.sendCC)(this.displayInterface, 0, number, knobs[number].value);
        await this.inject({
          name: `/${knobs[number].name}`,
          value: knobs[number].value
        });
        this.isRecordMode && this.trigger("request", {
          name: `/${knobs[number].name}`,
          value: knobs[number].value
        });
      });
    } catch (error) {
      this.log(error);
    }
  }
  get zero() {
    return this._zero;
  }
  set zero(value) {
    this._zero = value;
  }
  async reset() {
    if (!this.isConnected) return;
    await this.inject({
      name: "/pos",
      value: this._zero.pos
    });
    await this.inject({
      name: "/amp",
      value: this._zero.amp
    });
    await this.inject({
      name: "/min",
      value: this._zero.min
    });
    await this.inject({
      name: "/max",
      value: this._zero.max
    });
    await this.inject({
      name: "/1",
      value: this._zero["1"]
    });
  }
  inject({
    name,
    value
  }) {
    return new Promise(resolve => {
      this.oscClient.send(name, value, err => {
        if (err) console.error(err);
        resolve();
      });
    });
  }
  nextMode() {
    this._mode = (0, _Constants.nextChannel)(this._mode);
  }
  get mode() {
    return this._mode.value;
  }
  get isError() {
    return this.conf.status == LightController.LightStatus.ERROR;
  }
  get isConnected() {
    return this.conf.status == LightController.LightStatus.CONNECTED;
  }
  get isConnecting() {
    return this.conf.status == LightController.LightStatus.CONNECTING;
  }
  get isRecordMode() {
    return this._mode == LightController.ChannelStatus.RECORD;
  }
  get isPlayMode() {
    return this._mode == LightController.ChannelStatus.PLAY;
  }
  get isNoneMode() {
    return this._mode == LightController.ChannelStatus.NONE;
  }
}
exports.default = LightController;
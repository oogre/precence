"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _enum = _interopRequireDefault(require("enum"));
var _Tools = require("../common/Tools.js");
var _nodeOsc = require("node-osc");
var _MidiTools = require("./Midi/MidiTools.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const knobs = [{
  name: "pos",
  value: 0
}, {
  name: "amp",
  value: 0
}, {
  name: "min",
  value: 0
}, {
  name: "max",
  value: 0
}];
class LightController extends _Tools.EventManager {
  static LightStatus = new _enum.default(['NOT_CONNECTED', "CONNECTING", "CONNECTED", 'ERROR']);
  constructor(conf) {
    super("LightController", ["request", "connect", "ready"]);
    this.conf = conf;
    this.conf.status = LightController.LightStatus.NOT_CONNECTED;
    this.oscClient = new _nodeOsc.Client(conf.host, conf.port);
    this.displayInterface = (0, _MidiTools.connectOutput)(conf.name);
    this.midiInterface = (0, _MidiTools.connectInput)(conf.name);
    this.midiInterface.onCC((channel, number, value, deltaTime) => {
      if (!knobs[number]) {
        return;
      }
      knobs[number].value += value - 64;
      knobs[number].value = Math.min(128, Math.max(0, knobs[number].value));
      (0, _MidiTools.sendCC)(this.displayInterface, 0, number, knobs[number].value);
      this.oscClient.send(`/${knobs[number].name}`, knobs[number].value, err => {
        if (err) console.error(err);
      });
    });
  }
}
exports.default = LightController;
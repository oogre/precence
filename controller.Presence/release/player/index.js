"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _nodeOsc = require("node-osc");
class Player {
  constructor(conf) {
    this.conf = conf;
    this.log = conf.log;
    this.oscClient = new _nodeOsc.Client(conf.host, conf.port);
  }
  async play(videoName) {
    this.oscClient.send('/play', videoName, err => {
      if (err) console.error(err);
    });
  }
  async close() {
    return new Promise(r => {
      this.oscClient.send('/kill', "", err => {
        if (err) console.error(err);
        this.oscClient.close();
        r();
      });
    });
  }
}
exports.default = Player;
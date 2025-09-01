"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _obsWebsocketJs = require("obs-websocket-js");
var _enum = _interopRequireDefault(require("enum"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class OBS {
  static OBSStatus = new _enum.default(['NOT_CONNECTED', 'CONNECTED', 'REC']);
  constructor(conf) {
    this.log = conf.log ? (...data) => console.log(`OBS ${conf.name} : `, ...data) : undefined;
    this.conf = conf;
    this.conf.status = OBS.OBSStatus.NOT_CONNECTED;
    this.obsController = new _obsWebsocketJs.OBSWebSocket();
    this.obsController.connect(`ws://${conf.host}:${conf.port}`).then((...data) => {
      this.log(data);
      this.conf.status = OBS.OBSStatus.CONNECTED;
    });
    this.obsController.on('RecordStateChanged', ({
      outputActive,
      outputPath
    }) => {
      if (outputActive) {
        this.conf.status = OBS.OBSStatus.REC;
      } else {
        this.conf.status = OBS.OBSStatus.CONNECTED;
      }
    });
  }
  async toggleRecord() {
    if (this.conf.status == OBS.OBSStatus.CONNECTED) {
      await this.obsController.call('StartRecord');
    } else if (this.conf.status = OBS.OBSStatus.REC) {
      await this.obsController.call('StopRecord');
    }
  }
}
exports.default = OBS;
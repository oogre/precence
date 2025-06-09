#!/usr/local/bin/node
"use strict";

var _config = _interopRequireDefault(require("./config.js"));
var _FestoController = _interopRequireDefault(require("./FestoController"));
var _Math = require("./common/Math.js");
var _osc = _interopRequireDefault(require("osc"));
var _Tools = require("./common/Tools.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
process.title = _config.default.window.title;
const robot = new _FestoController.default(_config.default.robot);
class Controller {
  constructor() {
    this.interval;
  }
  goMin(speed) {
    robot.speed(speed);
  }
  goMax(speed) {
    robot.speed(speed);
  }
  connect() {
    robot.connect(() => {
      send("/connected", true);
      robot.onData(data => {
        send("/position", data.get("POSITION").getValue());
      });
    });
  }
}
let isString = value => typeof value === 'string';
let isFloat = value => Number(value) === value && value % 1 !== 0;
let isInt = value => Number(value) === value && value % 1 === 0;
let isBoolean = value => typeof value == "boolean";
// Open the socket.
const send = (address, ...args) => {
  udpPort.send({
    address: address,
    args: args.map(arg => {
      if (isString(arg)) {
        return {
          type: "s",
          value: arg
        };
      } else if (isFloat(arg)) {
        return {
          type: "f",
          value: arg
        };
      } else if (isInt(arg)) {
        return {
          type: "i",
          value: arg
        };
      } else if (isBoolean(arg)) {
        return {
          type: arg ? "T" : "F"
        };
      }
    }).filter(arg => !!arg)
  }, _config.default.osc.out.host, _config.default.osc.out.port);
};
const udpPort = new _osc.default.UDPPort({
  localAddress: _config.default.osc.in.host,
  localPort: _config.default.osc.in.port,
  metadata: true
});
let flora = new Controller();
udpPort.on("message", function (oscMsg, timeTag, info) {
  switch (oscMsg.address) {
    case "/speed":
      if (oscMsg.args.length > 0 && oscMsg.args[0].type == 'f') {
        robot.speed(oscMsg.args[0].value);
      }
      break;
    case "/go/min":
      if (oscMsg.args.length > 0 && oscMsg.args[0].type == 'f') {
        flora.goMin(oscMsg.args[0].value);
      }
      break;
    case "/go/max":
      if (oscMsg.args.length > 0 && oscMsg.args[0].type == 'f') {
        flora.goMax(oscMsg.args[0].value);
      }
      break;
    case "/connect":
      flora.connect();
      break;
    case "/test":
      send("/1", 1);
      send("/2", 1.1);
      send("/3", "bonjour");
      send("/4", true);
      send("/5", false);
      break;
  }
});
udpPort.open();
const terminate = async () => {
  await robot.close();
  process.exit();
};
process.on('SIGINT', terminate);
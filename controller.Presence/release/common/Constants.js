"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.nextChannel = exports.NANO_TO_MILLIS = exports.MILLIS_TO_NANO = exports.ChannelStatus = void 0;
var _enum = _interopRequireDefault(require("enum"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const NANO_TO_MILLIS = exports.NANO_TO_MILLIS = 0.000001;
const MILLIS_TO_NANO = exports.MILLIS_TO_NANO = 1000000;
const ChannelStatus = exports.ChannelStatus = new _enum.default({
  'NONE': 0,
  'PLAY': 1,
  'RECORD': 2
});
const nextChannel = channel => {
  return ChannelStatus.get((channel.value + 1) % ChannelStatus.enums.length);
};
exports.nextChannel = nextChannel;
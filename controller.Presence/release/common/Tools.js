"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.wait = exports.pWait = void 0;
var _precisionTimeoutInterval = require("precision-timeout-interval");
const wait = time => new Promise(r => setTimeout(() => r(), time));
exports.wait = wait;
const pWait = time => new Promise(r => (0, _precisionTimeoutInterval.prcTimeout)(time, () => r()));
exports.pWait = pWait;
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.wait = void 0;
const wait = time => new Promise(r => setTimeout(() => r(), time));
exports.wait = wait;
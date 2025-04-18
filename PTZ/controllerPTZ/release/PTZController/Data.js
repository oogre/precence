"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _Math = require("../common/Math.js");
String.prototype.nf = function (lenght, prepend = "0") {
  let output = this.valueOf();
  while (output.length < lenght) {
    output = prepend + output;
  }
  return output;
};
class Data {
  constructor(min, max, base = 10, len = 2) {
    this.min = min;
    this.max = max;
    this.base = base;
    this.len = len;
  }
  convert(value) {
    return Math.round((0, _Math.lerp)(this.max, this.min, value)).toString(this.base).nf(this.len);
  }
}
exports.default = Data;
;
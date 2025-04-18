"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _Math = require("../common/Math.js");
var _Validators = require("../common/Validators.js");
String.prototype.nf = function (lenght, prepend = "0") {
  let output = this.valueOf();
  while (output.length < lenght) {
    output = prepend + output;
  }
  return output;
};
class Param {
  constructor(name, min, max, base = 10, len = 2) {
    if (!(0, _Validators.isString)(name)) throw new Error(`Param class constructor wait for Sting as first paramater. You give "${name}".`);
    if (!(0, _Validators.isNumber)(min)) throw new Error(`Param class constructor wait for Number as second paramater. You give "${min}".`);
    if (!(0, _Validators.isNumber)(max)) throw new Error(`Param class constructor wait for Number as third paramater. You give "${max}".`);
    if (!(0, _Validators.isNumber)(base)) throw new Error(`Param class constructor wait for Number as fourth paramater. You give "${base}".`);
    if (!(0, _Validators.isNumber)(len)) throw new Error(`Param class constructor wait for Number as fifth paramater. You give "${len}".`);
    this.name = name;
    this.min = min;
    this.max = max;
    this.base = base;
    this.len = len;
    this._value = 0;
  }
  set value(v) {
    let tempValue = v;
    if ((0, _Validators.isString)(tempValue)) {
      tempValue = parseInt(tempValue, this.base);
      tempValue = (0, _Math.inverseLerp)(this.min, this.max, tempValue);
      tempValue = Math.min(1, Math.max(0, tempValue));
    }
    if (isNaN(tempValue)) throw new Error(`Param class convert wait for Number of "String form of Number" as paramater. You give "${v}".`);
    if (!(0, _Validators.isNumber)(tempValue)) throw new Error(`Param class convert wait for Number as paramater. You give "${v}".`);
    this._value = tempValue;
  }
  get value() {
    return this._value;
  }
  get stringValue() {
    return Math.round((0, _Math.lerp)(this.max, this.min, this._value)).toString(this.base).nf(this.len);
  }
}
exports.default = Param;
;
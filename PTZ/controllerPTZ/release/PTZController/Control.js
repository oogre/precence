"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _Param = _interopRequireDefault(require("./Param.js"));
var _Validators = require("../common/Validators.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class Control {
  constructor(cmd, ...params) {
    if (!(0, _Validators.isString)(cmd)) throw new Error(`Control class constructor wait for String as first paramater. You give "${name}".`);
    if (!params.every(param => param instanceof _Param.default)) throw new Error(`Control class constructor wait only Param instance second and after paramaters. You give "${params}".`);
    this.params = {};
    params.forEach(param => {
      this.params[param.name] = param;
    });
    this.cmd = cmd;
    this.changeHandlers = [];
  }
  toString(withParams = true) {
    return `${this.cmd}${withParams ? Object.values(this.params).map(({
      stringValue
    }) => stringValue).join("") : ""}`.toUpperCase();
  }
  onChange(handler) {
    if (typeof variable !== 'function') throw new Error(`Control class onChange wait for Function as first paramater. You give "${handler}".`);
    this.changeHandlers.push(handler);
  }
}
exports.default = Control;
;
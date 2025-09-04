"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _Param = _interopRequireDefault(require("./Param.js"));
var _Control = _interopRequireDefault(require("./Control.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class RequesHelper {
  constructor() {}
  get(_name) {
    this.dict = this.dict || {};
    if (!this.dict[_name]) {
      this.dict[_name] = this.controls.find(({
        name
      }) => name == _name);
    }
    return this.dict[_name];
  }
}
class RequestHolder extends RequesHelper {
  constructor() {
    super();
    this.controls = [{
      name: "PAN_TILT",
      data: new _Control.default("PTS", new _Param.default("pan", 3, 97), new _Param.default("tilt", 3, 97)).setter(),
      visible: true
    }, {
      name: "ZOOM",
      data: new _Control.default("Z", new _Param.default("zoom", 1, 99)).setter(),
      visible: true
    }, {
      name: "FOCUS",
      data: new _Control.default("F", new _Param.default("focus", 0X555, 0XFFF, 16, 3)).setter(),
      visible: true
    }, {
      name: "IRIS",
      data: new _Control.default("I", new _Param.default("iris", 1, 99)).setter(),
      visible: true
    }, {
      name: "GET_PAN_TILT_ZOOM_FOCUS_IRIS",
      data: new _Control.default("PTD", new _Param.default("pan", 0x0000, 0xFFFF, 16, 4), new _Param.default("tilt", 0x0000, 0xFFFF, 16, 4), new _Param.default("zoom", 0x000, 0x3E7, 16, 3), new _Param.default("focus", 0x00, 0x63, 16, 2), new _Param.default("iris", 0x00, 0xFF, 16, 2)).getter(),
      visible: true
    }, {
      name: "RESET",
      data: new _Control.default("APC", new _Param.default("pan", 0x0000, 0xFFFF, 16, 4), new _Param.default("tilt", 0x0000, 0xFFFF, 16, 4)).setter(),
      visible: false
    }];
  }
}
exports.default = RequestHolder;
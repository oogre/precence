"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EASYRequest = void 0;
var _http = _interopRequireDefault(require("http"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const DEBUG = false;
const EASYRequest = options => {
  if (DEBUG) return console.log(options);
  return new Promise((success, fail) => {
    let output = '';
    const req = _http.default.request(options, res => {
      res.setEncoding('utf8');
      res.on('data', chunk => {
        output += chunk;
      });
      res.on('end', () => {
        success(output, res.statusCode, res);
      });
    });
    req.on('error', error => {
      fail(error.statusCode, error);
    });
    req.end();
  });
};
exports.EASYRequest = EASYRequest;
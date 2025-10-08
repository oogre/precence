"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.httpCall = exports.call = void 0;
var _got = _interopRequireDefault(require("got"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const call = async (address, request, flag = 1) => {
  // prepare the waiter for the response
  let waitForDataSuccess;
  let waitForDataReject;
  const waitForData = new Promise((resolve, reject) => {
    waitForDataSuccess = resolve;
    waitForDataReject = reject;
  });

  // send and wait for the response
  httpCall(address, request, flag).then(({
    body
  }) => {
    waitForDataSuccess(body);
  }).catch(error => {
    waitForDataReject(error);
  });
  return await waitForData;
};
exports.call = call;
const httpCall = (address, request, flag) => {
  return (0, _got.default)(`http://${address}/cgi-bin/${flag ? `aw_ptz` : `aw_cam`}`, {
    method: 'GET',
    searchParams: {
      cmd: request,
      res: 1
    },
    timeout: {
      lookup: 100,
      connect: 1000,
      socket: 1000,
      send: 1000,
      response: 1000
    }
  });
};
exports.httpCall = httpCall;
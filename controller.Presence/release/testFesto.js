"use strict";

var _FestoController = _interopRequireDefault(require("./FestoController"));
var _Tools = require("./common/Tools.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
let xAxis;
process.title = "controller.festo";
process.on('SIGINT', async () => {
  xAxis.close();
  process.exit();
});
const main = async () => {
  xAxis = new _FestoController.default('169.254.80.39', 502);
  xAxis.startPolling();
  await loop();
};
const loop = async () => {
  xAxis.speed(1);
  await (0, _Tools.wait)(1000);
  xAxis.speed(0);
  await (0, _Tools.wait)(1000);
  xAxis.speed(-1);
  await (0, _Tools.wait)(1000);
  xAxis.speed(0);
  await (0, _Tools.wait)(1000);
  return loop();
};
main().then(() => {
  console.log('finish');
}).catch(error => {
  console.log("error", error);
});
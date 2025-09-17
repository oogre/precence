"use strict";

var _Tools = require("../common/Tools.js");
var _nodeProcess = require("node:process");
var _Constants = require("../common/Constants.js");
const time = async () => {
  let t0 = _nodeProcess.hrtime.bigint();
  for (let t of new Array(10).fill(0)) {
    await (0, _Tools.pWait)(100);
  }
  let t1 = _nodeProcess.hrtime.bigint();
  console.log(`time for 100 wait 10ms : ${Number(t1 - t0) * _Constants.NANO_TO_MILLIS}`);
};
time();
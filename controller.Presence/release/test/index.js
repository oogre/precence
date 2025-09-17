"use strict";

var _Tools = require("../common/Tools.js");
var _nodeProcess = require("node:process");
var _Constants = require("../common/Constants.js");
const time = async (wait, iteration) => {
  let t0 = _nodeProcess.hrtime.bigint();
  for (let t of new Array(iteration).fill(0)) {
    await wait(wait);
  }
  let t1 = _nodeProcess.hrtime.bigint();
  console.log(`duration of ${iteration} wait of ${wait}ms : ${Number(t1 - t0) * _Constants.NANO_TO_MILLIS}`);
};
time(10, 100);
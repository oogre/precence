"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.call = void 0;
const outHeader = Buffer.from([0x00, 0X00, 0X00, 0X00, 0X00, 0X13, 0X00, 0X17, 0X00, 0X00, 0X00, 0X04, 0X00, 0X00, 0X00, 0X04, 0X08]);
const call = async (client, request) => {
  let waitForDataSuccess;
  let waitForDataReject;
  const waitForData = new Promise((resolve, reject) => {
    waitForDataSuccess = resolve;
    waitForDataReject = reject;
  });
  client.once("data", data => {
    const d = Buffer.copyBytesFrom(data, 9, 8);
    if (d.length != 8) {
      waitForDataReject(d);
    } else {
      waitForDataSuccess(d);
    }
  });

  //increment values of 2 firsts bytes of header
  outHeader.writeUInt16BE((outHeader.readUInt16BE(0) + 1) % 0XFFFF);
  client.write(Buffer.concat([outHeader, request]));
  return await waitForData;
};
exports.call = call;
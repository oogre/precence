"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FHPP_OUT = exports.FHPP_IN = void 0;
var _nodeBuffer = require("node:buffer");
class FHPP {
  constructor(length) {
    this.data = _nodeBuffer.Buffer.alloc(length);
  }
  getByte(n) {
    return this.data.readUInt8(n);
  }
  setByte(byte, n) {
    this.data.writeUInt8(byte, n);
  }
  flipBitOfByte(byteId, bitId) {
    this.setByte(this.getByte(byteId) ^ 1 << bitId, byteId);
  }
  getBitOfByte(byteId, bitId) {
    return (this.getByte(byteId) & 1 << bitId) >> bitId;
  }
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
class FHPP_IN extends FHPP {
  constructor() {
    super(8);
    const self = this;
    this.controls = [{
      name: "FAULT",
      getValue() {
        return self.getBitOfByte(0, 3);
      },
      visible: true
    }, {
      name: "WARN",
      getValue() {
        return self.getBitOfByte(0, 2);
      },
      visible: true
    }, {
      name: "REF",
      getValue() {
        return self.getBitOfByte(1, 7);
      },
      visible: true
    }, {
      name: "SPEED",
      getValue() {
        return self.getByte(3);
      },
      visible: true
    }, {
      name: "POSITION",
      getValue() {
        return self.getByte(6) << 8 | self.getByte(7);
      },
      visible: true
    }];
  }
}
exports.FHPP_IN = FHPP_IN;
class FHPP_OUT extends FHPP {
  constructor() {
    super(8);
    const self = this;
    this.controls = [{
      name: "OPM2",
      getValue() {
        return self.getBitOfByte(0, 7);
      },
      toggle() {
        return self.flipBitOfByte(0, 7);
      },
      visible: false
    }, {
      name: "OPM1",
      getValue() {
        return self.getBitOfByte(0, 6);
      },
      toggle() {
        return self.flipBitOfByte(0, 6);
      },
      visible: false
    }, {
      name: "LOCK",
      getValue() {
        return self.getBitOfByte(0, 5);
      },
      toggle() {
        return self.flipBitOfByte(0, 5);
      },
      visible: false
    }, {
      name: "RESET",
      getValue() {
        return self.getBitOfByte(0, 3);
      },
      toggle() {
        return self.flipBitOfByte(0, 3);
      },
      visible: true
    }, {
      name: "BREAK",
      getValue() {
        return self.getBitOfByte(0, 2);
      },
      toggle() {
        return self.flipBitOfByte(0, 2);
      },
      visible: false
    }, {
      name: "STOP",
      getValue() {
        return self.getBitOfByte(0, 1);
      },
      toggle() {
        return self.flipBitOfByte(0, 1);
      },
      visible: true
    }, {
      name: "ENABLE",
      getValue() {
        return self.getBitOfByte(0, 0);
      },
      toggle() {
        return self.flipBitOfByte(0, 0);
      },
      visible: true
    }, {
      name: "CLEAR",
      getValue() {
        return self.getBitOfByte(1, 6);
      },
      toggle() {
        return self.flipBitOfByte(1, 6);
      },
      visible: false
    }, {
      name: "TEACH",
      getValue() {
        return self.getBitOfByte(1, 5);
      },
      toggle() {
        return self.flipBitOfByte(1, 5);
      },
      visible: false
    }, {
      name: "JOGN",
      getValue() {
        return self.getBitOfByte(1, 4);
      },
      toggle() {
        return self.flipBitOfByte(1, 4);
      },
      visible: false
    }, {
      name: "JOGP",
      getValue() {
        return self.getBitOfByte(1, 3);
      },
      toggle() {
        return self.flipBitOfByte(1, 3);
      },
      visible: false
    }, {
      name: "HOME",
      getValue() {
        return self.getBitOfByte(1, 2);
      },
      toggle() {
        return self.flipBitOfByte(1, 2);
      },
      visible: true
    }, {
      name: "START",
      getValue() {
        return self.getBitOfByte(1, 1);
      },
      toggle() {
        return self.flipBitOfByte(1, 1);
      },
      visible: true
    }, {
      name: "HALT",
      getValue() {
        return self.getBitOfByte(1, 0);
      },
      toggle() {
        return self.flipBitOfByte(1, 0);
      },
      visible: false
    }, {
      name: "SPEED",
      getValue() {
        return self.getByte(3);
      },
      setValue(value) {
        self.setByte(value, 3);
      },
      visible: false
    }, {
      name: "POSITION",
      getValue() {
        return self.getByte(4, 0) << 24 | self.getByte(5, 0) << 16 | self.getByte(6, 0) << 8 | self.getByte(7, 0);
      },
      setValue(value) {
        self.setByte((value & 0x000000FF) >> 0, 4);
        self.setByte((value & 0x0000FF00) >> 8, 5);
        self.setByte((value & 0x00FF0000) >> 16, 6);
        self.setByte((value & 0xFF000000) >> 24, 7);
      },
      visible: false
    }];
  }
}
exports.FHPP_OUT = FHPP_OUT;
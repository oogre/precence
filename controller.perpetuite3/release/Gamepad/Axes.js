"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Axes_IN = void 0;
class Axes {
  constructor(length) {
    this.data = new Array(length).fill(0);
  }
  getValue(n) {
    return this.data[n];
  }
  setValue(value, n) {
    this.data[n] = value;
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
class Axes_IN extends Axes {
  constructor() {
    super(19);
    const self = this;
    this.controls = [{
      name: "JOYSTICK_LEFT_HORIZONTAL",
      getValue() {
        return self.getValue(0);
      },
      setValue(value) {
        return self.setValue(value, 0);
      },
      visible: true
    }, {
      name: "JOYSTICK_LEFT_VERTICAL",
      getValue() {
        return self.getValue(1);
      },
      setValue(value) {
        return self.setValue(value, 1);
      },
      visible: true
    }, {
      name: "JOYSTICK_RIGHT_HORIZONTAL",
      getValue() {
        return self.getValue(2);
      },
      setValue(value) {
        return self.setValue(value, 2);
      },
      visible: true
    }, {
      name: "JOYSTICK_RIGHT_VERTICAL",
      getValue() {
        return self.getValue(3);
      },
      setValue(value) {
        return self.setValue(value, 3);
      },
      visible: true
    }, {
      name: "TRIGGER_LEFT",
      getValue() {
        return self.getValue(4);
      },
      setValue(value) {
        return self.setValue(value, 4);
      },
      visible: true
    }, {
      name: "TRIGGER_RIGHT",
      getValue() {
        return self.getValue(5);
      },
      setValue(value) {
        return self.setValue(value, 5);
      },
      visible: true
    }, {
      name: "BUTTON_A",
      getValue() {
        return self.getValue(6);
      },
      setValue(value) {
        return self.setValue(value, 6);
      },
      visible: true
    }, {
      name: "BUTTON_B",
      getValue() {
        return self.getValue(7);
      },
      setValue(value) {
        return self.setValue(value, 7);
      },
      visible: true
    }, {
      name: "BUTTON_X",
      getValue() {
        return self.getValue(8);
      },
      setValue(value) {
        return self.setValue(value, 8);
      },
      visible: true
    }, {
      name: "BUTTON_Y",
      getValue() {
        return self.getValue(9);
      },
      setValue(value) {
        return self.setValue(value, 9);
      },
      visible: true
    }, {
      name: "BUTTON_TRIGGER_LEFT",
      getValue() {
        return self.getValue(10);
      },
      setValue(value) {
        return self.setValue(value, 10);
      },
      visible: true
    }, {
      name: "BUTTON_TRIGGER_RIGHT",
      getValue() {
        return self.getValue(11);
      },
      setValue(value) {
        return self.setValue(value, 11);
      },
      visible: true
    }, {
      name: "BUTTON_HOME",
      getValue() {
        return self.getValue(12);
      },
      setValue(value) {
        return self.setValue(value, 12);
      },
      visible: true
    }, {
      name: "BUTTON_SELECT",
      getValue() {
        return self.getValue(13);
      },
      setValue(value) {
        return self.setValue(value, 13);
      },
      visible: true
    }, {
      name: "BUTTON_JOYSTICK_LEFT",
      getValue() {
        return self.getValue(14);
      },
      setValue(value) {
        return self.setValue(value, 14);
      },
      visible: true
    }, {
      name: "BUTTON_JOYSTICK_RIGHT",
      getValue() {
        return self.getValue(15);
      },
      setValue(value) {
        return self.setValue(value, 15);
      },
      visible: true
    }, {
      name: "CROSS_UP",
      getValue() {
        return self.getValue(16);
      },
      setValue(value) {
        return self.setValue(value, 16);
      },
      visible: true
    }, {
      name: "CROSS_LEFT",
      getValue() {
        return self.getValue(17);
      },
      setValue(value) {
        return self.setValue(value, 17);
      },
      visible: true
    }, {
      name: "CROSS_DOWN",
      getValue() {
        return self.getValue(18);
      },
      setValue(value) {
        return self.setValue(value, 18);
      },
      visible: true
    }, {
      name: "CROSS_RIGHT",
      getValue() {
        return self.getValue(19);
      },
      setValue(value) {
        return self.setValue(value, 19);
      },
      visible: true
    }];
  }
}
exports.Axes_IN = Axes_IN;
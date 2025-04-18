"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _sdl = _interopRequireDefault(require("@kmamal/sdl"));
var _Tools = require("../common/Tools.js");
var _enum = _interopRequireDefault(require("enum"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// import { Server } from 'node-osc';

class Gamepad {
  static EVENT_DESC = new _enum.default(['CENTER', 'UP', 'UP_LEFT', 'LEFT', 'DOWN_LEFT', 'DOWN', 'DOWN_RIGHT', 'RIGHT', 'UP_RIGHT', 'A_PRESS', 'A_RELEASE', 'B_PRESS', 'B_RELEASE', 'X_PRESS', 'X_RELEASE', 'Y_PRESS', 'Y_RELEASE', 'UP_LEFT_PRESS', 'UP_LEFT_RELEASE', 'UP_RIGHT_PRESS', 'UP_RIGHT_RELEASE', 'LEFT_TRIGGER', 'RIGHT_TRIGGER', 'HOME_PRESS', 'HOME_RELEASE', 'SELECT_PRESS', 'SELECT_RELEASE', 'JOYSTICK_LEFT', 'JOYSTICK_LEFT_PRESS', 'JOYSTICK_LEFT_RELEASE', 'JOYSTICK_RIGHT', 'JOYSTICK_RIGHT_PRESS', 'JOYSTICK_RIGHT_RELEASE']);
  constructor(devices, conf) {
    this.handlers = {};
    this.device = devices.find(({
      name
    }) => name == conf.name);
    if (!!this.device) {
      this.device = _sdl.default.joystick.openDevice(this.device);
    }
    this.device && this.device.on('*', (eventType, event) => {
      if (eventType == "axisMotion") {
        if (event.axis == 0 || event.axis == 1) {
          this.trigger(Gamepad.EVENT_DESC.JOYSTICK_LEFT, {
            dir: `${event.axis == 0 ? 'horizontal' : 'vertical'}`,
            ...event
          });
        } else if (event.axis == 2 || event.axis == 3) {
          this.trigger(Gamepad.EVENT_DESC.JOYSTICK_RIGHT, {
            dir: `${event.axis == 2 ? 'horizontal' : 'vertical'}`,
            ...event
          });
        } else if (event.axis == 4) {
          this.trigger(Gamepad.EVENT_DESC.LEFT_TRIGGER, {
            ...event
          });
        } else if (event.axis == 5) {
          this.trigger(Gamepad.EVENT_DESC.RIGHT_TRIGGER, {
            ...event
          });
        }
      } else if (eventType == "buttonDown") {
        if (event.button == 0) {
          this.trigger(Gamepad.EVENT_DESC.A_PRESS, {
            ...event
          });
        } else if (event.button == 1) {
          this.trigger(Gamepad.EVENT_DESC.B_PRESS, {
            ...event
          });
        } else if (event.button == 2) {
          this.trigger(Gamepad.EVENT_DESC.X_PRESS, {
            ...event
          });
        } else if (event.button == 3) {
          this.trigger(Gamepad.EVENT_DESC.Y_PRESS, {
            ...event
          });
        } else if (event.button == 4) {
          this.trigger(Gamepad.EVENT_DESC.UP_LEFT_PRESS, {
            ...event
          });
        } else if (event.button == 5) {
          this.trigger(Gamepad.EVENT_DESC.UP_RIGHT_PRESS, {
            ...event
          });
        } else if (event.button == 6) {
          this.trigger(Gamepad.EVENT_DESC.HOME_PRESS, {
            ...event
          });
        } else if (event.button == 7) {
          this.trigger(Gamepad.EVENT_DESC.SELECT_PRESS, {
            ...event
          });
        } else if (event.button == 8) {
          this.trigger(Gamepad.EVENT_DESC.JOYSTICK_LEFT_PRESS, {
            ...event
          });
        } else if (event.button == 9) {
          this.trigger(Gamepad.EVENT_DESC.JOYSTICK_RIGHT_PRESS, {
            ...event
          });
        }
      } else if (eventType == "buttonUp") {
        if (event.button == 0) {
          this.trigger(Gamepad.EVENT_DESC.A_RELEASE, {
            ...event
          });
        } else if (event.button == 1) {
          this.trigger(Gamepad.EVENT_DESC.B_RELEASE, {
            ...event
          });
        } else if (event.button == 2) {
          this.trigger(Gamepad.EVENT_DESC.X_RELEASE, {
            ...event
          });
        } else if (event.button == 3) {
          this.trigger(Gamepad.EVENT_DESC.Y_RELEASE, {
            ...event
          });
        } else if (event.button == 4) {
          this.trigger(Gamepad.EVENT_DESC.UP_LEFT_RELEASE, {
            ...event
          });
        } else if (event.button == 5) {
          this.trigger(Gamepad.EVENT_DESC.UP_RIGHT_RELEASE, {
            ...event
          });
        } else if (event.button == 6) {
          this.trigger(Gamepad.EVENT_DESC.HOME_RELEASE, {
            ...event
          });
        } else if (event.button == 7) {
          this.trigger(Gamepad.EVENT_DESC.SELECT_RELEASE, {
            ...event
          });
        } else if (event.button == 8) {
          this.trigger(Gamepad.EVENT_DESC.JOYSTICK_LEFT_RELEASED, {
            ...event
          });
        } else if (event.button == 9) {
          this.trigger(Gamepad.EVENT_DESC.JOYSTICK_RIGHT_RELEASED, {
            ...event
          });
        }
      } else if (eventType == "hatMotion") {
        if (event.value == "up") {
          this.trigger(Gamepad.EVENT_DESC.UP, {
            ...event
          });
        } else if (event.value == "leftup") {
          this.trigger(Gamepad.EVENT_DESC.UP_LEFT, {
            ...event
          });
        } else if (event.value == "left") {
          this.trigger(Gamepad.EVENT_DESC.LEFT, {
            ...event
          });
        } else if (event.value == "leftdown") {
          this.trigger(Gamepad.EVENT_DESC.DOWN_LEFT, {
            ...event
          });
        } else if (event.value == "down") {
          this.trigger(Gamepad.EVENT_DESC.DOWN, {
            ...event
          });
        } else if (event.value == "rightdown") {
          this.trigger(Gamepad.EVENT_DESC.DOWN_RIGHT, {
            ...event
          });
        } else if (event.value == "right") {
          this.trigger(Gamepad.EVENT_DESC.RIGHT, {
            ...event
          });
        } else if (event.value == "rightup") {
          this.trigger(Gamepad.EVENT_DESC.UP_RIGHT, {
            ...event
          });
        } else if (event.value == "centered") {
          this.trigger(Gamepad.EVENT_DESC.CENTER, {
            ...event
          });
        }
      }
    });
  }
  trigger(eventDesc, event) {
    this.handlers[eventDesc] && this.handlers[eventDesc].forEach(handler => {
      handler({
        ...event,
        type: eventDesc,
        desc: `Gamepad.EVENT_DESC.${Gamepad.EVENT_DESC.getKey(eventDesc)}`,
        time: new Date().getTime(),
        device: this.device?._device
      });
    });
  }
  on(description, callback) {
    if (!Object.values(Gamepad.EVENT_DESC).includes(description)) throw new Error(`onJoystick wait for Gamepad.EVENT_DESC as first parameter. You give "${description}".`);
    if (typeof callback !== 'function') throw new Error(`onJoystick wait for function as second parameter. You give "${typeof callback}".`);
    this.handlers[description] = this.handlers[description] || [];
    this.handlers[description].push(callback);
    return this;
  }
  async close() {
    this.device.close();
    return await (0, _Tools.wait)(100);
  }
}
exports.default = Gamepad;
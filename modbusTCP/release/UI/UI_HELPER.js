"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _Math = require("../common/Math.js");
var _UI_TOOL = _interopRequireDefault(require("./UI_TOOL.js"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class UI_HELPER extends _UI_TOOL.default {
  constructor(window) {
    super(window);
  }
  text(x, y, value) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.fillStyle = 'white';
    this.ctx.fillText(value, 0, 6);
    this.ctx.restore();
    return [x, y - 5, this.ctx.measureText(value).width + 5, 20];
  }
  slider(x, y, name, value) {
    const label = `${name} : `;
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = 'white';
    if (name !== false) {
      this.ctx.fillText(label, 0, 6);
      this.ctx.translate(this.ctx.measureText(label).width + 5, 0);
    }
    this.ctx.strokeStyle = 'white';
    this.ctx.fillStyle = 'white';
    this.ctx.strokeRect(0, 0, 100, 20);
    this.ctx.fillRect((0, _Math.lerp)(3, 100 - 14 - 3, value), 3, 14, 14);
    this.ctx.restore();
    return [x, y - 5, this.ctx.measureText(label).width + 5 + 100, 20];
  }
  checkBox(x, y, name, check) {
    const label = ` : ${name}`;
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.translate(0, -5);
    this.ctx.strokeStyle = 'white';
    this.ctx.fillStyle = check ? 'white' : 'red';
    this.ctx.strokeRect(0, 0, 20, 20);
    this.ctx.fillRect(3, 3, 14, 14);
    this.ctx.translate(23, 6);
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = 'white';
    this.ctx.fillText(label, 0, 0);
    this.ctx.restore();
    return this.button([x, y - 5, this.ctx.measureText(label).width + 30, 20, name]);
  }
  button([x, y, w, h, name]) {
    const isInside = this.mouse.x > x && this.mouse.x < x + w && this.mouse.y > y && this.mouse.y < y + h;
    if (isInside && this.mouse.isDown) {
      this.ctx.strokeStyle = 'lightGrey';
    } else if (isInside && this.mouse.justUp) {
      this.ctx.strokeStyle = 'red';
    } else if (isInside) {
      this.ctx.strokeStyle = 'white';
    } else {
      this.ctx.strokeStyle = 'darkGrey';
    }
    this.ctx.strokeRect(x, y, w, h);
    const interactiveObject = {
      ifMouseInside: handler => {
        isInside && typeof handler === 'function' && handler(name);
        return interactiveObject;
      },
      ifMouseRelease: handler => {
        this.mouse.justUp && isInside && typeof handler === 'function' && handler(name);
        return interactiveObject;
      },
      ifMousePress: handler => {
        this.mouse.justDown && isInside && typeof handler === 'function' && handler(name);
        return interactiveObject;
      },
      ifMouseDown: handler => {
        this.mouse.isDown && isInside && typeof handler === 'function' && handler(name);
        return interactiveObject;
      },
      ifMouseUp: handler => {
        this.mouse.isUp && isInside && typeof handler === 'function' && handler(name);
        return interactiveObject;
      }
    };
    return interactiveObject;
  }
}
exports.default = UI_HELPER;
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.wait = exports.EventManager = void 0;
const wait = time => new Promise(r => setTimeout(() => r(), time));
exports.wait = wait;
class EventManager {
  constructor(name, handlers) {
    this.name = name;
    this._handlers = {};
    handlers.map(name => this.addHandler(name));
  }
  addHandler(name) {
    this._handlers[name] = [];
  }
  on(description, callback) {
    if (!Object.keys(this._handlers).includes(description)) throw new Error(`on${description} wait for ${this.name}.EVENT_DESC as first parameter. You give "${description}".`);
    if (typeof callback !== 'function') throw new Error(`on${description} wait for function as second parameter. You give "${typeof callback}".`);
    this._handlers[description].push(callback);
    return this;
  }
  trigger(eventDesc, event) {
    this._handlers[eventDesc].forEach(handler => {
      handler(event);
    });
  }
}
exports.EventManager = EventManager;
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _UI_HELPER = _interopRequireDefault(require("./UI_HELPER.js"));
var _FestoController = _interopRequireDefault(require("../FestoController"));
var _PTZController = _interopRequireDefault(require("../PTZController"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class UI extends _UI_HELPER.default {
  constructor(window, gamepad, robots, camera) {
    super(window);
    this.config = {
      gamepad,
      robots,
      camera
    };
    this.handlers = [];
  }
  onButtonEvent(handler) {
    this.handlers.push(handler);
  }
  draw() {
    //CONTROLLER STUFF
    this.text(10, 25, this.config.gamepad.device._device.name.toUpperCase().split("").join("   "));
    this.config.gamepad.in.controls.filter(({
      visible
    }) => visible).map((ctrl, n) => {
      return this.slider(10, 50 + n * 27, ctrl.name, ctrl.getValue());
    });
    this.line(300, 10, 300, 580);

    //ROBOTS STUFF
    this.ctx.save();
    this.config.robots.map((robot, k) => {
      this.ctx.translate(300, 0);
      this.text(10, 25, `Robot ${robot.conf.name}`.toUpperCase().split("").join("   "));
      this.line(300, 10, 300, 580);
    });
    this.ctx.restore();
    this.config.robots.map((robot, k) => {
      const x = 10 + 300 * (k + 1);
      const y = 50;
      const lineHeight = 27;
      if (robot.isError()) {} else if (!robot.isConnected()) {
        this.checkBox(x, y, "Connection", false).ifMouseRelease(() => {
          this.handlers.map(handler => handler({
            eventName: "connection",
            target: "robot",
            id: k
          }));
        });
      } else if (!robot.isReferenced()) {
        this.checkBox(x, y, "Homing", false).ifMouseRelease(() => {
          this.handlers.map(handler => handler({
            eventName: "homing",
            target: "robot",
            id: k
          }));
        });
      } else {
        this.text(x, y, `OUTPUT`.toUpperCase());
        const outItem = robot.out.controls.filter(({
          visible
        }) => visible).map((ctrl, n) => {
          const yOffset = (n + 1) * lineHeight;
          return [robot, this.checkBox(x, y + yOffset, ctrl.name, ctrl.getValue())];
        }).map(([robot, checkbox]) => {
          return checkbox.ifMouseRelease(name => {
            this.handlers.map(handler => handler({
              eventName: name,
              target: robot
            }));
          });
        });
        let offset = outItem.length + 1;
        const yOffset = (offset + 1) * lineHeight;
        this.text(x, y + yOffset, `INPUT`.toUpperCase());
        robot.in.controls.filter(({
          visible
        }) => visible).map((ctrl, n) => {
          const yOffset = (offset + n + 2) * lineHeight;
          switch (ctrl.type) {
            case "checkBox":
              this.checkBox(x, y + yOffset, ctrl.name, ctrl.getValue());
              break;
            case "slider":
              this.slider(x, y + yOffset, ctrl.name, ctrl.getValue());
              break;
          }
        });
      }
    });

    //CAMERA STUFF
    const camera = this.config.camera;
    this.text(910, 25, `CAMERA ${camera.conf.name}`.toUpperCase().split("").join("   "));
    const x = 910;
    const y = 50;
    const lineHeight = 27;
    if (camera.isError()) {} else if (!camera.isConnected()) {
      this.checkBox(x, y, "Connection", false).ifMouseRelease(() => {
        this.handlers.map(handler => handler({
          eventName: "connection",
          target: "camera",
          id: 0
        }));
      });
    } else {
      let counter = 0;
      this.text(x, y, `INPUT`.toUpperCase());
      camera.out.controls.filter(({
        data
      }) => data.withParams).map((ctrl, n) => {
        Object.values(ctrl.data.params).map((param, l) => {
          counter++;
          const yOffset = counter * lineHeight;
          this.slider(x, y + yOffset, param.name, param.value);
        });
      });
      counter += 2;
      this.text(x, y + counter * lineHeight, `OUTPUT`.toUpperCase());
      camera.in.controls.filter(({
        data
      }) => !data.withParams).map((ctrl, n) => {
        Object.values(ctrl.data.params).map((param, l) => {
          counter++;
          const yOffset = counter * lineHeight;
          this.slider(x, y + yOffset, param.name, param.value);
        });
      });
    }
  }
}
exports.default = UI;
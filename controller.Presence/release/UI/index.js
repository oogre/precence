"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _UI_HELPER = _interopRequireDefault(require("./UI_HELPER.js"));
var _FestoController = _interopRequireDefault(require("../FestoController"));
var _PTZController = _interopRequireDefault(require("../PTZController"));
var _Math = require("../common/Math.js");
var _OBS = _interopRequireDefault(require("../OBS"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class UI extends _UI_HELPER.default {
  constructor(window, gamepad, robots, camera, recorder, obs) {
    super(window);
    this.config = {
      gamepad,
      robots,
      camera,
      recorder,
      obs
    };
    this.handlers = [];
  }
  onButtonEvent(handler) {
    this.handlers.push(handler);
  }
  draw() {
    //CONTROLLER STUFF
    this.title(10, 25, this.config.gamepad.device?._device.name || "");
    this.config.gamepad.in.controls.filter(({
      visible
    }) => visible).map((ctrl, n) => {
      ctrl.bounds = this.slider(10, 50 + n * 27, ctrl.name, ctrl.getValue());
      return ctrl.bounds;
    });
    this.line(300, 10, 300, 580);

    //ROBOTS STUFF
    this.ctx.save();
    this.config.robots.map((robot, k) => {
      this.ctx.translate(300, 0);
      this.title(10, 25, `Robot ${robot.conf.name}`);
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
            eventName: "HOME",
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
          switch (ctrl.type) {
            case "checkBox":
              //this.checkBox(x, y + yOffset, ctrl.name, ctrl.getValue());
              return [robot, this.checkBox(x, y + yOffset, ctrl.name, ctrl.getValue()), ctrl];
              break;
            case "slider":
              ctrl.bounds = this.slider(x, y + yOffset, ctrl.name, ctrl.getValue());
              break;
          }
        }).filter(e => !!e).map(([robot, checkbox, ctrl]) => {
          return checkbox.ifMouseRelease(name => {
            this.handlers.map(handler => handler({
              eventName: ctrl.name,
              target: "robot",
              id: k
            }));
          });
        });
        let counter = 0;
        let offset = outItem.length + 3;
        const yOffset = (offset + 1) * lineHeight;
        this.text(x, y + yOffset, `INPUT`.toUpperCase());
        robot.in.controls.filter(({
          visible
        }) => visible).map((ctrl, n) => {
          counter++;
          const yOffset = (offset + n + 2) * lineHeight;
          switch (ctrl.type) {
            case "checkBox":
              //this.checkBox(x, y + yOffset, ctrl.name, ctrl.getValue());
              return [robot, this.checkBox(x, y + yOffset, ctrl.name, ctrl.getValue()), ctrl];
              break;
            case "slider":
              ctrl.bounds = this.slider(x, y + yOffset, ctrl.name, ctrl.getValue());
              break;
          }
        });
        this.checkBox(x, y + yOffset + (counter + 2) * lineHeight, "GO ZERO", false).ifMouseRelease(() => {
          this.handlers.map(handler => handler({
            eventName: "ZERO",
            target: "robot",
            id: k
          }));
        });
      }
    });

    //CAMERA STUFF
    const camera = this.config.camera;
    this.title(910, 25, `CAMERA ${camera.conf.name}`);
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
      this.text(x, y, `OUTPUT`.toUpperCase());
      camera.out.controls.filter(({
        data,
        visible
      }) => data.withParams && visible).map((ctrl, n) => {
        Object.values(ctrl.data.params).map((param, l) => {
          counter++;
          const yOffset = counter * lineHeight;
          param.bounds = this.slider(x, y + yOffset, param.name, param.value);
        });
      });
      counter += 2;
      this.text(x, y + counter * lineHeight, `INPUT`.toUpperCase());
      camera.in.controls.filter(({
        data
      }) => !data.withParams).map((ctrl, n) => {
        Object.values(ctrl.data.params).map((param, l) => {
          counter++;
          const yOffset = counter * lineHeight;
          param.bounds = this.slider(x, y + yOffset, param.name, param.value);
        });
      });
      this.checkBox(x, y + (counter + 2) * lineHeight, "GO ZERO", false).ifMouseRelease(() => {
        this.handlers.map(handler => handler({
          eventName: "ZERO",
          target: "camera",
          id: 0
        }));
      });
    }
    this.line(10, 600, 1190, 600);
    {
      //RECORDER STUFF
      const recorder = this.config.recorder;
      this.title(10, 625, `RECORDER`);
      this.checkBox(180, 625, `LOAD`, true).ifMouseRelease(() => {
        this.handlers.map(handler => handler({
          eventName: "load",
          target: "recorder",
          id: 0
        }));
      });
      switch (this.config.obs.status) {
        case _OBS.default.OBSStatus.NOT_CONNECTED:
        case _OBS.default.OBSStatus.CONNECTED:
          break;
        case _OBS.default.OBSStatus.OBS_WEBSOCKET_OUTPUT_PAUSED:
          {
            this.checkBox(280, 625, "STOP", false).ifMouseRelease(() => {
              this.handlers.map(handler => handler({
                eventName: "STOP",
                target: "recorder",
                id: 0
              }));
            });
            const name = recorder.channels.map(({
              record
            }) => record).some(t => t) ? 'REC' : "PLAY";
            this.checkBox(380, 625, name, false).ifMouseRelease(() => {
              this.handlers.map(handler => handler({
                eventName: "PLAY",
                target: "recorder",
                id: 0
              }));
            });
          }
          break;
        case _OBS.default.OBSStatus.OBS_WEBSOCKET_OUTPUT_STOPPED:
          {
            const name = recorder.channels.map(({
              record
            }) => record).some(t => t) ? 'REC' : "PLAY";
            this.checkBox(280, 625, name, true).ifMouseRelease(() => {
              this.handlers.map(handler => handler({
                eventName: "REC",
                target: "recorder",
                id: 0
              }));
            });
          }
          break;
        case _OBS.default.OBSStatus.OBS_WEBSOCKET_OUTPUT_RESUMED:
        case _OBS.default.OBSStatus.OBS_WEBSOCKET_OUTPUT_STARTED:
          this.checkBox(280, 625, "STOP", false).ifMouseRelease(() => {
            this.handlers.map(handler => handler({
              eventName: "STOP",
              target: "recorder",
              id: 0
            }));
          });
          this.checkBox(380, 625, "PAUSE", true).ifMouseRelease(() => {
            this.handlers.map(handler => handler({
              eventName: "PAUSE",
              target: "recorder",
              id: 0
            }));
          });
          break;
      }
      let offset = 200;
      let width = 1000;
      let x = 10;
      let y = 650;
      recorder.channels.map(({
        name,
        record
      }, n) => {
        this.checkBox(x, y + n * 20, name, !record).ifMouseRelease(() => {
          this.handlers.map(handler => handler({
            eventName: name,
            target: "recorder",
            id: 0
          }));
        });
      });
      this.ctx.save();
      {
        this.ctx.translate(x, y);
        recorder.channels.map(({
          canvas
        }, n) => {
          this.ctx.save();
          {
            this.ctx.translate(offset, 0);
            this.line(0, n * 20, width, n * 20);
            this.ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, n * 20, width, 12);
          }
          this.ctx.restore();
        });
        this.ctx.save();
        {
          this.ctx.translate(offset, 0);
          this.ctx.save();
          {
            this.ctx.translate((0, _Math.lerp)(0, width, recorder.currentTimeNormalized()), 0);
            this.line(0, 0, 0, 400);
          }
          this.ctx.restore();
        }
        this.ctx.restore();
      }
      this.ctx.restore();
    }
  }
}
exports.default = UI;
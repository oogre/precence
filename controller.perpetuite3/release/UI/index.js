"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _UI_HELPER = _interopRequireDefault(require("./UI_HELPER.js"));
var _FestoController = _interopRequireDefault(require("../FestoController"));
var _PTZController = _interopRequireDefault(require("../PTZController"));
var _Math = require("../common/Math.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class UI extends _UI_HELPER.default {
  constructor(window, gamepad, robots, camera, recorder) {
    super(window);
    this.config = {
      gamepad,
      robots,
      camera,
      recorder
    };
    this.handlers = [];
    this.links = [];
  }
  onButtonEvent(handler) {
    this.handlers.push(handler);
  }
  link({
    bounds: A
  }, {
    bounds: B
  }) {
    this.links.push([A, B]);
  }
  draw() {
    //CONTROLLER STUFF
    this.text(10, 25, this.config.gamepad.device._device.name.toUpperCase().split("").join("   "));
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
          switch (ctrl.type) {
            case "checkBox":
              this.checkBox(x, y + yOffset, ctrl.name, ctrl.getValue());
              return [robot, this.checkBox(x, y + yOffset, ctrl.name, ctrl.getValue())];
              break;
            case "slider":
              ctrl.bounds = this.slider(x, y + yOffset, ctrl.name, ctrl.getValue());
              break;
          }
        }).filter(e => !!e).map(([robot, checkbox]) => {
          return checkbox.ifMouseRelease(name => {
            this.handlers.map(handler => handler({
              eventName: name,
              target: robot
            }));
          });
        });
        let offset = outItem.length + 3;
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
              ctrl.bounds = this.slider(x, y + yOffset, ctrl.name, ctrl.getValue());
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
      this.text(x, y, `OUTPUT`.toUpperCase());
      camera.out.controls.filter(({
        data
      }) => data.withParams).map((ctrl, n) => {
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
    }
    this.links.map(([[ax, ay, aw, ah], [bx, by, bw, bh]]) => {
      //this.line(ax + aw, ay+ ah*0.5, ax + aw + 20, ay+ ah*0.5);
      this.ctx.beginPath();
      this.ctx.moveTo(ax + aw, ay + ah * 0.5);
      this.ctx.quadraticCurveTo((ax + bx) * 0.5, (ay + by) * 0.5, bx, by + bh * 0.5);
      this.ctx.stroke();
      //this.line(bx - 20, by + bh * 0.5, bx, by + bh * 0.5);
    });
    this.line(10, 600, 1190, 600);
    {
      //RECORDER STUFF
      const recorder = this.config.recorder;
      this.text(10, 625, `RECORDER`.toUpperCase().split("").join("   "));
      this.checkBox(180, 625, recorder.isRecording() ? "STOP" : "REC", !recorder.isRecording()).ifMouseRelease(() => {
        this.handlers.map(handler => handler({
          eventName: "rec",
          target: "recorder",
          id: 0
        }));
      });
      const x = 10;
      const y = 650;

      //if(recorder.isPlaying() || recorder.isRecording()){

      const now = new Date().getTime() - recorder.startRecordAt;
      const present = Math.max(new Date().getTime() - recorder.startRecordAt, recorder.lastRecordAt);
      const ONE_OVER_PRESENT = 1 / present;
      this.config.gamepad.in.controls.filter(({
        visible
      }) => visible).map((ctrl, n) => {
        this.text(10, y + n * 12, ctrl.name.toUpperCase());
        this.line(180, y + n * 12, 1180, y + n * 12);
      });

      // recorder.data.map(({t, n, v})=>{
      // 	let _x = lerp( 180, 1180, t * ONE_OVER_PRESENT);
      // 	let _y = y + n * 12
      // 	this.line(_x, _y, _x, _y + (6 * v));
      // })

      // let _x = lerp( 180, 1180, now * ONE_OVER_PRESENT);
      // let _y = y 
      // this.line(_x, _y, _x, _y + 240);

      //}
    }
  }
}
exports.default = UI;
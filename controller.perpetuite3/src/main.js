//import Gamepad from "./Gamepad";
import sdl from '@kmamal/sdl';
import Enum from 'enum';
import UI from "./UI";
import config from "./config.js";
import PTZController from "./PTZController";
import FestoController from "./FestoController";
import Gamepad from "./Gamepad"

process.title = config.window.title;

const window = sdl.video.createWindow(config.window);
const ui = new UI(window, config);
ui.onButtonEvent((event)=>{
  if(event.target == "robot"){
    if(event.eventName == "connection"){
      robots[event.id].connect();
    }else if(event.eventName == "homing"){
      robots[event.id].homing();
    }
  }
  else if(event.target == "camera"){
    if(event.eventName == "connection"){
      camera.connect();
    }
  } 
});

const gamepad = new Gamepad(sdl.joystick.devices, config.controller)
const camera = new PTZController(config.camera);
const robots = [
  new FestoController(config.robots[0]),
  new FestoController(config.robots[1])
];

gamepad.on(Gamepad.EVENT_DESC.JOYSTICK_LEFT, async event => {
  if(event.axis == 0){
    config.controller.axes[0].values[0].position = event.value * 0.5 + 0.5;
    robots[0].speed(event.value);
  }else if(event.axis == 1){
    config.controller.axes[0].values[1].position = event.value * -0.5 + 0.5;
    robots[1].speed(event.value);
  }
})
.on(Gamepad.EVENT_DESC.JOYSTICK_RIGHT, async event => {
  if(event.axis == 2){
   //config.controller.axes[1].values[0].position = event.value * 0.5 + 0.5;
    camera.setPanTiltSpeed(event.value, camera.tilt);
  }else if(event.axis == 3){
    //config.controller.axes[1].values[1].position = event.value * -0.5 + 0.5;
    camera.setPanTiltSpeed(camera.pan, event.value);
  }
}).on(Gamepad.EVENT_DESC.LEFT_TRIGGER, async event => {
    config.controller.axes[2].values[0].position = event.value;
}).on(Gamepad.EVENT_DESC.RIGHT_TRIGGER, async event => {
    config.controller.axes[2].values[1].position = event.value;
}).on(Gamepad.EVENT_DESC.UP_LEFT_PRESS, async event => {
    config.controller.axes[3].values[0].position = 1;
}).on(Gamepad.EVENT_DESC.UP_LEFT_RELEASE, async event => {
    config.controller.axes[3].values[0].position = 0;
}).on(Gamepad.EVENT_DESC.UP_RIGHT_PRESS, async event => {
    config.controller.axes[3].values[1].position = 1;
}).on(Gamepad.EVENT_DESC.UP_RIGHT_RELEASE, async event => {
    config.controller.axes[3].values[1].position = 0;
}).on(Gamepad.EVENT_DESC.A_PRESS, async event => {
    config.controller.axes[4].position = 1;
}).on(Gamepad.EVENT_DESC.A_RELEASE, async event => {
    config.controller.axes[4].position = 0;
}).on(Gamepad.EVENT_DESC.B_PRESS, async event => {
    config.controller.axes[5].position = 1;
}).on(Gamepad.EVENT_DESC.B_RELEASE, async event => {
    config.controller.axes[5].position = 0;
}).on(Gamepad.EVENT_DESC.X_PRESS, async event => {
    config.controller.axes[6].position = 1;
}).on(Gamepad.EVENT_DESC.X_RELEASE, async event => {
    config.controller.axes[6].position = 0;
}).on(Gamepad.EVENT_DESC.Y_PRESS, async event => {
    config.controller.axes[7].position = 1;
}).on(Gamepad.EVENT_DESC.Y_RELEASE, async event => {
    config.controller.axes[7].position = 0;
});


const terminate = async ()=>{
  await robots[0].close();
  await robots[1].close();
  await camera.close();
  await ui.close();
  await gamepad.close();
  process.exit();
}


process.on('SIGINT', terminate);
window.on('close', terminate);

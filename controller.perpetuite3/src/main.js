//import Gamepad from "./Gamepad";
import sdl from '@kmamal/sdl';
import Enum from 'enum';
import UI from "./UI";
import config from "./config.js";
import PTZController from "./PTZController";
import FestoController from "./FestoController";
import Gamepad from "./Gamepad"
import {lerp} from "./common/Math.js"

process.title = config.window.title;

const window = sdl.video.createWindow(config.window);

const gamepad = new Gamepad(sdl.joystick.devices, config.controller)

const robots = [
  new FestoController(config.robots[0]),
  new FestoController(config.robots[1])
];

const camera = new PTZController(config.camera);

const ui = new UI(window, gamepad, robots, camera);

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

gamepad.on("JOYSTICK_LEFT_HORIZONTAL", event => {
    camera.setPanTiltSpeed(event.target.getValue(), camera.tilt);
});

gamepad.on("JOYSTICK_LEFT_VERTICAL", event => {
    camera.setPanTiltSpeed(camera.pan, event.target.getValue());
});

gamepad.on("TRIGGER_RIGHT", event => {
    camera.setZoom( lerp(0.5, 1, event.target.getValue()));
});

gamepad.on("TRIGGER_LEFT", event => {
    camera.setZoom( lerp(0.5, 0, event.target.getValue()))
});



const terminate = async ()=>{
    await robots[0].close();
    await robots[1].close();
    await camera.close();
    await gamepad.close();
    await ui.close();
    
    process.exit();
}


process.on('SIGINT', terminate);
window.on('close', terminate);

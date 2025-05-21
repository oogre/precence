//import Gamepad from "./Gamepad";
import sdl from '@kmamal/sdl';
import Enum from 'enum';
import UI from "./UI";
import config from "./config.js";
import PTZController from "./PTZController";
import FestoController from "./FestoController";
import DMX from "./DMX";

import Gamepad from "./Gamepad"
import Recorder from "./Recorder"
import {lerp} from "./common/Math.js"

process.title = config.window.title;

const window = sdl.video.createWindow(config.window);


const dmx = new DMX(config.DMX);


setInterval(()=>{
    dmx.set(1, Math.floor(Math.random() * 256));
}, 30);

const recorder = new Recorder();

const gamepad = new Gamepad(sdl.joystick.devices, config.controller)

const robots = [
  new FestoController(config.robots[0]),
  new FestoController(config.robots[1])
];

const camera = new PTZController(config.camera);

const ui = new UI(window, gamepad, robots, camera, recorder);

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
    // else if(event.target == "recorder"){
    //     if(event.eventName == "recorder"){
    //         if(recorder.isRecording()){
    //             recorder.stopRecord()
    //         }else{
    //             recorder.startRecord()
    //         }
    //     }
    // } 
});

// ui.onReady(()=>{
//     ui.link(gamepad.in.get("JOYSTICK_LEFT_HORIZONTAL"), camera.out.get("PAN_TILT").data.params.tilt);
//     ui.link(gamepad.in.get("JOYSTICK_LEFT_VERTICAL"), camera.out.get("PAN_TILT").data.params.pan);
//     ui.link(gamepad.in.get("TRIGGER_RIGHT"), camera.out.get("ZOOM").data.params.zoom);
//     ui.link(gamepad.in.get("TRIGGER_LEFT"), camera.out.get("ZOOM").data.params.zoom);
// });

// gamepad.on("*", ({time, target:{getValue, id}}) =>{
//     recorder.update({
//         time, 
//         id,
//         value : getValue()
//     });
// });


gamepad.on("JOYSTICK_LEFT_HORIZONTAL", event => {
    robots[0].speed(event.target.getValue() * 2 - 1);

});

gamepad.on("JOYSTICK_LEFT_VERTICAL", event => {
    robots[1].speed(-1 *  (event.target.getValue() * 2 - 1));
});

gamepad.on("JOYSTICK_RIGHT_HORIZONTAL", event => {
    camera.setPanTiltSpeed(1-event.target.getValue(), camera.tilt);
});

gamepad.on("JOYSTICK_RIGHT_VERTICAL", event => {
    camera.setPanTiltSpeed(camera.pan, 1-event.target.getValue());
});

gamepad.on("TRIGGER_LEFT", event => {
    camera.setZoom( lerp(0.5, 1, event.target.getValue()));
});

gamepad.on("TRIGGER_RIGHT", event => {
    camera.setZoom( lerp(0.5, 0, event.target.getValue()))
});

let irisRun;
gamepad.on("BUTTON_TRIGGER_LEFT", event => {
    clearInterval(irisRun);
    if(event.target.getValue() != 0){
        irisRun = setInterval(()=>{
            camera.setIris(-1 * event.target.getValue() * 0.05);    
        }, 50);
    }
});

gamepad.on("BUTTON_TRIGGER_RIGHT", event => {
    clearInterval(irisRun);
    if(event.target.getValue() != 0){
        irisRun = setInterval(()=>{
            camera.setIris(event.target.getValue() * 0.2);    
        }, 50);
    }
});



const terminate = async ()=>{
    await robots[0].close();
    await robots[1].close();
    await camera.close();
    await ui.close();
    await recorder.close();
    await gamepad.close();
    process.exit();
}


process.on('SIGINT', terminate);
window.on('close', terminate);

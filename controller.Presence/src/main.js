//import Gamepad from "./Gamepad";
import sdl from '@kmamal/sdl';
import Enum from 'enum';
import UI from "./UI";
import config from "./config.js";
import PTZController from "./PTZController";
import FestoController from "./FestoController";
import DMX from "./DMX";
import OBS from "./OBS";

import Gamepad from "./Gamepad"
import Recorder from "./Recorder"
import {lerp} from "./common/Math.js"
import dialog from 'node-file-dialog';
import fs from 'node:fs';

process.title = config.window.title;

const window = sdl.video.createWindow(config.window);

// const dmx = new DMX(config.DMX);


// setInterval(()=>{
//     dmx.set(1, Math.floor(Math.random() * 256));
// }, 30);

const recorder = new Recorder(config.RECORDER);
const gamepad = new Gamepad(sdl.joystick.devices, config.CONTROLLER)
const robots = [
  new FestoController(config.ROBOTS[0]),
  new FestoController(config.ROBOTS[1])
];
const camera = new PTZController(config.RECORDER);
const obs = new OBS(config.OBS);
const ui = new UI(window, gamepad, robots, camera, recorder);

ui.onButtonEvent((event)=>{

    if(event.target == "robot"){
        if(event.eventName == "connection"){
            robots[event.id].connect();
        }else if(event.eventName == "HOME"){
            console.log("Homing");
            robots[event.id].homing();
        }
    }
    else if(event.target == "camera"){
        if(event.eventName == "connection"){
            camera.connect();
        }
    } 
    else if(event.target == "recorder"){
        if(event.eventName == "rec"){
            console.log(event);
            if(recorder.isRecording()){
                recorder.stop()
            }else{
                recorder.start()
            }
        }
        else if(event.eventName == "load"){
            dialog({type:'open-file'})
                .then(([dir]) => {
                    recorder.channels = JSON.parse(fs.readFileSync(dir, "utf8"));
                })
                .catch(err => console.log(err))

        }
        else{
            const chan = recorder.channels.find(({name})=>name == event.eventName);
            chan.record = !chan.record;
        }
    } 
});

recorder.channels = gamepad.in.controls
                        .filter(({visible}) => visible)
                        .map(({name})=>{
                            return {name};
                        })



gamepad.on("*", ({target:{getValue, name}}) =>{
    recorder.rec({
        name,
        value : getValue()
    });
});


gamepad.on("JOYSTICK_LEFT_HORIZONTAL", event => {
    robots[0].speed(1 * (event.target.getValue() * 2 - 1));

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


gamepad.on("BUTTON_B", event=>{
    console.log(event);
    if(event.target.getValue() == 1){
        obs.toggleRecord();
    }
})

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

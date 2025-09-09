//import Gamepad from "./Gamepad";
import sdl from '@kmamal/sdl';
import Enum from 'enum';
import UI from "./UI";
import config from "./config.js";
import PTZController from "./PTZController";
import FestoController from "./FestoController";
import DMX from "./DMX";
import OBS from "./OBS";
import {pWait, wait} from "./common/Tools.js";
import Gamepad from "./Gamepad";
import Recorder from "./Recorder";
import {lerp} from "./common/Math.js";
import dialog from 'node-file-dialog';
import fs from 'node:fs';

process.title = config.window.title;

const window = sdl.video.createWindow(config.window);

const recorder = new Recorder({
    ...config.RECORDER, 
    log : config.RECORDER.log ? (...data)=>console.log(`RECORDER ${config.RECORDER.name} : `, ...data) : ()=>{}
});

const gamepad = new Gamepad(sdl.joystick.devices, {
    ...config.CONTROLLER, 
    log : config.CONTROLLER.log ? (...data)=>console.log(`GAMEPAD ${config.CONTROLLER.name} : `, ...data) : ()=>{}
});

const robots = [
    new FestoController({
        ...config.ROBOTS[0], 
        log : config.ROBOTS[0].log ? (...data)=>console.log(`ROBOT ${config.ROBOTS[0].name} : `, ...data) : ()=>{}
    }),
    new FestoController({
        ...config.ROBOTS[1], 
        log : config.ROBOTS[1].log ? (...data)=>console.log(`ROBOT ${config.ROBOTS[1].name} : `, ...data) : ()=>{}
    })
];

const camera = new PTZController({
    ...config.CAMERA, 
    log : config.CAMERA.log ? (...data)=>console.log(`CAMERA ${config.CAMERA.name} : `, ...data) : ()=>{}
});

const obs = new OBS({
    ...config.OBS, 
    log : config.OBS.log ? (...data)=>console.log(`OBS ${config.OBS.name} : `, ...data) : ()=>{}
});

const ui = new UI(window, gamepad, robots, camera, recorder, obs);

/* UI CONTROL */
{
    ui.onButtonEvent(async (event)=>{
        if(event.target == "robot"){
            if(event.eventName == "connection"){
                robots[event.id].connect();
            }else if(event.eventName == "HOME"){
                console.log("Homing");
                robots[event.id].homing();
            }else if(event.eventName == "ZERO"){
                robots[event.id].setZero();
            }
        }
        else if(event.target == "camera"){
            if(event.eventName == "connection"){
                camera.connect();
                await pWait(1000);
                await obs.changeScene("Scène");
            }
            else if(event.eventName == "ZERO"){
                camera.setZero()
            }
        } 
        else if(event.target == "recorder"){
            if(event.eventName == "REC"){
                await obs.startRecord();
            }
            else if(event.eventName == "STOP"){
                recorder.stop();
                await obs.stopRecord();
            }
            else if(event.eventName == "PLAY"){
                await obs.playRecord();
            }
            else if(event.eventName == "PAUSE"){
                await obs.pauseRecord();
            }

            else if(event.eventName == "load"){
                dialog({type:'open-file'})
                    .then(([dir]) => {
                        recorder.channels = JSON.parse(fs.readFileSync(dir, "utf8")).map(item =>{
                            if(item.name == "ROBOT X"){
                                item.target = robots[0]
                            }else if(item.name == "ROBOT Y"){
                                item.target = robots[1]
                            }else{
                                item.target = camera
                            }
                            return item;
                        });
                    })
                    .catch(err => console.log(err))
            }
            else{
                if( obs.status == OBS.OBSStatus.OBS_WEBSOCKET_OUTPUT_RESUMED ||
                    obs.status == OBS.OBSStatus.OBS_WEBSOCKET_OUTPUT_STARTED
                ){
                    return;
                }
                const chan = recorder.channels.find(({name})=>name == event.eventName);
                if(event.id==0){
                    chan.record = !chan.record;
                    chan.target.recMode = chan.record;
                }else if(event.id==1){
                    chan.play = !chan.play;
                    chan.target.playMode = chan.play;
                }
            }
        } 
    });
}

/* OBS CONTROL */
{
    obs.on("OBS_WEBSOCKET_OUTPUT_STARTED", ()=>{
        recorder.start();
    });

    obs.on("OBS_WEBSOCKET_OUTPUT_STOPPED", ()=>{
        //recorder.stop();
    });
    obs.on("OBS_WEBSOCKET_OUTPUT_PAUSED", ()=>{
        recorder.pause();
    });
    obs.on("OBS_WEBSOCKET_OUTPUT_RESUMED", ()=>{
        recorder.play();
    });
}

/* RECORDER CONTROL */
{
    recorder.channels = [   {
                                name : "ROBOT X",
                                target : robots[0],
                                zero : 0
                            },
                            {
                                name : "ROBOT Y",
                                target : robots[1],
                                zero : 0
                            },
                            ...camera.controllable.map(name=>{return {
                                name,
                                target : camera,
                                zero : {
                                    pan : 0.5, 
                                    tilt : 0.5, 
                                    zoom : 0, 
                                    iris : 0
                                }
                            }})
                        ];

    recorder.on("play", ({c:eventDesc, v:value})=>{
        if(camera.controllable.includes(eventDesc)){
            camera.inject(value);
        }else if(eventDesc == "ROBOT X" && robots[0].playMode){
            robots[0].inject(Buffer.from(value));
        }else if(eventDesc == "ROBOT Y" && robots[1].playMode){
            robots[1].inject(Buffer.from(value));
        }
    });

    recorder.on("lastFrame", async ()=>{
        await obs.changeScene("Scène 2");
        await obs.stopRecord();
        await pWait(5000);
        await obs.changeScene("Scène");
        await pWait(500);
        await Promise.all([camera.reset(), robots[0].reset(), robots[1].reset()]);
        await pWait(1000);
        await obs.startRecord();
        await pWait(1000);
    });

    camera.on("request", event=>{
        if( (
            obs.status == OBS.OBSStatus.OBS_WEBSOCKET_OUTPUT_RESUMED ||
            obs.status == OBS.OBSStatus.OBS_WEBSOCKET_OUTPUT_STARTED)
            )
        {
            const [name] = event.match(/(#[A-Za-z]+)/);
            recorder.rec({
                name,
                value : event
            });
        }
    });


    robots[0].on("request", event=>{
        if( obs.status == OBS.OBSStatus.OBS_WEBSOCKET_OUTPUT_RESUMED ||
            obs.status == OBS.OBSStatus.OBS_WEBSOCKET_OUTPUT_STARTED)
        {
            recorder.rec({
                name : "ROBOT X",
                value : event
            });
        }
    });


    robots[1].on("request", event=>{
        if( obs.status == OBS.OBSStatus.OBS_WEBSOCKET_OUTPUT_RESUMED ||
            obs.status == OBS.OBSStatus.OBS_WEBSOCKET_OUTPUT_STARTED)
        {
            recorder.rec({
                name : "ROBOT Y",
                value : event
            });
        }
    });
}

/* GAMEPAD CONTROL */
{

    gamepad.on("JOYSTICK_LEFT_HORIZONTAL", event => {
        if(!robots[0].playMode){
            robots[0].speed(robots[0].conf.reverseCtrl * (event.target.getValue() * 2 - 1));    
        }
    });

    gamepad.on("JOYSTICK_LEFT_VERTICAL", event => {
        if(!robots[1].playMode){
            robots[1].speed(robots[1].conf.reverseCtrl *  (event.target.getValue() * 2 - 1));
        }
    });

    gamepad.on("JOYSTICK_RIGHT_HORIZONTAL", event => {
        camera.setPanTiltSpeed(camera.conf.panReverseCtrl ? 1-event.target.getValue() : event.target.getValue(), camera.tilt);
    });

    gamepad.on("JOYSTICK_RIGHT_VERTICAL", event => {
        camera.setPanTiltSpeed(camera.pan, camera.conf.tiltReverseCtrl ? 1-event.target.getValue() : event.target.getValue());
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

    gamepad.on("BUTTON_HOME", event=>{
        if(event.target.getValue() == 1){
            robots[0].reset();
            robots[1].reset();
            camera.reset();    
        }
    });

    gamepad.on("BUTTON_SELECT", event=>{
        if(event.target.getValue() == 1){
            robots[0].setZero();
            robots[1].setZero();
            camera.setZero();
        }
    });

    gamepad.on("BUTTON_B", event=>{
        
        if(event.target.getValue() == 1){
            obs.toggleRecord();
        }
    });
}

/* ON CLOSE */
{
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
}
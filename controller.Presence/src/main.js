//import Gamepad from "./Gamepad";
import sdl from '@kmamal/sdl';
import Enum from 'enum';
import UI from "./UI";
import config from "./config.js";
import PTZController from "./PTZController";
import FestoController from "./FestoController";
import DMX from "./DMX";
import OBS from "./OBS";
import {wait} from "./common/Tools.js";
import Gamepad from "./Gamepad";
import Player from "./Player";
import Timeline from "./Timeline";
import {lerp} from "./common/Math.js";
import dialog from 'node-file-dialog';
import fs from 'node:fs';

process.title = config.window.title;

const window = sdl.video.createWindow(config.window);

const timeline = new Timeline({
    ...config.TIMELINE, 
    log : config.TIMELINE.log ? (...data)=>console.log(`TIMELINE ${config.TIMELINE.name} : `, ...data) : ()=>{}
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
camera.on('connect', async ()=>{
     await obs.changeScene("Scène");
     await wait(1000);
     camera.trigger("ready");
});

const obs = new OBS({
    ...config.OBS, 
    log : config.OBS.log ? (...data)=>console.log(`OBS ${config.OBS.name} : `, ...data) : ()=>{}
});


const player = new Player({
    ...config.PLAYER, 
    log : config.PLAYER.log ? (...data)=>console.log(`PLAYER ${config.CAMERA.name} : `, ...data) : ()=>{}
})

const ui = new UI(window, gamepad, robots, camera, timeline, obs);


/* UI CONTROL */
{
    ui.onButtonEvent(async (event)=>{
        if(event.target == "robot"){
            if(event.eventName == "connection"){
                robots[event.id].connect();
            }else if(event.eventName == "HOME"){
                await robots[event.id].homing();
            }else if(event.eventName == "ZERO"){
                robots[event.id].setZero();
            }
        }
        else if(event.target == "camera"){
            if(event.eventName == "connection"){
                camera.connect();
            }
            else if(event.eventName == "ZERO"){
                camera.setZero()
            }
        } 
        else if(event.target == "timeline"){
            if(event.eventName == "REC"){
                await obs.startRecord();
            }
            else if(event.eventName == "STOP"){
                timeline.stop();
                await obs.stopRecord();
            }


            else if(event.eventName == "load"){
                dialog({type:'open-file'})
                    .then(([dir]) => {
                        timeline.channels = JSON.parse(fs.readFileSync(dir, "utf8")).map(item =>{
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
                const chan = timeline.channels.find(({name})=>name == event.eventName);
                chan.target.nextMode();
            }
        } 
    });
}

/* timeline CONTROL */
{
    timeline.channels = [   {
                                name : "ROBOT X",
                                target : robots[0],
                                zero : 0
                            },
                            {
                                name : "ROBOT Y",
                                target : robots[1],
                                zero : 0
                            },
                            {
                                name : "CAMERA",
                                target : camera,
                                zero : {
                                    pan : 0.5, 
                                    tilt : 0.5, 
                                    zoom : 0, 
                                    iris : 0
                                }
                            }
                        ];

    timeline.on("trig", ({c:eventDesc, v:value})=>{
        switch(eventDesc){
            case 0 :
                robots[0].isConnected && robots[0].inject(value);
            break;
            case 1 :
                robots[1].isConnected && robots[1].inject(value);
            break;
            case 2 :
                camera.isConnected && camera.inject(value);
            break;
        }
    });
    camera.on("request", event=>{
        if(!timeline.isRecording)return;
        timeline.rec(2, event);
    });

    robots[0].on("request", event=>{
        if(!timeline.isRecording)return;
        timeline.rec(0, event);
    
    });

    robots[1].on("request", event=>{
        if(!timeline.isRecording)return;
        timeline.rec(1, event);
    });

    timeline.on("endRecord", async ()=>{
        await obs.stopRecord();
        await Promise.all([camera.reset(), robots[0].reset(), robots[1].reset()]);
        timeline.stop();
    });

    timeline.on("lastFrame", async ()=>{
        await obs.changeScene("Black");
        await wait(5000);
        await obs.stopRecord();
        timeline._hasToRun = false;
        timeline.cursorAt = 0;
        await wait(1000);
        await Promise.all([camera.reset(), robots[0].reset(), robots[1].reset()]);
        await wait(1000);
        await player.play("play");
        await obs.changeScene("Scène");
        await obs.startRecord();
    });
}

/* OBS CONTROL */
{
    obs.on("OBS_WEBSOCKET_OUTPUT_STARTED", ()=>{
        timeline.start();
    });

    obs.on("OBS_WEBSOCKET_OUTPUT_STOPPED", ()=>{
        //timeline.stop();
    });
}

/* GAMEPAD CONTROL */
{
    gamepad.on("JOYSTICK_LEFT_HORIZONTAL", event => {
        if(!robots[0].isPlayMode){
            robots[0].speed(robots[0].conf.reverseCtrl * (event.target.getValue() * 2 - 1));    
        }
    });

    gamepad.on("JOYSTICK_LEFT_VERTICAL", event => {
        if(!robots[1].isPlayMode){
            robots[1].speed(robots[1].conf.reverseCtrl *  (event.target.getValue() * 2 - 1));
        }
    });

    gamepad.on("JOYSTICK_RIGHT_HORIZONTAL", event => {
        if(!camera.isPlayMode){
            camera.setPanTiltSpeed(camera.conf.panReverseCtrl ? 1-event.target.getValue() : event.target.getValue(), camera.tilt);
        }
    });

    gamepad.on("JOYSTICK_RIGHT_VERTICAL", event => {
        if(!camera.isPlayMode){
            camera.setPanTiltSpeed(camera.pan, camera.conf.tiltReverseCtrl ? 1-event.target.getValue() : event.target.getValue());
        }
    });

    gamepad.on("TRIGGER_LEFT", event => {
        if(!camera.isPlayMode){
            camera.setZoom( lerp(0.5, 1, event.target.getValue()));
        }
    });

    gamepad.on("TRIGGER_RIGHT", event => {
        if(!camera.isPlayMode){
            camera.setZoom( lerp(0.5, 0, event.target.getValue()))
        }
    });

    let irisRun;
    gamepad.on("BUTTON_TRIGGER_LEFT", event => {
        if(!camera.isPlayMode){
            clearInterval(irisRun);
            if(event.target.getValue() != 0){
                irisRun = setInterval(()=>{
                    camera.setIris(-1 * event.target.getValue() * 0.05);    
                }, 50);
            }
        }
    });

    gamepad.on("BUTTON_TRIGGER_RIGHT", event => {
        if(!camera.isPlayMode){
            clearInterval(irisRun);
            if(event.target.getValue() != 0){
                irisRun = setInterval(()=>{
                    camera.setIris(event.target.getValue() * 0.1);    
                }, 50);
            }
        }
    });

    gamepad.on("BUTTON_HOME", event=>{

        if(event.target.getValue() == 1){
            if(!robots[0].isPlayMode){
                robots[0].reset();
            }
            if(!robots[1].isPlayMode){
                robots[1].reset();
            }
            if(!camera.isPlayMode){
                camera.reset();    
            }
        }
    });

    gamepad.on("BUTTON_SELECT", event=>{
        if(event.target.getValue() == 1){
            if(!robots[0].isPlayMode){
                robots[0].setZero();
            }
            if(!robots[1].isPlayMode){
                robots[1].setZero();
            }
            if(!camera.isPlayMode){
                camera.setZero();
            }
        }
    });

    // gamepad.on("BUTTON_B", event=>{
    //     if(event.target.getValue() == 1){
    //         obs.toggleRecord();
    //     }
    // });
}


/* ON EVERYTHING IS READY */
{
    Promise.all([robots[0].isReady,robots[1].isReady,camera.isReady])
    .then(async ()=>{
        console.log("OK TO GO");
        if(config.APP.autoPlay){
            timeline.channels = JSON.parse(fs.readFileSync(config.APP.perfFile, "utf8")).map(item =>{
                if(item.name == "ROBOT X"){
                    item.target = robots[0]
                }else if(item.name == "ROBOT Y"){
                    item.target = robots[1]
                }else{
                    item.target = camera
                }
                return item;
            });
            const chan = timeline.channels.map(({target})=>target.nextMode());
            await wait(1000);
            await Promise.all([camera.reset(), robots[0].reset(), robots[1].reset()]);
            await wait(1000);
            await obs.startRecord();
        }
    });
}



/* ON CLOSE */
{
    const terminate = async ()=>{
        await player.close();
        await obs.close();
        await robots[0].close();
        await robots[1].close();
        await camera.close();
        await ui.close();
        await timeline.close();
        await gamepad.close();
        process.exit();
    }

    process.on('SIGINT', terminate);
    window.on('close', terminate);
}
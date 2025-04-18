#!/usr/local/bin/node
import Gamepad from "./Gamepad";
import PTZController from "./PTZController";


process.title = "controllerPTZ";
process.on('SIGINT', async () => {
  await gamepad.close();
  await camera.close();
  process.exit()
});


const camera = new PTZController("192.168.0.10");
const gamepad = new Gamepad();
  gamepad.onJoystick(Gamepad.JOYSTIC_DESC.RIGHT, async event => {
    await camera.setPanTiltSpeed(event.data.horizontal, event.data.vertical).then((...data)=>{
      if(data[0] !== false)
        console.log(data)
    }).catch(error=>{
      console.log(error);
    });
  //camera.setZoom(event.data.horizontal);
});

camera.getPanTiltZoomFocusIris()
//import Gamepad from "./Gamepad";
import sdl from '@kmamal/sdl';
import Enum from 'enum';
import UI from "./UI";
import config from "./config.js";
import FestoController from "./FestoController";

process.title = config.window.title;

const window = sdl.video.createWindow(config.window);

const robots = [
  new FestoController(config.robots[0]),
  new FestoController(config.robots[1])
];

const ui = new UI(window, config, robots);
ui.onButtonEvent((event)=>{
    event.target.out.get(event.eventName)?.toggle();
});

const terminate = async ()=>{
  await ui.close();
  await robots[0].close();
  //await robots[1].close();
  
  process.exit();
}

//robots[0].connect("10.211.55.2", 5000);

// setInterval(()=>{
//   robots[0].speed(Math.random() * 2 - 1)
// }, 500);


process.on('SIGINT', terminate);
window.on('close', terminate);

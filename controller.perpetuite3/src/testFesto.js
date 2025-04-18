import FestoController from "./FestoController";
import {wait} from './common/Tools.js';

let xAxis;

process.title = "controller.festo";
process.on('SIGINT', async () => {
  xAxis.close();
  
  process.exit()
});


const main = async ()=>{
  xAxis = new  FestoController('169.254.80.39', 502);
  xAxis.startPolling();
  await loop();
}


const loop = async ()=>{
  xAxis.speed(1);
  await wait(1000)
  xAxis.speed(0);
  await wait(1000)
  xAxis.speed(-1);
  await wait(1000);
  xAxis.speed(0);
  await wait(1000);
  return loop();
}

main()
  .then(()=>{
    console.log('finish')
  })
  .catch((error)=>{
    console.log("error", error)
  });
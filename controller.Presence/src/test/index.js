import { wait } from '../common/Tools.js';
import { hrtime } from 'node:process';
import { NANO_TO_MILLIS, MILLIS_TO_NANO } from "../common/Constants.js";


const time = async (wait, iteration)=>{
	let t0 = hrtime.bigint();
	for(let t of new Array(iteration).fill(0)){
		await wait(wait);	
	}
	let t1 = hrtime.bigint();
	console.log(`duration of ${iteration} wait of ${wait}ms : ${Number(t1 - t0) * NANO_TO_MILLIS}`);
}



time(10, 100);
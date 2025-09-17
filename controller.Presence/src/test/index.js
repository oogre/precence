import { pWait, wait } from '../common/Tools.js';

import { hrtime } from 'node:process';
import { NANO_TO_MILLIS, MILLIS_TO_NANO } from "../common/Constants.js";



const time = async ()=>{

	let t0 = hrtime.bigint();
	for(let t of new Array(10).fill(0)){
		await pWait(100);	
	}

	let t1 = hrtime.bigint();

	console.log(`time for 100 wait 10ms : ${Number(t1 - t0) * NANO_TO_MILLIS}`);

}

time();
import net from 'net';
import Enum from 'enum';
import { Buffer } from 'node:buffer';

import ModBus from './ModBus.js';

export default class FestoController extends ModBus{
	static RobotStatus = new Enum(['NOT_CONNECTED', 'NOT_HOMED', 'RUNNING', 'ERROR']) 
	constructor(conf){
		super();
		this.conf = conf;
		this.conf.status = FestoController.RobotStatus.NOT_CONNECTED;
		
		this.out.get("OPM1").toggle();
		this.out.get("HALT").toggle();
		this.out.get("STOP").toggle();
		this.out.get("ENABLE").toggle();
	}
	
	async close(){
		if(this.isPolling){
			this.stopPolling();
			this.speed(0);
			await this.send();
		}
		super.close();
	}

	homing(){
		this.out.get("HOME").toggle();
	}

	speed(value){
		//converter takes value [-1->1] in multiple of 1/8th 
		const converter = value => Math.round((value) * 8) / 8;
		value = converter(value);

		if(Math.abs(value*0x64) == this.in.get("SPEED")){
			console.log(".");
			return;
		}

		if(value > 0){
			// GO FURTHER TO HOME
			this.out.get("POSITION").setValue(this.conf.maxPos);
		}else{
			// GO CLOSET TO HOME
			this.out.get("POSITION").setValue(0);
			value = Math.abs(value);
		}
		this.out.get("SPEED").setValue(value * 0x64);

		if(!this.out.get("START").getValue()){
			this.out.get("START").toggle();	
		}
	}
}

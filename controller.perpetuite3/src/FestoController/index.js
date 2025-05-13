import net from 'net';
import Enum from 'enum';
import { Buffer } from 'node:buffer';

import ModBus from './ModBus.js';

export default class FestoController extends ModBus{
	static RobotStatus = new Enum(['NOT_CONNECTED', 'CONNECTED', 'ERROR']) 
	constructor(conf){
		super(conf.log ? (...data)=>console.log(`Robot ${conf.name} : `, ...data) : undefined);

		this.conf = conf;
		this.conf.status = FestoController.RobotStatus.NOT_CONNECTED;
		
		this.out.get("OPM1").toggle();
		this.out.get("HALT").toggle();
		this.out.get("STOP").toggle();
		this.out.get("ENABLE").toggle();

		this.in.get("POSITION").minimum = 0;
		this.in.get("POSITION").maximum = this.conf.maxPos;

		this.in.get("SPEED").minimum = 0;
		this.in.get("SPEED").maximum = this.conf.maxSpeed;

		this.out.get("DESTINATION").minimum = 0;
		this.out.get("DESTINATION").maximum = this.conf.maxPos;

		this.out.get("SPEED").minimum = 0;
		this.out.get("SPEED").maximum = this.conf.maxSpeed;
	}

	connect(host, port){
		super.connect(this.conf.host, this.conf.port, ()=>{
			this.conf.status = FestoController.RobotStatus.CONNECTED;
			setTimeout(()=>{
				this.homing();
			}, 100);
		}, (error)=>{
			this.conf.status = FestoController.RobotStatus.ERROR;
		});
	}
	async close(){
		if(this.isPolling){
			this.stopPolling();
			this.speed(0);
			await this.send();
		}
		super.close();
	}

	isError(){
		return this.status == ModBus.ModBusStatus.ERROR || this.conf.status == FestoController.RobotStatus.ERROR;
	}
	isConnected(){
		return this.conf.status == FestoController.RobotStatus.CONNECTED;
	}
	isReferenced(){
		return this.in.get("REF").getValue();
	}

	homing(){
		this.out.get("HOME").toggle();
	}

	speed(input){
		//converter takes value [-1->1] in multiple of 1/8th 
		const converter = value => Math.round((value) * 8) / 8;

		let value = converter(input);
		
		if(Math.abs(Math.abs(value) - this.out.get("SPEED").getValue()) < 0.05){
			return;
		}

		if(value > 0){
			// GO FURTHER TO HOME
			this.out.get("DESTINATION").setValue(this.conf.maxPos);
		}else{
			// GO CLOSET TO HOME
			this.out.get("DESTINATION").setValue(0);
			value = Math.abs(value);
		}

		this.out.get("SPEED").setValue(value * this.conf.maxSpeed);

		if(!this.out.get("START").getValue()){
			this.out.get("START").toggle();	
		}
		//this.log(this.out.get("SPEED").getValue());
	}
}

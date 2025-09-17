import net from 'net';
import Enum from 'enum';
import { Buffer } from 'node:buffer';
import {wait} from "../common/Tools.js";
import ModBus from './ModBus.js';
import { ChannelStatus as Channel_Status, nextChannel } from '../common/Constants.js';

export default class FestoController extends ModBus{
	static RobotStatus = new Enum(['NOT_CONNECTED', 'CONNECTING', 'CONNECTED', 'ERROR']) 
	static ChannelStatus = Channel_Status; 
	constructor(conf){
		super(conf);
		this.conf = conf;
		this.conf.status = FestoController.RobotStatus.NOT_CONNECTED;
		
		this.in.get("POSITION").minimum = 0;
		this.in.get("POSITION").maximum = this.conf.maxPos;

		this.in.get("SPEED").minimum = 0;
		this.in.get("SPEED").maximum = this.conf.maxSpeed;

		this.DEFAULT_OUT.get("DESTINATION").minimum = 0;
		this.DEFAULT_OUT.get("DESTINATION").maximum = this.conf.maxPos;

		this.DEFAULT_OUT.get("SPEED").minimum = 0;
		this.DEFAULT_OUT.get("SPEED").maximum = this.conf.maxSpeed;

		this._zero = 0;
		this._mode = FestoController.ChannelStatus.NONE;

		this._speed = 0;
		this._dest = 0;
		this._goTo = false;
		this._goHome = false;
	}

	get isError(){
		return this.status == ModBus.ModBusStatus.ERROR || this.conf.status == FestoController.RobotStatus.ERROR;
	}
	get isConnected(){
		return this.conf.status == FestoController.RobotStatus.CONNECTED;
	}
	get isConnecting(){
		return this.conf.status == FestoController.RobotStatus.CONNECTING;
	}
	get isReferenced(){
		return this.in.get("REF").getValue();
	}

	get zero (){
		return this._zero;
	}
	set zero (value){
		this._zero = value;
	}
	setZero(){
		this.zero = this.in.get("POSITION").getRawValue();
	}

	nextMode(){
		this._mode = nextChannel(this._mode);

		console.log(this._mode);
		if(this.isPlayMode){
			this.stopPolling();
		}else{
			this.startPolling();
		}
	}
	get mode(){
		return this._mode.value;
	}
	get isRecordMode(){
		return this._mode == FestoController.ChannelStatus.RECORD;
	}
	get isPlayMode(){
		return this._mode == FestoController.ChannelStatus.PLAY;
	}
	get isNoneMode(){
		return this._mode == FestoController.ChannelStatus.NONE;
	}
	
	async connect(host, port){
		try{
			this.conf.status = FestoController.RobotStatus.CONNECTING;
			await super.connect(this.conf.host, this.conf.port, this.conf.timeout, (error)=>{
				this.conf.status = FestoController.RobotStatus.ERROR;
			});

			this.startPolling();
			await wait(100);

			if(!this.isReferenced){
				await this.homing();	
			}
			this.conf.status = FestoController.RobotStatus.CONNECTED;
		}catch(error){
			console.log(error);
			this.conf.status = FestoController.RobotStatus.ERROR;
		}
	}

	async close(){
		if(this.isPolling){
			this.stopPolling();
			this.speed(0);
			await this.send();
		}
		super.close();
	}

	async homing(){
		this._goHome = true;
		while(true) {
			await wait(100);
			if(this.isReferenced){
				this._goHome = false;
				this.sendingHome = false;
				break;
			}
		}
	}
	
	async reset(){
		await this.goTo(this._zero);
	}

	async goTo(position){
		this._goTo = Math.max(0, Math.min(Math.floor(position), this.conf.maxPos));
		while(Math.abs(this._goTo - this.in.get("POSITION").getRawValue()) > 0){
			await wait(100);
		}
		this._goTo = false;
	}

	speed(input){
		//converter takes value [-1->1] in multiple of 1/8th 
		const converter = value => Math.round((value) * 8) / 8;
		let value = converter(input);
		if(value > 0){
			// GO FURTHER TO HOME
			this._dest = this.conf.maxPos;
		}else{
			// GO CLOSET TO HOME
			this._dest = 0;
			value = Math.abs(value);
		}
		this._speed = Math.floor(value * this.conf.maxSpeed);
	}
}

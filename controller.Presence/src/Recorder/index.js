import Enum from 'enum';
import fs from 'node:fs';
import { hrtime } from 'node:process';
import { prcTimeout, prcInterval } from 'precision-timeout-interval';
import { createCanvas } from '@napi-rs/canvas';
import {lerp} from "../common/Math.js";
import {pWait} from "../common/Tools.js";
import dialog from 'node-file-dialog';



export default class Recorder {
	static RecorderStatus = new Enum(['STOP', 'PAUSE', "RECORDING"]);
	constructor(conf){
		this.conf = conf;
		this.status = Recorder.RecorderStatus.STOP;
		this.log = (...data)=>console.log(`RECORDER : `, ...data);
		this.startRecordAt = hrtime.bigint();
		this.cursorAt = 0;
		this.loop = null;
		this._channels = [];
		this.handlers = {
			play : [],
			lastFrame : []
		};
		this.hasToSaveRecord = false
		this.DURATION_NORMALIZER = 0.001/this.conf.duration;
	}

	set channels(channels){
		this._channels = channels.map(({name, data=[], record=false})=>{
			const canvas = createCanvas(this.conf.duration, 16);
			const ctx = canvas.getContext('2d');
			data.map(({t, v})=>{
				ctx.save();
				ctx.translate(canvas.width * t * this.DURATION_NORMALIZER * 0.000001, 0);
				ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
				ctx.beginPath(); // Start a new path
				ctx.moveTo(0, 0); // Move the pen to (30, 50)
				ctx.lineTo(0, canvas.height * v); // Draw a line to (150, 100)
				ctx.stroke(); // Render the path
				ctx.restore();	
			});
			
			return {
				name,
				canvas,
				ctx : canvas.getContext('2d'),
				data,
				record
			}
		});
	}

	get channels(){
		return this._channels;
	}

	start(){
		this.hasToSaveRecord = false;
		this.workingOn = this._channels
			.map(({name, data})=>{
				return data.map(({t, v})=>{
					return {
						c : this._channels[this._channels.findIndex(({name:n})=>n == name)].name,
						t, 
						v
					}
				})
			}).flat()
			.sort(({t:a},{t:b}) => a-b);
		this.startRecordAt = hrtime.bigint();
		this.play();
	}
	play(){
		this.startRecordAt = hrtime.bigint() - BigInt(this.cursorAt);

		this.loop && this.loop.cancel();

		this.loop = prcInterval(50, async ()=>{
			this.cursorAt = Number(hrtime.bigint() - this.startRecordAt);
			if(this.currentTimeNormalized() >= 1){
				this.stop();
				this.trigger("lastFrame");
				return;
			}

			const index = this.workingOn.findLastIndex(({t})=> t < this.cursorAt + 50000000);
			if(index == -1){
				return
			}
			const toDoList = this.workingOn.splice(0, 1+index)
				.filter(({c}) => !this._channels.find(({name})=>name == c).record)
			
			let t = 0;
			for(const item of toDoList){
				this.cursorAt = Number(hrtime.bigint() - this.startRecordAt);
				const dT = (item.t - this.cursorAt)* 0.000001
				if(dT >=4 ){
					await pWait(dT);	
				}
				this.trigger("play", item);
			}
		});
	}
	pause(){
		this.loop && this.loop.cancel();	
	}
	stop(){
		this.pause();
		this.cursorAt = 0;
		
		if(!this.hasToSaveRecord)return;

		dialog({type:'save-file'})
			.then(([dir]) => {
				fs.writeFile(dir, JSON.stringify(
					this._channels.map(({name, data})=>{
						return {name, data}
					})
				), ()=>{});
			})
			.catch(err => console.log(err))
	}
	
	rec({name, value}){
		
		const chan = this._channels.find(({record, name:n})=>record && n==name)
    	if(!chan)return;
    	const time = Number(hrtime.bigint() - this.startRecordAt);
		chan.data.push({
			c : this._channels.findIndex(({name:n})=>n == name),
			t : time,
			v : value
		});
		this.hasToSaveRecord = true;

		chan.ctx.save();
		chan.ctx.translate(chan.canvas.width * time * this.DURATION_NORMALIZER * 0.000001, 0);
		chan.ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
		chan.ctx.beginPath(); // Start a new path
		chan.ctx.moveTo(0, 0); // Move the pen to (30, 50)
		chan.ctx.lineTo(0, chan.canvas.height * value); // Draw a line to (150, 100)
		chan.ctx.stroke(); // Render the path
		chan.ctx.restore();
	}

	currentTimeNormalized(){
		return this.cursorAt * this.DURATION_NORMALIZER * 0.000001;
	}

	on(description, callback){
		if(!Object.keys(this.handlers).includes(description))
			throw new Error(`onRecorder wait for Recorder.EVENT_DESC as first parameter. You give "${description}".`);
		if(typeof callback !== 'function')
			throw new Error(`onRecorder wait for function as second parameter. You give "${typeof callback}".`);
		this.handlers[description].push(callback);
		return this;
	}
	trigger(eventDesc, event){
		[...this.handlers[eventDesc]/*, ...this.handlers["*"]*/]
			.forEach(handler => {
				handler(event)
			});
	}

	async close(){
		return new Promise((resolve)=>{
			
			
	  			resolve();
	  		
		});
	}
}
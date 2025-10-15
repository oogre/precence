
import { wait, EventManager } from "../common/Tools.js";
import { NANO_TO_MILLIS, MILLIS_TO_NANO } from "../common/Constants.js";
import { createCanvas } from '@napi-rs/canvas';
import { hrtime } from 'node:process';
import dialog from 'node-file-dialog';
import fs from 'node:fs';


export class Recorder extends EventManager{
	constructor(...param){
		super(...param);
		this._defaultChannels = [];
		this._channels = [];
		this.workingOn = [];
		this.hasNewRecord = false
	}

	get channels(){
		return this._channels;
	}

	get isRecordMode(){
		return this.channels.map(({target:{isRecordMode}})=>isRecordMode).some((t)=>t);
	}

	get isNoneMode(){
		return this.channels.map(({target:{isNoneMode}})=>isNoneMode).every((t)=>t);
	}

	clear(id = -1){
		if(id >=0 && id < this.channels.length){
			this._channels[id] = this._defaultChannels[id]
			this.channels = this._channels;
		}else{
			this.channels = this._defaultChannels;	
		}
	}

	set channels(channels){
		this._channels = channels.map(({target, zero, name, data=[], record=false, play=false}, id)=>{
			const canvas = createCanvas(this.conf.duration, 16);
			const ctx = canvas.getContext('2d');
			const draw = async ({t})=>{
				ctx.save();
				ctx.translate(canvas.width * t * this.DURATION_NORMALIZER, 0);
				ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
				ctx.beginPath(); // Start a new path
				ctx.moveTo(0, 0); // Move the pen to (30, 50)
				ctx.lineTo(0, canvas.height); // Draw a line to (150, 100)
				ctx.stroke(); // Render the path
				ctx.restore();	
			}
			data.map(draw);
			target.zero = zero;
			return {
				zero,
				id,
				target,
				name,
				canvas,
				draw,
				data
			}
		});
	}

	set defaultChannels(channels){
		this._defaultChannels = channels;
		return channels;
	}

	async start(){
		this.hasNewRecord = false;

		this.workingOn = this._channels
			.map(({data})=>data).flat()
			.sort(({t:a},{t:b}) => a-b)
			//.filter(({t})=>t>this.cursorAt)/* <= LAST ADD  */
			;
	}

	async stop(){
		if(!this.hasNewRecord)return;
		return new Promise(resolve=>{
			dialog({type:'save-file'})
			.then(([dir]) => {
				fs.writeFile(dir, JSON.stringify(
					this._channels.map(({name, target:{zero}, data})=>{
						return {name, zero, data}
					})
				), ()=>{ resolve(); });
			})
			.catch(err => {
				this.log(err)
				resolve();
			});
		});
	}

	async loop(){
		const index = this.workingOn.findLastIndex(({t})=> t < this.cursorAt);
		if(index == -1){
			return
		}
		
		this.workingOn
			.splice(0, 1+index)
			.filter(({c}) => {
				return this._channels[c].target.isPlayMode
			})
			.forEach( item => {
				this.trigger("trig", item)
			});
	}

	

	rec(id, value){
		const chan = this._channels[id];
		if(!chan.target.isRecordMode) return;

		chan.data.push({
			c : chan.id,
			t : Date.now() - this.startRecordAt,
			v : value
		});
		const time = chan.data[chan.data.length-1].t;
		this.hasNewRecord = true;
		chan.draw({t:time});
	}
}
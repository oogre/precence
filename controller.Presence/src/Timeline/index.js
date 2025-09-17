import Enum from 'enum';
import { wait, EventManager} from "../common/Tools.js";
import { NANO_TO_MILLIS } from "../common/Constants.js";
import { hrtime } from 'node:process';

import {Recorder} from './Recorder.js'



export default class Timeline extends Recorder {
	static TimelineStatus = new Enum(['STOP', 'PAUSE', "RECORDING", "LOOPING"]);
	constructor(conf){
		super("Timeline", ["trig", "lastFrame", "endRecord"]);
		this.log = conf.log;
		this.conf = conf;
		this.status = Timeline.TimelineStatus.STOP;
		this.startRecordAt = Date.now();
		this.cursorAt = 0;
		this.cursorWas = 0;
		this.DURATION_NORMALIZER = 0.001/this.conf.duration;
		this.loopDelay = 30;
		this._hasToRun = false;
	}

	get cursor(){
		return this.cursorAt * this.DURATION_NORMALIZER;
	}

	updateCursor(){
		this.cursorAt = Date.now() - this.startRecordAt;
	}

	get hasToRun(){
		return this._hasToRun;
	}

	get isRecording(){
		return this.status == Timeline.TimelineStatus.RECORDING;
	}

	get isLooping(){
		return this.status == Timeline.TimelineStatus.LOOPING;
	}

	async start(){
		this.status = this.isRecordMode ? Timeline.TimelineStatus.RECORDING : Timeline.TimelineStatus.LOOPING;
		await super.start()
		this.startRecordAt = Date.now() - this.cursorAt;
		this._hasToRun = true;
		this.loop();
	}
	pause(){
		this.status = Timeline.TimelineStatus.PAUSE;
	}
	async stop(){
		this.pause();
		this._hasToRun = false;
		this.cursorAt = 0;
		await super.stop()
	}

	async loop(){
		this.updateCursor();
		if(this.cursor >= 1) {
			if(this.isLooping){
				return this.trigger("lastFrame");	
			}else{
				return this.trigger("endRecord");
			}
		}
		await super.loop()
		await wait(1);
		this._hasToRun && this.loop();
	}

	async close(){
		return new Promise((resolve)=>{
	  		resolve();
		});
	}
}
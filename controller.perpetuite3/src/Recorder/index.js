import Enum from 'enum';
import fs from 'node:fs';


const filePath = './data/record.json';

export default class Recorder {
	static RecorderStatus = new Enum(['STOP', 'PAUSE', 'PLAYING', "RECORDING"]);
	constructor(){
		this.status = Recorder.RecorderStatus.STOP;
		this.log = (...data)=>console.log(`RECORDER : `, ...data);
		this.startRecordAt = -1;
		this.data = JSON.parse(fs.readFileSync(filePath, "utf8"));
		this.lastRecordAt = this.data[this.data.length-1].t;

	}

	startRecord(name="*"){
		this.startRecordAt = new Date().getTime();
		this.status = Recorder.RecorderStatus.RECORDING;
	}

	stopRecord(name="*"){
		this.startRecordAt = -1;
		this.status = Recorder.RecorderStatus.STOP;

		JSON.stringify(this.data).length();
	}

	isPlaying(){
		return this.status == Recorder.RecorderStatus.PLAYING;
	}
	isRecording(){
		return this.status == Recorder.RecorderStatus.RECORDING;
	}

	update({id, time, value}){
		if(this.status != Recorder.RecorderStatus.RECORDING){
			return;
		}
		time -= this.startRecordAt;
		this.data.push({
			t : time,
			n : id,
			v : value.toFixed(4)
		});
	}

	async close(){
		return new Promise((resolve)=>{
			const file = JSON.stringify(this.data);
			fs.writeFile(filePath, file, () => {
	  			resolve();
	  		});
		});
	}
}
import { Client as OSC_Client } from 'node-osc';

export default class Player{
	constructor(conf){
		this.conf = conf;
		this.log = conf.log;
		this.oscClient = new OSC_Client(conf.host, conf.port);
	}
	async play(videoName){
		this.oscClient.send('/play', videoName, (err) => {
			if (err) console.error(err);
		});
	}

	async close(){
		return new Promise(r=>{
			this.oscClient.send('/kill', "", (err) => {
				if (err) console.error(err);
				this.oscClient.close();
				r();
			});
		});		
	}
}
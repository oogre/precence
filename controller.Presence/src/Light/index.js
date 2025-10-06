import Enum from 'enum';
import { wait, EventManager} from '../common/Tools.js';
import { Client as OSC_Client } from 'node-osc';


import { 
	connectOutput as MidiOutConnect,
	connectInput as MidiInConnect,
	sendCC as MidiSendCC,
} from './Midi/MidiTools.js';


const knobs = [{
	name : "pos",
	value : 0,
},{
	name : "amp",
	value : 0
},{
	name : "min",
	value : 0
},{
	name : "max",
	value : 0
}];


export default class LightController extends EventManager {
	static LightStatus = new Enum(['NOT_CONNECTED', "CONNECTING", "CONNECTED", 'ERROR']);
	
	constructor(conf){
		super("LightController", ["request", "connect", "ready"]);
		this.conf = conf;
		this.conf.status = LightController.LightStatus.NOT_CONNECTED;
		this.oscClient = new OSC_Client(conf.host, conf.port);

		this.displayInterface = MidiOutConnect(midiName);
		this.midiInterface = MidiInConnect(conf.name);
		this.midiInterface.onCC((channel, number, value, deltaTime)=>{
			if(!knobs[number]){
				return;
			}
			console.log(knobs[number]);
			
			knobs[number].value += value - 64
			knobs[number].value = Math.min(128, Math.max(0, knobs[number].value));
			MidiSendCC(this.displayInterface, 0, number, knobs[number].value);
		});


		// this.oscClient.send('/play', videoName, (err) => {
		// 	if (err) console.error(err);
		// });
	}

}
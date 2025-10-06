import Enum from 'enum';
import { wait, EventManager} from '../common/Tools.js';
import { Client as OSC_Client } from 'node-osc';


import { 
	connectInput as MidiInConnect
} from './Midi/MidiTools.js';



export default class LightController extends EventManager {
	static LightStatus = new Enum(['NOT_CONNECTED', "CONNECTING", "CONNECTED", 'ERROR']);
	
	constructor(conf){
		super(conf);
		this.conf = conf;
		this.conf.status = LightController.LightStatus.NOT_CONNECTED;
		this.oscClient = new OSC_Client(conf.host, conf.port);

		this.midiInterface = MidiInConnect(conf.name);
		this.midiInterface.onCC((channel, number, value, deltaTime)=>{
			console.log(channel, number, value);
		});


		// this.oscClient.send('/play', videoName, (err) => {
		// 	if (err) console.error(err);
		// });
	}

}
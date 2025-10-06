import Enum from 'enum';
import { wait, EventManager} from '../common/Tools.js';
import { Client as OSC_Client } from 'node-osc';
import { 
	connectOutput as MidiOutConnect,
	connectInput as MidiInConnect,
	sendCC as MidiSendCC,
} from './Midi/MidiTools.js';
import { ChannelStatus as Channel_Status, nextChannel } from '../common/Constants.js';

const knobs = [{
	name : "pos",
	value : 64,
},{
	name : "amp",
	value : 27
},{
	name : "min",
	value : 1
},{
	name : "max",
	value : 127
}];

export default class LightController extends EventManager {
	static LightStatus = new Enum(['NOT_CONNECTED', "CONNECTING", "CONNECTED", 'ERROR']);
	static ChannelStatus = Channel_Status; 
	constructor(conf){
		super("LightController", ["request", "connect", "ready"]);
		this.conf = conf;
		this.log = conf.log;
		this.oscClient = new OSC_Client(conf.host, conf.port);
		this.conf.status = LightController.LightStatus.CONNECTED;
		this._mode = LightController.ChannelStatus.NONE;

		try{
			this.displayInterface = MidiOutConnect(conf.name);
			this.midiInterface = MidiInConnect(conf.name);
			this.midiInterface.onCC((channel, number, value, deltaTime)=>{
				if(!knobs[number]){
					return;
				}
				knobs[number].value += value - 64
				knobs[number].value = Math.min(128, Math.max(0, knobs[number].value));
				MidiSendCC(this.displayInterface, 0, number, knobs[number].value);
				this.oscClient.send(`/${knobs[number].name}`, knobs[number].value, (err) => {
					if (err) console.error(err);
				});

				this.isRecordMode && this.trigger("request", {
					name : `/${knobs[number].name}`, 
					value : knobs[number].value
				});
			});
		}catch(error){
			this.log(error);
		}
	}

	inject({name, value}){
		this.oscClient.send(name, value, (err) => {
			if (err) console.error(err);
		});
	}

	nextMode(){
		this._mode = nextChannel(this._mode);
	}
	get mode(){
		return this._mode.value;
	}
	get isRecordMode(){
		return this._mode == LightController.ChannelStatus.RECORD;
	}
	get isPlayMode(){
		return this._mode == LightController.ChannelStatus.PLAY;
	}
	get isNoneMode(){
		return this._mode == LightController.ChannelStatus.NONE;
	}

}
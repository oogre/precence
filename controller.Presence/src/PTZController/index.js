import Enum from 'enum';
import HTTPRoutine from "./HTTPRoutine.js";
import {lerp, clamp} from "../common/Math.js";
import {wait} from "../common/Tools.js";
import { ChannelStatus as Channel_Status, nextChannel } from '../common/Constants.js';

//converter takes value [0->1] and turn it to [0/8 1/8 2/8 3/8 4/8 5/8 6/8 7/8 8/8]		
const converter = value => Math.round(value * 8) / 8;


export default class PTZController extends HTTPRoutine {
	static CameraStatus = new Enum(['NOT_CONNECTED', "CONNECTING", "CONNECTED", 'ERROR']);
	static ChannelStatus = Channel_Status; 
	constructor(conf){
		super(conf);
		this.conf = conf;
		this.conf.status = PTZController.CameraStatus.NOT_CONNECTED;
		this.controllable = this.out.controls
                        .filter(({data, visible}) => data.withParams)
                        .map(({data}) => `#${data.cmd.toUpperCase()}`)

        this.out.get("PAN_TILT").data.params.pan.value = 0.5;
		this.out.get("PAN_TILT").data.params.tilt.value = 0.5;

		this._mode = PTZController.ChannelStatus.NONE;

		setTimeout(()=>{
			this.conf.autoConnect && this.connect()
		}, 1000);
	}
	get isError(){
		return this.conf.status == PTZController.CameraStatus.ERROR;
	}
	get isConnected(){
		return this.conf.status == PTZController.CameraStatus.CONNECTED;
	}
	get isConnecting(){
		return this.conf.status == PTZController.CameraStatus.CONNECTING;
	}

	get zero (){
		return this._zero;
	}
	set zero (value){
		this._zero = value;
	}

	nextMode(){
		this._mode = nextChannel(this._mode);
	}
	get mode(){
		return this._mode.value;
	}
	get isRecordMode(){
		return this._mode == PTZController.ChannelStatus.RECORD;
	}
	get isPlayMode(){
		return this._mode == PTZController.ChannelStatus.PLAY;
	}
	get isNoneMode(){
		return this._mode == PTZController.ChannelStatus.NONE;
	}

	setZero(){
		const {
			pan : {value : pan}, 
			tilt : {value : tilt}, 
			zoom : {value : zoom}, 
			iris : {value : iris}
		} = this.in.get("GET_PAN_TILT_ZOOM_FOCUS_IRIS").data.params;
		this.zero = {pan,tilt,zoom,iris};
	}

	connect(){
		this.conf.status = PTZController.CameraStatus.CONNECTING;
		super.connect(this.conf.host, this.conf.port, ()=>{
			this.conf.status = PTZController.CameraStatus.CONNECTED;
			this.trigger("connect", "ok");
		}, (error)=>{
			this.conf.status = PTZController.CameraStatus.ERROR;
		});
	}

	

	async reset(){
		// REANIMATOR ANIMATION
		// for(let i = 0 ; i < 5 ; i ++){
		// 	this.out.get("RESET").data.params.pan.value = lerp(0.3, 0.7, Math.random());
		// 	//this.out.get("RESET").data.params.tilt.value = 0.5;
		// 	this.addRequest(this.out.get("RESET"));
		// 	await wait(500);
		// }
		// await wait(500);

		if(!this.isConnected) return;
		
		return new Promise(async resolve=>{
			this.out.get("ZOOM_POS").data.params.zoom.value = 1-this._zero.zoom;
			this.addRequest(this.out.get("ZOOM_POS"));

			this.out.get("POSITION").data.params.pan.value = 1-this._zero.pan;
			this.out.get("POSITION").data.params.tilt.value = 1-this._zero.tilt;
			this.addRequest(this.out.get("POSITION"));

			this.out.get("IRIS").data.params.iris.value = this._zero.iris;
			this.addRequest(this.out.get("IRIS"));

			while(true){
				const {
					pan : {value : pan}, 
					tilt : {value : tilt}, 
					zoom : {value : zoom}, 
					iris : {value : iris}
				} = this.in.get("GET_PAN_TILT_ZOOM_FOCUS_IRIS").data.params;
				if(
					Math.abs(this._zero.pan - pan)<0.1 &&
					Math.abs(this._zero.tilt - tilt)<0.1 &&
					Math.abs(this._zero.zoom - zoom)<0.1  &&
					Math.abs(this._zero.iris - iris)<0.1
				){
					break;
				}
			 	await wait(50);
			}
			resolve();
		});
	}
	setPanTiltSpeed(pan, tilt){
		const oPan = this.out.get("PAN_TILT").data.params.pan.value;
		const oTilt = this.out.get("PAN_TILT").data.params.tilt.value;

		const z = this.in.get("GET_PAN_TILT_ZOOM_FOCUS_IRIS").data.params.zoom.value;
		const amp = lerp(this.conf.panMaxSpeed, 0.2, Math.pow(z, 0.5));

		this.out.get("PAN_TILT").data.params.pan.amp = amp;
		this.out.get("PAN_TILT").data.params.tilt.amp = amp;
		
		const nPan = converter(pan);
		const nTilt = converter(tilt);

		if(oPan != nPan || oTilt != nTilt){
			this.out.get("PAN_TILT").data.params.pan.value = nPan;
			this.out.get("PAN_TILT").data.params.tilt.value = nTilt;
			this.addRequest(this.out.get("PAN_TILT"));
		}
	}
	setIris(value){
		const oValue = this.out.get("IRIS").data.params.iris.value;
		const nValue = clamp(oValue + value, 0, 1);
		this.out.get("IRIS").data.params.iris.value = nValue;
		this.addRequest(this.out.get("IRIS"));
		
	}
	setZoom(value){
		const oValue = this.out.get("ZOOM").data.params.zoom.value;

		const z = this.in.get("GET_PAN_TILT_ZOOM_FOCUS_IRIS").data.params.zoom.value;
		const amp = lerp(this.conf.panMaxSpeed, 0.2, Math.pow(z, 0.5));

		this.out.get("PAN_TILT").data.params.pan.amp = amp;
		this.out.get("PAN_TILT").data.params.tilt.amp = amp;

		const nValue = converter(value);
		if(oValue != nValue){
			this.out.get("ZOOM").data.params.zoom.value = nValue;
			this.addRequest(this.out.get("ZOOM"));
		}
	}
	setFocus(value){
		const oValue = this.out.get("FOCUS").data.params.focus.value;
		const nValue = converter(value);
		if(oValue != nValue){
			this.out.get("FOCUS").data.params.focus.value = nValue;
			this.addRequest(this.out.get("FOCUS"));
		}
	}
	get pan(){
		return this.out.get("PAN_TILT").data.params.pan.value;
	}
	get tilt(){
		return this.out.get("PAN_TILT").data.params.tilt.value;
	}

	close(){
		this.stopPolling();
		this.conf.status = PTZController.CameraStatus.NOT_CONNECTED;
	}

}
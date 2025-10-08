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

	static CameraSpeed = new Enum({'MOUNTAIN':0, 'SNAIL':1, 'WIND':2, 'ALPHAJET':3, "LIGHT":4});
	static SpeedValue = [0.1, 0.3, 0.5, 0.7, 1.0];


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

		this.isReady = new Promise(resolve=>{
			this.trigReady = resolve
		});
		this.on("ready", ()=>{
			this.trigReady()
		});
		setTimeout(()=>{
			this.conf.autoConnect && this.connect()
		}, 1000);

		this._checkPosition = {
			_data : new Array(4).fill(0.5),
			_timer : null,
			_isRunnable : ()=>{
				return Object.values(this._checkPosition._data).every(d=>d==0.5)
			},
			set pan(value) {
				this._data[0] = value;
				this.run();
			},
			set tilt(value) {
				this._data[1] = value;  
				this.run();
			},
			set zoom(value) {
				this._data[2] = value; 
				this.run();
			},
			set focus(value) {
				this._data[3] = value;
				this.run();
			},
			run : ()=>{
				if(!this._checkPosition._isRunnable()) return;

				clearTimeout(this._checkPosition._timer);
				this._checkPosition._timer = setTimeout(()=>{
					if(!this._checkPosition._isRunnable()) return;

					const {
						pan : {value : pan}, 
						tilt : {value : tilt}, 
						zoom : {value : zoom}, 
						focus : {value : focus}
					} = this.in.get("GET_PAN_TILT_ZOOM_FOCUS_IRIS").data.params;

					this.out.get("ZOOM_POS").data.params.zoom.value = 1-zoom;
					this.addRequest(this.out.get("ZOOM_POS"));

					this.out.get("POSITION").data.params.pan.value = 1-pan;
					this.out.get("POSITION").data.params.tilt.value = 1-tilt;
					this.addRequest(this.out.get("POSITION"));

					this.out.get("FOCUS_POS").data.params.focus.value = 1-focus;
					this.addRequest(this.out.get("FOCUS_POS"));

					console.log("RESET CAM POSITION")
				}, 1000);
			}
		}

		this._cameraSpeed = PTZController.CameraSpeed.WIND;
		this._lastPanTiltInput = [0.5, 0.5];
		this._lastZoomInput = 0.5;
		this._lastFocusInput = 0.5;
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
			focus : {value : focus}
		} = this.in.get("GET_PAN_TILT_ZOOM_FOCUS_IRIS").data.params;

		console.log({pan,tilt,zoom,focus})

		this.zero = {pan,tilt,zoom,focus};
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

			// this.out.get("IRIS").data.params.iris.value = 1-this._zero.iris;
			// this.addRequest(this.out.get("IRIS"));
			
			this.out.get("FOCUS_POS").data.params.focus.value = 1-this._zero.focus;
			this.addRequest(this.out.get("FOCUS_POS"));

			while(true){
				const {
					pan : {value : pan}, 
					tilt : {value : tilt}, 
					zoom : {value : zoom}, 
					focus : {value : focus}
				} = this.in.get("GET_PAN_TILT_ZOOM_FOCUS_IRIS").data.params;
				if(
					Math.abs(this._zero.pan - pan)<0.1 &&
					Math.abs(this._zero.tilt - tilt)<0.1 &&
					Math.abs(this._zero.zoom - zoom)<0.1  &&
					Math.abs(this._zero.focus - focus)<0.1
				){
					break;
				}
			 	await wait(50);
			}
			resolve();
		});
	}
	setPanTiltSpeed(pan, tilt, force=0){
		this._lastPanTiltInput = [pan, tilt];

		const oPan = this.out.get("PAN_TILT").data.params.pan.value;
		const oTilt = this.out.get("PAN_TILT").data.params.tilt.value;

		this.out.get("PAN_TILT").data.params.pan.amp = PTZController.SpeedValue[this._cameraSpeed.value];
		this.out.get("PAN_TILT").data.params.tilt.amp = PTZController.SpeedValue[this._cameraSpeed.value];
		
		const nPan = converter(pan);
		const nTilt = converter(tilt);

		if(force || oPan != nPan || oTilt != nTilt){
			this.out.get("PAN_TILT").data.params.pan.value = nPan;
			this.out.get("PAN_TILT").data.params.tilt.value = nTilt;
			this.addRequest(this.out.get("PAN_TILT"));

			this._checkPosition.pan = nPan;
			this._checkPosition.tilt = nTilt;
		}
	}
	// setIris(value){
	// 	const oValue = this.out.get("IRIS").data.params.iris.value;
	// 	const nValue = clamp(oValue + value, 0, 1);
	// 	this.out.get("IRIS").data.params.iris.value = nValue;
	// 	this.addRequest(this.out.get("IRIS"));	
	// 	this._checkPosition.iris = nValue;
	// }
	setZoom(value, force=0){
		this._lastZoomInput = value;
		const oValue = this.out.get("ZOOM").data.params.zoom.value;
		const nValue = converter(value);
		if(force || oValue != nValue){
			this.out.get("ZOOM").data.params.zoom.amp = PTZController.SpeedValue[this._cameraSpeed.value];
			this.out.get("ZOOM").data.params.zoom.value = nValue;
			this.addRequest(this.out.get("ZOOM"));
			// this.addRequest(this.out.get("PAN_TILT"));
			this._checkPosition.zoom = nValue;
		}
	}
	setFocus(value, force=0){
		this._lastFocusInput = value;
		const oValue = this.out.get("FOCUS").data.params.focus.value;
		const nValue = converter(value);
		if(force || oValue != nValue){
			this.out.get("FOCUS").data.params.focus.amp = PTZController.SpeedValue[this._cameraSpeed.value];
			this.out.get("FOCUS").data.params.focus.value = nValue;
			this.addRequest(this.out.get("FOCUS"));
			this._checkPosition.focus = nValue;
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

	nextSpeed(){
		this._cameraSpeed = PTZController.CameraSpeed.get( Math.min(this._cameraSpeed.value+1, PTZController.CameraSpeed.enums.length-1));
		console.log("CAMERA", this._cameraSpeed.key);
		this.setPanTiltSpeed(...this._lastPanTiltInput, 1);
		this.setZoom(this._lastZoomInput, 1);
		this.setFocus(this._lastFocusInput, 1);
	}
	
	prevSpeed(){
		this._cameraSpeed = PTZController.CameraSpeed.get( Math.max(this._cameraSpeed.value-1, 0));
		console.log("CAMERA", this._cameraSpeed.key);
		this.setPanTiltSpeed(...this._lastPanTiltInput, 1);
		this.setZoom(this._lastZoomInput, 1);
		this.setFocus(this._lastFocusInput, 1);
	}

}
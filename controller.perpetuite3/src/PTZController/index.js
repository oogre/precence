import Enum from 'enum';
import HTTPRoutine from "./HTTPRoutine.js";

//converter takes value [0->1] and turn it to [0/8 1/8 2/8 3/8 4/8 5/8 6/8 7/8 8/8]		
const converter = value => Math.round(value * 8) / 8;


export default class PTZController extends HTTPRoutine {
	static CameraStatus = new Enum(['NOT_CONNECTED', 'RUNNING', 'ERROR']);
	constructor(conf){
		super(conf.log ? (...data)=>console.log(`CAMERA ${conf.name} : `, ...data) : undefined);
		this.conf = conf;
		this.conf.status = PTZController.CameraStatus.NOT_CONNECTED;
	}
	isError(){
		return this.conf.status == PTZController.CameraStatus.ERROR;
	}
	isConnected(){
		return this.conf.status == PTZController.CameraStatus.CONNECTED;
	}

	connect(){
		super.connect(this.conf.host, this.conf.port, ()=>{
			this.conf.status = PTZController.CameraStatus.CONNECTED;
		}, (error)=>{
			this.conf.status = PTZController.CameraStatus.ERROR;
		});
	}
	setPanTiltSpeed(pan, tilt){
		const oPan = this.out.get("PAN_TILT").data.params.pan.value;
		const oTilt = this.out.get("PAN_TILT").data.params.tilt.value;

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
		const nValue = converter(value);
		if(oValue != nValue){
			this.out.get("IRIS").data.params.iris.value = nValue;
			this.addRequest(this.out.get("IRIS"));
		}
	}
	setZoom(value){
		const oValue = this.out.get("ZOOM").data.params.zoom.value;
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
import Enum from 'enum';
import got from 'got';

import Param from './Param.js';
import Control from './Control.js';
import config from "../config.js";

const Controls = {
	PanTiltSpeed : new Control("PTS", 
		new Param("pan", 3, 97), 
		new Param("tilt", 3, 97)
	).setter(),
	Zoom : new Control("Z", 
		new Param("zoom", 1, 99)
	).setter(),
	Focus : new Control("F", 
		new Param("focus", 0X555, 0XFFF, 16, 3)
	).setter(),
	Iris : new Control("I", 
		new Param("iris", 1, 99)
	).setter(),
	GetPanTiltZoomFocusIris : new Control("PTD", 
		new Param("pan", 0x0000, 0xFFFF, 16, 4), 
		new Param("tilt", 0x0000, 0xFFFF, 16, 4), 
		new Param("zoom", 0x000, 0x3E7, 16, 3),
		new Param("focus", 0x00, 0x63, 16, 2),
		new Param("iris", 0x00, 0xFF, 16, 2)
	).getter(),
	GetGainColorTemperatureShutterND : new Control("PTG").getter(),
};

export default class PTZController{
	static CameraStatus = new Enum(['NOT_CONNECTED', 'RUNNING', 'ERROR'])

	constructor(conf){
		this.conf = conf;
		this.conf.status = PTZController.CameraStatus.NOT_CONNECTED;
		const axesNames = this.conf.axes.map(({name})=>name);
		this.axesNameToId = Object.fromEntries(Object.entries(axesNames).map(([k, v]) => [v, parseInt(k)]));

	}

	connect(){
		this.conf.status = PTZController.CameraStatus.RUNNING;
		this.connection = setInterval(()=>{
			this.getPanTiltZoomFocusIris();  
		}, 100)
	}

	async close(){
		clearInterval(this.connection);
	}

	call(data){
		//console.log(`->`, `http://${this.conf.host}:${this.conf.port}/cgi-bin/aw_ptz?cmd=#${data.toRequest()}`);
		return got(`http://${this.conf.host}:${this.conf.port}/cgi-bin/aw_ptz`,{
			method: 'GET',
			searchParams : {
				cmd : `#${data.toRequest()}`,
				res : 1
			},
			timeout: {
				lookup: 100,
				connect: 50,
				socket: 1000,
				send: 1000,
				response: 1000
			}
		})
		.then( ({body}) => {
			//console.log("<-", body);
			return body;
		})
		.catch( error =>{
			console.log("x-", error.code );
		});
	}

	send(controls){
		if(this.conf.status != PTZController.CameraStatus.RUNNING){
			return;
		}
		if(Object.values(controls.params).every(param => !param.hasToUpdate())){
			return;
		}
		return this.call(controls)
		.then( data =>{
			if(!data) return;
			return data;
		});
	}

	setPanTiltSpeed(pan, tilt){
		//converter takes value [-1->1] and turn it to [0/8 1/8 2/8 3/8 4/8 5/8 6/8 7/8 8/8]
		const converter = value => Math.round((value * 0.5 + 0.5) * 8) / 8;
		const pPan = Controls.PanTiltSpeed.params.pan;
		const pTilt = Controls.PanTiltSpeed.params.tilt;

		pPan.value = converter(pan);
		pTilt.value = converter(tilt);
		this.send(Controls.PanTiltSpeed);
	}

	get pan(){
		return Controls.PanTiltSpeed.params.pan.value * 2 - 1 ;
	}
	get tilt(){
		return Controls.PanTiltSpeed.params.tilt.value * 2 - 1 ;
	}
	setZoom(zoom){
		Controls.Zoom.params.zoom.value = zoom;
		this.send(Controls.Zoom);
	}
	setFocus(focus){
		Controls.Focus.params.focus.value = focus;
		this.send(Controls.Focus);
	}
	setIris(iris){
		Controls.Iris.params.iris.value = iris;
		this.send(Controls.Iris)
	}
	getPanTiltZoomFocusIris(){
		this.send(Controls.GetPanTiltZoomFocusIris)
		.then( data =>{
			if(data){
				Controls.GetPanTiltZoomFocusIris.values = data.substr(3);
				this.conf.axes[this.axesNameToId.Pan].position = Controls.GetPanTiltZoomFocusIris.params.pan.value;
				this.conf.axes[this.axesNameToId.Tilt].position = Controls.GetPanTiltZoomFocusIris.params.tilt.value;
				this.conf.axes[this.axesNameToId.Zoom].position = Controls.GetPanTiltZoomFocusIris.params.zoom.value;
				this.conf.axes[this.axesNameToId.Iris].position = Controls.GetPanTiltZoomFocusIris.params.iris.value;
				this.conf.axes[this.axesNameToId.Focus].position = Controls.GetPanTiltZoomFocusIris.params.focus.value;
			}
		});
	}
}

// const cam = new PTZController(config.camera_simulation)
// cam.getPanTiltZoomFocusIris();
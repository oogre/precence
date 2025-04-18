import {EASYRequest} from '../common/HttpHelper.js';
import http from 'http';
import Param from './Param.js';
import Control from './Control.js';
import Enum from 'enum';

const Controls = {
	PanTiltSpeed : new Control("PTS", 
		new Param("pan", 3, 97), 
		new Param("tilt", 3, 97)
	),
	Zoom : new Control("Z", 
		new Param("zoom", 1, 99)
	),
	Focus : new Control("F", 
		new Param("focus", 0X555, 0XFFF, 16, 3)
	),
	Iris : new Control("I", 
		new Param("iris", 1, 99)
	),
	GetPanTiltZoomFocusIris : new Control("PTD", 
		new Param("pan", 0x0000, 0xFFFF, 16, 4), 
		new Param("tilt", 0x0000, 0xFFFF, 16, 4), 
		new Param("zoom", 0x555, 0xFFF, 16, 3),
		new Param("focus", 0x555, 0xFFF, 16, 3),
		new Param("iris", 0x555, 0xFFF, 16, 3)
	),
	GetGainColorTemperatureShutterND : new Control("PTG"),
};

class RequestHelper{
	constructor(command, pathResolver = ()=>{}){
		this.command = command;
		this.pathResolver = pathResolver;
		this.counter = 0;
	}
	async sender(control, withParams = true){
		this.counter ++;
		console.log("--->", control.toString(withParams), this.counter)
		let res;
		try{
			res = await this.request({
				...this.command, 
				path : this.pathResolver(control, this.command.path)
			});	
		}catch(e){
			res = e;
		}
		this.counter --;
		console.log("<---", this.counter)
		return res;
	}

	request(options){
		return new Promise((success, fail)=>{
			let output = '';
			const req = http.request(options, (res) => {
				res.setEncoding('utf8');
				res.on('data', (chunk) => {
					output += chunk;
				});
				res.on('end', () => {
					success(output);
				});
			});
			req.on('error', (error) => {
				fail(error);
			});
			req.end();
		});
	};
}

export default class PTZController extends RequestHelper {
	static CameraStatus = new Enum(['NOT_CONNECTED', 'RUNNING', 'ERROR'])
	constructor(conf){
		super({
				host: conf.host,
				port: conf.port,
				path: `/cgi-bin/aw_ptz?cmd=%23[DATA]&res=1`,
				method: 'GET',
				timeout: 1000,
			}, 
			(control, path)=>path.replace("[DATA]", control.toString(true))
		);
		this.conf = conf;
		this.conf.status = PTZController.CameraStatus.NOT_CONNECTED;
	}
	get pan(){
		return Controls.PanTiltSpeed.params.pan.value
	}
	get tilt(){
		return Controls.PanTiltSpeed.params.tilt.value
	}

	async connect(){
		const [] = await this.getPanTiltZoomFocusIris();
		this.conf.status = PTZController.CameraStatus.RUNNING;
	}
	async setPanTiltSpeed(pan, tilt){
		if(this.counter > 10) return {error : "overflow"};
		Controls.PanTiltSpeed.params.pan.value = Math.round(pan * 8)/8;
		Controls.PanTiltSpeed.params.tilt.value = Math.round(tilt * 8)/8;
		if( !Controls.PanTiltSpeed.params.pan.hasToUpdate() &&
		 	!Controls.PanTiltSpeed.params.tilt.hasToUpdate()
		){
			return false;
		}
		return this.sender(Controls.PanTiltSpeed);	
	}

	async close(){
		Controls.PanTiltSpeed.params.pan.value = 0.5;
		Controls.PanTiltSpeed.params.tilt.value = 0.5;
		return 	await this.sender(Controls.PanTiltSpeed);
	}
	async setZoom(zoom){
		Controls.PanTiltSpeed.params.zoom.value = zoom;
		return this.sender(Controls.PanTiltSpeed);
	}
	async setFocus(focus){
		Controls.Focus.params.focus.value = focus;
		return this.sender(Controls.Focus);
	}
	async setIris(iris){
		Controls.Iris.params.iris.value = iris;
		return this.sender(Controls.Iris);
	}

	async getPanTiltZoomFocusIris(){
		Controls.PanTiltSpeed.params.pan.value = "50";
		console.log(Controls.PanTiltSpeed.params.pan.value);

		const result = await this.sender(Controls.GetPanTiltZoomFocusIris, false);
		console.log(result);
		if(result.errno){
			return;
		}
		

		// const rawPan = result.substr(3, 4);
		// const rawTilt = result.substr(7, 4);
		// const rawZoom = result.substr(11, 3);
		// const rawFocus = result.substr(14, 3);
		// const rawIris = result.substr(17, 3);

		// Controls.GetPanTiltZoomFocusIris.params.pan.stringValue = result.substr(3, 4);
		// Controls.GetPanTiltZoomFocusIris.params.tilt.stringValue = result.substr(7, 4);
		// Controls.GetPanTiltZoomFocusIris.params.zoom.stringValue = result.substr(11, 3);
		// Controls.GetPanTiltZoomFocusIris.params.focus.stringValue = result.substr(14, 3);
		// Controls.GetPanTiltZoomFocusIris.params.iris.stringValue = result.substr(17, 3);

		// pTV80008000555555FFF
		// pTV[Data1][Data2][Data3][Data4][Data5]
		// [Data1] (Pan)
		// 0000h   ccwLimit
		// -
		// FFFFh   cwLimit

		// [Data2] (Tilt)
		// 0000h   UpLimit
		// -
		// FFFFh   DownLimit

		// [Data3] (Zoom)
		// 555h 	Wide
		// -
		// FFFh 	Tele

		// [Data4] (Focus)
		// 555h 	near
		// -
		// FFFh 	Far

		// [Data5] (Iris)
		// 555h	open
		// -
		// FFFh	close
		
	}
	async getGainColorTemperatureShutterND(){
		return this.sender("GetGainColorTemperatureShutterND");
	}
}





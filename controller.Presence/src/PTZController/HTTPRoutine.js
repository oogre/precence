import RequestHolder from "./RequestHolder.js";
import { pWait, EventManager} from '../common/Tools.js';
import { call, httpCall } from './tools.js';



export default class HTTPRoutine extends EventManager{
	constructor(conf){
		super("HTTPRoutine", ["request"]);
		this.log = conf.log;
		this.out = new RequestHolder(conf);
		this.in = new RequestHolder(conf);
		this.isPolling = false;
		this.errorHandler = ()=>{};
		this.requestWaitingList = [];
	}

	async connect(host, port, callback=()=>{}, error=()=>{}){
		this.host = host;
		this.port = port;
		this.errorHandler = error.bind(this);
		this.log("connect")
		try{
			const req = this.out.get("GET_PAN_TILT_ZOOM_FOCUS_IRIS").data.toRequest();
			const body = await call(`${this.host}:${this.port}`, req);
			this.log("<-", body);
			callback(body);
			this.startPolling();
			//this.requestWaitingList.push("OSA:87:21"); // set Freq to 24fps
			this.requestWaitingList.push("#D30"); // set IrisMode to manual
			this.requestWaitingList.push("#D11"); // set IrisMode to manual
		}catch(error){
			this.onError(error);
		}
	}

	startPolling(){
		this.log("startPolling")
		this.isPolling = true;
		this.send();
	}

	stopPolling(){
		this.isPolling = false;
	}

	inject(request){
		this.requestWaitingList.push(request);
	}
	
	addRequest(request){
		// const id = this.requestWaitingList.findIndex(req => req.startsWith(`#${request.data.cmd}`));
		// if(id>=0){
		// 	this.requestWaitingList[id] = request.data.toRequest();
		// }
		// else{
			this.requestWaitingList.push(request.data.toRequest());	
		// }
	}

	async send(loop = true){
		let request = this.out.get("GET_PAN_TILT_ZOOM_FOCUS_IRIS").data.toRequest();
		let autoRqst = true;
		if(this.requestWaitingList.length > 0){
			autoRqst = false;
			request = this.requestWaitingList.shift();	
		}

		if(!autoRqst){
			this.log(this.isPlayMode ? `~>` : `->`, request);
			this.isRecordMode && this.trigger("request", request);
		}

		const data = await call(`${this.host}:${this.port}`, request)

		if(autoRqst){
			this.in.get("GET_PAN_TILT_ZOOM_FOCUS_IRIS").data.values = data.substr(3);
		}else{
			this.log(`<-`, data);
		}

		// it cannot be faster than 40 send per second
		await pWait(50);
		loop && this.isPolling && this.send();
	}

	onError(err){
		this.stopPolling();
		this.log('Error : ', err);
		this.errorHandler(err);
	}

}
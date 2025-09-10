import net from 'net';
import { FHPP_OUT, FHPP_IN } from './FHPP.js';
import { Buffer } from 'node:buffer';
import { pWait, wait, EventManager } from '../common/Tools.js';
import { call } from './tool.js';
import Enum from 'enum';

export default class ModBus extends EventManager{
	static ModBusStatus = new Enum(['STOPED', 'RUNNING', 'ERROR']);
	
	constructor(conf){
		super("ModBus", ["request"])
		this.log = conf.log;
		this.lost = 0;
		this.out = new FHPP_OUT(conf.log);
		this.in = new FHPP_IN(conf.log);
		this.isPolling = false;
		this.status = ModBus.ModBusStatus.STOPED;
		this.client = new net.Socket();
		this.client.on('end', this.onEnd.bind(this));
		this.client.on('error', this.onError.bind(this));
		this.client.on('close', this.onClose.bind(this));
		
		this.readjustSpeedDelay = null;

		this.NULL_BUFFER = Buffer.from([0x43, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 ]);

		this.oldRequest = Buffer.from([]);
	}

	async connect(host, port, timeout, error=()=>{}){
		console.log(host, port);

		await Promise.race([
			new Promise(async (resolve, reject)=>{
				await wait(timeout);
				reject("timeout")
			}), 
			new Promise((resolve)=>{
				this.client.connect(port, host, () => resolve());
			})
		]);
		this.client.on('error', error.bind(this));
		this.client.on('close', error.bind(this));
		this.client.on('end', error.bind(this));
	}

	startPolling(){
		this.isPolling = true;
		this.status = ModBus.ModBusStatus.RUNNING;
		this.send();
	}

	stopPolling(){
		this.isPolling = false;
	}

	async inject(request){
		this.out.data = Buffer.from(request)
		this.log(`~>`, request);
		try{
			this.in.data = await call(this.client, request)
		}catch(error){
			console.log("ERROROR ");
			console.log(error);
		}
	}

	async send(loop = true){
		try{
			const request = Buffer.from([...this.out.data]);
			this.log(`->`, request);
			this.in.data = await call(this.client, request);
			//const rec = {...this.out};
			// rec.get("SPEED").setValue(  )

			//console.log(this.in.get("SPEED").getRawValue());

			this.isRecordMode && this.trigger("request", request);


		}catch(error){
			console.log("ERROROR ");
			console.log(error);
		}
		
		
		// this.log(`<-`, this.in.data);

		if(!this.isPlayMode){
			// Start and Home has to be strobed to be applied
			// So if one is UP this turn it down and send
			const [isStart, isHome] = [this.out.get("START").getValue(), this.out.get("HOME").getValue()];
			if(isStart || isHome){
				isStart && this.out.get("START").toggle();
				isHome && this.out.get("HOME").toggle();
				this.send(false);
			}

			// if( !this.readjustSpeedDelay && 
			// 	Math.abs(this.in.get("SPEED").getValue() - this.out.get("SPEED").getValue()) > 0.11
			// ){
			// 	this.readjustSpeedDelay = setTimeout(()=>{
			// 		this.out.get("START").toggle();
			// 		this.readjustSpeedDelay = null;
			// 	}, 40);
			// }
		}

		await pWait(50);
		// it cannot be faster than 50 send per second
		loop && this.isPolling && this.send();
	}

	close(){
		this.client.destroy();
	}

	onEnd(){
		this.stopPolling();
		this.log('disconnected from server');
		this.status = ModBus.ModBusStatus.STOPED;
	}
	onError(err){
		this.stopPolling();
		this.log('Error : ', err);
		this.status = ModBus.ModBusStatus.ERROR;
	}
	onClose () {
		this.stopPolling();
		this.log('socket closed');
		this.status = ModBus.ModBusStatus.STOPED;
	}
}
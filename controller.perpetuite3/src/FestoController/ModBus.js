import net from 'net';
import { FHPP_OUT, FHPP_IN } from './FHPP.js';
import { Buffer } from 'node:buffer';
import { wait } from '../common/Tools.js';
import Enum from 'enum';

export default class ModBus{
	static ModBusStatus = new Enum(['STOPED', 'RUNNING', 'ERROR']) 
	constructor(log = ()=>{}){
		this.log = log;
		this.outHeader = Buffer.from([0x00, 0X00, 0X00, 0X00, 0X00, 0X13, 0X00, 0X17, 0X00, 0X00, 0X00, 0X04, 0X00, 0X00, 0X00, 0X04, 0X08]);
		this.out = new FHPP_OUT(log);
		this.in = new FHPP_IN(log);
		this.isPolling = false;
		this.status = ModBus.ModBusStatus.STOPED;
		this.client = new net.Socket();
		this.client.on('data', this.onData.bind(this));
		this.client.on('end', this.onEnd.bind(this));
		this.client.on('error', this.onError.bind(this));
		this.client.on('close', this.onClose.bind(this));

		this.readjustSpeedDelay = null;
	}

	connect(host, port, callback=()=>{}, error=()=>{}){
		this.client.connect(port, host, () => {
			this.log(`connected to ${host} : ${port}`);
			callback();
			this.startPolling();
		});
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

	async send(loop = true){
		//this.log(`->`, this.out.data);
		
		//increment values of 2 firsts bytes of header
		this.outHeader.writeUInt16BE((this.outHeader.readUInt16BE(0)+1) % 0XFFFF);
		
		// prepare the waiter for the response
		this.waitForDataSuccess = null;
		this.waitForDataReject = null;
		this.waitForData = new Promise((resolve, reject)=>{
			this.waitForDataSuccess = resolve;
			this.waitForDataReject = reject;
		});

		// send and wait for the response
		this.client.write(Buffer.concat([this.outHeader, this.out.data]));

		try{		
			this.in.data = await this.waitForData;
			// /* FAKE REFERENCED FOR DEBUG */ this.in.get("REF").toggle();
			this.log(`<-`, this.in.data);
			this.status = ModBus.ModBusStatus.RUNNING;
			
			// Start and Home has to be strobed to be applied
			// So if one is UP this turn it down and send
			const [isStart, isHome] = [this.out.get("START").getValue(), this.out.get("HOME").getValue()];
			if(isStart || isHome){
				isStart && this.out.get("START").toggle();
				isHome && this.out.get("HOME").toggle();
				this.send(false);
			}

			let deltaV = Math.abs(this.in.get("SPEED").getValue() - this.out.get("SPEED").getValue());
			
			if(!this.readjustSpeedDelay && deltaV > 0.11){
				console.log(deltaV);
				this.readjustSpeedDelay = setTimeout(()=>{
					this.out.get("START").toggle();
					this.readjustSpeedDelay = null;
				}, 40);
			}

		}catch(error){
			this.log(error);
			this.status = ModBus.ModBusStatus.ERROR;

		}

		// it cannot be faster than 50 send per second
		await wait(20);
		loop && this.isPolling && this.send();
	}

	close(){
		this.client.destroy();
	}

	onData(data){
		const d = Buffer.copyBytesFrom(data, 9, 8);
		if(d.length != 8){
			setTimeout(()=>this.waitForDataReject("wrong response"), 1);	
		}else {
			setTimeout(()=>this.waitForDataSuccess(d), 1);	
		}
		
	}
	onEnd(){
		this.stopPolling();
		this.log('disconnected from server');
	}
	onError(err){
		this.stopPolling();
		this.log('Error : ', err);
	}
	onClose () {
		this.stopPolling();
		this.log('socket closed');
	}
}
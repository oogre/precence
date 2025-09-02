import dgram from "dgram";
import Enum from 'enum';
import { wait } from '../common/Tools.js';

const universeSize=512;

export default class DMX{
	static DMXStatus = new Enum(['NOT_CONNECTED', 'RUNNING', 'ERROR']) 
	constructor(conf){
		this.log = (conf.log ? (...data)=>console.log(`DMX ${conf.name} : `, ...data) : undefined);
		this.conf = conf;
		this.status = DMX.DMXStatus.NOT_CONNECTED;

		const datalen = universeSize;
		const firstChannel = 1;
		const bufferlen = 4/*header*/ + 6/*lanbox header*/ + datalen/*data*/ + 1/*trailer*/;
		const lngMess = 6/*lanbox header*/ + datalen;

		this.needSend = false;
		this.isPolling = false;
		this.data = Buffer.alloc(bufferlen);

		this.data.writeUInt8(0xC0, 0);
		this.data.writeUInt8(0xB7, 1);
		this.data.writeUInt8(0x0, 2);
		this.data.writeUInt8(0x0, 3);

		this.data.writeUInt8(0xCA, 4);
		this.data.writeUInt8(0XFE, 5);

		this.data.writeUInt8(lngMess & 0xFF00 >> 8, 6);
		this.data.writeUInt8(lngMess & 0x00FF >> 0, 7);

		this.data.writeUInt8(firstChannel & 0xFF00 >> 8, 8);
		this.data.writeUInt8(firstChannel & 0x00FF >> 0, 9);

		if((10+datalen)%2!=0){
			this.data.writeUInt8(0xFF, 10+datalen);
		}

		this.serverUDP = dgram.createSocket('udp4');
		
		this.serverUDP.on('error', (err) => {
			this.log(`serverUDP error:\n${err.stack}`);
			this.serverUDP.close();
		});

		this.serverUDP.on('message', (msg, rinfo) => {
			this.log(`serverUDP got: ${msg} from ${rinfo.address}:${rinfo.port}`);
		});

		this.serverUDP.on('listening', () => {
			const address = this.serverUDP.address();
			this.log(`serverUDP listening ${address.address}:${address.port}`);
		});
		// serverUDP.bind(3001);

		this.startPolling();
	}

	set(channel, value){
		if(!Number.isInteger(channel)){
			throw new Error(`set function of DMX class wait for integer as first paramater. You give "${channel}".`);
		}
		if(channel < 0 || channel > universeSize ){
			throw new Error(`set function of DMX class wait for first paramater to be a number between 0 and ${universeSize}. You give "${channel}".`);
		}
		if(!Number.isInteger(value)){
			throw new Error(`set function of DMX class wait for integer as second paramater. You give "${value}".`);
		}
		if(channel < 0 || value > 255 ){
			throw new Error(`set function of DMX class wait for second paramater to be a number between 0 and ${255}. You give "${value}".`);
		}

		this.data.writeUInt8(value, channel+10);
		this.needSend = true;
	}

	startPolling(){
		this.isPolling = true;
		this.status = DMX.DMXStatus.RUNNING;
		this.send();
	}

	async send(){
		if(this.needSend){
			this.log("->", this.data);
			this.serverUDP.send(this.data, this.conf.port, this.conf.host, (err)=>{
				this.log(err);
			});
			this.needSend = false;
		}
		
		await wait(20);
		this.isPolling && this.send();
	}
}

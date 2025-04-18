import net from 'net';
import Enum from 'enum';
import { Buffer } from 'node:buffer';

export default class FestoController {
	static RobotStatus = new Enum(['NOT_CONNECTED', 'NOT_HOMED', 'RUNNING', 'ERROR']) 
	constructor(conf){
		this.conf = conf;
		this.conf.status = FestoController.RobotStatus.NOT_CONNECTED;
		this.client = new net.Socket();
		this.client.on('data', this.onData.bind(this));
		this.client.on('end', this.onEnd.bind(this));
		this.client.on('error', this.onError.bind(this));
		this.client.on('close', this.onClose.bind(this));
		this.header = Buffer.from([0x00, 0X00, 0X00, 0X00, 0X00, 0X13, 0X00, 0X17, 0X00, 0X00, 0X00, 0X04, 0X00, 0X00, 0X00, 0X04, 0X08])
		this.data = Buffer.from([0x43, 0X07, 0X00, 0X64, 0x00, 0x00, 0x00, 0x00]);
		this._state;
		this.dataChangedHandlers = [];
	}

	connect(){
		this.client.connect(this.conf.port, this.conf.host, () => {
        	console.log(`connected to ${this.conf.host} : ${this.conf.port}`);
        	this.conf.status = FestoController.RobotStatus.NOT_HOMED;
        	this.startPolling(20);
        	this.speed(0);
		});
	}
	
	send(){
		//console.log(`->`, this.data);
		const data = Buffer.concat([this.header, this.data] );
		const res = this.client.write(data);
		this.header.writeUInt16BE((this.header.readUInt16BE(0)+1) % 0XFFFF);
		this.data.writeUInt8(0x07, 1);
	}
	
	onEnd(){
		this.conf.status = FestoController.RobotStatus.NOT_CONNECTED;
		console.log('disconnected from server');
	}
	get isReferenced(){
		return this._state.readUInt8(1) >> 7;
	}
	onData(data){
		this._state = Buffer.copyBytesFrom(data, 9, 8);
		if(!this.isReferenced){
			this.conf.status = FestoController.RobotStatus.NOT_HOMED;
		}else{
			this.conf.status = FestoController.RobotStatus.RUNNING;
		}

		this.conf.isReferenced = this._state.readUInt8(1) >> 7;
		this.conf.speed = this._state.readUInt8(3) / 0x65;
		this.conf.position = (this._state.readUInt8(6) << 8 | this._state.readUInt8(7)) / this.conf.maxPos;

		
		//console.log(`<-`, this._state, (this._state.readUInt8(6) << 8 | this._state.readUInt8(7)));
	}
	onError(err){
		this.conf.status = FestoController.RobotStatus.NOT_CONNECTED;
		console.log('Error : ', err);
	}
	onClose () {
		this.conf.status = FestoController.RobotStatus.NOT_CONNECTED;
    	console.log('socket closed');
	};
	startPolling(interval=100){
		clearInterval(this.polling);
		this.polling = setInterval(()=>this.send(), interval);
	}
	stopPolling(){
		clearInterval(this.polling);
	}
	close(){
		this.speed(0);
		this.send();
		this.client.destroy();
	}
	homing(){
		this.data.writeUInt8(0x03, 1);
	}
	speed(value){
		if(this.conf.status != FestoController.RobotStatus.RUNNING)
			return;
		if(!this.isReferenced)
			return
		if(value > 0){
			// FURTHEST RIGHT
			this.data.writeUInt8(0x00, 6);
			this.data.writeUInt8(this.conf.maxPos, 7);
		}else{
			// FURTHEST LEFT
			this.data.writeUInt8(0x00, 6);
			this.data.writeUInt8(0x00, 7);
			value = Math.abs(value);
		}
		this.data.writeUInt8(Math.floor(value*100), 3);
		this.data.writeUInt8(0x05, 1);
	}
}

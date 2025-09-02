import { Buffer } from 'node:buffer';
import { invlerp } from '../common/Math.js';

class FHPP{
	constructor(length, log){
		this.data = Buffer.alloc(length);
		this.log = log;
	}
	getByte(n){
		return this.data.readUInt8(n);
	}
	setByte(byte, n){
		this.data.writeUInt8(byte, n);
	}
	flipBitOfByte(byteId, bitId){
		this.setByte(this.getByte(byteId) ^ (1<<bitId), byteId);
	}
	getBitOfByte(byteId, bitId){
		return (this.getByte(byteId) & (1<<bitId)) >> bitId;
	}
	get(_name){
		this.dict = this.dict || {};
		if(!this.dict[_name]){
			this.dict[_name] = this.controls.find(({name})=>name==_name)
		}
		return this.dict[_name];
	}
}

export class FHPP_IN extends FHPP{
	constructor(log = ()=>{}){
		super(8, log);
		const self = this;
		this.controls = [{
			name : "FAULT",
			getValue (){ return self.getBitOfByte(0, 3); },
			visible : true,
			type : "checkBox"
		},{
			name : "WARN",
			getValue (){ return self.getBitOfByte(0, 2); },
			visible : true,
			type : "checkBox"
		},{
			name : "REF",
			getValue (){ return self.getBitOfByte(1, 7); },
			toggle (){ 
				return self.flipBitOfByte(1, 7);
			},
			visible : true,
			type : "checkBox"
		},{
			name : "SPEED",
			minimum : 0,
			maximum : 0,
			getValue (){ 
				return invlerp(this.minimum, this.maximum, self.getByte(3)); 
			},
			visible : true,
			type : "slider"
		},{
			name : "POSITION",
			minimum : 0,
			maximum : 0,
			getValue (){ 
				return invlerp(this.minimum, this.maximum, self.getByte(6) << 8 | self.getByte(7)); 
			},
			visible : true,
			type : "slider"
		}]
	}
}

export class FHPP_OUT extends FHPP{
	constructor(log = ()=>{}){
		super(8, log);
		
		const self = this;
		this.controls = [{
			name : "OPM2",
			getValue (){ return self.getBitOfByte(0, 7); },
			toggle (){ return self.flipBitOfByte(0, 7); },
			visible : false,
			type : "checkBox"
		},{
			name : "OPM1",
			getValue (){ return self.getBitOfByte(0, 6); },
			toggle (){ return self.flipBitOfByte(0, 6); },
			visible : false,
			type : "checkBox"
		},{
			name : "LOCK",
			getValue (){ return self.getBitOfByte(0, 5); },
			toggle (){ return self.flipBitOfByte(0, 5); },
			visible : false,
			type : "checkBox"
		},{
			name : "RESET",
			getValue (){ return self.getBitOfByte(0, 3); },
			toggle (){ return self.flipBitOfByte(0, 3); },
			visible : true,
			type : "checkBox"
		},{
			name : "BREAK",
			getValue (){ return self.getBitOfByte(0, 2); },
			toggle (){ return self.flipBitOfByte(0, 2); },
			visible : false,
			type : "checkBox"
		},{
			name : "STOP",
			getValue (){ return self.getBitOfByte(0, 1); },
			toggle (){ return self.flipBitOfByte(0, 1); },
			visible : true,
			type : "checkBox"
		},{
			name : "ENABLE",
			getValue (){ return self.getBitOfByte(0, 0); },
			toggle (){ return self.flipBitOfByte(0, 0); },
			visible : true,
			type : "checkBox"
		},{
			name : "CLEAR",
			getValue (){ return self.getBitOfByte(1, 6); },
			toggle (){ return self.flipBitOfByte(1, 6); },
			visible : false,
			type : "checkBox"
		},{
			name : "TEACH",
			getValue (){ return self.getBitOfByte(1, 5); },
			toggle (){ return self.flipBitOfByte(1, 5); },
			visible : false,
			type : "checkBox"
		},{
			name : "JOGN",
			getValue (){ return self.getBitOfByte(1, 4); },
			toggle (){ return self.flipBitOfByte(1, 4); },
			visible : false,
			type : "checkBox"
		},{
			name : "JOGP",
			getValue (){ return self.getBitOfByte(1, 3); },
			toggle (){ return self.flipBitOfByte(1, 3); },
			visible : false,
			type : "checkBox"
		},{
			name : "HOME",
			getValue (){ return self.getBitOfByte(1, 2); },
			toggle (){ return self.flipBitOfByte(1, 2); },
			visible : true,
			type : "checkBox"
		},{
			name : "START",
			getValue (){ return self.getBitOfByte(1, 1); },
			toggle (){ return self.flipBitOfByte(1, 1); },
			visible : true,
			type : "checkBox"
		},{
			name : "HALT",
			getValue (){ return self.getBitOfByte(1, 0); },
			toggle (){ return self.flipBitOfByte(1, 0); },
			visible : false,
			type : "checkBox"
		},{
			name : "SPEED",
			minimum : 0,
			maximum : 0,
			getValue (){ 
				return invlerp(this.minimum, this.maximum, self.getByte(3)); 
			},
			setValue (value){ 
				self.setByte(value, 3); 
			},
			visible : true,
			type : "slider"
		},{
			name : "DESTINATION",
			minimum : 0,
			maximum : 0,
			getValue (){ 
				return invlerp(this.minimum, this.maximum, self.getByte(4, 0) << 24 | self.getByte(5, 0) << 16 | self.getByte(6, 0) << 8 | self.getByte(7, 0)); 
			},
			setValue (value){ 
				self.setByte((value&0x000000FF)>> 0, 7); 
				self.setByte((value&0x0000FF00)>> 8, 6); 
				self.setByte((value&0x00FF0000)>>16, 5); 
				self.setByte((value&0xFF000000)>>24, 4); 
			},
			visible : true,
			type : "slider"
		}];
	}
}
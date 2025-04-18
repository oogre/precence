import { lerp, inverseLerp } from '../common/Math.js';
import {isNumber, isString} from '../common/Validators.js';


String.prototype.nf = function(lenght, prepend="0"){
	let output = this.valueOf();
	while(output.length<lenght){
		output = prepend + output;
	}
	return output;
}

export default class Param{
	constructor(name, min, max, base=10,len=2){
		if(!isString(name))
			throw new Error(`Param class constructor wait for Sting as first paramater. You give "${name}".`);
		if(!isNumber(min))
			throw new Error(`Param class constructor wait for Number as second paramater. You give "${min}".`);
		if(!isNumber(max))
			throw new Error(`Param class constructor wait for Number as third paramater. You give "${max}".`);
		if(!isNumber(base))
			throw new Error(`Param class constructor wait for Number as fourth paramater. You give "${base}".`);
		if(!isNumber(len))
			throw new Error(`Param class constructor wait for Number as fifth paramater. You give "${len}".`);
		this.name = name
		this.min = min;
		this.max = max;
		this.base = base;
		this.len = len;
		this._value = 0;
		this.lastValue = -1;
	}
	set value(v){
		let tempValue = v;
		if(isString(tempValue)){
			tempValue = parseInt(tempValue, this.base);
			tempValue = inverseLerp(this.min, this.max, tempValue);
			tempValue = Math.min(1, Math.max(0, tempValue));
		}
		if(isNaN(tempValue))
			throw new Error(`Param class convert wait for Number of "String form of Number" as paramater. You give "${v}".`);
		if(!isNumber(tempValue))
			throw new Error(`Param class convert wait for Number as paramater. You give "${v}".`);
		this._value = tempValue;
	}
	hasToUpdate(){
		return this.lastValue != this._value;
	}
	get value(){
		return this._value;
	}

	get stringValue(){
		this.lastValue = this._value;
		return Math.round(lerp(this.max, this.min, this._value)).toString(this.base).nf(this.len);
	}
};
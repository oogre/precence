import Param from './Param.js';
import {isString} from '../common/Validators.js';

export default class Control{
	constructor(cmd, ...params){
		if(!isString(cmd))
			throw new Error(`Control class constructor wait for String as first paramater. You give "${name}".`);
		if(!params.every(param => param instanceof Param))
			throw new Error(`Control class constructor wait only Param instance second and after paramaters. You give "${params}".`);
		this.params = {};
		params.forEach(param => {
			this.params[param.name] = param;
		});
		this.cmd = cmd;
		this.changeHandlers = [];
		this.withParams = true;
	}
	getter(){
		this.withParams = false;
		return this;
	}
	setter(){
		this.withParams = true;
		return this;
	}
	set values(stringValues){
		Object.values(this.params).forEach(p=>{
			p.value = stringValues.substr(0, p.len);
			stringValues = stringValues.substr(p.len);
		});
	}
	toRequest(){
		let param = ""
		if(this.withParams){
			param = Object.values(this.params).map(({stringValue}) => stringValue).join("")
		}
		return `#${this.cmd}${param}`.toUpperCase();
	}
	onChange(handler){
		if(typeof variable !== 'function')
			throw new Error(`Control class onChange wait for Function as first paramater. You give "${handler}".`);
		this.changeHandlers.push(handler)
	}
};
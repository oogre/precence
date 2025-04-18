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
	}
	toString(withParams = true){
		return `${this.cmd}${withParams ? Object.values(this.params).map(({stringValue}) => stringValue).join("") : "" }`.toUpperCase();
	}
	onChange(handler){
		if(typeof variable !== 'function')
			throw new Error(`Control class onChange wait for Function as first paramater. You give "${handler}".`);
		this.changeHandlers.push(handler)
	}
};
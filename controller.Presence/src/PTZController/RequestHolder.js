

import Param from './Param.js';
import Control from './Control.js';

class RequesHelper {
	constructor(){

	}
	get(_name){
		this.dict = this.dict || {};
		if(!this.dict[_name]){
			this.dict[_name] = this.controls.find(({name})=>name==_name)
		}
		return this.dict[_name];
	}
}


export default class RequestHolder extends RequesHelper{
	constructor(conf){
		super();
		this.controls = [{
			name : "PAN_TILT",
			data : new Control("PTS", 
				new Param("pan", 3, 97), 
				new Param("tilt", 3, 97)
			).setter(),
			visible : true
		},{
			name : "ZOOM",
			data : new Control("Z", 
				new Param("zoom", 1, 99)
			).setter(),
			visible : true
		},{
			name : "FOCUS",
			data : new Control("F", 
				new Param("focus", 0x555, 0xFFF, 16, 3)
			).setter(),
			visible : true
		},{
			name : "IRIS",
			data : new Control("AXI", 
				new Param("iris", 0x555, 0XFFF, 16, 3)
			).setter(),
			visible : true
		},{
			name : "GET_PAN_TILT_ZOOM_FOCUS_IRIS",
			data : new Control("PTD", 
				new Param("pan", 0x0000, 0xFFFF, 16, 4), 
				new Param("tilt", 0x0000, 0xFFFF, 16, 4), 
				new Param("zoom", 0x000, 0x3E7, 16, 3),
				new Param("focus", 0x00, 0x63, 16, 2),
				new Param("iris", 0x00, 0xFF, 16, 2)
			).getter(),
			visible : true
		},{
			name : "POSITION",
			data : new Control("APC", 
				new Param("pan", 0x0000, 0xFFFF, 16, 4),
				new Param("tilt", 0x0000, 0xFFFF, 16, 4),
			).setter(),
			visible : false
		},{
			name : "ZOOM_POS",
			data : new Control("AXZ", 
				new Param("zoom", 0x555, 0xFFF, 16, 3),
			).setter(),
			visible : false
		}]
	}

}



import { Server } from 'node-osc';
//import Gamecontroller from 'gamecontroller';
import {wait} from '../common/Tools.js';

class OSCReceiverHelper{
	constructor(port, ip = '0.0.0.0', readyCallback = ()=>{}){
		this.oscServer = new Server(port, ip, readyCallback);
	}
	onMessage(address, callback){
		this.oscServer.on(address, callback);
		return this;
	}
	close(){
		this.oscServer.close();
	}
}

Object.prototype.getKey = function (value){
	return Object.keys(this).find(key => this[key] === value);
}

export default class Gamepad {
	static JOYSTIC_DESC = Object.freeze({
		"LEFT":1, 
		"RIGHT":2
	});

	static BUTTON_DESC = Object.freeze({
		"UP":1, 
		"DOWN":2, 
		"LEFT":3, 
		"RIGHT":4, 
		"A":5, 
		"B":6, 
		"C":7, 
		"D":8, 
		"UL_TRIGGER":9, 
		"UR_TRIGGER":10, 
		"BL_TRIGGER":11, 
		"BR_TRIGGER":12, 
		"HOME":13, 
		"SELECT":14
	});
	
	constructor(){

		// this.ctrl = new Gamecontroller('xbox360');

		// this.ctrl.connect(function() {
		//     console.log('Game On!');
		// });

		// this.ctrl.on('X:press', function() {
		//     console.log('X was pressed');
		// });

		this.input = new OSCReceiverHelper(9000);
		this.input.onMessage('/mouse/position', message => {
			this.handlers.joystick[Gamepad.JOYSTIC_DESC.RIGHT] && this.handlers.joystick[Gamepad.JOYSTIC_DESC.RIGHT]
				.forEach(handler => {
					handler({
						type : `Gamepad.JOYSTIC_DESC.${Gamepad.JOYSTIC_DESC.getKey(Gamepad.JOYSTIC_DESC.RIGHT)}`,
						data : {
							horizontal : message[1], 
							vertical : message[2]
						}
					})
				});
		});
		this.handlers = {
			joystick : {},
			button : {},
		};
	}
	onJoystick(description, callback){
		if(!Object.values(Gamepad.JOYSTIC_DESC).includes(description))
			throw new Error(`onJoystick wait for Gamepad.JOYSTIC_DESC as first parameter. You give "${description}".`);
		if(typeof callback !== 'function')
			throw new Error(`onJoystick wait for function as second parameter. You give "${typeof callback}".`);
		this.handlers.joystick[description] = this.handlers.joystick[description] || [];
		this.handlers.joystick[description].push(callback);
	}
	onButton(){
		if(!Object.values(Gamepad.BUTTON_DESC).includes(description))
			throw new Error(`onButton wait for Gamepad.BUTTON_DESC as first parameter. You give "${description}".`);
		if(typeof callback !== 'function')
			throw new Error(`onButton wait for function as second parameter. You give "${typeof callback}".`);
		this.handlers.button[description] = this.handlers.button[description] || [];
		this.handlers.button[description].push(callback);
	}
	async close(){
		this.input.close()
		return await wait(100);
	}

}
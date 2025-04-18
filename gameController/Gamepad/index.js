// import { Server } from 'node-osc';
import {wait} from '../common/Tools.js';

Object.prototype.getKey = function (value){
	return Object.keys(this).find(key => this[key] === value);
}

export default class Gamepad {
	static EVENT_DESC = Object.freeze({
		"CENTER":0, 
		"UP":1, 
		"UP_LEFT":15, 
		"LEFT":2, 
		"DOWN_LEFT":25, 
		"DOWN":3, 
		"DOWN_RIGHT":35, 
		"RIGHT":4, 
		"UP_RIGHT":45, 
		"A_PRESS":5, 
		"A_RELEASE":51, 
		"B_PRESS":6, 
		"B_RELEASE":61, 
		"X_PRESS":7, 
		"X_RELEASE":71, 
		"Y_PRESS":8, 
		"Y_RELEASE":81, 
		"UL_PRESS":9, 
		"UL_RELEASE":91, 
		"UR_PRESS":10, 
		"UR_RELEASE":101, 
		"BL_TRIGGER":11, 
		"BR_TRIGGER":12, 
		"HOME_PRESS":13, 
		"HOME_RELEASE":131, 
		"SELECT_PRESS":14,
		"SELECT_RELEASE":141,
		"JOYSTIC_LEFT":15, 
		"JOYSTIC_RIGHT":16
	});
	
	constructor(device){
		this.handlers = {};
		this.device = device;
		device.on('*', (eventType, event) => {
			if(eventType == "axisMotion"){
				if(event.axis == 0 || event.axis == 1){
					this.trigger(Gamepad.EVENT_DESC.JOYSTIC_LEFT, {
						dir : `${event.axis == 0 ? 'horizontal' : 'vertical'}`,
						...event
					});
				}
				else if(event.axis == 2 || event.axis == 3){
					this.trigger(Gamepad.EVENT_DESC.JOYSTIC_RIGHT, {
						dir : `${event.axis == 2 ? 'horizontal' : 'vertical'}`,
						...event
					});
				}
				else if(event.axis == 4){
					this.trigger(Gamepad.EVENT_DESC.BL_TRIGGER, {
						...event
					});
				}
				else if(event.axis == 5){
					this.trigger(Gamepad.EVENT_DESC.BR_TRIGGER, {
						...event
					});
				}
			}
			else if (eventType == "buttonDown") {
				if(event.button == 0){
					this.trigger(Gamepad.EVENT_DESC.A_PRESS, {
						...event
					});
				}
				else if(event.button == 1){
					this.trigger(Gamepad.EVENT_DESC.B_PRESS, {
						...event
					});
				}
				else if(event.button == 2){
					this.trigger(Gamepad.EVENT_DESC.X_PRESS, {
						...event
					});
				}
				else if(event.button == 3){
					this.trigger(Gamepad.EVENT_DESC.Y_PRESS, {
						...event
					});
				}
				else if(event.button == 4){
					this.trigger(Gamepad.EVENT_DESC.UL_PRESS, {
						...event
					});
				}	
				else if(event.button == 6){
					this.trigger(Gamepad.EVENT_DESC.HOME_PRESS, {
						...event
					});
				}
				else if(event.button == 7){
					this.trigger(Gamepad.EVENT_DESC.SELECT_PRESS, {
						...event
					});
				}
			}

			else if (eventType == "buttonUp") {
				if(event.button == 0){
					this.trigger(Gamepad.EVENT_DESC.A_RELEASE, {
						...event
					});
				}
				else if(event.button == 1){
					this.trigger(Gamepad.EVENT_DESC.B_RELEASE, {
						...event
					});
				}
				else if(event.button == 2){
					this.trigger(Gamepad.EVENT_DESC.X_RELEASE, {
						...event
					});
				}
				else if(event.button == 3){
					this.trigger(Gamepad.EVENT_DESC.Y_RELEASE, {
						...event
					});
				}
				else if(event.button == 4){
					this.trigger(Gamepad.EVENT_DESC.UL_RELEASE, {
						...event
					});
				}
				else if(event.button == 5){
					this.trigger(Gamepad.EVENT_DESC.UR_RELEASE, {
						...event
					});
				}
				else if(event.button == 6){
					this.trigger(Gamepad.EVENT_DESC.UR_RELEASE, {
						...event
					});
				}	
				else if(event.button == 6){
					this.trigger(Gamepad.EVENT_DESC.HOME_RELEASE, {
						...event
					});
				}
				else if(event.button == 7){
					this.trigger(Gamepad.EVENT_DESC.SELECT_RELEASE, {
						...event
					});
				}
			}
			else if (eventType == "hatMotion"){
				if(event.value == "up"){
					this.trigger(Gamepad.EVENT_DESC.UP, {
						...event
					});
				}
				else if(event.value == "leftup"){
					this.trigger(Gamepad.EVENT_DESC.UP_LEFT, {
						...event
					});
				}
				else if(event.value == "left"){
					this.trigger(Gamepad.EVENT_DESC.LEFT, {
						...event
					});
				}
				else if(event.value == "leftdown"){
					this.trigger(Gamepad.EVENT_DESC.DOWN_LEFT, {
						...event
					});
				}
				else if(event.value == "down"){
					this.trigger(Gamepad.EVENT_DESC.DOWN, {
						...event
					});
				}
				else if(event.value == "rightdown"){
					this.trigger(Gamepad.EVENT_DESC.DOWN_RIGHT, {
						...event
					});
				}
				else if(event.value == "right"){
					this.trigger(Gamepad.EVENT_DESC.RIGHT, {
						...event
					});
				}

				else if(event.value == "rightup"){
					this.trigger(Gamepad.EVENT_DESC.UP_RIGHT, {
						...event
					});
				}
				else if(event.value == "centered"){
					this.trigger(Gamepad.EVENT_DESC.CENTER, {
						...event
					});
				}
			}
		})
	}

	trigger(eventDesc, event){
		this.handlers[eventDesc] && this.handlers[eventDesc]
			.forEach(handler => {
				handler({
					...event,
					type : eventDesc,
					desc : `Gamepad.EVENT_DESC.${Gamepad.EVENT_DESC.getKey(eventDesc)}`,
					time : new Date().getTime(),
					device : this.device._device
				})
			});
	}
	on(description, callback){
		if(!Object.values(Gamepad.EVENT_DESC).includes(description))
			throw new Error(`onJoystick wait for Gamepad.EVENT_DESC as first parameter. You give "${description}".`);
		if(typeof callback !== 'function')
			throw new Error(`onJoystick wait for function as second parameter. You give "${typeof callback}".`);
		this.handlers[description] = this.handlers[description] || [];
		this.handlers[description].push(callback);
		return this;
	}
	async close(){
		this.device.close();
		return await wait(100);
	}

}
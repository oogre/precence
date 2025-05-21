// import { Server } from 'node-osc';
import sdl from '@kmamal/sdl'
import {wait} from '../common/Tools.js';
import {Axes_IN} from './Axes.js';

export default class Gamepad {
	constructor(devices, conf){

		this.log = conf.log ? (...data)=>console.log(`GAMEPAD ${conf.name} : `, ...data) : ()=>{};

		this.in = new Axes_IN();
		this.handlers = this.in.controls.map(({name})=>name).reduce((o, key) => ({ ...o, [key]: []}), {});
		this.handlers["*"] = [];

		this.log(this.handlers);
		this.device = devices.find(({name})=>name==conf.name)
		if(!!this.device){
			this.device = sdl.joystick.openDevice(this.device)
		}

		const eventProcess = (name, value) => {
			const target = this.in.get(name);
			target.setValue(value);
			this.trigger(target.name, { target });
			this.log(target.name, target.getValue());
		}

		this.device && this.device.on('*', (eventType, event) => {
			if(eventType == "axisMotion"){
				switch(event.axis){
					case 0 : 
						eventProcess("JOYSTICK_LEFT_HORIZONTAL", event.value * 0.5 + 0.5);
					break;
					case 1 :
						eventProcess("JOYSTICK_LEFT_VERTICAL", 1 - (event.value * 0.5 + 0.5));
					break;
					case 2 :
						eventProcess("JOYSTICK_RIGHT_HORIZONTAL", event.value * 0.5 + 0.5);
					break;
					case 3 :
						eventProcess("JOYSTICK_RIGHT_VERTICAL", 1 - (event.value * 0.5 + 0.5));
					break;
					case 4 :
						eventProcess("TRIGGER_LEFT", event.value);
					break;
					case 5 :
						eventProcess("TRIGGER_RIGHT", event.value);
					break;
				}
			}
			else if (eventType == "buttonDown") {
				switch(event.button){
					case 0 :
						eventProcess("BUTTON_A", 1);
					break;
					case 1 :
						eventProcess("BUTTON_B", 1);
					break;
					case 2 :
						eventProcess("BUTTON_X", 1);
					break;
					case 3 :
						eventProcess("BUTTON_Y", 1);
					break;
					case 4 :
						eventProcess("BUTTON_TRIGGER_LEFT", 1);
					break;
					case 5 :
						eventProcess("BUTTON_TRIGGER_RIGHT", 1);
					break;
					case 6 :
						eventProcess("BUTTON_HOME", 1);
					break;
					case 7 :
						eventProcess("BUTTON_SELECT", 1);
					break;
					case 8 :
						eventProcess("BUTTON_JOYSTICK_LEFT", 1);
					break;
					case 9 :
						eventProcess("BUTTON_JOYSTICK_RIGHT", 1);
					break;
				}
			}
			else if (eventType == "buttonUp") {
				switch(event.button){
					case 0 :
						eventProcess("BUTTON_A", 0);
					break;
					case 1 :
						eventProcess("BUTTON_B", 0);
					break;
					case 2 :
						eventProcess("BUTTON_X", 0);
					break;
					case 3 :
						eventProcess("BUTTON_Y", 0);
					break;
					case 4 :
						eventProcess("BUTTON_TRIGGER_LEFT", 0);
					break;
					case 5 :
						eventProcess("BUTTON_TRIGGER_RIGHT", 0);
					break;
					case 6 :
						eventProcess("BUTTON_HOME", 0);
					break;
					case 7 :
						eventProcess("BUTTON_SELECT", 0);
					break;
					case 8 :
						eventProcess("BUTTON_JOYSTICK_LEFT", 0);
					break;
					case 9 :
						eventProcess("BUTTON_JOYSTICK_RIGHT", 0);
					break;
				}
			}
			else if (eventType == "hatMotion"){
				switch(event.value){
					case "up" :
						eventProcess("CROSS_UP", 1);
						eventProcess("CROSS_LEFT", 0);
						eventProcess("CROSS_DOWN", 0);
						eventProcess("CROSS_RIGHT", 0);
					break;
					case "leftup" :
						eventProcess("CROSS_UP", 1);
						eventProcess("CROSS_LEFT", 1);
						eventProcess("CROSS_DOWN", 0);
						eventProcess("CROSS_RIGHT", 0);
					break;
					case "left" :
						eventProcess("CROSS_UP", 0);
						eventProcess("CROSS_LEFT", 1);
						eventProcess("CROSS_DOWN", 0);
						eventProcess("CROSS_RIGHT", 0);
					break;
					case "leftdown" :
						eventProcess("CROSS_UP", 0);
						eventProcess("CROSS_LEFT", 1);
						eventProcess("CROSS_DOWN", 1);
						eventProcess("CROSS_RIGHT", 0);
					break;
					case "down" :
						eventProcess("CROSS_UP", 0);
						eventProcess("CROSS_LEFT", 0);
						eventProcess("CROSS_DOWN", 1);
						eventProcess("CROSS_RIGHT", 0);
					break;
					case "rightdown" :
						eventProcess("CROSS_UP", 0);
						eventProcess("CROSS_LEFT", 0);
						eventProcess("CROSS_DOWN", 1);
						eventProcess("CROSS_RIGHT", 1);
					break;
					case "right" :
						
						eventProcess("CROSS_UP", 0);
						eventProcess("CROSS_LEFT", 0);
						eventProcess("CROSS_DOWN", 0);
						eventProcess("CROSS_RIGHT", 1);
					break;
					case "rightup" :
						eventProcess("CROSS_UP", 1);
						eventProcess("CROSS_LEFT", 0);
						eventProcess("CROSS_DOWN", 0);
						eventProcess("CROSS_RIGHT", 1);
					break;
					case "centered" :
						eventProcess("CROSS_UP", 0);
						eventProcess("CROSS_LEFT", 0);
						eventProcess("CROSS_DOWN", 0);
						eventProcess("CROSS_RIGHT", 0);
					break;
				}
			}
		});
	}

	trigger(eventDesc, event){
		let time = new Date().getTime();
		[...this.handlers[eventDesc], ...this.handlers["*"]]
			.forEach(handler => {
				handler({
					...event,
					time : time
				})
			});
	}
	
	on(description, callback){
		if(!Object.keys(this.handlers).includes(description))
			throw new Error(`onJoystick wait for Gamepad.EVENT_DESC as first parameter. You give "${description}".`);
		if(typeof callback !== 'function')
			throw new Error(`onJoystick wait for function as second parameter. You give "${typeof callback}".`);
		this.handlers[description].push(callback);
		return this;
	}

	async close(){
		this.device.close();
		return await wait(100);
	}

}
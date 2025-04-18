import UI_HELPER from './UI_HELPER.js';


import FestoController from "../FestoController";

export default class UI extends UI_HELPER{
	constructor(window, config, robots){
		super(window);
		this.robots = robots;
		this.config = config;
		this.handlers = [];
	}

	onButtonEvent(handler){
		this.handlers.push(handler);
	}

	draw(){
		this.robots.map((robot, k)=>{
			return robot.out.controls
			.filter(({visible}) => visible)
			.map((ctrl, n)=>{
				return [robot, this.checkBox(10 + n * 100, 10 + k * 100, ctrl.name, ctrl.getValue())]
			})  
		}).flat()
		.map(([robot, checkbox])=>{
			checkbox.ifMouseRelease((name)=>{
				this.handlers.map(handler=>handler({
					eventName : name,
					target : robot
				}));
			})
		});

		this.robots.map((robot, k)=>{
			return robot.in.controls
			.filter(({visible}) => visible)
			.map((ctrl, n)=>{
				return [robot, this.checkBox(10 + n * 100, 40 + k * 100, ctrl.name, ctrl.getValue())]
			})  
		})
	}	
}
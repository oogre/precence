import UI_HELPER from './UI_HELPER.js';


import FestoController from "../FestoController";
import PTZController from "../PTZController";




export default class UI extends UI_HELPER{
	constructor(window, config){
		super(window);
		this.config = config;
		this.handlers = [];
	}

	onButtonEvent(handler){
		this.handlers.push(handler);
	}
	draw(){
	  //CONTROLLER STUFF
	  {
	    const columnWidth = (this.width - 20)/(this.config.controller.axes.length);
	    const y = 0;
	    const x = columnWidth * (this.config.controller.axes.length / 2) - 50;
	    this.text( x, y + 20, "CONTROLLER");
	    this.text( x, y + 35, this.config.controller.name);
	    this.config.controller.axes.map((axis, k) =>{
	       const x = 10 + columnWidth * k
	        this.text(x, y + 50, axis.name);
	      if(axis.values){
	        axis.values.map((value, n)=>{
	          this.text(x, y + 65 + (n+1) * 15+ (n) * 30 + n * 15, value.name);
	          this.slider(x, y + 65 + (n+1) * 15 + (n+1) * 30, false, value.position);  
	        });
	      }else{
	        this.text(x, y + 50, axis.name);
	        this.slider(x, y + 80, false, axis.position);  
	      }
	    })
	  }

	  const columnWidth = (this.width - 20)/(this.config.robots.length + this.config.camera.axes.length);
	  const y = this.height/2;
	  // ROBOT STUFF
	  {
	    const x = columnWidth * (this.config.robots.length / 2) - 50;
	    this.text( x, y + 20, "ROBOTS");
	    this.config.robots.map((robot, k) =>{
	      const x = 10 + columnWidth * k
	      this.text(x, y + 35, robot.name);
	      this.text(x, y + 50, `${robot.host}:${robot.port}`);
	      if(robot.status == FestoController.RobotStatus.NOT_CONNECTED){
	        this.checkBox(x, y + 80, "Connection", false)
	        .ifMouseRelease(()=>{
				this.handlers.map(handler=>handler({
					eventName : "connection",
					target : "robot",
					id : k
				}));
	        }) 
	      }else if(robot.status == FestoController.RobotStatus.NOT_HOMED){
	        this.checkBox(x, y + 80, "Homing", false)
	        .ifMouseRelease(()=>{
				// LAUNCH HOME PROCESS
				this.handlers.map(handler=>handler({
					eventName : "homing",
					target : "robot",
					id : k
				}));
	        });
	      }else if(robot.status == FestoController.RobotStatus.RUNNING){
	        this.slider(x, y + 80, "position", robot.position);
	        this.slider(x, y + 110, "speed", robot.speed);
	      }  
	    });
	  }

	  // CAMERA STUFF
	  {
	    const x = columnWidth * (this.config.robots.length + this.config.camera.axes.length / 2) - 50;
	    this.text(x, y + 20, "CAMERA");
	    this.text(x, y + 35, this.config.camera.name);
	    this.text(x, y + 50, `${this.config.camera.host}:${this.config.camera.port}`);
	    if(this.config.camera.status == PTZController.CameraStatus.NOT_CONNECTED){
	      this.checkBox(x, y + 80, "Connection", false)
	        .ifMouseRelease(()=>{
	          // LAUNCH CONNECTION PROCESS
	          this.handlers.map(handler=>handler({
					eventName : "connection",
					target : "camera",
					id : 0
				}));
	        }) 
	    }else if(this.config.camera.status == PTZController.CameraStatus.RUNNING){
	      this.config.camera.axes.map((axis, k) =>{
	        const x = 10 + columnWidth * (k + this.config.robots.length)
	        this.text(x, y + 80, axis.name);
	        this.slider(x, y + 95, "position", axis.position);
	        this.slider(x, y + 125, "speed", axis.speed);
	      });
	    }
	  }
	}	
}
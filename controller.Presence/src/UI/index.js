import UI_HELPER from './UI_HELPER.js';

import FestoController from "../FestoController";
import PTZController from "../PTZController";
import {lerp} from "../common/Math.js";
import OBS from "../OBS";


export default class UI extends UI_HELPER{
	constructor(window, gamepad, robots, camera, timeline, obs){
		super(window);
		this.config = {gamepad, robots, camera, timeline, obs};
		this.handlers = [];
	}

	onButtonEvent(handler){
		this.handlers.push(handler);
	}

	draw(){
		//CONTROLLER STUFF
		this.title( 10, 25, `Cntrl ${this.config.gamepad.device?._device.name||""}`);

		if(this.config.gamepad.device){
			this.config.gamepad.in.controls
			.filter(({visible}) => visible)
			.map((ctrl, n)=>{
				ctrl.bounds = this.slider(10, 50 + n * 27, ctrl.name, ctrl.getValue());
				return ctrl.bounds;
			});
		}
		this.line(300, 10, 300, 580);

		//ROBOTS STUFF
		this.ctx.save();
		this.config.robots.map((robot, k)=>{
			this.ctx.translate(300, 0);
			this.title( 10, 25, `Robot ${robot.conf.name}`);
			this.line( 300, 10, 300, 580);
		});
		this.ctx.restore();

		this.config.robots.map((robot, k)=>{
			const x = 10 + 300 * (k+1);
			const y = 50;
			const lineHeight = 27;
			if(robot.isError){

			}else if(!robot.isConnected){
				this.checkBox(x, y, "Connection", robot.isConnecting)
				.ifMouseRelease(()=>{
					if(!robot.isConnecting){
						this.handlers.map(handler=>handler({
							eventName : "connection",
							target : "robot",
							id : k
						}));
					}
				}) 
			}else if(!robot.isReferenced){
				this.checkBox(x, y, "Homing", false)
				.ifMouseRelease(()=>{
					this.handlers.map(handler=>handler({
						eventName : "HOME",
						target : "robot",
						id : k
					}));
				})
			}else{
				this.text( x, y , `OUTPUT`.toUpperCase());
				const outItem = robot.DEFAULT_OUT.controls
					.filter(({visible}) => visible)
					.map((ctrl, n)=>{
						const yOffset = (n+1) * lineHeight;
						switch(ctrl.type){
							case "checkBox" : 
								//this.checkBox(x, y + yOffset, ctrl.name, ctrl.getValue());
								return [robot, this.checkBox(x, y + yOffset, ctrl.name, ctrl.getValue()), ctrl];
							break;
						case "slider" : 
								ctrl.bounds = this.slider(x, y + yOffset, ctrl.name, ctrl.getValue()); 
							break;
						}
					})
					.filter(e => !!e)
					.map(([robot, checkbox, ctrl])=>{
						return checkbox.ifMouseRelease((name)=>{
							this.handlers.map(handler=>handler({
								eventName : ctrl.name,
								target : "robot",
								id : k
							}));
						})
					});
				let counter = 0;
				let offset = outItem.length + 3;
				const yOffset = (offset+1) * lineHeight;
				this.text( x, y + yOffset , `INPUT`.toUpperCase());
				robot.in.controls
					.filter(({visible}) => visible)
					.map((ctrl, n)=>{
						counter++
						const yOffset = (offset+n+2) * lineHeight;
						switch(ctrl.type){
							case "checkBox" : 
								//this.checkBox(x, y + yOffset, ctrl.name, ctrl.getValue());
								return [robot, this.checkBox(x, y + yOffset, ctrl.name, ctrl.getValue()), ctrl];
							break;
						case "slider" : 
								ctrl.bounds = this.slider(x, y + yOffset, ctrl.name, ctrl.getValue()); 
							break;
						}
					});

				this.checkBox(x, y + yOffset + (counter+2) * lineHeight, "SET ZERO" , false)
				.ifMouseRelease(()=>{
					this.handlers.map(handler=>handler({
						eventName : "ZERO",
						target : "robot",
						id : k
					}));
				});
				this.text( x, y + yOffset + (counter+4) * lineHeight, robot._robotSpeed.key.toUpperCase());
			}
		});
		
		//CAMERA STUFF
		const camera = this.config.camera;
		this.title( 910, 25, `CAMERA ${camera.conf.name}`);
		const x = 910;
		const y = 50;
		const lineHeight = 27;
		if(camera.isError){

		}else if(!camera.isConnected){
			this.checkBox(x, y, "Connection", camera.isConnecting)
			.ifMouseRelease(()=>{
				if(!camera.isConnecting){
					this.handlers.map(handler=>handler({
						eventName : "connection",
						target : "camera",
						id : 0
					}));
				}
			}) 
		}else{
			let counter = 0;
			this.text( x, y , `OUTPUT`.toUpperCase());

			camera.out.controls
			.filter(({data, visible})=>data.withParams && visible)
			.map((ctrl, n) => {
				Object.values(ctrl.data.params).map((param, l)=>{
					counter ++;
					const yOffset = (counter) * lineHeight;
					param.bounds = this.slider(x, y + yOffset, param.name, param.value); 
				})
			});
			counter+=2;
			this.text( x, y + counter * lineHeight , `INPUT`.toUpperCase());
			camera.in.controls
			.filter(({data})=>!data.withParams)
			.map((ctrl, n) => {
				Object.values(ctrl.data.params).map((param, l)=>{
					counter ++;
					const yOffset = (counter) * lineHeight;
					param.bounds = this.slider(x, y + yOffset, param.name, param.value); 
				})
			});

			this.checkBox(x, y + (counter+2) * lineHeight, "SET ZERO" , false)
			.ifMouseRelease(()=>{
				this.handlers.map(handler=>handler({
					eventName : "ZERO",
					target : "camera",
					id : 0
				}));
			});

			this.text( x, y + (counter+4) * lineHeight, camera._cameraSpeed.key.toUpperCase());

		}


		this.line(10, 600, 1190, 600);
		{
			//timeline STUFF
			const timeline = this.config.timeline;
			this.title( 10, 625, `timeline`);
			
			if(timeline.isNoneMode){
				this.checkBox(180, 625, `LOAD` , true)
				.ifMouseRelease(()=>{
					this.handlers.map(handler=>handler({
						eventName : "load",
						target : "timeline",
						id : 0
					}));
				});
			}else{
				switch(this.config.obs.status){
					case OBS.OBSStatus.NOT_CONNECTED:
					case OBS.OBSStatus.CONNECTED:
					break;
					case OBS.OBSStatus.OBS_WEBSOCKET_OUTPUT_PAUSED:
					{
						this.checkBox(180, 625, "STOP" , false)
							.ifMouseRelease(()=>{
								this.handlers.map(handler=>handler({
									eventName : "STOP",
									target : "timeline",
									id : 0
								}));
							});
						// const name  = timeline.isRecordMode() ? 'REC' : "PLAY"
						// this.checkBox(380, 625, name , false)
						// 	.ifMouseRelease(()=>{
						// 		this.handlers.map(handler=>handler({
						// 			eventName : "PLAY",
						// 			target : "timeline",
						// 			id : 0
						// 		}));
						// 	});
					}
					break;
					case OBS.OBSStatus.OBS_WEBSOCKET_OUTPUT_STOPPED:
					{
						const name  = timeline.isRecordMode ? 'REC' : "PLAY"
						this.checkBox(180, 625, name , true)
						.ifMouseRelease(()=>{
							this.handlers.map(handler=>handler({
								eventName : "REC",
								target : "timeline",
								id : 0
							}));
						});
					}
					break;
					case OBS.OBSStatus.OBS_WEBSOCKET_OUTPUT_RESUMED:
					case OBS.OBSStatus.OBS_WEBSOCKET_OUTPUT_STARTED:
							this.checkBox(180, 625, "STOP" , false)
							.ifMouseRelease(()=>{
								this.handlers.map(handler=>handler({
									eventName : "STOP",
									target : "timeline",
									id : 0
								}));
							});

							// this.checkBox(380, 625, "PAUSE" , true)
							// .ifMouseRelease(()=>{
							// 	this.handlers.map(handler=>handler({
							// 		eventName : "PAUSE",
							// 		target : "timeline",
							// 		id : 0
							// 	}));
							// });
					break;
				}

				this.checkBox(280, 625, "CLEAR" , true)
				.ifMouseRelease(()=>{
					this.handlers.map(handler=>handler({
						eventName : "CLEAR",
						target : "timeline",
						id : 0
					}));
				});
			}
			
			let offset = 100;
			let width = 1100;
			let x = 10;
			let y = 650;

			timeline.channels
				.map(({name, target}, n)=>{
					this.checkBox(x , y + n * 20, name , target.isNoneMode, target.isRecordMode ? "red" : "lime" )
					.ifMouseRelease(()=>{
						this.handlers.map(handler=>handler({
							eventName : name,
							target : "timeline",
							id : 0
						}));
					});

					this.checkBox(x+100, y + n * 20, "X" , target.isNoneMode, target.isRecordMode ? "red" : "lime" )
					.ifMouseRelease(()=>{
						this.handlers.map(handler=>handler({
							eventName : `clear ${name}`,
							target : "timeline",
							id : 0
						}));
					});
				});

			this.ctx.save();
			{
				this.ctx.translate(x+70, y);

				timeline.channels
					.map(({canvas}, n)=>{
						this.ctx.save();
						{
							this.ctx.translate(offset, 0);
							this.line(0, n * 20, width-20, n * 20);
							this.ctx.drawImage(canvas,0, 0, canvas.width, canvas.height, 0,n * 20, width-20, 12);
						}
						this.ctx.restore();
					});

				this.ctx.save();
				{
					this.ctx.translate(offset, 0);
					this.ctx.save();
					{
						this.ctx.translate(lerp( 0, width-20, timeline.cursor), 0);
						this.line(0, 0, 0, timeline.channels.length*20);
					}
					this.ctx.restore();
				}
				this.ctx.restore();
			}
			this.ctx.restore();
		}		

	}	
}
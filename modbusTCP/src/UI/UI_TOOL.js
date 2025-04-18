import { createCanvas } from '@napi-rs/canvas';


export default class UI_TOOL{
	constructor(window){
		this.window = window;
		const { pixelWidth: width, pixelHeight: height } = window;
		this.width = width;
		this.height = height;
		this.canvas = createCanvas(width, height);
		this.ctx = this.canvas.getContext('2d');
		//this.draw = ()=>{};

		this.mouse = {
			x : 0, 
			y : 0,
			isDown : false,
			isUp : false,
			justUp : false,
			justDown : false,
		};
		this.looping = setInterval(this.loop.bind(this), 50);

		this.window.on('mouseMove', ({x, y})=>{
			this.mouse.x = x;
			this.mouse.y = y;
		});
		this.window.on('mouseButtonDown', (event)=>{
			this.mouse.isDown = true;
			this.mouse.isUp = false;
			this.mouse.justDown = true;
		});
		this.window.on('mouseButtonUp', (event)=>{
			this.mouse.isDown = false;
			this.mouse.isUp = true;
			this.mouse.justUp = true;
		});
	}
	
	loop(){
		this.ctx.fillStyle = 'black';
		this.ctx.fillRect(0, 0, this.width, this.height);
		
		this.draw(this);
		
		this.mouse.justDown = false;
		this.mouse.justUp = false;
		const buffer = Buffer.from(this.ctx.getImageData(0, 0, this.width, this.height).data)
    	this.window.render(this.width, this.height, this.width * 4, 'rgba32', buffer)
	}
	close(){
		clearInterval(this.looping);
	}
}

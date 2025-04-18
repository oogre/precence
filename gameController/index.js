import sdl from '@kmamal/sdl'
import Gamepad from "./Gamepad/index.js"


let gamepad;
const window = sdl.video.createWindow({ resizable: true })
const { pixelWidth: width, pixelHeight: height } = window
const canvas = createCanvas(width, height)
const ctx = canvas.getContext('2d')

// Clear screen to red
ctx.fillStyle = 'red'
ctx.fillRect(0, 0, width, height)

// Render to window
const buffer = Buffer.from(ctx.getImageData(0, 0, width, height).data)
window.render(width, height, width * 4, 'rgba32', buffer)

const openJoystick = (device) => {
	gamepad = new Gamepad(sdl.joystick.openDevice(device))
	.on(Gamepad.EVENT_DESC.JOYSTIC_RIGHT, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.JOYSTIC_LEFT, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.BL_TRIGGER, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.BR_TRIGGER, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.A_PRESS, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.A_RELEASE, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.B_PRESS, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.B_RELEASE, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.X_PRESS, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.X_RELEASE, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.Y_PRESS, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.UL_PRESS, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.UL_RELEASE, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.UR_PRESS, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.UR_RELEASE, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.UP, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.UP_LEFT, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.LEFT, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.DOWN_LEFT, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.DOWN, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.DOWN_RIGHT, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.RIGHT, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.UP_RIGHT, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.CENTER, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.HOME_PRESS, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.HOME_RELEASE, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.SELECT_PRESS, async event => {
		console.log(event);
	})
	.on(Gamepad.EVENT_DESC.SELECT_RELEASE, async event => {
		console.log(event);
	})
}

sdl.joystick.on('deviceAdd', (event) => {
	openJoystick(event.device)
})

for (const device of sdl.joystick.devices) {
	openJoystick(device)
}

window.on('close', () => {
	gamepad.close()
})
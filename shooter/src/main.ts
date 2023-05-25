
//https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html
//https://www.tutorialspoint.com/webgl/webgl_drawing_a_quad.htm
import { init_sky_shader, draw_sky } from './sky.js';
import { init_dust_shader, update_dust, draw_dust, Dust_particle, generate_dust_array } from './dust_particles.js';
import { init_model_shader, draw_models, check_model_collision, check_model_bullet_collision } from './models.js';
import { init_smoke_shader, update_smoke, draw_smoke} from './smoke_particles.js'
import { init_bullet_shader, draw_bullets } from './bullets.js';
import { init_crosshair_shader, draw_crosshair } from './crosshair.js';
import { Ship } from './ship.js';

import { Quaternion } from './quaternions.js';
import { Vector3 } from './vectors.js';

// import { pcPlayer1 } from '../connection/screen.js';
// import { pcPlayer2 } from '../connection/screen.js';

const canvas = document.querySelector('#glcanvas') as any;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Initialize the GL context
const gl = canvas.getContext('webgl');

function check_error(){
	var err = gl.getError();
	if (err != gl.NO_ERROR){
		alert('you got an error')
		alert(err)
	}
}

//gl.moveTo(0,0);

// If we don't have a GL context, give up now
// Only continue if WebGL is available and working
if (!gl) {
alert('Unable to initialize WebGL. Your browser or machine may not support it.');
}

// Set clear color to black, fully opaque
gl.clearColor(0.0, 0.0, 1.0, 1.0);
// Clear the color buffer with specified clear color
gl.clear(gl.COLOR_BUFFER_BIT);


var input_dict: { [key: string]: boolean} = {
	'KeyW': false,
	'KeyA': false,
	'KeyS': false,
	'KeyD': false,
	'KeyQ': false,
	'KeyE': false,
	'Space': false,
	'ShiftLeft': false,
	'ArrowUp': false,
	'ArrowDown': false,
	'ArrowLeft': false,
	'ArrowRight': false,
	'Slash': false,
	'ShiftRight': false,
	'Enter': false,
	'Backslash': false,
	'Backspace': false,
	//'Quote': false,

	'KeyF': false,
	//'Period': false,

	'KeyG': false,

}


init_sky_shader(gl);
init_dust_shader(gl);
init_model_shader(gl);
init_smoke_shader(gl);
init_bullet_shader(gl);
init_crosshair_shader(gl);


class View{
	position = new Vector3();
	orientation = new Quaternion();
	follow_ship: Ship;
	dust_particles: Dust_particle[];

	constructor(ship:Ship){
		this.follow_ship = ship;
		this.dust_particles = generate_dust_array();
	}

	update(dt:number, resolution:number[]){
		let delay = this.follow_ship.alive()? .2: 0; //orientation delay
		this.orientation = new Quaternion(this.follow_ship.get_orientation());
		this.orientation.add_euler(-delay*this.follow_ship.roll_speed, -delay*this.follow_ship.pitch_speed, -delay*this.follow_ship.yaw_speed);
		
		let camera_offset = this.orientation.get_rotated_vec(new Vector3(0,3,12));
		this.position = this.follow_ship.get_position().get_added(camera_offset);

		update_dust(dt, fov, resolution, this.dust_particles, this.orientation, this.follow_ship.get_velocity());
	}

	draw(gl:any,dt:number, fov:number, viewport:number[]){

		let resolution = viewport.slice(2,4);
		gl.viewport(...viewport);

		draw_sky(gl, fov, resolution, this.orientation);
	
		gl.enable(gl.DEPTH_TEST);
		gl.clear(gl.DEPTH_BUFFER_BIT);  
		gl.depthRange(0,1); //doesn't do anything??
		//gl.depthRange(0,1); //doesn't do anything??
	
		draw_models(gl, fov, resolution, this.position, this.orientation, ship1, ship2);
		draw_bullets(gl, fov, resolution, ship1.get_bullets(), this.position, this.orientation);
		draw_bullets(gl, fov, resolution, ship2.get_bullets(), this.position, this.orientation);
		draw_dust(gl, dt, fov, resolution, this.dust_particles, this.follow_ship.get_velocity(), this.orientation);
		draw_smoke(gl, dt, fov, resolution, this.position, this.orientation, this.follow_ship);
		gl.disable(gl.DEPTH_TEST);
		gl.clear(gl.DEPTH_BUFFER_BIT);
		draw_crosshair(gl, dt, fov, resolution, this.orientation, this.follow_ship, ship1==this.follow_ship? ship2: ship1);
	}
}

gl.clearColor(0.2, 0.0, 0.2, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);


const fov = .8;
var ship1 = new Ship(gl, ["./resources/models/ship_player1.obj", -3.2, 10/6.4], new Vector3(0,0,3000), new Quaternion());
var ship2 = new Ship(gl, ["./resources/models/ship_player2.obj", -3.2, 10/6.4], new Vector3(0,0,-3000), new Quaternion(0,0,Math.PI));
var player1_velocity_target = 0;
var player2_velocity_target = 0;
let controller1_pressing_yaw = 0;
let controller2_pressing_yaw = 0;
let controller1_pressing_shoot = 0;
let controller2_pressing_shoot = 0;

let camera1 = new View(ship1);
let camera2 = new View(ship2);


let max_pitch = 2;
let max_roll = 2.5;
let max_yaw = 1;
//used for binary inputs (buttons):
let pitch_acc = 3;
let roll_acc = 3;
let yaw_acc = 3;


function clamp(min:number, v:number, max:number):number{
	return Math.max(min, Math.min(v, max));
}

// function receive_data(data_string:string){
// 	let pitch_range = 45;
// 	let roll_range = 45;
// 	//alert(data_string);
// 	if (data_string.split(',').length != 7){
// 		alert("received bad data")
// 	}else if (data_string[0] != "1" && data_string[0] != "2"){
// 		alert("unrecognized player")
// 	} else {
// 		console.log('correct data received');
// 		let [player, pitch, roll, yaw_left, yaw_right, slider, shoot] = data_string.split(',')
	
// 		if (player == '1'){
// 			ship1.pitch_speed = clamp(-1, parseFloat(pitch)/pitch_range, 1)*max_pitch; //maybe use a curve to have better control in small movements
// 			ship1.roll_speed =  clamp(-1, parseFloat(roll)/roll_range,   1)*max_roll;
// 			if (parseInt(yaw_left)) {controller1_pressing_yaw = -1;}
// 			else if (parseInt(yaw_right)) {controller1_pressing_yaw = 1;}
// 			else {controller1_pressing_yaw = 0;}
// 			player1_velocity_target = parseFloat(slider)/100*300
// 			controller1_pressing_shoot = parseInt(shoot);
// 		}
// 		else {
// 			ship2.pitch_speed = clamp(-1, parseFloat(pitch)/pitch_range, 1)*max_pitch;
// 			ship2.roll_speed =  clamp(-1, parseFloat(roll)/roll_range,   1)*max_roll;
// 			if (parseInt(yaw_left)) {controller2_pressing_yaw = -1;}
// 			else if (parseInt(yaw_right)) {controller2_pressing_yaw = 1;}
// 			else {controller2_pressing_yaw = 0;}
// 			player2_velocity_target = parseFloat(slider)/100*300
// 			controller2_pressing_shoot = parseInt(shoot);
// 		}
// 	}

// }


function update(dt: number){
	// if (input_dict['KeyG']){
	// 	receive_data('1, 0, 20, 0, 0, 50, 0');
	// 	receive_data('2, 0, 0, 1, 0, 80, 1');
	// }
	//player1:
	let pitch_speed = ship1.pitch_speed;
	let yaw_speed = ship1.yaw_speed;
	let roll_speed = ship1.roll_speed;
	//pitch
	if      (input_dict['KeyS']){pitch_speed = Math.min(pitch_speed + pitch_acc*dt,  max_pitch);}
	else if (input_dict['KeyW']){pitch_speed = Math.max(-max_pitch,  pitch_speed - pitch_acc*dt);}
	else {pitch_speed = (Math.abs(pitch_speed) < pitch_acc*dt)? 0: pitch_speed - Math.sign(pitch_speed)*pitch_acc*dt}

	//yaw, also used by controller
	if      (input_dict['KeyE'] || controller1_pressing_yaw ==  1){yaw_speed = Math.min(yaw_speed + yaw_acc*dt,  max_yaw);}
	else if (input_dict['KeyQ'] || controller1_pressing_yaw == -1){yaw_speed = Math.max(-max_yaw,  yaw_speed - yaw_acc*dt);}
	else {yaw_speed = (Math.abs(yaw_speed) < yaw_acc*dt)? 0: yaw_speed - Math.sign(yaw_speed)*yaw_acc*dt}

	//roll
	if      (input_dict['KeyA']){roll_speed = Math.min(roll_speed + roll_acc*dt,  max_roll);}
	else if (input_dict['KeyD']){roll_speed = Math.max(-max_roll,  roll_speed - roll_acc*dt);}
	else {roll_speed = (Math.abs(roll_speed) < roll_acc*dt)? 0: roll_speed - Math.sign(roll_speed)*roll_acc*dt}
	
	if      (input_dict['Space']){player1_velocity_target = Math.min(player1_velocity_target+100*dt, 300);}
	else if (input_dict['ShiftLeft']){player1_velocity_target = Math.max(0, player1_velocity_target-100*dt);}


	ship1.pitch_speed = pitch_speed;
	ship1.yaw_speed = yaw_speed;
	ship1.roll_speed = roll_speed;

	ship1.update(dt, new Vector3(0,0,-player1_velocity_target), input_dict['KeyF'] || Boolean(controller1_pressing_shoot), ship2);



	//player2:
	pitch_speed = ship2.pitch_speed;
	yaw_speed = ship2.yaw_speed;
	roll_speed = ship2.roll_speed;
	//pitch
	if      (input_dict['ArrowDown']){pitch_speed = Math.min(pitch_speed + pitch_acc*dt,  max_pitch);}
	else if (input_dict['ArrowUp']){pitch_speed = Math.max(-max_pitch,  pitch_speed - pitch_acc*dt);}
	else {pitch_speed = (Math.abs(pitch_speed) < pitch_acc*dt)? 0: pitch_speed - Math.sign(pitch_speed)*pitch_acc*dt}

	//yaw, also used by controller
	if      (input_dict['ShiftRight'] || controller2_pressing_yaw ==  1){yaw_speed = Math.min(yaw_speed + yaw_acc*dt,  max_yaw);}
	else if (input_dict['Slash']      || controller2_pressing_yaw == -1){yaw_speed = Math.max(-max_yaw,  yaw_speed - yaw_acc*dt);}
	else {yaw_speed = (Math.abs(yaw_speed) < yaw_acc*dt)? 0: yaw_speed - Math.sign(yaw_speed)*yaw_acc*dt}

	//roll
	if      (input_dict['ArrowLeft']){roll_speed = Math.min(roll_speed + roll_acc*dt,  max_roll);}
	else if (input_dict['ArrowRight']){roll_speed = Math.max(-max_roll,  roll_speed - roll_acc*dt);}
	else {roll_speed = (Math.abs(roll_speed) < roll_acc*dt)? 0: roll_speed - Math.sign(roll_speed)*roll_acc*dt}

	if      (input_dict['Backslash']){player2_velocity_target = Math.min(player2_velocity_target+100*dt, 300);}
	else if (input_dict['Enter']){player2_velocity_target = Math.max(0, player2_velocity_target-100*dt);}

	ship2.pitch_speed = pitch_speed;
	ship2.yaw_speed = yaw_speed;
	ship2.roll_speed = roll_speed;

	ship2.update(dt, new Vector3(0,0,-player2_velocity_target), input_dict['Backspace'] || Boolean(controller2_pressing_shoot), ship1);


	check_model_bullet_collision(dt, ship1.bullets);
	check_model_bullet_collision(dt, ship2.bullets);
	
	ship1.check_shot(dt, ship2.get_bullets());
	ship2.check_shot(dt, ship1.get_bullets());
	

	ship1.check_ship_collision(dt, ship2); //only needed once, checks for both ships

	check_model_collision(dt, ship1);
	check_model_collision(dt, ship2);


	camera1.update(dt, [gl.canvas.width, gl.canvas.height]);
	camera2.update(dt, [gl.canvas.width, gl.canvas.height]);

	(document.getElementById('score1') as HTMLDivElement).innerText =    `SCORE: ` + `${Math.max(ship1.score,0).toFixed(0)}`.padStart(9, ' ');
	(document.getElementById('score2') as HTMLDivElement).innerText =    `SCORE: ` + `${Math.max(ship2.score,0).toFixed(0)}`.padStart(9, ' ');
	(document.getElementById('health1') as HTMLDivElement).innerText =   `HP: ` + `${Math.max(ship1.health*100,0).toFixed(0)}%`.padStart(12, ' ');
	(document.getElementById('health2') as HTMLDivElement).innerText =   `HP: ` + `${Math.max(ship2.health*100,0).toFixed(0)}%`.padStart(12, ' ');
	(document.getElementById('velocity1') as HTMLDivElement).innerText = `TARGET V: ` + `${-ship1.forward_thrust.toFixed(0)}m/s`.padStart(6, ' ');
	(document.getElementById('velocity2') as HTMLDivElement).innerText = `TARGET V: ` + `${-ship2.forward_thrust.toFixed(0)}m/s`.padStart(6, ' ');
	
	(document.getElementById('invulnerable1') as HTMLDivElement).innerText = ship1.invulnerable()? 'INVULNERABLE': '';
	(document.getElementById('invulnerable2') as HTMLDivElement).innerText = ship2.invulnerable()? 'INVULNERABLE': '';
	(document.getElementById('return warning1') as HTMLDivElement).innerText = ship1.get_position().get_length()>5000? 'RETURN TO COMBAT AREA': '';
	(document.getElementById('return warning2') as HTMLDivElement).innerText = ship2.get_position().get_length()>5000? 'RETURN TO COMBAT AREA': '';

}

var startTime: number = 0;
function loop(time: number){

	window.requestAnimationFrame(loop);

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	
	var delta_time = (time - startTime)/1000;
	startTime = time;

	update(delta_time);
	update_smoke(delta_time);


	gl.clearColor(0.2, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.enable(gl.DITHER)
	gl.depthRange(0,1); //doesn't do anything??

	//player 1
	camera1.draw(gl, delta_time, fov, [0,0,gl.canvas.width/2, gl.canvas.height]);

	//player 2
	camera2.draw(gl, delta_time, fov, [gl.canvas.width/2,0,gl.canvas.width/2, gl.canvas.height]);

	check_error();

	// pcPlayer1.ondatachannel = (event) => {
	// 	console.log('we received a channel from player 1');
	// 	const channel1: RTCDataChannel = event.channel;
	// 	console.log('channel1 is set', channel1);
	// 	console.log(channel1.readyState);
	// 	channel1.onmessage = (ev: MessageEvent) => {
	// 		console.log('we received a message from player1.');
	// 		console.log(ev.data);
	// 		receive_data(ev.data);
	// 	};
	// }
	
	// pcPlayer2.ondatachannel = (event) => {
	// 	console.log('we received a channel from player2');
	// 	const channel2: RTCDataChannel = event.channel;
	// 	console.log('channel2 is set', channel2);
	// 	console.log(channel2.readyState);
	// 	channel2.onmessage = (ev: MessageEvent) => {
	// 		console.log('we received a message from player2.');
	// 		console.log(ev.data);
	// 		receive_data(ev.data);
	// 	};
	// }
	
}


function resize(event: UIEvent) {

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);

check_error();
loop(0);


document.addEventListener('keydown', (event) => {
	if (event.code in input_dict){
		input_dict[event.code] = true;
	}
}, false);
document.addEventListener('keyup', (event) => {
	if (event.code in input_dict){
		input_dict[event.code] = false;
	}
}, false);
document.addEventListener('wheel', (event) => {
	player1_velocity_target += -event.deltaY/15;
	player1_velocity_target = Math.max(0, Math.min(player1_velocity_target, 300));
}, false);
import { Quaternion } from "./quaternions.js";
import { Vector3 } from "./vectors.js";
// import { Vector3 } from "./vectors"; // use this import statement for testing


var dust_program: any;
var dust_loc_position: any;
var dust_loc_range: any;
var dust_loc_resolution: number;
var dust_loc_fov: any;
var dust_loc_speed: any;
const range = 100;
var vbo: any;
var dust_attrib_vert: any;

function check_error(gl:any){
	var err = gl.getError();
	if (err != gl.NO_ERROR){
		// alert(err)
	}
}

class Dust_particle{
	range:number;
	pos = new Vector3(0,0,0);
	
	constructor(max_dist: number){
		this.range = max_dist;
		this.reset();
	}
	reset(){
		this.pos = new Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5);
		let m = this.range/this.pos.get_length(); //normalize, then multiply by max_dist
		this.pos.scale(m);
	}

	get_pos():Vector3{return this.pos;}

	move(velocity:Vector3, dt:number, projected_pos: Vector3){

		let c = .02; //curve, higher is slower buildup
		let s = .00003; //speed
		//let animation_speed = vel_mag * s/(1+Math.abs(vel_mag*c));

		let animation_speed = dt;

		this.pos.add(velocity.get_scaled(-animation_speed));

		let dist_sq = this.pos.get_length_sq();

		if (dist_sq > range**2 || projected_pos.get_z() > 0 || Math.abs(projected_pos.get_x()) > 1 || Math.abs(projected_pos.get_y()) > 1){
			this.reset();
		}
	}

}

function generate_dust_array(amount:number = 500): Dust_particle[]{
	let particle_array: Dust_particle[] = [];
	for (var p = 0; p < amount; p++){
		particle_array.push(new Dust_particle(range));
	}
	return particle_array;
}

function init_dust_shader(gl: any){
	
	dust_program = gl.createProgram();
	var vertex_shader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertex_shader, `#version 100
		precision mediump float;
		attribute vec2 vertex;
		
		varying vec4 particle_color;

		//uniform vec4 color;
		vec4 color = vec4(1);
		uniform vec3 position;
		//uniform float size;
		float size = .02;
		uniform float range;
		uniform float speed;

		uniform ivec2 resolution;
		uniform float fov;

		void main() {
			if (position.z < 0.0){ //-z is forward
				float dist = -position.z;//length(position);
				particle_color = vec4(color.rgb, color.a);//*(range-dist+5.0)/range); //change transparency based on distance

				float curve = .02;
				particle_color.a *= speed*curve/(1.0+speed*curve); //change transparency based on speed
				
				vec2 screen_pos = position.xy + vertex*size;
				
				gl_Position = vec4(
					screen_pos.x/fov,
					screen_pos.y/fov*float(resolution.x)/float(resolution.y),
					-1.0+(-position.z-.1)/10000.0,
					-position.z
				);

			} else {
				particle_color = vec4(0);
				gl_Position = vec4(0,0, 0,1);
			}
		}
	`);
	gl.compileShader(vertex_shader);
	if (!gl.getShaderParameter(vertex_shader, gl.COMPILE_STATUS)) {
		// (gl.getShaderInfoLog(vertex_shader));
	}
	var fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragment_shader, `#version 100
		precision mediump float;
		varying vec4 particle_color;
		//out vec4 frag_color;
		
		void main() { gl_FragColor = particle_color; }  
	`);
	gl.compileShader(fragment_shader);
	if (!gl.getShaderParameter(fragment_shader, gl.COMPILE_STATUS)) {
		// alert (gl.getShaderInfoLog(fragment_shader));
	}

	gl.attachShader(dust_program, vertex_shader)
	gl.attachShader(dust_program, fragment_shader)
	gl.linkProgram(dust_program)
	gl.useProgram(dust_program) //necessary?

	//set vertex buffer
	var quad = [
		-1, -1,
		-1,  1,
		1,  1,
		-1, -1,
		1,  1,
		1, -1
	];
	vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad), gl.STATIC_DRAW);

	var dust_attrib_vert = gl.getAttribLocation(dust_program, "vertex");
	gl.vertexAttribPointer(dust_attrib_vert, 2, gl.FLOAT, false, 0, 0);

	dust_loc_position = gl.getUniformLocation(dust_program, "position");
	dust_loc_range = gl.getUniformLocation(dust_program, "range");
	dust_loc_resolution = gl.getUniformLocation(dust_program, "resolution");
	dust_loc_fov = gl.getUniformLocation(dust_program, "fov");
	dust_loc_speed = gl.getUniformLocation(dust_program, "speed");
}

function update_dust(dt:number, fov:number, resolution:number[], particle_array: Dust_particle[], camera_orientation:Quaternion, velocity:Vector3){
	for (var p = 0; p < particle_array.length; p++){
		var r_pos = camera_orientation.get_reverse_rotated_vec(particle_array[p].get_pos());
		var projected_pos = r_pos.get_scaled(Math.abs(1/r_pos.get_z()/fov));
		projected_pos.set_y(projected_pos.get_y()/resolution[0]*resolution[1]); //used to check if particle in frame
		particle_array[p].move(velocity, dt, projected_pos);
	}

}

function draw_dust(gl:any, dt:number, fov:number, resolution:number[], particle_array: Dust_particle[], velocity:Vector3, orientation:Quaternion){

	//gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	gl.useProgram(dust_program);
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.vertexAttribPointer(dust_attrib_vert, 2, gl.FLOAT, false, 0, 0);
	
	gl.uniform2i(dust_loc_resolution, ...resolution);//gl.canvas.width, gl.canvas.height);
	gl.uniform1f(dust_loc_fov, fov);
	gl.uniform1f(dust_loc_range, range);
	let velocity_mag = velocity.get_length()
	gl.uniform1f(dust_loc_speed, velocity_mag);

	for (var p = 0; p < particle_array.length; p++){
		var r_pos = orientation.get_reverse_rotated_vec(particle_array[p].get_pos());
		gl.uniform3f(dust_loc_position, ...r_pos.get_values());
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

}

export{init_dust_shader, update_dust, draw_dust, Dust_particle, generate_dust_array}
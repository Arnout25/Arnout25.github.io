"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate_dust_array = exports.Dust_particle = exports.draw_dust = exports.update_dust = exports.init_dust_shader = void 0;
const vectors_js_1 = require("./vectors.js");
// import { Vector3 } from "./vectors"; // use this import statement for testing
var dust_program;
var dust_loc_position;
var dust_loc_range;
var dust_loc_resolution;
var dust_loc_fov;
var dust_loc_speed;
const range = 100;
var vbo;
var dust_attrib_vert;
function check_error(gl) {
    var err = gl.getError();
    if (err != gl.NO_ERROR) {
        // alert(err)
    }
}
class Dust_particle {
    constructor(max_dist) {
        this.pos = new vectors_js_1.Vector3(0, 0, 0);
        this.range = max_dist;
        this.reset();
    }
    reset() {
        this.pos = new vectors_js_1.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5);
        let m = this.range / this.pos.get_length(); //normalize, then multiply by max_dist
        this.pos.scale(m);
    }
    get_pos() { return this.pos; }
    move(velocity, dt, projected_pos) {
        let c = .02; //curve, higher is slower buildup
        let s = .00003; //speed
        //let animation_speed = vel_mag * s/(1+Math.abs(vel_mag*c));
        let animation_speed = dt;
        this.pos.add(velocity.get_scaled(-animation_speed));
        let dist_sq = this.pos.get_length_sq();
        if (dist_sq > range ** 2 || projected_pos.get_z() > 0 || Math.abs(projected_pos.get_x()) > 1 || Math.abs(projected_pos.get_y()) > 1) {
            this.reset();
        }
    }
}
exports.Dust_particle = Dust_particle;
function generate_dust_array(amount = 500) {
    let particle_array = [];
    for (var p = 0; p < amount; p++) {
        particle_array.push(new Dust_particle(range));
    }
    return particle_array;
}
exports.generate_dust_array = generate_dust_array;
function init_dust_shader(gl) {
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
    gl.attachShader(dust_program, vertex_shader);
    gl.attachShader(dust_program, fragment_shader);
    gl.linkProgram(dust_program);
    gl.useProgram(dust_program); //necessary?
    //set vertex buffer
    var quad = [
        -1, -1,
        -1, 1,
        1, 1,
        -1, -1,
        1, 1,
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
exports.init_dust_shader = init_dust_shader;
function update_dust(dt, fov, resolution, particle_array, camera_orientation, velocity) {
    for (var p = 0; p < particle_array.length; p++) {
        var r_pos = camera_orientation.get_reverse_rotated_vec(particle_array[p].get_pos());
        var projected_pos = r_pos.get_scaled(Math.abs(1 / r_pos.get_z() / fov));
        projected_pos.set_y(projected_pos.get_y() / resolution[0] * resolution[1]); //used to check if particle in frame
        particle_array[p].move(velocity, dt, projected_pos);
    }
}
exports.update_dust = update_dust;
function draw_dust(gl, dt, fov, resolution, particle_array, velocity, orientation) {
    //gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(dust_program);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.vertexAttribPointer(dust_attrib_vert, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2i(dust_loc_resolution, ...resolution); //gl.canvas.width, gl.canvas.height);
    gl.uniform1f(dust_loc_fov, fov);
    gl.uniform1f(dust_loc_range, range);
    let velocity_mag = velocity.get_length();
    gl.uniform1f(dust_loc_speed, velocity_mag);
    for (var p = 0; p < particle_array.length; p++) {
        var r_pos = orientation.get_reverse_rotated_vec(particle_array[p].get_pos());
        gl.uniform3f(dust_loc_position, ...r_pos.get_values());
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}
exports.draw_dust = draw_dust;

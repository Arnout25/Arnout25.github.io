"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bullet = exports.draw_bullets = exports.init_bullet_shader = void 0;
var bullet_program;
var bullet_loc_position;
var bullet_loc_velocity;
var bullet_loc_resolution;
var bullet_loc_fov;
const range = 100;
var vbo;
var bullet_attrib_vert;
function check_error(gl) {
    var err = gl.getError();
    if (err != gl.NO_ERROR) {
        alert(err);
    }
}
class Bullet {
    constructor(position, velocity) {
        this.age = 0;
        this.used = false;
        this.position = position;
        this.velocity = velocity;
    }
    move(dt) {
        this.position.add(this.velocity.get_scaled(dt));
        this.age += dt;
        return (this.age > 8 || this.used);
    }
    get_pos() { return this.position; }
    get_vel() { return this.velocity; }
    isused() { return this.used; }
    hit() { this.used = true; }
}
exports.Bullet = Bullet;
function init_bullet_shader(gl) {
    bullet_program = gl.createProgram();
    var vertex_shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertex_shader, `#version 100
		precision mediump float;
		attribute vec2 vertex;
		
		varying vec4 particle_color;

		uniform vec3 position;
		uniform vec3 velocity;

		uniform ivec2 resolution;
		uniform float fov;

		vec3 cross_product(vec3 v1, vec3 v2);

		void main() {
			particle_color = vec4(1);

			vec3 direction = normalize(velocity);
			vec3 side = normalize(cross(direction, position));

			float length = 10.0;
			float width = .1;

			vec3 screen_pos = position + direction*length*0.5*(vertex.x+1.0) + side*width*0.5*vertex.y;
			//vec3 screen_pos = position + vec3(vertex, 0.0)*5.0;

			gl_Position = vec4(
				screen_pos.x/fov,
				screen_pos.y/fov*float(resolution.x)/float(resolution.y),
				-1.0+(-screen_pos.z-.1)/10000.0,
				-screen_pos.z
			);

		}
	`);
    gl.compileShader(vertex_shader);
    if (!gl.getShaderParameter(vertex_shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(vertex_shader));
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
        alert(gl.getShaderInfoLog(fragment_shader));
    }
    gl.attachShader(bullet_program, vertex_shader);
    gl.attachShader(bullet_program, fragment_shader);
    gl.linkProgram(bullet_program);
    gl.useProgram(bullet_program); //necessary?
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
    var bullet_attrib_vert = gl.getAttribLocation(bullet_program, "vertex");
    gl.vertexAttribPointer(bullet_attrib_vert, 2, gl.FLOAT, false, 0, 0);
    bullet_loc_position = gl.getUniformLocation(bullet_program, "position");
    bullet_loc_velocity = gl.getUniformLocation(bullet_program, "velocity");
    bullet_loc_resolution = gl.getUniformLocation(bullet_program, "resolution");
    bullet_loc_fov = gl.getUniformLocation(bullet_program, "fov");
    check_error(gl);
}
exports.init_bullet_shader = init_bullet_shader;
function draw_bullets(gl, fov, resolution, bullet_array, camera_position, camera_orientation) {
    //gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(bullet_program);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.vertexAttribPointer(bullet_attrib_vert, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2i(bullet_loc_resolution, ...resolution); //gl.canvas.width, gl.canvas.height);
    gl.uniform1f(bullet_loc_fov, fov);
    for (var b = 0; b < bullet_array.length; b++) {
        let rel_pos = camera_orientation.get_reverse_rotated_vec(bullet_array[b].get_pos().get_added(camera_position.neg()));
        let rel_vel = camera_orientation.get_reverse_rotated_vec(bullet_array[b].get_vel());
        gl.uniform3f(bullet_loc_position, ...rel_pos.get_values());
        gl.uniform3f(bullet_loc_velocity, ...rel_vel.get_values());
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}
exports.draw_bullets = draw_bullets;

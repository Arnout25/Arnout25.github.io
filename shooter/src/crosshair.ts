import { Quaternion } from "./quaternions.js";
import { Ship } from "./ship.js";
import { Vector3 } from "./vectors.js";

var crosshair_program: any;
var crosshair_loc_direction: number;
var crosshair_loc_resolution: number;
var crosshair_loc_texture: number;
var crosshair_loc_fov: any;
var vbo: any;
var crosshair_attrib_vert: any;
var aim_texture: any;
var target_texture: any;

function check_error(gl:any){
	var err = gl.getError();
	if (err != gl.NO_ERROR){
		alert(err)
	}
}


function init_crosshair_shader(gl: any){
	
	crosshair_program = gl.createProgram();
	var vertex_shader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertex_shader, `#version 100
		precision mediump float;
		attribute vec2 vertex;
		
		varying vec2 tex_coord;

		uniform vec3 direction;

		uniform ivec2 resolution;
		uniform float fov;

		void main() {
			// gl_Position = vec4(vertex/2.0, -1, 1);
			vec2 screen_pos = (direction.xy / (-direction.z) + vertex/32.0) / fov;
			screen_pos.y *= float(resolution.x)/float(resolution.y);

			gl_Position = vec4(screen_pos, 0, 1);

			tex_coord = vertex/2.0 + .5;
		}
	`);
	gl.compileShader(vertex_shader);
	if (!gl.getShaderParameter(vertex_shader, gl.COMPILE_STATUS)) {
		alert (gl.getShaderInfoLog(vertex_shader));
	}
	var fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragment_shader, `#version 100
		precision mediump float;
		varying vec2 tex_coord;
		
		uniform sampler2D texture;

		void main() { gl_FragColor = texture2D(texture, tex_coord); }
	`);
	gl.compileShader(fragment_shader);
	if (!gl.getShaderParameter(fragment_shader, gl.COMPILE_STATUS)) {
		alert (gl.getShaderInfoLog(fragment_shader));
	}

	gl.attachShader(crosshair_program, vertex_shader)
	gl.attachShader(crosshair_program, fragment_shader)
	gl.linkProgram(crosshair_program)
	gl.useProgram(crosshair_program) //necessary?

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


	//aim texture
	aim_texture = gl.createTexture(); // create empty texture

	var w = 512;
	var h = 512;
	var size = w * h * 4;
	var img = new Uint8Array(size); // need Uint16Array
	for (var i = 0; i < img.length; i += 4) {
		img[i + 0] = 0; // r
		img[i + 1] = 0; // g
		img[i + 2] = 30; // b
		img[i + 3] = 255; // a
	}
	gl.bindTexture(gl.TEXTURE_2D, aim_texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texImage2D(
		gl.TEXTURE_2D, // target
		0, // mip level
		gl.RGBA, // internal format -> gl.RGBA16UI
		w, h, // width and height
		0, // border
		gl.RGBA, //format -> gm.RGBA_INTEGER
		gl.UNSIGNED_BYTE, // type -> gl.UNSIGNED_SHORT
		img // texture data
	);

	const aim_image = new Image();

	aim_image.onload = function() {
		gl.bindTexture(gl.TEXTURE_2D, aim_texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, aim_image);
		gl.generateMipmap(gl.TEXTURE_2D);

	};
	aim_image.src = "./resources/crosshair_aim.png";


	//target texture
	target_texture = gl.createTexture(); // create empty texture

	var w = 512;
	var h = 512;
	var size = w * h * 4;
	var img = new Uint8Array(size); // need Uint16Array
	for (var i = 0; i < img.length; i += 4) {
		img[i + 0] = 0; // r
		img[i + 1] = 0; // g
		img[i + 2] = 30; // b
		img[i + 3] = 255; // a
	}
	gl.bindTexture(gl.TEXTURE_2D, target_texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texImage2D(
		gl.TEXTURE_2D, // target
		0, // mip level
		gl.RGBA, // internal format -> gl.RGBA16UI
		w, h, // width and height
		0, // border
		gl.RGBA, //format -> gm.RGBA_INTEGER
		gl.UNSIGNED_BYTE, // type -> gl.UNSIGNED_SHORT
		img // texture data
	);

	const target_image = new Image();

	target_image.onload = function() {
		gl.bindTexture(gl.TEXTURE_2D, target_texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, target_image);
		gl.generateMipmap(gl.TEXTURE_2D);

	};
	target_image.src = "./resources/crosshair_target.png";


	var crosshair_attrib_vert = gl.getAttribLocation(crosshair_program, "vertex");
	gl.vertexAttribPointer(crosshair_attrib_vert, 2, gl.FLOAT, false, 0, 0);

	crosshair_loc_direction = gl.getUniformLocation(crosshair_program, "direction");
	crosshair_loc_texture = gl.getUniformLocation(crosshair_program, "texture");
	crosshair_loc_resolution = gl.getUniformLocation(crosshair_program, "resolution");
	crosshair_loc_fov = gl.getUniformLocation(crosshair_program, "fov");
}



function draw_crosshair(gl:any, dt:number, fov:number, resolution:number[], camera_orientation:Quaternion, current:Ship, enemy:Ship){

	//gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	gl.useProgram(crosshair_program);
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.vertexAttribPointer(crosshair_attrib_vert, 2, gl.FLOAT, false, 0, 0);
	
	gl.uniform2i(crosshair_loc_resolution, ...resolution);//gl.canvas.width, gl.canvas.height);
	gl.uniform1f(crosshair_loc_fov, fov);

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	let direction:Vector3;
	direction = camera_orientation.get_reverse_rotated_vec(current.get_orientation().get_rotated_vec(new Vector3(0,0,-1)));
	if (direction.get_z() < 0){
		gl.uniform3f(crosshair_loc_direction, ...direction.get_values());
		gl.bindTexture(gl.TEXTURE_2D, aim_texture);
		gl.uniform1i(crosshair_loc_texture, 0);
	
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	if (enemy.alive()){

		let distance = enemy.get_position().get_added(current.get_position().neg()).get_length();
		let bullet_travel_time = distance/current.get_bullet_speed();
	
		let future_position = enemy.get_position().get_added(enemy.get_velocity().get_scaled(bullet_travel_time));
		
		direction = camera_orientation.get_reverse_rotated_vec(future_position.get_added(current.get_position().neg()));
		if (direction.get_z() < 0){
			gl.uniform3f(crosshair_loc_direction, ...direction.get_values());
			gl.bindTexture(gl.TEXTURE_2D, target_texture);
			gl.uniform1i(crosshair_loc_texture, 0);
		
			gl.drawArrays(gl.TRIANGLES, 0, 6);
		}
	}

	check_error(gl);

}

export{init_crosshair_shader, draw_crosshair}
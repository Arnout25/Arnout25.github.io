import {m4} from './matrices.js'

var cell_program: any;
var vao: any;
var pos_buffer: any;
var instance_pos_loc: any;
var transformationLoc: any;
var cell_positions: number[] = [];
var startAnimationLoc: any;
var notifyAnimationLoc: any;

type pos = [number, number];
let grid = new Set<string>();

var depth = 60;

function init_cell_shader(gl: any, aspect_ratio: number){
	
	cell_program = gl.createProgram();
	var vertex_shader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertex_shader, `#version 300 es

		in vec3 instance_pos;
		in vec3 vert_position;
		in vec3 vert_normal;
		uniform mat4 transformation;
		uniform vec2 start_animation;
		uniform vec3 notify_animation;
		vec3 color = vec3(0,1,0);

		out vec3 vertexColor;

		void main() {

			float this_size = min(max(0.0, (start_animation.x-instance_pos.x+instance_pos.y/2.0)/start_animation.y), 1.0);

			gl_Position = transformation * (vec4(vert_position*1.01*this_size + instance_pos, 1.0));
			gl_Position /= gl_Position.w;

			float brightness = asin(dot(vert_normal, normalize(vec3(-1,1.5,2))));
			
			float nf = notify_animation.x - length(instance_pos.xy)/notify_animation.y;

			if (nf > 0.0) {
				nf = mod(nf, notify_animation.z);
			}

			float lvl = smoothstep(0.0, 1.0, max(0.0, min(nf, 2.0-nf)));
			vertexColor = color + vec3(1)*lvl*0.7;

			brightness = max(0.1, brightness);
			vertexColor = vertexColor * brightness;//(gl_Position.z-0.4);
			//gl_Position.z = 0.5;
		}
	`);
	gl.compileShader(vertex_shader);
	if (!gl.getShaderParameter(vertex_shader, gl.COMPILE_STATUS)) {
		alert(gl.getShaderInfoLog(vertex_shader));
	}
	var fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragment_shader, `#version 300 es

		precision mediump float;

		in vec3 vertexColor;

		out vec4 fragColor;

		void main() {
			fragColor = vec4(vertexColor, 1.0);
		}
	`);
	gl.compileShader(fragment_shader);
	if (!gl.getShaderParameter(fragment_shader, gl.COMPILE_STATUS)) {
		alert(gl.getShaderInfoLog(fragment_shader));
	}
	gl.attachShader(cell_program, vertex_shader);
	gl.attachShader(cell_program, fragment_shader);
	gl.linkProgram(cell_program);
	gl.useProgram(cell_program); //necessary?

	
	vao = gl.createVertexArray();
	// and make it the one we're currently working with
	gl.bindVertexArray(vao);

	
	transformationLoc = gl.getUniformLocation(cell_program, 'transformation');
	startAnimationLoc = gl.getUniformLocation(cell_program, 'start_animation');
	notifyAnimationLoc = gl.getUniformLocation(cell_program, 'notify_animation');

	
	// Create the vertex buffer and bind it
	var vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

	var vertices = [
		// front face
		-0.5,-0.5,1,
		0, 0, 1,
		0.5,-0.5,1,
		0, 0, 1,
		-0.5,0.5,1,
		0, 0, 1,
		0.5,-0.5,1,
		0, 0, 1,
		-0.5,0.5,1,
		0, 0, 1,
		0.5, 0.5,1,
		0, 0, 1,
		
		// left face
		-0.5,-0.5,.95,
		-1, 0, 0,
		-0.5,-0.5,0,
		-1, 0, 0,
		-0.5,0.5,.95,
		-1, 0, 0,
		-0.5,-0.5,0,
		-1, 0, 0,
		-0.5,0.5,.95,
		-1, 0, 0,
		-0.5, 0.5,0,
		-1, 0, 0,

		// right face
		0.5,-0.5,.95,
		1, 0, 0,
		0.5,-0.5,0,
		1, 0, 0,
		0.5,0.5,.95,
		1, 0, 0,
		0.5,-0.5,0,
		1, 0, 0,
		0.5,0.5,.95,
		1, 0, 0,
		0.5, 0.5,0,
		1, 0, 0,

		// top face
		-0.5, 0.5, .95,
		0, 1, 0,
		-0.5, 0.5, 0,
		0, 1, 0,
		 0.5, 0.5, .95,
		0, 1, 0,
		-0.5, 0.5, 0,
		0, 1, 0,
		 0.5, 0.5, .95,
		0, 1, 0,
		 0.5, 0.5, 0,
		0, 1, 0,

		
		// bot face
		-0.5, -0.5, .95,
		0, -1, 0,
		-0.5, -0.5, 0,
		0, -1, 0,
		 0.5, -0.5, .95,
		0, -1, 0,
		-0.5, -0.5, 0,
		0, -1, 0,
		 0.5, -0.5, .95,
		0, -1, 0,
		 0.5, -0.5, 0,
		0, -1, 0,


	];

	// Upload the position and color data to the vertex buffer
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	// Enable the position attribute and set its pointer
	var positionAttributeLocation = gl.getAttribLocation(cell_program, 'vert_position');
	gl.enableVertexAttribArray(positionAttributeLocation);
	gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0);

	// Enable the position attribute and set its pointer
	var normalAttributeLocation = gl.getAttribLocation(cell_program, 'vert_normal');
	gl.enableVertexAttribArray(normalAttributeLocation);
	gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);



	
	var instance_positions = [
		-1,0,0,
		0,1,0,
		1,0,0,
	];

	// setup colors, one per instance
	pos_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, pos_buffer);
	gl.bufferData(gl.ARRAY_BUFFER,
		new Float32Array(instance_positions),
		gl.STATIC_DRAW);

	
	instance_pos_loc = gl.getAttribLocation(cell_program, 'instance_pos');
	// set attribute for color
	gl.enableVertexAttribArray(instance_pos_loc);
	gl.vertexAttribPointer(instance_pos_loc, 3, gl.FLOAT, false, 0, 0);
	// this line says this attribute only changes for each 1 instance
	gl.vertexAttribDivisor(instance_pos_loc, 1);

	// console.log('neg')
	// console.log(m4.onvectorN(m4.projection(90, 1, 0.1, 10), .1,.1, -0.1));
	// console.log(m4.onvectorN(m4.projection(90, 1, 0.1, 10), .1,.1, -0.5));
	// console.log(m4.onvectorN(m4.projection(90, 1, 0.1, 10), .1,.1, -1));
	// console.log(m4.onvectorN(m4.projection(90, 1, 0.1, 10), .1,.1, -5));
	// console.log(m4.onvectorN(m4.projection(90, 1, 0.1, 10), .1,.1, -10));

	
	// console.log('pos')
	// console.log(m4.onvectorN(m4.projection(90, 1, 0.1, 10), .1,.1, 0.1));
	// console.log(m4.onvectorN(m4.projection(90, 1, 0.1, 10), .1,.1, 0.5));
	// console.log(m4.onvectorN(m4.projection(90, 1, 0.1, 10), .1,.1, 1));
	// console.log(m4.onvectorN(m4.projection(90, 1, 0.1, 10), .1,.1, 5));
	// console.log(m4.onvectorN(m4.projection(90, 1, 0.1, 10), .1,.1, 10));
	// check_error()


	const title_image = new Image();

	title_image.onload = function() {
		const canvas = document.createElement('canvas');
		canvas.width = title_image.width;
		canvas.height = title_image.height;

		const context = canvas.getContext('2d');
		if (!context) {
			alert('Could not get 2D context for title image');
			return;
		}

		context.drawImage(title_image, 0, 0);
		const imageData = context.getImageData(0, 0, title_image.width, title_image.height);
		const pixels = Array.from(imageData.data);


		for (let x = 0; x < title_image.width; x++) {
			for (let y = 0; y < title_image.height; y++){
				const r = pixels[(x + title_image.width*y)*4];
				if (r < 135)
					grid.add(JSON.stringify([Math.floor(x - title_image.width/2), Math.floor(title_image.height/2 - y)]));

			}
		}

		// grid.add(JSON.stringify([0,-1]))
		// grid.add(JSON.stringify([0,0]))
		// grid.add(JSON.stringify([0,1]))
		update_cells();



	};

	if (aspect_ratio > 1) {
		title_image.src = "./resources/Title_single2.png";"https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png";//"./sky.png";
	} else {
		title_image.src = "./resources/Title_double2.png";
		depth = Math.floor(50/aspect_ratio);
	}
}

function update_cells(){
	cell_positions = [];

	grid.forEach((tupleString) => {
		const p: pos = JSON.parse(tupleString);
		cell_positions.push(p[0], p[1], 0);
	});
}

let nbs = [
	0,  1,
	1,  1,
	1,  0,
	1, -1,
	0, -1,
	-1,-1,
	-1, 0,
	-1, 1,
]

function update_grid(){

	let new_grid = new Set<string>();

	let checking = new Set<string>();
	
	grid.forEach((c) => {
		

		checking.add(c);
		
		const p: pos = JSON.parse(c);

		for (let i = 0; i < 8; i++){
			checking.add(JSON.stringify([p[0]+nbs[i*2], p[1]+nbs[i*2+1]]));
		}
	});

	checking.forEach((c) => {

		const p: pos = JSON.parse(c);

		let count = 0;

		for (let i = 0; i < 8; i++){
			//const p: pos = [nbs[i*2], nbs[i*2]+1];
			if (grid.has(JSON.stringify([p[0]+nbs[i*2], p[1]+nbs[i*2+1]])))
				count++;
		}

		// console.log(tuple[0], tuple[1],grid.has([tuple[0], tuple[1]]));

		if (grid.has(c)){
			if (count == 2 || count == 3){
				new_grid.add(c)
			}
		} else {
			if (count == 3){
				new_grid.add(c)
			}
		}
	});

	grid = new_grid;

	update_cells();
}

var last_update_time = 0;
var step_length = .6;
function draw_cell_shader(gl: any, running: boolean, aspect_ratio: number, time: number, tiltX: number, tiltY: number){

	if (running){
		if (step_length < (time - last_update_time)*.001){
			update_grid();
			last_update_time = time;
			if (step_length > .03){
				step_length -= .05*step_length;
			}
		}
	}
	
	gl.useProgram(cell_program);
	
    const w = gl.canvas.clientWidth;
    const h = gl.canvas.clientHeight;
    // gl.uniformMatrix4fv(transformationLoc, false, m4.translation(Math.cos(time*0.001), Math.sin(time*0.001), 0));
	
	let transformation = m4.translate(m4.projection(90, aspect_ratio, 0.1, 200), Math.cos(time*0.001*.6)*2, Math.sin(time*0.001*.6*2), -depth);
	transformation = m4.yRotate(transformation, tiltX);
	transformation = m4.xRotate(transformation, tiltY);

    gl.uniformMatrix4fv(transformationLoc, false, transformation);
    // gl.uniformMatrix4fv(transformationLoc, false, m4.identity());
	//console.log(m4.translation(0,0.1,0));
	gl.uniform2f(startAnimationLoc, time*.001 *80-100, 40);
	if (running){
		gl.uniform3f(notifyAnimationLoc, 0, 1, 1);
	} else {
		gl.uniform3f(notifyAnimationLoc, (time*.001-4) *2, 100, 4);
	}

    gl.bindVertexArray(vao);
	// gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	// gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
	// gl.drawArrays(gl.TRIANGLES, 0, 6);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, pos_buffer);
	gl.bufferData(gl.ARRAY_BUFFER,
		new Float32Array(cell_positions),
		gl.STATIC_DRAW);
	// gl.vertexAttribPointer(instance_pos_loc, 3, gl.FLOAT, false, 0, 0);
	
	
    gl.drawArraysInstanced(
		gl.TRIANGLES,
		0,             // offset
		6*5,   // num vertices per instance
		cell_positions.length/3,  // num instances
	);

}



export{init_cell_shader, draw_cell_shader}
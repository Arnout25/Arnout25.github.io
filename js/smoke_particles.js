import { Vector3 } from "./vectors.js";
var smoke_program;
var smoke_loc_position;
var smoke_loc_rotation;
var smoke_loc_alpha;
var smoke_loc_size;
var smoke_loc_resolution;
var smoke_loc_fov;
var smoke_loc_texture;
var particle_array;
var smoke_texture;
var vbo;
var smoke_attrib_vert;
function check_error(gl) {
    var err = gl.getError();
    if (err != gl.NO_ERROR) {
        alert(err);
    }
}
class Smoke_particle {
    constructor() {
        this.pos = new Vector3();
        this.rotation = 0; //randomize rotations so it looks less uniform
        this.life = 1000; //life in seconds
        this.using = false;
        this.rel_pos = new Vector3(); //used for depth sorting, to make transparency work
    }
    being_used() { return this.using; }
    reset(pos) {
        let rand_offset = .5;
        this.pos = pos.get_added(new Vector3(Math.random() * rand_offset, Math.random() * rand_offset, Math.random() * rand_offset));
        this.rotation = Math.random() * 2 * Math.PI;
        this.life = 0;
        this.using = true;
    }
    get_pos() { return this.pos; }
    get_rotation() { return this.rotation; }
    get_alpha_and_size() {
        let full_start = 2;
        let fade_start = 3;
        let fade_end = 8;
        let alpha = this.life < full_start ? this.life / full_start : this.life < fade_start ? 1 : (fade_end - this.life) / (fade_end - fade_start);
        let size = 1 + this.life / 5;
        return [alpha, size];
    }
    update(dt) {
        this.life += dt;
        this.using = (this.life < 8);
    }
}
function init_smoke_shader(gl) {
    smoke_program = gl.createProgram();
    var vertex_shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertex_shader, `#version 100
		precision mediump float;
		attribute vec2 vertex;
		
		uniform vec3 position;
		uniform float rotation;
		uniform float size;

		uniform ivec2 resolution;
		uniform float fov;

		varying vec2 tex_coord;

		vec2 rotate2d(vec2 v, float rot){
			float x = cos(rot)*v.x - sin(rot)*v.y;
			float y = cos(rot)*v.y + sin(rot)*v.x;
			return vec2(x,y);
		}

		void main() {
			tex_coord = vertex/2.0+.5;
			gl_Position = vec4(vertex/2.0, 0, 1);
			
			if (position.z < 0.0){ //-z is forward

				vec2 vert_pos = rotate2d(vertex, rotation);
				vec2 screen_pos = position.xy + vert_pos.xy * size;
				
				gl_Position = vec4(
					screen_pos.x/fov,
					screen_pos.y/fov*float(resolution.x)/float(resolution.y),
					-1.0+(-position.z-.1)/10000.0,
					-position.z
				);

			} else {
				gl_Position = vec4(-2,-2, 0,1);
			}
		}
	`);
    gl.compileShader(vertex_shader);
    if (!gl.getShaderParameter(vertex_shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(vertex_shader));
    }
    var fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragment_shader, `#version 100
		precision mediump float;
		
		uniform sampler2D tex;
		uniform float alpha;

		varying vec2 tex_coord;
		//out vec4 frag_color;
		
		void main() { 
			gl_FragColor = texture2D(tex, tex_coord);
			gl_FragColor.a *= alpha;
			//gl_FragColor = vec4(1);
		}  
	`);
    gl.compileShader(fragment_shader);
    if (!gl.getShaderParameter(fragment_shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(fragment_shader));
    }
    gl.attachShader(smoke_program, vertex_shader);
    gl.attachShader(smoke_program, fragment_shader);
    gl.linkProgram(smoke_program);
    gl.useProgram(smoke_program); //necessary?
    //set texture uniform
    smoke_texture = gl.createTexture(); // create empty texture
    // array image
    var w = 256;
    var h = 256;
    var size = w * h * 4;
    var img = new Uint8Array(size); // need Uint16Array
    for (var i = 0; i < img.length; i += 4) {
        img[i + 0] = 0; // r
        img[i + 1] = 0; // g
        img[i + 2] = 30; // b
        img[i + 3] = 255; // a
    }
    gl.bindTexture(gl.TEXTURE_2D, smoke_texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, // target
    0, // mip level
    gl.RGBA, // internal format -> gl.RGBA16UI
    w, h, // width and height
    0, // border
    gl.RGBA, //format -> gm.RGBA_INTEGER
    gl.UNSIGNED_BYTE, // type -> gl.UNSIGNED_SHORT
    img // texture data
    );
    const smoke_image = new Image();
    smoke_image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, smoke_texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, smoke_image);
    };
    smoke_image.src = "./resources/smoke1.png";
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
    smoke_attrib_vert = gl.getAttribLocation(smoke_program, "vertex");
    gl.vertexAttribPointer(smoke_attrib_vert, 2, gl.FLOAT, false, 0, 0);
    smoke_loc_position = gl.getUniformLocation(smoke_program, "position");
    smoke_loc_rotation = gl.getUniformLocation(smoke_program, "rotation");
    smoke_loc_alpha = gl.getUniformLocation(smoke_program, "alpha");
    smoke_loc_size = gl.getUniformLocation(smoke_program, "size");
    smoke_loc_texture = gl.getUniformLocation(smoke_program, "tex");
    smoke_loc_resolution = gl.getUniformLocation(smoke_program, "resolution");
    smoke_loc_fov = gl.getUniformLocation(smoke_program, "fov");
    particle_array = [];
    for (var p = 0; p < 1500; p++) {
        particle_array.push(new Smoke_particle());
    }
}
function update_smoke(dt) {
    var p = 0;
    for (var p = 0; p < particle_array.length; p++) {
        particle_array[p].update(dt);
    }
}
function draw_smoke(gl, dt, fov, resolution, camera_position, camera_orientation, ship) {
    //gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    let adding_new = false;
    let new_particle_pos = new Vector3();
    //add and update particles
    if (ship.alive()) {
        let vel = -ship.get_forward_thrust();
        if (Math.random() < dt * 1 * vel) { //eg 300 per second if 300m/s
            adding_new = true;
            let side = new Vector3();
            if (Math.random() < .5) {
                side = new Vector3(-3, 0, 5);
            } //left
            else {
                side = new Vector3(3, 0, 5);
            } //right
            side.set_z(side.get_z() + Math.random() * 8 - 4);
            new_particle_pos = ship.get_position().get_added(ship.get_orientation().get_rotated_vec(side));
        }
    }
    for (var p = 0; p < particle_array.length; p++) {
        if (adding_new && !particle_array[p].being_used()) {
            particle_array[p].reset(new_particle_pos);
            adding_new = false;
        }
        if (particle_array[p].being_used()) {
            particle_array[p].rel_pos = camera_orientation.get_reverse_rotated_vec(particle_array[p].get_pos().get_added(camera_position.neg()));
        }
    }
    //sort to fix transparency
    particle_array.sort(function (a, b) { return +(a.rel_pos.get_z() > b.rel_pos.get_z()) * 2 - 1; });
    //draw
    gl.useProgram(smoke_program);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.vertexAttribPointer(smoke_attrib_vert, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2i(smoke_loc_resolution, ...resolution); //gl.canvas.width, gl.canvas.height);
    gl.uniform1f(smoke_loc_fov, fov);
    gl.bindTexture(gl.TEXTURE_2D, smoke_texture);
    gl.uniform1i(smoke_loc_texture, 0);
    for (var p = 0; p < particle_array.length; p++) {
        if (particle_array[p].being_used()) {
            //particle_array[p].update(dt);
            let [alpha, size] = particle_array[p].get_alpha_and_size();
            gl.uniform3f(smoke_loc_position, ...particle_array[p].rel_pos.get_values());
            gl.uniform1f(smoke_loc_rotation, particle_array[p].get_rotation());
            gl.uniform1f(smoke_loc_alpha, alpha);
            gl.uniform1f(smoke_loc_size, size);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    }
}
export { init_smoke_shader, update_smoke, draw_smoke };

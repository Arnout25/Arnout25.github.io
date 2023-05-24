"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.check_model_bullet_collision = exports.check_model_collision = exports.Model = exports.draw_models = exports.init_model_shader = void 0;
const quaternions_js_1 = require("./quaternions.js");
const vectors_js_1 = require("./vectors.js");
var model_program;
var model_attrib_position;
var model_attrib_texCoord;
var model_attrib_normal;
var palette_texture;
var model_loc_modelOrientation;
var model_loc_modelPosition;
var model_loc_orientation;
var model_loc_position;
var model_loc_emission_scalar;
var model_loc_resolution;
var model_loc_texture;
var model_loc_fov;
var obstacle_models;
var obstacle_positions; //array of model_id, posx, posy, posz
function loadFile(filePath) {
    var result;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", filePath, false);
    xmlhttp.send();
    if (xmlhttp.status == 200) {
        result = xmlhttp.responseText;
    }
    else {
        result = 'empty?';
    }
    return result;
}
class Model {
    constructor(gl, address, y_offset, scale, collision_address = "", dimensions = new vectors_js_1.Vector3()) {
        this.model_data = new Float32Array([]);
        this.vbo = 0;
        this.has_grid = false;
        this.collision_grid = "";
        this.dimensions = new vectors_js_1.Vector3();
        this.max_range = 0;
        //create vertex buffer object:
        this.vbo = gl.createBuffer();
        //face: vertex, texture, normal
        let vertices = [];
        let normals = [];
        let texture_coords = [];
        let obj_data = loadFile(address);
        let lines = obj_data.split('\n');
        for (let l = 0; l < lines.length; l++) {
            let words = lines[l].split(' ');
            if (words.length > 0) {
                if (words[0] == 'vn') {
                    normals.push([parseFloat(words[1]), parseFloat(words[2]), parseFloat(words[3])]);
                } //z components negative
                if (words[0] == 'vt') {
                    texture_coords.push([parseFloat(words[1]), parseFloat(words[2])]);
                }
                if (words[0] == 'v') {
                    vertices.push([parseFloat(words[1]) * scale, (parseFloat(words[2]) + y_offset) * scale, parseFloat(words[3]) * scale]);
                }
            }
        }
        let model_data = [];
        for (let l = 0; l < lines.length; l++) {
            let words = lines[l].split(' ');
            if (words.length > 0) {
                if (words[0] == 'f') {
                    for (let v = 1; v < 4; v++) {
                        let vertex_data = words[v].split('/');
                        let [v_id, t_id, n_id] = vertex_data;
                        //ids start at 1
                        let [vx, vy, vz] = vertices[parseFloat(v_id) - 1];
                        let [tx, ty] = texture_coords[parseFloat(t_id) - 1];
                        let [nx, ny, nz] = normals[parseFloat(n_id) - 1];
                        model_data.push(vx, vy, vz, tx, ty, nx, ny, nz);
                    }
                }
            }
        }
        this.model_data = new Float32Array(model_data);
        //bind data to buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.model_data, gl.STATIC_DRAW);
        //set collision grid
        if (collision_address != "") {
            this.has_grid = true;
            this.dimensions = dimensions;
            this.collision_grid = loadFile(collision_address);
            if (this.collision_grid == "empty?") {
                alert('cant find: ' + collision_address);
            }
        }
    }
    bind(gl) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.enableVertexAttribArray(model_attrib_position);
        gl.vertexAttribPointer(model_attrib_position, 3, gl.FLOAT, false, 8 * 4, 0);
        gl.enableVertexAttribArray(model_attrib_texCoord);
        gl.vertexAttribPointer(model_attrib_texCoord, 2, gl.FLOAT, false, 8 * 4, 3 * 4);
        gl.enableVertexAttribArray(model_attrib_normal);
        gl.vertexAttribPointer(model_attrib_normal, 3, gl.FLOAT, false, 8 * 4, 5 * 4);
    }
    get_vertices_count() {
        return this.model_data.length / 8;
    }
    check_point_inside(relative_point) {
        let x = Math.floor(relative_point.get_x() / 20.0 + this.dimensions.get_x() / 2);
        let y = Math.floor(relative_point.get_y() / 20.0 + this.dimensions.get_y() / 2);
        let z = Math.floor(relative_point.get_z() / 20.0 + this.dimensions.get_z() / 2);
        if (0 <= x && x < this.dimensions.x && 0 <= y && y < this.dimensions.y && 0 <= z && z < this.dimensions.z) {
            let pos_index = x + z * this.dimensions.x + (this.dimensions.y - y - 1) * this.dimensions.x * this.dimensions.z;
            if (this.collision_grid[pos_index] == "1") {
                return true;
            }
        }
        //console.log(x,y,z);
        return false;
    }
}
exports.Model = Model;
function init_model_shader(gl) {
    model_program = gl.createProgram();
    var vertex_shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertex_shader, `#version 100
		precision mediump float;

		attribute vec3 v_pos;
		attribute vec2 tex_coord;
		attribute vec3 normal;

		uniform sampler2D palette;
		uniform vec3 model_position;
		uniform vec3 model_orientation;
		uniform vec3 orientation;
		uniform vec3 position;
		uniform float emission_scalar;
		uniform float fov;
		uniform ivec2 resolution;

		varying vec4 color;
		varying vec2 screen_pos;

		vec3 rotate(vec3 v, vec3 rot){
			float roll = rot[0];
			float pitch = rot[1];
			float yaw = rot[2];
			float x = v.x;
			float y = v.y;
			float z = v.z;
			
			//forward:
			float x2 = cos(roll)*x - sin(roll)*y;
			float y2 = cos(roll)*y + sin(roll)*x;

			float y3 = cos(pitch)*y2 + sin(pitch)*z;
			float z2 = cos(pitch)*z - sin(pitch)*y2;

			float x3 = cos(yaw)*x2 - sin(yaw)*z2;
			float z3 = cos(yaw)*z2 + sin(yaw)*x2;
			
			return vec3(x3,y3,z3);
		}

		vec3 reverse_rotate(vec3 v, vec3 rot){
			float roll = rot[0];
			float pitch = rot[1];
			float yaw = rot[2];
			float x = v.x;
			float y = v.y;
			float z = v.z;
			
			//reverse:
			float x2 = cos(yaw)*x + sin(yaw)*z;
			float z2 = cos(yaw)*z - sin(yaw)*x;

			float y2 = cos(pitch)*y - sin(pitch)*z2;
			float z3 = cos(pitch)*z2 + sin(pitch)*y;

			float x3 = cos(roll)*x2 + sin(roll)*y2;
			float y3 = cos(roll)*y2 - sin(roll)*x2;

			return vec3(x3,y3,z3);
		}

		void main(){
			vec3 world_pos = rotate(v_pos, model_orientation) + model_position;
			vec3 tpos = reverse_rotate((world_pos-position), orientation);
			
			gl_Position = vec4(
				tpos.x/fov,
				tpos.y/fov*float(resolution.x)/float(resolution.y),
				-1.0+(-tpos.z-.1)/10000.0,
				-tpos.z
			);
			
			if (tex_coord.x < .4){ //first colors in palette are emission colors (not depending on brightness, only emission_scalar)
				color = texture2D(palette, tex_coord);
				color.rgb = color.rgb*min(emission_scalar,1.0);
			} else {
				vec3 world_n = rotate(normal, model_orientation);
				float brightness = max(0.0, dot(vec3(-1,0,0), world_n));
				float brightness_ambient = max(0.0, 0.1+.05*dot(vec3(.2,.5,.8), world_n));
				color = texture2D(palette, tex_coord);
				color.rgb = color.rgb*min(brightness+brightness_ambient,1.0);
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
		varying vec4 color;
		//out vec4 frag_color;
		
		void main() { gl_FragColor = color; }  
	`);
    gl.compileShader(fragment_shader);
    if (!gl.getShaderParameter(fragment_shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(fragment_shader));
    }
    gl.attachShader(model_program, vertex_shader);
    gl.attachShader(model_program, fragment_shader);
    gl.linkProgram(model_program);
    gl.useProgram(model_program); //necessary?
    //set texture uniform
    palette_texture = gl.createTexture(); // create empty texture
    // array image
    var w = 256;
    var h = 1;
    var size = w * h * 4;
    var img = new Uint8Array(size); // need Uint16Array
    for (var i = 0; i < img.length; i += 4) {
        img[i + 0] = 0; // r
        img[i + 1] = 0; // g
        img[i + 2] = 30; // b
        img[i + 3] = 255; // a
    }
    gl.bindTexture(gl.TEXTURE_2D, palette_texture);
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
    const palette_image = new Image();
    palette_image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, palette_texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, palette_image);
    };
    palette_image.src = "./resources/models/palette.png";
    //uniforms
    model_loc_modelOrientation = gl.getUniformLocation(model_program, "model_orientation");
    model_loc_modelPosition = gl.getUniformLocation(model_program, "model_position");
    model_loc_orientation = gl.getUniformLocation(model_program, "orientation");
    model_loc_position = gl.getUniformLocation(model_program, "position");
    model_loc_emission_scalar = gl.getUniformLocation(model_program, "emission_scalar");
    model_loc_texture = gl.getUniformLocation(model_program, "palette");
    model_loc_resolution = gl.getUniformLocation(model_program, "resolution");
    model_loc_fov = gl.getUniformLocation(model_program, "fov");
    //set vertex buffer
    model_attrib_position = gl.getAttribLocation(model_program, "v_pos");
    model_attrib_texCoord = gl.getAttribLocation(model_program, "tex_coord");
    model_attrib_normal = gl.getAttribLocation(model_program, "normal");
    obstacle_models = [
        new Model(gl, "./resources/models/obstacle1.obj", -3.2 / 2, 200, "./resources/models/obstacle1.grid", new vectors_js_1.Vector3(32)),
        new Model(gl, "./resources/models/obstacle2.obj", -3.2 / 2, 200, "./resources/models/obstacle2.grid", new vectors_js_1.Vector3(32)),
        new Model(gl, "./resources/models/obstacle3.obj", -5.8 / 2, 200, "./resources/models/obstacle3.grid", new vectors_js_1.Vector3(58)),
        new Model(gl, "./resources/models/obstacle4.obj", -3.2 / 2, 200, "./resources/models/obstacle4.grid", new vectors_js_1.Vector3(32)),
        new Model(gl, "./resources/models/obstacle5.obj", -8.2 / 2, 200, "./resources/models/obstacle5.grid", new vectors_js_1.Vector3(82)),
        new Model(gl, "./resources/models/obstacle6.obj", -1.6 / 2, 200, "./resources/models/obstacle6.grid", new vectors_js_1.Vector3(16)),
        new Model(gl, "./resources/models/obstacle7.obj", -6.4 / 2, 200, "./resources/models/obstacle7.grid", new vectors_js_1.Vector3(64)),
        new Model(gl, "./resources/models/obstacle8.obj", -2.8 / 2, 200, "./resources/models/obstacle8.grid", new vectors_js_1.Vector3(28)),
        new Model(gl, "./resources/models/spawn_player1.obj", -2.2 / 2, 200, "./resources/models/spawn_player1.grid", new vectors_js_1.Vector3(22)),
        new Model(gl, "./resources/models/spawn_player2.obj", -2.2 / 2, 200, "./resources/models/spawn_player2.grid", new vectors_js_1.Vector3(22)),
    ];
    obstacle_positions = [
        [1, new vectors_js_1.Vector3(0, -2000, 0), new quaternions_js_1.Quaternion(.8, 0, .1)],
        [2, new vectors_js_1.Vector3(1600, -400, -2000), new quaternions_js_1.Quaternion(.5, 0, .2)],
        [3, new vectors_js_1.Vector3(-1200, 1200, -1200), new quaternions_js_1.Quaternion(.2, 0, .5)],
        [4, new vectors_js_1.Vector3(-3000, 400, 2400), new quaternions_js_1.Quaternion(0, 0, 1.3)],
        [5, new vectors_js_1.Vector3(-1800, 200, -1600), new quaternions_js_1.Quaternion(0, 0, -.3)],
        [6, new vectors_js_1.Vector3(1400, -1200, 800), new quaternions_js_1.Quaternion(.4, 0, .8)],
        [7, new vectors_js_1.Vector3(-400, -800, 0), new quaternions_js_1.Quaternion(0, 0, 0)],
        [8, new vectors_js_1.Vector3(-900, 1200, 1200), new quaternions_js_1.Quaternion(.4, 0, 1.8)],
        [1, new vectors_js_1.Vector3(-900, -500, 1700), new quaternions_js_1.Quaternion(.2, .8, .1)],
        [6, new vectors_js_1.Vector3(900, 900, 600), new quaternions_js_1.Quaternion(.1, .4, 1.8)],
        [8, new vectors_js_1.Vector3(1200, 700, -1400), new quaternions_js_1.Quaternion(.1, 0, -.4)],
        [9, new vectors_js_1.Vector3(0, 0, 3000), new quaternions_js_1.Quaternion()],
        [10, new vectors_js_1.Vector3(0, 0, -3000), new quaternions_js_1.Quaternion()],
    ];
}
exports.init_model_shader = init_model_shader;
function check_model_collision(dt, ship) {
    for (let o = 0; o < obstacle_positions.length; o++) {
        let [id, position, orientation] = obstacle_positions[o];
        if (obstacle_models[id - 1].has_grid) {
            let rel_pos = ship.get_position().get_added(position.neg());
            if (rel_pos.get_length_sq() < obstacle_models[id - 1].dimensions.get_length_sq() * .5 ** 2 * 20 ** 2) { //if in range of model
                let samples = ship.get_velocity().get_length() / 5; //sample every 5 units
                for (let s = 0; s < samples; s++) {
                    let sample_position = ship.get_position().get_added(ship.get_velocity().get_scaled(-dt * s / samples));
                    for (let p = 0; p < 5; p++) {
                        let point = sample_position.get_added(ship.get_orientation().get_rotated_vec(new vectors_js_1.Vector3(-5 + 2.5 * p, 0, 0)));
                        let rel_point = orientation.get_reverse_rotated_vec(point.get_added(position.neg()));
                        if (obstacle_models[id - 1].check_point_inside(rel_point)) {
                            ship.damage(1, false);
                            break;
                        }
                    }
                }
            }
        }
    }
}
exports.check_model_collision = check_model_collision;
function check_model_bullet_collision(dt, bullets) {
    for (let b = 0; b < bullets.length; b++) {
        obstacle_loop: for (let o = 0; o < obstacle_positions.length; o++) {
            let [id, position, orientation] = obstacle_positions[o];
            if (obstacle_models[id - 1].has_grid) {
                let rel_pos = bullets[b].get_pos().get_added(position.neg());
                if (rel_pos.get_length_sq() < obstacle_models[id - 1].dimensions.get_length_sq() * .5 ** 2 * 20 ** 2) { //if in range of model
                    let samples = bullets[b].get_vel().get_length() / 5; //sample every 5 units
                    for (let s = 0; s < samples; s++) {
                        let sample_position = bullets[b].get_pos().get_added(bullets[b].get_vel().get_scaled(-dt * s / samples));
                        let rel_point = orientation.get_reverse_rotated_vec(sample_position.get_added(position.neg()));
                        if (obstacle_models[id - 1].check_point_inside(rel_point)) {
                            bullets[b].hit();
                            break obstacle_loop;
                        }
                    }
                }
            }
        }
    }
}
exports.check_model_bullet_collision = check_model_bullet_collision;
function draw_models(gl, fov, resolution, camera_position, camera_orienation, ship1, ship2) {
    //gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    //obstacle_positions[11][2] = new Quaternion(0,new Date().getTime()/1000,new Date().getTime()/1000);
    gl.useProgram(model_program);
    let [croll, cpitch, cyaw] = camera_orienation.get_euler();
    gl.uniform3f(model_loc_orientation, croll, cpitch, cyaw);
    gl.uniform3f(model_loc_position, ...camera_position.get_values());
    gl.uniform1f(model_loc_fov, fov);
    gl.uniform2i(model_loc_resolution, ...resolution); //gl.canvas.width, gl.canvas.height);
    gl.bindTexture(gl.TEXTURE_2D, palette_texture);
    gl.uniform1i(model_loc_texture, 0);
    //ship:
    if (ship1.alive()) {
        ship1.get_model().bind(gl);
        let [roll, pitch, yaw] = ship1.get_orientation().get_euler();
        gl.uniform3f(model_loc_modelOrientation, roll, pitch, yaw);
        gl.uniform3f(model_loc_modelPosition, ...ship1.get_position().get_values());
        gl.uniform1f(model_loc_emission_scalar, -ship1.get_forward_thrust() / 50 / (1 + Math.abs(ship1.get_forward_thrust()) / 50));
        gl.drawArrays(gl.TRIANGLES, 0, ship2.get_model().get_vertices_count());
    }
    //ship2:
    if (ship2.alive()) {
        ship2.get_model().bind(gl);
        let [roll, pitch, yaw] = ship2.get_orientation().get_euler();
        gl.uniform3f(model_loc_modelOrientation, roll, pitch, yaw);
        gl.uniform3f(model_loc_modelPosition, ...ship2.get_position().get_values());
        gl.uniform1f(model_loc_emission_scalar, -ship2.get_forward_thrust() / 50 / (1 + Math.abs(ship2.get_forward_thrust()) / 50));
        gl.drawArrays(gl.TRIANGLES, 0, ship2.get_model().get_vertices_count());
    }
    //obstacles:
    gl.uniform3f(model_loc_modelOrientation, 0, 0, 0); //1, .4, .2);
    for (let o = 0; o < obstacle_positions.length; o++) {
        let [id, position, orientation] = obstacle_positions[o];
        obstacle_models[id - 1].bind(gl);
        //console.log(id, position.get_values(), orientation.get_euler());
        gl.uniform3f(model_loc_modelPosition, ...position.get_values());
        gl.uniform3f(model_loc_modelOrientation, ...orientation.get_euler());
        gl.drawArrays(gl.TRIANGLES, 0, obstacle_models[id - 1].get_vertices_count());
    }
}
exports.draw_models = draw_models;

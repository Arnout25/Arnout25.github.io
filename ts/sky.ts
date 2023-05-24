//https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html
//https://www.tutorialspoint.com/webgl/webgl_drawing_a_quad.htm
import { Quaternion } from "./quaternions.js";

var sky_program: any;
var sky_texture: any;
var sky_loc_orientation: number;
var sky_loc_resolution: number;
var sky_loc_texture: number;
var sky_loc_fov: number;
var vbo: any;
var sky_attrib_loc: any;
var sky_attrib_texC: any;

function init_sky_shader(gl: any){

	sky_program = gl.createProgram();
	var vertex_shader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertex_shader, `#version 100
		precision mediump float;
		attribute vec2 pos;
		attribute vec2 tex_coord;
		varying vec2 v_coord;
		void main(){
			gl_Position = vec4(pos,-1,1);
			v_coord = tex_coord;
		}
	`);
	gl.compileShader(vertex_shader);
	if (!gl.getShaderParameter(vertex_shader, gl.COMPILE_STATUS)) {
		alert (gl.getShaderInfoLog(vertex_shader));
	}
	var fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragment_shader, `#version 100
		precision mediump float;
		varying vec2 v_coord;
		//out vec4 fragColor;

		uniform vec3 orientation;

		uniform ivec2 resolution;
		uniform sampler2D tex;
		
		uniform float fov;

		const float PI = 3.1415926;

		float atan2(in float y, in float x){
			float a = x == 0.0 ? sign(y)*PI/2.0 : atan(y, x);
			return a ;//> 0? a : a+PI*2.0;
		}
		
		vec3 reverse_rotate(vec3 v, vec3 rot){
			float roll = rot[0];
			float pitch = rot[1];
			float yaw = rot[2];
			float x = v.x;
			float y = v.y;
			float z = v.z;
			
			//forward:
			// float x2 = cos(roll)*x + sin(roll)*y;
			// float y2 = cos(roll)*y - sin(roll)*x;

			// float y3 = cos(pitch)*y2 - sin(pitch)*z;
			// float z2 = cos(pitch)*z + sin(pitch)*y2;

			// float x3 = cos(yaw)*x2 + sin(yaw)*z2;
			// float z3 = cos(yaw)*z2 - sin(yaw)*x2;
			
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
			//fragColor = vec4(gl_FragCoord[0]/2560.0*2.0,v_coord[1],0, 1.0);
			float x = (v_coord[0]-.5)*fov*2.0; //TODO: set FOV!
			float y = (v_coord[1]-.5)*fov*2.0/float(resolution.x)*float(resolution.y);
			vec3 dir = reverse_rotate(vec3(x,y,-1), orientation);
			float yaw = atan2(dir.z, dir.x);
			float pitch = atan2(dir.y, length(dir.xz));
			//fragColor = vec4(yaw/PI/2.0, pitch/PI, 0, 1);
			//fragColor = vec4(dir.xy,0,1);
			
			vec4 color = texture2D(tex, vec2(1.0+yaw/PI/2.0-0.25, -pitch/PI+0.5));
			gl_FragColor = vec4(color.rgb, 1.0);
		}
	`);
	gl.compileShader(fragment_shader);
	if (!gl.getShaderParameter(fragment_shader, gl.COMPILE_STATUS)) {
		alert (gl.getShaderInfoLog(fragment_shader));
	}

	gl.attachShader(sky_program, vertex_shader)
	gl.attachShader(sky_program, fragment_shader)
	gl.linkProgram(sky_program)
	gl.useProgram(sky_program) //necessary?

	//set vertex buffer
	var positions = [
		-1, -1, 0, 0,
		-1,  1, 0, 1,
		1,  1, 1, 1,
		-1, -1, 0, 0,
		1,  1, 1, 1,
		1, -1, 1, 0
	];
	vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	sky_attrib_loc = gl.getAttribLocation(sky_program, "pos");
	gl.enableVertexAttribArray(sky_attrib_loc);
	gl.vertexAttribPointer(sky_attrib_loc, 2, gl.FLOAT, false, 4*4, 0);
	sky_attrib_texC = gl.getAttribLocation(sky_program, "tex_coord");
	gl.enableVertexAttribArray(sky_attrib_texC);
	gl.vertexAttribPointer(sky_attrib_texC, 2, gl.FLOAT, false, 4*4, 2*4);

	//set texture uniform

	sky_texture = gl.createTexture(); // create empty texture
	// array image
	var w = 1024;//128;
	var h = 512;//128;
	var size = w * h * 4;
	var img = new Uint8Array(size); // need Uint16Array
	for (var i = 0; i < img.length; i += 4) {
		img[i + 0] = 0; // r
		img[i + 1] = i/4*255/w*.1; // g
		img[i + 2] = 30; // b
		img[i + 3] = 255; // a
	}
	gl.bindTexture(gl.TEXTURE_2D, sky_texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
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



	const sky_image = new Image();

	sky_image.onload = function() {

		gl.bindTexture(gl.TEXTURE_2D, sky_texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sky_image);

	};
	sky_image.src = "./resources/sky4096_4xM.png";"./resources/sky.png";"https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png";//"./sky.png";
	//mage.crossOrigin = "Anonymous";

	sky_loc_orientation = gl.getUniformLocation(sky_program, "orientation");
	sky_loc_texture = gl.getUniformLocation(sky_program, "tex");
	sky_loc_resolution = gl.getUniformLocation(sky_program, "resolution");
	sky_loc_fov = gl.getUniformLocation(sky_program, "fov");
}

function draw_sky(gl:any, fov:number, resolution:number[], orientation:Quaternion){
	
	//gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	gl.useProgram(sky_program);

	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

	gl.vertexAttribPointer(sky_attrib_loc, 2, gl.FLOAT, false, 4*4, 0);
	gl.vertexAttribPointer(sky_attrib_texC, 2, gl.FLOAT, false, 4*4, 2*4);
	

	gl.uniform3f(sky_loc_orientation, ...orientation.get_inv().get_euler()); //why inverse??
	gl.uniform1f(sky_loc_fov, fov);
	gl.uniform2i(sky_loc_resolution, ...resolution);//gl.canvas.width, gl.canvas.height);
	gl.bindTexture(gl.TEXTURE_2D, sky_texture);
	gl.uniform1i(sky_loc_texture, 0);

	gl.drawArrays(gl.TRIANGLES, 0, 6);

}
export {draw_sky, init_sky_shader};
import { init_cell_shader, draw_cell_shader } from './cells_render.js';


const canvas = document.querySelector('#glcanvas') as any;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Initialize the GL context
const gl = canvas.getContext('webgl2', { antialias: true });
gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

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

gl.clearColor(0.2, 0.0, 0.2, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);



var program = gl.createProgram();
var vertex_shader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertex_shader, `#version 300 es

	in vec3 position;
	in vec3 color;

	out vec3 vertexColor;

	void main() {
		gl_Position = vec4(position, 1.0);
		vertexColor = color;
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
gl.attachShader(program, vertex_shader);
gl.attachShader(program, fragment_shader);
gl.linkProgram(program);
gl.useProgram(program); //necessary?

//set vertex buffer
// var quad = [
// 	-1, -1,
// 	-1, 1,
// 	1, 1,
// 	-1, -1,
// 	1, 1,
// 	1, -1
// ];
// var vbo = gl.createBuffer();
// gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
// gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad), gl.STATIC_DRAW);
// var bullet_attrib_vert = gl.getAttribLocation(program, "vertex");
// gl.vertexAttribPointer(bullet_attrib_vert, 2, gl.FLOAT, false, 0, 0);
// bullet_loc_position = gl.getUniformLocation(program, "position");
// bullet_loc_velocity = gl.getUniformLocation(program, "velocity");
// bullet_loc_resolution = gl.getUniformLocation(program, "resolution");
// bullet_loc_fov = gl.getUniformLocation(program, "fov");
check_error();


var vao = gl.createVertexArray()
// and make it the one we're currently working with
gl.bindVertexArray(vao);

// Create the vertex buffer and bind it
var vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);


const positions = [
	-0.5, -0.5, 0.0,  // Vertex 1 position
	1.0, 0.0, 0.0,    // Vertex 1 color (red)

	0.5, -0.5, 0.0,   // Vertex 2 position
	0.0, 1.0, 0.0,    // Vertex 2 color (green)

	0.0, 0.5, 0.0,    // Vertex 3 position
	0.0, 0.0, 1.0     // Vertex 3 color (blue)
];

// Upload the position and color data to the vertex buffer
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

// Enable the position attribute and set its pointer
const positionAttributeLocation = gl.getAttribLocation(program, 'position');
gl.enableVertexAttribArray(positionAttributeLocation);
gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0);

// Enable the color attribute and set its pointer
const colorAttributeLocation = gl.getAttribLocation(program, 'color');
gl.enableVertexAttribArray(colorAttributeLocation);
gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);

check_error()

init_cell_shader(gl, canvas.width/canvas.height);

// var instances:number[] = [];

var automaton_running = false;
var startTime: number = 0;
function loop(time: number){

	if (clicked){
		clicked = false;
		if (time > 2){
			automaton_running = true;
		}
	}

	window.requestAnimationFrame(loop);

	var aspect_ratio = canvas.width/canvas.height;
	
	gl.viewport(0, 0, canvas.width, canvas.height);

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	
	gl.enable(gl.DEPTH_TEST);
	gl.clear(gl.DEPTH_BUFFER_BIT);  
	gl.depthRange(-1,1); //doesn't do anything??
	
	var delta_time = (time - startTime)/1000;
	startTime = time;

	// if (instances.length < time*0.001*3){
	// 	instances = instances.concat([instances.length/3 - 10, instances.length/3%2, 0]);
	// 	// console.log(instances);
	// }


	gl.clearColor(27/255,24/255,37/255, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.useProgram(program);
	
	gl.bindVertexArray(vao);
	// gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	// gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0);
	// gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);

	// gl.enable(gl.DITHER)
	// gl.depthRange(0,1); //doesn't do anything??

	// //player 1
	// camera1.draw(gl, delta_time, fov, [0,0,gl.canvas.width/2, gl.canvas.height]);

	// //player 2
	// camera2.draw(gl, delta_time, fov, [gl.canvas.width/2,0,gl.canvas.width/2, gl.canvas.height]);

	// gl.drawArrays(gl.TRIANGLES, 0, 3);


	draw_cell_shader(gl, automaton_running, aspect_ratio, time, tiltX, tiltY);

	// console.log(mouseX, mouseY);

	check_error();




	boxes.forEach(box => {
		const b = box as HTMLElement;
		// Extract rotateY value, which represents the X-direction tilt
		const rotateXRegex = /rotateY\(([-+]?\d*\.?\d+)\s*deg\)/;
		const rotateXMatch = b.style.transform.match(rotateXRegex);
		let rotateXValue = rotateXMatch ? parseFloat(rotateXMatch[1]) : null;

		// Extract rotateX value, which represents the Y-direction tilt
		const rotateYRegex = /rotateX\(([-+]?\d*\.?\d+)\s*deg\)/;
		const rotateYMatch = b.style.transform.match(rotateYRegex);
		let rotateYValue = rotateYMatch ? parseFloat(rotateYMatch[1]) : null;

		if (rotateXValue == null)
			rotateXValue = 0;
		if (rotateYValue == null)
			rotateYValue = 0;

		let tiltAngleX = 0;
		let tiltAngleY = 0
		const containerRect = b.getBoundingClientRect();
		// console.log('m',mouseX, mouseY);
		// console.log(b.offsetLeft, b.offsetTop);
		// console.log(b.scrollHeight);
		// console.log(b.offsetLeft)
		if (
			mouseX >= b.offsetLeft-window.scrollX && // containerRect.left &&
			mouseX <= b.offsetLeft+b.offsetWidth-window.scrollX && // containerRect.right &&
			mouseY >= b.offsetTop-window.scrollY && // containerRect.top &&
			mouseY <= b.offsetTop+b.offsetHeight-window.scrollY // containerRect.bottom
		  ) {
			const thisX = mouseX - containerRect.left;
			const thisY = mouseY - containerRect.top;
			const percentX = (thisX / containerRect.width - 0.5) * 2;
			const percentY = (thisY / containerRect.height - 0.5) * 2;
			tiltAngleX = 3 * Math.max(-1, Math.min(1, percentX));
			tiltAngleY = -4 * Math.max(-1, Math.min(1, percentY));
		}

        tiltAngleX = .7 * rotateXValue + .3 * tiltAngleX;
        tiltAngleY = .7 * rotateYValue + .3 * tiltAngleY;
	
		b.style.transformOrigin = 'center center';
		b.style.transform = `perspective(1000px) rotateY(${tiltAngleX}deg) rotateX(${tiltAngleY}deg)`;
	});
}

let boxes = document.querySelectorAll('.box');
document.addEventListener("DOMContentLoaded", function() {
	boxes = document.querySelectorAll('.box');
});


function handleClick() {
	console.log("Image clicked!");

	window.scrollTo({
	  left: 0,
	  top: canvas.height,
	  behavior: "smooth"
	});
}
  
const myImage = document.getElementById("downArrow");
if (!(myImage == null)){
	myImage.addEventListener("click", handleClick);
}



function smoothstep(edge0: number, edge1: number, x: number) {
	// Ensure the input value is within the specified range
	const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
	
	// Apply the smoothstep interpolation formula
	return t * t * (3 - 2 * t);
  }

var isScrollingByCode = false;
function smoothScrollTo(scrollPosition: number) {
	isScrollingByCode = true;
    const startTime = performance.now();
    const duration = 600; // Adjust the duration as desired
    const startPosition = window.pageYOffset;

    function scroll(timestamp: number) {
      const elapsed = smoothstep(0, 1, (timestamp - startTime)/duration)*duration;
      const progress = Math.min(elapsed / duration, 1);
      const targetPosition = startPosition + (scrollPosition - startPosition) * progress;

      window.scrollTo({left: 0, top: targetPosition});

      if (progress < 1) {
        window.requestAnimationFrame(scroll);
      } else {
		isScrollingByCode = false;
	  }
    }

    window.requestAnimationFrame(scroll);
}

var scrollDisabled = false;
function disableScroll(duration: number) {
	scrollDisabled = true;
	document.body.style.overflow = 'hidden';
	setTimeout(() => {
		scrollDisabled = false;
		document.body.style.overflow = '';
	}, duration);
}

window.addEventListener('wheel', (event) => {
	
	
	setTimeout(() => {
		const content = document.getElementById("content");
		//console.log(content?.)
		if (!(content == null)){

			const rect = content.getBoundingClientRect();
			const contentPos: number = rect.top + window.pageYOffset;

			if (window.scrollY < contentPos && !isScrollingByCode){
				//scrollIndex += 1;
				if (event.deltaY > 0) {
					
					disableScroll(600);
					smoothScrollTo(
						contentPos
					);
				} else {
					disableScroll(600);
					smoothScrollTo(0);
				}
			}
		}
	}, 100)
});




function resize(event: UIEvent) {

	//adjust the scroll along with window resize
	window.scrollTo(0, window.scrollY /canvas.height * window.innerHeight)

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight; 

}
function orientationchange(event: Event) {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
window.addEventListener("orientationchange", orientationchange);

var mouseX: number = 0;
var mouseY: number = 0;
var tiltX: number = 0;
var tiltY: number = 0;
function updateMouse(event: MouseEvent) {

	mouseX = event.clientX;
	mouseY = event.clientY;
	
	let new_tiltX = (event.clientX/canvas.width  - 0.5)*.3;
	let new_tiltY = (event.clientY/canvas.height - 0.5)*.3;

	tiltX = .9*tiltX + .1*new_tiltX;
	tiltY = .9*tiltY + .1*new_tiltY;
};
window.addEventListener('mousemove', updateMouse);

function handleDeviceOrientation(event: DeviceOrientationEvent): void {
	const { alpha, beta, gamma } = event;
	if (typeof beta == 'number'){
		let new_tiltY = (beta-30)/360*Math.PI * 1;
		tiltY = .9*tiltY + .1*new_tiltY;
	}
	if (typeof gamma == 'number'){
		let new_tiltX = gamma/360*Math.PI * 1;
		tiltX = .9*tiltX + .1*new_tiltX;
	}
}

window.addEventListener('deviceorientation', handleDeviceOrientation);

try {
	//try because if in http (not secure), DeviceOrientationEvent would throw error
	interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
	  requestPermission?: () => Promise<'granted' | 'denied'>;
	}

	const requestPermission = (DeviceOrientationEvent as unknown as DeviceOrientationEventiOS).requestPermission;

	// Use requestPermission here if it exists
	if (requestPermission) {
		const iOS = typeof requestPermission === 'function';
		if (iOS) {
			console.log('ios')
			requestPermission().then(response => {
				// if (response == 'granted') {
				// 	console.log('granted!')
				// }
			})
		}
	} else {
	  // Handle the case where requestPermission is not available
	  console.warn("DeviceOrientationEventiOS is not supported on this platform.");
	}
} catch (error) {
	// Handle any other errors that might occur
	console.error("An error occurred:", error);
}


var clicked = false;
function updateClick(event: MouseEvent) {

	if (canvas.height*0.25 < event.clientY+window.scrollY && event.clientY+window.scrollY < canvas.height*.75){
		clicked = true;
	}
};
window.addEventListener('mousedown', updateClick);

check_error();
loop(0);
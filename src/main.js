"use strict";
const canvas = document.querySelector('#glcanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
// Initialize the GL context
const gl = canvas.getContext('webgl2');
function check_error() {
    var err = gl.getError();
    if (err != gl.NO_ERROR) {
        alert('you got an error');
        alert(err);
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
var startTime = 0;
function loop(time) {
    window.requestAnimationFrame(loop);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    var delta_time = (time - startTime) / 1000;
    startTime = time;
    gl.clearColor(0.2, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    // gl.enable(gl.DITHER)
    // gl.depthRange(0,1); //doesn't do anything??
    // //player 1
    // camera1.draw(gl, delta_time, fov, [0,0,gl.canvas.width/2, gl.canvas.height]);
    // //player 2
    // camera2.draw(gl, delta_time, fov, [gl.canvas.width/2,0,gl.canvas.width/2, gl.canvas.height]);
    check_error();
}
function resize(event) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
check_error();
loop(0);

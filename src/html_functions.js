"use strict";
// var boxes = document.querySelectorAll('.box');
// document.addEventListener("DOMContentLoaded", function() {
// 	boxes = document.querySelectorAll('.box');
//   });
function tiltImage(event) {
    const container = event.currentTarget;
    const containerRect = container.getBoundingClientRect();
    const mouseX = event.clientX - containerRect.left;
    const percentX = (mouseX / containerRect.width - 0.5) * 2;
    const tiltAngle = 10 * Math.max(-1, Math.min(1, percentX));
    container.style.transformOrigin = 'center center';
    container.style.transform = `perspective(1000px) rotateY(${tiltAngle}deg)`;
}
// window.addEventListener('DOMContentLoaded', () => {
// 	window.tiltImage = tiltImage;
// });

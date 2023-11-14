"use strict";
var titles = document.querySelectorAll('.Scaling');
function scaleText() {
    titles.forEach(title => {
        var _a, _b;
        const t = title;
        if (!(t.parentElement == null)) {
            const parentWidth = (_a = title.parentElement) === null || _a === void 0 ? void 0 : _a.clientWidth;
            if (!(parentWidth == null)) {
                // console.log('ttttouihaef', title.parentElement?.id)
                let titleFontSize = parentWidth * 0.06; /* Adjust the maximum font size as needed */
                if (((_b = title.parentElement) === null || _b === void 0 ? void 0 : _b.className) == 'banner')
                    titleFontSize = parentWidth * 0.05; /* Adjust the maximum font size as needed */
                t.style.fontSize = `${titleFontSize}px`;
                // console.log(`${titleFontSize}px`)
            }
        }
    });
}
document.addEventListener("DOMContentLoaded", function () {
    titles = document.querySelectorAll('.Scaling');
    scaleText();
});
window.addEventListener('resize', scaleText);
scaleText();

var titles = document.querySelectorAll('.Scaling');

function scaleText() {
	titles.forEach(title => {
		const t = title as HTMLElement;
		if (!(t.parentElement == null)){
			const parentWidth = title.parentElement?.clientWidth;
			if (!(parentWidth == null)){
				// console.log('ttttouihaef', title.parentElement?.id)
				let titleFontSize = parentWidth * 0.06;
				if (title.parentElement?.className == 'banner')
					titleFontSize = parentWidth * 0.05;
		
				t.style.fontSize = `${titleFontSize}px`;
				// console.log(`${titleFontSize}px`)
			}
		}
	});
}

document.addEventListener("DOMContentLoaded", function() {
	titles = document.querySelectorAll('.Scaling');
	scaleText();
  });

window.addEventListener('resize', scaleText);
scaleText();
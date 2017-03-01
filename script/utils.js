
//For the handler
//Give width to fit a treemap horizontally in the canvas
//Size is define according to the height of the canvas
function fitH(imgW, imgH, cH, wLeft){
	//draw parameters
	var width = 0;

	//o is more vertically stretched than c
	//up and down edges defines the size

	width = imgW * (cH/imgH);
	if (width <= wLeft)
		return Math.round(width);
	else
		return -1;
}	

//For the handler
//Give height to fit a treemap vertically in the canvas
//Size is define according to the width of the canvas
function fitV(imgW, imgH, cW, hLeft){
	//draw parameters
	var height = 0;

	//o is more vertically stretched than c
	//up and down edges defines the size

	height = imgH * (cW/imgW);
	if (height <= hLeft)
		return Math.round(height);
	else
		return -1;
}	


function getOffset( el ) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x };
}

function getOffsetOld(el) {
	/*console.log(el);*/
	var xPos = 0;
	var yPos = 0;

	while (el) {
	    if (el.tagName == "BODY") {
			// deal with browser quirks with body/window/document and page scroll
			var xScroll = el.scrollLeft || document.documentElement.scrollLeft;
			var yScroll = el.scrollTop || document.documentElement.scrollTop;

			xPos += (el.offsetLeft - xScroll + el.clientLeft);
			yPos += (el.offsetTop - yScroll + el.clientTop);
	    } else {
			// for all other non-BODY elements
			xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
			yPos += (el.offsetTop - el.scrollTop + el.clientTop);
	    }
	 
	    el = el.offsetParent;
	}
	/*console.log("Found x:y =" + xPos + ":" + yPos);*/
	return {
		left: xPos,
		top: yPos
	};
}
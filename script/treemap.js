// The cache is global between every treemap objects, this way all images are available for every treemap - Associated by url 
var imgsCache = {};



/*	TREEMAP OBJECT CREATION	*/

/*Call-Stack : 
*	 setTreemap(taking a 'src' path and an optionnal, already filled 'tab' of images)
*		reinit (reinitialize the treemap)
*		draw (called when all the 'tab' images are loaded)
*			reorient (make the canvas horizontal or vertical)
*			TMPart.setZone (defines the draw parameters)
*			TMPart.fit/fill (draw an image in the previously defined setZone)
*			drawImage (native javascript method)
*			createImage (for overlay, create image and append them to the canvas)
*			dispatch (dispatch the loaded treemap event)
*/


/*	Treemap constructor
*	ratio is an array of the form [4,3] or [16,9] ... etc
*	baseSize allow to control the size of the treemap
*	canvasId is the id of the canvas in which the treemap is drawn
*	autoOrient let you decide if you want orientation changing according to first image ratio or not
*	(optionnal) dMethod_opt define the drawing method, wether we fit or fill the images in their zone - default = fit
*	(optionnal) dDesign_opt define the drawing design, between the multi-ratio, the uni-ratio and the 1-2-4 design - default = multi-ratio
*	(optionnal) dOrient_opt let you define the orientation you want in the case you don't want autoorientation, default = 0
*/

function Treemap(ratio, baseSize, TreemapId, autoOrient, dMethod_opt, dDesign_opt, eventTarget_opt, overlayDivID_opt, index_opt, absImagePath_opt, dOrient_opt){
	//You decide the orientation of the treemap (need false autoorient)
	this.orient = dOrient_opt || 0;
	//You set an index which will be send when dispatching loaded event
	this.index = index_opt || 0;
	//You set the target which will receive the TMLoaded message
	this.eventTarget = eventTarget_opt;
	//Information about nature of image path, auto-add file:/// with absolute path who need it
	this.absImagePath = absImagePath_opt || 0;

	//You decide if you create images object placed relatively from their position in the canvas
	//It also choose wether you create a treemap and display it or only use it in other canvas
	//This params is the id of the div from which images will append
	this.overlay = overlayDivID_opt || 0;
	this.design = dDesign_opt || 0;
	this.method = dMethod_opt || 0;
	
	this.autoOrient = autoOrient;
	this.baseSize = baseSize;
	this.ratio = ratio;
	this.id = TreemapId;
	this.maxWidth = -1;
	this.maxHeight = -1;
	
	//Overlay can't be used in nested canvas.
	//So we assure we're drawing directly on a pre existing canvas
	if (this.overlay !== 0){
		this.c = document.getElementById(this.id);
	}
	//Otherwise the canvas is created in the DOM
	else{
		this.c = document.createElement("canvas");
	}
	this.ctx = this.c.getContext("2d");

	if (this.overlay !== 0){
		this.over_imgs = [];
	}
	this.c.offset = getOffset(this.c);
	/*this.c.getZone = getZone;*/
	

	var parent = this;
	this.c.getParent = function(){
		return parent;
	}

}

// TREEMAP FUNCTIONS
Treemap.prototype.reinit = function(){

	// treeMap parts are reinitialized, but not the global imgsCache
	// Images stay available, just need url to access them
	this.parts = [];
	//Image loaded counter
	this.imgLdd = 0;

	if (this.oldDesign)
		this.design = this.oldDesign;

	this.nbElems = (this.design === 0 )? 6 : (this.design === 1)? 8 : 7;
	this.defNbElems = this.nbElems;
	this.imgCount = 0;
	
	this.ctx.clearRect(0,0,this.ctx.canvas.width, this.ctx.canvas.height);

	//Removing added images from 
	if (this.overlay){
		var div = document.getElementById(this.overlay);
		for (i in this.over_imgs){
			try {
				div.removeChild(this.over_imgs[i]);
			} catch(e) {
				console.log(e);
			}
		}
		this.over_imgs = [];
	}



};

Treemap.prototype.setMaxSize = function(width, height){
	this.maxWidth = width;
	this.maxHeight = height;
};

Treemap.prototype.checkBaseSize = function(){
	/*console.log(this.id + " -- MaxWidth : " + this.maxWidth + ", MaxHeight : " + this.maxHeight);*/
	if (this.orient === 0){
		if (this.design === 2){
			this.baseSize = Math.min( this.maxWidth/(4*this.ratio[0]), this.maxHeight/(7*this.ratio[1]) );
		}
		else if (this.design === 3){
			this.baseSize = Math.min( this.maxWidth/(4*this.ratio[0]), this.maxHeight/(4*this.ratio[1]) );	
		}
		else{
			this.baseSize = Math.min( this.maxWidth/(4*this.ratio[0]), this.maxHeight/(8*this.ratio[1]) );	
		}
	}
	else{
		if (this.design === 2){
			this.baseSize = Math.min( this.maxWidth/(7*this.ratio[1]), this.maxHeight/(4*this.ratio[0]) );
		}
		else if (this.design === 3){
			this.baseSize = Math.min( this.maxWidth/(4*this.ratio[1]), this.maxHeight/(4*this.ratio[0]) );	
		}
		else{
			this.baseSize = Math.min( this.maxWidth/(8*this.ratio[1]), this.maxHeight/(4*this.ratio[0]) );	
		}
	}
	/*console.log("Final BaseSize : " + this.baseSize);*/
};

Treemap.prototype.reorient = function(){
	if (this.maxWidth !== -1){
		this.checkBaseSize();
	}
	if (this.design <= 1){
		if (this.orient === 0){


			//Defining the size seen by the user
			this.c.style.width =  this.ratio[0] * this.baseSize * 4;//Need 4 * width
			this.c.style.height = this.ratio[1] * this.baseSize * 8;//And 8 * height for the layout
			//Defining the size in pixel of the canvas
			this.c.width =  this.ratio[0] * this.baseSize * 4;
			this.c.height = this.ratio[1] * this.baseSize * 8;
		}
		else if (this.orient === 1){
			//Defining the size seen by the user
			this.c.style.width =  this.ratio[1] * this.baseSize * 8;//Need 4 * width
			this.c.style.height = this.ratio[0] * this.baseSize * 4;//And 8 * height for the layout
			//Defining the size in pixel of the canvas
			this.c.width =  this.ratio[1] * this.baseSize * 8;
			this.c.height = this.ratio[0] * this.baseSize * 4;
		}
	}
	else if (this.design === 2){
		if (this.orient === 0){
			//Defining the size seen by the user
			this.c.style.width =  this.ratio[0] * this.baseSize * 4;//Need 4 * width
			this.c.style.height = this.ratio[1] * this.baseSize * 7;//And 8 * height for the layout
			//Defining the size in pixel of the canvas
			this.c.width =  this.ratio[0] * this.baseSize * 4;
			this.c.height = this.ratio[1] * this.baseSize * 7;
		}
		else if (this.orient === 1){
			//Defining the size seen by the user
			this.c.style.width =  this.ratio[1] * this.baseSize * 7;//Need 4 * width
			this.c.style.height = this.ratio[0] * this.baseSize * 4;//And 8 * height for the layout
			//Defining the size in pixel of the canvas
			this.c.width =  this.ratio[1] * this.baseSize * 7;
			this.c.height = this.ratio[0] * this.baseSize * 4;
		}
	}
	else if (this.design === 3){
		if (this.orient === 0){
			//Defining the size seen by the user
			this.c.style.width =  this.ratio[0] * this.baseSize * 4;//Need 4 * width
			this.c.style.height = this.ratio[1] * this.baseSize * 4;//And 8 * height for the layout
			//Defining the size in pixel of the canvas
			this.c.width =  this.ratio[0] * this.baseSize * 4;
			this.c.height = this.ratio[1] * this.baseSize * 4;
		}
		else{
						//Defining the size seen by the user
			this.c.style.width =  this.ratio[1] * this.baseSize * 4;//Need 4 * width
			this.c.style.height = this.ratio[0] * this.baseSize * 4;//And 8 * height for the layout
			//Defining the size in pixel of the canvas
			this.c.width =  this.ratio[1] * this.baseSize * 4;
			this.c.height = this.ratio[0] * this.baseSize * 4;
		}
	}

};

/** Drawing a Treemap with random numbered images if src isn't and tab is empty
*	Drawing a Treemap with given images if src is a folder and tab 
*/
Treemap.prototype.setTreeMap = function (src, tab){

	this.reinit();

	var image;
	var i;
	var j;
	var tab = tab || {};

	var str = src.substr(0,4);

	if (src != "")
	{
		//User use absolute image path and forget to add file protocol
		if (this.absImagePath === 1 && str !== "file"){
			src = "file:///" + src;
		}
		str = src.substr(-1);
		if (str !== "/"){
			src += "/";
		}
	}

	/* Tab is empty -> Filling randomly with '23.jpg', '12.jpg' ... */
	if (!tab.length > 0){
		for (i = 0 ; i < this.nbElems ; i++){
			tab[i] = Math.floor(Math.random()*999) + ".jpg";
		}
	}
	else{
		this.nbElems = tab.length;
		//Not the exact number of elements according to the chosen design
		if (this.nbElems !== this.defNbElems){
			//If there's more images than needed, we take what we need only
			if (this.nbElems > this.defNbElems){
				this.nbElems = this.defNbElems;
			}
			else{
				//We need 8 image or more, and have only 7. Using design n#2
				if (this.nbElems === 7){
					this.design = 2;
				}
				//We need 7 images or more, and have only 6. Using design n#0
				else if (this.nbElems === 6){
					this.design = 0;
				} 
				//We don't have enough images. Using monoimage design
				else{
					this.nbElems = 1;
					this.oldDesign = this.design;
					this.design = 3;
				}
			}
		}
	}

	

/*	var debug = "";
	for (key in tab)
		debug += tab[key] + " ";

	console.log(this.id + " images : " + debug);*/

	for (i = 0 ; i < this.nbElems ; i++){

		//Composing image path
		url = src + tab[i];

		// Creating a Treemap part for 1 Image, setting its zone in the entire canvas and params for drawing (fit/fill/stretch)
		this.parts[i] = new TMPart(i);
		
		//Searching a image in the cache for the current part of the treemap
		image = imgsCache[url];

		//Nothing in the cache
		if (!image){
			image = new Image();
			image.src = url;
			/*console.log("Image source : " + image.src);*/
			// Redefining the parent, like this we can access this specific treemap object from the img.onload function
			image.parent = this;
			// Initializing the array of the waiting treemap, for this image.
			image.wait = {};
			// Associated array, counting number of times a treemap need this image = number of times to notify this treemap (notify = imgLdd++)
			image.times = {};
			this.parts[i].img = image;

			//Caching
			imgsCache[url] = this.parts[i].img;
		}
		//Image is in the cache
		else{
			//No need to redefine the parent, we can access it from here (this, the treemap)
			this.parts[i].img = image;

			//that image has already been loaded
			if (image.loaded === 1){
				//DEBUG
				/*console.log(this.id + " loading from cache, "+image.src.substr(-6)+". "+this.imgLdd+"/"+this.nbElems+" images loaded.");*/
				this.imgLdd++; 
			}
			//that image need time to load. Linking it to "this", the waiting treemap
			else{
				//DEBUG
				/*console.log(this.id + " waiting image :" +image.src.substr(-6)+". "+this.imgLdd+"/"+this.nbElems+" images loaded.");*/
				if (image.wait[this.id] === undefined){
					image.wait[this.id] = this;
					image.times[this.id] = 1;
				}
				else{
					image.times[this.id]++;
				}
			}

			//Images in the cache are already loaded and ready
			if (this.imgLdd === this.nbElems){
				//DEBUG
				/*console.log(this.id+ " : " +this.nbElems+ " images loaded, drawing+c");*/
				this.draw();
			}
		}
		image.onload = imageOnLoad;

	}//END FOR
};


/** Draw every image once they're all loaded
*/
Treemap.prototype.draw = function(){
	
	// Orientation before drawing
	var dOrientOld = this.orient;
	var part;//the current part of the treemap
	var i;

	/************************************************
	*	ORIENTING ACCORDING TO THE FIRST IMAGE 		*
	************************************************/
	if (this.autoOrient === 1){
		this.orient = (this.parts[0].img.width > this.parts[0].img.height )? 0 : 1;
	}

	this.reorient();

	for (i = 0 ; i < this.nbElems ; i++){

		part = this.parts[i];
		//Setting cZone with position and size for the current image of the treemap
		part.setZone(this);

		//Setting params with parameters for drawImage along with the fit or fill method
		if (this.method === 0)
			part.fitParams();
		else if (this.method === 1)
			part.fillParams();

		
		//FITTING IMAGES
		if (this.method === 0){
			this.ctx.drawImage(part.img, part.params["x"], part.params["y"], part.params["width"], part.params["height"]);
			if (this.overlay !== 0) this.createImage(i);
		}
		//FILLING IMAGES
		else if (this.method === 1){
			this.ctx.drawImage(part.img, part.params["xClip"], part.params["yClip"], part.params["wClip"], part.params["hClip"],
				part.params["x"], part.params["y"], part.params["width"], part.params["height"]);
			if (this.overlay !== 0) this.createImage(i);
		}
		//STRETCHING IMAGES
		else{
			this.ctx.drawImage(part.img, part.cZone[0], part.cZone[1], part.cZone[2], part.cZone[3]);
			if (this.overlay !== 0) this.createImage(i);
		}
	}

	if (this.target != 0){
		this.dispatch();
	}
};

//Dispatch the treemap-ready event to the target
Treemap.prototype.dispatch = function (){
	var event = new CustomEvent(
		"TMLoaded", 
		{
			detail: {
				i: this.index,
				c: this.c,
				r: this.ratio,
				o: this.orient,
				over_imgs : this.over_imgs,
			},
			cancelable : true,
		}
	);
	this.eventTarget.dispatchEvent(event);
};


//Create hidden images that cover canvas when mouse is over the corresponding part
Treemap.prototype.createImage = function (index){
	/*var img = this.parts[index].img;*/
	var widthAttr, heightAttr, topAttr, leftAttr, coeff;
	var img = document.createElement("img");
	img.src = this.parts[index].img.src;
	this.over_imgs[index] = img;

	img.setAttribute("class", "TMImage");
	


	var oRatio = img.width / img.height;
	var cRatio = this.parts[index].cZone[2] / this.parts[index].cZone[3];

	//o is more horizontally stretched than c
	if (oRatio > cRatio){
		//up and down edges defines the size
		coeff = this.parts[index].cZone[3] / img.height;
		//Img height is reduced to the height of the canvas
		heightAttr = this.parts[index].cZone[3];

		//Img width is reduced just to keep the ratio
		widthAttr = img.width * coeff;
		//The image will overflow from two sides equally
		leftAttr = this.parts[index].cZone[0] - ((widthAttr - this.parts[index].cZone[2])/2);
		topAttr = this.parts[index].cZone[1];
	}
	else {
		//o is more horizontally stretched than c
		//up and down edges defines the size
		coeff = this.parts[index].cZone[2] / img.width;
		//Img width is reduced to the height of the canvas
		widthAttr = this.parts[index].cZone[2];

		//Img height is reduced just to keep the ratio
		heightAttr = img.height * coeff;
		//The image will overflow from up and down equally
		leftAttr = this.parts[index].cZone[0] ;
		topAttr = this.parts[index].cZone[1] - ((heightAttr-this.parts[index].cZone[3])/2);
	}
	var div = document.getElementById(this.overlay);
	if (div.style.position === 'static' || div.style.position == ''){
		leftAttr += this.c.offset.left;
		topAttr += this.c.offset.top;
	}

	// Fred Hack to adjust overlay position wrt styling
	leftAttr += 30;
	topAttr += 0;

	img.style.position = "absolute";
	img.style.left = leftAttr +  "px";
	img.style.top = topAttr +  "px";
	img.style.visibility = 'hidden';
	img.width = widthAttr;
	img.height = heightAttr;
	
	/*console.log("left : " + leftAttr + ", top : " + topAttr + ", width : " + widthAttr + ", height : " + heightAttr);*/

	div.appendChild(img);
};



Treemap.prototype.getZone = function(x, y){
	var w = this.ratio[0] * this.baseSize;//minimum width between images
	var h = this.ratio[1] * this.baseSize;//minimum height between images
	/*console.log("x:y = " + x + ":" + y);*/
	//Switching if oriented in portrait
	if (this.orient === 1){
		var temp = x;
		x = y;
		y = temp;
/*		temp = w;
		w = h;
		h = temp;*/
	}
/*	console.log("w:h : " + w + ":" + h);*/
	if (this.design === 2){
		if (y < 4*h){return 0;}
		else if (y < 6*h && x < 2*w){return 1;}
		else if (y < 6*h && x > 2*w){return 2;}
		else if (x < w){return 3;}
		else if (x < 2*w){return 4;}
		else if (x < 3*w){return 5;}
		else if (x <= 4*w){return 6;}
		else{return -1;}
	}
	else if (this.design === 1){
		if (y < 4*h){return 0;}
		else if (y < 6*h && x < 2*w){return 1;}
		else if (y < 6*h && x > 2*w){return 2;}
		else if (x < 2*w){return 3;}
		else if (y < 7*h && x < 3*w){return 4;}
		else if (y < 7*h){return 5;}
		else if (x < 3*w){return 6;}
		else if (x <= 4*w){return 7;}
		else{return -1;}
	}
	else if (this.design === 0){
		if (y < 4*h){return 0;}
		else if (x < 2*w){return 1;}
		else if (y < 6*h){return 2;}
		else if (x < 3*w){return 3;}
		else if (y < 7*h){return 4;}
		else if (y <= 8*h){return 5;}
		else{return -1;}
	}
	else if (this.design === 3){
		return 0;
	}
	return 0;
}


function imageOnLoad(){
	var i = 0;
	// "This" is the current image
	// parent is the treemap associated with the current image

	this.loaded = 1;

	//DEBUG
	/*console.log(this.src.substr(-7) + ". Notifying waiting treemaps... ");*/

	this.parent.imgLdd++;
	//DEBUG
	/*console.log(this.parent.id+ " notified, " + this.parent.imgLdd +"/"+ this.parent.nbElems+" images loaded. (parent)");*/

	//For the parent treemap - the one who put the img in the imgsCache
	if (this.parent.imgLdd === this.parent.nbElems){
		/*console.log(this.parent.id+ " : " +this.parent.nbElems+ " images loaded, drawing+l");*/
		this.parent.draw();
	}

	//Wait represent an array of treemap object
	//We notify the waiting treemaps that an image they wanted is now available/loaded for drawing
	for (id in this.wait){
		// Notifying the number of times this images is wanted by a speicif treemap
		this.wait[id].imgLdd += this.times[id];

		//DEBUG
		/*console.log(id + " notified, "+this.wait[id].imgLdd+"/"+this.wait[id].nbElems+" images loaded.");*/
		if (this.wait[id].imgLdd === this.wait[id].nbElems){
			/*console.log(id+ " : " +this.wait[id].nbElems+ " images loaded, drawing+w");*/
			this.wait[id].draw();
		}
	}
}




/* 	Treemap Image constructor
*	Index is the index of the current image in the treemap
*/

function TMPart(index){

	this.index = index;
	//Respectively x, y, width and height
	this.cZone = [0,0,0,0];
	//Parameters for drawing in the canvas Zone 'cZone'
	this.params = {};
}

//TMPART FUNCTIONS


//update cZone with the canvas position and size allocated for the current image
//Give the size and position in the canvas zone depending on the index
//of the picture (0 : most representative, 5 : least representative)
TMPart.prototype.setZone = function (tm){

	if (tm.design === 0){
		//Multi-ratio, Landscape by default
		switch(this.index){
			//The most representative image 
			case 0:
				this.cZone[0] = 0;
				this.cZone[1] = 0;
				this.cZone[2] = 4 * tm.ratio[0] * tm.baseSize;
				this.cZone[3] = 4 * tm.ratio[1] * tm.baseSize;
				break;
			case 1:
				this.cZone[0] = 0;
				this.cZone[1] = 4 * tm.ratio[1] * tm.baseSize;
				this.cZone[2] = 2 * tm.ratio[0] * tm.baseSize;
				this.cZone[3] = 4 * tm.ratio[1] * tm.baseSize;
				break;
			case 2:
				this.cZone[0] = 2 * tm.ratio[0] * tm.baseSize;
				this.cZone[1] = 4 * tm.ratio[1] * tm.baseSize;
				this.cZone[2] = 2 * tm.ratio[0] * tm.baseSize;
				this.cZone[3] = 2 * tm.ratio[1] * tm.baseSize;
				break;
			case 3:
				this.cZone[0] = 2 * tm.ratio[0] * tm.baseSize;
				this.cZone[1] = 6 * tm.ratio[1] * tm.baseSize;
				this.cZone[2] = tm.ratio[0] * tm.baseSize;
				this.cZone[3] = 2 * tm.ratio[1] * tm.baseSize;
				break;
			case 4:
				this.cZone[0] = 3 * tm.ratio[0] * tm.baseSize;
				this.cZone[1] = 6 * tm.ratio[1] * tm.baseSize;
				this.cZone[2] = tm.ratio[0] * tm.baseSize;
				this.cZone[3] = tm.ratio[1] * tm.baseSize;
				break;
			case 5:
				this.cZone[0] = 3 * tm.ratio[0] * tm.baseSize;
				this.cZone[1] = 7 * tm.ratio[1] * tm.baseSize;
				this.cZone[2] = tm.ratio[0] * tm.baseSize;
				this.cZone[3] = tm.ratio[1] * tm.baseSize;
				break;
			default:
				
		}//END SWITCH

	}//END IF
	else if (tm.design === 1){
		//Uni-ratio, Landscape by default
		switch(this.index){
			//The most representative image 
			case 0:
				this.cZone[0] = 0;
				this.cZone[1] = 0;
				this.cZone[2] = 4 * tm.ratio[0] * tm.baseSize;
				this.cZone[3] = 4 * tm.ratio[1] * tm.baseSize;
				break;
			case 1:
				this.cZone[0] = 0;
				this.cZone[1] = 4 * tm.ratio[1] * tm.baseSize;
				this.cZone[2] = 2 * tm.ratio[0] * tm.baseSize;
				this.cZone[3] = 2 * tm.ratio[1] * tm.baseSize;
				break;
			case 2:
				this.cZone[0] = 2 * tm.ratio[0] * tm.baseSize;
				this.cZone[1] = 4 * tm.ratio[1] * tm.baseSize;
				this.cZone[2] = 2 * tm.ratio[0] * tm.baseSize;
				this.cZone[3] = 2 * tm.ratio[1] * tm.baseSize;
				break;
			case 3:
				this.cZone[0] = 0;
				this.cZone[1] = 6 * tm.ratio[1] * tm.baseSize;
				this.cZone[2] = 2 * tm.ratio[0] * tm.baseSize;
				this.cZone[3] = 2 * tm.ratio[1] * tm.baseSize;
				break;
			case 4:
				this.cZone[0] = 2 * tm.ratio[0] * tm.baseSize;
				this.cZone[1] = 6 * tm.ratio[1] * tm.baseSize;
				this.cZone[2] = tm.ratio[0] * tm.baseSize;
				this.cZone[3] = tm.ratio[1] * tm.baseSize;
				break;
			case 5:
				this.cZone[0] = 3 * tm.ratio[0] * tm.baseSize;
				this.cZone[1] = 6 * tm.ratio[1] * tm.baseSize;
				this.cZone[2] = tm.ratio[0] * tm.baseSize;
				this.cZone[3] = tm.ratio[1] * tm.baseSize;
				break;
			case 6:
				this.cZone[0] = 2 * tm.ratio[0] * tm.baseSize;
				this.cZone[1] = 7 * tm.ratio[1] * tm.baseSize;
				this.cZone[2] = tm.ratio[0] * tm.baseSize;
				this.cZone[3] = tm.ratio[1] * tm.baseSize;
				break;
			case 7:
				this.cZone[0] = 3 * tm.ratio[0] * tm.baseSize;
				this.cZone[1] = 7 * tm.ratio[1] * tm.baseSize;
				this.cZone[2] = tm.ratio[0] * tm.baseSize;
				this.cZone[3] = tm.ratio[1] * tm.baseSize;
				break;
			default:
		}//END SWITCH
	}//END ElseIf
	else if (tm.design === 2){
		//1-2-4, Landscape by default
		switch(this.index){
			//The most representative image 
			case 0:
				this.cZone[0] = 0;
				this.cZone[1] = 0;
				this.cZone[2] = 4 * tm.ratio[0] * tm.baseSize;
				this.cZone[3] = 4 * tm.ratio[1] * tm.baseSize;
				break;
			case 1:
				this.cZone[0] = 0;
				this.cZone[1] = 4 * tm.ratio[1] * tm.baseSize;
				this.cZone[2] = 2 * tm.ratio[0] * tm.baseSize;
				this.cZone[3] = 2 * tm.ratio[1] * tm.baseSize;
				break;
			case 2:
				this.cZone[0] = 2 * tm.ratio[0] * tm.baseSize;
				this.cZone[1] = 4 * tm.ratio[1] * tm.baseSize;
				this.cZone[2] = 2 * tm.ratio[0] * tm.baseSize;
				this.cZone[3] = 2 * tm.ratio[1] * tm.baseSize;
				break;

			case 3:
				this.cZone[0] = 0;
				this.cZone[1] = 6 * tm.ratio[1] * tm.baseSize;
				this.cZone[2] = tm.ratio[0] * tm.baseSize;
				this.cZone[3] = tm.ratio[1] * tm.baseSize;
				break;
			case 4:
				this.cZone[0] = 1 * tm.ratio[0] * tm.baseSize;
				this.cZone[1] = 6 * tm.ratio[1] * tm.baseSize;
				this.cZone[2] = tm.ratio[0] * tm.baseSize;
				this.cZone[3] = tm.ratio[1] * tm.baseSize;
				break;
			case 5:
				this.cZone[0] = 2 * tm.ratio[0] * tm.baseSize;
				this.cZone[1] = 6 * tm.ratio[1] * tm.baseSize;
				this.cZone[2] = tm.ratio[0] * tm.baseSize;
				this.cZone[3] = tm.ratio[1] * tm.baseSize;
				break;
			case 6:
				this.cZone[0] = 3 * tm.ratio[0] * tm.baseSize;
				this.cZone[1] = 6 * tm.ratio[1] * tm.baseSize;
				this.cZone[2] = tm.ratio[0] * tm.baseSize;
				this.cZone[3] = tm.ratio[1] * tm.baseSize;
				break;
			default:
		}//END SWITCH
	}
	else if (tm.design == 3){
		this.cZone[0] = 0;
		this.cZone[1] = 0;
		this.cZone[2] = tm.ratio[0] * tm.baseSize * 4;
		this.cZone[3] = tm.ratio[1] * tm.baseSize * 4;
	}

	//Portrait
	if (tm.orient === 1){
		this.swap()
	}

};//END SIZE FUNCTION

//Swap between horizontal and vertical orientation
//Swaping x with y and width with height allow to pass from landscape to portrait and vice versa
TMPart.prototype.swap = function(){
	var temp;
	temp = this.cZone[0];
	this.cZone[0] = this.cZone[1];
	this.cZone[1] = temp;

	temp = this.cZone[2];
	this.cZone[2] = this.cZone[3];
	this.cZone[3] = temp;
};		


//update params for fitting the image in its zone
/** Give the information to fill the image 'this.img' in the canvas zone 'cZone'
*	drawImage need 8 parameters to clip and fill
*	the position where to start clipping the image
*	the width and height of the clipping
*	
*	the position where to start to draw on the canvas, x & y (always 0,0)
*	the width and height of the clipped image in the canvas (the canvas size, we FILL it)
*	
*********************/
TMPart.prototype.fillParams = function (){
	this.params = {	
		'xClip' : 0, 'yClip' : 0, 'wClip' : 0, 'hClip' : 0,
		'x' : this.cZone[0], 'y' : this.cZone[1], 'width' : this.cZone[2], 'height' : this.cZone[3]};

	// coeff to keep the image ratio
	// and pass size from canvas to image
	var stretchCoeff = 0;
	var oRatio = this.img.width / this.img.height;
	var cRatio = this.cZone[2] / this.cZone[3];

	if (oRatio > cRatio){
		//o is more horizontally stretched than c
		//up and down edges defines the size
		stretchCoeff = this.img.height/this.cZone[3];
		this.params["hClip"] = this.img.height;

		//we'll cut the lateral edges
		this.params["wClip"] = this.cZone[2] * stretchCoeff;
		// clip from the middle of the difference of width
		this.params["xClip"] = (this.img.width - this.params['wClip']) / 2;
	}
	else {
		// o is more vertically stretched than c
		// lateral sides defines the size	
		stretchCoeff = this.img.width/this.cZone[2] ;
		this.params["wClip"] = this.img.width;

		// we'll cut up and down edges
		// height of the canvas zone height stretched to the original image size
		this.params["hClip"] = this.cZone[3] * stretchCoeff;
		// clip from the middle of the difference of height
		this.params["yClip"] = (this.img.height - this.params['hClip']) /2;
	}
};		


//update params for filling the image in its zone
/** Give the information to fit the image 'this.img' in the canvas zone cZone
*	drawImage need 4 parameters to fit
*	the position where to start to draw on the canvas, x & y
*	the width and height of the image in the canvas
*
******************/
TMPart.prototype.fitParams = function (){
	//draw parameters
	this.params = {	'x' : this.cZone[0], 'y' : this.cZone[1], 
					'width' : this.cZone[2], 'height' : this.cZone[3]};

	// coeff to keep the image ratio
	// and pass size from canvas to image
	var stretchCoeff = 0;
	var oRatio = this.img.width / this.img.height;
	var cRatio = this.cZone[2] / this.cZone[3];

	if (oRatio > cRatio){
		//o is more horizontally stretched than c
		//lateral edges defines the size
		stretchCoeff = this.cZone[2]/this.img.width ;

		this.params["height"] = this.img.height * (this.cZone[2]/this.img.width);
		this.params["y"] += (this.cZone[3] - (this.img.height * stretchCoeff) )/2;
	}

	else{
		//o is more vertically stretched than c
		//up and down edges defines the size
		stretchCoeff = this.cZone[3]/this.img.height;

		this.params["width"] = this.img.width * (this.cZone[3]/this.img.height);
		this.params["x"] += (this.cZone[2] - (this.img.width * stretchCoeff) )/2;
	}
};		















	
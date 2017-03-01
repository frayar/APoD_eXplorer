function Breadcrumb(canvas,width,height, gapSize_opt, overlay_opt, vertical_opt){

	//Horizontal by default, 1 for vertical

	
	this.c = canvas;
	this.c.vertical = vertical_opt || 0;
	//The overlaying canvas
	this.c.overlay = overlay_opt|| 0;
	this.c.tm = [];
	//width of the treemaps in the canvas ( != of treemap width)
	this.c.tmSize = [];
	//In order to retrieve the id of the treemap clicked, we save their id
	this.c.tmId = [];
	//current x starting position = width of what has been drawed so far
	this.c.curSize = 0;
	//Used to launch treemap construction, incremented before drawing
	this.c.curIndex = 0;
	//Used to get number of treemap loaded, incremented after drawing
	this.c.nbLoaded = 0;
	//The last level of the breadcrumb, not determined yet
	this.c.endLevel = -1;

	this.c.width = width;
	this.c.style.width = width;
	this.c.height = height;
	this.c.style.height = height;
	this.c.offset = getOffset(this.c);//x60-y147

	//Gap size or Arrow width
	//Arrow must be square size
	this.c.gapSize = gapSize_opt || 0;
	if (this.c.gapSize !== 0 && this.c.overlay !== 0){
			this.c.arrow = new Image();
			this.c.arrow_down = new Image();
			this.c.arrow_down_pos = 0;

			if (this.c.vertical === 0){
				this.c.arrow.src = "images/arrowr3.png";
				this.c.arrow_down.src = "images/arrowd3.png";
			}
			else{
				this.c.arrow.src = "images/arrowd3.png";
				this.c.arrow_down.src = "images/arrowr3.png";
			
			}
	}


	var parent = this;
	this.c.getParent = function(){
		return parent;
	}

}

Breadcrumb.prototype.udpateCurSize = function (){
	var i = 0; 
	this.c.curSize = 0;
	/*console.log("Updating, index : " + index);*/

	//Going to draw canvas i, adding all previous treemap in canvas width
	for (i = 0 ; i < this.c.nbLoaded ; i++){
		if (i != this.c.endLevel){
			this.c.curSize += this.c.tmSize[i] + this.c.gapSize;
		}
		//Not adding the last arrow size or gap size if there isn't
		else{
			this.c.curSize += this.c.tmSize[i];
		}
		/*console.log("Width[" + i +"] : " + this.tmSize[i]);*/
	}
	/*console.log("CurSize : " + this.curSize);*/
};



Breadcrumb.prototype.setTMParameters = function (ratio, baseSize, autoOrient, design, drawingMethod){
	// Treemaps parameters
	this.ratio = ratio;
	this.baseSize = baseSize;
	this.autoOrient = autoOrient;		//1 for auto orient, 0 for static
	this.design = design;			//0 for multiratio, 1 for uniratio, 2 for 1-2-4 layout
	this.drawingMethod = drawingMethod;	//0 for fit, 1 for fill, 2 for stretch
}

Breadcrumb.prototype.addLevel = function (imageUrlArray,imagePath, nodeId, EndOfBreadCrumb_opt){

	//Adding or replacing a treemap breadcrumb object, does not draw. Only create the object.
	var newTMIndex = this.c.curIndex;

	
	/*console.log("END : " + this.c.endLevel);*/
	console.log("### NODE ID : " + nodeId);
	/*console.log("Id : " + this.c.id + ", TMIndex : " + newTMIndex + ", curSize : " + this.c.curSize);*/
	/*console.log("Index : " + this.c.curIndex);*/

	this.c.curIndex++;
	if (typeof this.ratio === 'undefined')
		throw 'You need to set treemaps parameters before adding treemaps - use setTMParameters';

	if (typeof nodeId === "undefined"){
		//Defining the end level if it's this level
		this.c.endLevel = (EndOfBreadCrumb_opt !== undefined)? newTMIndex : this.c.endLevel;
		this.c.tm[newTMIndex] = new Treemap(this.ratio, this.baseSize, this.c.id+newTMIndex, this.autoOrient, this.drawingMethod, this.design, this.c, 0, newTMIndex);
		this.c.tm[newTMIndex].setTreeMap(imagePath, imageUrlArray);
	}
	else{
		//Defining the end level if it's this level
		this.c.endLevel = (EndOfBreadCrumb_opt !== undefined)? nodeId : this.c.endLevel;
		//Tm id can be retrieved by the tmId property. tmId[0] = id of the first loaded and drawed treemap
		this.c.tm[nodeId] = new Treemap(this.ratio, this.baseSize, this.c.id+newTMIndex, this.autoOrient, this.drawingMethod, this.design, this.c, 0, nodeId);
		this.c.tm[nodeId].setTreeMap(imagePath, imageUrlArray);
	}

	

};


Breadcrumb.prototype.removeLevel = function (tmIndex){

	//Not building new treemap again, only deleting all after tmIndex+1 
	this.c.curIndex = tmIndex+1;
	this.c.nbLoaded = tmIndex+1;
	this.c.endLevel = -1;
	//We refresh the current size of our canvas
	this.udpateCurSize();
	var ctx = this.c.getContext("2d");
	//Clearing everything that goes further the current size
	if (this.c.vertical === 1){//Vertical canvas
		ctx.clearRect(0,this.c.curSize,this.c.width, this.c.height - this.c.curSize);
	}
	else{//Horizontal canvas
		ctx.clearRect(this.c.curSize,0,this.c.width - this.c.curSize, this.c.height);
	}
	/*console.log("Index : " + this.c.curIndex + ", tmIndex : "+ tmIndex);*/
	/*console.log(this.c.tmSize);*/
};

Breadcrumb.prototype.resetBC = function (){
	var ctx = this.c.getContext("2d");
	this.c.curIndex = 0;
	this.c.nbLoaded = 0;
	this.c.tmWidth = [];
	this.c.curSize = 0;
	ctx.clearRect(0,0,this.c.width, this.c.height);
	if (this.c.overlay){
		ctx = this.c.overlay.getContext("2d");
		this.c.overlay.curIndex = 0;
		this.c.overlay.nbLoaded = 0;
		this.c.overlay.tmWidth = [];
		this.c.overlay.curSize = 0;
		ctx.clearRect(0,0,this.c.overlay.width, this.c.overlay.height);
	}
};




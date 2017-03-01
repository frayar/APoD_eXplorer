/*** Object representing the breadcrumb_module module itself ***/
var breadcrumb_module = angular.module('breadcrumb_module', []);

/*** Service managing the neighbours of nodes ***/
breadcrumb_module.factory('BreadcrumbService', function() {
	return {
		initBreadcrumb: function (nbImages, overlayDepth, sigma){

				var ratio = [4,3];
				var baseSize = 10;
				var autoOrient = 1;		//1 for auto orient, 0 for static
				var design = 2;			//0 for multiratio, 1 for uniratio, 2 for 1-2-4 layout, 3 for 1 image
				var drawingMethod = 1;	//0 for fit, 1 for fill, 2 for stretch

				var BC_div = document.getElementById("breadcrumb-div");
				var BC_canvas = document.getElementById("breadcrumb");
				//Creating overlaying breadcrumb canvas (when clicking on an arrow)
				var BC_overlay_canvas = document.createElement("canvas");
				//Setting id of the canvas
				BC_overlay_canvas.id = "breadcrumb_overlay";
				//Setting position, (the breadcrumb canvas will be positionned under the arrow)
				BC_overlay_canvas.style.position = "absolute";
				/*BC_canvas.overlay_canvas = BC_overlay_canvas;*/
				//Adding the overlaying canvas to the page
				BC_div.appendChild(BC_overlay_canvas);
				//Hiding the overlaying breadcrumb canvas
				BC_overlay_canvas.style.visibility = 'hidden';

				// To overlay the breadcrumb and the canvas
				BC_div.style.position = "absolute";
				BC_div.style.zIndex  = 2;

				//Creating the breadcrumb objects
				//Parameters : canvas, width, height, gapSize, overlaying_canvas, vertical?
				var BC_overlay = new Breadcrumb(BC_overlay_canvas, 100, 800, 5, 0, 1);
				//Building global breadcrumb and linking overlaying breadcrumb canvas to this breadcrumb
				var BC = new Breadcrumb(BC_canvas, 970, 100, 48, BC_overlay_canvas);
				BC_overlay.setTMParameters(ratio, baseSize, autoOrient, design, drawingMethod);
				BC.setTMParameters(ratio, baseSize, autoOrient, design, drawingMethod);

				BC.nb_image_per_treemap = nbImages;
				BC.nb_children_overlay = overlayDepth;


				//The two objects will have same width, but the overlaying one is under the first
				//BC.c.overlay.offset.top = BC.c.offset.top + BC.c.height;
				BC.c.overlay.offset.top = BC.c.height;
				BC.c.overlay.offset.left= BC.c.offset.left;

				//Setting position of the overlaying breadcrumb canvas
				BC.c.overlay.style.top = BC.c.overlay.offset.top + "px";
				BC.c.overlay.style.left = BC.c.overlay.offset.left + "px";
				//Overlaying parameter
				BC.c.overlay.style.zIndex = 2;
				
				// Listening for the treemap that are ready
				BC.c.overlay.addEventListener('TMLoaded', this.loadedHandler, false);
				BC.c.overlay.addEventListener('click', this.zoneClickedHandler, false);

				BC.c.addEventListener('TMLoaded', this.loadedHandler, false);
				BC.c.addEventListener('click', this.zoneClickedHandler, false);
				BC.c.addEventListener('clickOut', this.clickOutHandler, false);


				BC.c.clickOutHandler = this.clickOutHandler;

				//Used to dispatch clicked event
				BC.c.sigma = sigma;
				BC.c.overlay.sigma = sigma;

				console.log(BC);

/*				document.addEventListener('click', function(){
					var bc = document.getElementById("breadcrumb");
					if (bc.arrow_down_pos !== 0){
						var event = new CustomEvent("clickOut");
						bc.dispatchEvent(event);
					}
				});*/


				this.BC = BC;
				var parent = this;
				this.BC.getParent = function(){
					return parent;
				}
				return BC;

		},



		/* Example handler used when treemaps are loaded */
		loadedHandler: function(e){
			e.stopPropagation();
			var size;
			var tmWidth = e.detail.c.width;
			var tmHeight = e.detail.c.height;
			var ctx = this.getContext("2d");

			if (this.vertical === 0){
				size = fitH(tmWidth, tmHeight, this.height, this.width - this.curSize);
				/*console.log("Horizontal. Size : " + size + ", curSize: " + this.curSize + " - w/h: " + tmWidth + "/" + tmHeight + " - W/H " + this.width + "/" + this.height + " - Reste :" + (this.width - this.curSize));*/
			}
			else{
				size = fitV(tmWidth, tmHeight, this.width, this.height - this.curSize);
				/*console.log("Vertical. Size : " + size + ", curSize: " + this.curSize  + " - w/h: " + tmWidth + "/" + tmHeight + " - W/H " + this.width + "/" + this.height + " - Reste :" + (this.height - this.curSize));*/
			}

			if (size !== -1){
				/*console.log("Drawing " + this.curSize + " - " + 0 + " - " + size + " - " + this.height);*/
				if (this.vertical === 0){
					ctx.drawImage(e.detail.c, this.curSize, 0, size, this.height);
				}
				else{
					ctx.drawImage(e.detail.c, 0, this.curSize, this.width, size);	
				}


				/*console.log("tmWidth["+this.nbLoaded+"] = "+ size );*/
				//Save the size in the canvas of this treemap
				this.tmSize[this.nbLoaded] = size;
				this.tmId[this.nbLoaded] = e.detail.i;
				this.nbLoaded++;

				if (this.gapSize > 0 && this.overlay !== 0 && this.endLevel !== e.detail.i){
					var offset;
					if (this.vertical === 0){
						offset = (this.height - this.gapSize ) /2
						ctx.drawImage(this.arrow, this.curSize + size, offset, this.gapSize, this.gapSize);
						/*console.log("draw arrow, pos : " + (this.curSize + size) + ":" + offset + ", size : " + this.gapSize + ":" + this.gapSize);*/
					}
					else{
						offset = (this.width - this.gapSize) /2;
						ctx.drawImage(this.arrow, offset, this.curSize + size, this.gapSize, this.gapSize);
						/*console.log("draw arrow, pos : " + (this.curSize + size) + ":" + offset + ", size : " + this.gapSize + ":" + this.gapSize);*/
					}
				}
				else if (this.gapSize > 0 && this.endLevel !== e.detail.i){
					if (this.vertical === 0){
						ctx.fillRect(this.curSize + size, 0, this.gapSize, this.height);
					}
					else{
						ctx.fillRect(0, this.curSize + size, this.width, this.gapSize);
					}
				}
				
				/*console.log("Before curSize : " + this.curSize + ", nbLoaded : " + this.nbLoaded);*/
				this.getParent().udpateCurSize();
				/*console.log("Before curSize : " + this.curSize);*/
			}

		},


		//Get the treemap or the arrow which has been clicked in the global canvas
		 zoneClickedHandler : function(e){
			e.stopPropagation();
			var hov_index = 0;
			var sizeSum = 0;
			var arrow = 0;

			//Offset on the canvas, horizontally or vertically
			var offset = (this.vertical === 0)? e.pageX - this.offset.left: e.pageY - this.offset.top;
			//console.log(e);
			//console.log(offset);
			//console.log(this.tmSize);
			/*var y = e.clientY - this.offset.top;*/

			//Mouse is over a treemap
			if (offset < this.curSize){
				//Iterating and make sum until offset < sum of element width
				while(offset > sizeSum){
					sizeSum += this.tmSize[hov_index] + this.gapSize;
					hov_index++;
				}
				//Mouse is over an arrow, between two treemap
				//elements width sum - gapSize < Offset < elements width sum
				if (offset > sizeSum - this.gapSize){
					arrow = 1;
				}
			}
			else{
				hov_index = "out";
			}

			//If we click on a blank part of the breadcrumb's canvas, we hide the overlay
			if (hov_index == "out"){
					this.clickOutHandler();
			}
			else if (arrow !== 0 && this.overlay !== 0){
				var offset; 
				var oldPos = this.arrow_down_pos;
				var ctx = this.getContext("2d");
				
				this.arrow_down_pos = sizeSum - this.gapSize;
				/*console.log("size_sum : " + sizeSum + ", gapSize : " + this.gapSize);*/

				//If we click a second time on the arrow down, we hide the overlay
				if (this.arrow_down_pos === oldPos && oldPos !== 0){
					this.clickOutHandler();
				}

				else{			
					var e = new CustomEvent('DisplayOverlay',{"detail":hov_index});
					this.overlay.dispatchEvent(e);

					if (this.vertical === 0){
						// The offset of the overlaying canvas is the width of all treemaps so far
						// less the gap size, and because we're in absolute position, its offset
						//this.overlay.style.left = (sizeSum - this.gapSize + this.overlay.offset.left) + "px";
						this.overlay.style.left = this.arrow_down_pos + "px";
						offset = (this.height - this.gapSize ) /2;
						//We revert the last arrow down in its original state
						if (oldPos !== 0){
							ctx.clearRect(oldPos, offset, this.gapSize, this.gapSize);
							ctx.drawImage(this.arrow, oldPos, offset, this.gapSize, this.gapSize);
						}
						//And we erase the current arrow right to replace it by an arrow down
						ctx.clearRect(this.arrow_down_pos, offset, this.gapSize, this.gapSize);
						ctx.drawImage(this.arrow_down, this.arrow_down_pos, offset, this.gapSize, this.gapSize);
						/*console.log("draw arrow, pos : " + (this.curSize + size) + ":" + offset + ", size : " + this.gapSize + ":" + this.gapSize);*/
					}
					else{
						// The offset of the overlaying canvas is the width of all treemaps so far
						// less the gap size, and because we're in absolute position, its offset
						//this.overlay.style.height = (sizeSum - this.gapSize + this.overlay.offset.height) + "px";
						this.overlay.style.left = this.arrow_down_pos + "px";
						offset = (this.width - this.gapSize) /2;
						//We revert the last arrow down in its original state
						if (oldPos !== 0){
							ctx.clearRect(oldPos, offset, this.gapSize, this.gapSize);
							ctx.drawImage(this.arrow, offset, oldPos, this.gapSize, this.gapSize);
						}
						//And we erase the current arrow right to replace it by an arrow down
						ctx.clearRect(offset, this.arrow_down_pos, this.gapSize, this.gapSize);
						ctx.drawImage(this.arrow_down, offset, this.arrow_down_pos, this.gapSize, this.gapSize);
						/*console.log("draw arrow, pos : " + (this.curSize + size) + ":" + offset + ", size : " + this.gapSize + ":" + this.gapSize);*/
					}
				}
			}
			//Here the code to change level according to hov_index
			//Need to separate overlay click from breadcrumb click
			else{
				var treemapNode = -1;
				var id = this.tmId[hov_index - 1];
				console.log("LevelCursor Clicked: " + (hov_index)  + ", Id : " + id);

				//If the clicked node is in the current level, we identify it
				this.sigma.graph.nodes().some(function(n) {
					if (n.id == id || n.id === "n0.1.31")
					{
						console.log("Node Found. Current Level.");
						treemapNode = n;
						return true;
					}
				});	

/*				var e = new CustomEvent('clickTreemap',{
					"detail":{
						id : this.tmId[hov_index - 1],
						node : treemapNode,
					},
				});*/
			
				/*this.sigma.dispatchEvent(e);*/
			}
			
			return hov_index;
		},


		clickOutHandler: function(e){
			var offset;
			var ctx = this.getContext("2d");

			/*console.log("Bubbles up !");*/
			if (this.arrow_down_pos !== 0){
				if (this.vertical === 0){
					offset = (this.height - this.gapSize ) /2;
					//Erasing last arrow down and drawing arrow right
					ctx.clearRect(this.arrow_down_pos, offset, this.gapSize, this.gapSize);
					ctx.drawImage(this.arrow, this.arrow_down_pos, offset, this.gapSize, this.gapSize);
					/*console.log("draw arrow, pos : " + (this.curSize + size) + ":" + offset + ", size : " + this.gapSize + ":" + this.gapSize);*/
				}
				else{
					offset = (this.width - this.gapSize) /2;
					//Erasing last arrow down and drawing arrow right
					ctx.clearRect(offset, this.arrow_down_pos, this.gapSize, this.gapSize);
					ctx.drawImage(this.arrow, offset, this.arrow_down_pos, this.gapSize, this.gapSize);
					/*console.log("draw arrow, pos : " + (this.curSize + size) + ":" + offset + ", size : " + this.gapSize + ":" + this.gapSize);*/
				}
				this.arrow_down_pos = 0;
				this.overlay.style.visibility = 'hidden';
				/*console.log("invisible");*/
			}
		},

	};
});
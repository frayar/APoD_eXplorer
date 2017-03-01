/*** Object representing the breadcrumb_module module itself ***/
var treemap_module = angular.module('treemap_module', []);

/*** Service managing the neighbours of nodes ***/
treemap_module.factory('TreemapService', function() {
	return {
		buildTreemap: function(id, overlayDivId, width, height, absolutePath){
			var TM_canvas = document.getElementById(id);

			var ratio = [4,3];
			var autoOrient = 1;
			var method = 1;
			var design = 2;
			var baseSize;


			//Parameters : ratio, baseSize, canvasId, autoOrient, method, design, 
			// 				target_canvas, overlayDivId, index, absoluteImagePathOption
			var TM = new Treemap(ratio,baseSize, id, autoOrient, method, design, TM_canvas, overlayDivId, 0, absolutePath);
			TM.setMaxSize(width, height);
			TM.c.addEventListener("mouseover", this.TreemapImagesOverlay, false);
			TM.c.addEventListener("TMLoaded", this.loadedTMHandler);
			/*TM.c.onClickHandler = this.onClickHandler;*/



			return TM;

		},





		TreemapImagesOverlay: function(e){
			var x = e.pageX - this.offset.left;
			var y = e.pageY - this.offset.top;
/*			console.log("OFFSETS : " + this.offset.left + ":" + this.offset.top);
			console.log("MOUSE : " + e.pageX + ":" + e.pageY);*/
			/*console.log("Pos : " + x +":"+ y);*/
			/*console.log(e);*/
			var tm = this.getParent();
			var partIndex = tm.getZone(x,y);
			//console.log("PartIndex: " + partIndex);
			tm.over_imgs[partIndex].style.visibility = 'visible';
			//console.log("Hovering["+partIndex+"] " + tm.over_imgs[partIndex].src.substr(-7));
		},


		//TM ready and drawed handler
		//TM is already drawed, but can be drawed in nested canvas if wanted
		loadedTMHandler: function(e){

			//Hiding overlaying images when mouse leave
			for (i in e.detail.over_imgs){
				e.detail.over_imgs[i].addEventListener("mouseleave", function(){
					this.style.visibility = 'hidden';
				}, false);
				e.detail.over_imgs[i].onclick = this.onClickHandler;
			}
		},

		onClickHandler: function(e){
			console.log("Treemap image click");
			var image = this.src;

			/* Getting the name of the image */
			var parts = image.split("/");
			var name = parts[parts.length - 1];
			
			/* Setting the image as the content of the window */
			var content = "<!DOCTYPE html><html><head><title>" + name + "</title></head>"
			content += "<body><img src=\"" + image + "\"></body></html>";
			
			/* Displaying the window in a popup*/
			/*var popupImage = window.open("", "_blank", "toolbar=0, location=0, directories=0, menuBar=0, scrollbars=1, resizable=1");*/

			/* Displaying the window in a new tab*/
			var popupImage = window.open("", "_blank");
			popupImage.document.open();
			popupImage.document.write(content);
			popupImage.document.close()
		},

	};
});


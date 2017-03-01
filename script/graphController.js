/*** Linkurious.js optimized default values ***/
// https://github.com/Linkurious/linkurious.js/wiki/Settings-by-Linkurious

/*** Object representing the application itself ***/
var graphModule = angular.module('graphApp', ['importer', 'neighbourhood', 'breadcrumb_module','representative_module', 'treemap_module']);

/*** Controller managing the graph ***/
graphModule.controller('GraphController', ['$scope', 'ImporterService', 'NeighbourhoodService', 'BreadcrumbService', 'RepresentativeService','TreemapService',
	                                      function($scope, ImporterService, NeighbourhoodService, BreadcrumbService, RepresentativeService, TreemapService) 
{	
	/** URL **/
	var dataURL = "./data/nasa_apod.json";
	var graphURL = "./data/NASA_APOD_resized_CLD_HRNG_T20_layout.json";

	/** Data variables **/
	var jsonData = "";
	var dateMap = {};

	/** Graph object **/
	var currentGraph = null;

	/** Buttons variables */
	var displayEdge = true;
	var displayImage = true;
	
	/** Default color of the nodes **/
	var defaultColor = "#666"; 	// default_red= "#ec5148"
	
	/** Camera animation parameters **/
	var zoomRatio = 0.25;
	var animDuration = 1000;
	var minNodeSize_ = 2;
	var maxNodeSize_ = 20;
	
	/** Navigation logfile **/
	var logfile = [];
	var logCursor = -1;
	var lastSelected = -1;
	var neighbours = [];

	/** Array managing the graph levels **/
	var levelStack = [];
	var levelCursor = -1;
	
	/** Initial tab **/
	var currentTab = "nodeTab";
	
	/** Sigma.js instance **/
	var sig = new sigma({
		graph: {nodes: [], edges: []},
		//container: 'graph',
		//type: 'canvas'
		renderer: {
			container: 'graph',
			type: 'canvas'
		},
		// https://github.com/Linkurious/linkurious.js/wiki/Settings
		settings : {
		//defaultEdgeType: 'tapered', // require sigma.renderers.customEdgeShapes
		
		 // Labels:
		//font: 'helvetica', 	// default=robotoregular 
		defaultLabelColor: '#000000', // default='#2e2c2d'
		//defaultLabelSize: 12,
		labelThreshold: 10,
		defaultEdgeLabelSize: 12,
		edgeLabelThreshold: 15,
		drawLabels: false,
		drawEdgeLabels: false,

		// Edges:
		edgeColor: 'default',
		defaultEdgeColor: '#ccc', // default='#a9a9a9'

		// Nodes:
		defaultNodeColor: "#666", // default='#333333'
		borderSize: 2,
		outerBorderSize: 2,
		nodeBorderColor: 'default',
		defaultNodeBorderColor: '#fff',
		defaultNodeOuterBorderColor: '#000',

		// Hovered items:
		singleHover: true,
		hoverFontStyle: 'bold',
		nodeHoverColor: 'default',
		defaultNodeHoverColor: '#000',
		edgeHoverColor: 'default',
		defaultEdgeHoverColor: '#000',
		labelHoverColor: 'default',
		defaultLabelHoverColor: '#F000',
		labelHoverBGColor: 'default',
		defaultHoverLabelBGColor: '#fff',
		labelHoverShadow: 'default',
		labelHoverShadowColor: '#000',

		// Active nodes and edges:
		activeFontStyle: 'bold',
		nodeActiveColor: 'node',
		defaultNodeActiveColor: '#ffffff',
		edgeActiveColor: 'default',
		defaultEdgeActiveColor: '#f65565',
		edgeHoverExtremities: true,
		
		// Rescale settings
		minNodeSize: minNodeSize_,
		maxNodeSize: maxNodeSize_,
		minEdgeSize: 1,
		maxEdgeSize: 2,

		// Captors setting
		//zoomingRatio: 1.382,
		//doubleClickZoomingRatio: 1,
		zoomMin: 0.05,
		zoomMax: 5,
		doubleClickZoomDuration: 0,
		touchEnabled: true,

		// Global settings
		//autoRescale: ['nodeSize', 'edgeSize'],
		doubleClickEnabled: true,
		enableEdgeHovering: true,
		edgeHoverPrecision: 1,	// default=10

		// Camera settings
		nodesPowRatio: 0.8,
		edgesPowRatio: 0.8,

		// Anitmation settings
		//animationsTime: 800

		// Halo
		nodeHaloColor: '#ecf0f1',
   		edgeHaloColor: '#ecf0f1',
    	nodeHaloSize: 50,
    	edgeHaloSize: 10
		}
	});


	/** Plugins */

	//Breadcrumb canvas and overlay canvas initialisation
	var BC = BreadcrumbService.initBreadcrumb(7,4,sig);

	//Near and far representative treemaps
	var absolutePath = 0;
	var TMNear = TreemapService.buildTreemap("nearRepTreemap", "nearRepresentativeTabContent", 290, 400, absolutePath);
	var TMFar = TreemapService.buildTreemap("farRepTreemap", "farRepresentativeTabContent", 290, 400, absolutePath);


	// Initialize the activeState plugin:
	var activeState = sigma.plugins.activeState(sig);


	/** Main **/
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
    	if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {

			// Read JSON
        	currentGraph = JSON.parse(xmlhttp.responseText);

        	// Read as sigma graph
			sig.graph.read(currentGraph);

			// Push in the hierarchy of graphs
			levelStack.push( graph );
			levelCursor++;

			// Notification
			console.log("Found " + sig.graph.nodes().length + " nodes in the graph.")

			// Assign today ID
			today = sig.graph.nodes().length - 1 ;

			// Load data
			$scope.LoadData();
    	}
	};
	xmlhttp.open("GET", graphURL, true);
	xmlhttp.send();


	/** Function that update the interface current image  **/
	$scope.LoadData = function()
	{
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
	    	if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {

				// Read JSON
	        	jsonData = JSON.parse(xmlhttp.responseText);

	        	// Notification
				console.log("Found " + jsonData["events"].length + " events in the data.")

				// Build date Map to allow easy search of events by date
				for (var i = 0; i < jsonData["events"].length; i ++)
    				dateMap[jsonData["events"][i].date] = jsonData["events"][i];

				// Initialise graph
				$scope.init();

				// Display graph
				$scope.display();
	    	}
		};
		xmlhttp.open("GET", dataURL, true);
		xmlhttp.send();

	}

	
	/** Function to initialize the graph **/
	$scope.init = function()
	{
		//document.getElementById("currentNode")
		 // ...then set the internal size to match
		 //canvas.width  = canvas.offsetWidth;
		 //canvas.height = canvas.offsetHeight;

		/* Preprocessing each node */
		sig.graph.nodes().forEach(function(n) {

			// Get event in the data
			var entry = dateMap[n.representative.substring(0,10)];

			// Assign image
			n.image = entry.url;
			
			// Check if hierarchical
			if (!n.children)
				n.type = "square";	// Set the shape of the node as square if leaf
			
			// Save original attributes
			n.originalColor = (n.color)? n.color : sig.settings('defaultNodeColor');
			n.originalSize = (n.size)? n.size : sig.settings('minNodeSize');
			n.originalLabel = (n.label)? n.label : "";
		});
				
		/* Preprocessing each edge*/
		sig.graph.edges().forEach(function(e) {
		
			// Save original attributes
			e.originalColor = (e.color)? e.color : sig.settings('defaultEdgeColor');
			e.originalSize = (e.size)? e.size : sig.settings('minNodeSize');
			e.originalLabel = (e.label)? e.label : "";
		});

		//
		// SET LISTENERS
		//

		// Halo around neighbours
		sig.renderers[0].bind('render', function(e) {
		  sig.renderers[0].halo({
		    nodes: neighbours
		  });
		});


		// When a node is clicked
		sig.bind('clickNode', function(e) {
			// Displaying the informations of the node
			$scope.selectNode(e.data.node.id, logCursor + 1, "image", false);

			document.getElementById("backToLastSelected").disabled = true;
		});
		
		// When a node is double clicked
		sig.bind('doubleClickNode', function(e) {
			////// Going into the sub-graph of the node if it has one
			if (e.data.node.children && e.data.node.children.nodes.length > 1 )
			{
				$scope.selectNode(e.data.node.id, logCursor + 1, "down", false);
				levelStack.push(e.data.node);
				levelCursor++;
				$scope.drillDown();
			}
			document.getElementById("backToLastSelected").disabled = true;
		});
		
							
		// When the background is left clicked, not for dragging
		sig.bind('clickStage', function(e) {

			var bc = document.getElementById("breadcrumb");
			if (bc.arrow_down_pos !== 0){
				var event = new CustomEvent("clickOut");
				bc.dispatchEvent(event);
			}


			if (!e.data.captor.isDragging){
				// Deselecting the node
				$scope.deselectNode();
				
				// Resetting the camera
				sigma.misc.animation.camera(
					sig.camera, 
					{
						x: 0, 
						y: 0,
						ratio: 1
					}, 
					{duration: 300}
				);
			}
		});
		
		// Displaying the image of the node and its representatives when the mouse is over it
		sig.bind('hovers', function(e) {
		
			// Handling non leaf node hover
			if (e.data.current.nodes.length > 0) {
			
				// Get hovered node
				hoveredNode = e.data.current.nodes[0];
				
				// Display node medoid as thumbnail
				if (hoveredNode.representative)
				{
					img = ( hoveredNode.image.url )? hoveredNode.image.url : hoveredNode.image;
					document.getElementById("currentNode").innerHTML = "<img id=\"miniCurrentImage\" src=\"" + img + "\"/>";	
				}								
					
				// Display node representatives as a pseudo treemap	
				$scope.updateRepresentatives(hoveredNode);
			}
			else
			{
				// Reset thumbnail
				document.getElementById("currentNode").innerHTML = "";
				
			}
			
			
			// Handling edges on hover
			if (e.data.current.edges.length > 0) 
			{
				// Get hovered edge
				hoveredEdge = e.data.current.edges[0];
				
				// Highlight
				//hoveredEdge.size = 20;
				//hoveredEdge.color = "#ff0000";
				
			}
		});
	};

	/** Function that display a graph that has been load by sigma **/
	$scope.display = function()
	{
		// Resetting the displaying
		sigma.misc.animation.camera(
			sig.camera, 
			{
				x: 0, 
				y: 0,
				ratio: 1
			}, 
			{duration: 1}
		);

		// Get number of image in total
		var total_nb_images = 0;
		sig.graph.nodes().forEach(function(n) {
			total_nb_images += parseFloat(n.nb_images);
		});

		/* Preprocessing each node */
		sig.graph.nodes().forEach(function(n) {

			// Handle node image
			if (n.representative)
			{
				// Setting the image as object to display them in the nodes
				if (displayImage)
					n.image = {
						url: dateMap[n.representative.substring(0,10)].url,
						clip: 1.0,
						scale: 1.0,
					}
				else 	// Setting the images only as path to hide them
					n.image = dateMap[n.representative.substring(0,10)].url;
			}
			
			// Special case when a node has only one child: display as an image node!
			if (n.children && n.children.nodes.length == 1)
			{			
				// Getting the unique child
				var child = n.children.nodes[0];
	
				// Setting the image as object to display them in the nodes
				if (displayImage)
					n.image = {
						url: dateMap[child.representative.substring(0,10)].url,
						clip: 1.0,
						scale: 1.0,
					}
				else 	// Setting the images only as path to hide them
					n.image = dateMap[child.representative.substring(0,10)].url;
				
				// Set the shape of the node as square if leaf
				n.type = 'square';
			}

			// Check if hierarchical
			if (!n.children)
				n.type = "square";	// Set the shape of the node as square if leaf
			
			// Assign default color and size + id as label
			n.color = displayImage?"#FFF":sig.settings('defaultNodeColor');
			n.size = (n.children)?  Math.max(parseFloat(n.nb_images) * 10 / total_nb_images, 1) : 1 ;
			var date = n.representative.substring(0,10);
			n.label = date + "-" + dateMap[date].title
			
			// Patch to handle "nan" positions
			if (n.x.includes("nan"))
			{
				n.x = Math.random() * 2;
				n.y = Math.random() * 2;
			}
			
		});
				
		/* Preprocessing each edge*/
		sig.graph.edges().forEach(function(e) {
			// Assign default color and size + weight as label
			e.color = sig.settings('defaultEdgeColor');
			e.size = sig.settings('maxEdgeSize');
			e.label = e.weight;
		});

		// Displaying the graph
		sig.refresh();

		// Display the breadcrumb
		$scope.updateBreadCrumb();

	}

	/** Function that go to the root of the tree **/
	/** Old $scope.reset() **/
	$scope.goToRoot = function()
	{
		/* Resetting the displaying */
		sig.graph.clear();

		// Loading initial graph
		sig.graph.read(currentGraph);

		// Display the graph
		$scope.display();

		// Deselect all nodes
		activeState.dropNodes();

		// Reset breadcrumb
		BC.resetBC();
		
		/* Disabling the rollUp button if the new level is the first */
		document.getElementById("rollUp").disabled = true;	

		// Set to first level
		levelCursor = 0

		/* Displaying the node tab */
		$scope.changeTab("nodeTab");
		
		/* Clearing the node information list */
		document.getElementById("selectedNode").innerHTML = "Click on a node to show its data";
		document.getElementById("selectedImage").innerHTML = "";
		document.getElementById("date").innerHTML = "";
		document.getElementById("title").innerHTML = "";
		document.getElementById("subgraphDetails").innerHTML = "";
		document.getElementById("neighboursList").innerHTML = "";
		document.getElementById("nodesInfo").hidden = true;

		// Clear representative
		for (var i = 0; i < 7; i++)
		{
			document.getElementById("nrep" + i).src = '';
			document.getElementById("nrep" + i).style.visibility = 'hidden';
			document.getElementById("frep" + i).src = '';
			document.getElementById("frep" + i).style.visibility = 'hidden';
		}

		
		/* Clearing the logfile */
		document.getElementById("logTabContent").innerHTML = "<p>Empty logfile</p>";
		logfile = [];
		logCursor = -1;
		lastSelected = -1;

	}

	
	/** Function to show or hide the edges of the graph **/
	$scope.showHideEdges = function()
	{
		/* Showing the edges */
		if (!displayEdge)
		{
			document.getElementById("showHideEdgesImage").src = "images/hide_edges_red.png";
			displayEdge = true;
			
			sig.graph.edges().forEach(function(e) {
				e.hidden = false;
			});
		}
		/* Hiding the edges */
		else
		{
			document.getElementById("showHideEdgesImage").src = "images/show_edges_red.png";
			displayEdge = false;
			
			sig.graph.edges().forEach(function(e) {
				e.hidden = true;
			});
		}
		
		/* Refreshing the displaying */
		sig.refresh();
	}
	
	/** Function to display images in the node or hide them **/
	$scope.showHideImages = function()
	{
		/* Showing the images */
		if (!displayImage)
		{
			// Changing the button
			document.getElementById("showHideImagesImage").src = "images/hide_image_red.png";
			displayImage = true;
		
			// Setting the image as object to display them in the nodes
			sig.graph.nodes().forEach(function(n) {
				if (n.representative)
				{
					n.image = {
						url: dateMap[n.representative.substring(0,10)].url,
						clip: 1.0,
						scale: 1.0
					}
				}
				n.color = "#fff";
			});
			sig.refresh();
		}
		/* Hiding the images */
		else
		{
			// Changing the button
			document.getElementById("showHideImagesImage").src = "images/show_image_red.png";
			displayImage = false;
			
			// Setting the images only as path
			sig.graph.nodes().forEach(function(n) {
			
				if (n.image)
					n.image = dateMap[n.representative.substring(0,10)].url,
					
				n.color = "#666";
			});
			sig.refresh();
		}
	}
	
	/** Function to run the Stress Majorization layout algorithm **/
	$scope.smLayout = function()
	{
		// Configure the Stress Majorization algorithm:
		var smListener = sigma.layouts.stressMajorization.configure(sig, {
		  iterations: 1000, //def=500
		  easing: 'quadraticInOut',
		  duration: 10000  //def=800
		});

		// Bind the events:
		smListener.bind('start stop interpolate', function(e) {
		  console.log(e.type);
		});

		// Start the Stress Majorization algorithm:
		sigma.layouts.stressMajorization.start(sig);

	}

	/** Function that open the help page **/
	$scope.help = function()
	{
		window.open('graph_help.html','_blank');
	}



	/** Function to change the node size **/
	$scope.changeNodeSize = function()
	{
		/* Getting the new value */
		var value = $scope.data.sizevalue;
		
		/* Updating the sigma instance maxNodeSize */
		sig.settings('maxNodeSize', maxNodeSize_*value);

		/* Refreshing the display */
		sig.refresh();
		
		/* Updating the UI */
		document.getElementById("nodeSize").innerHTML = value;
	}
	
	
	/** Function to select a node **/
	$scope.selectNode = function(nodeId, logPosition, type, previousOrNext)
	{
		var newSelectedNode;
		var newImage;

		/* Getting the node itself */
		sig.graph.nodes().forEach(function(n) {
			if (n.id == nodeId)
			{
				newSelectedNode = n;
			}
		});	


		// Deselect all nodes
		activeState.dropNodes();

		// Set the node as active
		activeState.addNodes(nodeId);
		
		/* Getting the image of the node */
		if (type == "image")
		{
			if (newSelectedNode.image.url)
			{
				newImage = newSelectedNode.image.url;
			}
			else
			{
				newImage = newSelectedNode.image;
			}
		}
		else if (type == "down")
		{
			newImage = "images/down.png";
		}
		else
		{
			newImage = "images/up.png";
		}
		
		/* If the node to display is not already in the logfile */
		if (!previousOrNext)
		{
			// If the current node is not the last of the logfile
			if (logCursor < logfile.length - 1)
			{
				for (i = logfile.length - 1 ; i > logCursor ; i--)
				{
					logfile.pop();
				}
			}
			
			// Putting the node in the logfile
			logfile.push({ id: nodeId, image: newImage, type: type });
		}
		
		/* Updating the cursor of the log */
		logCursor = logPosition;

		// Moving the camera to zoom on the node
		sigma.misc.animation.camera(
			sig.camera, 
			{
				x: newSelectedNode[sig.camera.readPrefix + 'x'], 
				y: newSelectedNode[sig.camera.readPrefix + 'y'],
				ratio: zoomRatio
			}, 
			{duration: animDuration}
		);

		
		/* Displaying the information of the node */
		var date = newSelectedNode.representative.substring(0,10);
		var title = dateMap[date].title;
		var desc = date + " - " + title + " - " + dateMap[date].text;
		document.getElementById("nodesInfo").hidden = false;
		document.getElementById("selectedNode").innerHTML = "Selected node: " + newSelectedNode.id;
		document.getElementById("selectedImage").innerHTML = "<img id=\"miniSelectedImage\" src=\"" + newImage + "\" onclick=\"angular.element(this).scope().zoomImage(&quot;" + newImage + "&quot;)\"/><br />";
		document.getElementById("selectedImage").innerHTML += "<div id=\"zoomMessage\">Click on the image to show it entirely</div>";
		document.getElementById("date").innerHTML = "Date: " + date;
		document.getElementById("title").innerHTML = "Title: " + title;
		// Display the description as tooltip
		document.getElementById("selectedImage").title = desc;
		document.getElementById("date").title = desc;
		document.getElementById("title").title = desc;

		/* Displaying the information of the subtree */
		if (newSelectedNode.children)
		{
			// Getting the number of children
			var nbEdge = newSelectedNode.children.edges? newSelectedNode.children.edges.length : 0;
			document.getElementById("subgraphDetails").innerHTML = "Subgraph: " + newSelectedNode.children.nodes.length + " nodes, " + nbEdge + " edges, " + newSelectedNode.nb_images + " images" ;
			document.getElementById("subgraphDetails").hidden = false;
		}
		
		// Displaying the neighbours of the node
		neighbours = NeighbourhoodService.getNeighbours(sig, nodeId);
		document.getElementById("neighboursList").innerHTML = "";
		for (i = 0 ; i < neighbours.length ; i++)
		{
			var newNeighbourImage;
			if (newSelectedNode.image.url)
			{
				newNeighbourImage = neighbours[i].image.url;
			}
			else
			{
				newNeighbourImage = neighbours[i].image;
			}
			
			var newNeighbour = "<li><a href=\"#\">";
			newNeighbour += "<img class=\"neighbourImage\" src=\"" + newNeighbourImage + "\" onclick=\"angular.element(this).scope().selectNode(&quot;" + neighbours[i].id + "&quot;, " + (logCursor + 1) + ", &quot;image&quot;, false)\"/>";
			newNeighbour += "<img class=\"neighbourImageZoom\" src=\"" + newNeighbourImage + "\" onclick=\"angular.element(this).scope().selectNode(&quot;" + neighbours[i].id + "&quot;, " + (logCursor + 1) + ", &quot;image&quot;, false)\"/>";
			newNeighbour += "</a></li>";
			document.getElementById("neighboursList").innerHTML += newNeighbour;	
		}
		document.getElementById("neighboursList").hidden = false;
		
  		// Highlighting the neighbours of the node
		NeighbourhoodService.highlightNeighbours(sig, nodeId, neighbours);

		// Display node representatives as a pseudo treemap	
		$scope.updateRepresentatives(newSelectedNode);

		/* Enabling or disabling the navigation buttons depending on the cursor */
		if (logCursor > 0)
		{
			document.getElementById("previous").disabled = false;
			document.getElementById("goToFirst").disabled = false;
		}
		else
		{
			document.getElementById("previous").disabled = true;
			document.getElementById("goToFirst").disabled = true;
		}
		if (logCursor < logfile.length - 1)
		{
			document.getElementById("next").disabled = false;
			document.getElementById("goToLast").disabled = false;
		}
		else
		{
			document.getElementById("next").disabled = true;
			document.getElementById("goToLast").disabled = true;
		}
		
		if (document.getElementById("backToLastSelected").disabled == false)
		{
			document.getElementById("backToLastSelected").disabled = true;
		}
		
		/* Displaying the updated logfile */
		$scope.viewLog();	
	}
	

	/** Function that display/update representtive */
	$scope.updateRepresentatives = function(node)
	{
		// Display node representatives as a pseudo treemap	
		if (node.children)
		{
			// Get list of representatives
			var nearRepresentatives = node.near_representatives.split(",");
			var maxNearRepresentatives = Math.min(7,nearRepresentatives.length);
			var nearRepresentativesID = [];
			var farRepresentatives = node.far_representatives.split(",");
			var maxFarRepresentatives = Math.min(7,farRepresentatives.length);
			var farRepresentativesID = [];
			
			// Assign representatives images
			for (var i = 0; i< maxNearRepresentatives; i++)
				nearRepresentativesID.push(dateMap[nearRepresentatives[i].substring(0,10)].url);
			for (var i = 0; i< maxFarRepresentatives; i++)
				farRepresentativesID.push(dateMap[farRepresentatives[i].substring(0,10)].url);

			// Assign treemaps
			TMNear.c.offset = getOffset(document.getElementById("tabsContent"));
			TMFar.c.offset = getOffset(document.getElementById("tabsContent"));
			TMNear.c.offset.left += 6;
			TMNear.c.offset.top += 6;
			TMFar.c.offset.left += 6;
			TMFar.c.offset.top += 6;
			TMNear.setTreeMap("", nearRepresentativesID);
			TMFar.setTreeMap("", farRepresentativesID);
		}
	}

	/** Function to deselect the current node **/
	$scope.deselectNode = function()
	{
		/* Deleting the node information list */
		document.getElementById("selectedNode").innerHTML = "Click on a node to show its data";
		document.getElementById("selectedImage").innerHTML = "";
		document.getElementById("date").innerHTML = "";
		document.getElementById("title").innerHTML = "";
		document.getElementById("subgraphDetails").innerHTML = "";
		document.getElementById("neighboursList").innerHTML = "";
		document.getElementById("nodesInfo").hidden = true;
		
		// Set all nodes as "inactive" 
		activeState.dropNodes();
		neighbours = [];

		/* Resetting the colours of edges */
		sig.graph.edges().forEach(function(e) {
			e.color = e.originalColor;
		});

		sig.refresh();
		
		/* Saving the position of the node in the logfile */
		lastSelected = logCursor;
		
		/* Enabling the back to last button and disabling the other buttons */
		document.getElementById("backToLastSelected").disabled = false;
		document.getElementById("previous").disabled = true;
		document.getElementById("next").disabled = true;
		document.getElementById("goToFirst").disabled = true;
		document.getElementById("goToLast").disabled = true;
		
		$scope.viewLog();
		
		// DAS2016
		// TODO un-highlight selected node
	}
	
	/** Function to view the current selected image full-sized **/
	$scope.zoomImage = function(image)
	{
		/* Getting the name of the image */
		var parts = image.split("/");
		var name = parts[parts.length - 1];
		
		/* Setting the image as the content of the window */
		var content = "<html><head><title>" + name + "</title></head>"
		content += "<body><img src=\"" + image + "\"></body></html>";
		
		/* Displaying the window */
		var popupImage = window.open("", "_blank", "toolbar=0, location=0, directories=0, menuBar=0, scrollbars=1, resizable=1");
		popupImage.document.open();
		popupImage.document.write(content);
		popupImage.document.close()
	}
	
	/** Function to display the logfile of the current graph **/
	$scope.viewLog = function()
	{
		var log = "<ul id=\"logfile\">";
		
		/* Displaying the id and the image of the nodes */
		for (i = 0 ; i < logfile.length ; i++)
		{			
			// Highlighting the current node
			if ((i == logCursor) && (document.getElementById("date").innerHTML != ""))
			{
				log += "<li id=\"currentLogNode\">-" + logfile[i].id + "-<br />";
				log += "<img id=\"currentLogImage\" class=\"logImage\" src=\"" + logfile[i].image + "\"/>";
			}
			// Displaying the other nodes
			else
			{
				log += "<li>" + logfile[i].id + "<br />";
				log += "<img class=\"logImage\" src=\"" + logfile[i].image + "\" onclick=\"angular.element(this).scope().selectNode(&quot;" + logfile[i].id + "&quot;, " + i + ", &quot;" + logfile[i].type + "&quot;, true)\"/>";
			}
			log += "</li>";
		}
		log += "</ul>";
		
		/* Displaying the logfile */
		document.getElementById("logTabContent").innerHTML = log;
	}
	
	/** Function to display the previous node in the logfile **/
	$scope.previousNode = function()
	{
		/*var partsSrc = logfile[logCursor].id.split(".");
		var partsDest = logfile[logCursor - 1].id.split(".");
		var nbLvChanges = partsSrc.length - 1;
		
		for (i = 0 ; i < partsSrc.length - 1 ; i++)
		{
			if (partsSrc[i] == partsDest[i])
			{
				nbLvChanges--;
			}
		}
		
		for (i = 0 ; i < nbLvChanges ; i++)
		{
			if (i == 0)
			{
				$scope.rollUp();
			}
			else
			{
				setTimeout(function(){ $scope.rollUp() }, (animDuration * 2) + 10);
			}
		}*/
		
		if (logfile[logCursor - 1].type == "down")
		{
			$scope.rollUp(logCursor - 1, true);
		}
		else
		{
			$scope.selectNode(logfile[logCursor - 1].id, logCursor - 1, logfile[logCursor - 1].type, true);
			if (logfile[logCursor].type == "up")
			{
				sig.graph.nodes().forEach(function(n) {
					if (n.id == logfile[logCursor].id)
					{
						levelStack.push(n);
						levelCursor++;
					}
				});
				$scope.drillDown();
			}
		}
	}
	
	/** Function to display the next node in the logfile **/
	$scope.nextNode = function()
	{
		$scope.selectNode(logfile[logCursor + 1].id, logCursor + 1, logfile[logCursor + 1].type, true);
	}
	
	/** Function to go to the first node of the logfile **/
	$scope.goToFirst = function()
	{
		$scope.selectNode(logfile[0].id, 0, logfile[0].type, true);
	}
	
	/** Function to go to the last node of the logfile **/
	$scope.goToLast = function()
	{		
		$scope.selectNode(logfile[logfile.length - 1].id, logfile.length - 1, logfile[logfile.length - 1].type, true);
	}
	
	/** Function to reselect the last selected node **/
	$scope.backToLastSelected = function()
	{		
		/* Selecting the node */
		$scope.selectNode(logfile[lastSelected].id, lastSelected, logfile[lastSelected].type, true);
		lastSelected = -1;
	}
	
	/** Function to change the current displayed tab **/
	$scope.changeTab = function(newTab)
	{
		/* Changing the style of the tabs */
		document.getElementById(currentTab).className = "tab nonSelectedTab";
		document.getElementById(newTab).className = "tab selectedTab";
		
		/* Erasing the content of the current tab */
		document.getElementById(currentTab + "Content").className = "tabContent nonSelectedContent";
		
		/* Displaying the content of the new tab */
		document.getElementById(newTab + "Content").className = "tabContent selectedContent";
		currentTab = newTab;
	}
	
	/** Function to pre-treat before going a level down in the graph **/
	$scope.drillDown = function()
	{		
							
		/* Getting the level to load */
		var node = levelStack[levelCursor];					
		
		/* Animating the camera */
		sigma.misc.animation.camera(
			sig.camera, 
			{
				x: node[sig.camera.readPrefix + 'x'], 
				y: node[sig.camera.readPrefix + 'y'],
				ratio: 0.0005
			}, 
			{duration: animDuration}
		);
		
		/* Going down a level */
		setTimeout(function(){ $scope.goLevelDown() }, animDuration + 10);
	}
	
	/** Function to go down a level **/
	$scope.goLevelDown = function()
	{
		/* Update the breadcrumb */					
		$scope.updateBreadCrumb();
							
		/* Resetting the displaying */
		sig.graph.clear();		
		
		/* Loading the graph */
		sig.graph.read(levelStack[levelCursor].children);	

		// Display the graph
		$scope.display();	

		
		/* Enabling the rollUp button if necessary */
		document.getElementById("rollUp").disabled = false;
		
		/* Refreshing the displaying */
		sig.refresh();

	}
	
	/** Function to dezoom before going a level up in the graph **/
	$scope.rollUp = function(logPosition, previousOrNext)
	{	
		/* Preparing the log position */
		if (logPosition == -1)
		{
			logPosition = logCursor + 1
		}
		
		/* Animating the camera */
		sigma.misc.animation.camera(
			sig.camera, 
			{
				x: 0, 
				y: 0,
				ratio: 150
			}, 
			{duration: animDuration}
		);
		
		/* Erasing the graph and preparing the zoom */
		setTimeout(function(){ sig.graph.clear(); sig.refresh(); $scope.rezoom(logPosition, previousOrNext); }, animDuration);
	}
	
	/** Function to prepare the zoom on a node **/
	$scope.rezoom = function(logPosition, previousOrNext)
	{
		/* Getting the node to select and the level to load */
		var nodeId = levelStack[levelCursor].id;
		levelStack.pop();
		levelCursor--;
		var node = levelStack[levelCursor];
		
		/* Animating the camera while no graph is displayed */
		sigma.misc.animation.camera(
			sig.camera, 
			{
				x: node[sig.camera.readPrefix + 'x'], 
				y: node[sig.camera.readPrefix + 'y'],
				ratio: 0.0005
			}, 
			{duration: 1}
		);
		
		/* Going down a level */
		setTimeout(function(){ $scope.goLevelUp(nodeId, logPosition, previousOrNext) }, 1);
	}
	
	/** Function to go up a level **/
	$scope.goLevelUp = function(nodeId, logPosition, previousOrNext)
	{	

		/* Update the breadcrumb */					
		$scope.updateBreadCrumb();	

		/* Resetting the displaying */
		sig.graph.clear();

		/* Load graph to be displayed */
		if (levelCursor == 0)
		{
			// Loading initial graph
			sig.graph.read(currentGraph);
			document.getElementById("rollUp").disabled = true;		
		}
		else
		{
			// Loading the sub-graph
			sig.graph.read(levelStack[levelCursor].children);	
		}

		// Display the graph
		$scope.display();
		
		/* Disabling the rollUp button if the new level is the first */
		if (levelCursor == 0)
			
		
		/* Selecting the roll-up node */
		$scope.selectNode(nodeId, logPosition, "up", previousOrNext);
	}


	/*****************************************************************************************
	// BREADCRUMB
	/*****************************************************************************************

	/* This handler can be move in the breadcrumb module 
	   provided that you manage to pass current graph and levelStack */

	/*The DisplayOverlay event is sent by the zoneClickHandler of the breadcrum module */
	BC.c.overlay.addEventListener('DisplayOverlay', function(e){
		e.stopPropagation();
		
	 	var ctx = this.getContext("2d");
	 	//The breadcrumb level (e.detail) is equal to the level of the graph +1
	 	var level = e.detail - 1;
	 	var repres;
	 	/*console.log(BC);*/

	 	//Replacing last Treemaps only if the level has changed
	 	if (level != this.lastLevel){
	 		this.getParent().resetBC();
	 		this.curIndex = 0;


		 	if (level == 0){
		 		//The currentGraph object contain actually the level 0 graph
		 		repres = RepresentativeService.getRepres(currentGraph.nodes, BC.nb_children_overlay);
		 	}
		 	else{
		 		repres = RepresentativeService.getRepres(levelStack[level].children.nodes, BC.nb_children_overlay);
		 	}

		 	// Assign representatives urls
			for (i in repres)
				for (j in repres[i])
					repres[i][j] = dateMap[repres[i][j].substring(0,10)].url;

		 	//Erasing previous Treemaps
		 	ctx.clearRect(0,0,BC.c.overlay.width, BC.c.overlay.height);
		 	
		 	for (i in repres){
		 		/*console.log("Adding level "+ i);*/
		 		this.getParent().addLevel(repres[i],"", i);
		 	}
		}

		this.style.visibility = 'visible';
		//Recording level for not drawing the same Treemaps 
		this.lastLevel = e.detail - 1;
		/*console.log("visible");*/
	}, false)


	//This function update the breadrumb according to the current level of the graph
	$scope.updateBreadCrumb =  function()
	{	
		//Image name array
		var imageId;
		//Super-Node id of the level added in the breadcrumb
		var nodeId;
		// Image Url array 
		var imageUrl = [];

		//Getting image url array according to the current level

		//Root level, building only the first time (never erased because we can't go higher)
		if (levelCursor === 0){
			//console.log("Level Cursor 0");
			//console.log(currentGraph);
			//Root level treemap might not have been drawed yet
			if (BC.c.curIndex == 0){
				imageId = RepresentativeService.getRootRepres(BC.nb_image_per_treemap, currentGraph);
				nodeId = "n0";
			}
		}
		//Not on the root level
		else{
			//console.log("Level Cursor " + levelCursor);
			//console.log(levelStack[levelCursor]);
			imageId = levelStack[levelCursor].near_representatives.split(',');
			nodeId = levelStack[levelCursor].id;
		}


		if (levelCursor >= BC.c.curIndex){
			// Assign representatives images
			for (var i = 0; i< imageId.length; i++)
				imageUrl.push(dateMap[imageId[i].substring(0,10)].url);

			//The current node, has children who does not have children. Arrow are not needed
			if (levelCursor !== 0 && levelStack[levelCursor].children.nodes[0].children === undefined){
				//No more arrow, max depth
				BC.addLevel(imageUrl, "", nodeId, 1);
			}
			else{
				BC.addLevel(imageUrl, "", nodeId);
			}
		}
		else{
			BC.removeLevel(levelCursor);
		}

	}


	
}]);


/** Service to share the sigma instance between apodModule and graphModule **/
/*
graphModule.service('ClientSigmaService', function(SigmaService) {
    this.getSigmaInst = function() {
        return SigmaService.getSigmaInst();
    };
});
*/
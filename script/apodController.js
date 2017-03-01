/*** Object representing the application itself ***/
var apodModule = angular.module('apodApp', ['importer','neighbourhood']);

/*** Controller managing the graph ***/
apodModule.controller('apodController', ['$scope','ImporterService','NeighbourhoodService', function($scope, ImporterService,NeighbourhoodService) {	

	/** URL **/
	var dataURL = "./data/nasa_apod.json";
	var graphURL = "./data/NASA_APOD_resized_CLD_RNG_sigmajs_2.gexf";

	/** Graph variables **/
	var today = "";
	var current_day = "";
	var neighbours = [];

	/** Data variables **/
	var jsonData = "";
	var dateMap = {};

	/* Current selected tab */
	var nbReco = 5;
	var currentTab = "recoTab";

	/** Sigma.js instance **/
	var sig = new sigma({
		graph: {nodes: [], edges: []}
	});


	/** Main **/
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
    	if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {

    		// Converting the graph from GEXF to JSON
			var content = ImporterService.GEXFtoJSON(xmlhttp.responseText);
			// Read JSON
        	var graph = JSON.parse(content);

        	// Read as sigma graph
			sig.graph.read(graph);

			// Notification
			console.log("Found " + sig.graph.nodes().length + " nodes in the graph.")

			// Assign today ID
			today = sig.graph.nodes().length - 1 ;

			// Assign today link
			document.getElementById("today_link").addEventListener('click', function() { $scope.SelectNode(today); } , false);

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

				// Update images
				$scope.SelectNode(today);
	    	}
		};
		xmlhttp.open("GET", dataURL, true);
		xmlhttp.send();

	}


	/** Function that update the interface current image  **/
	$scope.SelectNode = function(day)
	{
		// Assign current day ID
		current_day = day;

		// Get current day node in the graph
		selectedNode = sig.graph.nodes(current_day);

		// Get curent date aaaa-mm-dd date of the current day
		var date = selectedNode.label;

		// Get current day event in the data
		var entry = dateMap[date];

		// Update current day informations
		document.getElementById("todayImage").src = entry.url;
		document.getElementById("todayImageLink").href = entry.url;
		document.getElementById("todayCredits").innerHTML = entry.credit;
		document.getElementById("todayDate").innerHTML = entry.date;
		document.getElementById("todayTitle").innerHTML = entry.title;
		document.getElementById("todayExplanation").innerHTML = "<b> Explanation: </b>" + entry.text;

		$scope.UpdateRecommendations();
	}


	/** Function that update the recommendations  **/
	$scope.UpdateRecommendations = function()
	{
		// Clear list of neighbours
		document.getElementById("recoTabContent").innerHTML = "";

		// Get current node neighbours. They will be set as recommendations
		neighbours = NeighbourhoodService.getNeighbours(sig, current_day);

		// Create recommendations
		for (i = 0 ; i < neighbours.length ; i++)
		{
			// Get current neighbour
			var neighbour = neighbours[i];

			// Get curent date aaaa-mm-dd date of the current day
			var date = neighbour.label;

			// Get current neighbour event in the data
			var entry = dateMap[date];

			var newNeighbour = "<div class=\"recommandation\">";
			newNeighbour += "<a href=\"#\">";
			newNeighbour += "<img class=\"recommandationImage\" title=\"" + entry.title + "\" src=\"" + entry.url + "\" onclick=\"angular.element(this).scope().SelectNode(&quot;" + neighbour.id + "&quot;)\"/>";
			newNeighbour += "</a>";
			newNeighbour += "<h3 class=\"recommandationDate\">" + entry.date + "</h3>"; 
			newNeighbour += "<p class=\"recommandationTitle\">" + entry.title + "</p>"; 
			newNeighbour += "</div>";		
			document.getElementById("recoTabContent").innerHTML += newNeighbour;
		}
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

	/** Functio  that open the help page in a new tab **/
	$scope.help = function()
	{
		window.open("./help.html","_blank");
	}


	/** Function to fade out the splash screen **/
	$scope.splashscreenOnClick = function()
	{
		// Assign splash screen click behaviour
		var splashscreen = document.getElementById("splashscreen");
		$scope.fadeOut(splashscreen);
	}

	/** Function to fade out an element **/
	// http://www.chrisbuttery.com/articles/fade-in-fade-out-with-javascript/
	$scope.fadeOut = function (el)
	{
	  el.style.opacity = 1;

	  (function fade() {
	    if ((el.style.opacity -= .02) < 0) {
	      el.style.display = "none";
	    } else {
	      requestAnimationFrame(fade);
	    }
	  })();
	}
	
	
}]);



/** Service to share the sigma instance between apodModule and graphModule **/
/*
apodModule.service('SigmaService', function() {
    this.getSigmaInst = function() {
        return this.sig;
    };
});
*/
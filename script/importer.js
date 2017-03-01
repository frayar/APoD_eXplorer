/*** Object representing the importer module itself ***/
var importer = angular.module('importer', []);

/*** Service converting the input file to JSON ***/
importer.factory('ImporterService', function() {
	return {
		/** Function converting from GEXF to JSON in 4 steps :
		 ** - 1 : getting the XML object
		 ** - 2 : getting the nodes and edges arrays of the graph
		 ** - 3 : getting the informations from the nodes
		 ** - 4 : getting the informations from the edges
		 **/
		GEXFtoJSON: function(content)
		{
			var XMLobject;
			
			/* 1st step : getting the XML object */
			// For any browser
			if (window.DOMParser)
			{
				var parser = new DOMParser();
				XMLobject = parser.parseFromString(content, "text/xml");
			}
			// For Internet Explorer
			else
			{
				XMLobject = new ActiveXObject("Microsoft.XMLDOM");
				XMLobject.async = false;
				XMLobject.loadXML(content);
			}
			
			/* 2nd step : getting the nodes and edges arrays of the graph */
			// Getting the graph
			var XMLnodes = XMLobject.childNodes[0].childNodes;
			var indexOfGraph = 0;
			while ((indexOfGraph < XMLnodes.length) && (XMLnodes[indexOfGraph].nodeName != "graph"))
			{						
				indexOfGraph++;
			}
			var graphNodes = XMLnodes[indexOfGraph].childNodes;
			
			// Getting the arrays of nodes and edges
			var indexOfNodes = 0;
			while ((indexOfNodes < graphNodes.length) && (graphNodes[indexOfNodes].nodeName != "nodes"))
			{						
				indexOfNodes++;
			}
			var indexOfEdges = 0;
			while ((indexOfEdges < graphNodes.length) && (graphNodes[indexOfEdges].nodeName != "edges"))
			{						
				indexOfEdges++;
			}
			var nodes = graphNodes[indexOfNodes].childNodes;
			var edges = graphNodes[indexOfEdges].childNodes;
			
			/* 3rd step : getting the informations from the nodes */
			content = "{\n\t\"nodes\": [";
			for (i = 0 ; i < nodes.length ; i++)
			{
				if (nodes[i].nodeName == "node")
				{
					var attributes = nodes[i].attributes;
					var data = nodes[i].childNodes;
					
					// Getting the id of the node
					content += "\n\t\t{\n";
					content += "\t\t\t\"id\": \"" + attributes.getNamedItem("id").value + "\",\n";
					
					// Getting the label of the node
					var label;
					if (attributes.getNamedItem("label"))
					{
						label = attributes.getNamedItem("label").value;
					}
					else
					{
						label = attributes.getNamedItem("id").value;
					}
					content += "\t\t\t\"label\": \"" + label + "\",\n";
					
					// Getting the size, the position and the colour of the node
					for (j = 0 ; j < data.length ; j++)
					{
						if (data[j].nodeName == "viz:size")
						{
							content += "\t\t\t\"size\": " + data[j].attributes.getNamedItem("value").value + ",\n";
						}
						if (data[j].nodeName == "viz:position")
						{
							content += "\t\t\t\"x\": " + data[j].attributes.getNamedItem("x").value + ",\n";
							content += "\t\t\t\"y\": " + data[j].attributes.getNamedItem("y").value;
						}
						if (data[j].nodeName == "viz:color")
						{
							content += ",\n";
							
							//// Converting the colour from RGB to hexadecimal
							var rhex, ghex, bhex, colorhex;
							rhex = (parseInt(data[j].attributes.getNamedItem("r").value)).toString(16);
							ghex = (parseInt(data[j].attributes.getNamedItem("g").value)).toString(16);
							bhex = (parseInt(data[j].attributes.getNamedItem("b").value)).toString(16);
							
							if (rhex.length < 2)
							{
								rhex = "0" + rhex;
							}
							if (ghex.length < 2)
							{
								ghex = "0" + ghex;
							}
							if (bhex.length < 2)
							{
								bhex = "0" + bhex;
							}
							
							colorhex = "#" + rhex + ghex + bhex;
							content += "\t\t\t\"color\": \"" + colorhex + "\"";
						}
						if (data[j].nodeName == "representative")
						{
							content += ",\n\t\t\t\"representative\": \"" + data[j].attributes.getNamedItem("src").value + "\"";
						}
					}
					content += "\n\t\t},";
				}
			}
			content = content.substring(0, content.length - 1);
			
			/* 4th step : getting the informations from the edges */
			content += "\n\t],\n\t\"edges\": [";
			var nbEdges = 0;
			for (i = 0 ; i < edges.length ; i++)
			{
				if (edges[i].nodeName == "edge")
				{
					var attributes = edges[i].attributes;
					
					content += "\n\t\t{\n";
					content += "\t\t\t\"id\": \"e" + nbEdges + "\",\n";
					content += "\t\t\t\"source\": \"" + attributes.getNamedItem("source").value + "\",\n";
					content += "\t\t\t\"target\": \"" + attributes.getNamedItem("target").value + "\",\n";
					content += "\t\t\t\"weight\": \"" + attributes.getNamedItem("weight").value + "\"\n";
					
					content += "\n\t\t},";
					
					nbEdges++;
				}
			}
			content = content.substring(0, content.length - 1);
			
			/* Finalizing the JSON string */
			content += "\n\t]\n}";
			return content;
		}
	};
});
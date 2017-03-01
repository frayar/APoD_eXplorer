/*** Object representing the neighbourhood module itself ***/
var neighbourhood = angular.module('neighbourhood', []);

/*** Service managing the neighbours of nodes ***/
neighbourhood.factory('NeighbourhoodService', function() {
	return {
		/** Function to get the neighbours of a node **/
		getNeighbours: function(sig, nodeId)
		{
			var	neighboursId = [];
			var	weights = [];
			var neighbours = [];
			
			/* Getting the id of the neighbours of the node */
			sig.graph.edges().forEach(function(e) {
				var node;
				// A node is a neighbour if it is the source or the target of an edge connected to the current node
				if (e.source == nodeId)
				{
					node = e.target;
				}
				else if (e.target == nodeId)
				{
					node = e.source;
				}
				
				if ((node !== undefined) && (node != nodeId) && (neighboursId.indexOf(node) == -1))
				{
					neighboursId.push(node);
					weights.push(e.weight);
				}
			});
			
			/* Getting the neighbours */
			sig.graph.nodes().forEach(function(n) {
				var idx = neighboursId.indexOf(n.id);
				if ( idx != -1)
				{
					n.weight = weights[idx];
					neighbours.push(n);
										
				}
			});
			
			// DAS2016 - Debug - Display array elements
			/*
			function logArrayElements(element, index, array) {
				console.log("rel[" + index + "] = " + element.id);
			}
			neighbours.forEach(logArrayElements);
			*/

			// DAS2016
			neighbours.sort( 
				function compare(n1, n2) {
				  if (n1.weight < n2.weight) // n1 < n2 
					 return -1;
				  if (n1.weight > n2.weight) // n1 > n2
					 return 1;
				  // n1 = n2
				  return 0;
				}
			);
			
			return neighbours;
		},
		
		/** Function to highlight the neighbour nodes and edges of a node **/
		highlightNeighbours: function(sig, nodeId, neighbours)
		{
			/* Resetting the colours of edges if a previous node was selected */
			if (document.getElementById("date").innerHTML != "")
			{
				sig.graph.edges().forEach(function(e) {
					e.color = e.originalColor;
				});
			}

			/* Blanking the non-neighbour edges */
			sig.graph.edges().forEach(function(e) {
				if ((e.source != nodeId) && (e.target != nodeId))
				{
					e.color = "#eeeeee";
				}
			});

			// Set an halo on the neighbours
			sig.renderers[0].halo({
	    		nodes: neighbours,
	  		});

			
			/* Refreshing the displaying */
			sig.refresh();
		}
	};
});
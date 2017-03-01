/*** Object representing the breadcrumb_module module itself ***/
var representative_module = angular.module('representative_module', []);

/*** Service managing the neighbours of nodes ***/
representative_module.factory('RepresentativeService', function() {
	return {

		/* Function giving a 2D nodes-representatives array used for the overlaying breadcrumb */
		/* For each node in the array are given its most representatives images*/
		getRepres: function(nodes, overlay_length){
			//The number of children for every node
			var children_number = [];
			//The mosts representatives nodes indexs
			var rep = {};

			var i, j, max, maxIndex, sum = 0;

			//Iterating on nodes, getting their number of children
			for (i = 0 ; i < nodes.length ; i++)
				children_number[i] = (nodes[i].children)? nodes[i].nb_images : 0;
				//children_number[i] = (nodes[i].children)? nodes[i].children.nodes.length : 0;

			//Taking "overlay_length" max through children number array
			j = 0;
			while(j < Math.min(overlay_length, nodes.length) ){
				//Reinitilizing for each max search
				max = children_number[0];
				maxIndex = 0;
				//Searching a max number of children
				for (i = 1 ; i < children_number.length ; i++){
					if (children_number[i] > max){
						max = children_number[i];
						maxIndex = i;
					}
				}
				//Saving our max index
				rep[nodes[maxIndex].id] = nodes[maxIndex].near_representatives.split(",");
				//Searching for multiple max
				children_number[maxIndex] = 0;
				j++;
			}
/*			debug = "";
			for (i in rep){
				debug += i + " : " + rep[i] + "\n";
			}
			console.log(debug);*/

			return rep;
		},


		/** Function to get the level zero most representative image for the breadcrumb and treemap **/
		/** K the number of representatives wanted **/
		getRootRepres: function (K, rootGraph){
			// The number of representative k to take from the node i
			var k = [];
			//The score for the number of representative to take from the node i
			var score = [];
			//The number of representative taken so far
			var sum_k = 0;
			//The representative name array
			var rep = [];
			//Number of node of the root level
			var N_0 = rootGraph.nodes.length;
			//Number of representative nodes for each node in the root level
			var N = [];
			//The total number of representatives contained by each nodes of the root level
			var sum_N = 0;
			var i, j, splitted_rep, max, maxIndex;

			for (i = 0 ; i < N_0 ; i++){
				N[i] = rootGraph.nodes[i].children.nodes.length;
				sum_N += N[i];
			}


			//We have more representative to take than nodes in the root level
			//We take at least 1 representative from each node
			if (N_0 < K){
				for (i = 0 ; i < N_0 ; i++){
					k[i] = Math.max(Math.round( K * (N[i]/sum_N) ), 1);
					sum_k += k[i];
				}
			}
			//More node in the root level than representative to take
			//We use a score array and take the max from it
			else{

				//Calculating the score for each nodes
				for (i = 0 ; i < N_0 ; i++){
					score[i] = K * (N[i]/sum_N);
				}
				//Getting max score index and taking representative from it
				while(sum_k < K){

					//Simple max and maxIndex searching through score array
					max = score[0];
					maxIndex = 0;
					for (i = 1; i < N_0 ; i++){
						if (score[i] > max){
							maxIndex = i;
							max = score[i];
						}
					}
					// We register the number of representative we will take from the maxIndex node
					k[maxIndex] = Math.max(Math.round(score[maxIndex]),1);
					//Updating representative sum
					sum_k += k[maxIndex];
					//To search the next max, this node will not be chosen again
					score[maxIndex] = 0;
				}
			}

			j = 0;
			//k[index] is the number of representative to take from node n# index
			for (index in k){
				splitted_rep = rootGraph.nodes[index].near_representatives.split(",");

				//On prend les j premiers représentant
				for (i = 0 ; i < k[index] && j < K ; i++){
					rep[j] = splitted_rep[i];
					j++;
				}
			}

			return rep;
		},


	};
});
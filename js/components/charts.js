const Charts = {};

let tmp;

(() => {

	Charts.buildCostPartitionChart = (selector, data) => {

		// Define some colors
		const colors = ['rgba(0,0,255,0.6)', 'rgba(255,0,0,0.6)', 'rgba(0,126,0,0.6)'];
		//const colors = []

		// Chart setup

		const width = 850, height = 350;
		const margin = {top: 80, right: 0, bottom: 100, left: 0};

		const chartContainer = d3.select(selector)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);
		const chart = chartContainer.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);

		// Find the total cost associated with each cost type / expense category / indicator

		const uniqIndicators = _.unique(_.pluck(data, 'indicator'));
		const uniqTypes = _.unique(_.pluck(data, 'type'));
		const uniqCategories = _.unique(_.pluck(data, 'category'));

		let indicators = [], types = [], categories = [];
		uniqIndicators.forEach((ind, i) => { 
			indicators.push({ name:ind, i:i, total:_.reduce(_.pluck(_.filter(data, d => d.indicator == ind) , 'cost'), (q,r) => (+q)+(+r)) }); 
		});
		uniqTypes.forEach((typ, j) => { 
			types.push({ name:typ, j:j, total:_.reduce(_.pluck(_.filter(data, d => d.type == typ) , 'cost'), (q,r) => (+q)+(+r)), color:colors[j] }); 
		});
		uniqCategories.forEach((cat, k) => { 
			categories.push({ name:cat, k:k, total:_.reduce(_.pluck(_.filter(data, d => d.category == cat) , 'cost'), (q,r) => (+q)+(+r)) }); 
		});

		// Plot the paths between each node

		// Determine Type <--> Indicator paths

		pathsTypInd = [];
		types.forEach((typ) => {
			indicators.forEach((ind) => {
				cost = Math.round(_.reduce(_.pluck(_.filter(data, d => d.type == typ.name && d.indicator == ind.name), 'cost'), (q,r) => (+q)+(+r)));
				if (cost != 0) {
					pathsTypInd.push({i:ind.i, j:typ.j, cost:cost});
				}
			});
		});

		// Determine Indicator <--> Category paths

		pathsIndCat = [];
		types.forEach((typ) => {
			indicators.forEach((ind, j) => {
				categories.forEach((cat, k) => {
					cost = Math.round(_.reduce(_.pluck(_.filter(data, d => d.type == typ.name && d.indicator == ind.name && d.category == cat.name), 'cost'), (q,r) => (+q)+(+r)));
					if (cost != 0) {
						pathsIndCat.push({i:ind.i, k:cat.k, cost:cost});
					}
				});
			});
		});

		const minStrokeWidth = 0.1;
		const maxStrokeWidth = 3;
		const minCost = _.min(_.pluck(pathsTypInd.concat(pathsIndCat), 'cost'));
		const maxCost = _.max(_.pluck(pathsTypInd.concat(pathsIndCat), 'cost'));
		const calcStrokeWidth = (cost) => {
			return ((cost-minCost)/(maxCost-minCost)*(maxStrokeWidth-minStrokeWidth))+minStrokeWidth;
		};

		// Plot Type <--> Indicator paths

		pathsTypInd.forEach((path) => {
			const xtyp = (path.j+1)/(types.length+1)*width;
			const ytyp = 0;
			const xind = (path.i+1)/(indicators.length+1)*width;
			const yind = height/2;

			path['handle'] = chart.append('path')
				.attr('class', 'path')
				.attr('stroke-width', calcStrokeWidth(path.cost))
				.attr('d', `M ${xtyp} ${ytyp} C ${xtyp} ${(yind+ytyp)/2}, ${xind} ${(yind+ytyp)/2}, ${xind} ${yind}`);
		});

		// Plot Indicator <--> Category paths

		pathsIndCat.forEach((path) => {
			const xcat = (path.k+1)/(categories.length+1)*width;
			const ycat = height;
			const xind = (path.i+1)/(indicators.length+1)*width;
			const yind = height/2;

			path['handle'] = chart.append('path')
				.attr('class', 'path')
				.attr('stroke-width', calcStrokeWidth(path.cost))
				.attr('d', `M ${xcat} ${ycat} C ${xcat} ${(yind+ycat)/2}, ${xind} ${(yind+ycat)/2}, ${xind} ${yind}`);
		});

		// Plot the nodes corresponding to type / expense category / indicator
		// Area is proportional to the total cost

		const minRadius = 5;
		const maxRadius = 30;
		const minArea = Math.PI * (minRadius**2);
		const maxArea = Math.PI * (maxRadius**2);
		const minTotal = _.min(_.pluck(indicators.concat(types).concat(categories), 'total'));
		const maxTotal = _.max(_.pluck(indicators.concat(types).concat(categories), 'total'));
		const calcRadius = (total) => {
			const area = ((total-minTotal)/(maxTotal-minTotal)*(maxArea-minArea))+minArea;
			return (area/Math.PI)**0.5;
		};

		/*types.forEach((typ) => {
			typ['handle'] = chart.append('circle')
				.attr('class', 'node')
				.style('stroke', colors[typ.j])
				.attr('r', calcRadius(typ.total))
				.attr('cx', (typ.j+1)/(types.length+1)*width)
				.attr('cy', 0);
		});*/

		chart.selectAll('.type-node')
			.data(types)
			.enter().append('circle')
				.attr('class', 'node type-node')
				.attr('fill', '#fff')
				.attr('stroke', typ => colors[typ.j])
				.attr('r', typ => calcRadius(typ.total))
				.attr('cx', typ => (typ.j+1)/(types.length+1)*width)
				.attr('cy', 0);

		indicators.forEach((ind) => {
			ind['handle'] = chart.append('circle')
				.attr('class', 'node')
				.attr('fill', '#fff')
				.attr('stroke', 'black')
				.attr('r', calcRadius(ind.total))
				.attr('cx', (ind.i+1)/(indicators.length+1)*width)
				.attr('cy', height/2);
		});
		categories.forEach((cat) => {
			cat['handle'] = chart.append('circle')
				.attr('class', 'node')
				.attr('fill', '#fff')
				.attr('stroke', 'black')
				.attr('r', calcRadius(cat.total))
				.attr('cx', (cat.k+1)/(categories.length+1)*width)
				.attr('cy', height);
		});

		// Add labels to the nodes

		const textPadding = 12.5;

		// Should do this in a more d3 way
		types.forEach((typ) => {
			chart.append('text')
				.attr('class', 'label-text')
				.attr('alignment-baseline', 'baseline')
				.attr('text-anchor', 'middle')
				.attr('fill', colors[typ.j])
				.attr('x', (typ.j+1)/(types.length+1)*width)
				.attr('y', 0 - calcRadius(typ.total) - textPadding)
				.text(typ.name);
		});

		// Have to do categories manually due to the lack of word wrap in SVG
		categories.forEach((cat) => {
			chart.append('text')
				.attr('class', 'label-text')
				.attr('alignment-baseline', 'hanging')
				.attr('text-anchor', 'middle')
				.attr('x', cat.handle.attr('cx'))
				.attr('y', (+cat.handle.attr('cy')) + (+cat.handle.attr('r')) + textPadding)
				.text(cat.name);
		});


		// Add the hover functionality

		d3.selectAll('.type-node').on('mouseover', function (typ) {
			d3.select(this).attr('fill', typ.color);
		});

		/* Vector containing number of nodes in each row top --> bottom
		const nodes = [1, 3, 42, 6];
		const nodeSizes = [6, 6, 6, 6];

		y = (i) => {
			return (i/(nodes.length-1))*height;
		};

		x = (i, j) => {
			return ((j+1)/(nodes[i]+1))*width;
		};

		createLink = (i1, j1, i2, j2) => {
			return `M ${x(i2,j2)} ${y(i2)} C ${x(i2,j2)} ${(y(i1)+y(i2))/2}, ${x(i1,j1)} ${(y(i1)+y(i2))/2}, ${x(i1,j1)} ${y(i1)}`;
		}

		chart.append('path')
			.attr('class', 'node-link')
			.attr('d', createLink(1,0,0,0));

		for(let i = 0; i < nodes.length; i++) {
			for(let j = 0; j < nodes[i]; j++) {

				chart.append('circle')
					.attr('class', 'node')
					.attr('r', nodeSizes[i])
					.attr('cx', x(i,j))
					.attr('cy', y(i));

			}
		}*/

	};

	// Adapted from https://bl.ocks.org/d3noob/43a860bc0024792f8803bba8ca0d5ecd
	Charts.buildCostPartitionChart2 = (selector, treeData) => {

		// Chart setup
		const width = 800, height = 500;
		//const margin = {top: 20, right: 100, bottom: 20, left: 100};
		const margin = {top: 0, right: 0, bottom: 40, left: 0};

		const chartContainer = d3.select(selector)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);
		const svg = chartContainer.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);

		// i variable allows each node to be uniquely identified so that enter() and exit() return the correct selections
		let i = 0, duration = 750;

		// declares a tree layout and assigns the size
		//const treemap = d3.tree().size([height, width]);

		// Assigns parent, children, height, depth
		let root = d3.hierarchy(treeData, function(d) { return d.children; });
		root.x0 = height / 2;
		root.y0 = 0;

		// Collapse after the second level
		root.children.forEach(collapse);

		update(root);

		// Collapse the node and all it's children
		// This isn't used in the update function (collapsing only collapses the clicked node, not all it's children)
		function collapse(d) {
		  if(d.children) {
		    d._children = d.children
		    d._children.forEach(collapse)
		    d.children = null
		  }
		}

		function update(source) {

		  // Assigns the x and y position for the nodes
		  //const treeData = treemap(root);
		  //treeData = treemap(root);

		  // Compute the new tree layout.
		  const nodes = root.descendants(),
		      links = root.descendants().slice(1);

		  // Start custom node positioning

		  const depths = _.pluck(nodes, 'depth');
		  const nCols = root.height+1;
		  let nRows = (new Array(nCols)).fill(0);
		  depths.forEach((d) => nRows[d]++);

		  // The x and y declarations are the opposite of what I would have expected
		  let indices = (new Array(nCols)).fill(0);
		  nodes.forEach((d) => {
		  		// Dynamic spacing
		  		//d.y = ((d.depth+1) / (nCols+1)) * width;

		  		// Manual spacing
		  		if (d.depth == 0) {
		  			d.y = 100;
		  		} else if (d.depth == 1) {
		  			d.y = 200;
		  		} else if (d.depth == 2) {
		  			d.y = 550;
		  		} else if (d.depth == 3) {
		  			d.y = 700;
		  		} else {
		  			console.log('Error: positioning not specified past depth of 3')
		  		}


		  		d.x = ((++indices[d.depth]) / (nRows[d.depth]+1)) * height;
		  });

		  // End custom node positioning

		  // Normalize for fixed-depth.
		  //nodes.forEach(function(d){ d.y = d.depth * 180});
		  // (no longer necessary with custom x and y position assignments)

		  // ****************** Nodes section ***************************

		  // Update the nodes...
		  var node = svg.selectAll('g.node')
		      .data(nodes, function(d) {return d.id || (d.id = ++i); });


		  // Enter any new modes at the parent's previous position.
		  var nodeEnter = node.enter().append('g')
		      .attr('class', 'node')
		      .attr("transform", function(d) {
		        return "translate(" + source.y0 + "," + source.x0 + ")";
		    })
		    .on('click', click);

		  // Add Circle for the nodes
		  nodeEnter.append('circle')
		      .attr('class', 'node')
		      .attr('r', 1e-6)
		      .style("fill", function(d) {
		          return d._children ? "lightsteelblue" : "#fff";
		      })
		      .each(function(d) {
		      		const contentStr = '' +
		      			`<b>Cost:</b> \$${Math.round(d.data.cost).toLocaleString('currency')}`;
		      		$(this).tooltipster({content: contentStr});
		      });

		  // Add labels for the nodes
		  nodeEnter.append('text')
		      .attr("dy", function(d) {
		      	  if (d.depth == 2) {
		      	  		return '2.3em';
		      	  } else {
		      	  		return '.35em';
		      	  }
		      })
		      .attr("x", function(d) {
		      	  if (d.depth == 2) {
		      	  		return 0;
		      	  } else {
		          		return !d.parent ? -18 : 18;
		          }
		      })
		      .attr("text-anchor", function(d) {
		      		if (d.depth == 2) {
		      			return 'middle';
		      		} else {
		          		return !d.parent ? "end" : "start";
		          	}
		      })
		      .text(function(d) { return d.data.name; });

		  // UPDATE
		  var nodeUpdate = nodeEnter.merge(node);

		  nodeUpdate.selectAll('text')
		  	.style('font-weight', function(d) {
		  		return d.children ? 'bold' : '';
		  	});

		  // Transition to the proper position for the node
		  nodeUpdate.transition()
		    .duration(duration)
		    .attr("transform", function(d) { 
		        return "translate(" + d.y + "," + d.x + ")";
		     });

		  // Update the node attributes and style
		  nodeUpdate.select('circle.node')
		    .attr('r', 10)
		    .style("fill", function(d) {
		        return d._children ? "lightsteelblue" : "#fff";
		    })
		    .attr('cursor', 'pointer');


		  // Remove any exiting nodes
		  const nodeExit = node.exit().transition()
		      .duration(duration)
		      .attr("transform", function(d) {
		          //return "translate(" + source.y + "," + source.x + ")";
		          //return 'translate(' + d.parent.y + ',' + d.parent.x + ')';

		          if(!source.parent) {
		          	  return "translate(" + source.y + "," + source.x + ")";
		          } else {
			          s = d.parent;
			          while(s.parent && !source.parent.children.includes(s)) {
			          	s = s.parent;
			          }
			          return 'translate(' + s.y + ',' + s.x + ')';
			      }
		      })
		      .remove();

		  // On exit reduce the node circles size to 0
		  nodeExit.select('circle')
		    .attr('r', 1e-6);

		  // On exit reduce the opacity of text labels
		  nodeExit.select('text')
		    .style('fill-opacity', 1e-6);

		  // ****************** links section ***************************

		  // Update the links...
		  var link = svg.selectAll('path.link')
		      .data(links, function(d) { return d.id; });

		  // Enter any new links at the parent's previous position.
		  var linkEnter = link.enter().insert('path', "g")
		      .attr("class", "link")
		      .attr('d', function(d){
		        var o = {x: source.x0, y: source.y0}
		        return diagonal(o, o)
		      });

		  // UPDATE
		  var linkUpdate = linkEnter.merge(link);

		  // Transition back to the parent element position
		  linkUpdate.transition()
		      .duration(duration)
		      .attr('d', function(d){ return diagonal(d, d.parent) });

		  // Remove any exiting links
		  var linkExit = link.exit().transition()
		      .duration(duration)
		      .attr('d', function(d) {
		        //var o = {x: d.parent.x, y: d.parent.y}
		        //var o = {x: source.x, y: source.y}

		        let o;
		        if(!source.parent) {
		          	o = {x: source.x, y: source.y};
		        } else {
			    	s = d.parent;
			        while(s.parent && !source.parent.children.includes(s)) {
			          	s = s.parent;
			        }
			        o = {x: s.x, y: s.y};
			    }

		        return diagonal(o, o)
		      })
		      .remove();

		  // Store the old positions for transition.
		  nodes.forEach(function(d){
		    d.x0 = d.x;
		    d.y0 = d.y;
		  });

		  // Creates a curved (diagonal) path from parent to the child nodes
		  function diagonal(s, d) {

		    path = `M ${s.y} ${s.x}
		            C ${(s.y + d.y) / 2} ${s.x},
		              ${(s.y + d.y) / 2} ${d.x},
		              ${d.y} ${d.x}`

		    return path
		  }

		  // Toggle children on click.
		  function click(d) {
		    if (d.children) {
		        d._children = d.children;
		        d.children = null;
		      } else {

		      	// Collapse siblings
		      	if (d.parent) {
		      		d.parent.children.forEach((s) => {
		      			if(s.children) {
		      				s._children = s.children;
		      				s.children = null;
		      			}
		      		})
		      	}

		        d.children = d._children;
		        d._children = null;
		      }
		    update(d);
		  }
		}

	};

	Charts.buildMinMaxBarChart = (selector, data) => {

		// Temporary
		tmp = data;

		// Define transition duration

		const duration = 750;

		// Define colors for the different cost types

		const colors = {startup:'rgba(0,0,255,0.6)', capital:'rgba(255,0,0,0.6)', recurring:'rgba(0,126,0,0.6)'};
		const colorsHover = {startup:'rgba(0,0,255,1)', capital:'rgba(255,0,0,1)', recurring:'rgba(0,126,0,1)'};

		// Return the n least and most expensive indicators in the type category
		const returnLeastMost = (type, n) => {
			// Remove any indicators that don't have a cost of this type
			filteredData = data.filter((d) => d[type]);

			// Sort the data by ascending cost
			filteredData.sort((d1, d2) => d1[type] - d2[type]);

			// Return the n least expensive [0] and the n most expensive [1] indicators
			return [filteredData.slice(0,n), filteredData.slice(filteredData.length-n,filteredData.length)];
		};

		// Set up the chart

		const width = 600, height = 400;
		const margin = {top:100, right:60, bottom:40, left:100};

		const chartContainer = d3.select(selector)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);
		const chart = chartContainer.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);

		const x = d3.scaleLinear()
			.range([0, width]);

		const y = d3.scaleBand()
			.range([0, height])
			.padding(0.2);


		// Activate the tab buttons

		let currentType = '';
		let index = 0; // Arbitrary id for each bar
		
		$('.min-max-container .btn').click(function() {
			let newType = $(this).attr('tab');
			if(newType !== currentType) {

				$(this).addClass('active');
				$(this).siblings().removeClass('active');

				// Call update function
				leastMost = returnLeastMost(newType, 5);
				update(leastMost[0], leastMost[1], newType);

				currentType = newType;

			}
		});

		// Create the default chart view

		$('.min-max-container .active').click();

		// Assumes:
		// 	Least sorted in ascending order
		// 	Most sorted in ascending order
		//  Type is a string of total/startup/capital/recurring
		
		function update (least, most, type) {

			// Temporary
			if (type === 'total') return;

			// Merge data into one array
			const dispData = least.concat(most).reverse();

			// Create scales
			x.domain([0, 1.05*d3.max(dispData, d => d[type])]);
			//x.domain([0, 1.05*dispData[0].cost]);
			y.domain(dispData.map(d => d.name));

			// Plot bars
			const bars = chart.selectAll('.bar')
				.data(dispData, () => ++index);

			// Remove the old bars
			bars.exit().remove();
			/*	.transition()
					.duration(duration)
					.attr('width', 0)
					.remove();*/

			// Create the new bars
			bars.enter().append('rect')
				.attr('class', 'bar')
				.style('fill', colors[type])
				.attr('y', d => y(d.name))
				.attr('height', y.bandwidth())
				.transition()
					.duration(duration)
					.attr('width', d => x(d[type]))

			// Plot axes
			chart.append('g')
				.attr('class', 'x-axis axis')
				.call(d3.axisTop(x).ticks(6).tickFormat(d3.format('$,.0f')).tickPadding(8));
			chart.append('g')
				.attr('class', 'y-axis axis')
				.call(d3.axisLeft(y));

			// Axes labels
			chart.append('text')
				.attr('class', 'axis-label')
				.attr('x', width/2)
				.attr('y', -55)
				.attr('text-anchor', 'middle')
				.text('Cost of Indicator')


			// TODO: Add most and least expensive indicator labels
			// TODO: Remove ticks at the end of the axes?

		}

	};

})();

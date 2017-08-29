const Charts = {};

(() => {
	Charts.buildProgressChart = (selector, data, param={}) => {
		const margin = { top: 35, right: 5, bottom: 35, left: 5 };
		const width = param.width || 700;
		const height = param.height || 36;
		const chartContainer = d3.selectAll(selector).append('svg')
			.classed('progress-chart', true)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
		const chart = chartContainer.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);

		const circleRadius = param.radius || 9;
		const rectHeight = param.rectHeight || height / 2;

		const x = d3.scaleLinear()
			.domain([0, 5])
			.range([0, width]);

		// add glow definitions to svg
		const defs = chartContainer.append('defs');
		const filter = defs.append('filter')
			.attr('id', 'blur');
		filter.append('feGaussianBlur')
			.attr('in', 'SourceGraphic')
			.attr('stdDeviation', '1');
		const pattern = defs.append('pattern')
			.attr('id', 'diagonalHatch')
			.attr('patternUnits', 'userSpaceOnUse')
			.attr('width', 4)
			.attr('height', 4);
		pattern.append('rect')
			.attr('x', -1)
			.attr('y', -1)
			.attr('width', 6)
			.attr('height', 6)
			.attr('fill', 'white')
			.attr('stroke', 'none');
		pattern.append('path')
			.attr('d', 'M-1,1 l2,-2, M0,4 l4,-4, M3,5 l2,-2')
			.attr('stroke', 'black')
			.attr('stroke-width', 0.5);

		// draw rectangles
		const rectData = [
			{ x0: 0, x1: 1, color: 'rgb(200, 33, 39)' },
			{ x0: 1, x1: 3, color: 'rgb(247, 236, 19)' },
			{ x0: 3, x1: 5, color: 'rgb(21, 108, 55)' }
		];
		chart.selectAll('.color-bar')
			.data(rectData)
			.enter().append('rect')
				.attr('class', 'color-bar')
				.attr('x', d => x(d.x0))
				.attr('width', d => x(d.x1) - x(d.x0))
				.attr('height', height)
				.style('fill', d => d.color)
				.attr('filter', 'url(#blur)');

		// draw base and ticks
		chart.append('rect')
			.attr('class', 'base')
			.attr('width', width)
			.attr('height', height);

		// add bars
		chart.append('rect')
			.attr('class', 'bar bar-0')
			.attr('x', x(0))
			.attr('y', (height - rectHeight) / 2)
			.attr('width', x(data[0]) - x(0))
			.attr('height', rectHeight);
		chart.append('rect')
			.attr('class', 'bar bar-1')
			.attr('x', x(data[0]))
			.attr('y', (height - rectHeight) / 2)
			.attr('width', x(data[1]) - x(data[0]))
			.attr('height', rectHeight)
			.style('fill', 'url(#diagonalHatch)');

		// add markers
		chart.append('circle')
			.attr('class', 'marker marker-0')
			.attr('cx', x(data[0]))
			.attr('cy', height / 2)
			.attr('r', circleRadius);
		chart.append('circle')
			.attr('class', 'marker marker-1')
			.attr('cx', x(data[1]))
			.attr('cy', height / 2)
			.attr('r', circleRadius);

		// add labels
		chart.append('line')
			.attr('class', 'label-line')
			.attr('x1', x(data[0]))
			.attr('x2', x(data[0]))
			.attr('y1', -10)
			.attr('y2', (height / 2) - circleRadius);
		chart.append('text')
			.attr('class', 'label-text')
			.attr('x', x(data[0]))
			.attr('y', -21)
			.attr('dy', '.35em')
			.text('Old Score');
		chart.append('line')
			.attr('class', 'label-line')
			.attr('x1', x(data[1]))
			.attr('x2', x(data[1]))
			.attr('y1', height + 10)
			.attr('y2', (height / 2) + circleRadius);
		chart.append('text')
			.attr('class', 'label-text')
			.attr('x', x(data[1]))
			.attr('y', height + 21)
			.attr('dy', '.35em')
			.text('New Score')

		return chart;
	}

	Charts.buildCostChart = (selector, data, param={}) => {
		const margin = { top: 60, right: 30, bottom: 60, left: 95 };
		const width = 580;
		const height = 300;
		const chartContainer = d3.select(selector).append('svg')
			.attr('class', 'cost-chart')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);
		const chart = chartContainer.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);

		// add clip path
		const defs = chartContainer.append('defs');
		const chartClip = defs.append('clipPath').attr('id', 'chart-clip');
		chartClip.append('rect')
			.attr('y', -margin.top)
			.attr('width', width + margin.right)
			.attr('height', height + margin.top);
		const chartBody = chart.append('g')
			.attr('clip-path', 'url(#chart-clip)');

		// define scales
		const x = d3.scaleBand()
			.domain(data.map(d => d.capId.toUpperCase()))
			.range([0, width]);
		const y = d3.scaleLinear()
			.range([height, 0]);
		const bandwidth = x.bandwidth();

		// additional scales
		const colorScale = d3.scaleLinear()
			.domain([0, width])
			.range(['rgba(255,0,0,0.5)', 'rgba(0,66,118,0.5)']);
		const radiusScale = d3.scaleLinear()
			.domain([height, 0])
			.range([5, 25]);

		// define axes
		const xAxis = d3.axisBottom(x);
		const yAxis = d3.axisLeft()
			.ticks(7)
			.tickFormat((num) => {
				return (num === 0) ? '0' : d3.format(',.3s')(num);
			});

		// add axes
		chart.append('g')
			.attr('class', 'x axis')
			.attr('transform', `translate(0, ${height})`)
			.call(xAxis);
		const yAxisG = chart.append('g')
			.attr('class', 'y axis');

		// add axes labels
		chart.append('text')
			.attr('class', 'axis-label')
			.attr('x', width / 2)
			.attr('y', height + 50)
			.text('Capacity ID');
		chart.append('text')
			.attr('class', 'axis-label')
			.attr('transform', 'rotate(-90)')
			.attr('x', -height / 2)
			.attr('y', -80)
			.text(`Startup Cost (in ${App.whoAmI.currency_iso})`);


		// update function
		chart.updateData = (newData) => {
			// define scales
			y.domain([0, 1.1 * d3.max(newData, d => d.startupCost)]);
			yAxis.scale(y);
			yAxisG.call(yAxis);

			// add a circle for each indicator
			const indBlobs = chartBody.selectAll('.indicator-blob')
				.data(newData);
			indBlobs.exit().remove();
			indBlobs.enter().append('circle')
				.attr('class', 'indicator-blob')
				.attr('r', d => radiusScale(y(d.startupCost)))
				.each(function() {
					$(this).tooltipster({ maxWidth: 400, content: '' });
				})
				.merge(indBlobs).transition()
					.attr('cx', (d) => {
						const xVal = x(d.capId.toUpperCase()) + bandwidth / 2;
						const jitter = (bandwidth / 2) * (Math.random() - 0.5);
						return xVal + jitter;
					})
					.attr('cy', d => y(d.startupCost))
					.style('fill', d => colorScale(x(d.capId.toUpperCase())))
					.each(function(d, i) {
						const capacity = App.getCapacity(d.capId);
						$(this).tooltipster('content',
							'<div class="cc-tooltip">' +
								`<div class="cc-tooltip-title">${capacity.name}</div>` +
								`<div class="cc-tooltip-subtitle">${d.name}</div>` +
								'<div class="cc-tooltip-block">' +
									`<div>${App.moneyFormat(d.startupCost)}</div>` +
									`<div>Startup Cost</div>` +
								'</div>' +
								'<div class="cc-tooltip-block">' +
									`<div>${App.moneyFormat(d.capitalCost)}</div>` +
									`<div>Capital Cost</div>` +
								'</div>' +
								'<div class="cc-tooltip-block">' +
									`<div>${App.moneyFormat(d.recurringCost)}/yr</div>` +
									`<div>Recurring Cost</div>` +
								'</div>' +
							'</div>');
					});
		};

		chart.updateData(data);
		return chart;
	}

	Charts.buildBubblePack = (selector, data, param={}) => {
		// setup svg
		const margin = { top: 60, right: 30, bottom: 60, left: 95 };
		const width = 580;
		const height = 300;
		const chartContainer = d3.select(selector).append('svg')
			.attr('class', 'cost-chart')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);
		const chart = chartContainer.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);

		// setup data
		const newData = [];
		for (let i = 0; i < Object.keys(data).length; i++) {
			const newObj = {};
			const curKey = Object.keys(data)[i];
			newObj.name = curKey;
			if (param.costType === 'total') {
				newObj.value = data[curKey]['start-up'] + (data[curKey].recurring * param.totalCostDuration) + data[curKey].capital;
			} else {
				// TODO other filter views, like startup, capital, recurring
			}
			newData.push(newObj);
		}
		data = newData;

		let svg = chart;
		let centerX = width * 0.5;
		let centerY = height * 0.5;
		let strength = 0.05;
		let focusedNode;

		let format = d3.format(',d');

		let scaleColor = d3.scaleOrdinal(d3.schemeCategory20);

		// use pack to calculate radius of the circle
		let pack = d3.pack()
			.size([width, height ])
			.padding(1.5);

		let forceCollide = d3.forceCollide(d => d.r + 1);

		// use the force
		let simulation = d3.forceSimulation()
			.force('charge', d3.forceManyBody())
			.force('collide', forceCollide)
			.force('x', d3.forceX(centerX ).strength(strength))
			.force('y', d3.forceY(centerY ).strength(strength));

		let root = d3.hierarchy({ children: data })
			.sum(d => d.value);

		// we use pack() to automatically calculate radius conveniently only
		// and get only the leaves
		let nodes = pack(root).leaves().map(node => {
			const data = node.data;
			return {
				x: centerX + (node.x - centerX) * 3, // magnify start position to have transition to center movement
				y: centerY + (node.y - centerY) * 3,
				r: 0, // for tweening
				radius: node.r, //original radius
				id: data.cat + '.' + (data.name.replace(/\s/g, '-')),
				cat: data.cat,
				name: data.name,
				value: data.value,
				icon: data.icon,
				desc: data.desc,
			};
		});
		simulation.nodes(nodes).on('tick', ticked);

		svg.style('background-color', '#eee');
		let node = svg.selectAll('.node')
			.data(nodes)
			.enter().append('g')
			.attr('class', 'node')
			.call(d3.drag()
				.on('start', (d) => {
					if (!d3.event.active) { simulation.alphaTarget(0.2).restart(); }
					d.fx = d.x;
					d.fy = d.y;
				})
				.on('drag', (d) => {
					d.fx = d3.event.x;
					d.fy = d3.event.y;
				})
				.on('end', (d) => {
					if (!d3.event.active) { simulation.alphaTarget(0); }
					d.fx = null;
					d.fy = null;
				}));

		node.append('circle')
			.attr('id', d => d.id)
			.attr('r', 0)
			.style('fill', d => scaleColor(d.cat))
			.transition().duration(2000).ease(d3.easeElasticOut)
				.tween('circleIn', (d) => {
					let i = d3.interpolateNumber(0, d.radius);
					return (t) => {
						d.r = i(t);
						simulation.force('collide', forceCollide);
					};
				});

		node.append('clipPath')
			.attr('id', d => `clip-${d.id}`)
			.append('use')
			.attr('xlink:href', d => `#${d.id}`);

		// // display text as circle icon
		// node.filter(d => !String(d.icon).includes('img/'))
		// 	.append('text')
		// 	.classed('node-icon', true)
		// 	.attr('clip-path', d => `url(#clip-${d.id})`)
		// 	.selectAll('tspan')
		// 	.data(d => d.icon.split(';'))
		// 	.enter()
		// 		.append('tspan')
		// 		.attr('x', 0)
		// 		.attr('y', (d, i, nodes) => (13 + (i - nodes.length / 2 - 0.5) * 10))
		// 		.text(name => name);

		// // display image as circle icon
		// node.filter(d => String(d.icon).includes('img/'))
		// 	.append('image')
		// 	.classed('node-icon', true)
		// 	.attr('clip-path', d => `url(#clip-${d.id})`)
		// 	.attr('xlink:href', d => d.icon)
		// 	.attr('x', d => -d.radius * 0.7)
		// 	.attr('y', d => -d.radius * 0.7)
		// 	.attr('height', d => d.radius * 2 * 0.7)
		// 	.attr('width', d => d.radius * 2 * 0.7);

		node.append('title')
			.text(d => (d.name + '\n' + format(d.value)));
		// node.append('title')
		// 	.text(d => (d.cat + '::' + d.name + '\n' + format(d.value)));

		// let infoBox = node.append('foreignObject')
		// 	.classed('circle-overlay hidden', true)
		// 	.attr('x', -350 * 0.5 * 0.8)
		// 	.attr('y', -350 * 0.5 * 0.8)
		// 	.attr('height', 350 * 0.8)
		// 	.attr('width', 350 * 0.8)
		// 		.append('xhtml:div')
		// 		.classed('circle-overlay__inner', true);

		// infoBox.append('h2')
		// 	.classed('circle-overlay__title', true)
		// 	.text(d => d.name);

		// infoBox.append('p')
		// 	.classed('circle-overlay__body', true)
		// 	.html(d => d.desc);


		node.on('click', (currentNode) => {

			console.log('Clicked ' + currentNode.name + ', total = ' + currentNode.value);

			// d3.event.stopPropagation();
			// console.log('currentNode', currentNode);
			// let currentTarget = d3.event.currentTarget; // the <g> el

			// if (currentNode === focusedNode) {
			// 	// no focusedNode or same focused node is clicked
			// 	return;
			// }
			// let lastNode = focusedNode;
			// focusedNode = currentNode;

			// simulation.alphaTarget(0.2).restart();
			// // hide all circle-overlay
			// d3.selectAll('.circle-overlay').classed('hidden', true);
			// d3.selectAll('.node-icon').classed('node-icon--faded', false);

			// // don't fix last node to center anymore
			// if (lastNode) {
			// 	lastNode.fx = null;
			// 	lastNode.fy = null;
			// 	node.filter((d, i) => i === lastNode.index)
			// 		.transition().duration(2000).ease(d3.easePolyOut)
			// 		.tween('circleOut', () => {
			// 			let irl = d3.interpolateNumber(lastNode.r, lastNode.radius);
			// 			return (t) => {
			// 				lastNode.r = irl(t);
			// 			};
			// 		})
			// 		.on('interrupt', () => {
			// 			lastNode.r = lastNode.radius;
			// 		});
			// }

			// // if (!d3.event.active) simulation.alphaTarget(0.5).restart();

			// d3.transition().duration(2000).ease(d3.easePolyOut)
			// 	.tween('moveIn', () => {
			// 		console.log('tweenMoveIn', currentNode);
			// 		let ix = d3.interpolateNumber(currentNode.x, centerX);
			// 		let iy = d3.interpolateNumber(currentNode.y, centerY);
			// 		let ir = d3.interpolateNumber(currentNode.r, centerY * 0.5);
			// 		return function (t) {
			// 			// console.log('i', ix(t), iy(t));
			// 			currentNode.fx = ix(t);
			// 			currentNode.fy = iy(t);
			// 			currentNode.r = ir(t);
			// 			simulation.force('collide', forceCollide);
			// 		};
			// 	})
			// 	.on('end', () => {
			// 		simulation.alphaTarget(0);
			// 		let $currentGroup = d3.select(currentTarget);
			// 		$currentGroup.select('.circle-overlay')
			// 			.classed('hidden', false);
			// 		$currentGroup.select('.node-icon')
			// 			.classed('node-icon--faded', true);

			// 	})
			// 	.on('interrupt', () => {
			// 		console.log('move interrupt', currentNode);
			// 		currentNode.fx = null;
			// 		currentNode.fy = null;
			// 		simulation.alphaTarget(0);
			// 	});

		});

		// blur
		d3.select(document).on('click', () => {
			let target = d3.event.target;
			// check if click on document but not on the circle overlay
			if (!target.closest('#circle-overlay') && focusedNode) {
				focusedNode.fx = null;
				focusedNode.fy = null;
				simulation.alphaTarget(0.2).restart();
				d3.transition().duration(2000).ease(d3.easePolyOut)
					.tween('moveOut', function () {
						console.log('tweenMoveOut', focusedNode);
						let ir = d3.interpolateNumber(focusedNode.r, focusedNode.radius);
						return function (t) {
							focusedNode.r = ir(t);
							simulation.force('collide', forceCollide);
						};
					})
					.on('end', () => {
						focusedNode = null;
						simulation.alphaTarget(0);
					})
					.on('interrupt', () => {
						simulation.alphaTarget(0);
					});

				// hide all circle-overlay
				d3.selectAll('.circle-overlay').classed('hidden', true);
				d3.selectAll('.node-icon').classed('node-icon--faded', false);
			}
		});

		function ticked() {
			node
				.attr('transform', d => `translate(${d.x},${d.y})`)
				.select('circle')
					.attr('r', d => d.r);
		}
	};
})();

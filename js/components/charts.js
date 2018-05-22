const Charts = {};

(() => {

	const typeHash = {
		"indicator":"indicateur",
		"core capacity":"capacité de base",
		"core element": "élément clé",
	};
	Charts.buildProgressChart = (selector, data, param={}) => {
		const margin = { top: 35, right: 45, bottom: 35, left: 50 };
		const width = param.width || 630;
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
			.domain([1, 5])
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
			{ x0: 1, x1: 1.5, color: 'rgb(200, 33, 39)' },
			{ x0: 1.5, x1: 3.5, color: 'rgb(247, 236, 19)' },
			{ x0: 3.5, x1: 5, color: 'rgb(21, 108, 55)' }
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
			.attr('x', x(1))
			.attr('y', (height - rectHeight) / 2)
			.attr('width', x(data[0]) - x(1))
			.attr('height', rectHeight)
			.attr('fill', '#777');
		chart.append('rect')
			.attr('class', 'bar bar-1')
			.attr('x', x(data[0]))
			.attr('y', (height - rectHeight) / 2)
			.attr('width', x(data[1]) - x(data[0]))
			.attr('height', rectHeight)
			.attr('fill', 'url(#diagonalHatch)');

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
			.text(App.lang === 'fr' ? 'Score actuel' : 'Current Score');
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
			.text(App.lang === 'fr' ? 'Score cible' : 'Target Score')

		return chart;
	}

	Charts.buildCostChart = (selector, param={}) => {
		const margin = { top: 70, right: 30, bottom: 70, left: 100 };
		const width = 810;
		const height = 320;
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

		// define scales
		const x = d3.scaleBand()
			.range([0, width]);
		const y = d3.scaleLinear()
			.range([height, 0]);

		// additional scales
		const colorScale = d3.scaleLinear()
			.domain([0, width])
			.range(['rgb(255, 0, 0)', 'rgb(0, 66, 118)']);
		const radiusScale = d3.scaleLinear()
			.domain([height, 0])
			.range([5, 25]);

		// define axes
		const xAxis = d3.axisBottom();
		const yAxis = d3.axisLeft()
			.ticks(6)
			.tickSizeInner(-width)
			.tickFormat((num) => {
				return (num === 0) ? '0' : App.siFormat(num);
			});

		// add axes
		const xAxisG = chart.append('g')
			.attr('class', 'x axis')
			.attr('transform', `translate(0, ${height})`);
		const yAxisG = chart.append('g')
			.attr('class', 'y axis');

		const chartBody = chart.append('g')
			.attr('clip-path', 'url(#chart-clip)');

		// add axes labels
		const gAxisLabels = chart.append('g')
			.attr('class','axis-labels')
			.attr('transform','translate(-100,0)');
		const xAxisLabel = gAxisLabels.append('text')
			.attr('class', 'axis-label x-axis-label')
			.attr('x', 85)
			.attr('y', height + 60);
		const yAxisLabel = gAxisLabels.append('text')
			.attr('class', 'axis-label y-axis-label-1')
			.attr('y', -32);
		gAxisLabels.append('text')
			.attr('class', 'axis-label y-axis-label-2')
			.attr('y', -15)
			.text(App.lang === 'fr' ? `(en ${App.whoAmI.currency_iso})` : `(in ${App.whoAmI.currency_iso})`);


		// update functions
		chart.update = (newData, newXValFunc, newYValFunc) => {
			// use current data and value functions if any arguments are null
			const data = newData || chart.currData;
			if (newData) chart.currData = newData;

			const xValFunc = newXValFunc || chart.currXValFunc;
			if (newXValFunc) chart.currXValFunc = newXValFunc;

			const yValFunc = newYValFunc || chart.currYValFunc;
			if (newYValFunc) chart.currYValFunc = newYValFunc;

			// set scales
			x.domain(data.map(xValFunc));
			y.domain([0, 1.1 * d3.max(data, yValFunc)]);
			xAxis.scale(x);
			yAxis.scale(y);
			xAxisG.call(xAxis);			
			yAxisG.call(yAxis);

			const bandwidth = x.bandwidth();

			// wrap x-axis labels and attach tooltip
			xAxisG.selectAll('.tick text')
				.call(wrap, bandwidth);
			xAxisG.selectAll('.tick text').each(function(d) {
				if (!$(this).hasClass('tooltipstered')) {
					const cap = App.getCapacity(d);
					if (cap) {
						$(this).tooltipster({ content: `<b>${d}</b> - ${cap.name}` });
						return;
					}

					const ind = App.getIndicator(d.toLowerCase());
					if (ind) {
						$(this).tooltipster({ content: `<b>${d}</b> - ${ind.name}` });
						return;
					}
				}
			});

			// move y-axis labels a little to the left
			yAxisG.selectAll('.tick text').attr('x', -11);

			// add a circle for each indicator
			const indBlobs = chartBody.selectAll('.indicator-blob')
				.data(data);
			indBlobs.exit().remove();
			indBlobs.enter().append('circle')
				.attr('class', 'indicator-blob')
				.each(function() {
					$(this).tooltipster({
						maxWidth: 400,
						interactive: true,
						content: '',
					});
				})
				.merge(indBlobs)
					.on('click', function(d) {
						if (d.type === 'indicator') {
							const capacity = App.getCapacity(d.capId);
							let actions = [];
							capacity.indicators.forEach((ind) => {
								actions = actions.concat(ind.actions);
							});

							const getIndIdFunc = (action) => {
								const actionIdArr = action.id.split('.');
								actionIdArr.pop();
								const indId = actionIdArr.join('.');
								return indId.toUpperCase();
							}
							chart.update(actions, getIndIdFunc, yValFunc);
						}
					})
					.transition()
						.duration(1200)
						.attr('r', d => radiusScale(y(yValFunc(d))))
						.attr('cx', (d) => {
							const xVal = x(xValFunc(d)) + bandwidth / 2;
							const jitter = (bandwidth / 2) * (Math.random() - 0.5);
							return xVal + jitter;
						})
						.attr('cy', d => y(yValFunc(d)))
						.style('fill', d => colorScale(x(xValFunc(d))))
						.each(function addTooltip(d, i) {
							const costData = [
								{ name: App.lang === 'fr' ? 'Coût de démarrage' : 'Startup Cost', value: d.startupCost },
								{ name: App.lang === 'fr' ? 'Coût d\'investissement' : 'Capital Cost', value: d.capitalCost },
								{ name: App.lang === 'fr' ? 'Coût récurrent' : 'Recurring Cost', value: d.recurringCost, unit: App.lang === 'fr' ? '/an' : '/yr' }
							];

							const contentContainer = d3.select(document.createElement('div'));
							const content = contentContainer.append('div')
								.attr('class', 'cc-tooltip');
							content.append('div')
								.attr('class', 'cc-tooltip-title')
								.text(App.lang === 'fr' ? `${Util.capitalize(typeHash[d.type])} (${d.id.toUpperCase()})` : `${Util.capitalize(d.type)} (${d.id.toUpperCase()})`);
							content.append('div')
								.attr('class', 'cc-tooltip-subtitle')
								.text(App.lang === 'fr' ? d.name : d.name);

							const costBlocks = content.selectAll('.cc-tooltip-block')
								.data(costData)
								.enter().append('div')
									.attr('class', 'cc-tooltip-block');
							costBlocks.append('div')
								.text((dd) => {
									const costText = App.moneyFormat(dd.value);
									if (dd.unit) return costText + dd.unit;
									return costText;
								});
							costBlocks.append('div')
								.text(dd => dd.name);

							const goToCostingButton = content.append('div')
								.attr('class', 'cc-tooltip-button-container')
								.append('button')
									.attr('class', 'cc-tooltip-button btn btn-secondary')
										.text(App.lang === 'fr' ? 'Aller au calcul de coûts' : 'Go to Costing');

							// attach url redirect when clicking tooltip "go to costing" button
							if (d.type === 'indicator') {
								const idArr = d.id.split('.');
								const capIdLink = idArr.slice(0, idArr.length - 1).join('-');
								const indIdLink = idArr[idArr.length - 1];
								const onClickStr = `hasher.setHash('costs/${capIdLink}/${indIdLink}')`;
								goToCostingButton.attr('onClick', onClickStr);
							} else if (d.type === 'action') {
								console.log(d);
								const idArr = d.id.split('.');
								const capIdLink = idArr.slice(0, idArr.length - 2).join('-');
								const indIdLink = idArr[idArr.length - 2];
								const onClickStr = `hasher.setHash('costs/${capIdLink}/${indIdLink}')`;
								goToCostingButton.attr('onClick', onClickStr);
							}

							$(this).tooltipster('content', contentContainer.html());
						});
		};

		chart.updateXAxisLabel = (text) => {
			xAxisLabel.text(text);
		}
		chart.updateYAxisLabel = (text) => {
			yAxisLabel.text(text);
		}

		return chart;
	}

	Charts.buildBubblePack = (selector, data, param={}) => {
		// define color scale
		// const bubbleColorArr = ['#f2f0f7','#dadaeb','#bcbddc','#9e9ac8','#807dba','#6a51a3','#4a1486']; // purples
		// http://colorbrewer2.org/#type=sequential&scheme=Purples&n=7
		const bubbleColorScale = App.lang === 'fr' ? {
		  "Coordination / leadership": "#f2f0f7",
		  "Planning including assessment, design, planning, policy, legislation": "#dadaeb",
		  "Strengthening HR capacity": "#bcbddc",
		  "Strengthening infrastructure": "#9e9ac8",
		  "Operations / implementation": "#807dba",
		  "Analysis including data quality and dissemination": "#6a51a3",
		  "Use and review mechanisms": "#4a1486"
		} : {
		  "Coordination / leadership": "#f2f0f7",
		  "Planning including assessment, design, planning, policy, legislation": "#dadaeb",
		  "Strengthening HR capacity": "#bcbddc",
		  "Strengthening infrastructure": "#9e9ac8",
		  "Operations / implementation": "#807dba",
		  "Analysis including data quality and dissemination": "#6a51a3",
		  "Use and review mechanisms": "#4a1486"
		};

		// setup svg
		const margin = { top: 60, right: 30, bottom: 60, left: 95 };
		const width = 580;
		const height = 300;
		const chartContainer = d3.select(selector).append('svg')
			.attr('class', 'bubble-chart')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);
		const chart = chartContainer.append('g')
			.attr('class','bubble-pack')
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
			.force('x', d3.forceX(centerX).strength(strength))
			.force('y', d3.forceY(centerY).strength(strength));

		let root = d3.hierarchy({ children: data })
			.sum(d => d.value);

		// we use pack() to automatically calculate radius conveniently only
		// and get only the leaves
		const minRadius = 5;
		let nodes = pack(root).leaves().map(node => {
			const data = node.data;
			return {
				x: centerX + (node.x - centerX) * 3, // magnify start position to have transition to center movement
				y: centerY + (node.y - centerY) * 3,
				r: 0, // for tweening
				radius: node.r + minRadius, //original radius
				//id: data.cat + '.' + (data.name.replace(/\s/g, '-')),
				id: data.cat,
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
			.attr('class','bubble')
			//.attr('stroke', d => d3.color(bubbleColorScale[d.name]).darker().toString())
			.attr('stroke-width','1px')
			//.style('fill', d => bubbleColorScale[d.name])
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

		node.append('title')
			.text(d =>(d.name + '\n' + format(d.value)));

		node.on('mouseover', function(currentNode) {
			// black ring
			const circle = d3.select(this).select('circle');
			circle
				.attr('stroke-width','3px')
				.attr('stroke','black');
		});

		node.on('mouseout', function(currentNode) {
			// rmv ring
			const circle = d3.select(this).select('circle');
			circle
				.attr('stroke', d => d3.color(bubbleColorScale[d.name]).darker().toString())
				.attr('stroke-width','1px')
		});

		function ticked() {
			node
				.attr('transform', d => `translate(${d.x},${d.y})`)
				.select('circle')
					.attr('r', d => d.r);
		}
	};
})();

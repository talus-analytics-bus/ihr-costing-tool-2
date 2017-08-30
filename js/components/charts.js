const Charts = {};

(() => {
	Charts.buildProgressChart = (selector, data, param={}) => {
		const margin = { top: 35, right: 45, bottom: 35, left: 5 };
		const width = param.width || 660;
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
			.text('Current Score');
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
			.text('Target Score')

		return chart;
	}

	Charts.buildCostChart = (selector, param={}) => {
		const margin = { top: 70, right: 30, bottom: 70, left: 100 };
		const width = 800;
		const height = 260;
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
				return (num === 0) ? '0' : d3.format(',.3s')(num);
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
		const xAxisLabel = chart.append('text')
			.attr('class', 'axis-label x-axis-label')
			.attr('x', 5)
			.attr('y', height + 60);
		const yAxisLabel = chart.append('text')
			.attr('class', 'axis-label y-axis-label-1')
			.attr('y', -32);
		chart.append('text')
			.attr('class', 'axis-label y-axis-label-2')
			.attr('y', -15)
			.text(`(in ${App.whoAmI.currency_iso})`);


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
					$(this).tooltipster({ maxWidth: 400, content: '' });
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
						.each(function(d, i) {
							$(this).tooltipster('content',
								'<div class="cc-tooltip">' +
									`<div class="cc-tooltip-title">${Util.capitalize(d.type)} (${d.id.toUpperCase()})</div>` +
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

		chart.updateXAxisLabel = (text) => {
			xAxisLabel.text(text);
		}
		chart.updateYAxisLabel = (text) => {
			yAxisLabel.text(text);
		}

		return chart;
	}
})();

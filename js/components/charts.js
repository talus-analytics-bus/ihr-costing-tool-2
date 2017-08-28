const Charts = {};

(() => {
	Charts.buildProgressChart = (selector, data, param={}) => {
		const margin = { top: 5, right: 5, bottom: 5, left: 5 };
		const width = param.width || 800;
		const height = param.height || 26;
		const chartContainer = d3.selectAll(selector).append('svg')
			.classed('progress-chart', true)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
		const chart = chartContainer.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);

		const circleRadius = param.radius || 6;
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

		return chart;
	}

	Charts.buildCostChart = (selector, data, param={}) => {
		const margin = { top: 60, right: 30, bottom: 60, left: 95 };
		const width = 600;
		const height = 300;
		const chartContainer = d3.select(selector).append('svg')
			.attr('class', 'cost-chart')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);
		const chart = chartContainer.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);

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
			.text(`Indicator Cost (in ${App.whoAmI.currency_iso})`);


		// update function
		chart.updateData = (newData) => {
			// define scales
			y.domain([0, 1.1 * d3.max(newData, d => d.startupCost)]);
			yAxis.scale(y);
			yAxisG.call(yAxis);

			// add a circle for each indicator
			const indBlobs = chart.selectAll('.indicator-blob')
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
})();

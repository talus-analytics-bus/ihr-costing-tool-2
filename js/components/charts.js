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

		// draw rectangles
		const rectData = [
			{ x0: 0, x1: 1, color: '#c91414' },
			{ x0: 1, x1: 3, color: '#d3cf11' },
			{ x0: 3, x1: 5, color: '#0c6b0c' }
		];
		chart.selectAll('.color-bar')
			.data(rectData)
			.enter().append('rect')
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
		chart.selectAll('.tick-line')
			.data(d3.range(1, 5))
			.enter().append('line')
				.attr('class', 'tick-line')
				.attr('x1', d => x(d))
				.attr('x2', d => x(d))
				.attr('y2', height);

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

		// add line between markers
		chart.append('line')
			.attr('class', 'marker-line')
			.attr('x1', x(data[0]) + circleRadius)
			.attr('x2', x(data[1]) - circleRadius)
			.attr('y1', height / 2)
			.attr('y2', height / 2);

		return chart;
	}

	Charts.buildCircleSummary = (selector, data, param={}) => {
		const margin = { top: 5, right: 5, bottom: 5, left: 5 };
		const radius = param.radius || 70;
		const chart = d3.selectAll(selector).append('svg')
			.classed('circle-summary-chart', true)
			.attr('width', 2 * radius + margin.left + margin.right)
			.attr('height', 2 * radius + margin.top + margin.bottom)
			.append('g')
				.attr('transform', `translate(${margin.left + radius}, ${margin.top + radius})`);

		chart.append('circle')
			.attr('class', 'base')
			.attr('r', radius);
		chart.append('text')
			.attr('class', 'value-text')
			.attr('dy', '.35em')
			.text(App.moneyFormat(data));
		chart.append('text')
			.attr('class', 'label-text')
			.attr('y', '2rem')
			.attr('dy', '.35em')
			.text(param.label || '');
	}

	Charts.buildCostChart = (selector, data, param={}) => {
		const margin = { top: 60, right: 30, bottom: 40, left: 85 };
		const width = 800;
		const height = 300;
		const chartContainer = d3.select(selector).append('svg')
			.attr('class', 'cost-chart')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);
		const chart = chartContainer.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);

		const colorScale = d3.scaleOrdinal(d3.schemeCategory20c);

		// define scales
		const x = d3.scaleBand()
			.domain(data.map(d => d.id))
			.range([0, width]);
		const y = d3.scaleLinear()
			.range([height, 0]);
		const bandwidth = x.bandwidth();

		// define axes
		const xAxis = d3.axisBottom(x);
		const yAxis = d3.axisLeft()
			.tickFormat(d3.format('$,.3s'));

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
			.attr('transform', 'rotate(-90)')
			.attr('x', -height / 2)
			.attr('y', -70)
			.text('Total Cost');


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
				.attr('r', 5)
				.each(function() {
					$(this).tooltipster({ maxWidth: 400, content: '' });
				})
				.merge(indBlobs).transition()
					.attr('cx', d => x(d.id) + bandwidth / 2)
					.attr('cy', d => y(d.startupCost))
					.style('fill', d => colorScale(d.id))
					.each(function(d, i) {
						/*const capacity = newData[i];
						$(this).tooltipster('content',
							'<div class="cc-tooltip">' +
								`<div class="cc-tooltip-title">${capacity.name}</div>` +
								'<div class="cc-tooltip-block">' +
									`<div>${moneyFormat(d[1 / dt].totalCost)}</div>` +
									`<div>Year 1 Cost</div>` +
								'</div>' +
								'<div class="cc-tooltip-block">' +
									`<div>${moneyFormat(d[3 / dt].totalCost)}</div>` +
									`<div>Year 3 Cost</div>` +
								'</div>' +
								'<div class="cc-tooltip-block">' +
									`<div>${moneyFormat(d[5 / dt].totalCost)}</div>` +
									`<div>Year 5 Cost</div>` +
								'</div>' +
							'</div>');*/
					});
		};

		chart.updateData(data);
		return chart;
	}
})();

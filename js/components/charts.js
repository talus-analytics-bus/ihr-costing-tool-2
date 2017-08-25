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

	Charts.buildCostBarChart = (selector, data, param={}) => {
		const margin = { top: 30, right: 60, bottom: 20, left: 100 };
		const width = param.width || 450;
		const height = param.height || 110;
		const chartContainer = d3.select(selector).append('svg')
			.attr('class', 'cost-bar-chart')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);
		const chart = chartContainer.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);

		const x = d3.scaleLinear()
			.range([0, width])
			.nice();
		const y = d3.scaleBand()
			.paddingOuter(0.3)
			.paddingInner(0.4)
			.rangeRound([0, height]);

		const xAxis = d3.axisTop()
			.ticks(5)
			.tickFormat(d3.format('$.3s'));
		const yAxis = d3.axisLeft();
		const xAxisG = chart.append('g').attr('class', 'x axis');
		const yAxisG = chart.append('g').attr('class', 'y axis');


		chart.update = (newData) => {
			const maxCost = d3.max(newData.map(d => d3.sum(d.data, dd => dd.value)));
			x.domain([0, 1.1 * maxCost])
			y.domain(newData.map(d => d.name));
			xAxis.scale(x);
			yAxis.scale(y);
			xAxisG.call(xAxis);
			yAxisG.call(yAxis);

			// modify data to have x0 and x1 attribute
			newData.forEach((d) => {
				let runningVal = 0;
				d.data.filter(cap => cap.selected).forEach((cap) => {
					cap.val0 = runningVal;
					cap.val1 = (runningVal += cap.value);
				});
				d.selectedVal = runningVal;
				d.data.filter(cap => !cap.selected).forEach((cap) => {
					cap.val0 = runningVal;
					cap.val1 = (runningVal += cap.value);
				});
			});

			let barGroups = chart.selectAll('.bar-group')
				.data(newData);
			barGroups.exit().remove();
			const newBarGroups = barGroups.enter().append('g')
				.attr('class', 'bar-group');
			newBarGroups.append('text').attr('class', 'total-label');
			barGroups = newBarGroups.merge(barGroups);
			barGroups.transition()
				.attr('transform', (d) => `translate(0, ${y(d.name)})`);

			let bars = barGroups.selectAll('.bar')
				.data(d => d.data);
			bars.exit().remove();
			const newBars = bars.enter().append('rect')
				.attr('class', 'bar')
				.each(function() { $(this).tooltipster(); });
			bars = newBars.merge(bars);
			bars
				.attr('height', y.bandwidth())
				.transition()
					.attr('x', d => x(d.val0))
					.attr('width', d => x(d.val1) - x(d.val0));

			// update tooltipster content
			barGroups.each(function(d) {
				d3.select(this).selectAll('.bar').each(function(dd) {
					$(this).tooltipster('content',
						'<div class="cc-tooltip">' +
							`<div class="cc-tooltip-title">${dd.name}</div>` +
							'<div class="cc-tooltip-block">' +
								`<div>${d3.format('$.3s')(dd.value)}</div>` +
								`<div>${d.name}</div>` +
							'</div>' +
						'</div>');
				});
			});

			// add total cost text
			barGroups.select('.total-label')
				.attr('x', d => x(d3.sum(d.data, dd => dd.value)) + 5)
				.attr('y', y.bandwidth() / 2)
				.attr('dy', '.35em')
				.text((d) => {
					const totalCost = d3.sum(d.data, dd => dd.value);
					if (param.totalTextFormat) {
						return param.totalTextFormat(d3.format('$.3s')(totalCost));
					}
					return `${d3.format('$.3s')(totalCost)} total`;
				});

			// move axes to front
			$('.axis').each(function() {
				this.parentNode.appendChild(this);
			});
		};

		if (data) chart.update(data);
		return chart;
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

		const dt = 0.1;  // in years
		const colorScale = d3.scaleOrdinal(d3.schemeCategory20c);

		// define scales
		const x = d3.scaleLinear()
			.domain([-0.3, 5.3])
			.range([0, width]);
		const y = d3.scaleLinear()
			.range([height, 0]);

		// define line and area
		const line = d3.line()
			.x(d => x(d.year))
			.y(d => y(d.y1));
		const totalLine = d3.line()
			.x(d => x(d.year))
			.y(d => y(d.totalCost));
		const area = d3.area()
			.x(d => x(d.year))
			.y0(d => y(d.y0))
			.y1(d => y(d.y1));

		// define axes
		const xAxis = d3.axisBottom(x)
			.ticks(5)
			.tickFormat((num) => `Year ${num}`);
		const yAxis = d3.axisLeft()
			.tickFormat(d3.format('$,'));

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

		// add total line
		const totalLinePath = chart.append('path')
			.attr('class', 'total-line');


		// update function
		chart.updateData = (newData) => {
			// modify cost data to write "y0" and "y1" for stacked chart
			// create total cost data
			const yearData = [];
			const totalTrendData = [];
			newData[0].trendData.forEach((d, i) => {
				let totalCost = 0;
				newData.forEach((cap) => {
					cap.trendData[i].y0 = totalCost;
					totalCost += cap.trendData[i].totalCost;
					cap.trendData[i].y1 = totalCost;
				});

				totalTrendData.push({
					year: d.year,
					totalCost,
				});

				if (i % (1 / dt) === 0) {
					yearData.push({
						year: d.year,
						totalCost,
					});
				}
			});

			// define scales
			const maxCost = d3.max(totalTrendData, d => d.totalCost);
			y.domain([0, 1.1 * maxCost]);
			yAxis.scale(y);
			yAxisG.call(yAxis);

			// update total line
			totalLinePath
				.datum(totalTrendData)
				.transition()
					.duration(1000)
					.attr('d', totalLine);

			// add line and area for each capacity
			const lines = chart.selectAll('.line')
				.data(newData.map(d => d.trendData));
			lines.exit().remove();
			lines.enter().append('path')
				.attr('class', 'line')
				.merge(lines).transition()
					.duration(1000)
					.style('stroke', (d, i) => colorScale(i))
					.style('display', (d, i) => {
						return (i === newData.length - 1) ? 'none' : 'inline';
					})
					.attr('d', line);

			const areas = chart.selectAll('.area')
				.data(newData.map(d => d.trendData));
			areas.exit().remove();
			areas.enter().append('path')
				.attr('class', 'area')
				.each(function() {
					$(this).tooltipster({ maxWidth: 400, content: '' });
				})
				.merge(areas).transition()
					.duration(1000)
					.style('fill', (d, i) => {
						const color = d3.color(colorScale(i));
						color.opacity = 0.5;
						return color;
					})
					.attr('d', area)
					.each(function(d, i) {
						const capacity = newData[i];
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
							'</div>');
					});

			// add costs for each year from year 0 to year 5
			let labelGroups = chart.selectAll('.year-label-group')
				.data(yearData);
			labelGroups.exit().remove();
			const newLabelGroups = labelGroups.enter().append('g')
				.attr('class', 'year-label-group');
			newLabelGroups.append('line').attr('class', 'label-line');
			newLabelGroups.append('text').attr('class', 'label-text label-text-1');
			newLabelGroups.append('text').attr('class', 'label-text label-text-2');

			labelGroups = newLabelGroups.merge(labelGroups)
				.attr('transform', d => `translate(${x(d.year)}, 0)`);
			labelGroups.select('.label-line')
				.attr('y1', d => y(d.totalCost) - 55)
				.attr('y2', y(0));
			labelGroups.select('.label-text-1')
				.attr('x', 5)
				.attr('y', d => y(d.totalCost) - 35)
				.attr('dy', '.35em')
				.style('font-weight', 600)
				.text(d => moneyFormat(d.totalCost));
			labelGroups.select('.label-text-2')
				.attr('x', 5)
				.attr('y', d => y(d.totalCost) - 50)
				.attr('dy', '.35em')
				.text((d, i) => {
					if (i === 0) return 'Baseline Cost:';
					return `Year ${d3.format('.0f')(d.year)} Cost:`
				});
		};

		chart.updateData(data);
		return chart;
	}
})();

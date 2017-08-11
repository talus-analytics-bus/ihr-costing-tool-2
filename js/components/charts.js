const Charts = {};

(() => {
	Charts.buildRadialProgress = (selector, param={}) => {
		const margin = { top: 0, right: 15, bottom: 0, left: 15 };
		const radius = param.radius || 35;
		const chartContainer = d3.select(selector).append('svg')
			.attr('class', 'rp-chart')
			.attr('width', 2 * radius + margin.left + margin.right)
			.attr('height', 2 * radius + margin.top + margin.bottom)
		const chart = chartContainer.append('g')
			.attr('transform', `translate(${margin.left + radius}, ${margin.top + radius})`);

		const arcSep = param.arcSep || 10;
		const tau = 2 * Math.PI;
		const outerArc = d3.arc()
			.innerRadius(radius - arcSep)
			.outerRadius(radius)
			.startAngle(0);
		const innerArc = d3.arc()
			.innerRadius(radius - 2 * arcSep)
			.outerRadius(radius - arcSep)
			.startAngle(0);

		// add glow definitions to svg
		const defs = chartContainer.append('defs');
		const filter = defs.append('filter')
			.attr('id', 'blur');
		filter.append('feGaussianBlur')
			.attr('in', 'SourceGraphic')
			.attr('stdDeviation', '1');

		// add background
		chart.append('path')
			.attr('class', 'rp-background')
			.datum({ endAngle: tau })
			.attr('d', outerArc);

		// add outer and inner circle
		const outerCircle = chart.append('path')
			.attr('class', 'rp-outer')
			.datum({ endAngle: 0 })
			.attr('d', outerArc)
			.attr('filter', 'url(#blur)');
		const innerCircle = chart.append('path')
			.attr('class', 'rp-inner')
			.datum({ endAngle: 0 })
			.attr('d', innerArc)
			.attr('filter', 'url(#blur)');

		// add label text
		const label = chart.append('text')
			.attr('class', 'rp-text')
			.attr('dy', '.35em');

		// add update function
		chart.initValue = (values, text) => {
			outerCircle.transition()
				.duration(param.duration || 1500)
				.attrTween('d', arcTween(outerArc, values[0]));
			if (values.length > 1) {
				innerCircle.transition()
					.duration(param.duration || 1500)
					.attrTween('d', arcTween(innerArc, values[1]))
			}
			label.text(text || d3.format('.0%')(values[0]));
		}

		function arcTween(arc, newValue) {
			return function(d) {
				const interpolate = d3.interpolate(d.endAngle, newValue * tau);
				return function(t) {
					d.endAngle = interpolate(t);
					return arc(d);
				}
			}
		}

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
		const moneyFormat = d3.format('$,.3s');
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

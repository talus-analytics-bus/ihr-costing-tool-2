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
				.attrTween('d', arcTween(outerArc, values[0]));
			if (values.length > 1) {
				innerCircle.transition()
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

	Charts.buildCostChart = (selector, param={}) => {
		const margin = { top: 20, right: 15, bottom: 60, left: 65 };
		const width = 800;
		const height = 300;
		const chartContainer = d3.select(selector).append('svg')
			.attr('class', 'cost-chart')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);
		const chart = chartContainer.append('g')
			.attr('transform', `translate(${margin.left + radius}, ${margin.top + radius})`);

	}
})();

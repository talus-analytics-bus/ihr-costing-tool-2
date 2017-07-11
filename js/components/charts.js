const Charts = {};

(() => {

	Charts.buildCostPartitionChart = (selector, data) => {

		// Chart setup

		const width = 800, height = 250;
		const margin = {top: 50, right: 0, bottom: 50, left: 0};

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
		uniqIndicators.forEach((ind) => { 
			indicators.push({ name: ind, total: _.reduce(_.pluck(_.filter(data, d => d.indicator == ind) , 'cost'), (q,r) => (+q)+(+r)) }); 
		});
		uniqTypes.forEach((typ) => { 
			types.push({ name: typ, total: _.reduce(_.pluck(_.filter(data, d => d.type == typ) , 'cost'), (q,r) => (+q)+(+r)) }); 
		});
		uniqCategories.forEach((cat) => { 
			categories.push({ name: cat, total: _.reduce(_.pluck(_.filter(data, d => d.category == cat) , 'cost'), (q,r) => (+q)+(+r)) }); 
		});

		// Plot the nodes corresponding to type / expense category / indicator
		// Area is proportional to the total cost

		const minRadius = 5;
		const minTotal = _.min(_.pluck(indicators.concat(types).concat(categories), 'total'));
		const calcRadius = (total) => {
			return minRadius * Math.sqrt(total/minTotal);
		};

		types.forEach((typ, i) => {
			chart.append('circle')
				.attr('class', 'node')
				.attr('r', calcRadius(typ.total))
				.attr('cx', (i+1)/(types.length+1)*width)
				.attr('cy', 0)
		});
		indicators.forEach((ind, j) => {
			chart.append('circle')
				.attr('class', 'node')
				.attr('r', calcRadius(ind.total))
				.attr('cx', (j+1)/(indicators.length+1)*width)
				.attr('cy', height/2)
		});
		categories.forEach((cat, k) => {
			chart.append('circle')
				.attr('class', 'node')
				.attr('r', calcRadius(cat.total))
				.attr('cx', (k+1)/(categories.length+1)*width)
				.attr('cy', height)
		});

		// Plot the paths between each node

		types.forEach((typ, i) => {
			indicators.forEach((ind, j) => {
				cost = Math.round(_.reduce(_.pluck(_.filter(data, d => d.type == typ & d.indicator == ind), 'cost'), (q,r) => (+q)+(+r)));
				if (cost != 0) {
					const xtyp = (i+1)/(types.length+1)*width;
					const ytyp = 0;
					const xind = (j+1)/(indicators.length+1)*width;
					const yind = height/2;

					chart.append('path')
						.attr('class', 'node-link')
						.attr('d', `M ${xtyp} ${ytyp} C ${xtyp} ${(yind+ytyp)/2}, ${xind} ${(yind+ytyp)/2}, ${xind} ${yind}`)
				}
			});
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

})();

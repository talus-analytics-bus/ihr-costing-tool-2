const Charts = {};

(() => {

	Charts.buildCostPartitionChart = (selector) => {

		const width = 600, height = 300;
		const margin = {top: 50, right: 50, bottom: 50, left: 50};

		const chartContainer = d3.select(selector)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);
		const chart = chartContainer.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);


		// Vector containing number of nodes in each row top --> bottom
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
		}



	};

})();

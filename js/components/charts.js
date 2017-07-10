const Charts = {};

(() => {

	Charts.buildCostPartitionChart = (selector) => {

		const width = 800, height = 500;
		const margin = {top: 50, right: 50, bottom: 50, left: 50};

		const chartContainer = d3.select(selector)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);
		const chart = chartContainer.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`);


		// Vector containigng number of nodes in each row top --> bottom
		const nodes = [1, 3, 42, 6];
		const nodeSizes = [20, 15, 6, 10]

		y = (i) => {
			return (i/(nodes.length-1))*height;
		}

		x = (i, j) => {
			return ((j+1)/(nodes[i]+1))*width;
		}

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

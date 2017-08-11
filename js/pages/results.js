(() => {
	App.initResults = () => {
		// establish fake data
		const oldScore = 2.6;
		const newScore = 3.5;

		// establish other constants
		const scoreFormat = d3.format('.1f');

		// build score improvement charts
		const oldScoreChart = Charts.buildRadialProgress('.rp-score-old', {
			duration: 1500 * oldScore / newScore,
		})
			.initValue([oldScore / 5], scoreFormat(oldScore));
		const newScoreChart = Charts.buildRadialProgress('.rp-score-new', {
			duration: 1500,
		})
			.initValue([newScore / 5], scoreFormat(newScore))

		/* ------- Cost Chart ---------*/
		// establish fake data
		const dt = 0.1;  // in years
		const costByCapacityData = [];
		const costByCoreData = [];
		App.jeeTree.forEach((cc) => {
			const core = Object.assign({}, cc);
			core.startupCost = 0;
			core.recurringCost = 0;
			core.capitalCost = 0;

			cc.capacities.forEach((cap) => {
				const capacity = Object.assign({}, cap);
				capacity.startupCost = 10000 * Math.random();
				capacity.recurringCost = 1000 * Math.random();
				capacity.capitalCost = 1000 * Math.random();
				core.startupCost += capacity.startupCost;
				core.recurringCost += capacity.recurringCost;
				core.capitalCost += capacity.capitalCost;

				capacity.trendData = [];
				for (let i = 0; i <= 5; i += dt) {
					capacity.trendData.push({
						year: i,
						totalCost: capacity.startupCost + (i * capacity.recurringCost),
					});
				}

				costByCapacityData.push(capacity);
			});

			core.trendData = [];
			for (let i = 0; i <= 5; i+= dt) {
				core.trendData.push({
					year: i,
					totalCost: core.startupCost + (i * core.recurringCost),
				});
			}
			costByCoreData.push(core);
		});

		// build cost chart
		const costChart = Charts.buildCostChart('.cost-chart-container', costByCapacityData);

		// switching between showing cost by cc or capacity
		$('.view-cost-by-select').on('change', function() {
			const type = $(this).val();
			if (type === 'core') costChart.updateData(costByCoreData);
			else if (type === 'capacity') costChart.updateData(costByCapacityData);
		});
	}
})();

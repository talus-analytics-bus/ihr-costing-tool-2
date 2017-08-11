(() => {
	App.initResults = () => {
		// establish fake data
		const oldScore = 2.6;
		const newScore = 3.5;
		const costData = [

		];

		// establish other constants
		const scoreFormat = d3.format('.1f');

		// build score improvement charts
		const oldScoreChart = Charts.buildRadialProgress('.rp-score-old')
			.initValue([oldScore / 5], scoreFormat(oldScore));
		const newScoreChart = Charts.buildRadialProgress('.rp-score-new')
			.initValue([newScore / 5], scoreFormat(newScore))

		// build cost chart
		Charts.buildCostChart('.cost-chart-container', costData);
	}
})();

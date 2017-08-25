(() => {
	App.initResults = () => {
		// establish constants
		const scoreFormat = d3.format('.1f');
		const scoreChangeFormat = d3.format('+.1f');


		/* -------------------------- Demo Mode --------------------------*/
		if (App.demoMode) {
			App.jeeTree.forEach((cc) => {
				cc.capacities.forEach((cap) => {
					cap.indicators.forEach((ind) => {
						ind.score = Math.round(0.5 + 5 * Math.random());
					});
				});
			});
			App.updateAllCosts();
		}


		/* ---------------------- Data Wrangling ----------------------*/
		const allIndicators = [];
		App.jeeTree.forEach((cc) => {
			cc.capacities.forEach((cap) => {
				cap.indicators.forEach((ind) => {
					allIndicators.push(ind);
				});
			});
		});


		/* ---------------------- Score Improvement Section ----------------------*/
		const currScore = App.getAverageCurrentScore(allIndicators);
		const newScore = App.getAverageTargetScore(allIndicators);
		Charts.buildProgressChart('.progress-chart-overall', [currScore, newScore]);

		const totalCost = d3.sum(App.jeeTree, d => d.startupCost);
		Charts.buildCircleSummary('.circle-summary-total', totalCost, {
			radius: 100,
			label: 'Total',
		});


		const csb = d3.select('.circle-summary-section').selectAll('.circle-summary-box')
			.data(App.jeeTree)
			.enter().append('div');
		csb.append('div').attr('class', (d, i) => `circle-summary-${i}`);
		csb.append('div').attr('class', (d, i) => `progress-chart-${i}`);
		csb.each((d, i) => {
			const indicators = [];
			App.jeeTree[i].capacities.forEach((cap) => {
				cap.indicators.forEach(ind => indicators.push(ind));
			});
			const ccCurrScore = App.getAverageCurrentScore(indicators) || 0;
			const ccNewScore = App.getAverageTargetScore(indicators) || 0;

			Charts.buildCircleSummary(`.circle-summary-${i}`, App.jeeTree[i].startupCost, {
				label: App.jeeTree[i].name,
			});
			Charts.buildProgressChart(`.progress-chart-${i}`, [ccCurrScore, ccNewScore], {
				width: 150,
				height: 16,
				radius: 4,
			});
		});


		/* --------------------------- Cost Chart Section ---------------------------*/
		Charts.buildCostChart('.cost-chart', allIndicators);


		/* --------------------------- Filter Section ---------------------------*/
		// populate filters
		Util.populateSelect('.cc-select', App.jeeTree.map(d => d.name));
		
		let allCapacities = [];
		let chosenCapNames = [];
		App.jeeTree.forEach(cc => allCapacities = allCapacities.concat(cc.capacities));
		Util.populateSelect('.capacity-select', allCapacities.map(d => d.name));

		const categories = ['Consumable Materials', 'Durable Equipment', 'Human Capabilities', 'Physical Infrastructure', 'Technology', 'Tools and Processes'];
		Util.populateSelect('.category-select', categories);

		$('.cc-select').multiselect({
			includeSelectAllOption: true,
			numberDisplayed: 1,
			onChange: (option, checked) => {
				const capNamesSelected = App.jeeTree
					.find(cc => cc.name === option.val()).capacities
					.map(cap => cap.name);
				if (checked) {
					// user added a core capacity:
					// go through each capacity under the core capacity and add to list
					capNamesSelected.forEach((capName) => {
						if (!chosenCapNames.includes(capName)) chosenCapNames.push(capName);
					});
				} else {
					// user removed a core capacity:
					// go through list and remove all capacities under that core capacity
					chosenCapNames = chosenCapNames
						.filter(capName => !capNamesSelected.includes(capName));
				}
				updateDropdowns();
				updateExplorer();
			},
		});
		$('.capacity-select').multiselect({
			includeSelectAllOption: true,
			numberDisplayed: 0,
			onChange: (option, checked) => {
				const capName = option.val();
				if (checked) {
					// user added a capacity:
					if (!chosenCapNames.includes(capName)) chosenCapNames.push(capName);
				} else {
					// user removed a capacity:
					chosenCapNames = chosenCapNames.filter(cn => cn !== capName);
				}
				updateDropdowns();
				updateExplorer();
			},
		});
		$('.category-select').multiselect({
			includeSelectAllOption: true,
			numberDisplayed: 1,
			onChange: (option, checked) => {
				// TODO
				updateDropdowns();
				updateExplorer();
			},
		});

		function updateDropdowns() {
			// update core capacity dropdown
			const chosenCcs = [];
			const unchosenCcs = [];
			App.jeeTree.forEach((cc) => {
				const ccCapNames = cc.capacities.map(cap => cap.name);
				for (let i = 0; i < chosenCapNames.length; i++) {
					if (ccCapNames.includes(chosenCapNames[i])) {
						chosenCcs.push(cc.name);
						break;
					}
					if (i === chosenCapNames.length - 1) unchosenCcs.push(cc.name);
				}
			});
			$('.cc-select')
				.multiselect('select', chosenCcs, false)
				.multiselect('deselect', unchosenCcs, false);

			// update capacity dropdown
			const unchosenCapNames = allCapacities
				.filter(cap => !chosenCapNames.includes(cap.name))
				.map(cap => cap.name);
			$('.capacity-select')
				.multiselect('select', chosenCapNames, false)
				.multiselect('deselect', unchosenCapNames, false);
		}

		updateDropdowns();
	}
})();

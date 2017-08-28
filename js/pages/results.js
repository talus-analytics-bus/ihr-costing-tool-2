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
		const allCapacities = [];
		const allIndicators = [];
		App.jeeTree.forEach((cc) => {
			cc.capacities.forEach((cap) => {
				allCapacities.push(cap);
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
		const totalCostContainer = d3.select('.summary-text-total').append('div');
		totalCostContainer.append('div')
			.attr('class', 'total-cost-number')
			.text(App.moneyFormat(totalCost));
		totalCostContainer.append('div')
			.attr('class', 'total-cost-number-text')
			.text('Total Cost');

		const csb = d3.select('.summary-text-section').selectAll('.summary-text-box')
			.data(App.jeeTree)
			.enter().append('div')
				.attr('class', 'summary-text-box');
		csb.append('div').attr('class', (d, i) => `summary-text-${i}`);
		csb.append('div').attr('class', (d, i) => `progress-chart-${i}`);
		csb.each((d, i) => {
			const indicators = [];
			d.capacities.forEach((cap) => {
				cap.indicators.forEach(ind => indicators.push(ind));
			});
			const ccCurrScore = App.getAverageCurrentScore(indicators) || 0;
			const ccNewScore = App.getAverageTargetScore(indicators) || 0;

			const summaryText = `Cost for ${d.name}<br>core capacity`;
			addSummaryText(`.summary-text-${i}`, d.startupCost, summaryText);
			Charts.buildProgressChart(`.progress-chart-${i}`, [ccCurrScore, ccNewScore], {
				width: 180,
				height: 16,
				radius: 4,
			});
		});

		function addSummaryText(selector, cost, text, param={}) {
			const container = d3.select(selector).append('div')
				.attr('class', 'big-number-container');
			const value = container.append('div')
				.attr('class', 'big-number')
				.text(App.moneyFormat(cost));
			container.append('div')
				.attr('class', 'big-number-text')
				.html(text);
		}


		/* --------------------------- Cost Chart Section ---------------------------*/
		const capIndData = [];
		allCapacities.forEach((cap) => {
			cap.indicators.forEach((ind) => {
				const indCopy = Object.assign({}, ind);
				indCopy.capId = cap.id;
				capIndData.push(indCopy);
			});
		});
		Charts.buildCostChart('.cost-chart', capIndData);


		/* --------------------------- Filter Section ---------------------------*/
		// populate filters
		Util.populateSelect('.cc-select', App.jeeTree.map(d => d.name));
		
		let chosenCapNames = [];
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

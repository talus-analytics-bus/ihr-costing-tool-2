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


		/* ---------------------- Score Improvement Section ----------------------*/
		// build score improvement radial progress svgs
		const allIndicators = [];
		App.jeeTree.forEach((cc) => {
			cc.capacities.forEach((cap) => {
				cap.indicators.forEach((ind) => {
					allIndicators.push(ind);
				});
			});
		});

		const currScore = App.getAverageCurrentScore(allIndicators);
		Charts.buildRadialProgress('.rp-score-old', currScore);
		if (!currScore) {
			$('.score-improvement-warning')
				.slideDown()
				.on('click', () => hasher.setHash('scores'));
		}

		const newScore = App.getAverageTargetScore(allIndicators);
		Charts.buildRadialProgress('.rp-score-new', newScore);

		// build bullet charts
		const bulletData = App.jeeTree.map((cc) => {
			const scoreFormat = d3.format('.1f');
			const indicators = [];
			cc.capacities.forEach((cap) => {
				cap.indicators.forEach(ind => indicators.push(ind));
			});
			const oldScore = App.getAverageCurrentScore(indicators) || 0;
			const newScore = App.getAverageTargetScore(indicators) || 0;
			const newScoreText = newScore ? scoreFormat(newScore) : '?';
			return {
				name: cc.name,
				subtitle: `Avg. Score: ${newScoreText}`,
				ranges: [1, 3, 5],
				measures: [oldScore, newScore],
			};
		});
		const bulletCharts = Charts.buildBulletChart('.bullet-chart-container', bulletData);
		bulletCharts.selectAll('.value').style('display', d => d ? 'inline' : 'none');


		/* --------------------------- Cost Explorer Section ---------------------------*/
		// toggling filter display
		$('.explorer-filter-header').click(function() {
			const chevron = $(this).find('.chevron');
			if (chevron.hasClass('active')) {
				chevron.removeClass('active');
				$('.explorer-filter-content').slideUp();
			} else {
				chevron.addClass('active');
				$('.explorer-filter-content').slideDown();
			}
		});

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


		// build explorer list
		const expCcContainers = d3.select('.explorer-list-content').selectAll('.exp-cc')
			.data(App.jeeTree)
			.enter().append('div')
				.attr('class', 'exp-cc-container');
		const expCcs = expCcContainers.append('div')
			.attr('class', 'exp-row exp-cc')
			.on('click', (d) => {
				// TODO toggling core capacity
			});
		expCcs.append('input')
			.attr('type', 'checkbox')
			.property('checked', true)
			.on('change', (d) => {
				// TODO check/unchecking core capacity
			});
		expCcs.append('div')
			.attr('class', 'exp-list-label')
			.text(d => d.name);

		// add capacities
		const expCapContainers = expCcContainers.selectAll('.exp-cap-container')
			.data(d => d.capacities)
			.enter().append('div')
				.attr('class', 'exp-cap-container');
		const expCaps = expCapContainers.append('div')
			.attr('class', 'exp-row exp-cap')
			.on('click', (d) => {
				// TODO toggling capacity
			});
		expCaps.append('input')
			.attr('type', 'checkbox')
			.property('checked', true)
			.on('change', (d) => {
				// TODO check/unchecking capacity
			});
		expCaps.append('div')
			.attr('class', 'exp-list-label')
			.text(d => `${d.id.toUpperCase()} - ${d.name}`);

		// add indicators
		/*const expInds = expCapContainers.selectAll('.exp-ind')
			.data(d => d.indicators)
			.enter().append('div')
				.attr('class', 'exp-row exp-ind')
				.on('click', (d) => {
					// TODO toggling indicator
				});
		expInds.append('input')
			.attr('type', 'checkbox')
			.property('checked', true)
			.on('change', (d) => {
				// TODO check/unchecking indicator
			});
		expInds.append('div')
			.attr('class', 'exp-list-label')
			.text(d => d.id.toUpperCase());*/

		// functions for updating throughout the explorer
		function updateList() {

		}

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

		function updateExplorer() {
			// get data for updating
			let capData = [];
			if (chosenCapNames.length) {
				allCapacities.forEach((cap) => {
					if (chosenCapNames.includes(cap.name)) {
						capData.push(cap);
					}
				});
			} else {
				capData = allCapacities.slice(0);
			}

			// update summary text
			/*$('.summary-num-capacities').text(chosenCapNames.length);
			$('.summary-score-improvement').text(scoreChangeFormat(1.2));*/

			// update overall costs
			const totalStartup = d3.sum(capData, d => d.startupCost);
			const totalCapital = d3.sum(capData, d => d.capitalCost);
			const totalRecurring = d3.sum(capData, d => d.recurringCost);
			$('.explorer-startup-value').text(App.moneyFormat(totalStartup + totalCapital));
			$('.explorer-recurring-value').text(`${App.moneyFormat(totalRecurring)}/yr`);

			// update charts
			fixedCostChart.update([
				{
					name: 'Startup Cost',
					data: capData.map(c => ({ name: c.name, value: c.startupCost })),
				},
				{
					name: 'Capital Cost',
					data: capData.map(c => ({ name: c.name, value: c.capitalCost })),
				}
			]);
			recurringCostChart.update([
				{
					name: 'Recurring Cost',
					data: capData.map(c => ({ name: c.name, value: c.recurringCost })),
				}
			]);2
		}

		const fixedCostChart = Charts.buildCostBarChart('.explorer-fixed-cost-chart');
		const recurringCostChart = Charts.buildCostBarChart('.explorer-recurring-cost-chart', null, {
			height: 55,
			totalTextFormat: d => `${d}/yr total`,
		});

		updateDropdowns();
		updateExplorer();


		/* --------------------------- Cost Chart Section ---------------------------*/
		// switching between chart content
		$('.chart-tab-container .btn').on('click', function() {
			$(this).addClass('active')
				.siblings().removeClass('active');

			const ind = $(this).attr('ind');
			$('.chart-content').slideUp();
			$(`.chart-content[ind=${ind}]`).slideDown();
		});
		const activeInd = $('.chart-tab-container .btn.active').attr('ind');
		$(`.chart-content[ind=${activeInd}]`).show();


		// establish fake data
		const dt = 0.1;  // in years
		const costByCapacityData = [];
		const costByCoreData = [];
		App.jeeTree.forEach((core) => {
			core.capacities.forEach((capacity) => {
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

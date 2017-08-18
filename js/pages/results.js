(() => {
	App.initResults = () => {
		// establish fake data
		const oldScore = 2.6;
		const newScore = 3.5;

		App.jeeTree.forEach((core) => {
			core.startupCost = 0;
			core.recurringCost = 0;
			core.capitalCost = 0;

			core.capacities.forEach((capacity) => {
				capacity.startupCost = 10000 * Math.random();
				capacity.recurringCost = 1000 * Math.random();
				capacity.capitalCost = 6000 * Math.random();
				core.startupCost += capacity.startupCost;
				core.recurringCost += capacity.recurringCost;
				core.capitalCost += capacity.capitalCost;
			});
		});

		// establish other constants
		const scoreFormat = d3.format('.1f');
		const scoreChangeFormat = d3.format('+.1f');
		const moneyFormat = d3.format('$.3s');


		/* ---------------------- Score Improvement Section ----------------------*/
		// build score improvement charts
		const oldScoreChart = Charts.buildRadialProgress('.rp-score-old', oldScore, {
			duration: 1500 * oldScore / newScore,
		});
		const newScoreChart = Charts.buildRadialProgress('.rp-score-new', newScore, {
			duration: 1500,
		});

		// build bullet charts
		Charts.buildBulletChart('.bullet-chart-container', [
			{"ranges":[150,225,300],"measures":[220,270],"markers":[250]},
			{"ranges":[20,25,30],"measures":[21,23],"markers":[26]},
			{"ranges":[350,500,600],"measures":[100,320],"markers":[550]},
			{"ranges":[1400,2000,2500],"measures":[1000,1650],"markers":[2100]},
		]);


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
		let chosenCapNames = ['National Legislation, Policy, and Financing'];
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

		function updateExplorer() {
			// get data for updating
			const capData = [];
			let totalStartup = 0;
			let totalCapital = 0;
			let totalRecurring = 0;
			allCapacities.forEach((cap) => {
				const c = Object.assign({}, cap);
				c.selected = chosenCapNames.includes(cap.name);
				if (c.selected) {
					totalStartup += cap.startupCost;
					totalCapital += cap.capitalCost;
					totalRecurring += cap.recurringCost;
				}
				capData.push(c);
			});

			// update summary text
			$('.summary-num-capacities').text(chosenCapNames.length);
			$('.summary-score-improvement').text(scoreChangeFormat(1.2));

			// update overall costs
			$('.explorer-startup-value').text(moneyFormat(totalStartup));
			$('.explorer-capital-value').text(moneyFormat(totalCapital));
			$('.explorer-recurring-value').text(moneyFormat(totalRecurring));

			// update charts
			fixedCostChart.update([
				{
					name: 'Startup Cost',
					data: capData.map(c => ({ name: c.name, selected: c.selected, value: c.startupCost })),
				},
				{
					name: 'Capital Cost',
					data: capData.map(c => ({ name: c.name, selected: c.selected, value: c.capitalCost })),
				}
			]);
			recurringCostChart.update([
				{
					name: 'Recurring Cost',
					data: capData.map(c => ({ name: c.name, selected: c.selected, value: c.recurringCost })),
				}
			]);
		}

		const fixedCostChart = Charts.buildCostBarChart('.explorer-fixed-cost-chart');
		const recurringCostChart = Charts.buildCostBarChart('.explorer-recurring-cost-chart', null, {
			height: 55,
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

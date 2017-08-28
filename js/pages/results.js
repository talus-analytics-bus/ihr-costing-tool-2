(() => {
	App.initResults = () => {
		// establish constants
		let costType = 'total';
		let totalCostDuration = 1;


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

		function getCost(d) {
			if (costType === 'total') {
				let cost = d.startupCost + d.capitalCost;
				return cost += totalCostDuration * d.recurringCost;
			} else if (costType === 'startup') {
				return d.startupCost;
			} else if (costType === 'capital') {
				return d.capitalCost;
			} else if (costType === 'recurring') {
				return d.recurringCost;
			}
			return 0;
		}


		/* ---------------------- Cost Type Section ----------------------*/
		$('.cost-type-row button').on('click', function onClick() {
			$(this).addClass('active')
				.siblings().removeClass('active');
			costType = $(this).attr('value');
			if (costType === 'total') $('.cost-duration-row').slideDown();
			else $('.cost-duration-row').slideUp();
			updateResults();
		});
		$('.cost-duration-row button').on('click', function onClick() {
			$(this).addClass('active')
				.siblings().removeClass('active');
			totalCostDuration = +$(this).attr('value');
			updateResults();
		});


		/* ---------------------- Updating Functions ----------------------*/
		function updateResults() {
			updateSummaryCosts();
		}


		/* ---------------------- Score Improvement Section ----------------------*/
		const currScore = App.getAverageCurrentScore(allIndicators);
		const newScore = App.getAverageTargetScore(allIndicators);
		Charts.buildProgressChart('.progress-chart-overall', [currScore, newScore]);

		const stb = d3.select('.summary-text-section').selectAll('.summary-text-box')
			.data(App.jeeTree)
			.enter().append('div')
				.attr('class', 'summary-text-box');
		stb.append('div')
			.attr('class', 'big-number-text')
			.html(d => `${d.name} Cost`);
		stb.append('div').attr('class', 'big-number');

		// initialize total cost number so transition works
		d3.select('.total-cost-number').text(App.moneyFormat(1e6));

		
		function updateSummaryCosts() {
			// update total cost
			const totalCost = d3.sum(App.jeeTree, d => getCost(d));
			d3.select('.total-cost-number').transition()
				.duration(1000)
				.tween('text', function tweenFunc() {
					const that = d3.select(this);
					const i = d3.interpolateNumber(Util.strToFloat(that.text()), totalCost);
					return t => that.text(App.moneyFormat(i(t)));
				});

			// update core capacity costs
			d3.selectAll('.summary-text-box .big-number').text((d) => {
				return App.moneyFormat(getCost(d));
			});
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
		Charts.buildCostChart('.cost-chart-container', capIndData);


		/* --------------------------- Filter Section ---------------------------*/
		/*// populate filters
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

		updateDropdowns();*/

		updateResults();
	}
})();

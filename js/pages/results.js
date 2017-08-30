(() => {
	App.initResults = () => {
		// establish constants
		let costChartCategory = 'capacity';
		let costType = 'total';
		let totalCostDuration = 1;


		/* -------------------------- Demo Mode --------------------------*/
		if (App.demoMode) {
			App.jeeTree.forEach((cc) => {
				cc.capacities.forEach((cap) => {
					cap.indicators.forEach((ind) => {
						ind.score = Math.round(0.5 + 5 * Math.random());
						ind.actions.forEach((a) => {
							a.inputs.forEach(input => input.costed = true);
						});
					});
				});
			});
			App.updateAllCosts();
		}


		/* ---------------------- Data Wrangling ----------------------*/
		const allCores = [];
		const allCapacities = [];
		const allIndicators = [];
		const allActions = [];

		const indicatorsByTag = [];
		const tagCostDict = {};
		
		App.jeeTree.forEach((cc) => {
			let ccHasOneComplete = false;

			cc.capacities.forEach((cap) => {
				let capHasOneComplete = false;

				cap.indicators.forEach((ind) => {
					if (App.isIndicatorComplete(ind)) {
						ccHasOneComplete = true;
						capHasOneComplete = true;

						const indCopy = Object.assign({}, ind);
						indCopy.ccId = cc.id;
						indCopy.capId = cap.id;

						allIndicators.push(indCopy);

						indCopy.costByTag = {};
						const actions = App.getNeededActions(indCopy);
						actions.forEach((a) => {
							allActions.push(Object.assign({}, a));

							const inputs = App.getNeededInputs(a.inputs, indCopy.score);
							inputs.forEach((input) => {
								// get function tag distribution by looking at line item costs
								// TODO should be calculating distribution for recurring/startup cost separately
								const distByTag = {};
								const lineItems = App.getNeededLineItems(input.line_items, indCopy.score);
								const totalCost = d3.sum(lineItems, li => li.cost);
								lineItems.forEach((li) => {
									const tag = li.function_tag;
									if (!distByTag[tag]) distByTag[tag] = 0;
									if (totalCost) distByTag[tag] += li.cost / totalCost;
									else distByTag[tag] += 1;
								});

								for (let tag in distByTag) {
									if (!indCopy.costByTag[tag]) {
										indCopy.costByTag[tag] = {
											startupCost: 0,
											capitalCost: 0,
											recurringCost: 0,
										};
									}
									if (input.isCustomCost) {
										indCopy.costByTag[tag].startupCost += Math.round(distByTag[tag] * input.customStartupCost);
										indCopy.costByTag[tag].recurringCost += Math.round(distByTag[tag] * input.customRecurringCost);
									} else {
										indCopy.costByTag[tag].startupCost += Math.round(distByTag[tag] * input.startupCost);
										indCopy.costByTag[tag].capitalCost += Math.round(distByTag[tag] * input.capitalCost);
										indCopy.costByTag[tag].recurringCost += Math.round(distByTag[tag] * input.recurringCost);
									}
								}
							});
						});

						// push to data
						for (let tag in indCopy.costByTag) {
							if (tag) {
								// add an indicator/tag combo to array
								const indClone = Object.assign({}, indCopy);
								const tagCosts = indCopy.costByTag[tag];
								if (tag.indexOf('Planning') === 0 || tag.indexOf('Analysis') === 0) {
									indClone.category_tag = tag.split(' ')[0];
								} else {
									indClone.category_tag = tag;
								}
								for (let c in tagCosts) {
									indClone[c] = tagCosts[c];
								}
								indicatorsByTag.push(indClone);

								// add to total tag cost
								if (!tagCostDict[tag]) {
									tagCostDict[tag] = {
										startupCost: 0,
										capitalCost: 0,
										recurringCost: 0,
									};
								}
								for (let c in tagCosts) {
									tagCostDict[tag][c] += tagCosts[c];
								}
							}
						}
					}
				});

				if (capHasOneComplete) allCapacities.push(cap);
			});

			if (ccHasOneComplete) allCores.push(cc);
		});

		if (!allCores.length) {
			$('.results-content').hide();
			$('.results-empty-content')
				.on('click', () => hasher.setHash('scores/p-1/1'))
				.show();
			return;
		}

		function getChartData() {
			let indData;
			if (costChartCategory === 'capacity') {
				indData = allIndicators;
			} else if (costChartCategory === 'category') {
				indData = indicatorsByTag;
			}

			// apply filters to indicators
			const ccIds = $('.cc-select').val();
			indData = indData.filter(ind => ccIds.includes(ind.ccId));

			return indData;
		}

		function getChartCategoryFunc() {
			if (costChartCategory === 'capacity') {
				return d => d.capId.toUpperCase();
			} else if (costChartCategory === 'category') {
				return d => d.category_tag;
			}
			return d => 0;
		}

		function getCostFunc() {
			if (costType === 'total') {
				return d => d.startupCost + d.capitalCost + (totalCostDuration * d.recurringCost);
			} else if (costType === 'startup') {
				return d => d.startupCost;
			} else if (costType === 'capital') {
				return d => d.capitalCost;
			} else if (costType === 'recurring') {
				return d => d.recurringCost;
			}
			return d => 0;
		}

		function getCost(d) {
			return getCostFunc()(d);
		}


		/* ---------------------- Updating Functions ----------------------*/
		function updateResults() {
			updateSummaryCosts();
			updateCostChart();
		}

		function updateCostChart() {
			costChart.update(getChartData(), getChartCategoryFunc(), getCostFunc());
			updateCostChartXAxis();
			updateCostChartYAxis();
		}

		function updateCostChartXAxis() {
			// update x axis label
			let xLabel = '';
			if (costChartCategory === 'capacity') {
				xLabel = 'Capacity';
			} else if (costChartCategory === 'category') {
				xLabel = 'Function';
			}
			costChart.updateXAxisLabel(xLabel);
		}

		function updateCostChartYAxis() {
			// update y axis label
			let prefix = '';
			if (costType === 'total') {
				prefix = `${totalCostDuration}-Year`;
			} else {
				prefix = costType.charAt(0).toUpperCase() + costType.slice(1);
			}
			costChart.updateYAxisLabel(`${prefix} Cost`);
		}


		/* ---------------------- Instructions Section ----------------------*/
		$('.num-costed-indicators').text(allIndicators.length);
		$('.num-costed-capacities').text(allCapacities.length);


		/* ---------------------- Switching to Table Section ----------------------*/
		$('.view-table-button').on('click', function() {
			const $this = $(this);
			$this.toggleClass('active');
			const isActive = $this.hasClass('active');
			$this.text(isActive ? 'View Charts' : 'View Data Table');
			$('.results-main-content, .results-table-content').slideToggle();
		});


		/* ---------------------- Cost Type Section ----------------------*/
		$('.cost-type-row button').on('click', function onClick() {
			costType = $(this).attr('value');

			$(`.cost-type-row button[value="${costType}"]`).addClass('active')
				.siblings().removeClass('active');
			if (costType === 'total') $('.cost-duration-row').slideDown();
			else $('.cost-duration-row').slideUp();

			updateSummaryCosts();
			updateCostChartYAxis();
			costChart.update(null, null, getCostFunc());
		});
		$('.cost-duration-row button').on('click', function onClick() {
			totalCostDuration = +$(this).attr('value');

			$(`.cost-duration-row button[value="${totalCostDuration}"]`).addClass('active')
				.siblings().removeClass('active');

			updateSummaryCosts();
			updateCostChartYAxis();
			costChart.update(null, null, getCostFunc());
		});


		/* ---------------------- Cost Chart Filter Section ----------------------*/
		$('.view-cost-by-box .filter-row').on('click', function onClick() {
			const $row = $(this);
			$row.find('input').prop('checked', true);
			$row.siblings('.filter-row').find('input').prop('checked', false);
			costChartCategory = $row.attr('value');
			updateCostChart();
		});
		$('.reset-button').on('click', () => {
			// resets chart
			// TODO possibly resets filters
			updateCostChart();
		});


		/* ---------------------- Score Improvement Section ----------------------*/
		const currScore = App.getAverageCurrentScore(allIndicators);
		const newScore = App.getAverageTargetScore(allIndicators);
		Charts.buildProgressChart('.progress-chart-overall', [currScore, newScore]);

		const stb = d3.select('.summary-text-section').selectAll('.summary-text-box')
			.data(App.jeeTree)
			.enter().append('div')
				.attr('class', 'summary-text-box');
		stb.append('div')
			.attr('class', (d) => {
				let indicators = [];
				d.capacities.forEach((cap) => {
					indicators = indicators.concat(cap.indicators);
				});
				const currScore = App.getAverageCurrentScore(indicators);

				let color = 'green';
				if (currScore < 2) color = 'red';
				else if (currScore < 4) color = 'yellow';
				return `summary-text-box-veil ${color}`;
			});
		const stbContent = stb.append('div')
			.attr('class', 'summary-text-box-content');
		stbContent.append('div')
			.attr('class', 'big-number-text')
			.html(d => `${d.name} Cost`);
		stbContent.append('div').attr('class', 'big-number');

		// initialize total cost number so transition works
		d3.select('.total-cost-number').text(App.moneyFormat(1e6));


		function updateSummaryCosts() {
			// update total cost
			const totalCost = d3.sum(App.jeeTree, d => getCost(d));
			animateText('.total-cost-number', totalCost);

			// update core capacity costs
			d3.selectAll('.summary-text-box .big-number').each(function animate(d) {
				animateText(this, getCost(d));
			});
		}

		function animateText(selector, newValue) {
			const element = d3.select(selector);
			if (isNaN(Util.strToFloat(element.text()))) element.text(App.moneyFormat(1e6));
			element.transition()
				.duration(300)
				.tween('text', function tweenFunc(d) {
					const that = d3.select(this);
					const i = d3.interpolateNumber(Util.strToFloat(that.text()), newValue);
					return t => that.text(App.moneyFormat(i(t)));
				});
			// element.text(App.moneyFormat(newValue));
		}


		/* --------------------------- Chart Sections ---------------------------*/
		// initialize cost chart
		const costChart = Charts.buildCostChart('.cost-chart-container');

		// initialize bubble chart
		/*const bubbleChart = Charts.buildBubblePack('.bubble-chart', tagCostDict, {
			costType,
			totalCostDuration,
		});*/


		/* --------------------------- Filter Section ---------------------------*/
		// populate filters
		Util.populateSelect('.cc-select', App.jeeTree, {
			nameKey: 'name',
			valKey: 'id',
			selected: true,
		});
		Util.populateSelect('.capacity-select', allCapacities, {
			nameKey: 'name',
			valKey: 'id',
			selected: true,
		});
		Util.populateSelect('.category-select', [1, 2, 3], {
			selected: true,
		});
		$('.cc-select, .capacity-select, .category-select').multiselect({
			includeSelectAllOption: true,
			numberDisplayed: 1,
			buttonClass: 'btn btn-secondary',
			onChange: (option, checked) => {
				/*const capNamesSelected = App.jeeTree
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
				updateDropdowns();*/
				updateCostChart();
			},
		});



		/*$('.capacity-select').multiselect({
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


		/* ---------------------- Building Table Section ----------------------*/
		// behavior for switching between tree levels
		$('.table-tab-container button').on('click', function() {
			$(this).addClass('active')
				.siblings().removeClass('active');
			const level = $(this).val();
			$('.table-container').slideUp();
			$(`.${level}-table-container`).slideDown();
		});

		// establish table schema
		const tableSchema = [
			{
				name: '[level] ID',
				getValue: d => d.id.toUpperCase(),
			}, {
				name: '[level] Name',
				getValue: d => d.name,
			}, {
				name: 'Startup Cost',
				className: 'cost',
				format: App.moneyFormatLong,
				getValue: d => d.startupCost,
			}, {
				name: 'Capital Cost',
				className: 'cost',
				format: App.moneyFormatLong,
				getValue: d => d.capitalCost,
			}, {
				name: 'Recurring Cost',
				className: 'cost',
				format: App.moneyFormatLong,
				getValue: d => d.recurringCost,
			}, {
				name: '1-Year Cost',
				className: 'cost',
				format: App.moneyFormatLong,
				getValue: d => d.startupCost + d.capitalCost + d.recurringCost,
			}, {
				name: '3-Year Cost',
				className: 'cost',
				format: App.moneyFormatLong,
				getValue: d => d.startupCost + d.capitalCost + 3 * d.recurringCost,
			}, {
				name: '5-Year Cost',
				className: 'cost',
				format: App.moneyFormatLong,
				getValue: d => d.startupCost + d.capitalCost + 5 * d.recurringCost,
			}
		];
 

		// build the table
		function buildTable(selector, data, levelName) {
			const table = d3.select(selector);
			table.append('thead').append('tr').selectAll('th')
				.data(tableSchema)
				.enter().append('th')
					.attr('class', d => d.className || '')
					.text(d => d.name.replace('[level]', levelName));
			const tbody = table.append('tbody');
			const rows = tbody.selectAll('tr')
				.data(data)
				.enter().append('tr');
			rows.selectAll('td')
				.data(d => tableSchema.map(t => ({ rowData: d, colData: t })))
				.enter().append('td')
					.attr('class', d => d.colData.className || '')
					.text((d) => {
						const format = d.colData.format || (v => v);
						return format(d.colData.getValue(d.rowData));
					});

			// add total row
			const totalRow = tbody.append('tr').attr('class', 'total-row');
			totalRow.selectAll('td')
				.data(tableSchema)
				.enter().append('td')
					.attr('class', 'cost')
					.text((d) => {
						if (d.className === 'cost') {
							return App.moneyFormatLong(d3.sum(data, d.getValue));
						}
						return '';
					});
		}

		buildTable('.core-table', allCores, 'Core Element');
		buildTable('.capacity-table', allCapacities, 'Capacity');
		buildTable('.indicator-table', allIndicators, 'Indicator');
		buildTable('.action-table', allActions, 'Action');

		//$('.results-table').dataTable();

		$('.capacity-table-container').show();


		/* --------------------------- Export Section ---------------------------*/
		$('.export-data-button').on('click', () => {

		});
		$('.export-session-button').on('click', () => {
			const sessionData = App.getSessionData();

			// set file name
			const today = new Date();
			const year = today.getFullYear();
			let month = String(today.getMonth() + 1);
			if (month.length === 1) month = `0${month}`;
			let day = String(today.getDate());
			if (day.length === 1) day = `0${day}`;
			const yyyymmdd = `${year}${month}${day}`;
			const fileName = `${App.whoAmI.abbreviation}${yyyymmdd}`;

			App.downloadText(fileName, sessionData);
		});
	}
})();

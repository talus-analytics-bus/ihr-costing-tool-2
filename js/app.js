const App = {};

(() => {
	App.demoMode = true;
	App.scoreLabels = {
		1: 'No Capacity',
		2: 'Limited Capacity',
		3: 'Developed Capacity',
		4: 'Demonstrated Capacity',
		5: 'Sustainable Capacity',
	};

	// TODO move this function to appropriate place in code
	App.exportLineItems = () => {

		// get needed actions with needed line items
		let indArray = [];
		App.jeeTree.forEach((cc) => {
		    cc.capacities.forEach((cap) => {
		        cap.indicators.forEach((ind) => {
		            indArray = indArray.concat(ind);
		            // const actions = App.getNeededActions(ind);
		            // actions.forEach((a) => {
		            //     const inputs = App.getNeededInputs(a.inputs, ind.score);
		            //     // inputs.forEach((i) => {
		            //     //     const lineItems = App.getNeededLineItems(i.line_items, ind.score);
		            //     // });
		            // });
		        });
		    });
		});


		// inputArray.forEach(function(input) {
		// 	input.line_items.forEach(function(lineItem) {
		// 		delete lineItem.where_find_base_cost;
		// 		delete lineItem.staff_multiplier_modified;
		// 		delete lineItem.function_tag;
		// 		delete lineItem.category_tag;
		// 		delete lineItem.base_cost_modified;
		// 		delete lineItem.user_included_in_costing;
		// 		delete lineItem.description;
		// 		delete lineItem.references;
		// 		console.log(lineItem);
		// 	});
		// });

		console.log(indArray)

		var xhr = new XMLHttpRequest();
		// const xhrParams = '?inputs=' + JSON.stringify([{meow:1}]);
		// const xhrParams = '';
		// const xhrParams = '?inputs=' + encodeURIComponent(JSON.stringify(inputArray));
		xhr.open('POST', '/lineItemExport', true);
		xhr.responseType = 'blob';
		xhr.setRequestHeader('Content-type', 'application/json');
		xhr.onload = function(e) {
		    if (this.status == 200) {
		        var blob = new Blob([this.response], {type: 'application/vnd.ms-excel'});
		        var downloadUrl = URL.createObjectURL(blob);
		        var a = document.createElement("a");
		        a.href = downloadUrl;
		        a.download = "IHR Costing Tool - Line Item Export.xlsx";
		        document.body.appendChild(a);
		        a.click();
		    } else {
		    	// TODO show error
		    }
		};
		// xhr.send('inputs=ipsum');
		// console.log(inputArray)
		xhr.send(JSON.stringify({indicators: indArray}));

		// $.get('lineItemExport', data2) // PASS THE DATA AS THE SECOND PARAMETER
		//     .success(
		//         function(success){
		//             console.log(success)
		//         })
		//     .error(
		//         function(error){
		//             console.log(error)
		//         });

		// $.get('lineItemExport', JSON.stringify({inputs: inputArray}), function(data) {
		// 	console.log(data);
		// });

		// $.ajax({
		// 	type: 'post',
		// 	// data: params.filters,
		// 	// data: JSON.stringify({meow: 'inputArray'}),
		// 	data: JSON.stringify({inputs: inputArray}),
		// 	// headers: {'Authorization-Token': '20lQLz13fgES56ngXYqnGDQTRPqY5bF7'},
		// 	url: 'lineItemExport',
		// 	headers: {
		//         'Content-Type': 'application/json'
		//         // 'Content-Length': Buffer.byteLength(data)
		//     },
		// 	success: function(data) {
		// 		console.log(data);
		// 		// // if using simulation data, ignore any calls from before the day of the sim at 8am
		// 		// const filterSimData = true;
		// 		// if (App.useSimData && filterSimData) {
		// 		// 	let simEarliestTime = new Date('6/28/2017');
		// 		// 	simEarliestTime.setHours(0);
		// 		// 	simEarliestTime.setMinutes(0);
		// 		// 	simEarliestTime.setSeconds(0);

		// 		// 	let simLatestTime = new Date('6/28/2017');
		// 		// 	simLatestTime.setHours(23);
		// 		// 	simLatestTime.setMinutes(59);
		// 		// 	simLatestTime.setSeconds(59);

		// 		// 	let tempData = data;
		// 		// 	let outputData = [];
		// 		// 	tempData.data.forEach(d => {
		// 		// 		const curStamp = new Date(d.Client_CreateStamp);
		// 		// 		if ( curStamp >= simEarliestTime && curStamp <= simLatestTime) outputData.push(d);
		// 		// 	});
		// 		// 	// console.log(outputData)
		// 		// 	tempData.data = outputData;
		// 		// 	callback(tempData);

		// 		// } else {
		// 		// 	// console.log(data)
		// 		// 	callback(data);
		// 		// 	// callback(JSON.parse(data));
		// 		// }
		// 	},
		// 	error: function(){
		// 		console.log('error');
		// 	}
		// });


	};

	// initialize basic app behaviors
	App.initialize = (callback) => {

		// initiate behavior for navigation links
		$('.tool-name').click(() => hasher.setHash(''));
		$('.nav-item').click(function() {
			// dropdown lists do not have associated pages
			const page = $(this).attr('page');
			if (typeof page !== 'undefined') hasher.setHash(page);
		});

		// add the hrefs to the dropdown menu items
		$('.dropdown-item').click(function() {
				hasher.setHash($(this).attr('page'));
		});

		// load country params data
		d3.queue()
			.defer(d3.json, 'data/country_specific_parameters.json')
			.defer(d3.json, 'data/jee_costing_data.json')
			.defer(d3.json, 'data/currencies.json')
			.defer(d3.json, 'data/global_base_costs.json')
			.defer(d3.json, 'data/global_staff_multipliers.json')
			.await((error, countryParams, jeeTree, currencies, globalBaseCosts, globalStaffMultipliers) => {
				if (error) {
					noty({
						type: 'error',
						text: 'Error loading data files. Please contact the tool administrator',
					});
					return;
				}

				App.countryParams = countryParams;
				App.jeeTree = jeeTree;
				App.currencies = currencies;
				App.globalBaseCosts = globalBaseCosts;
				App.globalStaffMultipliers = globalStaffMultipliers;
				App.whoAmI = {};

				// default to US if in demo mode
				if (App.demoMode) {
					const usObj = App.countryParams.find(d => d.abbreviation === 'CH');
					App.whoAmI = Object.assign({}, usObj);
				}

				// add costs to each level of the jeeTree
				App.updateAllCosts({
					setInputsToSelected: true,
				});
				
				// launch callback fcn in arguments
				callback();
			});
	}


	/* ------------------ Formatting Functions ------------------- */
	App.siFormat = (num) => {
		return d3.format(',.3s')(num).replace('G', 'B');
	}

	App.numberFormat = (num) => {
		if (num <= 100) return Math.round(num);
		if (num <= 1e6) return d3.format(',.3r')(num);
		return App.siFormat(num);
	}

	App.moneyFormat = (num) => {
		return `${App.numberFormat(num)} ${App.whoAmI.currency_iso}`;
	}

	App.moneyFormatShort = (num) => {
		return `${App.siFormat(num)} ${App.whoAmI.currency_iso}`;
	}

	App.moneyFormatLong = (num) => {
		return `${d3.format(',')(num)} ${App.whoAmI.currency_iso}`;
	}


	/* ------------------ jeeTree Getter Functions ------------------- */
	App.normalCcIds = ['p', 'd', 'r'];

	// gets the capacity from the jeeTree given an id
	App.getCapacity = (id) => {
		const ccId = id.includes('.') ? id.split('.')[0].toLowerCase() : 'o';
		const capId = id.toLowerCase();
		const cc = App.jeeTree.find(cc => cc.id === ccId);
		if (!cc) return null;
		return cc.capacities.find(cap => cap.id === capId);
	}

	// gets the indicator from the jeeTree given an id
	App.getIndicator = (id) => {
		const dotTierNum = (App.normalCcIds.includes(id.split('.')[0])) ? 2 : 1;
		const capId = id.split('.').slice(0, dotTierNum).join('.').toLowerCase();
		const indId = id.toLowerCase();
		const cap = App.getCapacity(capId);
		if (!cap) return null;
		return cap.indicators.find(ind => ind.id === indId);
	}

	// gets the previous indicator given an indicator
	App.getPrevIndicator = (capId, indId) => {
		const ccId = capId.includes('.') ? capId.split('.')[0].toLowerCase() : 'o';
		const ccIndex = App.jeeTree.findIndex(cc => cc.id === ccId);
		const cc = App.jeeTree[ccIndex];
		const capIndex = cc.capacities.findIndex(cap => cap.id === capId);
		const cap = cc.capacities[capIndex];
		const indIndex = cap.indicators.findIndex(ind => ind.id === indId);
		if (indIndex > 0) {
			return cap.indicators[indIndex - 1];
		} else {
			// go to prev capacity
			if (capIndex > 0) {
				const prevCap = cc.capacities[capIndex - 1];
				return prevCap.indicators[prevCap.indicators.length - 1];
			} else {
				// go to next core capacity
				if (ccIndex > 0) {
					const prevCc = App.jeeTree[ccIndex - 1];
					const prevCap = prevCc.capacities[prevCc.capacities.length - 1];
					return prevCap.indicators[prevCap.indicators.length - 1];
				} else {
					// that's the beginning!
					return null;
				}
			}
		}
	}

	// gets the next indicator given an indicator
	App.getNextIndicator = (capId, indId) => {
		const ccId = capId.includes('.') ? capId.split('.')[0].toLowerCase() : 'o';
		const ccIndex = App.jeeTree.findIndex(cc => cc.id === ccId);
		const cc = App.jeeTree[ccIndex];
		const capIndex = cc.capacities.findIndex(cap => cap.id === capId);
		const cap = cc.capacities[capIndex];
		const indIndex = cap.indicators.findIndex(ind => ind.id === indId);
		if (indIndex < cap.indicators.length - 1) {
			return cap.indicators[indIndex + 1];
		} else {
			// go to next capacity
			if (capIndex < cc.capacities.length - 1) {
				return cc.capacities[capIndex + 1].indicators[0];
			} else {
				// go to next core capacity
				if (ccIndex < App.jeeTree.length - 1) {
					return App.jeeTree[ccIndex + 1].capacities[0].indicators[0];
				} else {
					// that's the end!
					return null;
				}
			}
		}
	}

	// gets the action from the jeeTree given an id
	App.getAction = (id) => {
		const dotTierNum = (App.normalCcIds.includes(id.split('.')[0])) ? 3 : 2;
		const indId = id.split('.').slice(0, dotTierNum).join('.').toLowerCase();
		const actionId = id.toLowerCase();
		const ind = App.getIndicator(indId);
		if (!ind) return null;
		return ind.actions.find(a => a.id === actionId);
	}

	// gets the input from the jeeTree given an id
	App.getInput = (id) => {
		const dotTierNum = (App.normalCcIds.includes(id.split('.')[0])) ? 4 : 3;
		const actionId = id.split('.').slice(0, dotTierNum).join('.').toLowerCase();
		const inputId = id.toLowerCase();
		const action = App.getAction(actionId);
		if (!action) return null;
		return action.inputs.find(input => input.id === inputId);
	}

	// gets the line item from the jeeTree given an id
	App.getLineItem = (id) => {
		const dotTierNum = (App.normalCcIds.includes(id.split('.')[0])) ? 5 : 4;
		const inputId = id.split('.').slice(0, dotTierNum).join('.').toLowerCase();
		const liId = id.toLowerCase();
		const input = App.getInput(inputId);
		if (!input) return null;
		return input.line_items.find(li => li.id === liId);
	}


	/* ------------------ Scoring Functions ------------------- */
	// get the actions that satisfy the user's target score
	App.getNeededActions = (ind) => {
		// if indicator is not scored, display all actions for the user to see
		if (!ind.score) return ind.actions;

		// find actions that match the target score
		return ind.actions.filter((action) => {
			return App.getNeededInputs(action.inputs, ind.score).length;
		});
	}

	App.getNeededInputs = (inputs, score) => {
		if (!score) return inputs;
		return inputs.filter((input) => {
			return App.getNeededLineItems(input.line_items, score).length;
		})
	}

	App.getNeededLineItems = (lineItems, score) => {
		if (!score) return lineItems;
		if (User.targetScoreType === 'step') {
			return lineItems.filter((li) => {
				return li.score_step_to.includes(String(+score + 1));
			});
		} else if (User.targetScoreType === 'target') {
			const scoresToGetTo = d3.range(+score + 1, User.targetScore + 1);
			return lineItems.filter((li) => {
				for (let k = 0; k < li.score_step_to.length; k++) {
					if (scoresToGetTo.includes(+li.score_step_to[k])) return true;
				}
				return false;
			});
		}
		return [];
	}

	// returns average score for a set of given indicators
	App.getAverageCurrentScore = (inds) => {
		const indScores = [];
		inds.forEach((ind) => {
			if (ind.score) indScores.push(ind.score);
		});
		return d3.mean(indScores);
	}

	// returns average new score for a set of given indicators
	App.getAverageTargetScore = (inds) => {
		const newIndScores = [];
		inds.forEach((ind) => {
			if (ind.score) {
				if (User.targetScoreType === 'step') {
					if (ind.score === 5) newIndScores.push(5);
					else newIndScores.push(ind.score + 1);
				} else if (User.targetScoreType === 'target') {
					if (ind.score > User.targetScore) newIndScores.push(ind.score);
					else newIndScores.push(User.targetScore);
				}
			}
		});
		return d3.mean(newIndScores);
	}


	/* ------------------ Cost Functions ------------------- */
	// sets/updates the costs for all levels of the jeeTree
	App.updateAllCosts = (param={}) => {
		const exchangeRate = App.getExchangeRate();

		// loop through each tier of the tree
		App.jeeTree.forEach((cc) => {
			cc.startupCost = 0;
			cc.capitalCost = 0;
			cc.recurringCost = 0;

			cc.capacities.forEach((cap) => {
				cap.startupCost = 0;
				cap.capitalCost = 0;
				cap.recurringCost = 0;

				cap.indicators.forEach((ind) => {
					ind.startupCost = 0;
					ind.capitalCost = 0;
					ind.recurringCost = 0;

					const actions = App.getNeededActions(ind);
					actions.forEach((a) => {
						a.startupCost = 0;
						a.capitalCost = 0;
						a.recurringCost = 0;

						a.inputs.forEach((input) => {
							input.startupCost = 0;
							input.capitalCost = 0;
							input.recurringCost = 0;

							// set inputs to user-selected (usually on init)
							if (param.setInputsToSelected) input.selected = true;

							input.line_items.forEach((li) => {
								const costObj = App.globalBaseCosts.find((gbc) => {
									return gbc.id === li.base_cost;
								});
								li.cost = costObj ? costObj.cost : 0;

								// include multipliers
								if (li.staff_multiplier) {
									const multiplierObj = App.globalStaffMultipliers.find((sm) => {
										return sm.id === li.staff_multiplier;
									});
									if (multiplierObj) li.cost *= multiplierObj.count;
								}
								if (li.country_multiplier && App.whoAmI.name) {
									const multiplier = App.whoAmI.multipliers[li.country_multiplier];
									if (multiplier) li.cost *= multiplier;
								}
								if (li.custom_multiplier_1) {
									li.cost *= App.getMultiplierValue(li.custom_multiplier_1);
								}
								if (li.custom_multiplier_2) {
									li.cost *= App.getMultiplierValue(li.custom_multiplier_2);
								}

								// add overhead if a salary
								if (costObj && costObj.subheading_name === 'Salaries') {
									li.cost *= 1 + App.whoAmI.staff_overhead_perc;
								}

								// convert to correct currency
								li.cost *= exchangeRate;

								// round to nearest one
								li.cost = Math.round(li.cost);

								if (li.line_item_type === 'start-up') {
									input.startupCost += li.cost;
								} else if (li.line_item_type === 'capital') {
									input.capitalCost += li.cost;
								} else if (li.line_item_type === 'recurring') {
									input.recurringCost += li.cost;
								}
							});
							if (input.selected) {
								if (input.isCustomCost) {
									a.startupCost += input.customStartupCost;
									a.recurringCost += input.customRecurringCost;
								} else {
									a.startupCost += input.startupCost;
									a.capitalCost += input.capitalCost;
									a.recurringCost += input.recurringCost;
								}
							}
						});
						ind.startupCost += a.startupCost;
						ind.capitalCost += a.capitalCost;
						ind.recurringCost += a.recurringCost;
					});
					cap.startupCost += ind.startupCost;
					cap.capitalCost += ind.capitalCost;
					cap.recurringCost += ind.recurringCost;
				});
				cc.startupCost += cap.startupCost;
				cc.capitalCost += cap.capitalCost;
				cc.recurringCost += cap.recurringCost;
			});
		});
	}

	// builds the cost text for any level of the jeeTree above line item (e.g. indicator)
	App.getCostText = (branch) => {
		const startupCost = branch.startupCost + branch.capitalCost;
		const recurringCost = branch.recurringCost;
		if (!recurringCost) return App.moneyFormat(startupCost);
		//if (!startupCost) return `${moneyFormat(recurringCost)}/yr`;
		return `${App.moneyFormat(startupCost)} + ${App.moneyFormat(recurringCost)}/yr`;
	}

	// builds the cost text for an input when using a user-entered cost
	App.getCustomCostText = (input) => {
		if (!input.isCustomCost) return '';
		return `${App.moneyFormat(input.customStartupCost)} + ` +
			`${App.moneyFormat(input.customRecurringCost)}/yr`;
	}

	// returns the number of indicators the user has fully costed
	App.getNumIndicatorsCosted = (capacity) => {
		return capacity.indicators
			.filter((ind) => {
				return App.getNeededActions(ind).every((action) => {
					return App.getNeededInputs(action.inputs, ind.score).every(input => input.costed);
				});
			})
			.length;
	}

	// gets the exchange rate for the selected currency to USD
	App.getExchangeRate = () => {
		if (!App.whoAmI.name) return 1;
		const exchangeRateArray = App.currencies[App.whoAmI.currency_iso].exchange_rates;
		return exchangeRateArray.find(rate => rate.convert_from === 'USD').multiplier;
	}

	// parses multiplier string or integer and returns an integer
	App.getMultiplierValue = (input) => {
		if (typeof input === 'number') return input;
		return Util.strToFloat(input);
	}


	/* ------------------ Vendor Defaults ------------------- */
	// tooltipster defaults
	$.tooltipster.setDefaults({
		contentAsHTML: true,
		trigger: 'hover',
		offset: [5, -25],
		theme: 'tooltipster-shadow',
		maxWidth: 320,
	});

	// noty defaults
	$.noty.defaults.type = 'warning';
	$.noty.defaults.layout = 'center';
	$.noty.defaults.timeout = 2000;
})();

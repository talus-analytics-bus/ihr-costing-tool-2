const App = {};

(() => {
	App.lang = 'en';
	App.demoMode = false;
	App.scoreLabels = {
		1: 'No Capacity',
		2: 'Limited Capacity',
		3: 'Developed Capacity',
		4: 'Demonstrated Capacity',
		5: 'Sustainable Capacity',
	};

	// initialize basic app behaviors
	App.initialize = (callback) => {
		// give a warning if user is not using Chrome or Firefox
		const browser = navigator.userAgent;
		if (browser.search('Chrome') === -1 && browser.search('Firefox') === -1) {
			noty({
				timeout: false,
				maxWidth: 400,
				text: '<b>Warning!<br>This tool is designed to be used in Google Chrome or Mozilla Firefox! Please switch to one of these browsers for optimal performance.</b>',
			});
		}

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

				if (App.demoMode) {
					// default to Kenya
					d3.text('data/KE20170904-demo.ihr', (error, text) => {
						const demoDataLoaded = App.loadSessionData(text);
						if (!demoDataLoaded) noty({ text: 'There was an issue loading the demo data.' });
						App.updateAllCosts();
						callback();
					});

					// default to Switzerland
					/* App.whoAmI = App.countryParams.find(d => d.abbreviation === 'CH');
					App.updateAllCosts();
					callback(); */
				} else {
					App.updateAllCosts();
					callback();
				}
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
		if (!ind.score) return [];

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

	// gets the score in the user data for the indicator specified
	App.getIndicatorScore = (indId) => {
		const ind = App.getIndicator(indId);
		return ind.score;
	};

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
			if (ind.score) newIndScores.push(App.getTargetScore(ind));
		});
		return d3.mean(newIndScores);
	}

	// gets the target score of an indicator
	App.getTargetScore = (ind) => {
		if (User.targetScoreType === 'step') {
			if (ind.score) {
				if (ind.score >= 4) return ind.score;
				else return ind.score + 1;
			}
		} else if (User.targetScoreType === 'target') {
			if (ind.score && ind.score > User.targetScore) return ind.score;
			else return User.targetScore;
		}
		return null;
	}

	// sets the score in the user data for the indicator specified
	App.setIndicatorScore = (indId, newScore) => {
		const ind = App.getIndicator(indId);
		ind.score = newScore;
	};



	/* ------------------ Cost Functions ------------------- */
	// sets/updates the costs for all levels of the jeeTree
	App.updateAllCosts = () => {
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

					ind.actions.forEach((a) => {
						a.startupCost = 0;
						a.capitalCost = 0;
						a.recurringCost = 0;

						a.inputs.forEach((input) => {
							input.startupCost = 0;
							input.capitalCost = 0;
							input.recurringCost = 0;

							input.line_items.forEach((li) => {
								li.cost = App.getLineItemCost(li, exchangeRate);

								if (li.line_item_type === 'start-up') {
									input.startupCost += li.cost;
								} else if (li.line_item_type === 'capital') {
									input.capitalCost += li.cost;
								} else if (li.line_item_type === 'recurring') {
									input.recurringCost += li.cost;
								}
							});

							if (input.costed) {
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

						if (App.isActionComplete(a, ind.score)) {
							ind.startupCost += a.startupCost;
							ind.capitalCost += a.capitalCost;
							ind.recurringCost += a.recurringCost;
						}
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

	// gets the cost of a line item
	App.getLineItemCost = (li, exchangeRate) => {
		// find cost information in globalBaseCosts dictionary
		let costObj = App.globalBaseCosts.find((gbc) => {
			return gbc.id === li.base_cost;
		});

		// if cost information wasn't found, it must be buy/lease (append to id)
		if (!costObj) {
			costObj = App.globalBaseCosts.find((gbc) => {
				return gbc.id === `${li.base_cost}.${User.buyOrLease}`;
			});

			// TODO the startup/capital/recurring flag should prob be tagged in GBC not LI
			// change line item type and target score according to user's choice of buy/lease
			if (User.buyOrLease === 'buy') {
				li.line_item_type = 'start-up';
				li.score_step_to = [String(d3.min(li.score_step_to))];  // keep lowest score
			} else {
				li.line_item_type = 'recurring';
				const score_step_to = [];  // lowest score to 4 (including)
				const minScore = +d3.min(li.score_step_to);
				for (let i = minScore; i < 5; i++) score_step_to.push(String(i));
				li.score_step_to = score_step_to.slice(0);
			}
		}

		// something went wrong; cost object not found
		if (!costObj) {
			console.log(`Warning! Cost object not found for id: ${li.base_cost}`);
			return 0;
		}

		// initialize cost
		let cost = costObj ? costObj.cost : 0;

		// include multipliers
		if (li.staff_multiplier) {
			const multiplierObj = App.globalStaffMultipliers.find((sm) => {
				return sm.id === li.staff_multiplier;
			});
			if (multiplierObj) cost *= multiplierObj.count;
		}
		if (li.country_multiplier && App.whoAmI.name) {
			let multiplier = 1;
			if (li.country_multiplier === 'intermediate_1_and_local_area_count') {
				multiplier = App.whoAmI.multipliers.intermediate_1_area_count + App.whoAmI.multipliers.local_area_count;
			} else if (li.country_multiplier === 'intermediate_1_and_2_count') {
				let int2Count = App.whoAmI.multipliers.intermediate_2_area_count;
				if (int2Count === undefined || int2Count === null) int2Count = 0.0; 
				multiplier = App.whoAmI.multipliers.intermediate_1_area_count + App.whoAmI.multipliers.intermediate_2_area_count;
			} else {
				multiplier = App.whoAmI.multipliers[li.country_multiplier];
			}
			if (multiplier) cost *= multiplier;
		}
		if (li.custom_multiplier_1) {
			cost *= App.getMultiplierValue(li.custom_multiplier_1);
		}
		if (li.custom_multiplier_2) {
			cost *= App.getMultiplierValue(li.custom_multiplier_2);
		}

		// add overhead if a salary
		if (costObj && costObj.subheading_name === 'Salaries') {
			cost *= 1 + App.whoAmI.staff_overhead_perc;
		}

		// convert to correct currency
		cost *= exchangeRate || App.getExchangeRate();

		// round to nearest one
		return Math.round(cost);
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
			.filter(ind => App.isIndicatorComplete(ind))
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
		else {
			const outputTmp = input.split(' ');
			return parseFloat(outputTmp[0]);
		}
		// return Util.strToFloat(input);
	}


	/* ------------------ Result Functions ------------------- */
	// returns whether indicator has been both scored and costed
	App.isIndicatorComplete = (ind) => {
		if (!ind.score) return false;
		return App.getNeededActions(ind).every((action) => {
			return App.isActionComplete(action, ind.score);
		});
	}

	// returns whether action has been costed
	App.isActionComplete = (action, indScore) => {
		if (!indScore) return false;
		return App.getNeededInputs(action.inputs, indScore).every(input => input.costed);
	}


	/* ------------------ Misc Functions ------------------- */
	// Updates the language used to match the choice (2-character code)
	// @langeChoice	2-character code representing the choice of language,
	// currently 'en' or 'fr'
	App.changeLanguage = (langChoice = 'fr') => {
		langChoice = langChoice.toLowerCase().trim();
		App.lang = langChoice; // update global variable specifying language choice

		App.jeeTree.forEach(ce => {
			// CORE ELEMENTS
			// name
			ce.name = ce[`name_${App.lang}`];

			// cc fields to copy
			const ccFields = [
				'name',
				'target_description',
				'as_measured_by',
				'desired_impact',
				'notes',
			];
			ce.capacities.forEach(cc => {
				// CORE CAPACITIES
				ccFields.forEach(field => {
					cc[field] = cc[`${field}_${App.lang}`];
				});

				const indFields = [
					'name',
					'score_descriptions',
				];

				cc.indicators.forEach(ind => {
					// INDICATORS
					indFields.forEach(field => {
						ind[field] = ind[`${field}_${App.lang}`];
					});

					ind.actions.forEach(action => {
						// ACTIONS
						action.name = action[`name_${App.lang}`]

						action.inputs.forEach(input => {
							// INPUTS
							input.name = input[`name_${App.lang}`]

							const liFields = [
								'name',
								'description',
								'category_tag',
								'function_tag',
								'custom_multiplier_1',
								'custom_multiplier_2',
								'references',
								'where_find_base_cost',
							];
							input.line_items.forEach(li => {
								liFields.forEach(field => {
									li.name = li[`${field}_${App.lang}`]
								});
							});
						});
					});
				});
			});
		});

		App.globalBaseCosts.forEach(gbc => {
			const fields = [
					'name',
					'description',
					'tab_name',
					'subheading_name',
					'cost_unit',
			];
			fields.forEach(field => {
				gbc[field] = gbc[`${field}_${App.lang}`];
			});
		});
		
		// Once the new language is chosen, reload the page.
		crossroads.parse(hasher.getHash());
	};

	// retrieves a copy of all complete indicators and all levels below
	App.getCompleteIndicatorTree = () => {
		const completeIndicators = [];
		App.jeeTree.forEach((cc) => {
			cc.capacities.forEach((cap) => {
				cap.indicators.forEach((ind) => {
					if (App.isIndicatorComplete(ind)) {
						const indCopy = Object.assign({}, ind);
						const actions = App.getNeededActions(indCopy);
						indCopy.targetScore = App.getTargetScore(indCopy);
						indCopy.actions = [];

						actions.forEach((action) => {
							if (App.isActionComplete) {
								const actionCopy = Object.assign({}, action);
								const costedInputs = actionCopy.inputs.filter(input => input.costed);
								const inputs = App.getNeededInputs(costedInputs, ind.score);
								actionCopy.inputs = [];

								inputs.forEach((input) => {
									const inputCopy = Object.assign({}, input);
									const lineItems = App.getNeededLineItems(inputCopy.line_items, ind.score);
									inputCopy.line_items = [];

									lineItems.forEach((li) => {
										const liCopy = Object.assign({}, li);
										inputCopy.line_items.push(liCopy);
									});
									actionCopy.inputs.push(inputCopy);
								});
								indCopy.actions.push(actionCopy);
							}
						});
						completeIndicators.push(indCopy);
					}
				});
			});
		});
		return completeIndicators;
	}

	// retrieves a copy of all scored indicators and all levels below (i.e., the needed
	// costing actions / inputs / line items for that indicator score and the user's goal)
	App.getScoredIndicatorTree = () => {
		const scoredIndicators = [];
		App.jeeTree.forEach((cc) => {
			cc.capacities.forEach((cap) => {
				cap.indicators.forEach((ind) => {
					if (ind.score) {
					// if (App.isIndicatorComplete(ind)) {
						const indCopy = Object.assign({}, ind);
						const actions = App.getNeededActions(indCopy);
						indCopy.targetScore = App.getTargetScore(indCopy);
						indCopy.actions = [];

						actions.forEach((action) => {
							if (true) {
							// if (App.isActionComplete) {
								const actionCopy = Object.assign({}, action);
								const actionInputs = actionCopy.inputs
								// const costedInputs = actionCopy.inputs.filter(input => input.costed);
								const inputs = App.getNeededInputs(actionInputs, ind.score);
								actionCopy.inputs = [];

								inputs.forEach((input) => {
									const inputCopy = Object.assign({}, input);
									const lineItems = App.getNeededLineItems(inputCopy.line_items, ind.score);
									inputCopy.line_items = [];

									lineItems.forEach((li) => {
										const liCopy = Object.assign({}, li);
										inputCopy.line_items.push(liCopy);
									});
									actionCopy.inputs.push(inputCopy);
								});
								indCopy.actions.push(actionCopy);
							}
						});
						scoredIndicators.push(indCopy);
					}
				});
			});
		});
		return scoredIndicators;
	}

	// retrieves a copy of all indicators and all levels below, regardless of whether
	// completed or not
	App.getAllIndicatorTree = () => {
		const allIndicators = [];
		App.jeeTree.forEach((cc) => {
			cc.capacities.forEach((cap) => {
				cap.indicators.forEach((ind) => {
					allIndicators.push(ind);
				});
			});
		});
		return allIndicators;
	}

	App.downloadText = (fileName, data) => {
		const uri = `data:application/csv;charset=utf-8,${escape(data)}`;
		const link = document.createElement('a');
		link.href = uri;
		link.style = 'visibility:hidden';
		link.download = fileName + '.ihr';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
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

(() => {

	// load both sets of languages
	d3.json('./data/tmp/jee_costing_data-en.json',res => {en = res; })
	d3.queue(1)
		.defer(d3.json, './data/tmp/jee_costing_data-en.json')
		.defer(d3.json, './data/tmp/jee_costing_data-fr.json')
		.await((error, jcd_en, jcd_fr) => {

			const jcd_both = jcd_en.map((d) => {
				return $.extend(true, {}, d);
			});

			function correctFrIds () {
				jcd_fr.forEach(ce => { ce.capacities.forEach(cc => cc.indicators.forEach(ind => ind.actions.forEach(action => { action.inputs.forEach(input => {

					const inputId = input.id;
					let i = 0;
					input.line_items.forEach(li => {
						i++;
						const liId = inputId + '.' + i;
						li.id = liId;
					});

				})})))});
			}

			function getCapacity (id, jcd) {
				// gets the capacity from the jeeTree given an id
				const ceId = id.includes('.') ? id.split('.')[0].toLowerCase() : 'a';
				const capId = id.toLowerCase();
				const ce = jcd.find(ce => ce.id === ceId);
				if (!ce) return null;
				return ce.capacities.find(cap => cap.id === capId);
			}

			// get indicator
			getIndicator = (id) => {
				const dotTierNum = (App.normalCcIds.includes(id.split('.')[0])) ? 2 : 1;
				const capId = id.split('.').slice(0, dotTierNum).join('.').toLowerCase();
				const indId = id.toLowerCase();
				const cap = getCapacity(capId, jcd_fr);
				if (!cap) return null;
				return cap.indicators.find(ind => ind.id === indId);
			}

			// gets the action from the jeeTree given an id
			getAction = (id) => {
				const dotTierNum = (App.normalCcIds.includes(id.split('.')[0])) ? 3 : 2;
				const indId = id.split('.').slice(0, dotTierNum).join('.').toLowerCase();
				const actionId = id.toLowerCase();
				const ind = getIndicator(indId);
				if (!ind) return null;
				return ind.actions.find(a => a.id === actionId);
			}

			// gets the input from the jeeTree given an id
			getInput = (id) => {
				const dotTierNum = (App.normalCcIds.includes(id.split('.')[0])) ? 4 : 3;
				const actionId = id.split('.').slice(0, dotTierNum).join('.').toLowerCase();
				const inputId = id.toLowerCase();
				const action = getAction(actionId);
				if (!action) return null;
				return action.inputs.find(input => input.id === inputId);
			}

			// gets the line item from the jeeTree given an id
			getLineItem = (id) => {
				const dotTierNum = (App.normalCcIds.includes(id.split('.')[0])) ? 5 : 4;
				const inputId = id.split('.').slice(0, dotTierNum).join('.').toLowerCase();
				const liId = id.toLowerCase();
				const input = getInput(inputId);
				if (!input) return null;
				return input.line_items.find(li => li.id === liId);
			}

			// correct the FR line item ids
			// correctFrIds(jcd_fr);

			// Iterate over jee_costing_data-en.json and add the FR language names of things
			const ceHash = {"Prevent":"Prévenir","Detect":"Détecter","Respond":"Riposter"};
			jcd_both.forEach(ce => {
				// CORE ELEMENTS
				// name
				ce.name_fr = ceHash[ce.name];
				ce.name_en = ce.name;

				// cc fields to copy
				const ccFields = [
					'name',
					'target_description',
					'as_measured_by',
					'desired_impact',
					'notes',
				];
				console.log(ce.capacities.forEach);
				ce.capacities.forEach(cc => {
					// CORE CAPACITIES
					const ccId = cc.id;
					const cc_fr = getCapacity(ccId, jcd_fr);
					
					// console.log('ccId');
					// console.log(ccId);
					ccFields.forEach(field => {
						cc[field + '_fr'] = cc_fr[field] || '';
						cc[field + '_en'] = cc[field] || '';
					});

					const indFields = [
						'name',
						'score_descriptions',
					];

					cc.indicators.forEach(ind => {
						// INDICATORS
						const indId = ind.id;
						const ind_fr = getIndicator(indId, jcd_fr);
						indFields.forEach(field => {
							ind[field + '_fr'] = ind_fr[field] || '';
							ind[field + '_en'] = ind[field] || '';
						});

						ind.actions.forEach(action => {
							// ACTIONS
							const actionId = action.id;
							const action_fr = getAction(actionId, jcd_fr);
							action.name_fr = action_fr.name;
							action.name_en = action.name;

							action.inputs.forEach(input => {
								// INPUTS
								const inputId = input.id;
								const input_fr = getInput(inputId, jcd_fr);
								// console.log('inputId')
								// console.log(inputId)
								input.name_fr = input_fr.name;

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
									// Calculate corrected LI ID
									// LINE ITEMS
									const liId = li.id;
									const li_fr = getLineItem(liId, jcd_fr);
									// console.log('liId');
									// console.log(liId);
									liFields.forEach(field => {
										li[field + '_fr'] = li_fr[field] || '';
										li[field + '_en'] = li[field] || '';
									});
								});
							});
						});
					});
				});
			});

			console.log('jcd_both');
			console.log(jcd_both);
			
		});
	
})();


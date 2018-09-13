(() => {
	// Updates the language used to match the choice (2-character code)
	// @langeChoice	2-character code representing the choice of language,
	// currently 'en' or 'fr'
	App.changeLanguage = (langChoice = 'fr') => {
		langChoice = langChoice.toLowerCase().trim();

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
	};
})();


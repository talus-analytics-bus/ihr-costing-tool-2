(() => {
	// load both sets of languages
	d3.queue(1)
		.defer(d3.json, './data/tmp/global_base_costs-en.json')
		.defer(d3.json, './data/tmp/global_base_costs-fr.json')
		.await((error, gbc_en, gbc_fr) => {
			const gbc_both = gbc_en.map((d) => {
				return $.extend(true, {}, d);
			});

			gbc_both.forEach((gbc) => {
				const id = gbc.id;
				const curGbcFr = gbc_fr.find(d => d.id === id);
				const fields = [
					'name',
					'description',
					'tab_name',
					'subheading_name',
					'cost_unit',
				];
				fields.forEach(field => {
					gbc[`${field}_en`] = gbc[field];
					gbc[`${field}_fr`] = curGbcFr[field];
				});

			});
			console.log('gbc_both');
			console.log(gbc_both);
		});

})();
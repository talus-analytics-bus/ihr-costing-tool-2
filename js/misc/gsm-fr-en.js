(() => {
	// load both sets of languages
	d3.queue(1)
		.defer(d3.json, './data/tmp/global_staff_multipliers-tmp.json')
		.await((error, gsm_both) => {

			gsm_both.forEach((gsm) => {
				const fields = [
					'name',
					'description',
					'tab_name',
					'subheading_name',
				];
				fields.forEach(field => {
					gsm[field] = gsm[`${field}_en`];
				});

			});
			console.log('gsm_both');
			console.log(gsm_both);
		});

})();
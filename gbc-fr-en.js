(() => {

	const units = [{"en":"per square meter per year", "fr": "par mètre carré par an"},{"en":"per day","fr":"par jour"},{"en":"per copy","fr":"par copie"},{"en":"per year","fr":"par an"},{"en":"per phone","fr":"par téléphone"},{"en":"per phone per year","fr":"par téléphone et par an"},{"en":"per system","fr":"par système"},{"en":"per truck","fr":"par camion"},{"en":"per room","fr":"par chambre"},{"en":"per kit","fr":"par kit"},{"en":"per license per year","fr":"par licence par année"},{"en":"per trip","fr":"par voyage"},{"en":"per lock system","fr":"par système de verrouillage"},{"en":"per survey per year","fr":"par enquête par année"},{"en":"per vaccine","fr":"par vaccin"},{"en":"per refrigeration system","fr":"par système de réfrigération"},{"en":"per facility","fr":"par installation"},{"en":"per facility per year","fr":"par installation par année"},{"en":"per cooler","fr":"par refroidisseur"},{"en":"per test","fr":"par test"},{"en":"per trainee","fr":"par stagiaire"},{"en":"per square meter","fr":"par mètre carré"},{"en":"per occupant","fr":"par occupant"},{"en":"per trainee per year","fr":"par stagiaire par année"},{"en":"per EOC","fr":"par COU"},{"en":"per office","fr":"par bureau"},{"en":"per 1-minute message","fr":"par message d'une minute"},{"en":"per ad per day","fr":"par annonce par jour"},{"en":"per vehicle","fr":"par véhicule"},{"en":"per sensor","fr":"par capteur"},{"en":"per machine","fr":"par machine"},{"en":"per suit","fr":"par combinaison"},{"en":"per device","fr":"par appareil"},{"en":"per alarm","fr":"par alarme"},{"en":"per counter","fr":"par compteur"},{"en":"per monitor","fr":"par moniteur"},{"en":"per apparatus","fr":"par dispositif"},{"en":"per dosimeter","fr":"par dosimètre"}];

	// load both sets of languages
	d3.queue(1)
		.defer(d3.json, './data/tmp/global_base_costs-en.json')
		.defer(d3.json, './data/tmp/global_base_costs-fr.json')
		.await((error, gbc_en, gbc_fr) => {
			const gbc_both = gbc_en.map((d) => {
				return $.extend(true, {}, d);
			});
			const noMatch = [];

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

				// translate cost units
				console.log('gbc.cost_unit_en')
				console.log(gbc.cost_unit_en)
				const match = units.find(d => d.en === gbc.cost_unit_en);
				if (!match && gbc.show_on_dv) {
					noMatch.push(gbc.cost_unit_en);
				} else if (gbc.show_on_dv) {
					gbc.cost_unit_fr = match.fr;
				}

			});
			console.log('gbc_both');
			console.log(gbc_both);
			console.log('noMatch');
			console.log(noMatch);
		});

})();
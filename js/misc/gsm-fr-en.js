(() => {

	// constants 
	const units = [{"en":"per day","fr":"par jour"},{"en":"per copy","fr":"par copie"},{"en":"per year","fr":"par an"},{"en":"per phone","fr":"par téléphone"},{"en":"per phone per year","fr":"par téléphone et par an"},{"en":"per system","fr":"par système"},{"en":"per truck","fr":"par camion"},{"en":"per room","fr":"par chambre"},{"en":"per kit","fr":"par kit"},{"en":"per license per year","fr":"par licence par année"},{"en":"per trip","fr":"par voyage"},{"en":"per lock system","fr":"par système de verrouillage"},{"en":"per survey per year","fr":"par enquête par année"},{"en":"per vaccine","fr":"par vaccin"},{"en":"per refrigeration system","fr":"par système de réfrigération"},{"en":"per facility","fr":"par installation"},{"en":"per facility per year","fr":"par installation par année"},{"en":"per cooler","fr":"par refroidisseur"},{"en":"per test","fr":"par test"},{"en":"per trainee","fr":"par stagiaire"},{"en":"per square meter","fr":"par mètre carré"},{"en":"per occupant","fr":"par occupant"},{"en":"per trainee per year","fr":"par stagiaire par année"},{"en":"per EOC","fr":"par COU"},{"en":"per office","fr":"par bureau"},{"en":"per 1-minute message","fr":"par message d'une minute"},{"en":"per ad per day","fr":"par annonce par jour"},{"en":"per vehicle","fr":"par véhicule"},{"en":"per sensor","fr":"par capteur"},{"en":"per machine","fr":"par machine"},{"en":"per suit","fr":"par combinaison"},{"en":"per device","fr":"par appareil"},{"en":"per alarm","fr":"par alarme"},{"en":"per counter","fr":"par compteur"},{"en":"per monitor","fr":"par moniteur"},{"en":"per apparatus","fr":"par dispositif"},{"en":"per dosimeter","fr":"par dosimètre"}];
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

				// do units

			});
			console.log('gsm_both');
			console.log(gsm_both);
		});

})();
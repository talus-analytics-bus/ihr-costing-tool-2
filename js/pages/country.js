(() => {
	App.initCountry = () => {
		App.createLeafletMap();

		// populate country dropdown
		const countryData = App.countryParams.slice(0);
		countryData.unshift({ name: 'Choose country', abbreviation: '' });
		Util.sortByKey(countryData, 'name');
		Util.populateSelect('.country-dropdown', countryData, {
			nameKey: 'name',
			valKey: 'abbreviation',
		});
		$('.country-dropdown').on('change', function() {
			App.updateCountry($(this).val());
		});


		// set the map's active country to the dropdown selection
		function selectCountryOnMap(countryCode) {
			App.geoJson.eachLayer((layer) => {
				const layerAbbr = layer.feature.properties.iso_a2;
				if (layerAbbr === countryCode) {
					layer.setStyle(App.mapConfig.styles.selected);
				} else {
					App.geoJson.resetStyle(layer);
				}
			});
		};

		// set search bar behavior
		let liveSearchTimeout;
		const $resultsBox = $('.live-search-results-container');
		$('.country-search-input')
			.on('focus', function() { searchForCountry($(this).val()); })
			.on('blur', function() {
				clearTimeout(liveSearchTimeout);
				$resultsBox.hide();
			})
			.on('keyup', function(ev) {
				clearTimeout(liveSearchTimeout);
				const searchVal = $(this).val();
				if (ev.which === 13) {
					// enter: perform search immediately
					searchForCountry(searchVal);
				} else {
					// perform search when user stops typing for 250ms
					liveSearchTimeout = setTimeout(function() {
						searchForCountry(searchVal);
					}, 250);
				}
			});

		function searchForCountry(searchVal) {
			if (searchVal.trim() === '') {
				$resultsBox.hide();
				return;
			}
			
			// show live search box under search bar
			const fuse = new Fuse(App.countryParams, {
				threshold: 0.3,
				distance: 1e5,
				keys: ['abbreviation', 'name', 'currency_iso'],
			});
			const results = fuse.search(searchVal);
			
			// show results in boxes under search input
			$resultsBox.show();
			if (results.length === 0) {
				$resultsBox.find('.live-search-no-results-text').show();
				$resultsBox.find('.live-search-results-contents').hide();
			} else {
				$resultsBox.find('.live-search-no-results-text').hide();
				$resultsBox.find('.live-search-results-contents').show();

				let boxes = d3.select($resultsBox[0]).select('.live-search-results-contents').selectAll('.live-search-results-box')
					.data(results.slice(0, 4));
				boxes.exit().remove();

				const newBoxes = boxes.enter().append('div')
					.attr('class', 'live-search-results-box');
				newBoxes.append('div')
					.attr('class', 'live-search-results-title');
				newBoxes.append('div')
					.attr('class', 'live-search-results-subtitle');
					
				boxes = boxes.merge(newBoxes)
					.attr('code', d => d.abbreviation)
					.on('mousedown', (d) => {
						// clear input
						$('.country-search-input').val('');

						// update dropdown and map
						App.updateCountry(d.abbreviation);
					});
				boxes.select('.live-search-results-title').text(d => d.name);
				boxes.select('.live-search-results-subtitle')
					.text(d => `Population: ${Util.comma(d.multipliers.population)}`);
			}
		}

		App.updateCountry = (countryCode) => {
			// set dropdown
			$('.country-dropdown').val(countryCode);

			// highlight in map
			selectCountryOnMap(countryCode);
									
			// save in namespace
			const country = App.countryParams.find(d => d.abbreviation === countryCode);
			App.whoAmI = JSON.parse(JSON.stringify(country));

			// update all costs
			App.updateAllCosts();
		}


		// next button behavior
		$('.go-to-assessment-button').click(() => hasher.setHash('overview'));
	}
})();

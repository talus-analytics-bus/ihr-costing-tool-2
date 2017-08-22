(() => {
	const inputNonDefaultColor = '#fff3cd';

	App.initWho = (whoTab) => {
		// check that user has entered the country first
		if (whoTab !== 'country' && !App.whoAmI.name) {
			noty({ text: '<b>Select a country before proceeding!</b>' });
			hasher.setHash('costs/country');
			return;
		}

		// call appropriate functions based on the whoTab
		switch(whoTab) {
			case 'country':
				App.createLeafletMap();
				initCountryTab();
				break;
			case 'population':
				initPopDistTab();
				break;
			case 'country-details':
				initCountryDetailsTab();
			case 'default-costs':
				initDefaultCostsTab();
			default:
		}

		/* ------------ Input Block Overview and Links ---------- */
		const blocks = [
			{
				abbr: 'country',
				name: 'Country and Currency',
			}, {
				abbr: 'population',
				name: 'Total Population',
			}, {
				abbr: 'country-details',
				name: 'Country Details',
			}, {
				abbr: 'default-costs',
				name: 'Default Costs',
			}
		];

		// add a tab for each of the blocks
		const blockLinks = d3.select('.block-link-container').selectAll('.block-link')
			.data(blocks)
			.enter().append('div')
				.attr('class', 'block-link')
				.classed('active', d => whoTab === d.abbr)
				.on('click', d => hasher.setHash(`costs/${d.abbr}`));

		// add an arrow to indicate which block is showing
		const chevron = blockLinks.append('svg')
			.attr('class', 'chevron')
			.attr('viewBox', '0 0 24 24')
			.attr('src', 'img/chevron-right.png')
			.style('display', (d) => {
				return whoTab === d.abbr ? 'inline' : 'none';
			});
		chevron.append('path')
			.attr('d', 'M8 5v14l11-7z');

		// add the title and the gradient cover
		blockLinks.append('div')
			.attr('class', 'block-link-title')
			.html(d => d.name);
		blockLinks.append('div').attr('class', 'block-link-cover');

		// show the correct block content
		$(`.${whoTab}-block`).slideDown();

		// add tooltips
		$('.defn').tooltipster({
			functionInit: function(instance, helper) {
				var defnName = instance["_$origin"].attr('defn');
				if (defnName === 'pop') {
					const content = 'This is the estimated total population for the country chosen. The number can be changed using the edit box below';
					instance.content(content);
					return content;
				}
				else if (defnName === 'geo') {
					const content = 'This is the estimated total population for the country chosen. The number can be changed using the edit box below';
					instance.content(content);
					return content;
				}
				else if (defnName === 'phi') {
					const content= 'This is the estimated total population for the country chosen. The number can be changed using the edit box below';
					instance.content(content);
					return content;
				}
			}
		});
	};


	// country tab
	const initCountryTab = () => {
		const hasCountrySelected = () => App.whoAmI.hasOwnProperty('currency');
		const hasCurrencySelected = () => App.whoAmI.selectedCurrency && App.whoAmI.selectedCurrency.hasOwnProperty('name');

		// transforms currency object and adds code that matches with the original currencies.json key
		const currencyObj = (key, obj) => Object.assign({}, obj, {
			code: key,
		});

		const changeDropdownLabel = (name) => {
			d3.select('.currency-container > button').text(name);
		}

		// transform currencies object into array
		const currenciesArray = Object.keys(App.currencies)
			.map((key) => currencyObj(key, App.currencies[key]));

		// if country is selected and no currency has been selected yet, select matching country currency as default
		if (hasCountrySelected() && !hasCurrencySelected()) {
			App.whoAmI.selectedCurrency = App.currencies[App.whoAmI.currency_iso] ? currencyObj(App.whoAmI.currency_iso, App.currencies[App.whoAmI.currency_iso]) : {};
			App.updateAllCosts();
		}

		// if there is selected currency, mark it as selected
		if (hasCurrencySelected()) {
			changeDropdownLabel(App.whoAmI.selectedCurrency.name);
		}

		// prepare currency dropdown
		d3.select('.currency-container-dropdown.dropdown-menu').selectAll('.currency-option')
			.data(currenciesArray)
			.enter().append('a')
				.attr('class', 'currency-option dropdown-item')
				.text((d) => d.name)
				.on('click', (d) => {
					changeDropdownLabel(d.name);
					App.whoAmI.selectedCurrency = d;
					App.updateAllCosts();
				});

		if (App.whoAmI.hasOwnProperty('name')) {
			d3.select('.country-dropdown.dropdown > button')
				.text(App.whoAmI.name);
		}

		/* Prepare the country dropdown*/
		d3.select('.country-dropdown.dropdown-menu').selectAll('.country-option')
			.data(App.countryParams)
			.enter().append('a')
				.attr('class','country-option dropdown-item')
				.text(function(d) { return d.name})
				.on('click', function (d) {
					d3.select('.country-dropdown.dropdown > button').text(d.name);
					countryDropdownToggle(d.abbreviation);
					App.whoAmI = JSON.parse(JSON.stringify(d));

					// if country is selected and no currency has been selected yet, select matching country currency as default
					if (hasCountrySelected() && !hasCurrencySelected()) {
						App.whoAmI.selectedCurrency = App.currencies[App.whoAmI.currency_iso] ? currencyObj(App.whoAmI.currency_iso, App.currencies[App.whoAmI.currency_iso]) : {};
						changeDropdownLabel(App.whoAmI.selectedCurrency.name);
					}

					// if there is selected currency, mark it as selected
					if (hasCurrencySelected()) {
						changeDropdownLabel(App.whoAmI.selectedCurrency.name);
					}

					App.updateAllCosts();
				});

		// next button takes user to population page
		$('.next-button').click(() => {
			if (!App.whoAmI.name) {
				noty({ text: '<b>Select a country before proceeding!</b>' });
				return;
			}
			hasher.setHash('costs/population');
		});
		$('.proceed-button').click(() => {
			if (!App.whoAmI.name) {
				noty({ text: '<b>Select a country before proceeding!</b>' });
				return;
			}
			hasher.setHash('costs/p-1/1');
		});
	};

	const initPopDistTab = () => {
		const defaultPop = App.countryParams.find(d => d.name === App.whoAmI.name).multipliers.population;

		$('.population-input')
			.val(Util.comma(defaultPop))
			.on('change', function() {
				App.whoAmI.multipliers.population = Util.getInputNumVal(this);
				checkIfDefault();
				App.updateAllCosts();
			});

		function checkIfDefault() {
			const isDefault = Math.round(App.whoAmI.multipliers.population) === Math.round(defaultPop);
			$('.population-input').css('background-color', isDefault ? '#fff' : inputNonDefaultColor);
			if (isDefault) {
				$('.default-pop-text').slideUp();
			} else {
				$('.default-pop-text')
					.text(`Default: ${Util.comma(defaultPop)}`)
					.slideDown();
			}
		}

		$('.previous-button').click(() => hasher.setHash('costs/country'));
		$('.next-button').click(() => hasher.setHash('costs/country-details'));
		$('.proceed-button').click(() => hasher.setHash('costs/p-1/1'));
	}

	const initCountryDetailsTab = () => {
		const geoDivisions = [
			{
				name: 'central_area_count',
				description: 'Primary geographical division of the country',
				values: ['Country', 'State', 'Province'],
			}, {
				name: 'intermediate_1_area_count',
				description: 'Secondary geographical division of the country',
				values: ['Province', 'Municipality', 'District', 'State'],
			}, {
				name: 'intermediate_2_area_count',
				description: 'Tertiary geographical division of the country',
				values: ['Province', 'Municipality', 'District', 'State'],
			}, {
				name: 'local_area_count',
				description: 'Local geographical division of the country',
				values: ['Barangay', 'County', 'District', 'City'],
			}
		];

		const geoRows = d3.select('.geo-division-table tbody').selectAll('tr')
			.data(geoDivisions)
			.enter().append('tr');
		geoRows.append('td').text(d => `${d.description}:`);
		geoRows.append('td').append('select')
			.attr('class', 'form-control')
			.each(function(d) {
				Util.populateSelect(this, d.values);
			});
		geoRows.append('td').append('input')
			.attr('class', 'form-control')
			.attr('value', d => Util.comma(App.whoAmI.multipliers[d.name]))
			.on('change', function(d) {
				App.whoAmI.multipliers[d.name] = Util.getInputNumVal(this);
				App.updateAllCosts();
			});


		// public health section
		const phMults = [
			{
				name: 'central_hospitals_count',
				description: 'Estimated total number of health care facilities in the country',
				unit: 'facilities',
			}, {
				name: 'central_epi_count',
				description: 'Estimated total number of epidemiologists in the country',
				unit: 'people',
			}, {
				name: 'central_chw_count',
				description: 'Estimated total number of community health workers in the country',
				unit: 'people',
			}
		];
		const phRows = d3.select('.ph-table tbody').selectAll('tr')
			.data(phMults)
			.enter().append('tr');
		phRows.append('td').text(d => `${d.description}:`);
		const phInputCell = phRows.append('td');
		phInputCell.append('input')
			.attr('class', 'form-control')
			.attr('value', (d) => {
				d.defaultValue = App.whoAmI.multipliers[d.name];
				return Util.comma(d.defaultValue);
			})
			.on('change', function(d) {
				App.whoAmI.multipliers[d.name] = Util.getInputNumVal(this);
				App.updateAllCosts();
			});
		phInputCell.append('span').text(d => d.unit);

		// previous and next buttons
		$('.previous-button').click(() => hasher.setHash('costs/population'));
		$('.next-button').click(() => hasher.setHash('costs/default-costs'));
		$('.proceed-button').click(() => hasher.setHash('costs/p-1/1'));
	}

	const initDefaultCostsTab = () => {
		// look up exchange rate
		const exchangeRate = App.getExchangeRate();

		// build inputs from global costs data
		const defaultCosts = App.globalBaseCosts.filter(gbc => gbc.show_on_dv);

		// add "overhead" to list of global costs
		defaultCosts.splice(3, 0, { name: 'Salary Overhead', id: 'overhead' });

		Util.populateSelect('.dv-select', defaultCosts, {
			nameKey: 'name',
			valKey: 'id',
		});
		$('.dv-select').on('change', () => {
			updateCostDisplay();
		});

		$('.dv-input').on('change', function() {
			const gbcId = $('.dv-select').val();
			if (gbcId === 'overhead') {
				App.whoAmI.staff_overhead_perc = Util.getInputNumVal(this) / 100;
			} else {
				const gbc = App.globalBaseCosts.find(d => d.id === gbcId);
				gbc.cost = Util.getInputNumVal(this) / exchangeRate;  // store cost in USD
			}
			checkIfDefault(gbcId);
			App.updateAllCosts();
		});

		function updateCostDisplay() {
			const gbcId = $('.dv-select').val();
			if (gbcId === 'overhead') {
				$('.dv-input').val(Util.comma(100 * App.whoAmI.staff_overhead_perc));
				$('.dv-currency').text('%');
			} else {
				const gbc = App.globalBaseCosts.find(d => d.id === gbcId);
				$('.dv-input').val(Util.comma(gbc.cost * exchangeRate));
				$('.dv-currency').text(App.whoAmI.currency_iso);
			}
			checkIfDefault(gbcId);
		}

		function checkIfDefault(gbcId) {
			let isDefault = true;
			let defaultText = 'Default: ';
			if (gbcId === 'overhead') {
				isDefault = App.whoAmI.staff_overhead_perc === 0.6;
				defaultText += '60';
			} else {
				const gbc = App.globalBaseCosts.find(d => d.id === gbcId);
				isDefault = Math.round(gbc.default_cost) === Math.round(gbc.cost);
				defaultText += Util.comma(gbc.default_cost * exchangeRate);
			}

			$('.dv-input').css('background-color', isDefault ? '#fff' : inputNonDefaultColor);
			if (isDefault) {
				$('.dv-default-text').slideUp();
			} else {
				$('.dv-default-text')
					.text(defaultText)
					.slideDown();
			}
		}

		updateCostDisplay();


		// behavior for next button
		$('.previous-button').click(() => hasher.setHash('costs/country-details'));
		$('.proceed-button').click(() => hasher.setHash('costs/p-1/1'));
	}


	/*
	*	countryDropdownToggle
	*	Set the map's active country to the dropdown selection
	*/
	const countryDropdownToggle = (countryCode) => {
		d3.selectAll(".country")
			.classed('active', false);
		d3.selectAll('.country')
			.each(function(d){
				if (d.properties.code === countryCode) {
					d3.select(this).classed('active',true);
				}
			});
	};
})();

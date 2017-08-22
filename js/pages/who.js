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
				initGeographicDivisions();
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



	const hasCountrySelected = () => App.whoAmI.hasOwnProperty('currency');
	const hasCurrencySelected = () => App.whoAmI.selectedCurrency && App.whoAmI.selectedCurrency.hasOwnProperty('name');

	/* Generic way to change a dropdown label */
	const changeDropdownLabel = (className, itemName) => {

		d3.select('.'+className +' > button').text(itemName);
	}

	/*
	*	initCountryTab
	*	Initialize the country picker dropdown on the country tab in Who Am I?
	*/
	const initCountryTab = () => {

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

	const initGeographicDivisions = () => {
		const geoCentralArray =['Country', 'State', 'Province'];
		// prepare geo central dropdown
		d3.select('.geo-central-dropdown.dropdown-menu')
			.selectAll('.geo-central-option')
			.data(geoCentralArray)
			.enter()
			.append('a')
			.attr('class', 'geo-central-option dropdown-item')
			.text((itemName) => itemName)
			.on('click', (itemName) => {
				changeDropdownLabel('geo-central-dropdown', itemName);
			});
		changeDropdownLabel('geo-central-dropdown', geoCentralArray[0]);

		// prepare the second dropdown
		const secondCentralArray =['Province', 'Municipality', 'District', 'State'];
		d3.select('.geo-second-dropdown.dropdown-menu')
			.selectAll('.geo-second-option')
			.data(secondCentralArray)
			.enter()
			.append('a')
			.attr('class', 'geo-second-option dropdown-item')
			.text((itemName) => itemName)
			.on('click', (itemName) => {
				changeDropdownLabel('geo-second-dropdown', itemName);
			});
		changeDropdownLabel('geo-second-dropdown', secondCentralArray[0]);

		const thirdCentralArray =['Province', 'Municipality', 'District', 'State'];
		d3.select('.geo-third-dropdown.dropdown-menu')
			.selectAll('.geo-third-option')
			.data(thirdCentralArray)
			.enter()
			.append('a')
			.attr('class', 'geo-third-option dropdown-item')
			.text((itemName) => itemName)
			.on('click', (itemName) => {
				changeDropdownLabel('geo-third-dropdown', itemName);
			});
		changeDropdownLabel('geo-third-dropdown', thirdCentralArray[0]);

		const fourthCentralArray =['Barangay', 'County', 'District', 'City'];
		d3.select('.geo-fourth-dropdown.dropdown-menu')
			.selectAll('.geo-fourth-option')
			.data(fourthCentralArray)
			.enter()
			.append('a')
			.attr('class', 'geo-fourth-option dropdown-item')
			.text((itemName) => itemName)
			.on('click', (itemName) => {
				changeDropdownLabel('geo-fourth-dropdown', itemName);
			});
		changeDropdownLabel('geo-fourth-dropdown', fourthCentralArray[0]);

		$('#geography-division-btn').click(()=>{
			$(".geographical-divisions-block").toggle();
			$(".public-health-information-block").toggle();

		});
	}

	const initCountryDetailsTab = () => {
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
			const gbc = getCurrentGbc();
			gbc.cost = Util.getInputNumVal(this) / exchangeRate;  // store cost in USD
			checkIfDefault(gbc);
			App.updateAllCosts();
		});

		function updateCostDisplay() {
			const gbc = getCurrentGbc();
			$('.dv-input').val(Util.comma(gbc.cost * exchangeRate));
			checkIfDefault(gbc);
		}

		function checkIfDefault(gbc) {
			const isDefault = Math.round(gbc.default_cost) === Math.round(gbc.cost);
			$('.dv-input').css('background-color', isDefault ? '#fff' : inputNonDefaultColor);
			if (isDefault) {
				$('.dv-default-text').slideUp();
			} else {
				$('.dv-default-text')
					.text(`Default: ${Util.comma(gbc.default_cost * exchangeRate)}`)
					.slideDown();
			}
		}

		function getCurrentGbc() {
			const gbcId = $('.dv-select').val();
			return App.globalBaseCosts.find(d => d.id === gbcId);
		}

		updateCostDisplay();

		// fill out currency text
		$('.dv-currency').text(App.whoAmI.currency_iso);

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

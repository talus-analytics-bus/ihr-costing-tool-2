(() => {
	const inputNonDefaultColor = '#fff3cd';

	App.initWho = (whoTab) => {
		// call appropriate functions based on the whoTab
		switch(whoTab) {
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
				abbr: 'population',
				name: 'Population and Currency',
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


	const initPopDistTab = () => {
		const defaultPop = App.countryParams.find(d => d.name === App.whoAmI.name).multipliers.population;

		// set population defaults and behavior
		$('.population-input')
			.val(Util.comma(defaultPop))
			.on('change', function() {
				App.whoAmI.multipliers.population = Util.getInputNumVal(this);
				checkIfDefault();
				App.updateAllCosts();
			});

		// set currency defaults and behavior
		const currencyData = [];
		for (let ind in App.currencies) {
			currencyData.push({
				name: App.currencies[ind].name,
				code: App.currencies[ind].iso.code,
			});
		}
		Util.sortByKey(currencyData, 'name');
		Util.populateSelect('.currency-select', currencyData, {
			nameKey: 'name',
			valKey: 'code',
		});
		$('.currency-select')
			.val(App.whoAmI.currency_iso)
			.on('change', function() {
				App.whoAmI.currency_iso = $(this).val();
				App.updateAllCosts();
			});

		// function for checking if user has entered a custom population
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

		$('.proceed-button').click(() => hasher.setHash('costs/p-1/1'));
	}

	const initCountryDetailsTab = () => {
		const geoDivisions = [
			{
				nameAttr: 'intermediate_1_area_name',
				valueAttr: 'intermediate_1_area_count',
				description: 'Intermediate 1 area count',
				nameValues: ['Province', 'Municipality', 'District', 'State'],
			}, {
				nameAttr: 'intermediate_2_area_name',
				valueAttr: 'intermediate_2_area_count',
				description: 'Intermediate 2 area count',
				nameValues: ['Province', 'Municipality', 'District', 'State'],
			}, {
				nameAttr: 'local_area_name',
				valueAttr: 'local_area_count',
				description: 'Local area count',
				nameValues: ['Barangay', 'County', 'District', 'City'],
			}
		];
		const emptyOptionText = '-- select one --';

		const geoRows = d3.select('.geo-division-table tbody').selectAll('tr')
			.data(geoDivisions)
			.enter().append('tr');
		geoRows.append('td').text(d => `${d.description}:`);
		geoRows.append('td').append('select')
			.attr('class', 'form-control')
			.each(function(d) {
				const nameValues = [emptyOptionText].concat(d.nameValues);
				Util.populateSelect(this, nameValues);

				const currNameVal = App.whoAmI[d.nameAttr];
				if (currNameVal) $(this).val(currNameVal);
			})
			.on('change', function(d) {
				const val = $(this).val();
				App.whoAmI[d.nameAttr] = (val === emptyOptionText) ? '' : val;
			});
		geoRows.append('td').append('input')
			.attr('class', 'form-control')
			.attr('value', d => Util.comma(App.whoAmI.multipliers[d.valueAttr]))
			.on('change', function(d) {
				App.whoAmI.multipliers[d.valueAttr] = Util.getInputNumVal(this);
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
		$('.proceed-button').click(() => hasher.setHash('costs/p-1/1'));
	}
})();

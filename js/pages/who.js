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
		// transforms currency object and adds code that matches with the original currencies.json key
		const currencyObj = (key, obj) => Object.assign({}, obj, { code: key });
		const changeDropdownLabel = (name) => {
			d3.select('.currency-container > button').text(name);
		}

		// populate currency dropdown
		const currenciesArray = Object.keys(App.currencies)
			.map((key) => currencyObj(key, App.currencies[key]));
		d3.select('.currency-container-dropdown.dropdown-menu').selectAll('.currency-option')
			.data(currenciesArray)
			.enter().append('a')
				.attr('class', 'currency-option dropdown-item')
				.text(d => d.name)
				.on('click', (d) => {
					changeDropdownLabel(d.name);
					App.whoAmI.currency_iso = d.iso.code;
					App.updateAllCosts();
				});


		// populate country dropdown
		d3.select('.country-dropdown.dropdown-menu').selectAll('.country-option')
			.data(App.countryParams)
			.enter().append('a')
				.attr('class','country-option dropdown-item')
				.text(d => d.name)
				.on('click', (d) => {
					d3.select('.country-dropdown.dropdown > button').text(d.name);
					countryDropdownToggle(d.abbreviation);
					App.whoAmI = JSON.parse(JSON.stringify(d));
					App.updateAllCosts();
				});

		// initialize dropdown values with user values if any
		if (App.whoAmI.name) {
			d3.select('.country-dropdown.dropdown > button').text(App.whoAmI.name);
		}
		if (App.whoAmI.currency_iso) {
			const currencyObj = App.currencies[App.whoAmI.currency_iso];
			changeDropdownLabel(currencyObj.name);
		}

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
				nameAttr: 'central_area_name',
				valueAttr: 'central_area_count',
				description: 'Primary geographical division of the country',
				nameValues: ['Country', 'State', 'Province'],
			}, {
				nameAttr: 'intermediate_1_area_name',
				valueAttr: 'intermediate_1_area_count',
				description: 'Secondary geographical division of the country',
				nameValues: ['Province', 'Municipality', 'District', 'State'],
			}, {
				nameAttr: 'intermediate_2_area_name',
				valueAttr: 'intermediate_2_area_count',
				description: 'Tertiary geographical division of the country',
				nameValues: ['Province', 'Municipality', 'District', 'State'],
			}, {
				nameAttr: 'local_area_name',
				valueAttr: 'local_area_count',
				description: 'Local geographical division of the country',
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
		$('.previous-button').click(() => hasher.setHash('costs/population'));
		$('.next-button').click(() => hasher.setHash('costs/default-costs'));
		$('.proceed-button').click(() => hasher.setHash('costs/p-1/1'));
	}

	const initDefaultCostsTab = () => {
		// look up exchange rate
		const exchangeRate = App.getExchangeRate();

		// find global base costs to show on page for user review
		const defaultCosts = App.globalBaseCosts.filter(gbc => gbc.show_on_dv);

		// add overhead percentage to the default costs so it is included in the
		// page for user review
		defaultCosts.push({
		  "cost": 0.6,
		  "cost_unit": "per year",
		  "description": "The additional amount that will be budgeted for employee overhead expenses, as a percentage of the employee's annual salary",
		  "id": "gbc.op",
		  "name": "Overhead percentage",
		  "tab_name": "Personnel compensation",
		  "subheading_name": "Salaries"
		});

		// make tree version of the GBCs so they can be added to the page in the
		// correct groups

		// get unique tab names
		const tabNames = _.unique(_.pluck(defaultCosts, 'tab_name'));

		// declare tree
		const defaultCostsTree = [];

		// for each unique tab name
		for (let i = 0; i < tabNames.length; i++) {
			// get current tab name
			const curTab = tabNames[i];

			// create tree node for tab
			const tabNode = {};
			tabNode[curTab] = [];

			// get GBCs with this tab name
			const tabGbcs = defaultCosts.filter(gbc => gbc.tab_name === curTab);

			// get subheaders if they exist
			const subNames = _.unique(_.pluck(tabGbcs, 'subheading_name'));

			// for each subheading name
			for (let j = 0; j < subNames.length; j++) {
				// get current sub name
				const curSub = subNames[j];

				// create tree node for subheading
				const subNode = {};
				subNode[curSub] = [];

				// get GBC with this sub name
				const subGbcs = tabGbcs.filter(gbc => gbc.subheading_name === curSub);

				// push these GBCs to the sub node
				subNode[curSub] = subGbcs;
				
				// push the sub node to the tab node
				tabNode[curTab].push(subNode);
			}

			// push tab node to tree
			defaultCostsTree.push(tabNode);
		}

		// let mainSkipList = [];
		// for (let i = 0; i < defaultCosts.length; i++) {
		// 	const curDefaultCost = defaultCosts[i];
		// 	if (mainSkipList.indexOf(curDefaultCost.tab_name) > -1) continue;
		// 	else {
		// 		let newTreeItem = {};
		// 		newTreeItem[curDefaultCost.tab_name] = [];

		// 		// get all GBC with this tab name
		// 		const newTreeItemGbcs = defaultCosts.filter(gbc => gbc.tab_name === curDefaultCost.tab_name);

		// 		// for each of the GBCs with this tab name
		// 		for (let j = 0; j < newTreeItemGbcs.length; j++) {

		// 		}
		// 	}
		// }

		// add headers, subheaders, labels, text fields, costs, units, and descriptions
		// to the page
		// TODO

		// add Overhead Percentage, since it's not in the global base costs data structure
		// and needs to be hardcoded in
		// TODO

		// tell user if they set the cost to non-default value
		// TODO

		// save any changes the user makes to the cost values
		// TODO

		// begin old code --------------------------------------------------------- //
		// // look up exchange rate
		// const exchangeRate = App.getExchangeRate();

		// // build inputs from global costs data
		// const defaultCosts = App.globalBaseCosts.filter(gbc => gbc.show_on_dv);

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

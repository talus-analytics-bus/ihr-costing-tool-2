(() => {
	const inputNonDefaultColor = '#fff3cd';
	const blocks = [
		{
			abbr: 'population',
			name: 'Population and Currency',
		}, {
			abbr: 'country-details',
			name: 'Country Details',
		}, {
			abbr: 'default-costs',
			name: 'Cost Assumptions',
			children: ['personnel', 'technology', 'printing', 'meetings'],
		}, {
			abbr: 'personnel',
			tabName: 'Personnel compensation',
			name: 'Personnel Compensation',
			level: 1,
		}, {
			abbr: 'technology',
			name: 'Technology',
			level: 1,
		}, {
			abbr: 'printing',
			name: 'Printing',
			level: 1,
		}, {
			abbr: 'meetings',
			name: 'Meetings',
			level: 1,
		}
	];

	App.initWho = (whoTab) => {
		if (whoTab === 'default-costs') {
			hasher.setHash('costs/personnel');
			return;
		}

		// call appropriate functions based on the whoTab
		switch(whoTab) {
			case 'population':
				initPopDistTab();
				break;
			case 'country-details':
				initCountryDetailsTab();
				break;
			default:
				initDefaultCostsTab(whoTab);
		}

		/* ------------ Input Block Overview and Links ---------- */

		// add a tab for each of the blocks
		const blockLinks = d3.select('.block-link-container').selectAll('.block-link')
			.data(blocks)
			.enter().append('div')
				.attr('class', 'block-link')
				.attr('level', d => d.level)
				.classed('active', (d) => {
					if (d.children) return d.children.includes(whoTab);
					return whoTab === d.abbr;
				})
				.style('display', (d) => {
					if (d.level) {
						if (['personnel', 'technology', 'printing', 'meetings'].includes(whoTab)) {
							return 'inline-block';
						}
						return 'none';
					}
					return 'inline-block';
				})
				.on('click', d => hasher.setHash(`costs/${d.abbr}`));

		// add an arrow to indicate which block is showing
		const chevron = blockLinks.append('svg')
			.attr('class', 'chevron')
			.classed('active', d => d.abbr === 'default-costs')
			.attr('viewBox', '0 0 24 24')
			.attr('src', 'img/chevron-right.png')
			.style('display', (d) => {
				if (d.children && d.children.includes(whoTab)) return 'inline';
				return whoTab === d.abbr ? 'inline' : 'none';
			});
		chevron.append('path')
			.attr('d', 'M8 5v14l11-7z');

		// add the title and the gradient cover
		blockLinks.append('div')
			.attr('class', 'block-link-title')
			.html(d => d.name);
		blockLinks.append('div').attr('class', 'block-link-cover');

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
		// show the correct block content
		$(`.population-block`).slideDown();

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
		// show the correct block content
		$(`.country-details-block`).slideDown();

		const geoDivisions = [
			{
				nameAttr: 'intermediate_1_area_name',
				valueAttr: 'intermediate_1_area_count',
				description: 'Intermediate (e.g., province, district)',
				nameValues: ['Province', 'Municipality', 'District', 'State'],
			}, {
				nameAttr: 'intermediate_2_area_name',
				valueAttr: 'intermediate_2_area_count',
				description: 'Intermediate 2 (optional)',
				nameValues: ['Province', 'Municipality', 'District', 'State', 'County'],
			}, {
				nameAttr: 'local_area_name',
				valueAttr: 'local_area_count',
				description: 'Local (e.g., county, city)',
				nameValues: ['Barangay', 'City', 'Constituency', 'County', 'District'],
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
				description: 'Number of health care facilities in the country',
				unit: 'facilities / country',
			},/* {
				name: 'central_epi_count',
				description: 'Estimated total number of epidemiologists in the country',
				unit: 'people',
			}, */{
				name: 'central_chw_count',
				description: 'Number of community health workers in the country',
				unit: 'people / country',
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

	const initDefaultCostsTab = (whoTab) => {
		// show the correct block content
		$(`.default-costs-block`).slideDown();

		// look up exchange rate
		const exchangeRate = App.getExchangeRate();

		// find global base costs to show on page for user review
		const defaultCosts = App.globalBaseCosts.filter((gbc) => {
			if (!gbc.show_on_dv) return false;
			const blockInfo = blocks.find(b => b.abbr === whoTab);
			if (blockInfo.tabName) return gbc.tab_name === blockInfo.tabName;
			return gbc.tab_name === blockInfo.name;
		});

		// add overhead percentage to the default costs so it is included in the
		// page for user review
		if (whoTab === 'personnel') {
			defaultCosts.push({
			  "cost": 0.6,
			  "cost_unit": "% per year",
			  "description": "Additional amount that will be budgeted for employee overhead expenses, as a percentage of the employee's annual salary",
			  "id": "gbc.overhead",
			  "name": "Overhead percentage",
			  "tab_name": "Personnel compensation",
			  "subheading_name": "Salaries",
			});
		}

		// add meeting attendee data
		if (whoTab === 'meetings') {
			for (let i = 0; i < App.globalStaffMultipliers.length; i++) {
				defaultCosts.push(App.globalStaffMultipliers[i]);
			}
		}

		// for printing, add subheading_name
		defaultCosts.forEach((dc) => {
			if (dc.tab_name === 'Printing') dc.subheading_name = 'Printing';
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

		// add headers, subheaders, labels, text fields, costs, units, and descriptions
		// to the page

		// for each tab name (main header)
		for (let i = 0; i < defaultCostsTree.length; i++) {
			// get current tab name
			const tabNode = defaultCostsTree[i];
			const tabName = Object.keys(tabNode)[0];

			// add a divider if this isn't the first header
			if (i > 0) {
				d3.select('.dv-container').append('div')
					.attr('class','dv-divider');
			}

			// add container for subheading/content
			const tabContent = d3.select('.dv-container').append('div')
				.attr('class','dv-tab-content');

			// for each subheading group
			for (let j = 0; j < tabNode[tabName].length; j++) {
				// add row for the subheading group
				const subCol = tabContent
					.append('div')
						.attr('class','dv-subheading-row')
					.append('div')
						.attr('class','dv-subheading-col');

				// get subheader name
				const subNode = tabNode[tabName][j];
				const subName = Object.keys(subNode)[0];

				// add header for subheading
				subCol.append('h3')
					.attr('class','dv-h3')
					.text(subName);

				// for each item in the subheading group
				for (let k = 0; k < subNode[subName].length; k++) {
					// get item name
					const itemNode = subNode[subName][k];
					const itemName = itemNode.name;

					// add row for the item group
					const itemGroup = subCol
						.append('div')
							.attr('class','dv-item-row row')
						.append('div')
							.attr('class','dv-item-col col-sm-12');

					// add header for item name
					itemGroup.append('div')
						.attr('class','dv-item-name')
						.append('b')
						.text(itemName);

					// add break
					itemGroup.append('br');
					
					// add text for item description
					itemGroup.append('span')
						.attr('class','dv-description')
						.text(itemNode.description);

					// add item input group
					const inputGroup = itemGroup.append('div')
						.attr('class','dv-input-group');

					// add input for item cost
					inputGroup.append('input')
						.attr('class','dv-input form-control')
						.attr('gbcid', itemNode.id);

					// if it's a BGC:
					if (itemNode.id.indexOf('gbc') > -1) {
						// add label for input currency, if item is not
						// "overhead percentage"
						if (itemName !== "Overhead percentage") {
							inputGroup.append('span')
								.attr('class','dv-currency');
						}
						// add label for input unit
						inputGroup.append('span')
							.attr('class','dv-cost-unit')
							.text(" " + itemNode.cost_unit);

					} else {
						// add label for input unit
						inputGroup.append('span')
							.attr('class','dv-cost-unit')
							.text(" attendees");
					}

					// add default text warning
					inputGroup.append('div')
						.attr('class','dv-default-text default-text');
				}
			}			
		}

		// add on-click for tab headers
		$('.dv-input').on('change', function() {
			const input = d3.select(this);
			const gbcId = input.attr('gbcid');
			if (gbcId.indexOf('gbc') > -1) {
				if (gbcId === 'gbc.overhead') {
					App.whoAmI.staff_overhead_perc = Util.getInputNumVal(this) / 100;
				} else if (gbcId !== null) {
					const gbc = App.globalBaseCosts.find(d => d.id === gbcId);
					gbc.cost = Util.getInputNumVal(this) / exchangeRate;  // store cost in USD
				}
			} else {
				const gsm = App.globalStaffMultipliers.find(d => d.id === gbcId);
				gsm.count = Util.getInputNumVal(this);
			}
			
			checkIfDefault(gbcId, this);
			App.updateAllCosts();
		});

		function updateCostDisplay() {
			// select all cost displays
			const allCosts = d3.selectAll('.dv-input');
			// for each, find and populate correct cost
			allCosts.each(function() {
				// select current input
				const input = d3.select(this);

				// get gbcId
				const gbcId = input.attr('gbcid');
				if (gbcId.indexOf('gbc') > -1) {
					if (gbcId === 'gbc.overhead') {
						input.node().value = (Util.comma(100 * App.whoAmI.staff_overhead_perc));
					} else if (gbcId !== null) {
						const gbc = App.globalBaseCosts.find(d => d.id === gbcId);
						input.node().value = (Util.comma(gbc.cost * exchangeRate));
					}
				} else {
					const gsm = App.globalStaffMultipliers.find(d => d.id === gbcId);
					input.node().value = (Util.comma(gsm.count));
					$('.dv-currency').text(App.whoAmI.currency_iso);
				}
				
				checkIfDefault(gbcId, this);
			});
		}

		function checkIfDefault(gbcId, selector) {
			const input = d3.select(selector);

			let isDefault = true;
			let defaultText = 'Default: ';
			if (gbcId.indexOf('gbc') > -1) {
				if (gbcId === 'gbc.overhead') {
					isDefault = App.whoAmI.staff_overhead_perc === 0.6;
					defaultText += '60';
				} else if (gbcId !== null) {
					const gbc = App.globalBaseCosts.find(d => d.id === gbcId);
					isDefault = Math.round(gbc.default_cost) === Math.round(gbc.cost);
					defaultText += Util.comma(gbc.default_cost * exchangeRate);
				}
			} else {
				const gsm = App.globalStaffMultipliers.find(d => d.id === gbcId);
				isDefault = gsm.default_count === gsm.count;
				defaultText += Util.comma(gsm.default_count);
			}
			

			input.style('background-color', () => {
				return isDefault ? '#fff' : inputNonDefaultColor;
			});
			const inputDefaultText = $(d3.select(input.node().parentNode).select('.dv-default-text').node());
			if (isDefault) {
				inputDefaultText.slideUp();
			} else {
				inputDefaultText
					.text(defaultText)
					.slideDown();
			}
		}

		updateCostDisplay();


		// behavior for next button
		$('.proceed-button').click(() => hasher.setHash('costs/p-1/1'));
	}
})();

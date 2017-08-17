(() => {
	App.initWho = (ccClass) => {

		/*Initialize country picker map*/
		App.createLeafletMap();
		switch(ccClass) {
            case 'currency':
                initCurrencyTab();

                break;
            case 'pop-dist':
                initPopDistTab();
                break;
            case 'default-costs':
                initDefaultCostsTab();
            default: // country tab
                initCurrencyTab();
                initCountryTab();

        }

		/* ---------------------------------- Input Block Overview and Links ------------------------------------ */		
		// define blocks
		const blocks = {
            "country": {},
            "currency": {},
            "pop-dist": {},
            "default-costs": {}
		}

		// define blocksShowing
		const blocksShowing = [
            {
            "abbr": "country",
            "name": "Country and Currency",
            "level": 0,
            "status": ""
            },
            /*{
            "abbr": "currency",
            "name": "Currency",
            "level": 0,
            "status": ""
            },*/
            {
            "abbr": "pop-dist",
            "name": "Population and Districts",
            "level": 0,
            "status": ""
            },
            {
                "abbr": "default-costs",
                "name": "Country Details",
                "level": 0,
                "status": ""
            }
		];

		// call function to render the tabs
		App.setupWhoTabs(blocksShowing, blocks, ccClass);
	};

    hasCountrySelected = () => App.whoAmI.hasOwnProperty('currency');
    hasCurrencySelected = () => App.whoAmI.selectedCurrency && App.whoAmI.selectedCurrency.hasOwnProperty('name');

	/*
	*	initCountryTab
	*	Initialize the country picker dropdown on the country tab in Who Am I?
	*/
	initCountryTab = () => {

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
            App.whoAmI.selectedCurrency = App.currencies[App.whoAmI.currency] ? currencyObj(App.whoAmI.currency, App.currencies[App.whoAmI.currency]) : {};
        }

        // if there is selected currency, mark it as selected
        if (hasCurrencySelected()) {
            changeDropdownLabel(App.whoAmI.selectedCurrency.name);
        }

        // prepare currency dropdown
        d3.select('.currency-container-dropdown.dropdown-menu')
            .selectAll('.currency-option')
            .data(currenciesArray)
            .enter()
            .append('a')
            .attr('class', 'currency-option dropdown-item')
            .text((d) => d.name)
            .on('click', (d) => {
                changeDropdownLabel(d.name);
                App.whoAmI.selectedCurrency = d;
            })

		if (App.whoAmI.hasOwnProperty('name')) {
            d3.select('.country-dropdown.dropdown > button')
                .text(App.whoAmI.name);
		}

		d3.select('.country-dropdown.dropdown-menu').selectAll('.country-option')
			.data(App.countryParams)
			.enter()
				.append('a')
					.attr('class','country-option dropdown-item')
					.text(function(d) { return d.name})
					.on('click', function (d) {
						d3.select('.country-dropdown.dropdown > button').text(d.name);
						countryDropdownToggle(d.abbreviation);
						App.whoAmI = JSON.parse(JSON.stringify(d));

                        // if country is selected and no currency has been selected yet, select matching country currency as default
                        if (hasCountrySelected() && !hasCurrencySelected()) {
                            App.whoAmI.selectedCurrency = App.currencies[App.whoAmI.currency] ? currencyObj(App.whoAmI.currency, App.currencies[App.whoAmI.currency]) : {};
                            changeDropdownLabel(App.whoAmI.selectedCurrency.name);
                        }

                        // if there is selected currency, mark it as selected
                        if (hasCurrencySelected()) {
                            changeDropdownLabel(App.whoAmI.selectedCurrency.name);
                        }
					});
	};

	initCurrencyTab = () => {
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
            App.whoAmI.selectedCurrency = App.currencies[App.whoAmI.currency] ? currencyObj(App.whoAmI.currency, App.currencies[App.whoAmI.currency]) : {};
        }

        // if there is selected currency, mark it as selected
        if (hasCurrencySelected()) {
            changeDropdownLabel(App.whoAmI.selectedCurrency.name);
        }

	    // prepare currency dropdown
        d3.select('.currency-container-dropdown.dropdown-menu')
            .selectAll('.currency-option')
            .data(currenciesArray)
            .enter()
                .append('a')
                .attr('class', 'currency-option dropdown-item')
                .text((d) => d.name)
                .on('click', (d) => {
                    changeDropdownLabel(d.name);
                    App.whoAmI.selectedCurrency = d;
                })
    }

    initPopDistTab = () => {
        const jeeTreeFieldMapping = {
            'basic_info.population': 'population',
            'basic_info.level_1_areas.area_name': 'adm-org-1',
            'basic_info.level_1_areas.area_count': 'adm-org-1-count',
            'basic_info.level_2_areas.area_name': 'adm-org-2',
            'basic_info.level_2_areas.area_count': 'adm-org-2-count',
            'basic_info.level_3_areas.area_name': 'adm-org-3',
            'basic_info.level_3_areas.area_count': 'adm-org-3-count',
            'basic_info.level_4_areas.area_name': 'adm-org-4',
            'basic_info.level_4_areas.area_count': 'adm-org-4-count',
            'advanced_info.national_health_care_facilities_count': 'hcf',
            'advanced_info.staff.national_epi_count': 'epi',
            'advanced_info.staff.national_chw_count': 'chw',
        };

        const getJeeTreeValue = (keyString, jeeTreeObj) => {
            return keyString.split('.')
                .reduce((objVal, currKey) => {
                    return objVal.hasOwnProperty(currKey) ? objVal[currKey] : {};
                }, jeeTreeObj);
        }

        const setKeyTreeValue = (keyString, jeeTreeObj, newVal) => {
            const isValidNestedKey = keyString.split('.')
                .reduce((acc, currKey) => {
                    if (acc.val) {
                        if (acc.obj.hasOwnProperty(currKey)) {
                            return Object.assign({}, acc, {
                                obj: acc.obj[currKey],
                            });
                        }
                        return {
                            obj: {},
                            val: false,
                        }
                    }
                    return acc;
                }, {
                    obj: jeeTreeObj,
                    val: true,
                });

            if (isValidNestedKey.val) {
                // TODO: change this
                const exp = `jeeTreeObj.${keyString} = ${newVal}`;

                eval(exp);
            }
        }

        // set default values if country is selected
        if (hasCountrySelected()) {
            Object.keys(jeeTreeFieldMapping)
                .forEach((keyString) => {
                    $(`#${jeeTreeFieldMapping[keyString]}`).val(getJeeTreeValue(keyString, App.whoAmI));
                });
        }

        // change jeetree values
        const changeValue = _.debounce(setKeyTreeValue, 1000);
        const invertedMapping = _.invert(jeeTreeFieldMapping);
        $('#pop-dist input').on('keyup', (ev) => {
            const id = $(ev.target).attr('id');

            changeValue(invertedMapping[id], App.whoAmI, ev.target.value);
        });

    }

	initDefaultCosts = () => {

        const categoriesTab = new Set(App.globalBaseCosts.map(e=>e.tab_name));
        var filters = App.globalBaseCosts.filter(e=>e.tab_name===search);

    }
    /*
	*	countryDropdownToggle
	*	Set the map's active country to the dropdown selection
	*/
	countryDropdownToggle = (countryCode) => {
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
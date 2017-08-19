(() => {
	App.initWho = (ccClass) => {

		/*Initialize country picker map*/
		App.createLeafletMap();
		switch(ccClass) {
            case 'currency':
                initCurrencyTab();

                break;
            case 'population':
                initPopDistTab();
                initGeographicDivisions();
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
            //"currency": {},
            "population": {},
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
            "abbr": "population",
            "name": "Total Population",
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



        $('.defn').tooltipster({
            theme: 'tooltipster-default',
            trigger: 'click',
            position: 'bottom',
            interactive: true,
            contentAsHTML: true,
            maxWidth: 500,
            functionInit: function(instance, helper) {
                var defnName = instance["_$origin"].attr('defn');
                if (defnName === 'pop') {
                    var content = 'This is the estimated total popluation for the country chosen. The number can be changed using the edit box below';
                    instance.content(content);
                    return content;
                }
                else if (defnName === 'geo') {
                    var content = 'This is the estimated total popluation for the country chosen. The number can be changed using the edit box below';
                    instance.content(content);
                    return content;
                }
                else if (defnName === 'phi') {
                    var content= 'This is the estimated total popluation for the country chosen. The number can be changed using the edit box below';
                    instance.content(content);
                    return content;
                }
            }
        });
	};



    hasCountrySelected = () => App.whoAmI.hasOwnProperty('currency');
    hasCurrencySelected = () => App.whoAmI.selectedCurrency && App.whoAmI.selectedCurrency.hasOwnProperty('name');

    /* Generic way to change a dropdown label */
    const changeDropdownLabel = (className, itemName) => {

        d3.select('.'+className +' > button').text(itemName);
    }

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
            });

		if (App.whoAmI.hasOwnProperty('name')) {
            d3.select('.country-dropdown.dropdown > button')
                .text(App.whoAmI.name);
		}

		/* Prepare the country dropdown*/
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

    initDefaultCostsTab = () =>{}

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
        $('#population input').on('keyup', (ev) => {
            const id = $(ev.target).attr('id');

            changeValue(invertedMapping[id], App.whoAmI, ev.target.value);
        });

        $("#population-btn").click(()=>{
            $(".population-block").toggle();
            $(".geographical-divisions-block").toggle();
            //initGeographicDivisions(); // load the georaphic divisions
        });

    }

    initGeographicDivisions = () => {
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
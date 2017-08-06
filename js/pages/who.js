(() => {
	App.initWho = (ccClass) => {

		/*Initialize country picker map*/
		App.createCountryMap();
		switch(ccClass) {
            case 'currency':
                initCurrencyTab();
                break;
            case 'pop-dist':
            default:
                initCountryTab();
        }

		/* ---------------------------------- Input Block Overview and Links ------------------------------------ */		
		// define blocks
		const blocks = {
		  "country": {},
		  "currency": {},
		  "pop-dist": {}
		}

		// define blocksShowing
		const blocksShowing = [
		  {
		    "abbr": "country",
		    "name": "Country",
		    "level": 0,
		    "status": ""
		  },
		  {
		    "abbr": "currency",
		    "name": "Currency",
		    "level": 0,
		    "status": ""
		  },
		  {
		    "abbr": "pop-dist",
		    "name": "Population and Districts",
		    "level": 0,
		    "status": ""
		  }
		];

		// call function to render the tabs
		App.setupTabs(blocksShowing, blocks, ccClass);
	};

	/*
	*	initCountryTab
	*	Initialize the country picker dropdown on the country tab in Who Am I?
	*/
	initCountryTab = () => {
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
					});
	};

	initCurrencyTab = () => {
	    // transforms currency object and adds code that matches with the original currencies.json key
	    const currencyObj = (key, obj) => Object.assign({}, obj, {
	        code: key,
        });

	    const changeDropdownLabel = (name) => {
            d3.select('.currency__container > button').text(name);
        }

	    // transform currencies object into array
        const currenciesArray = Object.keys(App.currencies)
            .map((key) => currencyObj(key, App.currencies[key]));

	    const hasCountrySelected = () => App.whoAmI.hasOwnProperty('currency');
	    const hasCurrencySelected = () => App.whoAmI.selectedCurrency && App.whoAmI.selectedCurrency.hasOwnProperty('name');

        // if country is selected and no currency has been selected yet, select matching country currency as default
        if (hasCountrySelected() && !hasCurrencySelected()) {
            App.whoAmI.selectedCurrency = App.currencies[App.whoAmI.currency] ? currencyObj(App.whoAmI.currency, App.currencies[App.whoAmI.currency]) : {};
        }

        // if there is selected currency, mark it as selected
        if (hasCurrencySelected()) {
            changeDropdownLabel(App.whoAmI.selectedCurrency.name);
        }

	    // prepare currency dropdown
        d3.select('.currency__container__dropdown.dropdown-menu')
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
				console.log(d);
				if (d.properties.code === countryCode) {
					d3.select(this).classed('active',true);
				}
			});
	};
})();
(() => {
	App.initWho = (ccClass) => {

		/*Initialize country picker map*/
		App.createCountryMap();
		initCountryTab();

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

	/*
	*	countryDropdownToggle
	*	Set the map's active country to the dropdown selection
	*/
	countryDropdownToggle = (countryCode) => {
		console.log(countryCode)
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
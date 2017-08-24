(() => {
	App.initCountry = () => {
		App.createLeafletMap();

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

						// set the map's active country to the dropdown selection
		const countryDropdownToggle = (countryCode) => {
			d3.selectAll(".country")
				.classed('active', d => d.properties.code === countryCode);
		};

	}
})();

const App = {};

(() => {

	/*
	*	Initialize basic app behaviors
	*/
	App.initialize = (callback) => {

		// initiate behavior for navigation links
		$('.nav-item').click(function() {
			hasher.setHash($(this).attr('page'));
		});

		// activate tooltipster
		$.tooltipster.setDefaults({
			plugins: ['follower'],
			contentAsHTML: true,
			trigger: 'hover',
			anchor: 'top-center',
			 offset: [5, -25],
			theme: 'tooltipster-shadow',
			maxWidth: 320,
		});
		
		// load country params data
		d3.queue()
		.defer(d3.json, 'data/country-params.json')
		.await((error, countryParams) => {

			App.countryParams = countryParams;
			
			// launch callback fcn in arguments
			callback();
		});
	}
	
	App.initResults = () => {

		const selector = '.cost-partition-chart';

		// Load notional data and build chart
		d3.queue()
			.defer(d3.csv, 'data/notional_cost_data.csv')
			.await((error, notional_data) => {
				if (error) throw error;
				
				Charts.buildCostPartitionChart(selector, notional_data);
			});

	};

})();

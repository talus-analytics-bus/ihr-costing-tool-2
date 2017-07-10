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
		
		// launch callback fcn in arguments
		callback();
	}
	
	App.initResults = () => {

		const selector = '.cost-partition-chart';
		Charts.buildCostPartitionChart(selector);

	};

})();

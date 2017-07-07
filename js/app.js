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

		// launch callback fcn in arguments
		callback();
	}
})();

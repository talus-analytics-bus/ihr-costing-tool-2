const Routing = {};

(() => {
	// Precompiles all html handlebars templates on startup.
	// Compiling is front-loaded so the compiling does not happen on page changes.
	Routing.templates = {};
	Routing.precompileTemplates = () => {
		$("script[type='text/x-handlebars-template']").each((i, e) => {
			Routing.templates[e.id.replace('-template', '')] = Handlebars.compile($(e).html());
		});
	};

	// TODO add URL params that define which tab or indicator the user is
	// on so that the back button works as expected
	Routing.initializeRoutes = () => {
		// setup crossroads for routing
		crossroads.addRoute('/', () => {
			loadPage('home', App.initHome);
			window.scrollTo(0, 0);
		});
		crossroads.addRoute('/country', () => {
			loadPage('country', App.initCountry);
			window.scrollTo(0, 0);
		});

		crossroads.addRoute('/overview', () => {
			loadPage('overview', App.initOverview);
			window.scrollTo(0, 0);
		});

		crossroads.addRoute('/scores', () => {
			hasher.setHash(`scores/p-1/1`)
		});
		crossroads.addRoute('/scores/:{ccId}:', (ccId) => {
			hasher.setHash(`scores/${ccId}/1`)
		});
		crossroads.addRoute('/scores/:{ccId}:/:{indId}:', (ccId, indId) => {
			if (indId === undefined && ccId !== undefined) {
				indId = '1';
				hasher.setHash(`scores/${ccId}/${indId}`)
			}
			else if (indId === undefined && ccId === undefined) {
				indId = '1';
				ccId = 'p-1';
				hasher.setHash(`scores/${ccId}/${indId}`)
			}
			loadPage('scores', App.initScores, ccId, indId);
			//window.scrollTo(0, 0);
		});

		crossroads.addRoute('/costsinstructions', () => {
			loadPage('costs-instructions', App.initCostsInstructions);
			window.scrollTo(0, 0);
		});

		crossroads.addRoute('/costs', () => {
			hasher.setHash('costs/population');
		});
		crossroads.addRoute('/costs/:{whoTab}:', (whoTab) => {
			loadPage('who', App.initWho, whoTab);
			window.scrollTo(0, 0);
		});
		crossroads.addRoute('/costs/:{ccId}:/:{indId}:', (ccId, indId) => {
			if (!indId && ccId) {
				indId = '1';
				hasher.setHash(`costs/${ccId}/${indId}`);
			} else if (!indId && !ccId) {
				indId = '1';
				ccId = 'p-1';
				hasher.setHash(`costs/${ccId}/${indId}`);
			}
			loadPage('costs', App.initCosting, ccId, indId);
			window.scrollTo(0, 0);
		});

		crossroads.addRoute('/results', () => {
			loadPage('results', App.initResults);
			window.scrollTo(0, 0);
		});
		crossroads.addRoute('/background', () => {
			loadPage('background', App.initBackground);
			window.scrollTo(0, 0);
		});
		crossroads.addRoute('/contact', () => {
			loadPage('contact', App.initContact);
			window.scrollTo(0, 0);
		});

		// setup hasher for subscribing to hash changes and browser history
		hasher.prependHash = '';
		hasher.initialized.add(parseHash);
		hasher.changed.add(parseHash);
		hasher.init();		
	};

	const okayPages = ['home', 'country', 'background', 'contact'];

	function loadPage(pageName, func, ...data) {
		// kill any noty notifications
		// $.noty.closeAll();

		// user must have set country before proceeding to costing
		if (!App.whoAmI.abbreviation && !okayPages.includes(pageName)) {
			hasher.setHash('country');
			noty({ text: '<b>Select a country before proceeding!</b>' });
			return;
		}

		// load the HTML, set the navbar, call the callback
		loadTemplate(pageName);
		setNavigationBar(pageName, ...data);
		if (func) func(...data);
	}

	function setNavigationBar(pageName, ...data) {
		if (pageName === 'home') pageName = '';
		d3.selectAll('.nav-item').classed('active', function() {
			return $(this).attr('page') === pageName;
		});
	}

	function parseHash(newHash) { 
		crossroads.parse(newHash);
	}

	function loadTemplate(page, data) {
		$('#page-content').html(Routing.templates[page](data));
	}
})();

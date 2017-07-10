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
		crossroads.addRoute('/overview', () => {
			loadPage('overview');
			window.scrollTo(0, 0);
		});
		crossroads.addRoute('/who', () => {
			loadPage('who', App.initWho);
			window.scrollTo(0, 0);
		});
		crossroads.addRoute('/default', () => {
			loadPage('default');
			window.scrollTo(0, 0);
		});
		crossroads.addRoute('/jee', () => {
			loadPage('jee');
			window.scrollTo(0, 0);
		});
		crossroads.addRoute('/costs', () => {
			loadPage('costs');
			window.scrollTo(0, 0);
		});
		crossroads.addRoute('/results', () => {
			loadPage('results', App.initResults);
			window.scrollTo(0, 0);
		});

		// setup hasher for subscribing to hash changes and browser history
		hasher.prependHash = '';
		hasher.initialized.add(parseHash);
		hasher.changed.add(parseHash);
		hasher.init();
	};

	function loadPage(pageName, func, ...data) {
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

	function parseHash(newHash) { crossroads.parse(newHash); }

	function loadTemplate(page, data) {
		$('#page-content').html(Routing.templates[page](data));
	}
})();

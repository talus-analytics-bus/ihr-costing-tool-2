(() => {
	NProgress.start();
	App.initialize(() => {
		Routing.precompileTemplates();
		Routing.initializeRoutes();
		NProgress.done();
		App.changeLanguage(App.lang);
	});
})();

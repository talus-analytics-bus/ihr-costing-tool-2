(() => {
	NProgress.start();
	App.initialize(() => {
		Routing.precompileTemplates();
		Routing.initializeRoutes();
		NProgress.done();
	});
})();

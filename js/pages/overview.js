(() => {
	App.initOverview = () => {
		$('.overview-start').click(() => { hasher.setHash('scores/'); });
	}
})();

(() => {
	App.initOverview = () => {
		$('.next-button').click(() => { hasher.setHash('scores/'); });

		// jee tool tooltip
		$('.jee-tool-img').tooltipster({
			trigger: 'hover',
			content: 'The <b>JEE Technology Tool</b> is a separate, open-access tool developed by the Global Health Security Agenda Private Sector Roundtable Technology and Analytics Working Group and powered by Qlik Technologies.',
		});
	}
})();

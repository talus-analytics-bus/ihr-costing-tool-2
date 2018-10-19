(() => {
	App.initHome = () => {
		const cookie = Util.getCookie('lang');
		if (cookie !== "") {
			$('.enter-site.fr').remove();
			$('.enter-site')
				.text(cookie === "fr" ? "Commencer" : "Start")
				.click(() => hasher.setHash('country'));
		} else {
			$('.enter-site.fr').click(() => {
				App.changeLanguage('fr');
				hasher.setHash('country');
			});
			$('.enter-site.en').click(() => {
				App.changeLanguage('en');
				hasher.setHash('country');
			});
		}
	}
})();

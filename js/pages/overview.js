(() => {
	App.initOverview = () => {
		$('.next-button').click(() => { hasher.setHash('scores/'); });

		// jee tool tooltip
		$('.jee-tool-img').tooltipster({
			trigger: 'hover',
			content: 'The <b>JEE Technology Tool</b> is a separate, open-access tool developed by the Global Health Security Agenda Private Sector Roundtable Technology and Analytics Working Group and powered by Qlik Technologies.',
		});

		// clicking "upload session" triggers file selection
		$('.btn-prior-session').on('click', function() { 
			$('.input-prior-session').trigger('click');
		});

		// user selected a file to upload... read and ingest
		$('.input-prior-session').on('change', function() {
			if ('files' in this) {
				if (!this.files.length) return;
				const file = this.files[0];
				if (file.name.slice(file.name.length - 4) !== '.ihr') {
					noty({
						timeout: 5000,
						text: '<b>Please select a file with a file type extension of <i>.ihr</i>',
					});
					return;
				}

				// read and ingest
				const reader = new FileReader();
				reader.onload = (e) => {
					const success = App.loadSessionData(e.target.result);
					if (success) {
						noty({
							timeout: 4000,
							type: 'success',
							text: '<b>Upload Success!</b><br>Your previous session has been restored.',
						});
					} else {
						noty({
							timeout: 5000,
							text: '<b>Error!</b><br>There was an error uploading your previous session.',
						})
					}
				}
				reader.readAsBinaryString(file);
			}
		});
	}
})();

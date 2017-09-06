(() => {
	App.initOverview = () => {
		$('.next-button').click(() => { hasher.setHash('scores/'); });

		// jee tool tooltip
		$('.jee-tool-img').tooltipster({
			trigger: 'hover',
			content: 'The <b>JEE Technology Tool</b> is a separate, open-access tool developed by the Global Health Security Agenda Private Sector Roundtable Technology and Analytics Working Group and powered by Qlik Technologies.',
		});

		/* ------------------ Uploading Session File --------------- */
		// clicking "select file from previous session" triggers file selection
		$('.btn-prior-session').on('click', () => { 
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
					NProgress.start();
					const success = App.loadSessionData(e.target.result);
					if (success) {
						App.updateAllCosts();
						noty({
							timeout: 4000,
							type: 'success',
							text: '<b>Upload Successful!</b><br>Your previous session has been restored.',
						});
					} else {
						noty({
							timeout: 5000,
							text: '<b>Error!</b><br>There was an error uploading your previous session.',
						})
					}
					NProgress.done();
				}
				reader.readAsBinaryString(file);
			}
		});

		/* ------------------ Downloading Costing Worksheet (contains all possible line items) --------------- */
		$('.btn-blank-template').on('click', () => {
			NProgress.start();
			App.exportCostingWorksheet(() => {
				NProgress.done();
			});
		});

		/* ------------------ Uploading Qlick Score File --------------- */
		// clicking "select score file" triggers file selection
		$('.btn-score-file').on('click', () => {
			$('.input-score-file').trigger('click');
		});

		// user selected a file to upload... read and ingest
		$('.input-score-file').on('change', function() {
			if ('files' in this) {
				if (!this.files.length) return;
				const file = this.files[0];
				if (file.name.slice(file.name.length - 4) !== '.xlsx') {
					noty({
						timeout: 5000,
						text: '<b>Please select a file with a file type extension of <i>.xlsx</i>',
					});
					return;
				}

				// read and ingest
				const reader = new FileReader();
				reader.onload = (e) => {
					NProgress.start();
					const success = App.loadQlickScoreData(e.target.result);
					if (success) {
						App.updateAllCosts();
						noty({
							timeout: 4000,
							type: 'success',
							text: '<b>Upload Successful!</b><br>Score data has been uploaded.',
						});
					} else {
						noty({
							timeout: 5000,
							text: '<b>Error!</b><br>There was an error uploading the score data. Please check the file format.',
						})
					}
					NProgress.done();
				}
				reader.readAsBinaryString(file);
			}
		});
	}
})();

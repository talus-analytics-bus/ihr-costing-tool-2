(() => {
	App.initOverview = () => {
		$('.next-button').click(() => { hasher.setHash('scores/'); });

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
					App.loadSessionData(e.target.result, (success, oldVersion) => {
						console.log('oldVersion = ' + oldVersion);
						if (success) {
							let text;
							if (oldVersion) {
								text = App.lang === 'fr' ? '<b>Upload réussi!</b><br>Votre session précédente a été restaurée.' : '<b>Upload Successful!</b><br>Your previous session has been restored. Please review your selections on the <a href="#costs/population">Set Default Values page</a>, as they may not have been saved by earlier versions of the tool.';
							} else {
								text = App.lang === 'fr' ? '<b>Upload réussi!</b><br>Votre session précédente a été restaurée.' : '<b>Upload Successful!</b><br>Your previous session has been restored.';
							}
							App.updateAllCosts();
							noty({
								timeout: 4000,
								type: 'success',
								text: text,
							});
						} else {
							const text = App.lang === 'fr' ? '<b>Erreur!</b><br>Une erreur s\'est produite lors du téléchargement de votre session précédente.' : '<b>Error!</b><br>There was an error loading your previous session.';
							noty({
								timeout: 5000,
								text: text,
							})
						}
						NProgress.done();
					});
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
				const fileNameArr = file.name.split('.');
				const fileType = fileNameArr[fileNameArr.length - 1];
				if (fileType !== 'xlsx' && fileType !== 'xls') {
					const text = App.lang === 'fr' ? '<b>Veuillez sélectionner un fichier avec une extension de type de fichier de <i>.xlsx</i></b>' : '<b>Please select a file with a file type extension of <i>.xlsx</i>';
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
						const text = App.lang === 'fr' ? '<b>Upload réussi!</b><br>Les données de score ont été téléchargées.' : '<b>Upload Successful!</b><br>Score data has been uploaded.';
						App.updateAllCosts();
						noty({
							timeout: 4000,
							type: 'success',
							text: text,
						});
					} else {
						const text = App.lang === 'fr' ? '<b>Erreur!</b><br>Une erreur s\'est produite lors du téléchargement des données de score. Veuillez vérifier le format de fichier.' : '<b>Error!</b><br>There was an error uploading the score data. Please check the file format.';
						noty({
							timeout: 5000,
							text: text,
						})
					}
					NProgress.done();
				}
				reader.readAsBinaryString(file);
			}
		});
	}
})();

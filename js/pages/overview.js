(() => {
	App.initOverview = () => {
		$('.next-button').click(() => { hasher.setHash('scores/'); });

		// jee tool tooltip
		$('.jee-tool-img').tooltipster({
			trigger: 'hover',
			content: 'The <b>JEE Technology Tool</b> is a separate, open-access tool developed by the Global Health Security Agenda Private Sector Roundtable Technology and Analytics Working Group and powered by Qlik Technologies.',
		});

		// Function to handle session file uploads
		App.uploadSessionFile = () => {
			$('.input-prior-session').trigger('click');
		};
		$('.btn-prior-session').on('click', function() { 
			App.uploadSessionFile();
		});

		// Function to process uploaded session files
		App.processSessionFile = () => {
			var x = document.getElementById("prior-session");
			var txt = "";
			if ('files' in x) {
				if (x.files.length == 0) {
					txt = "Select one or more files.";
				} else {
					for (var i = 0; i < x.files.length; i++) {
						var file = x.files[i];
						var reader = new FileReader();
						var result = '';
						reader.onload = function(e) {
							var priorSession = JSON.parse(e.target.result);
							// TODO read result and update session data accordingly
							// TODO reject invalid files?
							console.log(priorSession);
						};
						reader.readAsBinaryString(file);
					}
				}
			} 
		};

		// Function to handle score file uploads
		App.uploadScoreFile = () => {
			$('.input-score-file').trigger('click');
		};
		$('.btn-score-file').on('click', function() { 
			App.uploadScoreFile();
		});

		// Function to process uploaded score files
		App.processScoreFile = () => {
			var x = document.getElementById("score-file-upload");
			var txt = "";
			if ('files' in x) {
				if (x.files.length == 0) {
					txt = "Select one or more files.";
				} else {
		            var files = x.files;
		            f = files[0];
		            var reader = new FileReader();
		            var name = f.name;
		            reader.onload = function(e) {
		            	var data = e.target.result;
		            	var workbook = XLSX.read(data, {type: 'binary'});;
		            	var first_sheet_name = workbook.SheetNames[0];

		            	var worksheet = workbook.Sheets[first_sheet_name];

		            	const inputScores = XLSX.utils.sheet_to_json(worksheet, {defval: ''});
		            	console.log(inputScores);

							// TODO get the scores from the inputScores JSON and populate the
							// session scores with them, for all the indicators that have scores
						};
						reader.readAsBinaryString(f);
					}
				} 
			};
		}
	})();

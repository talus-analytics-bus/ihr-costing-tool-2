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
	}
})();

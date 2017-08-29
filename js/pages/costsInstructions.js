(() => {
	App.initCostsInstructions = () => {
		$('.target-score-option').click(function() {
			// set radio button
			d3.selectAll('.target-score-option input').property('checked', false);
			d3.select(this).select('input').property('checked', true);

			// save the new target score type
			const targetScoreType = d3.select(this).attr('ind');
			User.setTargetScoreType(targetScoreType);

			if (targetScoreType === 'target') {
				// save target score
				const targetScore = $(this).find('select').val();
				User.setTargetScore(targetScore);
			}

			App.updateAllCosts();
		});

		$('.target-score-select').on('change', function() {
			const score = $(this).val();

			// save target score
			User.setTargetScore(score);
			App.updateAllCosts();

			// change color bar
			if (+score === 4) {
				$('.color-bar').css('background-color', '#87c764');
			} else {
				$('.color-bar').css('background-color', '#ede929');
			}
		});

		// clicking "next" button takes user to "who am i" page
		$('.costs-instructions-start').click(() => { hasher.setHash('costs'); });
	}
})();

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
			// save target score
			User.setTargetScore($(this).val());
			App.updateAllCosts();
		});

		// clicking "next" button takes user to "who am i" page
		$('.costs-instructions-start').click(() => { hasher.setHash('costs'); });
	}
})();

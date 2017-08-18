const User = {};
(() => {
	// TODO fill in user data
	User.scores = {
		'P.3.1': {
			score: null, // set on scores page
			step: null // default: plus one
		}
	};

	// DEMO set scores for AMR indicators

	/*
	* setIndicatorScore
	* Sets the score in the user data for the indicator specified
	*/
	User.setIndicatorScore = (indId, newScore) => {
		// ensure id valid
		indId = indId.toUpperCase();

		// set score to null if none has been set
		if (newScore === '') newScore = null;

		// locate relevant indicator in indicator dataset
		const ind = App.getIndicator(indId);

		// set the score
		ind.score = newScore;
	};

	/*
	* getIndicatorScore
	* Gets the score in the user data for the indicator specified
	*/
	User.getIndicatorScore = (indId) => {
		const ind = App.getIndicator(indId.toUpperCase());
		return ind.score;
	};

})();
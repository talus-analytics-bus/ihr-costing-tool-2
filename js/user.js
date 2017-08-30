const User = {};

(() => {
	// set user defaults
	User.targetScoreType = 'target';  // either "target" or "step"
	User.targetScore = null;


	// sets the score in the user data for the indicator specified
	User.setIndicatorScore = (indId, newScore) => {
		const ind = App.getIndicator(indId);
		ind.score = newScore;
	};

	// gets the score in the user data for the indicator specified
	User.getIndicatorScore = (indId) => {
		const ind = App.getIndicator(indId);
		return ind.score;
	};

	// set target score type (may be either "step" or "target")
	User.setTargetScoreType = (targetScoreType) => {
		User.targetScoreType = targetScoreType;
	}

	// number for 2 to 5; only valid if target score type is "target"
	User.setTargetScore = (targetScore) => {
		User.targetScore = targetScore;
	}
})();

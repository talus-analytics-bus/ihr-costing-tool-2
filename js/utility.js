const Util = {};

(() => {
	// TODO add utility functions
	
	// TODO add function abbreviate text to specific number
	// of chars, then truncate at nearest word


	/*
	*	getIndicatorClass
	*	For the given indicator ID, returns its CSS class
	*/
	Util.getIndicatorClass = (id) => {
		return id.toLowerCase().split('.').join('-');
	};
})();
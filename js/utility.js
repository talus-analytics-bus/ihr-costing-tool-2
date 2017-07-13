const Util = {};

(() => {

	/*
	*	getIndicatorClass
	*	For the given indicator ID, returns its CSS class
	*/
	Util.getIndicatorClass = (id) => {
		return id.toLowerCase().split('.').join('-');
	};

	/*
	*	getIndicatorId
	*	For the given indicator class, returns its ID
	*/
	Util.getIndicatorId = (selector) => {
		return selector.toUpperCase().split('-').join('.');
	};

	/*
	*	truncateText
	*	For the given string, truncate to specified number of
	*	characters, and round down to the nearest whole word
	*/
	Util.truncateText = (str, nMaxChar) => {
		// set default  value for nMaxChar
		if (nMaxChar === undefined) nMaxChar = 40;

		// get str length
		const length = str.length;

		// split the str by space
		const words = str.split(' ');

		if (words.length === 1 || length <= nMaxChar ) return str;

		// init output string
		let output = '';

		// init char counter
		let charCount = 0;

		// init loop var
		let i = 0;

		while (i < words.length && (charCount + words[i].length) < nMaxChar) {
			if (i > 0) output += ' ';
			output += words[i];
			charCount += words[i].length;
			i++;
		}

		return output + '...';
	};
})();
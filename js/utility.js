const Util = {};

(() => {

	/*
	*	getIndicatorClass
	*	For the given indicator ID, returns its CSS class
	*/
	Util.getIndicatorClass = (id) => {
		return id.split('.').join('-');
	};

	/*
	*	getIndicatorId
	*	For the given indicator class, returns its ID
	*/
	Util.getIndicatorId = (selector) => {
		return selector.split('-').join('.');
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

	/**
	 * Populates a select element with the given data using d3
	 */
	Util.populateSelect = (selector, data, param={}) => {
		if (typeof param.valKey === 'undefined') param.valKey = '';
		if (typeof param.nameKey === 'undefined') param.nameKey = '';
		
		let options = d3.select(selector).selectAll('option')
			.data(data);
		options.exit().remove();
		const newOptions = options.enter().append('option');
		options = newOptions.merge(options)
			.attr('value', (d) => {
			  if (typeof param.valKey === 'function') return param.valKey(d);
			  return (param.valKey === '') ? d : d[param.valKey];
			})
			.text(function(d) {
			  if (typeof param.nameKey === 'function') return param.nameKey(d);
			  return (param.nameKey === '') ? d : d[param.nameKey];
			});
		if (param.selected) {
		  if (typeof param.selected === 'boolean') {
		  	options.attr('selected', param.selected);
		  } else if (typeof param.selected === 'function') {
		    options.attr('selected', function() {
		    	if (param.selected($(this).attr('value'))) return true;
		    });
		  }
		}
	};
})();

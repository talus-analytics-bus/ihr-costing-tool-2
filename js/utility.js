const Util = {};

(() => {

    Util.comma = d3.format(',f'); // rounds down and adds commas appropriately
    Util.decimalOne = d3.format('.1f'); // formats to a one decimal significance
    Util.decimalTwo = d3.format('.2f'); // formats to a two decimal significance
    Util.percentize = d3.format('%'); // divides by 100 and adds a percentage symbol
    Util.percentizeDec = d3.format('.1%'); // percentize method but with a greater significance
    Util.monetize = d3.format('$,f'); // rounds down, adds commas, and adds money symbol
    Util.formatSI = d3.format('.2s'); // uses 3 sigfigs and suffixes the appropriate symbol (k for 1000, M for 1000000)
    Util.formatTimestamp = d3.time.format('%b %d, %Y %H:%M GMT%Z'); // formats a date (e.g.: Jul 16, 2015 17:12 GMT-0400)
    Util.formatTimestampShort = d3.time.format('%m/%d/%Y %H:%M GMT%Z'); // formats a date (e.g.: 07/16/2015 17:12 GMT-0400)

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

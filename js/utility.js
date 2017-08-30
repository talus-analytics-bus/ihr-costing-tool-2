const Util = {};

(() => {

	Util.comma = d3.format(',.0f'); // rounds down and adds commas appropriately
	Util.decimalOne = d3.format('.1f'); // formats to a one decimal significance
	Util.decimalTwo = d3.format('.2f'); // formats to a two decimal significance
	Util.percentize = d3.format('%'); // divides by 100 and adds a percentage symbol
	Util.percentizeDec = d3.format('.1%'); // percentize method but with a greater significance
	Util.monetize = d3.format('$,f'); // rounds down, adds commas, and adds money symbol
	Util.formatSI = d3.format('.2s'); // uses 3 sigfigs and suffixes the appropriate symbol (k for 1000, M for 1000000)
	//Util.formatTimestamp = d3.time.format('%b %d, %Y %H:%M GMT%Z'); // formats a date (e.g.: Jul 16, 2015 17:12 GMT-0400)
	//Util.formatTimestampShort = d3.time.format('%m/%d/%Y %H:%M GMT%Z'); // formats a date (e.g.: 07/16/2015 17:12 GMT-0400)

	// converts a number in string format into a float
	Util.strToFloat = (str) => {
		if (typeof str !== 'string') return str;
		return parseFloat(str.replace(/[^\d\.\-]/g, ""));
	};

	// capitalizes words
	Util.capitalize = (str) => {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}

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

		// sorts an array of object by a given key
	Util.sortByKey = (array, key, reverse) => {
		array.sort((a, b) => {
			if (a[key] < b[key]) return -1;
			else if (a[key] > b[key]) return 1;
			else return 0;
		});
		return reverse ? array.reverse() : array;
	};

	/*
	*	truncateText
	*	For the given string, truncate to specified number of
	*	characters, and round down to the nearest whole word
	*/
	Util.truncateText = (str, nMaxChar=30) => {
		const words = str.split(' ');
		if (words.length === 1 || str.length <= nMaxChar) return str;

		// init output string, char counter, loop var
		let output = '';
		let charCount = 0;
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

	// converts a number in string format into a float
	Util.strToFloat = function(str) {
		if (typeof str !== 'string') return str;
		return parseFloat(str.replace(/[^\d\.\-]/g, ""));
	};

	// reads the value of an input and changes it to a formatted number
	Util.getInputNumVal = (input) => {
		const $input = $(input);
		const val = Util.strToFloat($input.val());
		if (val === '') return 0;
		if (isNaN(val) || val < 0) {
			$input.val(0);
			return 0;
		}
		
		$input.val(d3.format(',')(val));
		return val;
	};

	Util.msieversion = () => {
	  var ua = window.navigator.userAgent;
	  var msie = ua.indexOf("MSIE ");
	  if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) // If Internet Explorer, return true
	  {
	    return true;
	  } else { // If another browser,
	  return false;
	  }
	  return false;
	};
})();

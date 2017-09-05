(() => {
	/* ------------------ Import/Export Functions ------------------- */
	// return 3 part json in string format to be exported into a text file
	App.getSessionData = () => {
		// create indicator score lookup and input cost lookup
		const indScoreDict = {};
		const inputCostDict = {};
		App.jeeTree.forEach((cc) => {
			cc.capacities.forEach((cap) => {
				cap.indicators.forEach((ind) => {
					indScoreDict[ind.id] = ind.score || 0;
					ind.actions.forEach((a) => {
						a.inputs.forEach((input) => {
							const costObj = {
								costed: input.costed,
								isCustomCost: input.isCustomCost,
							};
							if (input.isCustomCost) {
								costObj.customStartupCost = input.customStartupCost;
								costObj.customRecurringCost = input.customRecurringCost;
							}
							inputCostDict[input.id] = costObj;
						});
					});
				});
			})
		});

		// get data to download
		return JSON.stringify({
			whoAmI: App.whoAmI,
			scoreData: indScoreDict,
			costData: inputCostDict,
			user: User,
		});
	}

	// loads json data and ingests into application
	App.loadSessionData = (sessionDataStr) => {
		let sessionData;
		try {
			sessionData = JSON.parse(sessionDataStr);
		} catch(e) {
			return false;
		}

		for (let ind in sessionData.user) {
			User[ind] = sessionData.user[ind];
		}
		App.whoAmI = sessionData.whoAmI;
		const indScoreDict = sessionData.scoreData;
		const inputCostDict = sessionData.costData;

		// ingest scores and costs into App.jeeTree
		App.jeeTree.forEach((cc) => {
			cc.capacities.forEach((cap) => {
				cap.indicators.forEach((ind) => {
					if (indScoreDict[ind.id]) {
						ind.score = indScoreDict[ind.id];
					}

					ind.actions.forEach((a) => {
						a.inputs.forEach((input) => {
							if (inputCostDict[input.id]) {
								for (let key in inputCostDict[input.id]) {
									input[key] = inputCostDict[input.id][key];
								}
							}
						});
					});
				});
			})
		});
		return true;
	}

	// loads Qlick score data
	App.loadQlickScoreData = (scoreData) => {
		let workbook;
		try {
			workbook = XLSX.read(scoreData, {type: 'binary'});
		} catch (err) {
			return false;
		}

		const firstSheetName = workbook.SheetNames[0];
		const worksheet = workbook.Sheets[firstSheetName];

		// edit column headers
		worksheet['A1'].w = 'country_name';
		worksheet['B1'].w = 'capacity_name';
		worksheet['C1'].w = 'indicator_name';
		worksheet['D1'].w = 'score';

		// get the scores from the inputScores JSON and populate the
		// session scores with them, for all the indicators that have scores
		const inputScores = XLSX.utils.sheet_to_json(worksheet, {defval: ''});

		// update scores
		inputScores.forEach(function(d) {
			// get indicator id
			const indId = d.indicator_name.split(' ')[0].toLowerCase();
			if (indId === '') return;

			// get score
			const score = +d.score;
			if (!isNaN(score) && score >= 1 && score <= 5) App.setIndicatorScore(indId, score);
		});
		return true;
	}

	// exports the line items the user has costed to an XLSX file.
	App.exportLineItems = (callback) => {
		NProgress.start();
		const indArray = App.getCompleteIndicatorTree();

		const xhr = new XMLHttpRequest();
		xhr.open('POST', '/lineItemExport', true);
		xhr.responseType = 'blob';
		xhr.setRequestHeader('Content-type', 'application/json');
		xhr.onload = function(e) {
			if (this.status == 200) {
				const blob = new Blob([this.response], {type: 'application/vnd.ms-excel'});
				const downloadUrl = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = downloadUrl;

				// set file name
				const today = new Date();
				const year = today.getFullYear();
				let month = String(today.getMonth() + 1);
				if (month.length === 1) month = `0${month}`;
				let day = String(today.getDate());
				if (day.length === 1) day = `0${day}`;
				const yyyymmdd = `${year}${month}${day}`;
				const filenameStr = yyyymmdd + ' ' + App.whoAmI.abbreviation;

				a.download = "IHR Costing Tool - Detailed Report - " + filenameStr + ".xlsx";
				document.body.appendChild(a);
				a.click();
				if (callback) callback(null);
				return;
			}
			if (callback) callback(this.status);
		};
		App.whoAmI.staff_overhead_perc_str = Util.percentizeDec(App.whoAmI.staff_overhead_perc);
		xhr.send(JSON.stringify({
			exportType: 'userData',
			indicators: indArray, 
			currencyCode: App.whoAmI.currency_iso,
			exchangeRate: App.getExchangeRate(),
			whoAmI: App.whoAmI,
			gbc: App.globalBaseCosts,
			gsm: App.globalStaffMultipliers,
			User: User
		}));
	};

	// TODO
	App.exportCostingWorksheet = (callback) => {
		NProgress.start();
		const indArray = App.getAllIndicatorTree();

		const xhr = new XMLHttpRequest();
		xhr.open('POST', '/lineItemExport', true);
		xhr.responseType = 'blob';
		xhr.setRequestHeader('Content-type', 'application/json');
		xhr.onload = function(e) {
			if (this.status == 200) {
				const blob = new Blob([this.response], {type: 'application/vnd.ms-excel'});
				const downloadUrl = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = downloadUrl;

				// set file name
				const today = new Date();
				const year = today.getFullYear();
				let month = String(today.getMonth() + 1);
				if (month.length === 1) month = `0${month}`;
				let day = String(today.getDate());
				if (day.length === 1) day = `0${day}`;
				const yyyymmdd = `${year}${month}${day}`;
				const countryCodeFn = App.whoAmI.abbreviation || '';
				const filenameStr = yyyymmdd + ' ' + App.whoAmI.abbreviation;

				a.download = "IHR Costing Tool - Costing Worksheet Template - " + filenameStr + ".xlsx";
				document.body.appendChild(a);
				a.click();
				if (callback) callback(null);
				return;
			}
			if (callback) callback(this.status);
		};
		App.whoAmI.staff_overhead_perc_str = Util.percentizeDec(App.whoAmI.staff_overhead_perc);
		xhr.send(JSON.stringify({
			exportType: 'costingWorksheet',
			indicators: indArray, 
			currencyCode: App.whoAmI.currency_iso,
			exchangeRate: App.getExchangeRate(),
			whoAmI: App.whoAmI,
			gbc: App.globalBaseCosts,
			gsm: App.globalStaffMultipliers,
			User: User
		}));
	};

})();

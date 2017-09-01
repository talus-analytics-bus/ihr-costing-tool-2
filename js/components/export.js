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
		const whoAmIData = JSON.stringify(App.whoAmI);
		const scoreData = JSON.stringify(indScoreDict);
		const costData = JSON.stringify(inputCostDict)
		return `${whoAmIData}\n${scoreData}\n${costData}`;
	}

	// loads 3 part json data and ingests into application
	App.loadSessionData = (sessionData) => {
		const dataArr = sessionData.split('\n');
		
		let indScoreDict, inputCostDict;
		try {
			App.whoAmI = JSON.parse(dataArr[0]);
			indScoreDict = JSON.parse(dataArr[1]);
			inputCostDict = JSON.parse(dataArr[2]);
		} catch (e) {
			return false;
		}

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
			if (!isNaN(score) && score >= 1 && score <= 5) User.setIndicatorScore(indId, score);
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
				a.download = "IHR Costing Tool - Line Item Export.xlsx";
				document.body.appendChild(a);
				a.click();
				if (callback) callback(null);
				return;
			}
			if (callback) callback(this.status);
		};
		xhr.send(JSON.stringify({
			indicators: indArray, 
			currencyCode: App.whoAmI.currency_iso,
			exchangeRate: App.getExchangeRate(),
			whoAmI: App.whoAmI,
			gbc: App.globalBaseCosts,
			gsm: App.globalStaffMultipliers
		}));
	};
})();
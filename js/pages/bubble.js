// TODO transplant this graphic into the results page
(() => {

	/* initBubble
	 * Initialize the bubble chart, which will be transplanted into the Results page later
	 */
	App.initBubble = () => {
		// establish constants
		let costType = 'total';
		let totalCostDuration = 1;

		/* getTestTotals
		 * Assign random indicator scores and get the total costs for each
		 * function tag to reach the next score level for each indicator;
		 * Returns the breakdown by line item type total for each function tag
		 */
		getTestTotals = () => {
			/* -------------------------- Demo Mode --------------------------*/
			// Assign random score to each indicator
			if (App.demoMode) {
				App.jeeTree.forEach((cc) => {
					cc.capacities.forEach((cap) => {
						cap.indicators.forEach((ind) => {
							ind.score = Math.round(0.5 + 5 * Math.random());
						});
					});
				});
				App.updateAllCosts();
			}
			
			// TEST get totals for needed line items by function tag for 
			// startup, capital, and recurring costs
			let liArray = [];
			App.jeeTree.forEach((cc) => {
			    cc.capacities.forEach((cap) => {
			        cap.indicators.forEach((ind) => {
			            const actions = App.getNeededActions(ind);
			            actions.forEach((a) => {
			                const inputs = App.getNeededInputs(a.inputs, ind.score);
			                inputs.forEach((i) => {
			                    const lineItems = App.getNeededLineItems(i.line_items, ind.score);
			                    liArray = liArray.concat(lineItems);
			                });
			            });
			        });
			    });
			});

			// count up by function tag and cost type
			const testTotals = {"Coordination / leadership":{"start-up":0,"recurring":0,"capital":0},"Planning including assessment, design, planning, policy, legislation":{"start-up":0,"recurring":0,"capital":0},"Strengthening HR capacity":{"start-up":0,"recurring":0,"capital":0},"Strengthening infrastructure":{"start-up":0,"recurring":0,"capital":0},"Operations / implementation":{"start-up":0,"recurring":0,"capital":0},"Analysis including data quality and dissemination":{"start-up":0,"recurring":0,"capital":0},"Use and review mechanisms":{"start-up":0,"recurring":0,"capital":0}};
			for (let i = 0; i < liArray.length; i++) {
				const curLi = liArray[i];
				testTotals[curLi.function_tag][curLi.line_item_type] += curLi.cost;
			}
			return testTotals;
		};

		// TEST get test totals for function tag costs
		const testTotals = getTestTotals();

		// Build bubble pack chart for function tag costs by cost type
		// (total [1, 3 5yr], start-up, recurring, capital)
		const bubbleParam = {
			costType: costType,
			totalCostDuration: totalCostDuration
		};
		const selector = '.cost-chart-container';
		const data = testTotals;
		Charts.buildBubblePack(selector, data, bubbleParam);
	};
})();
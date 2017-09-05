// NodeJS script for starting server and listening for HTTP requests
var app = require('express')();
var server = require('http').Server(app);
var path = require('path');
var axios = require('axios');
var bodyParser = require('body-parser');
var path = require('path');
const XlsxPopulate = require('xlsx-populate'); // read/write xlsx files

//support parsing of application/json type post data
app.use(bodyParser.json({limit: '5Mb'}));

// Routing
// if no hash, send to index
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname, '/', 'index.html'));
});

// lineItemExport
// Routine to read line item export template XLS, write user line items,
// and download result to browser
app.post('/lineItemExport', function(req, res) {

	// if exporting user session data, use detailed report template
	// if exporting entire blank worksheet template, use costing worksheet template
	const exportType = req.body.exportType;
	const fromFileAsyncFn = (exportType === 'userData') ? "./export/IHR Costing Tool - Detailed Report Template.xlsx" : "./export/IHR Costing Tool - Costing Worksheet Template.xlsx";

	// Load line item export template XLS
	XlsxPopulate.fromFileAsync(fromFileAsyncFn)
	// XlsxPopulate.fromFileAsync("")
	    .then(workbook => {
	        // add the user data to the template
	        const indicators = req.body.indicators;

         	// get costs sheet
         	const costsSheet = workbook.sheet("Costs");

         	// specify currency in final two col headers
         	const currencyCode = req.body.currencyCode;
         	costsSheet.cell("U1").value('Do not edit: Start-up/Capital costs (' + currencyCode + ')');
         	costsSheet.cell("V1").value('Do not edit: Annual recurring costs (' + currencyCode + ')');

         	// get multipliers
         	const gbc = req.body.gbc;
         	const gsm = req.body.gsm;

         	// get user data
         	const User = req.body.User;

         	// get country params
         	const whoAmI = req.body.whoAmI;

         	// get exchange rate
         	const exchangeRate = req.body.exchangeRate;

         	// hash table for line item type
         	const lineItemTypeHash = {
			  "start-up": "Start-up",
			  "recurring": "Recurring",
			  "capital": "Capital"
			}

			// hash table for country parameters
			const countryParamHash = {
			  "population": "Population",
			  "central_area_count": "Central area count",
			  "intermediate_1_area_count": "Intermediate 1 area count",
			  "intermediate_2_area_count": "Intermediate 2 area count",
			  "local_area_count": "Local area count",
			  "intermediate_1_and_local_area_count": "Intermediate 1 area count and local area count",
			  "central_hospitals_count": "Central hospitals count",
			  "central_chw_count": "Central community health workers count",
			  "central_epi_count": "Central epidemiologists count",
			  "null": ""
			}

			// define column names
			const indicator_col = 'A';
			const current_score_col = 'B';
			const target_score_col = 'C';
			const action_col = 'D';
			const input_col = 'E';
			const line_item_col = 'F';
			const line_item_type_col = 'G';
			const description_col = 'H';
			const id_col = 'I';
			const base_cost_col = 'J';
			const cost_amount_col = 'K';
			const cost_unit_col = 'L';
			const country_multiplier_col = 'M';
			const country_multiplier_unit_col = 'N';
			const custom_mult1_col = 'O';
			const custom_mult1_unit_col = 'P';
			const custom_mult2_col = 'Q';
			const custom_mult2_unit_col = 'R';
			const staff_mult_col = 'S';
			const staff_mult_unit_col = 'T';
			const startup_col = 'U';
			const recurring_col = 'V';

         	// track sheet row
         	let n = 1;
         	for (let i = 0; i < indicators.length; i++) {
         		const ind = indicators[i];
         		
         		

         		// process actions
         		ind.actions.forEach(function(action){



         			// process inputs
         			action.inputs.forEach(function(input){
         				n++;
         				// indicator name
		         		// n++;
		         		costsSheet.cell(indicator_col + n).value(ind.id.toUpperCase() + ' ' + ind.name);

		         		// indicator starting score
		         		costsSheet.cell(current_score_col + n).value(ind.score);

		         		// indicator target score
		         		costsSheet.cell(target_score_col + n).value(ind.targetScore);
	         			
	         			// action name
	         			// n++;
	         			costsSheet.cell(action_col + n).value(action.name);
         			
         				// input name
	         			// n++;
	         			costsSheet.cell(input_col + n).value(input.name);

	         			// input cost: SU/C
	         			costsSheet.cell(startup_col + n).value(input.startupCost + input.capitalCost);

	         			// input cost: Rec
	         			costsSheet.cell(recurring_col + n).value(input.recurringCost);

	         			// format row
	         			costsSheet.range("A" + n + ":V" + n).style({fill: "D9D9D9"})

	         			// process line items
	         			input.line_items.forEach(function(lineItem){
	         				n++;
	         				// indicator name
			         		// n++;
			         		costsSheet.cell(indicator_col + n).value(ind.id.toUpperCase() + ' ' + ind.name);

			         		// indicator starting score
			         		costsSheet.cell(current_score_col + n).value(ind.score);

			         		// indicator target score
			         		costsSheet.cell(target_score_col + n).value(ind.targetScore);
		         			
		         			// action name
		         			// n++;
		         			costsSheet.cell(action_col + n).value(action.name);
	         			
	         				// input name
		         			// n++;
		         			costsSheet.cell(input_col + n).value(input.name);

		         			// input cost: SU/C
		         			costsSheet.cell(startup_col + n).formula('=IFERROR(IF(OR($G' + n + '="Start-up",$G' + n + '="Capital"),1,0)*IF($M' + n + '="",1,$M' + n + ')*IF($O' + n + '="",1,$O' + n + ')*IF($Q' + n + '="",1,$Q' + n + ')*IF($S' + n + '="",1,$S' + n + ')*IF($K' + n + '="",1,$K' + n + ')*IF($G' + n + '="",0,1),"")');

		         			// input cost: Rec
		         			costsSheet.cell(recurring_col + n).formula('=IFERROR(IF(OR($G' + n + '="Start-up",$G' + n + '="Capital"),0,1)*IF($M' + n + '="",1,$M' + n + ')*IF($O' + n + '="",1,$O' + n + ')*IF($Q' + n + '="",1,$Q' + n + ')*IF($S' + n + '="",1,$S' + n + ')*IF($K' + n + '="",1,$K' + n + ')*IF($G' + n + '="",0,1),"")');

							// line item name
		         			// n++;
		         			costsSheet.cell(line_item_col + n).value(lineItem.name);

		         			// line item ID
		         			costsSheet.cell(id_col + n).value(lineItem.id.toUpperCase());

		         			// Line item type
		         			costsSheet.cell(line_item_type_col + n).value(lineItemTypeHash[lineItem.line_item_type]);

							// Description
		         			costsSheet.cell(description_col + n).value(lineItem.description);

							// Base cost name
							let curGbc = gbc.find(d => d.id === lineItem.base_cost);
							if (!curGbc) {
								curGbc = gbc.find((d) => {
									return d.id === lineItem.base_cost + '.' + User.buyOrLease;
								});
							}

							// add overhead if salary
							const isSalary = curGbc.name.indexOf('salary') > -1;
							let base_cost_name = curGbc.name;
							if (isSalary) {
								base_cost_name = base_cost_name + ' plus overhead (' + whoAmI.staff_overhead_perc_str + ')'; 
							} 
		         			costsSheet.cell(base_cost_col + n).value(base_cost_name);

							// Base cost amount
							if (isSalary) {
			         			costsSheet.cell(cost_amount_col + n).value(curGbc.cost * exchangeRate * (1.0 + whoAmI.staff_overhead_perc));
							} else {
			         			costsSheet.cell(cost_amount_col + n).value(curGbc.cost * exchangeRate);
							}
		         			
							// Base cost unit
		         			costsSheet.cell(cost_unit_col + n).value(curGbc.cost_unit);

							// Country multiplier
							const country_multiplier_key = lineItem.country_multiplier;
							if (country_multiplier_key !== "") {
								// get country multiplier
								let country_multiplier = 1;
								if (country_multiplier_key === 'intermediate_1_and_local_area_count') {
									country_multiplier = whoAmI.multipliers.intermediate_1_area_count + whoAmI.multipliers.local_area_count;
								} else {
									country_multiplier = whoAmI.multipliers[country_multiplier_key];
								}
		         				
		         				costsSheet.cell(country_multiplier_col + n).value(country_multiplier);

								// Country multiplier unit
		         				costsSheet.cell(country_multiplier_unit_col + n).value(countryParamHash[country_multiplier_key]);

							}

							// Custom multiplier 1
							if (lineItem.custom_multiplier_1 !== "") {
								// get number
								const cm1Arr = lineItem.custom_multiplier_1.toString().split(" ");
								const cm1Num = cm1Arr[0];
		         				costsSheet.cell(custom_mult1_col + n).value(cm1Num);

								// get unit
								cm1Arr.splice(0,1);
								const cm1Unit = cm1Arr.join(" ");

								// Custom multiplier 1 unit
		         				costsSheet.cell(custom_mult1_unit_col + n).value(cm1Unit);
							}

							// Custom multiplier 2
							if (lineItem.custom_multiplier_2 !== "") {
								// get number
								const cm2Arr = lineItem.custom_multiplier_2.toString().split(" ");
								const cm2Num = cm2Arr[0];
		         				costsSheet.cell(custom_mult2_col + n).value(cm2Num);

								// get unit
								cm2Arr.splice(0,1);
								const cm2Unit = cm2Arr.join(" ");

								// Custom multiplier 2 unit
		         				costsSheet.cell(custom_mult2_unit_col + n).value(cm2Unit);
							}

							// Staff multiplier
							if (lineItem.staff_multiplier !== "" && lineItem.staff_multiplier !== null) {
								const curGsm = gsm.find(d => d.id === lineItem.staff_multiplier);
			         			costsSheet.cell(staff_mult_col + n).value(curGsm.count);

								// Staff multiplier unit
			         			costsSheet.cell(staff_mult_unit_col + n).value(curGsm.name);
							}
	         			});
         			});

         		});
				// format row
	         	costsSheet.range("A" + n + ":V" + n).style({bottomBorder: "thick", bottomBorderColor: "000000"})
         	}

			workbook.outputAsync()
				.then(function (blob) {
					res.end(blob);
				});
	    });

});

// if hash, send to requested resource
app.get(/^(.+)$/, function(req, res) {
	res.sendFile(path.join(__dirname, '/', req.params[0]));
});	

// Start the HTTP Server
server.listen(process.env.PORT || 8888, function() {
	console.log('Server set up!');
	console.log(server.address());
});

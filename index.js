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
	// Load line item export template XLS
	XlsxPopulate.fromFileAsync("./export/IHR Costing Tool - Line Item Export.xlsx")
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

         	// track sheet row
         	let n = 1;
         	for (let i = 0; i < indicators.length; i++) {
         		const ind = indicators[i];
         		
         		// indicator name
         		n++;
         		costsSheet.cell("B" + n).value(ind.id.toUpperCase() + ' ' + ind.name);

         		// process actions
         		ind.actions.forEach(function(action){
         			// action name
         			n++;
         			costsSheet.cell("E" + n).value(action.name);

         			// process inputs
         			action.inputs.forEach(function(input){
         				// input name
	         			n++;
	         			costsSheet.cell("F" + n).value(input.name);

	         			// input cost: SU/C
	         			costsSheet.cell("U" + n).value(input.startupCost);

	         			// input cost: Rec
	         			costsSheet.cell("V" + n).value(input.recurringCost);

	         			// process line items
	         			input.line_items.forEach(function(lineItem){
							// line item name
		         			n++;
		         			costsSheet.cell("G" + n).value(lineItem.name);

		         			// Line item type
		         			costsSheet.cell("H" + n).value(lineItemTypeHash[lineItem.line_item_type]);

							// Description
		         			costsSheet.cell("I" + n).value(lineItem.description);

							// Base cost name
							const curGbc = gbc.find(d => d.id === lineItem.base_cost);
		         			costsSheet.cell("J" + n).value(curGbc.name);

							// Base cost amount
		         			costsSheet.cell("K" + n).value(curGbc.cost * exchangeRate);
		         			
							// Base cost unit
		         			costsSheet.cell("L" + n).value(curGbc.cost_unit);

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
		         				
		         				costsSheet.cell("M" + n).value(country_multiplier);

								// Country multiplier unit
		         				costsSheet.cell("N" + n).value(countryParamHash[country_multiplier_key]);

							}

							// Custom multiplier 1
							if (lineItem.custom_multiplier_1 !== "") {
								// get number
								const cm1Arr = lineItem.custom_multiplier_1.toString().split(" ");
								const cm1Num = cm1Arr[0];
		         				costsSheet.cell("O" + n).value(cm1Num);

								// get unit
								cm1Arr.splice(0,1);
								const cm1Unit = cm1Arr.join(" ");

								// Custom multiplier 1 unit
		         				costsSheet.cell("P" + n).value(cm1Unit);
							}

							// Custom multiplier 2
							if (lineItem.custom_multiplier_2 !== "") {
								// get number
								const cm2Arr = lineItem.custom_multiplier_2.toString().split(" ");
								const cm2Num = cm2Arr[0];
		         				costsSheet.cell("Q" + n).value(cm2Num);

								// get unit
								cm2Arr.splice(0,1);
								const cm2Unit = cm2Arr.join(" ");

								// Custom multiplier 2 unit
		         				costsSheet.cell("R" + n).value(cm2Unit);
							}

							// Staff multiplier
							if (lineItem.staff_multiplier !== "" && lineItem.staff_multiplier !== null) {
								console.log(lineItem.staff_multiplier)
								const curGsm = gsm.find(d => d.id === lineItem.staff_multiplier);
			         			costsSheet.cell("S" + n).value(curGsm.count);

								// Staff multiplier unit
			         			costsSheet.cell("T" + n).value(curGsm.name);
							}
	         			});
         			});

         		});

         	}


			workbook.outputAsync()
				.then(function (blob) {



					res.attachment('IHR Costing Tool - Line Item Export.xlsx');
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

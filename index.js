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
			  "local_area_count": "Local area count",
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
							if (lineItem.country_multiplier !== "") {
								// get country multiplier
		         				costsSheet.cell("M" + n).value(curGbc.cost_unit);


							// Country multiplier unit
							}

							// Custom multiplier 1
							// Custom multiplier 1 unit
							// Custom multiplier 2
							// Custom multiplier 2 unit
							// Staff multiplier
							// Staff multiplier unit

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

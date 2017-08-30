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
	        // TODO
	        // const inputs = req.query.inputs; // TODO
	        console.log('doing it')
	        // console.log(req.body.inputs[0])
	        const indicators = req.body.indicators;
	        console.log(indicators[0])
	        // console.log(res)
         	// workbook.sheet("Costs").cell("Q2").value("100");


         	// get stock row format
         	const stockRow = workbook.sheet("Costs").range("A2:V2");

         	// track sheet row
         	let n = 1;
         	for (let i = 0; i < indicators.length; i++) {
         		// format row
         		workbook.sheet("Costs").range("A" + n + ":V" + n) = stockRow;

         		const ind = indicators[i];
         		
         		// indicator name
         		n++;
         		workbook.sheet("Costs").cell("B" + n).value(indicators[i].name);

         		// process actions
         		ind.actions.forEach(function(action){
         			// action name
         			n++;
         			workbook.sheet("Costs").cell("E" + n).value(action.name);

         			// process inputs
         			action.inputs.forEach(function(input){
         				// input name
	         			n++;
	         			workbook.sheet("Costs").cell("F" + n).value(input.name);

	         			// input cost: SU/C

	         			// input cost: Rec

	         			// process line items
	         			input.line_items.forEach(function(lineItem){
							// line item name
		         			n++;
		         			workbook.sheet("Costs").cell("G" + n).value(lineItem.name);
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

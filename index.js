// NodeJS script for starting server and listening for HTTP requests
var app = require('express')();
var server = require('http').Server(app);
var path = require('path');
var axios = require('axios');
const XlsxPopulate = require('xlsx-populate'); // read/write xlsx files

// Routing
// if no hash, send to index
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname, '/', 'index.html'));
});

// test XLSX package
app.get('/xlsxWrite', function(req, res) {
	// Load line item export template XLS
	XlsxPopulate.fromFileAsync("./export/IHR Costing Tool - Line Item Export.xlsx")
	    .then(workbook => {
	        // add the user data to the template
	        // TODO
         	workbook.sheet("Costs").cell("Q2").value("100");

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
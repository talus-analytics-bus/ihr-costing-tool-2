// NodeJS script for starting server and listening for HTTP requests
var app = require('express')();
var server = require('http').Server(app);
var path = require('path');

// Routing
// if no hash, send to index
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname, '/', 'index.html'));
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


/* --- Exporting --- */
app.get('/export', (req, res) => {
	const date = new Date();
	let month = String(date.getMonth());
	if (month.length === 1) month = '0' + month;
	let day = String(date.getDay());
	if (day.length === 1) day = '0' + day;
	const year = 1900 + date.getYear();
	const mmddyyyy = month + day + String(year);

	const fs = require('fs');
	const fileName = `ihrCostingSession${mmddyyyy}.txt`;
	const data1 = 'App.whoAmI = ' + JSON.stringify(App.whoAmI) + ';';
	const data2 = 'App.jeeTree = ' + JSON.stringify(App.jeeTree) + ';';
	const data = data1 + data2;
	fs.appendFile(fileName, data, (err) => {
		if (err) {
			console.log(err);
			return;
		} else {
			noty({
				type: 'success',
				text: 'Download Success!',
			});
		}
	});
});
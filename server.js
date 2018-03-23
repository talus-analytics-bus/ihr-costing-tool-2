// NodeJS script for starting server and listening for HTTP requests
var app = require('express')();
var server = require('http').Server(app);
var path = require('path');
var fs = require('fs');



// The Amazon environment property is set in the EC2 instance under the Configuration section, under Software Configuration
// USE_HTTPS_REDIRECTION = true will enable HTTPS redirection
//
const useHTTPSRedirection = process.env.USE_HTTPS_REDIRECTION;

// Set the useHTTPSRedirection to false if you don't want the auto-redirection from HTTP to HTTPS
if (useHTTPSRedirection === true) {
    // Redirect HTTP to HTTPS
    app.use(function(req, res, next) {
        if((!req.secure) && (req.get('X-Forwarded-Proto') !== 'https')) {
            res.redirect('https://' + req.get('Host') + req.url);
        }
        else
            next();
    });
}

// if no hash, send to index
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname, '/', 'index.html'));
});

// if hash, send to requested resource
app.get(/^(.+)$/, function(req, res) {
	res.sendFile(path.join(__dirname, '/', req.params[0]));
});


// Start the HTTP Server
server.listen(process.env.PORT || 8802, function() {
	console.log('Server set up!');
	console.log(server.address());
});

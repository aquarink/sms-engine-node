// NPM
var express = require('express');
var os = require('os');

// App initialize
var app = express();

// Including
var moCreate = require('./system/services/mo_create');
//var drCreate = require('./system/services/dr_create');

// Services
var moReader = require('./system/services/mo_read');
//var drReader = require('./system/services/dr_reader');

// App Service
var appBola = require('./system/services/apps/bola');

// Push Service Telco
//var xl = require('./system/services/push/xl');

// Initialize router
app.use('/mo', moCreate);
//app.use('/dr', drCreate);

//Error Handling
app.get('*', function (req, res) {
    res.status(404).send('404');
});

// Server
app.listen(3000, function () {
    console.log('SMS ENGINE 2017 BY MOBIWIN');
    console.log('------------------------------');
    // Monitoring
    console.log('Operating system \t : ' + os.platform() + ' ' + os.arch() + ' ' + os.type());
    console.log('Memory Capacity \t : ' + parseInt(os.totalmem()) / 1000000 + ' Mb');
    console.log('Free Memory \t \t : ' + parseInt(os.freemem()) / 1000000 + ' Mb');
    console.log('Home Dir \t \t : ' + os.homedir());
    console.log('Hostname \t \t : ' + os.hostname());
    console.log('------------------------------');
});
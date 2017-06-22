var express = require('express');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');

var objId = require('mongodb').ObjectID;

var router = express.Router();

router.get('/xl', function (req, res, next) {
    // Telco Name
    var telco = 'xl';

    // Query String
    var msisdn = req.query.msisdn;
    var trxId = req.query.trxid;
    var trxDate = req.query.trxdate;
    var shortcode = req.query.shortcode;
    // stat 1 = sended
    var stat = req.query.stat;

    // Random number
    var rand = Math.floor((Math.random() * 10000000) + 1);
    var rand2 = process.hrtime()[0] * 1000000 + process.hrtime()[1];

    // Date Now String 
    var dateNow = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var dateString = new Date().toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/T/, '').replace(/\..+/, '');

    if (msisdn === undefined || trxId === undefined || trxDate === undefined || shortcode === undefined || stat === undefined) {
        console.log(dateNow + ' : DR ' + telco + ' QUERY STRING UNDEFINED');
        // console.log(path.resolve()); // C:\Users\Pebri\Documents\NetBeansProjects\newsmsnode5

    } else if (msisdn === null || trxId === null || trxDate === null || shortcode === null || stat === null) {
        console.log(dateNow + ' : DR ' + telco + ' QUERY STRING NULL');
        // console.log(path.resolve()); // C:\Users\Pebri\Documents\NetBeansProjects\newsmsnode5

    } else {
        // Parsing msisdn 0 = 62
        var msisdnNew;

        if (msisdn.slice(0, 2) === '62') {
            msisdnNew = msisdn;
        } else {
            msisdnNew = '62' + msisdn.slice(1);
        }

        // SMS Object
        var smsObj = {
            'telco': telco,
            'shortcode': shortcode,
            'msisdn': msisdnNew,
            'trx_id': trxId,
            'trx_date': trxDate,
            'session_id': dateString + new objId(),
            'session_date': dateNow,
            'report': stat
        };

        // File Name
        var smsFileName = path.join(__dirname + '/../', '/files/dr')+'/DR-' + dateString + new objId() + '.json';
        //console.log(smsFileName);
        if (fs.existsSync(path.join(__dirname + '/../', '/files/dr'))) {
            try {
                fs.writeFile(smsFileName, JSON.stringify(smsObj), function (err) {
                    if (!err) {
                        res.send('DR OK');
                        console.log(dateNow + ' : DR Create => ' + telco + ' ' + msisdnNew + ' created if');
                    } else {
                        console.log(err);
                    }
                });
            } catch (err) {
                console.log(dateNow + ' :  Catch error dr_create logic');
            }
        } else {
            function makeDir(callback) {
                try {
                    mkdirp(path.join(__dirname + '/../', '/files/dr'), function (err) {
                        if (!err) {
                            callback('mkdirOk');
                        } else {
                            callback(err);
                        }
                    });
                } catch (err) {
                    console.log(dateNow + ' :  Catch error dr_create mkdir');
                }
            }

            makeDir(function (result) {
                if (result === 'mkdirOk') {
                    try {
                        fs.writeFile(smsFileName, JSON.stringify(smsObj), function (err) {
                            if (!err) {
                                res.send('DR OK');
                                console.log(dateNow + ' : DR Create => ' + telco + ' ' + msisdnNew + ' created else');
                            } else {
                                console.log(err + 'DR 85');
                            }
                        });
                    } catch (err) {
                        console.log(dateNow + ' :  Catch error dr_create logic else');
                    }
                } else {
                    console.log(result + 'DR 90');
                }
            });
        }
    }
});

module.exports = router;

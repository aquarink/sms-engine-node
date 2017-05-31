var express = require('express');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');

var router = express.Router();

router.get('/xl', function (req, res, next) {
    // Telco Name
    var telco = 'xl';

    // Query String
    var msisdn = req.query.msisdn;
    var sms = req.query.sms.toLowerCase();
    var trxId = req.query.trxid;
    var trxDate = req.query.trxdate;
    var shortcode = req.query.shortcode;

    // SMS Parse
    var parseSms = sms.replace(/\s+/g, '-');

    // Random number
    var rand = process.hrtime()[0] + process.hrtime()[1];

    // Date Now String 
    var dateNow = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var dateString = new Date().toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/T/, '').replace(/\..+/, '');

    if (msisdn === undefined || sms === undefined || trxId === undefined || trxDate === undefined || shortcode === undefined) {
        console.log('MO ' + telco + ' QUERY STRING UNDEFINED');
        // console.log(path.resolve()); // C:\Users\Pebri\Documents\NetBeansProjects\newsmsnode5

    } else if (msisdn === null || sms === null || trxId === null || trxDate === null || shortcode === null) {
        console.log('MO ' + telco + ' QUERY STRING NULL');
        // console.log(path.resolve()); // C:\Users\Pebri\Documents\NetBeansProjects\newsmsnode5

    } else {
        var keyword;
        var reg;

        var smsExplode = sms.split(" ");
        if (smsExplode[0] === 'reg') {
            keyword = smsExplode[1].replace(/\s+/g, '');
            reg = 1;
        } else if (smsExplode[0] === 'unreg') {
            keyword = smsExplode[1].replace(/\s+/g, '');
            reg = 2;
        } else {
            keyword = smsExplode[0].replace(/\s+/g, '');
            reg = 1;
        }

        // Parsing msisdn 0 = 62
        var msisdnNew;

        if (msisdn.slice(0, 2) === '62') {
            msisdnNew = msisdn;
        } else {
            msisdnNew = '62' + msisdn.slice(1);
        }

        // SMS Object
        var smsObj = {
            telco: telco,
            shortcode: shortcode,
            msisdn: msisdnNew,
            sms_fild: sms,
            keyword: keyword,
            trx_id: trxId,
            trx_date: trxDate,
            session_id: dateString + rand,
            session_date: dateNow,
            reg_type: reg
        };

        // File Name
        var smsFileName = path.resolve() + '/system/files/mo/' + parseSms + '&' + dateString + rand + '.json';

        if (fs.existsSync(path.resolve() + '/system/files/mo')) {
            fs.writeFile(smsFileName, JSON.stringify(smsObj), function (err) {
                if (!err) {
                    res.send('MO OK');
                    console.log(dateNow + ' : MO Create => ' + telco + ' ' + msisdn + ' created if');
                } else {
                    console.log(err);
                }
            });
        } else {
            function makeDir(callback) {
                mkdirp(path.resolve() + '/system/files/mo', function (err) {
                    if (!err) {
                        callback('mkdirOk');
                    } else {
                        callback(err);
                    }
                });
            }

            makeDir(function (result) {
                if (result === 'mkdirOk') {
                    fs.writeFile(smsFileName, JSON.stringify(smsObj), function (err) {
                        if (!err) {
                            res.send('MO OK');
                            console.log(dateNow + ' : MO Create => ' + telco + ' ' + msisdn + ' created else');
                        } else {
                            console.log(err);
                        }
                    });
                } else {
                    console.log(result);
                }
            });
        }
    }
});

module.exports = router;

var schedule = require('node-schedule');
var path = require('path');
//var fs = require('fs');
var fs = require('graceful-fs');

var conn = require('../../connection.js');

schedule.scheduleJob('*/2 * * * * *', function () {
    // Random number
    var rand = process.hrtime()[0] + process.hrtime()[1];
    // Date String
    var dateNow = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var dateString = new Date().toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/T/, '').replace(/\..+/, '');

    var pushDir = path.resolve() + '/system/files/apps/other';
    if (fs.existsSync(pushDir)) {
        fs.readdir(pushDir, (err, files) => {
            if (!err) {
                files.forEach(file => {
                    var filePath = pushDir + '/' + file;
                    fs.readFile(filePath, 'utf8', function (err, data) {
                        if (!err) {
                            var jsonData = JSON.parse(data);
                            // New Obj
                            var keywordNotFoundSmsPush = {
                                telco: {
                                    'telco_name': jsonData.telco
                                },
                                origin: {
                                    'shortcode': jsonData.shortcode,
                                    'msisdn': jsonData.msisdn,
                                    'sms_field': jsonData.sms_field,
                                    'keyword': jsonData.keyword,
                                    'trx_id': jsonData.trx_id,
                                    'trx_date': jsonData.trx_date,
                                    'session_id': jsonData.session_id,
                                    'session_date': jsonData.session_date,
                                    'reg_type': jsonData.reg_type
                                },

                                apps: {
                                    'name': '',
                                    'no': '',
                                    'content': 'Keyword yang anda masukan salah.'
                                },
                                config: {
                                    'cost': 'PULL-0',
                                    'send_status': 1
                                }
                            };

                            function unlinkFile(theFile, callback) {
                                fs.unlink(theFile, function (err) {
                                    if (!err) {
                                        callback('ok');
                                    } else {
                                        callback(err);
                                    }
                                });
                            }

                            unlinkFile(filePath, function (result) {
                                if (result === 'ok') {
                                    try {
                                        conn.connect(function (err) {
                                            if (!err) {
                                                conn.db.collection('sms_apps').insertOne(keywordNotFoundSmsPush, function (err, res) {
                                                    if (!err) {
                                                        console.log(dateNow + ' : Wrong Keyword Message Create => ' + jsonData.telco + ' ' + jsonData.msisdn);
                                                    }
                                                });
                                            }
                                        });
                                    } catch (err) {
                                        console.log(dateNow + ' Catch error Wrong Keyword conn');
                                    }
                                }
                            });
                        }
                    });
                });
            }
        });
    }
});

module.exports = schedule;

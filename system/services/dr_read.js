var schedule = require('node-schedule');
var path = require('path');
var fs = require('fs');

var conn = require(path.resolve() + '/connection');

schedule.scheduleJob('* * * * * *', function () {
    var dateNow = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    var drDir = path.resolve() + '/system/files/dr';
    if (fs.existsSync(drDir)) {
        fs.readdir(drDir, (err, files) => {
            if (!err) {
                files.forEach(file => {
                    var filePath = drDir + '/' + file;
                    fs.readFile(filePath, 'utf8', function (err, data) {
                        if (!err) {
                            //connection
                            conn.connect(function (err) {
                                if (!err) {
                                    var jsonData = JSON.parse(data);

                                    // Insert DR as Log
                                    function insertDr(drData, callback) {
                                        conn.db.collection('sms_deliver').insertOne(drData, function (err, res) {
                                            if (!err) {
                                                callback('ok');
                                            } else {
                                                callback(err);
                                            }
                                        });
                                    }

                                    // Update SMS_Send by trx_id
                                    function updateSmsSend(callback) {
                                        insertDr(jsonData, function (result) {
                                            if (result === 'ok') {
                                                conn.db.collection('sms_push').update({'origin.trx_id': jsonData.trx_id}, {$set: {'config.send_status': jsonData.report}}, function (err, result) {
                                                    if (!err) {
                                                        callback('ok');
                                                    } else {
                                                        callback(err);
                                                    }
                                                });
                                            }
                                        });
                                    }

                                    // Unlink File
                                    updateSmsSend(function (result) {
                                        if (result === 'ok') {
                                            fs.unlink(filePath, function (err) {
                                                if (!err) {
                                                    console.log(dateNow + ' : DR Read => Add delivery report & Unlink file ' + jsonData.trx_id);
                                                }
                                            });
                                        }
                                    });
                                } else {
                                    console.log(dateNow + ' : DR Read => Connection DB refuse');
                                }
                            }); // if not connect DB
                        }
                    });
                });
            }
        });
    }
});

module.exports = schedule;

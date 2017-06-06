var schedule = require('node-schedule');
var path = require('path');
//var fs = require('fs');
var fs = require('graceful-fs');

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
                                    try {
                                        var jsonData = JSON.parse(data);

                                        // Insert DR as Log
                                        function insertDr(drData, callback) {
                                            try {
                                                conn.db.collection('sms_deliver').insert(drData, function (err, res) {
                                                    if (!err) {
                                                        callback('ok');
                                                    } else {
                                                        callback(err);
                                                    }
                                                });
                                            } catch (err) {
                                                console.log(dateNow + ' Catch error DR Read sms_deliver insertOne');
                                            }
                                        }

                                        // Update SMS_Send by trx_id
                                        function updateSmsSend(callback) {
                                            insertDr(jsonData, function (result) {
                                                if (result === 'ok') {
                                                    try {
                                                        conn.db.collection('sms_push').update({'origin.trx_id': jsonData.trx_id}, {$set: {'config.send_status': jsonData.report}}, function (err, result) {
                                                            if (!err) {
                                                                callback('ok');
                                                            } else {
                                                                callback(err);
                                                            }
                                                        });
                                                    } catch (err) {
                                                        console.log(dateNow + ' Catch error DR Read sms_push update');
                                                    }
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
                                    } catch (err) {
                                        console.log(dateNow + ' Catch error DR Read file null/empty');
                                    }
                                } else {
                                    console.log(dateNow + ' : DR Read => Connection DB refuse');
                                }
                            }); // if not connect DB
                        }
                    });

                }
                );
            }
        });
    }
}
);

module.exports = schedule;

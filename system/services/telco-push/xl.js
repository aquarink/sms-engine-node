const async = require('async');
var schedule = require('node-schedule');
var reQuest = require('request');
var conn = require('../../../connection.js');

var telcoProvider = 'xl';

schedule.scheduleJob('*/3 * * * * *', function () {

    //////// CONFIG //////////
    // Random number
    var rand = process.hrtime()[0] + process.hrtime()[1];
    // Date String
    var dateNow = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var dateString = new Date().toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/T/, '').replace(/\..+/, '');
    //////// CONFIG //////////

    try {
        conn.connect(function (err) {
            if (!err) {
                conn.db.collection('telco_config').find({'telco_name': telcoProvider}).toArray(function (err, fetchData) {
                    if (!err) {
                        if (fetchData.length === 0) {
                            throw 'fetch data Kosong';
                        } else {
                            try {
                                async.each(fetchData, (telcoData, cb) => {

                                    conn.db.collection('sms_apps').find({'telco.telco_name': telcoData.telco_name}).limit(telcoData.push_limit).toArray(function (smsErr, smsPushData) {
                                        if (!smsErr) {
                                            //console.log('smsPushData', smsPushData);
                                            async.map(smsPushData, (smsData, done) => {
                                                var link = `http://103.29.214.126/simulator/push.php?username=admin&password=admin&msisdn=${smsData.origin.msisdn}&trxid=${smsData.origin.trx_id}&serviceId=${smsData.config.cost}&sms=${smsData.apps.content}&shortname=1212121212`;
                                                //var link = `http://localhost/simulator-php/push.php?username=admin&password=admin&msisdn=${smsData.origin.msisdn}&trxid=${smsData.origin.trx_id}&serviceId=${smsData.config.cost}&sms=${smsData.apps.content}&shortname=1212121212`;

                                                reQuest(link, (requestErr, response, body) => {
                                                    if (!requestErr) {
                                                        if (response.statusCode === 200) {
                                                            const newData = {
                                                                body,
                                                                data: smsData
                                                            };
                                                            done(null, newData);
                                                        } else {
                                                            done('not 200');
                                                        }
                                                    } else {
                                                        done(requestErr);
                                                    }
                                                });
                                            }, (loopSmsErr, smsResults) => {
                                                if (loopSmsErr) {
                                                    console.log('loopSmsErr', loopSmsErr);
                                                    cb(loopSmsErr);
                                                } else {
                                                    function newObj(callback) {
                                                        // mutate smsResults di sini
                                                        for (var i = 0; i < smsResults.length; i++) {
                                                            if (smsResults[i].body === 'ok') {
                                                                //Trx Id exist // Pull
                                                                var smsPush = {
                                                                    telco: {
                                                                        'telco_name': smsResults[i].data.telco.telco_name
                                                                    },
                                                                    origin: {
                                                                        'shortcode': smsResults[i].data.origin.shortcode,
                                                                        'msisdn': smsResults[i].data.origin.msisdn,
                                                                        'sms_field': smsResults[i].data.origin.sms_field,
                                                                        'keyword': smsResults[i].data.origin.keyword,
                                                                        'trx_id': smsResults[i].data.origin.trx_id,
                                                                        'trx_date': smsResults[i].data.origin.trx_date,
                                                                        'session_id': smsResults[i].data.origin.session_id,
                                                                        'session_date': smsResults[i].data.origin.session_date,
                                                                        'reg_type': smsResults[i].data.origin.reg_type
                                                                    },

                                                                    apps: {
                                                                        'name': smsResults[i].data.apps.name,
                                                                        'no': smsResults[i].data.apps.no,
                                                                        'content': smsResults[i].data.apps.content
                                                                    },
                                                                    config: {
                                                                        'cost': smsResults[i].data.config.cost,
                                                                        'send_status': 1
                                                                    }
                                                                };

                                                                callback({"obj": smsPush, "body": smsResults[i].body});

                                                            } else {
                                                                //Trx Id not exist // Push
                                                                var smsPush = {
                                                                    telco: {
                                                                        'telco_name': smsResults[i].data.telco.telco_name
                                                                    },
                                                                    origin: {
                                                                        'shortcode': smsResults[i].data.origin.shortcode,
                                                                        'msisdn': smsResults[i].data.origin.msisdn,
                                                                        'sms_field': smsResults[i].data.origin.sms_field,
                                                                        'keyword': smsResults[i].data.origin.keyword,
                                                                        'trx_id': smsResults[i].body,
                                                                        'trx_date': smsResults[i].data.origin.trx_date,
                                                                        'session_id': smsResults[i].data.origin.session_id,
                                                                        'session_date': smsResults[i].data.origin.session_date,
                                                                        'reg_type': smsResults[i].data.origin.reg_type
                                                                    },

                                                                    apps: {
                                                                        'name': smsResults[i].data.apps.name,
                                                                        'no': smsResults[i].data.apps.no,
                                                                        'content': smsResults[i].data.apps.content
                                                                    },
                                                                    config: {
                                                                        'cost': smsResults[i].data.config.cost,
                                                                        'send_status': 1
                                                                    }
                                                                };
                                                                callback({"obj": smsPush, "body": smsResults[i].body});
                                                            }
                                                        }
                                                    }
                                                    newObj(function (result) {
                                                        // Delete data from sms_apps
                                                        function deleteSmsApps(dt, callback) {
                                                            try {
                                                                conn.db.collection('sms_apps').remove({"origin.session_id": dt.origin.session_id}, function (err, result) {
                                                                    if (!err) {
                                                                        callback('deleteOk');
                                                                    } else {
                                                                        callback('err');
                                                                    }
                                                                });
                                                            } catch (err) {
                                                                console.log(dateNow + ' Catch error ' + telcoProvider + ' sms_apps remove');
                                                            }
                                                        }

                                                        deleteSmsApps(result.obj, function (delSms) {
                                                            if (delSms === 'deleteOk') {
                                                                try {
                                                                    conn.db.collection('sms_push').insertOne(result.obj, function (err, res) {
                                                                        if (!err) {
                                                                            console.log(dateNow + ' : Telco Push : Push, Delete and Insert ok : ' + result.body);
                                                                            conn.db.close();
                                                                        }
                                                                    });
                                                                } catch (err) {
                                                                    console.log(dateNow + ' Catch error ' + telcoProvider + ' sms_push insertOne');
                                                                }
                                                            }
                                                        });
                                                    });
                                                    cb(); // call callback for next step
                                                }
                                            });
                                        } else {
                                            cb(smsErr);
                                        }
                                    });

                                }, (loopFetchErr) => {
                                    if (loopFetchErr) {
                                        console.log('error dari looping fetch data', loopFetchErr);
                                    } else {
                                        //console.log('Succes Final');
                                    }
                                });
                            } catch (err) {
                                console.log(dateNow + ' Catch error ' + telcoProvider + ' async');
                            }
                        }
                    } else {
                        console.log('err');
                        throw err;
                    }
                });
            } else {
                console.log(err);
            }
        });
    } catch (err) {
        console.log(dateNow + ' Catch error ' + telcoProvider + ' logic');
    }
});

module.exports = schedule;

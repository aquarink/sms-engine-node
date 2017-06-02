var schedule = require('node-schedule');
var path = require('path');
var fs = require('fs');
var reQuest = require('request');

var conn = require(path.resolve() + '/connection');

var telcoProvider = 'xl';

schedule.scheduleJob('* * * * * *', function () {

    //////// CONFIG //////////
    // Random number
    var rand = process.hrtime()[0] + process.hrtime()[1];
    // Date String
    var dateNow = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var dateString = new Date().toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/T/, '').replace(/\..+/, '');
    //////// CONFIG //////////

    conn.connect(function (err) {
        if (!err) {

            function telcoConfig(callback) {
                conn.db.collection('telco_config').find({'telco_name': telcoProvider}).toArray(function (err, fetchData) {
                    if (!err) {
                        if (fetchData.length === 0) {
                            callback(0);
                        } else {
                            for (var i = 0; i < fetchData.length; i++) {
                                callback(fetchData[i]);
                            }
                        }
                    } else {
                        callback('err');
                    }
                });
            }

            // Call Telco Config
            telcoConfig(function (result) {
                if (result === 'err' || result === 0) {
                    //console.log(result + ' aaa');
                } else {
                    conn.db.collection('sms_apps').find({'telco.telco_name': result.telco_name}).limit(result.push_limit).toArray(function (err, smsPushData) {
                        if (!err) {
                            if (smsPushData.length === 0) {
                                //console.log('nullData');
                            } else {
                                function sendToTelco(pushData, callback) {
                                    for (var j = 0; j < pushData.length; j++) {
                                        reQuest({
                                            url: 'http://localhost:3010/xl/incoming?username=admin&password=admin&msisdn=' + pushData[j].origin.msisdn + '&trxid=' + pushData[j].origin.trx_id + '&serviceId=PULL-' + pushData[j].config.cost + '&sms=' + pushData[j].apps.content + '&shortname=1212121212',
                                            method: "GET"
                                        }, function (err, res, body) {
                                            if (err) {
                                                callback('err');
                                            } else {
                                                callback({
                                                    "body": body,
                                                    "data": pushData
                                                });
                                            }
                                        });
                                    }
                                }

                                sendToTelco(smsPushData, function (result) {
                                    if (result === 'err') {
                                        console.log('Connect to Telco ' + result);
                                    } else {
                                        //
                                        function newObject(resObj, callback) {
                                            for (var i = 0; i < resObj.data.length; i++) {
                                                if (resObj.body === 'ok') {
                                                    //Trx Id exist // Pull
                                                    var smsPush = {
                                                        telco: {
                                                            'telco_name': resObj.data[i].telco.telco_name
                                                        },
                                                        origin: {
                                                            'shortcode': resObj.data[i].origin.shortcode,
                                                            'msisdn': resObj.data[i].origin.msisdn,
                                                            'sms_field': resObj.data[i].origin.sms_field,
                                                            'keyword': resObj.data[i].origin.keyword,
                                                            'trx_id': resObj.data[i].origin.trx_id,
                                                            'trx_date': resObj.data[i].origin.trx_date,
                                                            'session_id': resObj.data[i].origin.session_id,
                                                            'session_date': resObj.data[i].origin.session_date,
                                                            'reg_type': resObj.data[i].origin.reg_type
                                                        },

                                                        apps: {
                                                            'name': resObj.data[i].apps.name,
                                                            'no': resObj.data[i].apps.no,
                                                            'content': resObj.data[i].apps.content
                                                        },
                                                        config: {
                                                            'cost': 'PULL-' + resObj.data[i].config.cost,
                                                            'send_status': 1
                                                        }
                                                    };


                                                    callback(smsPush);
                                                } else {
                                                    //Trx Id not exist // Push
                                                    var smsPush = {
                                                        telco: {
                                                            'telco_name': resObj.data[i].telco.telco_name
                                                        },
                                                        origin: {
                                                            'shortcode': resObj.data[i].origin.shortcode,
                                                            'msisdn': resObj.data[i].origin.msisdn,
                                                            'sms_field': resObj.data[i].origin.sms_field,
                                                            'keyword': resObj.data[i].origin.keyword,
                                                            'trx_id': resObj.body,
                                                            'trx_date': resObj.data[i].origin.trx_date,
                                                            'session_id': resObj.data[i].origin.session_id,
                                                            'session_date': resObj.data[i].origin.session_date,
                                                            'reg_type': resObj.data[i].origin.reg_type
                                                        },

                                                        apps: {
                                                            'name': resObj.data[i].apps.name,
                                                            'no': resObj.data[i].apps.no,
                                                            'content': resObj.data[i].apps.content
                                                        },
                                                        config: {
                                                            'cost': 'PULL-' + resObj.data[i].config.cost,
                                                            'send_status': 1
                                                        }
                                                    };

                                                    callback(smsPush);
                                                }
                                            }
                                        }

                                        //
                                        newObject(result, function (resNewObj) {
                                            // Delete data from sms_apps
                                            conn.db.collection('sms_apps').remove({"origin.session_id": resNewObj.origin.session_id}, function (err, result) {
                                                if (!err) {
                                                    conn.db.collection('sms_push').insertOne(resNewObj, function (err, res) {
                                                        if (!err) {
                                                            console.log(dateNow + ' : Telco ' + telcoProvider + ' Push Push, Delete and Insert ok');
                                                        } else {
                                                            console.log('err 145');
                                                        }
                                                    });
                                                } else {
                                                    console.log('err 151');
                                                }
                                            });
                                        });
                                    }
                                });

                            }
                        } else {
                            console.log('err');
                        }
                    });
                }
            });

        } else {
            console.log(dateNow + ' : Telco ' + telcoProvider + ' => Connection DB refuse');
        }
    });
});

module.exports = schedule;

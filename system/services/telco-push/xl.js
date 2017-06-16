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
                            callback(0);
                        } else {
                            for (var i = 0; i < fetchData.length; i++) {
                                conn.db.collection('sms_apps').find({'telco.telco_name': fetchData[i].telco_name}).limit(fetchData[i].push_limit).toArray(function (err, smsPushData) {
                                    if (!err) {
                                        for (var i = 0; i < smsPushData.length; i++) {
                                            if (smsPushData.length === 0) {
                                                console.log('nullData');
                                            } else {
                                                var link = 'http://localhost/simulator-php/push.php?username=admin&password=admin&msisdn=' + smsPushData[i].origin.msisdn + '&trxid=' + smsPushData[i].origin.trx_id + '&serviceId=' + smsPushData[i].config.cost + '&sms=' + smsPushData[i].apps.content + '&shortname=1212121212';
                                                //var link = 'http://103.29.214.126/simulator/push.php?username=admin&password=admin&msisdn=' + smsPushData[i].origin.msisdn + '&trxid=' + smsPushData[i].origin.trx_id + '&serviceId=' + smsPushData[i].config.cost + '&sms=' + smsPushData[i].apps.content + '&shortname=1212121212';


                                                // REQUEST
                                                function requestUrl(uri, data, callback) {
                                                    reQuest({uri: uri, method: 'GET'}, function (err, response, body) {
                                                        if (!err) {
                                                            if (response.statusCode === 200) {
                                                                callback({'body': body, 'data': data});
                                                            } else {
                                                                console.log('not 200');
                                                            }
                                                        } else {
                                                            console.log('err');
                                                        }
                                                    });
                                                }

                                                function responseUrl(callback) {
                                                    function a(callback) {
                                                        requestUrl(link, smsPushData[i], function (result) {
                                                            callback({'datas': smsPushData[i], 'res': result});
                                                        });
                                                    }

                                                    a(function (r) {
                                                        callback({'data': r.datas, 'result': r.res});
                                                    });
                                                }

                                                responseUrl(function (rst) {
                                                    console.log(rst);
//                                                    if (rst.data !== undefined) {
//                                                        if (rst.result === 'ok') {
//                                                            console.log(rst.data.origin.trx_id + ' a');
//                                                        } else {
//                                                            console.log(rst.data.origin.trx_id + ' b');
//                                                        }
//                                                    }

                                                });
                                            }
                                        }
                                    }
                                });
                            }
                        }
                    } else {
                        console.log('err');
                    }
                });
            }
        });
    } catch (err) {
        console.log(dateNow + ' Catch error ' + telcoProvider + ' logic');
    }
});

module.exports = schedule;

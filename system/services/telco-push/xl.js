var schedule = require('node-schedule');
var path = require('path');
var reQuest = require('sync-request');

var conn = require(path.resolve() + '/connection.js');

var telcoProvider = 'xl';

schedule.scheduleJob('*/2 * * * * *', function () {

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
                        try {
                            conn.db.collection('sms_apps').find({'telco.telco_name': result.telco_name}).limit(result.push_limit).toArray(function (err, smsPushData) {
                                if (!err) {

                                    if (smsPushData.length === 0) {
                                        //console.log('nullData');
                                    } else {
                                        for (var i = 0; i < smsPushData.length; i++) {
                                            try {
                                                var resReq = reQuest('GET', 'http://localhost:3010/xl/incoming?username=admin&password=admin&msisdn=' + smsPushData[i].origin.msisdn + '&trxid=' + smsPushData[i].origin.trx_id + '&serviceId=PULL-' + smsPushData[i].config.cost + '&sms=' + smsPushData[i].apps.content + '&shortname=1212121212');
                                                if (resReq.statusCode === 200) {
                                                    function newObj(callback) {
                                                        if (resReq.getBody('utf8') === 'ok') {
                                                            //Trx Id exist // Pull
                                                            var smsPush = {
                                                                telco: {
                                                                    'telco_name': smsPushData[i].telco.telco_name
                                                                },
                                                                origin: {
                                                                    'shortcode': smsPushData[i].origin.shortcode,
                                                                    'msisdn': smsPushData[i].origin.msisdn,
                                                                    'sms_field': smsPushData[i].origin.sms_field,
                                                                    'keyword': smsPushData[i].origin.keyword,
                                                                    'trx_id': smsPushData[i].origin.trx_id,
                                                                    'trx_date': smsPushData[i].origin.trx_date,
                                                                    'session_id': smsPushData[i].origin.session_id,
                                                                    'session_date': smsPushData[i].origin.session_date,
                                                                    'reg_type': smsPushData[i].origin.reg_type
                                                                },

                                                                apps: {
                                                                    'name': smsPushData[i].apps.name,
                                                                    'no': smsPushData[i].apps.no,
                                                                    'content': smsPushData[i].apps.content
                                                                },
                                                                config: {
                                                                    'cost': 'PULL-' + smsPushData[i].config.cost,
                                                                    'send_status': 1
                                                                }
                                                            };

                                                            callback({"obj": smsPush, "body": resReq.getBody('utf8')});

                                                        } else {
                                                            //Trx Id not exist // Push
                                                            var smsPush = {
                                                                telco: {
                                                                    'telco_name': smsPushData[i].telco.telco_name
                                                                },
                                                                origin: {
                                                                    'shortcode': smsPushData[i].origin.shortcode,
                                                                    'msisdn': smsPushData[i].origin.msisdn,
                                                                    'sms_field': smsPushData[i].origin.sms_field,
                                                                    'keyword': smsPushData[i].origin.keyword,
                                                                    'trx_id': resReq.getBody('utf8'),
                                                                    'trx_date': smsPushData[i].origin.trx_date,
                                                                    'session_id': smsPushData[i].origin.session_id,
                                                                    'session_date': smsPushData[i].origin.session_date,
                                                                    'reg_type': smsPushData[i].origin.reg_type
                                                                },

                                                                apps: {
                                                                    'name': smsPushData[i].apps.name,
                                                                    'no': smsPushData[i].apps.no,
                                                                    'content': smsPushData[i].apps.content
                                                                },
                                                                config: {
                                                                    'cost': 'PULL-' + smsPushData[i].config.cost,
                                                                    'send_status': 1
                                                                }
                                                            };
                                                            callback({"obj": smsPush, "body": resReq.getBody('utf8')});
                                                        }
                                                    }

                                                    // 
                                                    newObj(function (datas) {
                                                        // Delete data from sms_apps
                                                        function deleteSmsApps(dt, callback) {
                                                            conn.db.collection('sms_apps').remove({"origin.session_id": dt.origin.session_id}, function (err, result) {
                                                                if (!err) {
                                                                    callback('deleteOk');
                                                                } else {
                                                                    callback('err');
                                                                }
                                                            });


                                                        }

                                                        deleteSmsApps(datas.obj, function (delSms) {
                                                            if (delSms === 'deleteOk') {
                                                                try {
                                                                    conn.db.collection('sms_push').insert(datas.obj, function (err, res) {
                                                                        if (!err) {
                                                                            console.log(dateNow + ' : Telco ' + telcoProvider + ' Push => New Obj, Delete Sms App, Push to Telco & Insert Push | Body = ' + datas.body);
                                                                        }
                                                                    });
                                                                } catch (err) {
                                                                    console.log(dateNow + ' Catch error ' + telcoProvider + ' sms_push insert| Body = ' + datas.body);
                                                                }
                                                            } 
//                                                            else {
//                                                                console.log('aaaaaaaaaaaaaa');
//                                                            }
                                                        });
                                                    });
                                                }
                                            } catch (err) {
                                                console.log(dateNow + ' Catch error ' + telcoProvider + ' push url');
                                            }
                                        }
                                    }
                                } 
//                                else {
//                                    console.log('err-169');
//                                }
                            });
                        } catch (err) {
                            console.log(dateNow + ' Catch error ' + telcoProvider + ' logic');
                        }
                    }
                });
            } 
//            else {
//                //console.log(err);
//                console.log(dateNow + ' : Telco ' + telcoProvider + ' => Connection DB refuse');
//            }
        });
    } catch (err) {
        console.log(dateNow + ' Catch error ' + telcoProvider + ' logic');
    }
});

module.exports = schedule;

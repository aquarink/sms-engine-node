var schedule = require('node-schedule');
var path = require('path');
//var fs = require('fs');
var fs = require('graceful-fs');

var objId = require('mongodb').ObjectID;

var conn = require('../../../connection.js');

var app = 'bola';

schedule.scheduleJob('*/1 * * * * *', function () {

    //////// CONFIG //////////
    // Random number
    var rand = Math.floor((Math.random() * 10000000) + 1);
    // Date String
    var dateNow = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var dateString = new Date().toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/T/, '').replace(/\..+/, '');
    //////// CONFIG //////////

    var appDir = path.resolve() + '/system/files/apps/' + app;
    if (fs.existsSync(appDir)) {
        fs.readdir(appDir, (err, files) => {
            if (!err) {
                files.forEach(file => {
                    var filePath = appDir + '/' + file;
                    fs.readFile(filePath, 'utf8', function (err, data) {
                        if (!err) {
                            var jsonData = JSON.parse(data);
                            try {
                                conn.connect(function (err) {
                                    if (!err) {
                                        // Fetch Config of app
                                        function contentConfig(callback) {
                                            try {
                                                conn.db.collection('apps_config').find().toArray(function (err, configData) {
                                                    if (!err) {
                                                        callback(configData);
                                                    } else {
                                                        callback('err');
                                                    }
                                                });
                                            } catch (err) {
                                                console.log(dateNow + ' Catch error Bola pps_config find');
                                            }
                                        }

                                        // Fetch SMS Push by app and msisdn
                                        function smsPush(callback) {
                                            contentConfig(function (resConfig) {
                                                if (resConfig === 'err') {
                                                    callback('errConfig');
                                                } else {

                                                    // Check data on SMS Push
                                                    function smsPushCheck(callback) {
                                                        try {
                                                            conn.db.collection('sms_push').find({'origin.shortcode': jsonData.shortcode, 'origin.keyword': jsonData.keyword, 'telco.telco_name': jsonData.telco, 'origin.msisdn': jsonData.msisdn}).toArray(function (err, smsPushData) {
                                                                if (!err) {
                                                                    if (smsPushData.length === 0) {
                                                                        callback(1);
                                                                    } else {
                                                                        for (var i = 0; i < smsPushData.length; i++) {
                                                                            callback((smsPushData[i].apps.no) + 1);
                                                                        }
                                                                    }

                                                                } else {
                                                                    callback('err');
                                                                }
                                                            });
                                                        } catch (err) {
                                                            console.log(dateNow + ' Catch error Bola sms_push find');
                                                        }
                                                    }

                                                    // Bring new bSon data
                                                    smsPushCheck(function (pushCheckData) {
                                                        if (pushCheckData === 'err') {
                                                            callback('errSmsPushCheck');
                                                        } else {
                                                            for (var i = 0; i < resConfig.length; i++) {
                                                                callback({
                                                                    config: resConfig[i],
                                                                    pushInfo: pushCheckData
                                                                });
                                                            }
                                                        }
                                                    });
                                                }
                                            });
                                        }

                                        // Get Content from Apps_content
                                        function getContent(callback) {
                                            smsPush(function (push) {
                                                if (push === 'errConfig' || push === 'errSmsPushCheck') {
                                                    callback(push);
                                                } else {

                                                    // Check data on Apps_content
                                                    function fetchSmsPush(callback) {
                                                        try {
                                                            conn.db.collection('apps_content').find({'app_name': app, 'no_content': push.pushInfo}).toArray(function (err, appContentData) {
                                                                if (!err) {
                                                                    if (appContentData.length === 0) {
                                                                        callback('dataNull');
                                                                    } else {
                                                                        for (var i = 0; i < appContentData.length; i++) {
                                                                            callback(appContentData[i]);
                                                                        }
                                                                    }

                                                                } else {
                                                                    callback('err');
                                                                }
                                                            });
                                                        } catch (err) {
                                                            console.log(dateNow + ' Catch error apps_content find');
                                                        }
                                                    }

                                                    // Bring new bSon data
                                                    fetchSmsPush(function (dataSmsPush) {
                                                        if (dataSmsPush === 'err' || dataSmsPush === 'dataNull') {
                                                            callback('errDataSmsPush');
                                                        } else {
                                                            callback({
                                                                config: push.config,
                                                                pushInfo: push.pushInfo,
                                                                content: dataSmsPush
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        }

                                        // New Object Content
                                        function newObject(callback) {
                                            getContent(function (content) {
                                                if (content === 'errDataSmsPush') {
                                                    callback('errGetcontent');
                                                } else {
                                                    // Welcome message
                                                    if (content.pushInfo === 1) {
                                                        var welcome_message = {
                                                            telco: {
                                                                'telco_name': jsonData.telco
                                                            },
                                                            origin: {
                                                                'shortcode': jsonData.shortcode,
                                                                'msisdn': jsonData.msisdn,
                                                                'sms_field': jsonData.sms_field,
                                                                'keyword': jsonData.keyword,
                                                                'trx_id': jsonData.trx_id,
                                                                'trx_date': dateNow,
                                                                'session_id': jsonData.session_id,
                                                                'session_date': dateNow,
                                                                'reg_type': jsonData.reg_type
                                                            },

                                                            apps: {
                                                                'name': app,
                                                                'no': '',
                                                                'content': 'Welcome message ' + app
                                                            },
                                                            config: {
                                                                'cost': 'PULL-0',
                                                                'send_status': 1
                                                            }
                                                        };
                                                        try {
                                                            conn.db.collection('sms_apps').insert(welcome_message, function (err, res) {
                                                                if (!err) {
                                                                    console.log(dateNow + ' : Welcome Message Create => ' + jsonData.telco + ' ' + jsonData.msisdn);
                                                                }
                                                            });
                                                        } catch (err) {
                                                            console.log(dateNow + ' Catch error Bola sms_apps insertOne');
                                                        }
                                                    }

                                                    // -----------------------------

                                                    var sms_app = {
                                                        telco: {
                                                            'telco_name': jsonData.telco
                                                        },
                                                        origin: {
                                                            'shortcode': jsonData.shortcode,
                                                            'msisdn': jsonData.msisdn,
                                                            'sms_field': jsonData.sms_field,
                                                            'keyword': jsonData.keyword,
                                                            'trx_id': '',
                                                            'trx_date': jsonData.trx_date,
                                                            'session_id': dateString + new objId(),
                                                            'session_date': dateNow,
                                                            'reg_type': jsonData.reg_type
                                                        },

                                                        apps: {
                                                            'name': app,
                                                            'no': content.content.no_content,
                                                            'content': content.content.content_field
                                                        },
                                                        config: {
                                                            'cost': 'PULL-' + content.config.cost.pull,
                                                            'send_status': 1
                                                        }
                                                    };
                                                    callback(sms_app);
                                                }
                                            });
                                        }

                                        // Delete File 
                                        function delFile(file, callback) {
                                            fs.unlink(file, function (err) {
                                                if (!err) {
                                                    callback('ok');
                                                } else {
                                                    callback('err');
                                                }
                                            });
                                        }

                                        // execute
                                        delFile(filePath, function (resDelFile) {
                                            if (resDelFile === 'ok') {
                                                newObject(function (newObj) {
                                                    if (newObj !== 'errGetcontent') { // << tidak error
                                                        try {
                                                            conn.db.collection('sms_apps').insertOne(newObj, function (err, res) {
                                                                if (!err) {
                                                                    console.log(dateNow + ' : App Message Create => ' + jsonData.telco + ' - ' + jsonData.msisdn + ' if');
                                                                }
                                                            });
                                                        } catch (err) {
                                                            console.log(dateNow + ' Catch error Bola sms_apps insertOne');
                                                        }
                                                    } 
//                                                    else {
//                                                        console.log('b-302');
//                                                    }
                                                });
                                            }
                                        });

                                    }
//                                    else {
//                                        console.log(dateNow + ' : App ' + app + ' => Connection DB refuse');
//                                    }
                                });
                            } catch (err) {
                                console.log(dateNow + ' Catch error Bola Logic');
                            }
                        }
                    });
                });
            }
        });
    }
});

//schedule.scheduleJob('* * * * * *', function () {
//
//    //////// CONFIG //////////
//    // Random number
//    var rand = process.hrtime()[0] + process.hrtime()[1];
//    // Date String
//    var dateNow = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
//    var dateString = new Date().toISOString().replace(/-/, '').replace(/-/, '').replace(/:/, '').replace(/:/, '').replace(/T/, '').replace(/\..+/, '');
//
//    // [0] = "Sunday" [1] = "Monday" [2] = "Tuesday" [3] = "Wednesday" [4] = "Thursday" [5] = "Friday" [6] = "Saturday";
//    //console.log(new Date().getDay());
//    //////// CONFIG //////////
//
//
//    conn.connect(function (err) {
//        if (!err) {
//            // Fetch Config of app
//            function contentConfig(callback) {
//                conn.db.collection('apps_config').find().toArray(function (err, configData) {
//                    if (!err) {
//                        callback(configData);
//                    } else {
//                        callback('err');
//                    }
//                });
//            }
//
//            contentConfig(function (resConfig) {
//                if (resConfig === 'err') {
//                    console.log('errConfig');
//                } else {
//                    for (var i = 0; i < resConfig.length; i++) {
//                        for (var j = 0; j < resConfig[i].push_time.length; j++) {
////                            if(new Date().getDay() === resConfig[i].push_time[j] && 13 < new Date().getHours() < 14) {
////                                console.log('yes');
////                            } else {
////                                console.log('no');
////                            }
//                        }
//                    }
//                }
//            });
//
//        } else {
//            console.log(err);
//            //console.log(dateNow + ' : App ' + app + ' 2 => Connection DB refuse');
//        }
//    });
//});

module.exports = schedule;

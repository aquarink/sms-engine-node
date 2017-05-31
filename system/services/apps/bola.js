var schedule = require('node-schedule');
var path = require('path');
var fs = require('fs');

var conn = require(path.resolve() + '/connection');

schedule.scheduleJob('* * * * * *', function () {
    var dateNow = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    //////// CONFIG //////////
    var app = 'bola';
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

                            conn.connect(function (err) {
                                if (!err) {

                                    // Fetch Config of app
                                    function contentConfig(callback) {
                                        conn.db.collection('apps_config').find().toArray(function (err, configData) {
                                            if (!err) {
                                                callback(configData);
                                            } else {
                                                callback('err');
                                            }
                                        });
                                    }

                                    // Fetch SMS Push by app and msisdn
                                    function smsPush(callback) {
                                        contentConfig(function (resConfig) {
                                            if (resConfig === 'err') {
                                                callback('errConfig');
                                            } else {

                                                // Check data on SMS Push
                                                function smsPushCheck(callback) {
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
                                                            telco_name: jsonData.telco
                                                        },
                                                        origin: {
                                                            shortcode: jsonData.shortcode,
                                                            msisdn: jsonData.msisdn,
                                                            sms_fild: jsonData.sms_fild,
                                                            keyword: jsonData.keyword,
                                                            trx_id: jsonData.trx_id,
                                                            trx_date: jsonData.trx_date,
                                                            session_id: jsonData.session_id,
                                                            session_date: jsonData.session_date,
                                                            reg_type: jsonData.reg_type
                                                        },

                                                        apps: {
                                                            name: app,
                                                            no: '',
                                                            content: 'Welcome message ' + app
                                                        },
                                                        config: {
                                                            cost: 'PULL-0',
                                                            send_status: 1
                                                        }
                                                    };
                                                }

                                                // -----------------------------

                                                var sms_app = {
                                                    telco: {
                                                        telco_name: jsonData.telco
                                                    },
                                                    origin: {
                                                        shortcode: jsonData.shortcode,
                                                        msisdn: jsonData.msisdn,
                                                        sms_fild: jsonData.sms_fild,
                                                        keyword: jsonData.keyword,
                                                        trx_id: jsonData.trx_id,
                                                        trx_date: jsonData.trx_date,
                                                        session_id: jsonData.session_id,
                                                        session_date: jsonData.session_date,
                                                        reg_type: jsonData.reg_type
                                                    },

                                                    apps: {
                                                        name: app,
                                                        no: content.content.no_content,
                                                        content: content.content.content_field
                                                    },
                                                    config: {
                                                        cost: 'PULL-' + content.config.cost.pull,
                                                        send_status: 1
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
                                                callback('err')
                                            }
                                        });
                                    }

                                    // Insert new Object to DB
                                    function insData(obj, callback) {
                                        delFile(filePath, function (resDelFile) {
                                            if (resDelFile === 'ok') {
                                                conn.db.collection('sms_apps').insertOne(obj, function (err, res) {
                                                    if (!err) {
                                                        callback('insertPushOk');
                                                    } else {
                                                        callback('insertPushErr');
                                                    }
                                                });
                                            } else {
                                                callback('resDelFileErr');
                                            }
                                        });
                                    }

                                    newObject(function (newObj) {
                                        if (newObj !== 'errGetcontent') { // << tidak error
                                            // tidak ada kontent atau collection content
                                            console.log(newObj)
                                        } else {
                                            console.log('b')
                                        }
//                                        if (newObj === 'insertPushErr' || newObj === 'resDelFileErr') {
//                                            console.log(newObj);
//                                        } else {
//                                            insData(newObj, function (resInsData) {
//                                                if (resInsData === 'errDelFile' || resInsData === 'err') {
//                                                    console.log(resInsData);
//                                                } else {
//                                                    console.log('ok app');
//                                                }
//                                            });
//                                        }
                                    });
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

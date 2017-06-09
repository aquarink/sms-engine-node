var schedule = require('node-schedule');
var path = require('path');
var fsNode = require('fs');
var fs = require('graceful-fs');
var mkdirp = require('mkdirp');

var conn = require(path.resolve() + '/connection.js');

schedule.scheduleJob('*/2 * * * * *', function () {
    var dateNow = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    var moDir = path.resolve() + '/system/files/mo';
    if (fs.existsSync(moDir)) {
        fs.readdir(moDir, (err, files) => {
            if (!err) {
                files.forEach(file => {
                    var filePath = moDir + '/' + file;
                    fs.readFile(filePath, 'utf8', function (err, data) {
                        if (!err) {
                            try {
                                //connection
                                conn.connect(function (err) {
                                    if (!err) {

                                        const stats = fsNode.statSync(filePath);
                                        const fileSize = stats.size;
//                                        if(fileSize )
                                        var jsonData = JSON.parse(data);

                                        if (jsonData.reg_type === 1) {
                                            function checkApp(callback) {
                                                conn.db.collection('apps_config').find({'app_name': jsonData.keyword}).count(function (err, count) {
                                                    if (!err) {
                                                        if (count === 0) {
                                                            callback('appNull');
                                                        } else {
                                                            callback('appExisth');
                                                        }
                                                    }
                                                });
                                            }


                                            checkApp(function (resCheckApp) {
                                                var newPath;

                                                if (resCheckApp === 'appNull') {
                                                    newPath = path.resolve() + '/system/files/apps/other';
                                                } else {
                                                    newPath = path.resolve() + '/system/files/apps/' + jsonData.keyword;
                                                }

                                                if (fs.existsSync(newPath)) {
                                                    function moveFile(oldFile, newFile, callback) {
                                                        fs.rename(oldFile, newFile + '/' + file, function (err) {
                                                            if (!err) {
                                                                callback('ok');
                                                            } else {
                                                                callback(err);
                                                            }
                                                        });
                                                    }

                                                    moveFile(filePath, newPath, function (resMoveFile) {
                                                        if (resMoveFile === 'ok') {
                                                            //Check Member exist
                                                            function memberExist(callback) {
                                                                try {
                                                                    conn.db.collection('subscriber').find({'telco': jsonData.telco, 'shortcode': jsonData.shortcode, 'msisdn': jsonData.msisdn, 'keyword': jsonData.keyword}).toArray(function (err, doc) {
                                                                        if (!err) {
                                                                            if (doc.length === 0) {
                                                                                callback('dataNull');
                                                                            } else {
                                                                                callback('dataExist');
                                                                            }
                                                                        } else {
                                                                            callback('memberErr');
                                                                        }
                                                                    });
                                                                } catch (err) {
                                                                    console.log(dateNow + ' Catch error subscriber find');
                                                                }
                                                            }

                                                            // Insert member collection
                                                            memberExist(function (memberCheck) {
                                                                if (memberCheck === 'dataNull') {
                                                                    try {
                                                                        conn.db.collection('subscriber').insert(jsonData, function (err, res) {
                                                                            if (!err) {
                                                                                console.log(dateNow + ' : MO Read => Add member & Move file to apps created if');
                                                                            }
                                                                        });
                                                                    } catch (err) {
                                                                        console.log(dateNow + ' Catch error subscriber insertOne');
                                                                    }
                                                                } else {
                                                                    console.log(dateNow + ' : MO Read => Move file to apps created if');
                                                                }
                                                            });
                                                        }
                                                    });

                                                } else {
                                                    function makeDir(mkPath, callback) {
                                                        mkdirp(mkPath, function (err) {
                                                            if (!err) {
                                                                callback('mkdirOk');
                                                            } else {
                                                                callback(err);
                                                            }
                                                        });
                                                    }

                                                    makeDir(newPath, function (result) {
                                                        if (result === 'mkdirOk') {
                                                            function moveFile(oldFile, newFile, callback) {
                                                                fs.rename(oldFile, newFile + '/' + file, function (err) {
                                                                    if (!err) {
                                                                        callback('ok');
                                                                    } else {
                                                                        callback(err);
                                                                    }
                                                                });
                                                            }

                                                            moveFile(filePath, newPath, function (resMoveFile) {
                                                                if (resMoveFile === 'ok') {
                                                                    //Check Member exist
                                                                    function memberExist(callback) {
                                                                        conn.db.collection('subscriber').find({'telco': jsonData.telco, 'shortcode': jsonData.shortcode, 'msisdn': jsonData.msisdn, 'keyword': jsonData.keyword}).toArray(function (err, doc) {
                                                                            if (!err) {
                                                                                if (doc.length === 0) {
                                                                                    callback('dataNull');
                                                                                } else {
                                                                                    callback('dataExist');
                                                                                }
                                                                            } else {
                                                                                callback('memberErr');
                                                                            }
                                                                        });
                                                                    }

                                                                    // Insert member collection
                                                                    memberExist(function (memberCheck) {
                                                                        if (memberCheck === 'dataNull') {
                                                                            conn.db.collection('subscriber').insertOne(jsonData, function (err, res) {
                                                                                if (!err) {
                                                                                    console.log(dateNow + ' : MO Read => Add member & Move file to apps created else');
                                                                                }
                                                                            });
                                                                        } else {
                                                                            console.log(dateNow + ' : MO Read => Move file to apps created else');
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        } else {
                                                            console.log(result + ' makeDir-mo-read');
                                                        }
                                                    });
                                                }
                                            });
                                        } else {
                                            try {
                                                conn.db.collection('subscriber').update({'msisdn': jsonData.msisdn, 'keyword': jsonData.keyword}, {$set: {'reg_type': jsonData.reg_type}}, function (err, result) {
                                                    if (!err) {
                                                        console.log(dateNow + ' : Mo Read => Unreg command success');
                                                    }
                                                });
                                            } catch (err) {
                                                console.log(dateNow + ' Catch error MO Read subscriber update');
                                            }
                                        }

                                    } 
//                                    else {
//                                        console.log(dateNow + ' : Mo Read => Connection DB refuse');
//                                    }
                                }); // if not connect DB
                            } catch (err) {
                                console.log(dateNow + ' Catch error Mo conn & Read Logic');
                            }
                        }
                    });
                });
            }
        });
    }
});

module.exports = schedule;

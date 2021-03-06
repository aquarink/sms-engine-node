var schedule = require('node-schedule');
var path = require('path');
var fs = require('graceful-fs');
var mkdirp = require('mkdirp');

var conn = require('../../connection.js');

schedule.scheduleJob('*/2 * * * * *', function () {
    var dateNow = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    var moDir = path.join(__dirname + '/../', '/files/mo');
    if (fs.existsSync(moDir)) {
        try {
            fs.readdir(moDir, (err, files) => {
                if (!err) {
                    files.forEach(file => {
                        var filePath = moDir + '/' + file;
                        try {
                            fs.readFile(filePath, 'utf8', function (err, data) {
                                if (!err) {
                                    try {
                                        //connection
                                        conn.connect(function (err) {
                                            if (!err) {
                                                var jsonData = JSON.parse(data);

                                                if (jsonData.reg_type === 1) {
                                                    function checkApp(callback) {
                                                        try {
                                                            conn.db.collection('apps_config').find({'app_name': jsonData.keyword}).count(function (err, count) {
                                                                if (!err) {
                                                                    if (count === 0) {
                                                                        callback('appNull');
                                                                    } else {
                                                                        callback('appExisth');
                                                                    }
                                                                }
                                                            });
                                                        } catch (err) {
                                                            console.log(dateNow + ' :  Catch error mo_read apps_config find');
                                                        }
                                                    }


                                                    checkApp(function (resCheckApp) {
                                                        var newPath;

                                                        if (resCheckApp === 'appNull') {
                                                            newPath = path.join(__dirname + '/../', '/files/apps/other');
                                                        } else {
                                                            newPath = path.join(__dirname + '/../', '/files/apps/') + jsonData.keyword;
                                                        }

                                                        if (fs.existsSync(newPath)) {
                                                            function moveFile(oldFile, newFile, callback) {
                                                                try {
                                                                    fs.rename(oldFile, newFile + '/' + file, function (err) {
                                                                        if (!err) {
                                                                            callback('ok');
                                                                        } else {
                                                                            callback(err);
                                                                        }
                                                                    });
                                                                } catch (err) {
                                                                    console.log(dateNow + ' :  Catch error mo_read move file if');
                                                                }
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
                                                                try {
                                                                    mkdirp(mkPath, function (err) {
                                                                        if (!err) {
                                                                            callback('mkdirOk');
                                                                        } else {
                                                                            callback(err);
                                                                        }
                                                                    });
                                                                } catch (err) {
                                                                    console.log(dateNow + ' :  Catch error mo_read mkdir');
                                                                }
                                                            }

                                                            makeDir(newPath, function (result) {
                                                                if (result === 'mkdirOk') {
                                                                    function moveFile(oldFile, newFile, callback) {
                                                                        try {
                                                                            fs.rename(oldFile, newFile + '/' + file, function (err) {
                                                                                if (!err) {
                                                                                    callback('ok');
                                                                                } else {
                                                                                    callback(err);
                                                                                }
                                                                            });
                                                                        } catch (err) {
                                                                            console.log(dateNow + ' :  Catch error mo_read move file else');
                                                                        }
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
                                                                                    try {
                                                                                        conn.db.collection('subscriber').insertOne(jsonData, function (err, res) {
                                                                                            if (!err) {
                                                                                                console.log(dateNow + ' : MO Read => Add member & Move file to apps created else');
                                                                                            }
                                                                                        });
                                                                                    } catch (err) {
                                                                                        console.log(dateNow + ' :  Catch error mo_read subscriber insertOne');
                                                                                    }
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
                                                                conn.db.close();
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
                        } catch (err) {
                            console.log(dateNow + ' Catch error MO Read files fs.readFile');
                        }
                    });
                }
            });
        } catch (err) {
            console.log(dateNow + ' :  Catch error mo_read read folder');
        }
    }
});

module.exports = schedule;

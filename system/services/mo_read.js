var schedule = require('node-schedule');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');

var conn = require(path.resolve() + '/connection');

schedule.scheduleJob('* * * * * *', function () {
    var dateNow = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    var moDir = path.resolve() + '/system/files/mo';
    if (fs.existsSync(moDir)) {
        fs.readdir(moDir, (err, files) => {
            if (!err) {
                files.forEach(file => {
                    var filePath = moDir + '/' + file;
                    fs.readFile(filePath, 'utf8', function (err, data) {
                        if (!err) {
                            //connection
                            conn.connect(function (err) {
                                if (!err) {
                                    var jsonData = JSON.parse(data);

                                    // Move file as apps/keyword
                                    var newPath = path.resolve() + '/system/files/apps/' + jsonData.keyword;
                                    if (fs.existsSync(newPath)) {

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
                                        function insertMember(memberObj, callback) {
                                            memberExist(function (memberCheck) {
                                                if (memberCheck === 'dataNull') {
                                                    conn.db.collection('subscriber').insertOne(memberObj, function (err, res) {
                                                        if (err) {
                                                            callback('insertMemberErr');
                                                        } else {
                                                            callback('insertMemberOk');
                                                        }
                                                    });
                                                } else {
                                                    callback(memberCheck);
                                                }
                                            });
                                        }

                                        insertMember(jsonData, function (resInsMember) {
                                            if (resInsMember === 'insertMemberOk') {
                                                fs.rename(filePath, newPath + '/' + file, function (err) {
                                                    if (!err) {
                                                        console.log(dateNow + ' : MO Read => Add member & Move file to apps created if');
                                                    }
                                                });
                                            } else if (resInsMember === 'dataExist') {
                                                fs.rename(filePath, newPath + '/' + file, function (err) {
                                                    if (!err) {
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
                                                function insertMember(memberObj, callback) {
                                                    memberExist(function (memberCheck) {
                                                        if (memberCheck === 'dataNull') {
                                                            conn.db.collection('subscriber').insertOne(memberObj, function (err, res) {
                                                                if (err) {
                                                                    callback('insertMemberErr');
                                                                } else {
                                                                    callback('insertMemberOk');
                                                                }
                                                            });
                                                        } else {
                                                            callback(memberCheck);
                                                        }
                                                    });
                                                }

                                                insertMember(jsonData, function (resInsMember) {
                                                    if (resInsMember === 'insertMemberOk') {
                                                        fs.rename(filePath, newPath + '/' + file, function (err) {
                                                            if (!err) {
                                                                console.log(dateNow + ' : MO Read => Add member & Move file to apps created else');
                                                            }
                                                        });
                                                    } else if (resInsMember === 'dataExist') {
                                                        fs.rename(filePath, newPath + '/' + file, function (err) {
                                                            if (!err) {
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

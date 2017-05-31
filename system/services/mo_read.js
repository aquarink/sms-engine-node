var schedule = require('node-schedule');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');

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
                            var jsonData = JSON.parse(data);
                            // Move file as apps/keyword
                            var newPath = path.resolve() + '/system/files/apps/' + jsonData.keyword;
                            if (fs.existsSync(newPath)) {
                                fs.rename(filePath, newPath + '/' + file, function (err) {
                                    if (!err) {
                                        console.log(dateNow + ' : MO Read => Move file to apps created if');
                                    } else {
                                        console.log(err);
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
                                        fs.rename(filePath, newPath + '/' + file, function (err) {
                                            if (!err) {
                                                console.log(dateNow + ' : MO Read => Move file to apps created else');
                                            } else {
                                                console.log(err);
                                            }
                                        });
                                    } else {
                                        console.log(result);
                                    }
                                });
                            }

                        }
                    });
                });
            }
        });
    }
});

module.exports = schedule;

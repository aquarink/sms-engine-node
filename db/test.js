var path = require('path');
var conn = require(path.resolve('../') + '/connection.js');
var schedule = require('node-schedule');

schedule.scheduleJob('*/2 * * * * *', function () {
    conn.connect(function (err) {
        if (err) {
            console.log('err');
        } else {
            console.log('ok');
        }
    });

    conn.on('error', function (err) {
        console.log("DB connection Error: " + err);
    });
    conn.on('open', function () {
        console.log("DB connected");
    });
    conn.on('close', function (str) {
        console.log("DB disconnected: " + str);
    });
});
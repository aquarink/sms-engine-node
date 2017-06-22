var conn = require('../../connection.js');

try {
    conn.connect(function (err) {
        if (!err) {
            console.log('Conncection ok');
            conn.db.close();
        } else {
            console.log(err);
        }
    });
} catch (err) {
    console.log('err catch');
}
var MongoClient = require('mongodb').MongoClient;

function _connectDB(callback) {
    var url = 'mongodb://localhost:27017/talk';
    MongoClient.connect(url, function (err, db) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(err, db);
    });
}

init();

function init() {
    _connectDB(function (err, db) {
        if (err) {
            console.log(err);
            return;
        }
        db.collection('users').createIndex(
            {'username': 1},
            null,
            function (err, results) {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log('索引建立成功');
            }
        );
    });
}

exports.insertOne = function (collectionName, json, callback) {
    _connectDB(function (err, db) {
        db.collection(collectionName).insertOne(json, function (err, result) {
            callback(err, result);
            db.close();
        });
    });
}

exports.find = function (collectionName, json, C, D) {
    var result = [];
    if (arguments.length == 3) {
        var callback = C;
        var skipnumber = 0;
        var limit = 0;
    } else if (arguments.length == 4) {
        var callback = D;
        var args = C;
        var skipnumber = args.pageamount * args.page || 0;
        var limit = args.pageamount || 0;
        var sort = args.sort || {};
    } else {
        throw new Error('find函数的参数个数，必须是3个，或者4个');
        return;
    }

    _connectDB(function (err, db) {
        var cursor = db.collection(collectionName).find(json).skip(skipnumber).limit(limit).sort(sort);
        cursor.each(function (err, doc) {
            if (err) {
                callback(err, null);
                db.close();
                return;
            }
            if (doc != null) {
                result.push(doc);
            } else {
                callback(null, result);
                db.close();
            }
        });
    });
}

exports.deleteMany = function (collectionName, json, callback) {
    _connectDB(function (err, db) {
        db.collection(collectionName).deleteMany(json, function (err, results) {
            callback(err, results);
            db.close();
        });
    });
}

exports.updateMany = function (collectionName, json1, json2, callback) {
    _connectDB(function (err, db) {
        db.collection(collectionName).updateMany(json1, json2, function (err, results) {
            callback(err, results);
            db.close();
        });
    });
}

exports.getAllCount = function (collectionName, callback) {
    _connectDB(function (err, db) {
        db.collection(collectionName).count({}).then(function (count) {
            callback(count);
            db.close();
        });
    });
}

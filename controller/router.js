var formidable = require('formidable');
var db = require('../models/db.js');
var md5 = require('../models/md5.js');
var gm = require('gm');
var fs = require('fs');
var path = require('path');
var sd = require('silly-datetime');

exports.showIndex = function (req, res, next) {
    //查看登陆状态,并赋值username和login
    if (req.session.login == '1') {
        var username = req.session.username;
        var login = true;
    } else {
        var username = '';
        var login = false;
    }
    //在数据库查找avatar,然后渲染首页
    db.find('users', {'username': username}, function (err, result) {
        var avatar = result.length == 0 ? '' : result[0].avatar;
        res.render('index',{
            'login': login,
            'username': username,
            'active': 'index',
            'avatar': avatar
        });
    });
}

exports.doPost = function (req, res, next) {
    if (req.session.login != '1') {
        res.end('请登录！');
        return;
    }
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var content = fields.content;
        var username = req.session.username;
        var datetime = sd.format(new Date(), 'YYYY-MM-DD/HH:mm:ss');
        db.insertOne('posts', {
            'username': username,
            'content': content,
            'datetime': datetime
        }, function (err, result) {
            if (err) {
                res.send('-3');//服务器错误
                return;
            }
            res.send('1');//发表成功
        });
    });
}

exports.getAllTalk = function (req, res, next) {
    var page = req.query.page;
    db.find('posts', {}, {'pageamount':9, 'page':page, 'sort':{datetime:-1}}, function (err, result) {
        res.json(result);
    });
}

exports.getUserInfo = function (req, res, next) {
    var username = req.query.username;
    db.find('users', {'username': username}, function (err, result) {
        if (err || result.length == 0) {
            res.json('');
            return;
        }
        var obj = {
            'username': result[0].username,
            'avatar': result[0].avatar,
            '_id': result[0]._id
        }
        res.json(obj);
    });
}

exports.getTalkAmount = function (req, res, next) {
    db.getAllCount('posts', function (count) {
        res.send(count.toString());
    });
}

exports.showUser = function (req, res, next) {
    var user = req.params['user'];
    var _id = req.params['_id'];
    db.find('posts', {'username': user} || {'_id': _id}, function (err, result) {
        var user1 = result[0].username;
        db.find('users', {'username': user1}, function (err, result2) {
            res.render('user',{
                'username': req.session.login == '1' ? req.session.username : '',
                'login': req.session.login == '1' ? true : false,
                'active': 'sbtalk',
                'avatar': result2[0].avatar,
                'talk': result
            });
        });
    });
}

exports.showUserList = function (req, res, next) {
    db.find('users', {}, function (err, result) {
        res.render('userList', {
            'username': req.session.login == '1' ? req.session.username : '',
            'login': req.session.login == '1' ? true : false,
            'active': 'userList',
            'allUser': result
        });
    })
}

exports.showRegist = function (req, res, next) {
    res.render('regist',{
       'login': req.session.login == '1' ? true : false,
        'usernmae': req.session.login == '1' ? req.session.username : '',
        'active': 'regist'
    });
}

exports.doRegist = function (req, res, next) {
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var username = fields.username;
        var password = fields.password;
        db.find('users', {'username': username}, function (err, result) {
            if (err) {
                res.send('-3');//服务器错误
                return;
            }
            if (result.length != 0) {
                req.send('-1');//用户名被占用
                return;
            }
            //无相同用户名，加密密码
            password = md5(md5(password) + 'Joker');
            //向数据库添加注册用户信息
            db.insertOne('uers', {
                'username': username,
                'password': password,
                'avatar': 'moren.jpg'
            }, function (err, result) {
                if (err) {
                    res.send('-3');//服务器错误
                    return;
                }
                req.session.login = '1';
                req.session.username = username;
                res.send('1'); //注册成功,写入session
            });
        });
    });
}

exports.showLogin = function (req, res, next) {
    res.render('login', {
       'login': req.session.login == '1' ? true : false,
        'username': req.session.login == '1' ? req.session.username : '',
        'active': 'login'
    });
}

exports.doLogin = function (req, res, next) {
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var username = fields.username;
        var password = fields.password;
        var encryption = md5(md5(password) + 'Joker');
        db.find('users', {'username': username}, function (err, result) {
            if (err) {
                res.send('-3');//服务器错误
                return;
            }
            if (result.length == 0) {
                res.send('-2');//用户不存在
                return;
            }

            if (encryption == result[0].password) {
                req.session.username = username;
                req.session.login = '1';
                res.send('1');//登陆成功，写入session
                return;
            } else {
                res.send('-1');//密码错误
                return;
            }
        });
    });
}

exports.setAvatar = function (req, res, next) {
    if (req.session.login != '1') {
        res.end('请登录！');
        return;
    }
    res.render('setAvatar', {
        'username': req.session.username || 'nobody',
        'login':  true,
        'active': 'setAvatar'
    });
}

exports.doSetAvatar = function (req, res, next) {
    if (req.session.login != '1') {
        res.end('请登录！');
        return;
    }
    var form = new formidable.IncomingForm();
    form.uploadDir = path.normalize(__dirname + '/../avatar');
    form.parse(req, function(err, fields, files) {
        //console.log(files);
        var oldPath = files.avatar.path;
        var newPath = form.uploadDir + '/' + req.session.username + '.jpg';
        fs.rename(oldPath, newPath, function (err) {
            if (err) {
                res.send('失败');
                return;
            }
            req.session.avatar = req.session.username + '.jpg';
            res.redirect('/cut');
        });
    });
}

exports.showCut = function (req, res, next) {
    if (req.session.login != '1') {
        res.end('请登录！');
        return;
    }
    res.render('cut', {
        'username': req.session.username,
        'login': true,
        'avatar': req.session.avatar,
        'active':'cut'
    });
}

exports.doCut = function (req, res, next) {
    if (req.session.login != '1') {
        res.end('请登录！');
        return;
    }
    var avatar = req.session.avatar;
    var w = req.query.w;
    var h = req.query.h;
    var x = req.query.x;
    var y =req.query.y;
    gm('./avatar/' + avatar)
    .crop(w, h, x, y)
    .resize(100, 100, '!')
    .write('./avatar/' + avatar , function (err) {
        if (err) {
            res.send('-1');
            return;
        }
        db.updateMany('users', {'username': req.session.username}, {
            $set:{'avatar': avatar}
        }, function (err ,result) {
            res.send('1');
        });
    });
}


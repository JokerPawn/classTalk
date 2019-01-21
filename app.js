var express = require('express');
var app = express();
var router = require('./controller/router.js');
var session = require('express-session');

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

app.set('view engine', 'ejs');

app.use(express.static('./public'));
app.use('/avatar', express.static('./avatar'));

app.get('/', router.showIndex);
app.get('/regist', router.showRegist);
app.post('/doRegist', router.doRegist);
app.get('/login', router.showLogin);
app.post('doLogin', router.doLogin);
app.get('/cut', router.showCut);
app.post('doCut', router.doCut);
app.get('/setAvatar', router.setAvatar);
app.post('/doSetAvatar', router.doSetAvatar);
app.get('/user/:user', router.showUser);
app.get('/user/:_id', router.showUser);
app.get('/userList', router.showUserList);
app.post('/post', router.doPost);
app.get('/getAllTalk', router.getAllTalk);
app.get('/getUserInfo', router.getUserInfo);
app.get('/getTalkAmount', router.getTalkAmount);

app.listen(3000);


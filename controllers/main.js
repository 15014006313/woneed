const data = require('../data/data').data;
const user = data.user;

var view_index = async (ctx, next) => {
    ctx.render('index.html', {
        title: '首页'
    });
};
var view_wechat_hall = async (ctx, next) => {
    ctx.render('wechat_hall.html', {
        title: '大厅'
    });
};
var view_wechat = async (ctx, next) => {
    ctx.render('wechat.html', {
        title: '聊天室'
    });
};
var view_chess = async (ctx, next) => {
    ctx.render('game/chess.html', {
        title: ''
    });
};
var view_room = async (ctx, next) => {
    ctx.render('game/room.html', {
        title: ''
    });
};

var api_signin = async (ctx, next) => {
    var
        name = ctx.request.body.name || '',
        password = ctx.request.body.password || '';
    console.log(`signin with name: ${name}, password: ${password}`);
    if (name === 'koa' && password === '12345') {
        ctx.response.body = `<h1>Welcome, ${name}!</h1>`;
    } else {
        ctx.response.body = `<h1>Login failed!</h1>
        <p><a href="/">Try again</a></p>`;
    }
};

var api_hello = async (ctx, next) => {
    ctx.response.body = `<h1>Hello, ${name}!</h1>`;
};


module.exports = {
    'GET /': view_index,
    'GET /chess.html': view_chess,
    'GET /room.html': view_room,
    'GET /wechat.html': view_wechat,
    'GET /wechat_hall.html': view_wechat_hall,
    'POST /signin': api_signin,
    'GET /hello/:name': api_hello
};
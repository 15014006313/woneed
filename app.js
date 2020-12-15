const staticFiles = require("./static-files");

const Koa = require("koa");
const router = require('koa-router')();
const bodyparser = require('koa-bodyparser');
const controller = require('./controller');
const templating = require('./templating');
require('./websocket/websocket-chess');
const isProduction = process.env.NODE_ENV === 'production';

const app = new Koa();

app.use(async (ctx, next) => {
    console.log(`Process ${ctx.request.method} ${ctx.request.url}...`);
    var start = new Date().getTime(), execTime;
    await next();
    execTime = new Date().getTime() - start;
    ctx.response.set('X-Response-Time', `${execTime}ms`);
});

if (!isProduction) {
    staticFile = require('./static-files')
    app.use(staticFiles('/static/', __dirname + '/static'));
}
app.use(bodyparser());

app.use(templating('views', {
    noCache: !isProduction,
    watch: !isProduction
}));

app.use(controller());

app.listen(3000);
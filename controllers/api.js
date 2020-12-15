const data = require('../data/data').data;
const user = data.user;
const url = require('url');
const querystring = require('querystring');

var api_get_users = async (ctx, next) => {
    let userList = [];
    var arg = url.parse(ctx.url).query;
    var params = querystring.parse(arg);
    if (params.age != undefined) {
        userList = await user.findAll({
            where: {
                age: params.age
            }
        });
    } else {
        userList = await user.findAll();
    }
    ctx.response.type = 'application/json';
    ctx.response.body = userList;
};
module.exports = {
    'GET /api/getUsers': api_get_users
};
const { resolveNaptr } = require("mz/dns");
const ws = require("nodejs-websocket");
let chatUsers = [];
var sever = ws.createServer(function (connect) {
    connect.on("text", function (str) {
        const data = JSON.parse(str);
        switch (data.type) {
            case 'setName':
                connect.type = 'addRoom';
                connect.room = data.room;
                connect.nickname = data.nickname;
                boardcast({
                    room: data.room,
                    name: connect.nickname,
                    type: 'serverInformation',
                    message: data.nickname + "进入房间",
                }, sever);
                boardcast({
                    room: data.room,
                    type: 'chatterList',
                    list: getAllChatter(data.room, sever)
                }, sever);
                break;
            case 'chat':
                connect.type = 'sendMsg';
                boardcast({
                    type: 'chat',
                    room: data.room,
                    name: connect.nickname,
                    message: data.message
                }, sever);
                break;
            case 'hall':
                connect.type = 'wechatHall';
                boardcast({
                    room: data.room,
                    type: 'chatterList',
                    list: getAllChatter('wechat_hall', sever)
                }, sever);
                break;
            default:
                break;
        }
    });
    connect.on('close', () => {
        //离开房间
        console.log(connect);
        boardcast(JSON.stringify({
            type: 'leave',
            room: connect.room,
            message: connect.nickname + '离开房间'
        }), sever);

        //从在线聊天的人数上面除去
        boardcast(JSON.stringify({
            type: 'chatterList',
            room: connect.room,
            list: getAllChatter(connect.room, sever)
        }), sever)
    });
    connect.on('error', function (code) {
        console.log('异常：', code);
    });
}).listen(3366);

const boardcast = (str, sever) => {
    console.log(str);
    sever.connections.forEach((connect) => {
        if (connect.type == 'wechatHall') {
            connect.sendText(JSON.stringify({
                type: 'chatterList',
                list: getAllChatter('wechat_hall', sever)
            }))
        }else{
            if (str.room == connect.room) {
                if (str.type == 'leave' && str.nickname != connect.nickname) {
                    connect.sendText(JSON.stringify(str))
                }
                else {
                    connect.sendText(JSON.stringify(str))
                }
            }
        }
    })
};
const getAllChatter = (room, sever) => {
    let chartterArr = [];
    sever.connections.forEach((connect) => {
        if (room == 'wechat_hall') {
            if (connect.type == 'addRoom') {
                chartterArr.push({ name: connect.nickname, room: connect.room })
            }
        } else {
            if (room == connect.room) {
                chartterArr.push({ name: connect.nickname, room: connect.room })
            }
        }
    });
    return chartterArr;
};

module.exports = sever;
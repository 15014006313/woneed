const { resolveNaptr } = require("mz/dns");
const ws = require("nodejs-websocket");
const ChessGame = require("../method/chess");

let chessGame = new ChessGame();
//通讯连接类型枚举
const connEnum = {
    HALL: 'hall',           //大厅
    USERADD: 'userAdd',     //用户进入房间
    ROOMLIST: 'roomList',   //房间列表
    STEP: 'gameStep',       //用户落子
    READY: 'ready'          //用户准备
}, userEnum = { WATCHER: 'watcher', PLAYER: 'player' };

//创建服务
var sever = ws.createServer(function (connect) {
    connect.on("text", function (str) {
        //接收数据并转为JSON格式
        const data = JSON.parse(str),
            room = data.room,
            user = { id: data.id, nickname: data.nickname };
        let game = chessGame.get(room);
        console.log(`${data.type}房间动态`);
        if (data.type != connEnum.HALL && game == undefined) return;
        switch (data.type) {
            case connEnum.HALL:
                /**********大厅**********/
                //配置连接信息
                connect.info = {
                    type: connEnum.HALL
                };
                boardcast({ ...connect.info }, sever);
                break;
            case connEnum.USERADD:
                /**********加入房间**********/
                //配置连接信息
                connect.info = {
                    type: connEnum.USERADD,
                    id: data.id,    //用户id
                    room: data.room,    //房间号
                    nickname: data.nickname,    //昵称
                    status: userEnum.WATCHER    //身份标识
                };
                //判断房间是否存在, 若不存在初始化棋局
                if (!chessGame.has(room)) break;
                //判断用户身份，选手or观战
                if (chessGame.isLackUser(room))
                    connect.info.status = chessGame.gameAddUser(room, user) ? userEnum.PLAYER : userEnum.WATCHER;
                //调用通讯方法
                boardcast({
                    ...connect.info,
                    chess: game,
                    message: data.nickname + "进入房间"
                }, sever);
                boardcast({
                    room: room,
                    type: connEnum.ROOMLIST,
                    list: getUserList(room, sever)
                }, sever);
                break;
            case 'step':
                /**********落子**********/
                //配置连接类型
                connect.type = connEnum.STEP;
                //检测是否允许落子
                let cs = chessGame.addPiece(room, user, { x: data.x, y: data.y });
                //初始化通讯内容
                let res = {
                    ...connect.info,
                    chess: game
                }
                switch (cs) {
                    case 0:
                        //棋局已结束
                        res.code = '201'
                        res.message = '棋局已结束';
                        break;
                    case 1:
                        //当前坐标易落子
                        res.code = '202'
                        res.message = '当前坐标已落子';
                        break;
                    case 2:
                        //成功
                        res.code = '200'
                        let gameRes = chessGame.checkChessGame(room);
                        if (gameRes == 0) {
                            res.message = '新落子';
                        } else {
                            res.message = '游戏结束';
                            res.winner = game.players.find(item => item.code == gameRes);
                        }
                        break
                    case 3:
                        //非选手无法操作
                        res.code = '203'
                        res.message = '非选手无法操作';
                        break;
                    case 4:
                        //非当前选手执棋
                        res.code = '204'
                        res.message = '非当前选手执棋';
                        break;
                    default:
                        break;
                }
                boardcast(res, sever);
                break;
            case 'ready':
                if (chessGame.playerReady(room, user.id)) {
                    boardcast({
                        type: connEnum.READY,
                        ...connect.info,
                        chess: game,
                        message: `${user.nickname}已准备`
                    }, sever);
                }
                break;
            default:
                break;
        }
    });
    connect.on('close', (conn) => {
        /**********断开连接**********/
        //离开房间
        console.log(`离开房间`);
        console.log(conn);
        boardcast(JSON.stringify({
            type: 'leave',
            room: 123,
            message: '离开房间'
        }), sever);

        //从在线聊天的人数上面除去
        boardcast(JSON.stringify({
            type: connEnum.ROOMLIST,
            room: 123,
            list: []
        }), sever)
    });
    connect.on('error', function (code) {
        console.log('异常：', code);
    });
}).listen(7777);
const boardcast = (str, sever) => {
    console.log(`-------消息体---start-------`);
    console.log(str);
    console.log(`-------消息体----end--------`);
    //遍历所有连接，给指定房间内的所有用户发生消息
    sever.connections.forEach((connect) => {
        if (str.type == connEnum.HALL) {
            if (connect.info.type == connEnum.HALL) {
                connect.sendText(JSON.stringify({ type: connEnum.HALL, rooms: chessGame.getRoomListData() }));
            }
        } else {
            if((str.type == connEnum.USERADD && connect.info.type == connEnum.HALL)){
                connect.sendText(JSON.stringify({ type: connEnum.HALL, rooms: chessGame.getRoomListData() }));
            }
            if (str.room == connect.info.room) {
                connect.sendText(JSON.stringify(str));
            }
        }
    });
};
//获取当前房间的所有用户
const getUserList = (room, sever) => {
    let chartterArr = [];
    //遍历所有连接，获取房间内的所有用户
    sever.connections.forEach((connect) => {
        if (room == connect.info.room) {
            chartterArr.push({ name: connect.info.nickname, room: connect.info.room })
        }
    });
    return chartterArr;
};

module.exports = sever;
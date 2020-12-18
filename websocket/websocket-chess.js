const { resolveNaptr } = require("mz/dns");
const ws = require("nodejs-websocket");
//初始化棋盘数据
let initChessBoard = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];
//存储所有棋盘数据
let chessGame = { '666': initChessBoard }, 
//通讯连接类型枚举
connTypeEnum = { userAddRoom: 'userAddRoom', serverInformation: 'serverInformation', chatterList: 'chatterList', gameStep: 'gameStep' };

//创建服务
var sever = ws.createServer(function (connect) {
    connect.on("text", function (str) {
        //接收数据并转为JSON格式
        const data = JSON.parse(str);
        switch (data.type) {
            case 'join':
                //加入房间

                //判断房间是否初始化
                if (chessGame[data.room] == undefined) {
                    //初始化棋局，并存储
                    chessGame[data.room] = { alive: true, chessBoard: initChessBoard, players: [], current: 0 };
                }
                //判断用户身份，选手or观战
                if (chessGame[data.room].players.length < 2 && chessGame[data.room].players.indexOf(data.id) == -1) {
                    chessGame[data.room].players.push(data.id);
                }

                //配置连接信息
                connect.info = {
                    type: connTypeEnum.userAddRoom,
                    id: data.id,
                    room: data.room,
                    nickname: data.nickname
                };

                //调用通讯方法
                boardcast({
                    ...connect.info,
                    current: chessGame[data.room].players[chessGame[data.room].current],
                    chess: chessGame[data.room],
                    message: data.nickname + "进入房间"
                }, sever);
                boardcast({
                    room: data.room,
                    type: connTypeEnum.chatterList,
                    list: getAllChatter(data.room, sever)
                }, sever);
                break;
            case 'step':
                //落子

                //配置连接类型
                connect.type = connTypeEnum.gameStep;
                //检测是否允许落子
                let cs = checkStep(data);
                //初始化通讯内容
                let res = {
                    ...connect.info,
                    chess: chessGame[data.room]
                }
                switch (cs) {
                    case 0:
                        //棋局已结束
                        res.message = '棋局已结束';
                        break;
                    case 1:
                        //当前坐标易落子
                        res.message = '当前坐标已落子';
                        break;
                    case 2:
                        //成功
                        let i = checkBoard(data.room);
                        if (i == 0) {
                            res.message = '新落子';
                            res.current = chessGame[data.room].players[chessGame[data.room].current];
                        } else if (i == 'A') {
                            res.message = '游戏结束';
                            res.winner = chessGame[data.room].players[0];
                        } else if (i == 'B') {
                            res.message = '游戏结束';
                            res.winner = chessGame[data.room].players[1];
                        }
                        break
                    case 3:
                        //非选手无法操作
                        res.message = '非选手无法操作';
                        break;
                    case 4:
                        //非当前选手执棋
                        res.message = '非当前选手执棋';
                        break;
                    default:
                        break;
                }
                boardcast(res, sever);
                break;
            default:
                break;
        }
    });
    connect.on('close', () => {
        //离开房间
        console.log(`${connect.info.nickname}离开${connect.info.room}房间`);
        boardcast(JSON.stringify({
            type: 'leave',
            room: connect.info.room,
            message: connect.info.nickname + '离开房间'
        }), sever);

        //从在线聊天的人数上面除去
        boardcast(JSON.stringify({
            type: connTypeEnum.chatterList,
            room: connect.info.room,
            list: getAllChatter(connect.info.room, sever)
        }), sever)
    });
    connect.on('error', function (code) {
        console.log('异常：', code);
    });
}).listen(7777);
//检测棋子合法性
const checkStep = (data) => {
    if (!chessGame[data.room].alive) return 0;
    let players = chessGame[data.room].players,
        current = chessGame[data.room].current,
        chessBoard = chessGame[data.room].chessBoard;
    if (players[current] != data.id) return 4;
    let index = players.indexOf(data.id);
    if (index > -1) {
        if (chessBoard[data.x][data.y] != 0) {
            console.log("当前位置已落子"); return 1;
        }
        chessBoard[data.x][data.y] = players.indexOf(data.id) == 0 ? 'A' : 'B';
        chessGame[data.room].current = current == 0 ? 1 : 0;
        return 2;
    }
    return 3;
}
//检测棋局是否结束
const checkBoard = (room) => {
    const grid = chessGame[room].chessBoard;
    for (var i = 0; i < grid.length; i++) {
        for (var j = 0; j < grid.length; j++) {
            var row = i, col = j, rowflag = 1, colflag = 1, skewflag = 1, skewflag2 = 1;
            if (grid[row][col] != 0) {
                if (col <= grid.length - 4) {
                    while (rowflag < 5) {
                        //循环检测横向
                        if (grid[row][col] == grid[row][col + rowflag]) {
                            rowflag++;
                        } else {
                            rowflag = 99;
                        }
                    }
                }
                if (row <= grid.length - 4) {
                    while (colflag < 5) {
                        //循环检测竖向
                        if (grid[row][col] == grid[row + colflag][col]) {
                            colflag++;
                        } else {
                            colflag = 99;
                        }
                    }
                    if (col <= grid.length - 4) {
                        while (skewflag < 5) {
                            //循环检测右斜向下
                            if (grid[row][col] == grid[row + skewflag][col + skewflag]) {
                                skewflag++;
                            } else {
                                skewflag = 99;
                            }
                        }
                    }
                }
                if (row >= 4 && col <= grid.length - 4) {
                    while (skewflag2 < 5) {
                        //循环检测右斜向上
                        if (grid[row][col] == grid[row - skewflag2][col + skewflag2]) {
                            skewflag2++;
                        } else {
                            skewflag2 = 99;
                        }
                    }
                }
            }
            if (rowflag == 5 || colflag == 5 || skewflag == 5 || skewflag2 == 5) {
                chessGame[room].alive = false;
                return grid[row][col];
            }
        }
    }
    return 0;
}
const boardcast = (str, sever) => {
    console.log(`-------消息体---start-------`);
    console.log(str);
    console.log(`-------消息体----end--------`);
    //遍历所有连接，给指定房间内的所有用户发生消息
    sever.connections.forEach((connect) => {
        if (str.room == connect.info.room) {
            connect.sendText(JSON.stringify(str));
        }
    })
};
//获取当前房间的所有用户
const getAllChatter = (room, sever) => {
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
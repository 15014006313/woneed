const { resolveNaptr } = require("mz/dns");
const ws = require("nodejs-websocket");
let chessGame = {}, connTypeEnum = { userAddRoom: 'userAddRoom', serverInformation: 'serverInformation', chatterList: 'chatterList', gameStep: 'gameStep' };
let initChess = [
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
var sever = ws.createServer(function (connect) {
    connect.on("text", function (str) {
        const data = JSON.parse(str);
        switch (data.type) {
            case 'join':
                if (chessGame[data.room] == undefined) {
                    chessGame[data.room] = { alive: true, chessBoard: initChess, players: [], current: 0 };
                }
                if (chessGame[data.room].players.length < 2) {
                    chessGame[data.room].players.push(data.id);
                }
                connect.info = {
                    type: connTypeEnum.userAddRoom,
                    id: data.id,
                    room: data.room,
                    nickname: data.nickname
                };
                boardcast({
                    ...connect.info,
                    current: chessGame[data.room].players[chessGame[data.room].current],
                    message: data.nickname + "进入房间"
                }, sever);
                boardcast({
                    room: data.room,
                    type: connTypeEnum.chatterList,
                    list: getAllChatter(data.room, sever)
                }, sever);
                break;
            case 'step':
                connect.type = connTypeEnum.gameStep;
                let cs = checkStep(data);
                switch (cs) {
                    case 0:
                        //棋局已结束
                        console.log("棋局已结束");
                        break;
                    case 1:
                        //当前坐标易落子
                        console.log("当前坐标易落子");
                        break;
                    case 2:
                        //成功
                        let res = {
                            ...connect.info,
                            message: '新落子'
                        }, i = checkBoard(data.room);
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
                        boardcast(res, sever); break
                    case 3:
                        //非选手无法操作
                        console.log("非选手无法操作");
                        break;
                    case 4:
                        //非当前选手执棋
                        console.log("非当前选手执棋");
                        break;
                    default:
                        break;
                }
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
            type: connTypeEnum.chatterList,
            room: connect.room,
            list: getAllChatter(connect.room, sever)
        }), sever)
    });
    connect.on('error', function (code) {
        console.log('异常：', code);
    });
}).listen(7777);
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
const isPlayer = (sever) => {
    let players = sever.connections.filter(item => item.type != "watch");
    return players.length < 2;
}
const boardcast = (str, sever) => {
    console.log(str);
    sever.connections.forEach((connect) => {
        if (connect.info.type == 'wechatHall') {
            connect.sendText(JSON.stringify({
                type: 'chatterList',
                list: getAllChatter('wechat_hall', sever)
            }))
        } else {
            if (str.room == connect.info.room) {
                let data = str.type == connTypeEnum.chatterList ? str : { ...str, chess: chessGame[str.room] }
                connect.sendText(JSON.stringify(data));
            }
        }
    })
};
const getAllChatter = (room, sever) => {
    let chartterArr = [];
    sever.connections.forEach((connect) => {
        if (room == 'wechat_hall') {
            if (connect.info.type == connTypeEnum.userAddRoom) {
                chartterArr.push({ name: connect.info.nickname, room: connect.info.room })
            }
        } else {
            if (room == connect.info.room) {
                chartterArr.push({ name: connect.info.nickname, room: connect.info.room })
            }
        }
    });
    return chartterArr;
};

module.exports = sever;
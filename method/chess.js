class ChessGame {
    constructor() {
        this.games = {};
        //用户状态，等待/已准备
        this.playerEnum = { WAITING: 'waiting', READY: 'ready', GAMEING: 'gameing' }
        this.roomList = ['000', '111', '222', '333', '444', '555', '666', '777', '888', '999'];
        this.initRoom();
    }
    //获取所有房间信息
    getRoomListData() {
        return Object.keys(this.games).map(item => { return { room: item, players: this.games[item].players, alive: this.games[item].alive } });
    }
    initRoom() {
        for (let room of this.roomList) {
            this.games[room] = new GameRoom();
        }
    }
    //重置游戏
    ResetGame(room) {
        let game = this.games[room];
        if (game == undefined) return;
        game.chessBoard = new ChessBoard();
        game.alive = false;
        game.players[0].status = players.WAITING;
        game.players[1].status = players.WAITING;
    }
    //用户准备
    playerReady(room, userid) {
        let game = this.games[room];
        if (game == undefined) return false;
        for (let player of game.players) {
            if (player.id == userid) {
                player.status = this.playerEnum.READY;
                this.checkBegan(room);
                return true;
            }
        }
    }
    //用户取消准备
    playerCancelReady(room, userid) {
        let game = this.games[room];
        if (game == undefined) return false;
        if (game.alive) return false;
        for (let player of game.players) {
            if (player.id == userid) {
                player.status = this.playerEnum.WAITING;
                return true;
            }
        }
        return this.checkBegan(room);
    }
    //判断是否开始
    checkBegan(room) {
        let game = this.games[room];
        if (game == undefined) return false;
        if (game.players.length == 2 && game.players.every(item => item.status == this.playerEnum.READY)) {
            game.alive = true;
            game.current = 0;
            game.player[0].status = this.playerEnum.GAMEING;
            game.player[1].status = this.playerEnum.GAMEING;
            game.chessBoard = new ChessBoard();
            return true;
        }
        return false
    }
    //根据房间号判断房间是否存在
    has(room) {
        return this.games[room] != undefined;
    }
    //根据房间号获取房间信息
    get(room) {
        return this.games[room];
    }
    isLackUser(room) {
        return this.games[room].players.length < 2;
    }
    //检测落子
    addPiece(room, user, coor) {
        //codeMsg = ['棋局未开始', '目标位置已存在棋子', '落子成功', '用户非执棋用户']
        let game = this.games[room];
        //判断棋局是否结束
        if (!game.alive) return 0;
        //判断用户是否当前执棋用户
        if (game.players[game.current].id != user.id) return 3;
        //判断目标位置是否允许落子
        if (game.chessBoard[coor.x][coor.y] != 0) return 1;
        //落子
        game.chessBoard[coor.x][coor.y] = game.players[game.current].code;
        game.current = game.current == 0 ? 1 : 0;
        return 2;
    }
    //检测棋局是否结束，0：未结束/A：黑方赢/B：白方赢
    checkChessGame(room) {
        let game = this.games[room];
        const grid = game.chessBoard;
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
                    //胜负已分，修改棋局状态
                    game.alive = false;
                    game.players[0].status = this.playerEnum.WAITING;
                    game.players[1].status = this.playerEnum.WAITING;
                    return grid[row][col];
                }
            }
        }
        return 0;
    }
    //根据房间号初始化房间
    newGame(room) {
        this.games[room] = new GameRoom();
    }

    //用户加入房间
    gameAddUser(room, user) {
        let game = this.games[room];
        if (game.players.length < 2) {
            if (!game.players.some(item => item.id == user.id))
                game.players.push({ ...user, 'code': game.players.length == 0 ? 'A' : 'B', 'status': this.playerEnum.WAITING });
            this.checkBegan(room);
            return true;
        }
        return false;
    }
    //用户退出房间
    quitGame(room, user) {
        let game = this.games[room];
        if (game.players.some(item => item.id == user.id))
            game.players = game.players.filter(item => item.id != user.id);
    }
}
//房间对象
class GameRoom {
    constructor() {
        return { 'alive': false, 'chessBoard': new ChessBoard(), 'current': -1, 'players': [] };
    }
}
//棋盘对象
class ChessBoard {
    constructor() {
        return [
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
    }
}

module.exports = ChessGame;
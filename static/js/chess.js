class Chess {
    constructor(arg) {
        this.grid = arg.grid || [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 'B']
        ];
        this.curPlayer = true;
        this.isAlive = true;
        this.cellSize = 35;
        this.boardSize = this.grid.length;
        this.chessmanSize = 15;
        this.player = { A: null, B: null };
        this.Board = document.querySelector(arg.id);
        this.Board.width = (this.boardSize + 1) * this.cellSize;
        this.Board.height = (this.boardSize + 1) * this.cellSize;
        this.dispatch = null;
        this.isMe = false;
        //绘画棋盘
        this.drawBoard();
        //添加事件监控
        this.playHandle();
    }
    //重绘棋盘
    reDrawBoard(grid = []) {
        if (grid.length == 0) return
        this.grid = grid;
        this.context.clearRect(0, 0, this.Board.width, this.Board.height);
        this.drawBoard();
    }
    //初始化棋盘
    drawBoard() {
        this.context = this.Board.getContext("2d");
        for (var i = 0; i < this.boardSize; i++) {
            this.context.beginPath();
            this.context.moveTo(i * this.cellSize + this.cellSize, this.cellSize);
            this.context.lineTo(i * this.cellSize + this.cellSize, this.boardSize * this.cellSize);

            this.context.moveTo(this.cellSize, i * this.cellSize + this.cellSize);
            this.context.lineTo(this.boardSize * this.cellSize, i * this.cellSize + this.cellSize);
            this.context.strokeStyle = "#dfdfdf";
            this.context.stroke();
            for (var j = 0; j < this.boardSize; j++) {
                if (this.grid[i][j] != 0) {
                    this.drawChess(j + 1, i + 1, this.grid[i][j] == 'A');
                }
            }
        }
    }
    //点击事件监听
    playHandle() {
        this.Board.addEventListener("mousedown", (e) => {
            if (!this.isAlive) {
                console.log("胜负已分！"); return;
            }
            if (!this.isMe) {
                console.log("对手执棋"); return;
            }
            var cRect = this.Board.getBoundingClientRect();
            var canvasX = Math.round(e.clientX - cRect.left);
            var canvasY = Math.round(e.clientY - cRect.top);
            var x = Math.floor(canvasX / this.cellSize), y = Math.floor(canvasY / this.cellSize);
            if (canvasX % this.cellSize < this.chessmanSize) {
                if (canvasY % this.cellSize < this.chessmanSize) {
                    this.checkStep(x, y, this.curPlayer);
                } else if (this.cellSize - canvasY % this.cellSize < this.chessmanSize) {
                    this.checkStep(x, y + 1, this.curPlayer);
                }
            } else if (this.cellSize - canvasX % this.cellSize < this.chessmanSize) {
                if (canvasY % this.cellSize < this.chessmanSize) {
                    this.checkStep(x + 1, y, this.curPlayer);
                } else if (this.cellSize - canvasY % this.cellSize < this.chessmanSize) {
                    this.checkStep(x + 1, y + 1, this.curPlayer);
                }
            }
        });
    }
    checkStep(x, y, f) {
        if (x == 0 || y == 0 || x == this.boardSize + 2 || y == this.boardSize + 2) {
            return false;
        }
        if (this.grid[y - 1][x - 1] != 0) {
            console.log("当前位置已落子"); return;
        }
        //判断允许落子，绘画棋子
        this.drawChess(x, y, f);
        if (typeof this.dispatch === 'function')
            this.dispatch({ x: y - 1, y: x - 1 });
        this.isMe = false;
        this.grid[y - 1][x - 1] = this.curPlayer ? "A" : "B";
        //this.curPlayer = !this.curPlayer;
        this.checkBoard();
    }
    //绘画棋子
    drawChess(x, y, f) {
        // this.context.globalCompositeOperation = "destination-over";
        this.context.beginPath();
        this.context.arc(x * this.cellSize, y * this.cellSize, this.chessmanSize, 0, 2 * Math.PI);
        this.context.closePath();
        var gradient = this.context.createRadialGradient(x * this.cellSize + 2, y * this.cellSize - 2, this.chessmanSize, x * this.cellSize + 2, y * this.cellSize - 2, 0);
        if (f) {
            gradient.addColorStop(0, "#0A0A0A");
            gradient.addColorStop(1, "#636766");
        } else {
            gradient.addColorStop(0, "#D1D1D1");
            gradient.addColorStop(1, "#F9F9F9");
        }
        this.context.fillStyle = gradient;
        this.context.fill();
    }
    //检测游戏是否结束
    checkBoard() {
        for (var i = 0; i < this.grid.length; i++) {
            for (var j = 0; j < this.grid.length; j++) {
                var row = i, col = j, rowflag = 1, colflag = 1, skewflag = 1, skewflag2 = 1;
                if (this.grid[row][col] != 0) {
                    if (col <= this.grid.length - 4) {
                        while (rowflag < 5) {
                            //循环检测横向
                            if (this.grid[row][col] == this.grid[row][col + rowflag]) {
                                rowflag++;
                            } else {
                                rowflag = 99;
                            }
                        }
                    }
                    if (row <= this.grid.length - 4) {
                        while (colflag < 5) {
                            //循环检测竖向
                            if (this.grid[row][col] == this.grid[row + colflag][col]) {
                                colflag++;
                            } else {
                                colflag = 99;
                            }
                        }
                        if (col <= this.grid.length - 4) {
                            while (skewflag < 5) {
                                //循环检测右斜向下
                                if (this.grid[row][col] == this.grid[row + skewflag][col + skewflag]) {
                                    skewflag++;
                                } else {
                                    skewflag = 99;
                                }
                            }
                        }
                    }
                    if (row >= 4 && col <= this.grid.length - 4) {
                        while (skewflag2 < 5) {
                            //循环检测右斜向上
                            if (this.grid[row][col] == this.grid[row - skewflag2][col + skewflag2]) {
                                skewflag2++;
                            } else {
                                skewflag2 = 99;
                            }
                        }
                    }
                }
                if (rowflag == 5 || colflag == 5 || skewflag == 5 || skewflag2 == 5) {
                    document.querySelector("#tips").innerHTML = this.grid[row][col] == "B" ? "游戏结束，白方胜出" : "游戏结束，黑方胜出";
                    console.log(this.grid[row][col] == "B" ? "白方胜出" : "黑方胜出"); this.isAlive = false; break;
                }
            }
            if (!this.isAlive) { break; }
        }
    }
}
function Room(id) {
    this.id = id;
    this.player = [];
}


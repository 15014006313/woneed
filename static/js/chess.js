function Chess(arg) {
    this.grid = arg.grid || [
        ['A', 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 'B', 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
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
    this.drawBoard();
}
function Room(id) {
    this.id = id;
    this.player = [];
}
Chess.prototype = {
    drawBoard: function () {
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
                    this.drawChess(i + 1, j + 1, this.grid[i][j] == 'A');
                }
            }
        }
        this.Board.addEventListener("mousedown", (e) => {
            if (!this.isAlive) {
                console.log("胜负已分！"); return;
            }
            var cRect = this.Board.getBoundingClientRect();
            var canvasX = Math.round(e.clientX - cRect.left);
            var canvasY = Math.round(e.clientY - cRect.top);
            var x = Math.floor(canvasX / this.cellSize), y = Math.floor(canvasY / this.cellSize);
            if (canvasX % this.cellSize < this.chessmanSize) {
                if (canvasY % this.cellSize < this.chessmanSize) {
                    this.step(x, y, this.curPlayer);
                } else if (this.cellSize - canvasY % this.cellSize < this.chessmanSize) {
                    this.step(x, y + 1, this.curPlayer);
                }
            } else if (this.cellSize - canvasX % this.cellSize < this.chessmanSize) {
                if (canvasY % this.cellSize < this.chessmanSize) {
                    this.step(x + 1, y, this.curPlayer);
                } else if (this.cellSize - canvasY % this.cellSize < this.chessmanSize) {
                    this.step(x + 1, y + 1, this.curPlayer);
                }
            }
        });
    },
    step: function (x, y, f) {
        if (x == 0 || y == 0 || x == this.boardSize + 2 || y == this.boardSize + 2) {
            return false;
        }
        if (this.grid[y - 1][x - 1] != 0) {
            console.log("当前位置已落子"); return;
        }
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
        this.grid[y - 1][x - 1] = this.curPlayer ? "A" : "B";
        this.curPlayer = !this.curPlayer;
        console.log(x, y);
        this.checkBoard();
    },
    drawChess: function (x, y, f) {
        if (x == 0 || y == 0 || x == this.boardSize + 2 || y == this.boardSize + 2) {
            return false;
        }
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
    },
    checkBoard: function () {
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

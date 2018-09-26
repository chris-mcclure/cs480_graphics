/// <reference path="../library/gte/GTE.ts" />
/// <reference path="../library/fluxions/Utils.ts" />
/// <reference path="MyImageArray.ts" />

class MyTileMap {
    width = 0;
    height = 0;
    tileData: number[] = [];
    transform = Matrix4.makeIdentity();

    constructor() {
    }

    parseInputFile(data: string) {
        // do something with this string
        let tp = new TextParser(data);

        let count = 0;
        for (let tokens of tp.lines) {
            if (count == 0 && tokens.length == 2) {
                let cols = parseInt(tokens[0]);
                let rows = parseInt(tokens[1]);
                this.resize(cols, rows);
            } else {
                for (let i = 0; i < tokens.length; i++) {
                    let tileId = parseInt(tokens[i]);
                    this.setTile(i, count - 1, tileId);
                }
            }
            count++;
        }
    }

    resize(numCols: number, numRows: number) {
        this.tileData = [];
        this.tileData.length = numCols * numRows;
        for (let t of this.tileData) {
            t = -1;
        }
    }

    setTile(col: number, row: number, tileId: number) {
        if (col < 0 || row < 0 || col >= this.width || row >= this.height) return -1;
        const addr = row * this.width + col;
        this.tileData[addr] = tileId;
    }

    getTile(col: number, row: number): number {
        if (col < 0 || row < 0 || col >= this.width || row >= this.height) return -1;
        const addr = row * this.width + col;
        return this.tileData[addr];
    }
}
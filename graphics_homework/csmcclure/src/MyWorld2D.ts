/// <reference path="../library/fluxions/Utils.ts" />
/// <reference path="../library/fluxions/TextParser.ts" />
/// <reference path="../library/gte/GTE.ts" />
/// <reference path="MyEntity.ts" />
/// <reference path="MyTileMap.ts" />

class MyWorld2D {
    entities: MyEntity[] = [];
    tileMap = new MyTileMap();
    celSheet: MyImageArray;

    constructor(
        tileMapUrl: string,
        entityUrl: string,
        celSheetUrl: string,
        celWidth: number,
        celHeight: number) {
        let self = this;
        let tileMapLoader = new Utils.TextFileLoader(tileMapUrl, (data: string, name: string, parameter: number) => {
            self.parseTileMap(data);
        });
        let entityLoader = new Utils.TextFileLoader(entityUrl, (data: string, name: string, parameter: number) => {
            self.parseEntities(data);
        });
        this.celSheet = new MyImageArray(celSheetUrl, celWidth, celHeight);
    }

    parseTileMap(data: string) {
        this.tileMap.parseInputFile(data);
    }

    parseEntities(data: string) {
        let tp = new TextParser(data);

        let entityIndex = this.entities.length - 1;
        for (let tokens of tp.lines) {
            if (tokens[0] == "entity" && tokens.length >= 2) {
                this.entities.push(new MyEntity());
                entityIndex = this.entities.length - 1;
            }
            // set properties of most recent entity
            if (entityIndex < 0) continue;
            switch (tokens[0]) {
                case "transform":
                    this.entities[entityIndex].transform = TextParser.ParseMatrix(tokens);
                    break;
                case "translate":
                    let v = TextParser.ParseVector(tokens);
                    this.entities[entityIndex].transform.Translate(v.x, v.y, v.z);
                    break;
                case "alive":
                    if (tokens.length >= 2) {
                        this.entities[entityIndex].alive = parseInt(tokens[1]);
                    }
                    break;
                case "sprite":
                    if (tokens.length >= 3) {
                        this.entities[entityIndex].sprites = [];
                        for (let i = 1; i < tokens.length; i++) {
                            let id = parseInt(tokens[i]);
                            this.entities[entityIndex].sprites.push(id);
                        }
                    }
                    break;
            } // switch tokens
        } // for tokens
    }

    draw(gl: WebGLRenderingContext) {
        // draw tile sheet        
        // draw sprites
    }
}
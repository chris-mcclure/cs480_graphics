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
                this.entities[entityIndex].name = tokens[1];
            }
            // set properties of most recent entity
            if (entityIndex < 0) continue;
            let v = new Vector3();
            switch (tokens[0]) {
                case "transform":
                    this.entities[entityIndex].transform = TextParser.ParseMatrix(tokens);
                    break;
                case "translate":
                    v = TextParser.ParseVector(tokens);
                    this.entities[entityIndex].transform.Translate(v.x, v.y, v.z);
                    break;
                case "rotate":
                    v = TextParser.ParseVector(tokens);
                    this.entities[entityIndex].transform.Rotate(v.x, 0, 0, 1);
                    break;
                case "alive":
                    if (tokens.length >= 2) {
                        this.entities[entityIndex].alive = parseInt(tokens[1]);
                    }
                    break;
                case "sprites":
                    if (tokens.length >= 2) {
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

    renderCel(gl: WebGLRenderingContext, which: number, x: number, y: number, w: number, h: number) {
        this.celSheet.useTexture(gl, which, 0);
        let shape = new MyShape();

        shape.newSurface(gl.TRIANGLE_STRIP);

        let v0 = Vector2.make(x, y); // lower left
        let v1 = Vector2.make(x + w, y + h);   // upper right
        let st0 = Vector2.make(0.0, 0.0);  // lower left
        let st1 = Vector2.make(1.0, 1.0);  // upper right

        shape.color(1, 1, 1);
        shape.texCoord(st0.x, st1.y);
        shape.vertex(v0.x, v1.y, 0);
        shape.texCoord(st0.x, st0.y);
        shape.vertex(v0.x, v0.y, 0);
        shape.texCoord(st1.x, st1.y);
        shape.vertex(v1.x, v1.y, 0);
        shape.texCoord(st1.x, st0.y);
        shape.vertex(v1.x, v0.y, 0);

        shape.draw(gl, 0, this.colorIndex, this.texCoordIndex);
    }

    private colorIndex = 0;
    private texCoordIndex = 0;

    draw(gl: WebGLRenderingContext, worldMatrixLocation: WebGLUniformLocation, colorIndex: number, texCoordIndex: number, scaleX = 1, scaleY = 1) {
        if (!this.celSheet.loaded) return;
        const w = this.celSheet.subImageWidth;
        const h = this.celSheet.subImageHeight;

        this.texCoordIndex = texCoordIndex;
        this.colorIndex = colorIndex;

        // draw tile sheet
        gl.uniformMatrix4fv(worldMatrixLocation, false, this.tileMap.transform.toColMajorArray());
        for (let i = 0; i < this.tileMap.width; i++) {
            for (let j = 0; j < this.tileMap.height; j++) {
                let tileId = this.tileMap.getTile(i, j);
                if (tileId < 0) continue;
                this.renderCel(gl, tileId, i * w * scaleX, j * h * scaleY, w * scaleX, h * scaleY);
            }
        }

        // draw sprites
        for (let entity of this.entities) {
            if (entity.alive < 0) continue;
            let m = Matrix4.multiply(Matrix4.makeScale(scaleX, scaleY, 0.0), entity.transform);
            gl.uniformMatrix4fv(worldMatrixLocation, false, m.toColMajorArray());
            this.renderCel(gl, entity.sprites[0], 0, 0, w, h);
        }
    }
}
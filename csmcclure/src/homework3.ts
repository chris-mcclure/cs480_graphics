    function MyBezier(t: number,
    P0: Vector3,
    P1: Vector3,
    P2: Vector3,
    P3: Vector3): Vector3 {
    let one_minus_t = 1.0 - t;
    let one_minus_t_squared = one_minus_t * one_minus_t;
    let J3_0 = one_minus_t * one_minus_t_squared;
    let J3_1 = 3 * t * one_minus_t_squared;
    let J3_2 = 3 * t * t * one_minus_t;
    let J3_3 = t * t * t;
    return Vector3.make(
        P0.x * J3_0 + P1.x * J3_1 + P2.x * J3_2 + P3.x * J3_3,
        P0.y * J3_0 + P1.y * J3_1 + P2.y * J3_2 + P3.y * J3_3,
        P0.z * J3_0 + P1.z * J3_1 + P2.z * J3_2 + P3.z * J3_3
    );
}

class Homework3App {
    renderingContext: RenderingContext;
    scenegraph: Scenegraph;
    t0 = 0;
    t1 = 0;
    dt = 0;
    uiUpdateTime = 0;

    shaderProgram: null | WebGLProgram = null;
    aVertexLocation = -1;
    aTexCoordLocation = -1;
    aColorLocation = -1;
    uProjectionMatrixLocation: WebGLUniformLocation | null = null;
    uModelViewMatrixLocation: WebGLUniformLocation | null = null;
    uTextureMatrix: WebGLUniformLocation | null = null;
    uTextureMapLocation: WebGLUniformLocation | null = null;
    positionBuffer: WebGLBuffer | null = null;

    player1Texture: WebGLTexture | null = null;
    player2Texture: WebGLTexture | null = null;
    missile1Texture: WebGLTexture | null = null;
    missile2Texture: WebGLTexture | null = null;
    ballTexture: WebGLTexture | null = null;

    player1WorldMatrix = new Matrix4();
    player2WorldMatrix = new Matrix4();
    missile1WorldMatrix = new Matrix4();
    missile2WorldMatrix = new Matrix4();
    ballWorldMatrix = new Matrix4();

    whiteTexture: WebGLTexture | null = null;
    randomImage = new MyImage(64, 64, true);
    randomTexture: WebGLTexture | null = null;
    randomTextureMatrix = new Matrix4();
    spriteImage = new MyImage(8, 8, true);
    spriteTexture: WebGLTexture | null = null;
    spriteBuffer: WebGLBuffer | null = null;
    xhrSpriteSheetImage: HTMLImageElement | null = null;
    spriteSheetImage = new MyImage(0, 0, true);
    spriteSheetTexture: WebGLTexture | null = null;
    spriteSheetBuffer: WebGLBuffer | null = null;

    keysPressed: Map<string, boolean> = new Map<string, boolean>();

    constructor(public width: number = 512, public height: number = 384) {
        hflog.logElement = "log";
        width = Math.floor(document.body.clientWidth) | 0;
        height = Math.floor(width * 3.0 / 4.0) | 0;
        this.renderingContext = new RenderingContext(width, height, "app");
        width = this.renderingContext.width;
        height = this.renderingContext.height;
        if (!this.renderingContext) {
            throw "Unable to create rendering context.";
        }
        this.scenegraph = new Scenegraph(this.renderingContext);
    }

    run(): void {
        this.init();
        this.mainloop(0);
    }

    private init(): void {
        this.loadInput();
        this.loadShaders();
        this.loadScenegraph();
        this.loadTextures();
    }

    private loadInput(): void {
        //
        // This function is an example on how to add a keyboard handler to the main html window
        //
        // Notice the lambda functions to handle the event
        //
        // Notice how we capture the `this` pointer by assigning it to a local variable self which
        // can be used by the lambda functions

        let self = this;
        document.onkeydown = (e) => {
            e.preventDefault();
            self.keysPressed.set(e.key, true);
        };

        document.onkeyup = (e) => {
            e.preventDefault();
            self.keysPressed.set(e.key, false);
        };
    }

    private loadShaders(): void {
        let gl = this.renderingContext.gl;

        const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec4 aTexCoord;
        attribute vec4 aColor;

        varying vec2 vTexCoord;
        varying vec4 vColor;

        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        uniform mat4 uTextureMatrix;

        void main() {
            // multiply our 2 component vector with a 4x4 matrix and return resulting x, y
            vTexCoord = (uTextureMatrix * aTexCoord).xy;
            vColor = aColor;
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        }
        `;
        const vertexShader = this.loadShader(gl.VERTEX_SHADER, vsSource);

        const fsSource = `
        precision mediump float;
        uniform sampler2D uTextureMap;

        varying vec2 vTexCoord;
        varying vec4 vColor;

        void main() {
            gl_FragColor = vec4(vColor.rgb * texture2D(uTextureMap, vTexCoord).rgb, 1.0);
        }
        `;

        const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, fsSource);

        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            hflog.error("Unable to initialize shader program: " + gl.getProgramInfoLog(shaderProgram));
            this.shaderProgram = null;
        }

        this.shaderProgram = shaderProgram;

        this.aVertexLocation = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        this.aTexCoordLocation = gl.getAttribLocation(shaderProgram, 'aTexCoord');
        this.aColorLocation = gl.getAttribLocation(shaderProgram, 'aColor');
        this.uModelViewMatrixLocation = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix');
        this.uProjectionMatrixLocation = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');
        this.uTextureMatrix = gl.getUniformLocation(shaderProgram, 'uTextureMatrix');
        this.uTextureMapLocation = gl.getUniformLocation(shaderProgram, "uTextureMap");
    }

    private loadShader(type: number, source: string): null | WebGLShader {
        let gl = this.renderingContext.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            hflog.error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    private loadScenegraph(): void {
        let gl = this.renderingContext.gl;
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);

        let v0 = Vector2.make(-1.0, -1.0); // lower left
        let v1 = Vector2.make(1.0, 1.0);   // upper right
        let st0 = Vector2.make(0.0, 0.0);  // lower left
        let st1 = Vector2.make(1.0, 1.0);  // upper right
        const positionsTexCoords = [
            v0.x, v1.y, st0.x, st1.y,
            v0.x, v0.y, st0.x, st0.y,
            v1.x, v1.y, st1.x, st1.y,
            v1.x, v0.y, st1.x, st0.y];

        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positionsTexCoords),
            gl.STATIC_DRAW);
    }

    private createRectVertexBuffer(width: number, height: number): WebGLBuffer | null {
        let gl = this.renderingContext.gl;
        let buffer = gl.createBuffer();

        let v0 = Vector2.make(0, 0); // lower left
        let v1 = Vector2.make(width, height);   // upper right
        let st0 = Vector2.make(0.0, 0.0);  // lower left
        let st1 = Vector2.make(1.0, 1.0);  // upper right
        const positionsTexCoords = [
            v0.x, v1.y, st0.x, st1.y,
            v0.x, v0.y, st0.x, st0.y,
            v1.x, v1.y, st1.x, st1.y,
            v1.x, v0.y, st1.x, st0.y
        ];

        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positionsTexCoords),
            gl.DYNAMIC_DRAW);

        return buffer;
    }

    private loadTextures(): void {
        let gl = this.renderingContext.gl;

        let tmap = new ImageData(new Uint8ClampedArray([
            255, 255, 0, 255, 0, 0, 255, 255,
            0, 0, 255, 255, 255, 255, 0, 255
        ]), 2, 2);

        let texture = gl.createTexture();
        if (texture) {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tmap);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        this.whiteTexture = gl.createTexture();
        if (this.whiteTexture) {
            gl.bindTexture(gl.TEXTURE_2D, this.whiteTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
                new ImageData(new Uint8ClampedArray([255, 255, 255, 255]), 1, 1)
            );
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        // BEGIN XHR CODE
        // Task: Load image asynchronously to load sprite sheet
        // Problems to solve
        // * Image data cannot be directly read
        // * Image may not load
        // * Image is loaded asynchronously
        let self = this;
        this.xhrSpriteSheetImage = new Image();
        this.xhrSpriteSheetImage.addEventListener("load", (e) => {
            if (!self.xhrSpriteSheetImage) return;
            hflog.info('loaded ' + self.xhrSpriteSheetImage.src);
            // Step 1: Copy the image data out
            // we have to create a canvas with a '2d' context
            // then we draw our image into the canvas
            // then we copy the image data out
            let canvas = document.createElement("canvas");
            let context = canvas.getContext("2d");
            if (!context) return;
            let img = self.xhrSpriteSheetImage;
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);
            let data = context.getImageData(0, 0, img.width, img.height);

            // Step 2: the entire image into our MyImage class
            self.spriteSheetImage = new MyImage(img.width, img.height);
            for (let i = 0; i < data.data.length; i++) {
                self.spriteSheetImage.pixels[i] = data.data[i];
            }

            // Step 3: create the texture
            self.spriteSheetTexture = self.spriteSheetImage.createTexture(gl);
        });
        this.xhrSpriteSheetImage.src = "../assets/spritesheet.png";

        // END XHR CODE
    }

    private mainloop(timestamp: number): void {
        let self = this;
        this.t0 = this.t1;
        this.t1 = timestamp / 1000.0;
        this.dt = this.t1 - this.t0;
        if (timestamp - this.uiUpdateTime > 50) {
            this.uiUpdateTime = timestamp;
            this.updateUI();
        }
        if (this.dt < 1.0 / 30) {
            setTimeout(() => { }, 17);
        }
        window.requestAnimationFrame((t: number) => {
            self.update();
            self.display();
            self.displayUI();
            self.mainloop(t);
        });
    }

    private updateUI(): void {

    }

    private update(): void {
        // This is where we would handle user input
        let dx = 0;
        let dy = 0;
        const speed = 1;
        if (this.keysPressed.get("Left") || this.keysPressed.get("ArrowLeft")) {
            dx -= 1.0;
        }
        if (this.keysPressed.get("Right") || this.keysPressed.get("ArrowRight")) {
            dx += 1.0;
        }
        if (this.keysPressed.get("Up") || this.keysPressed.get("ArrowUp")) {
            dy -= 1.0;
        }
        if (this.keysPressed.get("Down") || this.keysPressed.get("ArrowDown")) {
            dy += 1.0;
        }
        if (this.keysPressed.get("r") || this.keysPressed.get("R")) {
            this.player1WorldMatrix.LoadIdentity();
            this.player2WorldMatrix.LoadIdentity();
        }
        this.player1WorldMatrix.Translate(dx * speed * this.dt, dy * speed * this.dt, 0.0);
        this.player2WorldMatrix.Translate(dx * 8 * speed * this.dt, dy * 8 * speed * this.dt, 0.0);

        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * (this.randomImage.width - 1);
            const y = Math.random() * (this.randomImage.height - 1);
            const color = new MyColor((Math.random() * 255) | 0, (Math.random() * 255) | 0, (Math.random() * 255) | 0, 255);
            this.randomImage.setPixel(x | 0, y | 0, color);
        }
        this.randomTextureMatrix.Rotate(this.dt * 20.0, 0.0, 0.0, 1.0);
    }

    private setupVertexArray(vertexBuffer: WebGLBuffer) {
        let gl = this.renderingContext.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        const numComponents = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 16;
        const positionOffset = 0;
        const texCoordOffset = 8;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        if (this.aVertexLocation >= 0) {
            gl.vertexAttribPointer(this.aVertexLocation,
                numComponents,
                type,
                normalize,
                stride,
                positionOffset);
            gl.enableVertexAttribArray(this.aVertexLocation);
        }
        if (this.aColorLocation >= 0) {
            gl.vertexAttrib4f(this.aColorLocation, 1.0, 1.0, 1.0, 1.0);
            gl.disableVertexAttribArray(this.aColorLocation);
        }
        if (this.aTexCoordLocation >= 0) {
            gl.vertexAttribPointer(this.aTexCoordLocation,
                numComponents,
                type,
                normalize,
                stride,
                texCoordOffset);
            gl.enableVertexAttribArray(this.aTexCoordLocation);
        }
    }

    private display(): void {
        let gl = this.renderingContext.gl;
        let sine = Math.sin(this.t1);
        gl.clearColor(sine * 0.1, sine * 0.0, sine * 0.05, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const fieldOfView = 45;// * Math.PI / 180;
        const aspect = this.renderingContext.aspectRatio;
        const zNear = 0.1;
        const zFar = 100.0;
        const projectionMatrix = Matrix4.makePerspectiveY(fieldOfView, aspect, zNear, zFar);
        const modelViewMatrix = Matrix4.makeTranslation(0.0, 0.0, -6.0).MultMatrix(this.player1WorldMatrix);

        this.randomTexture = this.randomImage.createTexture(gl, MyImageRepeatMode.MIRRORED_REPEAT, MyImageFilterMode.NEAREST);
        if (this.randomTexture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.randomTexture);
        }

        // set default color to white
        if (this.aColorLocation >= 0) {
            gl.vertexAttrib4f(this.aColorLocation, 1.0, 1.0, 1.0, 1.0);
        }

        // set up vertex array
        if (this.positionBuffer) {
            this.setupVertexArray(this.positionBuffer);
        }

        gl.useProgram(this.shaderProgram);
        if (this.uProjectionMatrixLocation)
            gl.uniformMatrix4fv(this.uProjectionMatrixLocation, false, projectionMatrix.toColMajorArray());
        if (this.uModelViewMatrixLocation)
            gl.uniformMatrix4fv(this.uModelViewMatrixLocation, false, modelViewMatrix.toColMajorArray());
        if (this.uTextureMatrix)
            gl.uniformMatrix4fv(this.uTextureMatrix, false, this.randomTextureMatrix.toColMajorArray());
        if (this.uTextureMapLocation)
            gl.uniform1i(this.uTextureMapLocation, 0);
        {
            let offset = 0;
            let vertexCount = 4;
            gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
        }
    }

    private displayUI() {
        let gl = this.renderingContext.gl;

        // Don't try to run this function if we do not have a sprite sheet
        if (!this.spriteSheetTexture) return;

        const projectionMatrix = Matrix4.makeOrtho2D(0, this.renderingContext.width, this.renderingContext.height, 0);
        const modelViewMatrix = Matrix4.makeTranslation(50, 50, 0);
        const textureMatrix = Matrix4.makeIdentity();

        this.spriteSheetBuffer = this.createRectVertexBuffer(8 * this.spriteSheetImage.width, 8 * this.spriteSheetImage.height);
        if (this.spriteSheetBuffer) {
            this.setupVertexArray(this.spriteSheetBuffer);
        }
        gl.bindTexture(gl.TEXTURE_2D, this.spriteSheetTexture);

        gl.useProgram(this.shaderProgram);
        if (this.uProjectionMatrixLocation)
            gl.uniformMatrix4fv(this.uProjectionMatrixLocation, false, projectionMatrix.toColMajorArray());
        if (this.uModelViewMatrixLocation)
            gl.uniformMatrix4fv(this.uModelViewMatrixLocation, false, modelViewMatrix.toColMajorArray());
        if (this.uTextureMatrix)
            gl.uniformMatrix4fv(this.uTextureMatrix, false, textureMatrix.toColMajorArray());
        if (this.uTextureMapLocation)
            gl.uniform1i(this.uTextureMapLocation, 0);
        {
            let offset = 0;
            let vertexCount = 4;
            gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
        }

        // copy a sprite from the sprite sheet
        MyImage.blit(
            this.spriteSheetImage,
            8, 8, 8, 8,
            this.spriteImage,
            0, 0, 8, 8
        );
        this.spriteTexture = this.spriteImage.createTexture(gl);
        this.spriteBuffer = this.createRectVertexBuffer(4 * this.spriteImage.width, 4 * this.spriteImage.height);
        if (this.spriteBuffer) {
            this.setupVertexArray(this.spriteBuffer);
        }
        gl.bindTexture(gl.TEXTURE_2D, this.spriteTexture);
        if (this.uModelViewMatrixLocation)
            gl.uniformMatrix4fv(this.uModelViewMatrixLocation, false, this.player2WorldMatrix.toColMajorArray());
        {
            let offset = 0;
            let vertexCount = 4;
            gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
        }

        let sine = 0.5 + 0.5 * Math.sin(this.t1);
        // Try the new display list out
        gl.bindTexture(gl.TEXTURE_2D, this.whiteTexture);
        let displayList = new MyDisplayList();
        displayList.newSurface(gl.LINES);
        displayList.color(1.0, 0.0, 0.0);
        displayList.vertex(0, (1.0 - sine) * this.height, 0);
        displayList.vertex(this.width, sine * this.height, 0);

        displayList.newSurface(gl.LINE_STRIP);
        displayList.color(1.0, 1.0, 0.0);
        const x = 0;
        const y = 0;
        const w = this.width;
        const h = this.height;
        const P0 = Vector3.make(x, y, 0);
        const P1 = Vector3.make(x, (1.0 - sine) * h, 0);
        const P2 = Vector3.make(0.25 * w, sine * h, 0);
        const P3 = Vector3.make(0.5 * w, 0.5 * h, 0);
        const P4 = Vector3.make(0.5 * w, sine * h, 0);
        const P5 = Vector3.make(0.75 * w, (1 - sine) * h, 0);;
        const P6 = Vector3.make(w, h, 0);
        {
            for (let t = 0.0; t <= 1.01; t += 0.01) {
                let P = MyBezier(t, P0, P1, P2, P3);
                displayList.vertex(P.x, P.y, P.z);
            }
        }
        displayList.newSurface(gl.LINE_STRIP);
        displayList.color(0.0, 1.0, 1.0);
        {
            for (let t = 0.0; t <= 1.01; t += 0.01) {
                let P = MyBezier(t, P3, P4, P5, P6);
                displayList.vertex(P.x, P.y, P.z);
            }
        }
        displayList.draw(gl, this.aVertexLocation, this.aColorLocation, this.aTexCoordLocation);
    }
}
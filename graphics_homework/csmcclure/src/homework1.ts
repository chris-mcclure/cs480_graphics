class Homework1App {
    renderingContext: RenderingContext;
    scenegraph: Scenegraph;
    t0 = 0;
    t1 = 0;
    dt = 0;
    uiUpdateTime = 0;
    rotation = 1.0;
    shaderProgram: WebGLProgram | null;
    positionBuffer: WebGLBuffer | null;
    colorBuffer : WebGLBuffer | null;
    constructor(public width: number = 512, public height: number = 384) {
        hflog.logElement = "log";
        this.renderingContext = new RenderingContext(width, height, "app");
        if (!this.renderingContext) {
            throw "Unable to create rendering context.";
        }
        this.scenegraph = new Scenegraph(this.renderingContext);
        this.shaderProgram = null;
        this.positionBuffer = null;
        this.colorBuffer = null;
    }

    run(): void {
        this.init();
        this.mainloop(0);
    }

    private init(): void {
        this.loadShaders();
        this.loadScenegraph();
    }

    private loadShaders(): void {
        let gl = this.renderingContext.gl;
        const vsSource = `
            attribute vec4 aVertexPosition;
            attribute vec4 aVertexColor;
            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
        
            varying lowp vec4 vColor;
            void main() {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
            vColor = aVertexColor;
            }
      `;

        const fsSource = `
            varying lowp vec4 vColor;
            void main() {
                gl_FragColor = vColor;
            }
        `;

        const vertexShader = this.loadShader(gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, fsSource);
        const shaderProgram = gl.createProgram();

        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        }
        this.shaderProgram = shaderProgram;
    }

    private loadShader(type: number, source: string): null | WebGLShader {
        let gl = this.renderingContext.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    private loadScenegraph(): void {
        let gl = this.renderingContext.gl;

        const positions = [
            1.0, 1.0,
            -1.0, 1.0,
            1.0, -1.0,
            -1.0, -1.0
        ];

        const colors = [
            1.0, 1.0, 1.0, 1.0,
            1.0, 0.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 1.0,
            0.0, 0.0, 1.0, 1.0
        ];

        let positionBuffer = gl.createBuffer();
        let colorBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

        let vertexPositionLoc = gl.getAttribLocation(this.shaderProgram, 'aVertexPosition');
        let vertexColorLoc = gl.getAttribLocation(this.shaderProgram, 'aVertexColor');

        const numComponentsPB = 2;
        const typePB = gl.FLOAT;
        const normalizePB = false;
        const stridePB = 0;
        const offsetPB = 0;

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(vertexPositionLoc, numComponentsPB,
            typePB, normalizePB, stridePB, offsetPB);

        gl.enableVertexAttribArray(vertexPositionLoc);
        this.positionBuffer = positionBuffer;

        const numComponentsCB = 4;
        const typeCB = gl.FLOAT;
        const normalizeCB = false;
        const strideCB = 0;
        const offsetCB = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.vertexAttribPointer(vertexColorLoc, numComponentsCB,
            typeCB, normalizeCB, strideCB, offsetCB);
        gl.enableVertexAttribArray(vertexColorLoc);
        this.colorBuffer = colorBuffer;
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
            self.mainloop(t);
        });
    }

    private updateUI(): void {
        
    }

    private update(): void {
        let gl = this.renderingContext.gl;
        let modelViewMatrixLoc = gl.getUniformLocation(this.shaderProgram, 'uModelViewMatrix');
        let projectionMatrixLoc = gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix');

        const field = 45;
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const zNear = 0.1;
        const zFar = 100.0

        const projectionMatrix = new Matrix4().PerspectiveX(field, aspect, zNear, zFar);
        const modelViewMatrix = new Matrix4().Translate(-0.0, 0.0, -6.0);
        this.rotation += this.dt*1000;
        modelViewMatrix.Rotate(this.rotation, 0.0, 0.0, 1.0);

        gl.useProgram(this.shaderProgram);
        gl.uniformMatrix4fv(projectionMatrixLoc, false, projectionMatrix.toColMajorArray());
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, modelViewMatrix.toColMajorArray());
    }

    private display(): void {
        let gl = this.renderingContext.gl;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const offset = 0;
        const vertexCount = 4;
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    }
}
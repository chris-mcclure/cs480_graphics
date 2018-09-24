
class IndexedGeometryMesh {
    public vertices: number[] = [];
    public indices: number[] = [];
    public surfaces: Surface[] = [];

    private _mtllib: string = "";
    private _mtl: string = "";
    private _vertex: Vertex = new Vertex();
    private _dirty: boolean = true;

    private _vbo: WebGLBuffer;
    private _ibo: WebGLBuffer;
    private _vboData: Float32Array = new Float32Array();
    private _iboData: Uint32Array = new Uint32Array();

    constructor(private _renderingContext: RenderingContext) {
        let gl = this._renderingContext.gl;
        let vbo = gl.createBuffer();
        let ibo = gl.createBuffer();
        if (!vbo || !ibo) throw "IndexedGeometryMesh::constructor() Unable to create buffer";
        this._vbo = vbo;
        this._ibo = ibo;
    }

    Reset() {
        this.vertices = [];
        this.indices = [];
        this.surfaces = [];
        this._dirty = true;
        this._vertex = new Vertex();
        this._mtllib = "";
        this._mtl = "";
    }

    SetMtllib(mtllib: string): void {
        this._mtllib = mtllib;
    }
    SetMtl(mtl: string): void {
        this._mtl = mtl;
    }
    BeginSurface(mode: number) {
        if (this.surfaces.length == 0) {
            // if no surfaces exist, add one
            this.surfaces.push(new Surface(mode, this.indices.length, this._mtllib, this._mtl));
        }
        else if (this.currentIndexCount != 0) {
            // do not add a surface if the most recent one is empty
            this.surfaces.push(new Surface(mode, this.indices.length, this._mtllib, this._mtl));
        }
        if (this.surfaces.length > 0) {
            // simply update the important details
            let s = this.surfaces[this.surfaces.length - 1];
            s.mtl = this._mtl;
            s.mtllib = this._mtllib;
        }
    }
    AddIndex(i: number): void {
        if (this.surfaces.length == 0) return;
        if (i < 0) {
            this.indices.push((this.vertices.length / 12) + i);
        } else {
            this.indices.push(i);
        }
        this.surfaces[this.surfaces.length - 1].Add();
        this._dirty = true;
    }
    get currentIndexCount(): number {
        if (this.surfaces.length == 0)
            return 0;
        return this.surfaces[this.surfaces.length - 1].count;
    }

    SetNormal(n: Vector3): void {
        this._vertex.normal.copy(n);
    }
    SetColor(c: Vector3): void {
        this._vertex.color.copy(c);
    }
    SetTexCoord(t: Vector3): void {
        this._vertex.texcoord.copy(t);
    }
    AddVertex(v: Vector3): void {
        this._vertex.position.copy(v);
        this.vertices.push(...this._vertex.asArray());
        this._vertex = new Vertex();
    }

    // DrawTexturedRect(bottomLeft: Vector3, upperRight: Vector3,
    //     minTexCoord: Vector3, maxTexCoord: Vector3): void {

    // }

    BuildBuffers(): void {
        // Building the VBO goes here
        if (!this._dirty) return;

        this._vboData = new Float32Array(this.vertices);
        this._iboData = new Uint32Array(this.indices);

        let gl = this._renderingContext.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vbo);
        gl.bufferData(gl.ARRAY_BUFFER, this._vboData, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._iboData, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        this._dirty = false;
    }

    Render(rc: RenderConfig, sg: Scenegraph): void {
        if (!rc.usable) {
            hflog.warn("IndexedGeometryMesh Called, but render config is unusable.");
            return;
        }
        // Rendering code goes here
        this.BuildBuffers();
        let gl = this._renderingContext.gl;

        let offsets = [0, 12, 24, 36];
        let locs = [
            rc.GetAttribLocation("aPosition"),
            rc.GetAttribLocation("aNormal"),
            rc.GetAttribLocation("aColor"),
            rc.GetAttribLocation("aTexcoord")
        ];

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vbo);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._ibo);

        for (let i = 0; i < 4; i++) {
            if (locs[i] >= 0) {
                gl.enableVertexAttribArray(locs[i]);
                gl.vertexAttribPointer(locs[i], 3, gl.FLOAT, false, 48, offsets[i]);
            }
        }

        for (let s of this.surfaces) {
            sg.UseMaterial(rc, s.mtllib, s.mtl);
            gl.drawElements(s.mode, s.count, gl.UNSIGNED_INT, s.offset * 4);
        }

        for (let i = 0; i < 4; i++) {
            if (locs[i] >= 0) {
                gl.disableVertexAttribArray(locs[i]);
            }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }


    //LoadOBJ(lines: string[][], )
}
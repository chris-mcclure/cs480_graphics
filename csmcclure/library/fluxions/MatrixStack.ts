

class MatrixStack {
    private _matrix: Array<Matrix4> = [Matrix4.makeIdentity()];

    constructor() { }

    Push() {
        this._matrix.push(this.m);
    }

    Pop() {
        if (this.length == 1) return;
        this._matrix.pop();
    }

    toColMajorArray(): Array<number> {
        return this.m.toColMajorArray();
    }

    toRowMajorArray(): Array<number> {
        return this.m.toRowMajorArray();
    }

    get empty(): boolean { return this._matrix.length == 0; }
    get length(): number { return this._matrix.length; }
    get m(): Matrix4 {
        if (!this.empty) {
            return this._matrix[this._matrix.length - 1];
        }
        return Matrix4.makeIdentity();
    }
}
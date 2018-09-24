/// <reference path="MyColor.ts" />

enum MyImageRepeatMode {
    REPEAT = 0x2901,
    CLAMP_TO_EDGE = 0x812F,
    MIRRORED_REPEAT = 0x8370
}

enum MyImageFilterMode {
    NEAREST = 0,
    BILINEAR = 1,
    TRILINEAR = 2,
    ANISOTROPIC = 3;
}

class MyImage {
    pixels: Uint8ClampedArray;

    constructor(readonly width: number, readonly height: number, makePowerOfTwo: boolean = false) {
        if (makePowerOfTwo) {
            this.width = 1 << ((0.5 + Math.log2(width)) | 0);
            this.height = 1 << ((0.5 + Math.log2(height)) | 0);
        }
        this.pixels = new Uint8ClampedArray(width * height * 4);
    }

    isCoordsInside(x: number, y: number): boolean {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return true;
        }
        return false;
    }

    clearPixels(color: MyColor) {
        let addr = 0;
        while (addr < this.pixels.length) {
            this.pixels[addr + 0] = color.r;
            this.pixels[addr + 1] = color.g;
            this.pixels[addr + 2] = color.b;
            this.pixels[addr + 3] = color.a;
            addr += 4;
        }
    }

    setPixel(x: number, y: number, color: MyColor) {
        if (!this.isCoordsInside(x, y)) {
            return;
        }
        const addr = ((y | 0) * this.width + (x | 0)) << 2;
        this.pixels[addr + 0] = color.r;
        this.pixels[addr + 1] = color.g;
        this.pixels[addr + 2] = color.b;
        this.pixels[addr + 3] = color.a;
    }

    getPixel(x: number, y: number): MyColor {
        if (!this.isCoordsInside(x, y)) {
            return new MyColor();
        }
        const addr = ((y | 0) * this.width + (x | 0)) << 2;
        const r = this.pixels[addr + 0];
        const g = this.pixels[addr + 1];
        const b = this.pixels[addr + 2];
        const a = this.pixels[addr + 3];
        return new MyColor(r, g, b, a);
    }

    // returns -1 if (x, y) is outside the image
    // otherwise returns the address to the rgba area in the pixels array
    getAddr(x: number, y: number): number {
        if (!this.isCoordsInside(x, y)) return -1;
        return ((y | 0) * this.width + (x | 0)) << 2;
    }

    static blit(
        src: MyImage, sx: number, sy: number, sw: number, sh: number,
        dst: MyImage, dx: number, dy: number, dw: number, dh: number) {
        let deltaX = sw / dw;
        let deltaY = sh / dh;
        let srcy = sy;
        let count = 0;
        for (let y = dy; y < dy + dh; y++) {
            let srcx = sx;
            for (let x = dx; x < dx + dw; x++) {
                if (count++ > 1000000) return;
                let daddr = dst.getAddr(x, y);
                if (daddr < 0) continue;
                let saddr = src.getAddr(srcx, srcy);
                let r = 0;
                let g = 0;
                let b = 0;
                let a = 0;
                if (saddr >= 0) {
                    r = src.pixels[saddr + 0];
                    g = src.pixels[saddr + 1];
                    b = src.pixels[saddr + 2];
                    a = src.pixels[saddr + 3];
                }
                dst.pixels[daddr + 0] = r;
                dst.pixels[daddr + 1] = g;
                dst.pixels[daddr + 2] = b;
                dst.pixels[daddr + 3] = a;
                srcx += deltaX;
            }
            srcy += deltaY;
        }
    }

    createTexture(gl: WebGLRenderingContext,
        repeatMode: MyImageRepeatMode = MyImageRepeatMode.CLAMP_TO_EDGE,
        filterMode: MyImageFilterMode = MyImageFilterMode.NEAREST): WebGLTexture | null {
        let texture = gl.createTexture();
        if (!texture) return null;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        let imageData = new ImageData(this.pixels, this.width, this.height);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
        if (filterMode == MyImageFilterMode.NEAREST) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        } else if (filterMode == MyImageFilterMode.BILINEAR) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        } else if (filterMode == MyImageFilterMode.TRILINEAR) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        } else if (filterMode == MyImageFilterMode.ANISOTROPIC) {
            let error = gl.getError();
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            let ext = gl.getExtension("EXT_texture_filter_anisotropic");
            if (ext) {
                var max = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
                gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, max);
            }
        }
        if (repeatMode == MyImageRepeatMode.REPEAT) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        }
        if (repeatMode == MyImageRepeatMode.CLAMP_TO_EDGE) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        if (repeatMode == MyImageRepeatMode.MIRRORED_REPEAT) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
        }
        gl.generateMipmap(gl.TEXTURE_2D);
        return texture;
    }
}
/// <reference path="../library/fluxions/Utils.ts" />
/// <reference path="MyImage.ts"/>

class MyImageArray {
    name: string = "";
    image: MyImage;
    subImages: MyImage[] = [];
    textures: WebGLTexture[] | null[] = [];

    private loaded_: boolean = false;
    get loaded(): boolean { return this.loaded_; }
    get length(): number { return this.subImages.length; }

    constructor(public url: string, readonly subImageWidth: number, readonly subImageHeight: number) {
        subImageWidth = subImageWidth | 0;
        subImageHeight = subImageHeight | 0;
        this.name = Utils.GetURLResource(url);
        this.image = new MyImage(0, 0, false);
        this.textures = [];
        let self = this;
        this.image.load(url, (image: MyImage) => {
            const w = subImageWidth;
            const h = subImageHeight;
            let count = ((image.width / w) | 0) * ((image.height / h) | 0);
            self.subImages.length = count;
            let i = 0;
            for (let y = 0; y < image.height; y += h) {
                for (let x = 0; x < image.width; x += w) {
                    self.subImages[i] = new MyImage(w, h, false);
                    MyImage.blit(
                        image, x, y, w, h,
                        self.subImages[i], 0, 0, w, h);
                    i++;
                }
            }
            this.loaded_ = true;
        });
    }

    createTextures(gl: WebGLRenderingContext) {
        this.textures.length = this.subImages.length;
        let i = 0;
        for (let image of this.subImages) {
            this.textures[i] = image.createTexture(gl);
            i++;
        }
    }

    useTexture(gl: WebGLRenderingContext, i: number, unit: number = 0) {
        if (this.textures.length == 0)
            this.createTextures(gl);
        i = i | 0;
        unit = unit | 0;
        if (this.textures[i]) {
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, this.textures[i]);
        }
    }
}
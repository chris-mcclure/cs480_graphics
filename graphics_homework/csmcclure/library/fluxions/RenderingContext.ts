// Fluxions WebGL Library
// Copyright (c) 2017 - 2018 Jonathan Metzgar
// All Rights Reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
/// <reference path="../gte/GTE.ts" />
/// <reference path="Utils.ts" />
/// <reference path="RenderConfig.ts" />
/// // <reference path="Scenegraph.ts" />
/// // <reference path="IndexedGeometryMesh.ts" />
/// // <reference path="Texture.ts" />
/// // <reference path="MaterialLibrary.ts" />

class RenderingContext {
    private enabledExtensions: Map<string, any> = new Map<string, any>();
    private divElement_: HTMLDivElement | null = null;
    private canvasElement_: HTMLCanvasElement | null = null;
    public gl: WebGLRenderingContext;
    public aspectRatio: number = 1.0;
    private _visible: boolean = false;

    get visible(): boolean {
        return this._visible;
    }

    get canvas(): HTMLCanvasElement {
        if (!this.canvasElement_)
            return new HTMLCanvasElement();
        return this.canvasElement_;
    }

    constructor(public width: number = 512, public height: number = 384, public id: string = "") {
        if (id && id.length > 0) {
            let e = <HTMLDivElement>document.getElementById(id);
            if (e) {
                this.divElement_ = e;
            } else {
                e = document.createElement("div");
                e.id = id;
                document.body.appendChild(e);
                this.divElement_ = e;
            }            
        }
        if (!this.divElement_) {
            this.divElement_ = document.createElement("div");
            this.divElement_.id = "fluxions";
        }
        this.canvasElement_ = document.createElement("canvas");
        this.canvasElement_.width = width;
        this.canvasElement_.height = height;
        if (this.canvasElement_) {
            let gl = this.canvasElement_.getContext("webgl");
            if (!gl) {
                gl = this.canvasElement_.getContext("experimental-webgl");
            }
            if (!gl) {
                this.divElement_.innerText = "WebGL not supported.";
                throw "Unable to create rendering context!";
            }
            else {
                this.gl = gl;
                this.divElement_.appendChild(this.canvasElement_);
                this.divElement_.align = "center";
                this.aspectRatio = width / height;

                let debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    let vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                    let renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

                    hflog.log(vendor);
                    hflog.log(renderer);
                }
            }
        } else {
            throw "Unable to create canvas!";
        }

        // let self=this;
        // document.addEventListener("", (ev) {
        //     self._visible=true;
        // });

        // this.canvasElement_.addEventListener("de")

        this.EnableExtensions([
            "OES_standard_derivatives",
            "WEBGL_depth_texture",
            "OES_texture_float",
            "OES_element_index_uint",
            "EXT_texture_filter_anisotropic",
            "OES_texture_float",
            "OES_texture_float_linear"
        ]);
    }

    // ...
    EnableExtensions(names: string[]): boolean {
        let supportedExtensions = this.gl.getSupportedExtensions();
        if (!supportedExtensions)
            return false;
        let allFound = true;
        for (let name of names) {
            let found = false;
            for (let ext of supportedExtensions) {
                if (name == ext) {
                    this.enabledExtensions.set(name, this.gl.getExtension(name));
                    hflog.log("Extension " + name + " enabled")
                    found = true;
                    break;
                }
            }
            if (!found) {
                hflog.log("Extension " + name + " not enabled")
                allFound = false;
                break;
            }
        }
        return allFound;
    }

    GetExtension(name: string): any {
        if (this.enabledExtensions.has(name)) {
            return this.enabledExtensions.get(name);
        }
        return null;
    }
}
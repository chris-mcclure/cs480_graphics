class FresnelDataPoint {
    x: number = 0;
    value: Vector3 = Vector3.make(0, 0, 0);
}

class FresnelMetalDataPoint {
    public rgbWeight: Vector3 = new Vector3();
    public Fgroundtruth: number = 0.0;
    public Fspectral: number = 0.0;
    constructor(public wavelength: number,
        public n2: number,
        public k2: number) { }
}

class CIEHorseshoeDataPoint {
    constructor(
        public wavelength: number = 0,
        public x: number = 0,
        public y: number = 0,
        public z: number = 0) { }
    get point2(): Vector2 { return new Vector2(this.x, this.y); }
    get point3(): Vector3 { return new Vector3(this.x, this.y, this.z); }
}

function within(x: number, a: number, b: number): boolean {
    if (x < a) return false;
    if (x > b) return false;
    return true;
}

function notwithin(x: number, a: number, b: number): boolean {
    if (x < a) return true;
    if (x > b) return true;
    return false;
}

function copyText(text: string) {
    try {
        let e: HTMLDivElement = document.createElement("div");
        e.innerText = text;
        document.body.appendChild(e);

        let r = document.createRange();
        r.selectNode(e);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(r);

        document.execCommand("copy", false, text);
        e.remove();
    }
    catch {
        console.error("Unable to copy text to clipboard");
    }
}

namespace GTE {

}

class FresnelGraph {
    readonly DATA_INDEX = 0;
    readonly COMP1_INDEX = 1;
    readonly COMP2_INDEX = 2;
    readonly DIFF_INDEX = 3;
    readonly TOTAL_GRAPHS = 4;
    readonly n: number;
    //readonly n: number;

    graphs: Array<Array<FresnelDataPoint>> = [];
    fresnelData: Array<FresnelDataPoint> = [];
    fresnelComp1: Array<FresnelDataPoint> = [];
    fresnelComp2: Array<FresnelDataPoint> = [];
    fresnelDiff: Array<FresnelDataPoint> = [];

    // n samples between a and b inclusively
    constructor(public a: number = 0, public b: number = 90, readonly xName: string = "angle") {
        this.n = b + 1;

        this.graphs.length = this.TOTAL_GRAPHS;
        let dAngle = (90) / (this.n - 1);
        for (let g = 0; g < this.TOTAL_GRAPHS; g++) {
            this.graphs[g] = [];
            this.graphs[g].length = this.n;
            for (let i = this.a; i <= this.b; i++) {
                this.graphs[g][i] = new FresnelDataPoint();
                this.graphs[g][i].x = i;
            }
        }
    }

    plot(graphIndex: number, x: number, wavelengthIndex: number, value: number) {
        if (notwithin(graphIndex, 0, this.TOTAL_GRAPHS)) return;
        if (notwithin(wavelengthIndex, 0, 2)) return;
        if (notwithin(x, this.a, this.b)) return;
        //let i = Math.floor(x * (this.n - 1) / 90);
        let i = Math.floor(x);
        this.graphs[graphIndex][i].value.set(wavelengthIndex, value);
    }

    copydata(metalName: string, fm: FresnelMetal) {
        let graphIndex = 0;
        if (fm.comp1 != fm.comp2) graphIndex = 1;

        if (notwithin(graphIndex, 0, this.TOTAL_GRAPHS)) return;

        let result = "# '" + this.makedataname(metalName, fm) + ".txt'\n";
        if (graphIndex == 0) {
            result += "# " + this.xName + "       r      g      b\n";
        } else {
            result += "# " + this.xName + "    fc1r   fc1g   fc1b   fc2r   fc2g   fc2b   diffr   diffg   diffb\n";
        }

        for (let i = 0; i < this.n; i++) {
            result += this.graphs[0][i].x + "\t";
            if (graphIndex == 0) {
                result += this.graphs[0][i].value.get(0).toFixed(5) + "\t";
                result += this.graphs[0][i].value.get(1).toFixed(5) + "\t";
                result += this.graphs[0][i].value.get(2).toFixed(5) + "\n";
            }
            if (graphIndex > 0) {
                result += this.graphs[1][i].value.get(0).toFixed(5) + "\t";
                result += this.graphs[1][i].value.get(1).toFixed(5) + "\t";
                result += this.graphs[1][i].value.get(2).toFixed(5) + "\t";
                result += this.graphs[2][i].value.get(0).toFixed(5) + "\t";
                result += this.graphs[2][i].value.get(1).toFixed(5) + "\t";
                result += this.graphs[2][i].value.get(2).toFixed(5) + "\t";
                result += this.graphs[3][i].value.get(0).toFixed(5) + "\t";
                result += this.graphs[3][i].value.get(1).toFixed(5) + "\t";
                result += this.graphs[3][i].value.get(2).toFixed(5) + "\n";
            }
        }

        copyText(result);
    }

    methodToString(i: number): string {
        switch (i) {
            case 0: return "Specular";
            case 1: return "Schlick";
            case 2: return "Lazani";
            case 3: return "Glassner";
            case 4: return "Fresnel";
            case 5: return "Spectral";
        }
        return "What!?";
    }

    makedataname(metalName: string, fm: FresnelMetal): string {
        if (fm.comp1 == fm.comp2) {
            let method = this.methodToString(fm.method);
            let datafile = metalName + "_" + method;
            return datafile;
        } else {
            let method1 = this.methodToString(fm.comp1);
            let method2 = this.methodToString(fm.comp2);
            let datafile = metalName + "_" + method1 + "_" + method2;
            return datafile;
        }
    }

    copygnuplot(metalName: string, fm: FresnelMetal) {
        let dataname = this.makedataname(metalName, fm);
        let result = "# '" + dataname + ".gp'\n\n";

        result += "set terminal pdfcairo size 9,4 enhanced font 'PragmataPro,16'\n";
        result += "set output '" + dataname + ".pdf'\n";
        result += "set key right center\n\n";

        result += "set style line 1 dt 1 lw 2 lc rgb '#ff0000'\n";
        result += "set style line 2 dt 1 lw 2 lc rgb '#00bf00'\n";
        result += "set style line 3 dt 1 lw 2 lc rgb '#0000ff'\n";
        result += "set style line 4 dt 2 lw 2 lc rgb '#ff0000'\n";
        result += "set style line 5 dt 2 lw 2 lc rgb '#00bf00'\n";
        result += "set style line 6 dt 2 lw 2 lc rgb '#0000ff'\n";
        result += "set style line 7 lt 1 lw 2 lc rgb '#00bfbf'\n";
        result += "set style line 8 lt 2 lw 2 lc rgb '#bf00bf'\n";
        result += "set style line 9 lt 3 lw 2 lc rgb '#bf6f00'\n\n";

        let datafile = "'" + dataname + ".txt'";
        if (fm.comp1 == fm.comp2) {
            let method = this.methodToString(fm.method);
            result += "plot " + datafile + " using 1:2 with lines ls 1 t '" + method + " R',\\\n";
            result += "     " + datafile + " using 1:3 with lines ls 2 t '" + method + " G',\\\n";
            result += "     " + datafile + " using 1:4 with lines ls 3 t '" + method + " B'\n\n";
        } else {
            let method1 = this.methodToString(fm.comp1);
            let method2 = this.methodToString(fm.comp2);
            result += "plot " + datafile + " using 1:2 with lines ls 1 t '" + method1 + " R',\\\n";
            result += "     " + datafile + " using 1:3 with lines ls 2 t '" + method1 + " G',\\\n";
            result += "     " + datafile + " using 1:4 with lines ls 3 t '" + method1 + " B',\\\n";
            result += "     " + datafile + " using 1:5 with lines ls 4 t '" + method2 + " R',\\\n";
            result += "     " + datafile + " using 1:6 with lines ls 5 t '" + method2 + " G',\\\n";
            result += "     " + datafile + " using 1:7 with lines ls 6 t '" + method2 + " B',\\\n";
            result += "     " + datafile + " using 1:8 with lines ls 7 t '|R| difference',\\\n";
            result += "     " + datafile + " using 1:9 with lines ls 8 t '|G| difference',\\\n";
            result += "     " + datafile + " using 1:10 with lines ls 9 t '|B| difference'\n\n";
        }

        copyText(result);
    }

    copyiordata(metalName: string, colorSpaceName: string, fm: FresnelMetal) {
        let dataname = metalName + "_" + colorSpaceName;
        let result = "# '" + dataname + ".txt'\n";
        result += "# " + this.xName + "       n2    k2    r      g      b\n";

        for (let i = this.a; i <= this.b; i++) {
            result += this.graphs[0][i].x + "\t";
            result += this.graphs[0][i].value.get(0).toFixed(5) + "\t";
            result += this.graphs[0][i].value.get(1).toFixed(5) + "\t";
            result += this.graphs[1][i].value.get(0).toFixed(5) + "\t";
            result += this.graphs[1][i].value.get(1).toFixed(5) + "\t";
            result += this.graphs[1][i].value.get(2).toFixed(5) + "\n";
        }

        copyText(result);
    }

    copyiorgnuplot(metalName: string, colorSpaceName: string, fm: FresnelMetal) {
        let dataname = metalName + "_" + colorSpaceName;
        let result = "# '" + dataname + ".gp'\n\n";

        result += "set terminal pdfcairo size 9,4 enhanced font 'PragmataPro,16'\n";
        result += "set output '" + dataname + ".pdf'\n";
        result += "set key right center\n\n";

        result += "set style line 1 dt 1 lw 4 lc rgb '#1f1f1f'\n";
        result += "set style line 2 dt 1 lw 4 lc rgb '#bfbfbf'\n";
        result += "set style line 3 dt 2 lw 2 lc rgb '#ff0000'\n";
        result += "set style line 4 dt 2 lw 2 lc rgb '#00bf00'\n";
        result += "set style line 5 dt 2 lw 2 lc rgb '#0000ff'\n\n";

        let datafile = "'" + dataname + ".txt'";
        result += "plot " + datafile + " using 1:2 with lines ls 1 t '" + metalName + " n2',\\\n";
        result += "     " + datafile + " using 1:3 with lines ls 2 t '" + metalName + " k2',\\\n";
        result += "     " + datafile + " using 1:4 with lines ls 3 t '" + colorSpaceName + " R',\\\n";
        result += "     " + datafile + " using 1:5 with lines ls 4 t '" + colorSpaceName + " G',\\\n";
        result += "     " + datafile + " using 1:6 with lines ls 5 t '" + colorSpaceName + " B'\n\n";

        copyText(result);
    }

    render(ctx2d: CanvasRenderingContext2D, graphIndex: number, index: number, color: string, xoffset: number, yoffset: number, width: number, height: number) {
        ctx2d.strokeStyle = color;
        ctx2d.beginPath();

        let x = 0;
        let dx = (width + 1) / (this.n - 1);
        for (let i = 0; i < this.n; i++) {
            let y = (height - 1) * GTE.clamp(this.graphs[graphIndex][i].value.get(index), 0, 1);
            if (i == 0) {
                ctx2d.moveTo(x + xoffset, y + yoffset);
            } else {
                ctx2d.lineTo(x + xoffset, y + yoffset);
            }
            x += dx;
        }
        ctx2d.stroke();
    }
}

class FresnelMetal {
    data: Array<FresnelMetalDataPoint> = [];
    fresnelGraph: FresnelGraph = new FresnelGraph();
    iorGraph: FresnelGraph = new FresnelGraph(390, 830, "nm");
    canvas: HTMLCanvasElement | null = null;
    div: HTMLDivElement | null = null;
    context: CanvasRenderingContext2D | null = null;
    width: number = 441;
    height: number = 201;
    middleY: number = 100;
    readonly nmA = 3900;
    readonly nmB = 8300;
    private fresnelScale: number = 1.0;
    private fresnelMin: number = 1e6;
    private fresnelMax: number = -1e6;
    ismono: boolean = false;
    private ciehs: Array<CIEHorseshoeDataPoint> = [];
    private _wht: Vector3 = new Vector3();
    private _red: Vector3 = new Vector3();
    private _grn: Vector3 = new Vector3();
    private _blu: Vector3 = new Vector3();
    rednm: number = 0;
    grnnm: number = 0;
    blunm: number = 0;
    signm: number = 0;
    n2: Vector3 = new Vector3();
    k2: Vector3 = new Vector3();
    F0: Vector3 = new Vector3();
    F1: Vector3 = new Vector3();

    public method: number = 1;
    public comp1: number = 1;
    public comp2: number = 1;

    constructor() {
        this.data.length = 10000;
        for (let i = 0; i < this.data.length; i++) {
            this.data[i] = new FresnelMetalDataPoint(i / 10.0, 1.0, 0.0);
        }
        this.initHorseshoe();
    }

    setChromaticities(red: Vector3, green: Vector3, blue: Vector3, white: Vector3, sigma: number = 25) {
        this.ismono = false;

        this._wht.copy(white);
        this._red.copy(red);
        this._grn.copy(green);
        this._blu.copy(blue);

        // search for the best RGB wavelengths
        let whtpt = this._wht.toVector2();
        let points = [
            this._red.toVector2(),
            this._grn.toVector2(),
            this._blu.toVector2()
        ];

        let bestDistances = [1e30, 1e30, 1e30];
        let bestnm = [0, 0, 0];
        let currentDistances = [0.0, 0.0, 0.0];
        for (let hs of this.ciehs) {
            for (let i = 0; i < 3; i++) {
                // calculate distance to line from white point
                currentDistances[i] = GTE.distancePointLine2(hs.point2, whtpt, points[i]);
                if (currentDistances[i] < bestDistances[i]) {
                    bestDistances[i] = currentDistances[i];
                    bestnm[i] = hs.wavelength;
                }
            }
        }

        this.rednm = bestnm[0];
        this.grnnm = bestnm[1];
        this.blunm = bestnm[2];
        this.signm = sigma;

        this.calcRGBWeights();
    }


    calcRGBWeights() {
        // hflog.info("Found wavelengths R: " + this.rednm + " G: " + this.grnnm + " B: " + this.blunm);

        let area = Vector3.make(0, 0, 0);

        let irednm = (this.rednm * 10) | 0;
        let igrnnm = (this.grnnm * 10) | 0;
        let iblunm = (this.blunm * 10) | 0;

        // plot gaussian weights
        for (let i = this.nmA; i <= this.nmB; i++) {
            let wavelength = i / 10.0;

            if (this.signm > 0.01) {
                this.data[i].rgbWeight.x = GTE.gaussian(wavelength, this.rednm, this.signm);
                this.data[i].rgbWeight.y = GTE.gaussian(wavelength, this.grnnm, this.signm);
                this.data[i].rgbWeight.z = GTE.gaussian(wavelength, this.blunm, this.signm);
            } else {
                this.data[i].rgbWeight.reset(
                    (i == irednm) ? 10.0 : 0,
                    (i == igrnnm) ? 10.0 : 0,
                    (i == iblunm) ? 10.0 : 0);
            }

            // Riemann sum to calculate area under guassian curve. It should be one to be energy preserving.
            area = area.add(this.data[i].rgbWeight.mul(1.0 / 10.0));
        }
        let area_reciprocal = area.reciprocal();
        let area2 = Vector3.make(0, 0, 0);
        for (let i = this.nmA; i <= this.nmB; i++) {
            this.data[i].rgbWeight = this.data[i].rgbWeight.compdiv(area_reciprocal);
            area2 = area2.add(this.data[i].rgbWeight.mul(1.0 / 10.0));
        }

        this.recalcCoefs();
        // hflog.info("Area Before: " + Utils.niceVector(area));
        // hflog.info("Area After:  " + Utils.niceVector(area2));
    }


    recalcCoefs() {
        this.n2.reset();
        this.k2.reset();
        for (let i = this.nmA; i <= this.nmB; i++) {
            this.n2 = this.n2.add(this.data[i].rgbWeight.mul(this.data[i].n2 * .1));
            this.k2 = this.k2.add(this.data[i].rgbWeight.mul(this.data[i].k2 * .1));
        }
        let one = Vector3.make(1, 1, 1);
        let t = (one.sub(this.n2)).compdiv(one.add(this.n2));
        //this.F0 = t.compmul(t);
        this.F0.reset(this.fresnelExact(0, 0),
            this.fresnelExact(0, 1),
            this.fresnelExact(0, 2));
        let t1 = one.sub(this.n2).pow(2);
        let t2 = one.add(this.n2).pow(2);
        let n = t1.add(this.k2.pow(2));
        let d = t2.add(this.k2.pow(2));
        this.F1 = n.compdiv(d);
        // hflog.info("n2: " + Utils.niceVector(this.n2));
        // hflog.info("k2: " + Utils.niceVector(this.k2));
        // hflog.info("F0: " + Utils.niceVector(this.F0));
        // hflog.info("F1: " + Utils.niceVector(this.F1));
    }


    copydata(metalName: string, colorSpaceName: string) {
        for (let x = this.iorGraph.a; x <= this.iorGraph.b; x++) {
            this.iorGraph.plot(0, x, 0, this.data[x * 10].n2);
            this.iorGraph.plot(0, x, 1, this.data[x * 10].k2);
            this.iorGraph.plot(1, x, 0, 100 * this.data[x * 10].rgbWeight.r);
            this.iorGraph.plot(1, x, 1, 100 * this.data[x * 10].rgbWeight.g);
            this.iorGraph.plot(1, x, 2, 100 * this.data[x * 10].rgbWeight.b);
        }

        this.iorGraph.copyiordata(metalName, colorSpaceName, this);
    }


    copygnuplot(metalName: string, colorSpaceName: string) {
        this.iorGraph.copyiorgnuplot(metalName, colorSpaceName, this);
    }


    setSRGBChromaticies() {
        const srgbRed = Vector3.make(0.6400, 0.3300, 0.2126);
        const srgbGrn = Vector3.make(0.3000, 0.6000, 0.7152);
        const srgbBlu = Vector3.make(0.1500, 0.0600, 0.0722);
        const srgbD65Wht = Vector3.make(0.3127, 0.3290, 1.0000);
        this.setChromaticities(srgbRed, srgbGrn, srgbBlu, srgbD65Wht);
    }


    setDCIP3Chromaticies() {
        const dcip3Red = Vector3.make(0.680, 0.320, 0.999);
        const dcip3Grn = Vector3.make(0.265, 0.690, 0.999);
        const dcip3Blu = Vector3.make(0.150, 0.060, 0.999);
        const dcip3D65Wht = Vector3.make(0.3127, 0.3290, 1.000);
        const dcip3TheaterWht = Vector3.make(0.314, 0.351, 1.000);
        this.setChromaticities(dcip3Red, dcip3Grn, dcip3Blu, dcip3D65Wht);
    }


    setDCIP3TheaterChromaticies() {
        const dcip3Red = Vector3.make(0.680, 0.320, 0.999);
        const dcip3Grn = Vector3.make(0.265, 0.690, 0.999);
        const dcip3Blu = Vector3.make(0.150, 0.060, 0.999);
        const dcip3TheaterWht = Vector3.make(0.314, 0.351, 1.000);
        this.setChromaticities(dcip3Red, dcip3Grn, dcip3Blu, dcip3TheaterWht);
    }


    setAdobeChromaticies() {
        const adobeRed = Vector3.make(0.6400, 0.3300, 0.9999);
        const adobeGrn = Vector3.make(0.2100, 0.7100, 0.9999);
        const adobeBlu = Vector3.make(0.1500, 0.0600, 0.9999);
        const adobeWht = Vector3.make(0.3127, 0.3290, 1.0000);
        this.setChromaticities(adobeRed, adobeGrn, adobeBlu, adobeWht);
    }

    process(lines: string[][]) {
        // data has the format
        // wavelength   n2   k2
        let dp = [];
        let count = 0;
        let minimum = 1e6;
        let maximum = -1e6;
        for (let line of lines) {
            if (count == 0) {
                count++;
                continue;
            }
            let wavelength = parseFloat(line[0]);
            let n2 = parseFloat(line[1]);
            let k2 = parseFloat(line[2]);
            minimum = GTE.min3(n2, k2, minimum);
            maximum = GTE.max3(n2, k2, maximum);
            dp.push(new FresnelMetalDataPoint(wavelength, n2, k2));
        }

        this.fresnelMax = Math.max(this.fresnelMax, maximum);
        this.fresnelMin = Math.max(this.fresnelMin, minimum);
        this.fresnelScale = this.height * 1.0 / this.fresnelMax;

        // use linear interpolation to map the wavelengths
        let srci = 0;

        for (let i = 0; i < this.data.length; i++) {
            let wavelength = i / 10.0;

            if (srci == 0 && dp[srci].wavelength > wavelength) {
                this.data[i].n2 = dp[srci].n2;
                this.data[i].k2 = dp[srci].k2;
            } else if (srci == dp.length - 1 && dp[srci].wavelength < wavelength) {
                this.data[i].n2 = dp[srci].n2;
                this.data[i].k2 = dp[srci].k2;
            } else {
                // skip forward until we have the right two samples
                let sample1 = dp[srci];
                let sample2 = dp[srci + 1];
                while (srci <= dp.length - 2 && sample2.wavelength < wavelength) {
                    srci++;
                    if (srci >= dp.length - 2) break;
                    sample1 = dp[srci];
                    sample2 = dp[srci + 1];
                }
                let dw = sample2.wavelength - sample1.wavelength;
                let dn2 = sample2.n2 - sample1.n2;
                let dk2 = sample2.k2 - sample1.k2;
                let n2slope = dn2 / dw;
                let k2slope = dk2 / dw;
                let delta = this.data[i].wavelength - sample1.wavelength;
                this.data[i].n2 = sample1.n2 + delta * n2slope;
                this.data[i].k2 = sample1.k2 + delta * k2slope;
            }
        }

        this.recalcCoefs();
    }

    makeGraph() {
        if (!this.div) {
            let el = document.getElementById("metalGraphDiv");
            if (!el) {
                this.div = document.createElement("div");
                this.div.id = "metalGraphDiv";
                this.div.style.textAlign = "center";
                document.body.appendChild(this.div);
            }
            else {
                this.div = <HTMLDivElement>el;
                this.div.style.textAlign = "center";
            }
        }

        if (this.div && !this.canvas) {
            let el = document.getElementById("metalGraphCanvas");
            if (!el) {
                this.canvas = document.createElement("canvas");
                this.canvas.id = "metalGraphCanvas";
                // for wavelengths 390 to 830
                // and intensity -100 to +100
                this.canvas.width = 441 + 50 + 181;
                this.canvas.height = 201;
                this.width = this.canvas.width;
                this.height = this.canvas.height;
                this.canvas.style.margin = "auto";
                this.div.appendChild(this.canvas);
                this.context = this.canvas.getContext("2d");
            }
        }
    }

    renderGraph() {
        if (this.context) {
            let ctx2d = this.context;
            ctx2d.fillStyle = "#ffffff";
            ctx2d.fillRect(0, 0, this.width, this.height);

            let g1width = 441;
            let g2width = 201;
            let g1x = 0;
            let g1y = 0.75 * this.height;
            let g2x = this.width - 181;
            let g2y = this.height;

            ctx2d.strokeStyle = "black";
            ctx2d.beginPath();
            ctx2d.moveTo(0, 0);
            ctx2d.lineTo(0, this.height);
            ctx2d.moveTo(0, g1y);
            ctx2d.lineTo(g1width, g1y);
            ctx2d.moveTo(g2x, 0);
            ctx2d.lineTo(g2x, this.height);
            ctx2d.stroke();

            let scale = -this.fresnelScale;
            let y = this.middleY;
            ctx2d.strokeStyle = "#27251F"; // Process Black
            ctx2d.beginPath();
            ctx2d.moveTo(0, scale * this.data[this.nmA].n2 + g1y);
            for (let i = 0; i <= 440; i++) {
                ctx2d.lineTo(i, scale * this.data[this.nmA + i * 10].n2 + g1y);
            }
            ctx2d.stroke();

            ctx2d.strokeStyle = "#818387"; // Cool Gray
            ctx2d.beginPath();
            ctx2d.moveTo(0, scale * this.data[this.nmA].k2 + g1y);
            for (let i = 0; i <= 440; i++) {
                ctx2d.lineTo(i, scale * this.data[this.nmA + i * 10].k2 + g1y);
            }
            ctx2d.stroke();

            g1y = this.height;
            let vscale = -3000.0;//0.0001;
            scale = -1.0;
            let py: number = 0;
            ctx2d.strokeStyle = "red"; // Red
            ctx2d.beginPath();
            ctx2d.moveTo(0, scale * this.data[this.nmA].rgbWeight.x + g1y);
            let max = 0;
            for (let i = 0; i <= 440; i++) {
                let py = this.data[this.nmA + i * 10].rgbWeight.x;
                max = Math.max(py, max);
                ctx2d.lineTo(i, vscale * py + g1y);
            }
            ctx2d.stroke();

            ctx2d.strokeStyle = "green"; // Red
            ctx2d.beginPath();
            ctx2d.moveTo(0, scale * this.data[this.nmA].rgbWeight.y + g1y);
            for (let i = 0; i <= 440; i++) {
                ctx2d.lineTo(i, vscale * this.data[this.nmA + i * 10].rgbWeight.y + g1y);
            }
            ctx2d.stroke();

            ctx2d.strokeStyle = "blue"; // Red
            ctx2d.beginPath();
            ctx2d.moveTo(0, scale * this.data[this.nmA].rgbWeight.z + g1y);
            for (let i = 0; i <= 440; i++) {
                ctx2d.lineTo(i, vscale * this.data[this.nmA + i * 10].rgbWeight.z + g1y);
            }
            ctx2d.stroke();


            let colors = ["red", "green", "blue"];
            let compcolors1 = ["#ff0000", "#00ff00", "#0000ff"];
            let compcolors2 = ["#00ffff", "#ff00ff", "#ffff00"];
            let fc1 = 0;
            let fc2 = 0;

            for (let g = 0; g < 4; g++) {
                for (let wavelength = 0; wavelength < 3; wavelength++) {
                    for (let angle = 0; angle <= 90; angle++) {
                        let value = 0;
                        let fc1 = this.fresnel(this.comp1, angle, wavelength);;
                        let fc2 = this.fresnel(this.comp2, angle, wavelength);
                        if (g == 0) { value = this.fresnel(this.method, angle, wavelength); }
                        if (g == 1) { value = fc1; }
                        if (g == 2) { value = fc2; }
                        if (g == 3) { value = Math.abs(fc1 - fc2); }
                        this.fresnelGraph.plot(g, angle, wavelength, value);
                    }
                }
            }

            for (let

                wavelength = 0; wavelength < 3; wavelength++) {
                vscale = 200;

                if (this.comp1 != this.comp2) {
                    ctx2d.strokeStyle = compcolors1[wavelength];
                    ctx2d.beginPath();
                    ctx2d.moveTo(g2x, g2y);
                    for (let i = 0; i <= 180; i++) {
                        let yvalue = vscale * this.fresnel(this.comp1, i / 2, wavelength);
                        ctx2d.lineTo(g2x + i, g2y - yvalue);
                    }
                    ctx2d.stroke();

                    ctx2d.strokeStyle = compcolors2[wavelength];
                    ctx2d.beginPath();
                    ctx2d.moveTo(g2x, g2y);
                    for (let i = 0; i <= 180; i++) {
                        let yvalue = vscale * this.fresnel(this.comp2, i / 2, wavelength);
                        ctx2d.lineTo(g2x + i, g2y - yvalue);
                    }
                    ctx2d.stroke();

                    ctx2d.strokeStyle = compcolors1[wavelength];
                    ctx2d.beginPath();
                    ctx2d.moveTo(g2x, g2y);
                    for (let i = 0; i <= 180; i++) {
                        let fc1 = this.fresnel(this.comp1, i / 2, wavelength);
                        let fc2 = this.fresnel(this.comp2, i / 2, wavelength);
                        let yvalue = vscale * Math.abs(fc1 - fc2);
                        ctx2d.lineTo(g2x + i, -10 * (1 + wavelength) + g2y - yvalue);
                    }
                    ctx2d.stroke();
                } else {
                    ctx2d.strokeStyle = colors[wavelength];
                    ctx2d.beginPath();
                    ctx2d.moveTo(g2x, g2y);
                    for (let i = 0; i <= 180; i++) {
                        let yvalue = vscale * this.fresnel(this.method, i / 2, wavelength);
                        ctx2d.lineTo(g2x + i, g2y - yvalue);
                    }
                    ctx2d.stroke();
                }
            }
        }
    }

    fresnel(method: number, angle: number, index: number): number {
        switch (method) {
            case 0: return this.fresnelSpecular(angle, index);
            case 1: return this.fresnelSchlick(angle, index);
            case 2: return this.fresnelLazani(angle, index);
            case 3: return this.fresnelApprox(angle, index);
            case 4: return this.fresnelExact(angle, index);
            case 5: return this.fresnelSpectral(angle, index);
        }
        return this.fresnelExact(angle, index);
    }

    fresnelSpecular(angle: number, index: number): number {
        let cos_theta = Math.cos(angle * GTE.toRadians);
        let c = Math.pow(1.0 - cos_theta, 5.0);
        let f0 = this.F1.y;
        return this.F1.get(index) * (f0 + (1.0 - f0) * c);
    }

    fresnelSchlick(angle: number, index: number): number {
        let cos_theta = Math.cos(angle * GTE.toRadians);
        let F0 = this.F0.get(index);
        return F0 + (1 - F0) * Math.pow(1 - cos_theta, 5);
    }

    fresnelLazani(angle: number, index: number): number {
        let c = Math.pow(1.0 - Math.cos(angle * GTE.toRadians), 5.0);
        let n2 = this.n2.get(index);
        let k2 = this.k2.get(index);
        let t1 = Math.pow(n2 - 1.0, 2.0);
        let t2 = Math.pow(n2 + 1.0, 2.0);
        let t3 = k2 * k2;
        return (t1 + 4.0 * c * n2 + t3) / (t2 + t3);
    }

    fresnelApprox(angle: number, index: number): number {
        let cos_theta = Math.cos(angle * GTE.toRadians);
        let n = this.n2.get(index);
        let k = this.k2.get(index);
        let n2 = n * n;
        let k2 = k * k;
        let cos2 = cos_theta * cos_theta;
        let n2k2cos2 = (n2 + k2) * cos2;
        let n2cos = 2.0 * cos_theta * n;
        let n_minus_cos_2 = (n - cos_theta) * (n - cos_theta);
        let n_plus_cos_2 = (n + cos_theta) * (n + cos_theta);

        let Rs = (n_minus_cos_2 + k2) / (n_plus_cos_2 + k2);
        let Rp = (n2k2cos2 - n2cos + 1.0) / (n2k2cos2 + n2cos + 1.0);

        return (Rs * Rs + Rp * Rp) * 0.5;
    }

    fresnelExact(angle: number, index: number): number {
        let cos_theta = Math.cos(angle * GTE.toRadians);
        let n_1 = 1.0;
        let n_2 = this.n2.get(index);
        let k_2 = this.k2.get(index);
        let k_2Squared = k_2 * k_2;
        let n_2Squared = n_2 * n_2;
        let n_1Squared = n_1 * n_1;
        let NcrossLSquared = 1.0 - cos_theta * cos_theta;
        let a = n_2Squared - k_2Squared - n_1Squared * NcrossLSquared;
        let aSquared = a * a;
        let b = 4.0 * n_2Squared * k_2Squared;
        let c = Math.sqrt(aSquared + b);
        let p2 = 0.5 * (c + a);
        let p = Math.sqrt(p2);
        let q2 = 0.5 * (c - a);
        let d1 = n_1 * cos_theta - p;
        let d2 = n_1 * cos_theta + p;
        let rho_perp = (d1 * d1 + q2) / (d2 * d2 + q2);
        let e1 = p - n_1 * (1.0 / cos_theta - cos_theta);
        let e2 = p + n_1 * (1.0 / cos_theta - cos_theta);
        let rho_parl = rho_perp * (e1 * e1 + q2) / (e2 * e2 + q2);
        return (rho_perp * rho_perp + rho_parl * rho_parl) * 0.5;
    }

    private fullFresnel(cos_theta: number, n_2: number, k_2: number): number {
        let n_1 = 1.0;
        let k_2Squared = k_2 * k_2;
        let n_2Squared = n_2 * n_2;
        let n_1Squared = n_1 * n_1;
        let NcrossLSquared = 1.0 - cos_theta * cos_theta;
        let a = n_2Squared - k_2Squared - n_1Squared * NcrossLSquared;
        let aSquared = a * a;
        let b = 4.0 * n_2Squared * k_2Squared;
        let c = Math.sqrt(aSquared + b);
        let p2 = 0.5 * (c + a);
        let p = Math.sqrt(p2);
        let q2 = 0.5 * (c - a);
        let d1 = n_1 * cos_theta - p;
        let d2 = n_1 * cos_theta + p;
        let rho_perp = (d1 * d1 + q2) / (d2 * d2 + q2);
        let e1 = p - n_1 * (1.0 / cos_theta - cos_theta);
        let e2 = p + n_1 * (1.0 / cos_theta - cos_theta);
        let rho_parl = rho_perp * (e1 * e1 + q2) / (e2 * e2 + q2);
        return (rho_perp * rho_perp + rho_parl * rho_parl) * 0.5;
    }

    fresnelSpectral(angle: number, index: number): number {
        let F_spectral = 0;
        let cos_theta = Math.cos(angle * GTE.toRadians);

        for (let i = this.nmA; i <= this.nmB; i++) {
            F_spectral += 0.1 * this.fullFresnel(cos_theta, this.data[i].n2, this.data[i].k2) * this.data[i].rgbWeight.get(index);
        }

        return F_spectral;
    }



    get PBn2(): Vector3 {
        return Vector3.make(1.33, 1.33, 1.33);
    }

    get PBk2(): Vector3 {
        return Vector3.make(0.0, 0.0, 0.0);
    }

    private initHorseshoe() {
        this.ciehs = [
            new CIEHorseshoeDataPoint(390, 0.17842, 0.02464, 0.79694),
            new CIEHorseshoeDataPoint(391, 0.17838, 0.02482, 0.79679),
            new CIEHorseshoeDataPoint(392, 0.17831, 0.02496, 0.79673),
            new CIEHorseshoeDataPoint(393, 0.17819, 0.02505, 0.79676),
            new CIEHorseshoeDataPoint(394, 0.17803, 0.02510, 0.79687),
            new CIEHorseshoeDataPoint(395, 0.17784, 0.02509, 0.79706),
            new CIEHorseshoeDataPoint(396, 0.17763, 0.02504, 0.79733),
            new CIEHorseshoeDataPoint(397, 0.17738, 0.02494, 0.79769),
            new CIEHorseshoeDataPoint(398, 0.17711, 0.02478, 0.79811),
            new CIEHorseshoeDataPoint(399, 0.17682, 0.02458, 0.79860),
            new CIEHorseshoeDataPoint(400, 0.17652, 0.02432, 0.79915),
            new CIEHorseshoeDataPoint(401, 0.17621, 0.02403, 0.79976),
            new CIEHorseshoeDataPoint(402, 0.17590, 0.02371, 0.80040),
            new CIEHorseshoeDataPoint(403, 0.17559, 0.02338, 0.80103),
            new CIEHorseshoeDataPoint(404, 0.17530, 0.02307, 0.80163),
            new CIEHorseshoeDataPoint(405, 0.17504, 0.02279, 0.80217),
            new CIEHorseshoeDataPoint(406, 0.17480, 0.02255, 0.80265),
            new CIEHorseshoeDataPoint(407, 0.17457, 0.02236, 0.80308),
            new CIEHorseshoeDataPoint(408, 0.17432, 0.02218, 0.80349),
            new CIEHorseshoeDataPoint(409, 0.17405, 0.02202, 0.80393),
            new CIEHorseshoeDataPoint(410, 0.17372, 0.02185, 0.80442),
            new CIEHorseshoeDataPoint(411, 0.17333, 0.02168, 0.80499),
            new CIEHorseshoeDataPoint(412, 0.17290, 0.02150, 0.80560),
            new CIEHorseshoeDataPoint(413, 0.17243, 0.02133, 0.80623),
            new CIEHorseshoeDataPoint(414, 0.17196, 0.02118, 0.80685),
            new CIEHorseshoeDataPoint(415, 0.17151, 0.02106, 0.80744),
            new CIEHorseshoeDataPoint(416, 0.17107, 0.02097, 0.80796),
            new CIEHorseshoeDataPoint(417, 0.17065, 0.02092, 0.80844),
            new CIEHorseshoeDataPoint(418, 0.17023, 0.02090, 0.80887),
            new CIEHorseshoeDataPoint(419, 0.16980, 0.02093, 0.80927),
            new CIEHorseshoeDataPoint(420, 0.16935, 0.02100, 0.80966),
            new CIEHorseshoeDataPoint(421, 0.16886, 0.02111, 0.81004),
            new CIEHorseshoeDataPoint(422, 0.16834, 0.02126, 0.81040),
            new CIEHorseshoeDataPoint(423, 0.16780, 0.02144, 0.81076),
            new CIEHorseshoeDataPoint(424, 0.16726, 0.02165, 0.81109),
            new CIEHorseshoeDataPoint(425, 0.16672, 0.02188, 0.81140),
            new CIEHorseshoeDataPoint(426, 0.16620, 0.02213, 0.81167),
            new CIEHorseshoeDataPoint(427, 0.16569, 0.02240, 0.81190),
            new CIEHorseshoeDataPoint(428, 0.16518, 0.02271, 0.81211),
            new CIEHorseshoeDataPoint(429, 0.16465, 0.02307, 0.81228),
            new CIEHorseshoeDataPoint(430, 0.16408, 0.02349, 0.81243),
            new CIEHorseshoeDataPoint(431, 0.16346, 0.02398, 0.81255),
            new CIEHorseshoeDataPoint(432, 0.16280, 0.02453, 0.81267),
            new CIEHorseshoeDataPoint(433, 0.16212, 0.02512, 0.81276),
            new CIEHorseshoeDataPoint(434, 0.16142, 0.02572, 0.81285),
            new CIEHorseshoeDataPoint(435, 0.16074, 0.02632, 0.81294),
            new CIEHorseshoeDataPoint(436, 0.16010, 0.02689, 0.81301),
            new CIEHorseshoeDataPoint(437, 0.15949, 0.02744, 0.81306),
            new CIEHorseshoeDataPoint(438, 0.15890, 0.02800, 0.81309),
            new CIEHorseshoeDataPoint(439, 0.15831, 0.02860, 0.81309),
            new CIEHorseshoeDataPoint(440, 0.15769, 0.02925, 0.81306),
            new CIEHorseshoeDataPoint(441, 0.15703, 0.02998, 0.81299),
            new CIEHorseshoeDataPoint(442, 0.15632, 0.03080, 0.81289),
            new CIEHorseshoeDataPoint(443, 0.15557, 0.03168, 0.81275),
            new CIEHorseshoeDataPoint(444, 0.15479, 0.03262, 0.81259),
            new CIEHorseshoeDataPoint(445, 0.15400, 0.03360, 0.81240),
            new CIEHorseshoeDataPoint(446, 0.15320, 0.03462, 0.81218),
            new CIEHorseshoeDataPoint(447, 0.15238, 0.03570, 0.81192),
            new CIEHorseshoeDataPoint(448, 0.15154, 0.03686, 0.81159),
            new CIEHorseshoeDataPoint(449, 0.15068, 0.03814, 0.81118),
            new CIEHorseshoeDataPoint(450, 0.14977, 0.03958, 0.81065),
            new CIEHorseshoeDataPoint(451, 0.14882, 0.04119, 0.80999),
            new CIEHorseshoeDataPoint(452, 0.14779, 0.04300, 0.80921),
            new CIEHorseshoeDataPoint(453, 0.14670, 0.04499, 0.80831),
            new CIEHorseshoeDataPoint(454, 0.14551, 0.04717, 0.80732),
            new CIEHorseshoeDataPoint(455, 0.14423, 0.04951, 0.80626),
            new CIEHorseshoeDataPoint(456, 0.14283, 0.05202, 0.80515),
            new CIEHorseshoeDataPoint(457, 0.14132, 0.05471, 0.80397),
            new CIEHorseshoeDataPoint(458, 0.13972, 0.05759, 0.80269),
            new CIEHorseshoeDataPoint(459, 0.13802, 0.06067, 0.80130),
            new CIEHorseshoeDataPoint(460, 0.13627, 0.06397, 0.79976),
            new CIEHorseshoeDataPoint(461, 0.13446, 0.06751, 0.79803),
            new CIEHorseshoeDataPoint(462, 0.13258, 0.07132, 0.79610),
            new CIEHorseshoeDataPoint(463, 0.13062, 0.07543, 0.79394),
            new CIEHorseshoeDataPoint(464, 0.12855, 0.07992, 0.79153),
            new CIEHorseshoeDataPoint(465, 0.12634, 0.08482, 0.78884),
            new CIEHorseshoeDataPoint(466, 0.12395, 0.09020, 0.78585),
            new CIEHorseshoeDataPoint(467, 0.12137, 0.09611, 0.78252),
            new CIEHorseshoeDataPoint(468, 0.11859, 0.10260, 0.77881),
            new CIEHorseshoeDataPoint(469, 0.11563, 0.10971, 0.77466),
            new CIEHorseshoeDataPoint(470, 0.11247, 0.11750, 0.77003),
            new CIEHorseshoeDataPoint(471, 0.10912, 0.12603, 0.76485),
            new CIEHorseshoeDataPoint(472, 0.10557, 0.13535, 0.75908),
            new CIEHorseshoeDataPoint(473, 0.10182, 0.14553, 0.75265),
            new CIEHorseshoeDataPoint(474, 0.09784, 0.15663, 0.74553),
            new CIEHorseshoeDataPoint(475, 0.09363, 0.16873, 0.73765),
            new CIEHorseshoeDataPoint(476, 0.08916, 0.18188, 0.72896),
            new CIEHorseshoeDataPoint(477, 0.08447, 0.19609, 0.71944),
            new CIEHorseshoeDataPoint(478, 0.07957, 0.21135, 0.70908),
            new CIEHorseshoeDataPoint(479, 0.07450, 0.22760, 0.69790),
            new CIEHorseshoeDataPoint(480, 0.06929, 0.24478, 0.68593),
            new CIEHorseshoeDataPoint(481, 0.06400, 0.26281, 0.67319),
            new CIEHorseshoeDataPoint(482, 0.05863, 0.28170, 0.65966),
            new CIEHorseshoeDataPoint(483, 0.05323, 0.30150, 0.64528),
            new CIEHorseshoeDataPoint(484, 0.04781, 0.32221, 0.62998),
            new CIEHorseshoeDataPoint(485, 0.04243, 0.34386, 0.61371),
            new CIEHorseshoeDataPoint(486, 0.03714, 0.36644, 0.59642),
            new CIEHorseshoeDataPoint(487, 0.03201, 0.38982, 0.57817),
            new CIEHorseshoeDataPoint(488, 0.02711, 0.41387, 0.55902),
            new CIEHorseshoeDataPoint(489, 0.02250, 0.43840, 0.53909),
            new CIEHorseshoeDataPoint(490, 0.01826, 0.46323, 0.51851),
            new CIEHorseshoeDataPoint(491, 0.01443, 0.48816, 0.49741),
            new CIEHorseshoeDataPoint(492, 0.01110, 0.51301, 0.47589),
            new CIEHorseshoeDataPoint(493, 0.00834, 0.53760, 0.45406),
            new CIEHorseshoeDataPoint(494, 0.00623, 0.56173, 0.43204),
            new CIEHorseshoeDataPoint(495, 0.00486, 0.58520, 0.40993),
            new CIEHorseshoeDataPoint(496, 0.00428, 0.60787, 0.38785),
            new CIEHorseshoeDataPoint(497, 0.00443, 0.62973, 0.36584),
            new CIEHorseshoeDataPoint(498, 0.00520, 0.65087, 0.34393),
            new CIEHorseshoeDataPoint(499, 0.00648, 0.67137, 0.32214),
            new CIEHorseshoeDataPoint(500, 0.00817, 0.69130, 0.30052),
            new CIEHorseshoeDataPoint(501, 0.01017, 0.71070, 0.27912),
            new CIEHorseshoeDataPoint(502, 0.01251, 0.72943, 0.25806),
            new CIEHorseshoeDataPoint(503, 0.01525, 0.74730, 0.23744),
            new CIEHorseshoeDataPoint(504, 0.01846, 0.76414, 0.21740),
            new CIEHorseshoeDataPoint(505, 0.02218, 0.77978, 0.19804),
            new CIEHorseshoeDataPoint(506, 0.02648, 0.79401, 0.17951),
            new CIEHorseshoeDataPoint(507, 0.03143, 0.80653, 0.16204),
            new CIEHorseshoeDataPoint(508, 0.03704, 0.81710, 0.14587),
            new CIEHorseshoeDataPoint(509, 0.04333, 0.82555, 0.13111),
            new CIEHorseshoeDataPoint(510, 0.05030, 0.83185, 0.11785),
            new CIEHorseshoeDataPoint(511, 0.05788, 0.83606, 0.10606),
            new CIEHorseshoeDataPoint(512, 0.06588, 0.83858, 0.09554),
            new CIEHorseshoeDataPoint(513, 0.07408, 0.83984, 0.08609),
            new CIEHorseshoeDataPoint(514, 0.08228, 0.84018, 0.07754),
            new CIEHorseshoeDataPoint(515, 0.09030, 0.83993, 0.06977),
            new CIEHorseshoeDataPoint(516, 0.09804, 0.83930, 0.06266),
            new CIEHorseshoeDataPoint(517, 0.10558, 0.83823, 0.05620),
            new CIEHorseshoeDataPoint(518, 0.11304, 0.83660, 0.05035),
            new CIEHorseshoeDataPoint(519, 0.12056, 0.83434, 0.04510),
            new CIEHorseshoeDataPoint(520, 0.12825, 0.83134, 0.04040),
            new CIEHorseshoeDataPoint(521, 0.13620, 0.82759, 0.03621),
            new CIEHorseshoeDataPoint(522, 0.14434, 0.82318, 0.03248),
            new CIEHorseshoeDataPoint(523, 0.15262, 0.81824, 0.02913),
            new CIEHorseshoeDataPoint(524, 0.16097, 0.81290, 0.02613),
            new CIEHorseshoeDataPoint(525, 0.16931, 0.80726, 0.02343),
            new CIEHorseshoeDataPoint(526, 0.17760, 0.80140, 0.02100),
            new CIEHorseshoeDataPoint(527, 0.18580, 0.79539, 0.01881),
            new CIEHorseshoeDataPoint(528, 0.19386, 0.78929, 0.01686),
            new CIEHorseshoeDataPoint(529, 0.20176, 0.78314, 0.01511),
            new CIEHorseshoeDataPoint(530, 0.20946, 0.77699, 0.01355),
            new CIEHorseshoeDataPoint(531, 0.21696, 0.77088, 0.01216),
            new CIEHorseshoeDataPoint(532, 0.22432, 0.76476, 0.01092),
            new CIEHorseshoeDataPoint(533, 0.23159, 0.75860, 0.00980),
            new CIEHorseshoeDataPoint(534, 0.23885, 0.75235, 0.00879),
            new CIEHorseshoeDataPoint(535, 0.24615, 0.74597, 0.00788),
            new CIEHorseshoeDataPoint(536, 0.25353, 0.73942, 0.00705),
            new CIEHorseshoeDataPoint(537, 0.26097, 0.73274, 0.00630),
            new CIEHorseshoeDataPoint(538, 0.26841, 0.72597, 0.00562),
            new CIEHorseshoeDataPoint(539, 0.27582, 0.71916, 0.00502),
            new CIEHorseshoeDataPoint(540, 0.28316, 0.71236, 0.00448),
            new CIEHorseshoeDataPoint(541, 0.29038, 0.70561, 0.00401),
            new CIEHorseshoeDataPoint(542, 0.29751, 0.69891, 0.00359),
            new CIEHorseshoeDataPoint(543, 0.30452, 0.69226, 0.00322),
            new CIEHorseshoeDataPoint(544, 0.31144, 0.68568, 0.00288),
            new CIEHorseshoeDataPoint(545, 0.31826, 0.67915, 0.00259),
            new CIEHorseshoeDataPoint(546, 0.32499, 0.67269, 0.00233),
            new CIEHorseshoeDataPoint(547, 0.33163, 0.66628, 0.00209),
            new CIEHorseshoeDataPoint(548, 0.33819, 0.65992, 0.00188),
            new CIEHorseshoeDataPoint(549, 0.34469, 0.65361, 0.00169),
            new CIEHorseshoeDataPoint(550, 0.35114, 0.64734, 0.00152),
            new CIEHorseshoeDataPoint(551, 0.35755, 0.64109, 0.00136),
            new CIEHorseshoeDataPoint(552, 0.36397, 0.63481, 0.00122),
            new CIEHorseshoeDataPoint(553, 0.37043, 0.62848, 0.00109),
            new CIEHorseshoeDataPoint(554, 0.37696, 0.62206, 0.00098),
            new CIEHorseshoeDataPoint(555, 0.38361, 0.61552, 0.00088),
            new CIEHorseshoeDataPoint(556, 0.39036, 0.60885, 0.00079),
            new CIEHorseshoeDataPoint(557, 0.39716, 0.60214, 0.00071),
            new CIEHorseshoeDataPoint(558, 0.40393, 0.59543, 0.00064),
            new CIEHorseshoeDataPoint(559, 0.41062, 0.58881, 0.00057),
            new CIEHorseshoeDataPoint(560, 0.41716, 0.58232, 0.00051),
            new CIEHorseshoeDataPoint(561, 0.42354, 0.57600, 0.00046),
            new CIEHorseshoeDataPoint(562, 0.42980, 0.56979, 0.00042),
            new CIEHorseshoeDataPoint(563, 0.43602, 0.56360, 0.00037),
            new CIEHorseshoeDataPoint(564, 0.44227, 0.55740, 0.00034),
            new CIEHorseshoeDataPoint(565, 0.44859, 0.55110, 0.00030),
            new CIEHorseshoeDataPoint(566, 0.45503, 0.54470, 0.00027),
            new CIEHorseshoeDataPoint(567, 0.46153, 0.53823, 0.00025),
            new CIEHorseshoeDataPoint(568, 0.46803, 0.53175, 0.00022),
            new CIEHorseshoeDataPoint(569, 0.47450, 0.52530, 0.00020),
            new CIEHorseshoeDataPoint(570, 0.48088, 0.51894, 0.00018),
            new CIEHorseshoeDataPoint(571, 0.48714, 0.51269, 0.00016),
            new CIEHorseshoeDataPoint(572, 0.49331, 0.50654, 0.00015),
            new CIEHorseshoeDataPoint(573, 0.49939, 0.50048, 0.00013),
            new CIEHorseshoeDataPoint(574, 0.50541, 0.49447, 0.00012),
            new CIEHorseshoeDataPoint(575, 0.51138, 0.48851, 0.00011),
            new CIEHorseshoeDataPoint(576, 0.51732, 0.48258, 0.00010),
            new CIEHorseshoeDataPoint(577, 0.52323, 0.47668, 0.00009),
            new CIEHorseshoeDataPoint(578, 0.52914, 0.47078, 0.00008),
            new CIEHorseshoeDataPoint(579, 0.53505, 0.46488, 0.00007),
            new CIEHorseshoeDataPoint(580, 0.54097, 0.45896, 0.00007),
            new CIEHorseshoeDataPoint(581, 0.54689, 0.45305, 0.00006),
            new CIEHorseshoeDataPoint(582, 0.55275, 0.44719, 0.00006),
            new CIEHorseshoeDataPoint(583, 0.55849, 0.44146, 0.00005),
            new CIEHorseshoeDataPoint(584, 0.56405, 0.43591, 0.00005),
            new CIEHorseshoeDataPoint(585, 0.56937, 0.43059, 0.00004),
            new CIEHorseshoeDataPoint(586, 0.57444, 0.42552, 0.00004),
            new CIEHorseshoeDataPoint(587, 0.57930, 0.42066, 0.00004),
            new CIEHorseshoeDataPoint(588, 0.58401, 0.41596, 0.00003),
            new CIEHorseshoeDataPoint(589, 0.58860, 0.41137, 0.00003),
            new CIEHorseshoeDataPoint(590, 0.59312, 0.40685, 0.00003),
            new CIEHorseshoeDataPoint(591, 0.59760, 0.40238, 0.00002),
            new CIEHorseshoeDataPoint(592, 0.60201, 0.39796, 0.00002),
            new CIEHorseshoeDataPoint(593, 0.60636, 0.39362, 0.00002),
            new CIEHorseshoeDataPoint(594, 0.61060, 0.38938, 0.00002),
            new CIEHorseshoeDataPoint(595, 0.61474, 0.38524, 0.00002),
            new CIEHorseshoeDataPoint(596, 0.61877, 0.38121, 0.00002),
            new CIEHorseshoeDataPoint(597, 0.62269, 0.37729, 0.00002),
            new CIEHorseshoeDataPoint(598, 0.62653, 0.37346, 0.00001),
            new CIEHorseshoeDataPoint(599, 0.63028, 0.36971, 0.00001),
            new CIEHorseshoeDataPoint(600, 0.63396, 0.36602, 0.00001),
            new CIEHorseshoeDataPoint(601, 0.63758, 0.36241, 0.00001),
            new CIEHorseshoeDataPoint(602, 0.64111, 0.35888, 0.00001),
            new CIEHorseshoeDataPoint(603, 0.64454, 0.35545, 0.00001),
            new CIEHorseshoeDataPoint(604, 0.64785, 0.35214, 0.00001),
            new CIEHorseshoeDataPoint(605, 0.65103, 0.34896, 0.00001),
            new CIEHorseshoeDataPoint(606, 0.65407, 0.34593, 0.00001),
            new CIEHorseshoeDataPoint(607, 0.65697, 0.34302, 0.00001),
            new CIEHorseshoeDataPoint(608, 0.65975, 0.34024, 0.00001),
            new CIEHorseshoeDataPoint(609, 0.66242, 0.33758, 0.00001),
            new CIEHorseshoeDataPoint(610, 0.66498, 0.33502, 0.00001),
            new CIEHorseshoeDataPoint(611, 0.66744, 0.33256, 0.00001),
            new CIEHorseshoeDataPoint(612, 0.66980, 0.33019, 0.00001),
            new CIEHorseshoeDataPoint(613, 0.67208, 0.32791, 0.00001),
            new CIEHorseshoeDataPoint(614, 0.67427, 0.32572, 0.00000),
            new CIEHorseshoeDataPoint(615, 0.67638, 0.32361, 0.00000),
            new CIEHorseshoeDataPoint(616, 0.67841, 0.32159, 0.00000),
            new CIEHorseshoeDataPoint(617, 0.68038, 0.31962, 0.00000),
            new CIEHorseshoeDataPoint(618, 0.68228, 0.31772, 0.00000),
            new CIEHorseshoeDataPoint(619, 0.68414, 0.31586, 0.00000),
            new CIEHorseshoeDataPoint(620, 0.68596, 0.31404, 0.00000),
            new CIEHorseshoeDataPoint(621, 0.68773, 0.31227, 0.00000),
            new CIEHorseshoeDataPoint(622, 0.68945, 0.31055, 0.00000),
            new CIEHorseshoeDataPoint(623, 0.69109, 0.30891, 0.00000),
            new CIEHorseshoeDataPoint(624, 0.69262, 0.30738, 0.00000),
            new CIEHorseshoeDataPoint(625, 0.69405, 0.30595, 0.00000),
            new CIEHorseshoeDataPoint(626, 0.69535, 0.30465, 0.00000),
            new CIEHorseshoeDataPoint(627, 0.69656, 0.30344, 0.00000),
            new CIEHorseshoeDataPoint(628, 0.69768, 0.30232, 0.00000),
            new CIEHorseshoeDataPoint(629, 0.69875, 0.30125, 0.00000),
            new CIEHorseshoeDataPoint(630, 0.69977, 0.30023, 0.00000),
            new CIEHorseshoeDataPoint(631, 0.70077, 0.29923, 0.00000),
            new CIEHorseshoeDataPoint(632, 0.70174, 0.29826, 0.00000),
            new CIEHorseshoeDataPoint(633, 0.70268, 0.29732, 0.00000),
            new CIEHorseshoeDataPoint(634, 0.70359, 0.29641, 0.00000),
            new CIEHorseshoeDataPoint(635, 0.70447, 0.29553, 0.00000),
            new CIEHorseshoeDataPoint(636, 0.70533, 0.29467, 0.00000),
            new CIEHorseshoeDataPoint(637, 0.70618, 0.29382, 0.00000),
            new CIEHorseshoeDataPoint(638, 0.70702, 0.29298, 0.00000),
            new CIEHorseshoeDataPoint(639, 0.70786, 0.29214, 0.00000),
            new CIEHorseshoeDataPoint(640, 0.70871, 0.29129, 0.00000),
            new CIEHorseshoeDataPoint(641, 0.70957, 0.29043, 0.00000),
            new CIEHorseshoeDataPoint(642, 0.71042, 0.28958, 0.00000),
            new CIEHorseshoeDataPoint(643, 0.71122, 0.28878, 0.00000),
            new CIEHorseshoeDataPoint(644, 0.71195, 0.28805, 0.00000),
            new CIEHorseshoeDataPoint(645, 0.71259, 0.28741, 0.00000),
            new CIEHorseshoeDataPoint(646, 0.71312, 0.28688, 0.00000),
            new CIEHorseshoeDataPoint(647, 0.71356, 0.28644, 0.00000),
            new CIEHorseshoeDataPoint(648, 0.71395, 0.28605, 0.00000),
            new CIEHorseshoeDataPoint(649, 0.71431, 0.28569, 0.00000),
            new CIEHorseshoeDataPoint(650, 0.71465, 0.28535, 0.00000),
            new CIEHorseshoeDataPoint(651, 0.71501, 0.28499, 0.00000),
            new CIEHorseshoeDataPoint(652, 0.71537, 0.28463, 0.00000),
            new CIEHorseshoeDataPoint(653, 0.71574, 0.28426, 0.00000),
            new CIEHorseshoeDataPoint(654, 0.71611, 0.28389, 0.00000),
            new CIEHorseshoeDataPoint(655, 0.71648, 0.28352, 0.00000),
            new CIEHorseshoeDataPoint(656, 0.71685, 0.28315, 0.00000),
            new CIEHorseshoeDataPoint(657, 0.71721, 0.28279, 0.00000),
            new CIEHorseshoeDataPoint(658, 0.71756, 0.28244, 0.00000),
            new CIEHorseshoeDataPoint(659, 0.71791, 0.28209, 0.00000),
            new CIEHorseshoeDataPoint(660, 0.71824, 0.28176, 0.00000),
            new CIEHorseshoeDataPoint(661, 0.71857, 0.28143, 0.00000),
            new CIEHorseshoeDataPoint(662, 0.71887, 0.28113, 0.00000),
            new CIEHorseshoeDataPoint(663, 0.71916, 0.28084, 0.00000),
            new CIEHorseshoeDataPoint(664, 0.71943, 0.28057, 0.00000),
            new CIEHorseshoeDataPoint(665, 0.71967, 0.28033, 0.00000),
            new CIEHorseshoeDataPoint(666, 0.71988, 0.28012, 0.00000),
            new CIEHorseshoeDataPoint(667, 0.72007, 0.27993, 0.00000),
            new CIEHorseshoeDataPoint(668, 0.72024, 0.27976, 0.00000),
            new CIEHorseshoeDataPoint(669, 0.72039, 0.27961, 0.00000),
            new CIEHorseshoeDataPoint(670, 0.72054, 0.27946, 0.00000),
            new CIEHorseshoeDataPoint(671, 0.72067, 0.27933, 0.00000),
            new CIEHorseshoeDataPoint(672, 0.72080, 0.27920, 0.00000),
            new CIEHorseshoeDataPoint(673, 0.72093, 0.27907, 0.00000),
            new CIEHorseshoeDataPoint(674, 0.72104, 0.27896, 0.00000),
            new CIEHorseshoeDataPoint(675, 0.72115, 0.27885, 0.00000),
            new CIEHorseshoeDataPoint(676, 0.72125, 0.27875, 0.00000),
            new CIEHorseshoeDataPoint(677, 0.72134, 0.27866, 0.00000),
            new CIEHorseshoeDataPoint(678, 0.72143, 0.27857, 0.00000),
            new CIEHorseshoeDataPoint(679, 0.72151, 0.27849, 0.00000),
            new CIEHorseshoeDataPoint(680, 0.72158, 0.27842, 0.00000),
            new CIEHorseshoeDataPoint(681, 0.72165, 0.27835, 0.00000),
            new CIEHorseshoeDataPoint(682, 0.72171, 0.27829, 0.00000),
            new CIEHorseshoeDataPoint(683, 0.72177, 0.27823, 0.00000),
            new CIEHorseshoeDataPoint(684, 0.72183, 0.27817, 0.00000),
            new CIEHorseshoeDataPoint(685, 0.72187, 0.27813, 0.00000),
            new CIEHorseshoeDataPoint(686, 0.72192, 0.27808, 0.00000),
            new CIEHorseshoeDataPoint(687, 0.72195, 0.27805, 0.00000),
            new CIEHorseshoeDataPoint(688, 0.72199, 0.27801, 0.00000),
            new CIEHorseshoeDataPoint(689, 0.72202, 0.27798, 0.00000),
            new CIEHorseshoeDataPoint(690, 0.72205, 0.27795, 0.00000),
            new CIEHorseshoeDataPoint(691, 0.72208, 0.27792, 0.00000),
            new CIEHorseshoeDataPoint(692, 0.72211, 0.27789, 0.00000),
            new CIEHorseshoeDataPoint(693, 0.72213, 0.27787, 0.00000),
            new CIEHorseshoeDataPoint(694, 0.72215, 0.27785, 0.00000),
            new CIEHorseshoeDataPoint(695, 0.72217, 0.27783, 0.00000),
            new CIEHorseshoeDataPoint(696, 0.72218, 0.27782, 0.00000),
            new CIEHorseshoeDataPoint(697, 0.72218, 0.27782, 0.00000),
            new CIEHorseshoeDataPoint(698, 0.72219, 0.27781, 0.00000),
            new CIEHorseshoeDataPoint(699, 0.72219, 0.27781, 0.00000),
            new CIEHorseshoeDataPoint(700, 0.72219, 0.27781, 0.00000),
            new CIEHorseshoeDataPoint(701, 0.72219, 0.27781, 0.00000),
            new CIEHorseshoeDataPoint(702, 0.72219, 0.27781, 0.00000),
            new CIEHorseshoeDataPoint(703, 0.72219, 0.27781, 0.00000),
            new CIEHorseshoeDataPoint(704, 0.72219, 0.27781, 0.00000),
            new CIEHorseshoeDataPoint(705, 0.72219, 0.27781, 0.00000),
            new CIEHorseshoeDataPoint(706, 0.72218, 0.27782, 0.00000),
            new CIEHorseshoeDataPoint(707, 0.72217, 0.27783, 0.00000),
            new CIEHorseshoeDataPoint(708, 0.72216, 0.27784, 0.00000),
            new CIEHorseshoeDataPoint(709, 0.72215, 0.27785, 0.00000),
            new CIEHorseshoeDataPoint(710, 0.72213, 0.27787, 0.00000),
            new CIEHorseshoeDataPoint(711, 0.72210, 0.27790, 0.00000),
            new CIEHorseshoeDataPoint(712, 0.72207, 0.27793, 0.00000),
            new CIEHorseshoeDataPoint(713, 0.72204, 0.27796, 0.00000),
            new CIEHorseshoeDataPoint(714, 0.72201, 0.27799, 0.00000),
            new CIEHorseshoeDataPoint(715, 0.72198, 0.27802, 0.00000),
            new CIEHorseshoeDataPoint(716, 0.72195, 0.27805, 0.00000),
            new CIEHorseshoeDataPoint(717, 0.72192, 0.27808, 0.00000),
            new CIEHorseshoeDataPoint(718, 0.72189, 0.27811, 0.00000),
            new CIEHorseshoeDataPoint(719, 0.72185, 0.27815, 0.00000),
            new CIEHorseshoeDataPoint(720, 0.72182, 0.27818, 0.00000),
            new CIEHorseshoeDataPoint(721, 0.72179, 0.27821, 0.00000),
            new CIEHorseshoeDataPoint(722, 0.72175, 0.27825, 0.00000),
            new CIEHorseshoeDataPoint(723, 0.72171, 0.27829, 0.00000),
            new CIEHorseshoeDataPoint(724, 0.72167, 0.27833, 0.00000),
            new CIEHorseshoeDataPoint(725, 0.72163, 0.27837, 0.00000),
            new CIEHorseshoeDataPoint(726, 0.72159, 0.27841, 0.00000),
            new CIEHorseshoeDataPoint(727, 0.72155, 0.27845, 0.00000),
            new CIEHorseshoeDataPoint(728, 0.72151, 0.27849, 0.00000),
            new CIEHorseshoeDataPoint(729, 0.72147, 0.27853, 0.00000),
            new CIEHorseshoeDataPoint(730, 0.72142, 0.27858, 0.00000),
            new CIEHorseshoeDataPoint(731, 0.72138, 0.27862, 0.00000),
            new CIEHorseshoeDataPoint(732, 0.72134, 0.27866, 0.00000),
            new CIEHorseshoeDataPoint(733, 0.72130, 0.27870, 0.00000),
            new CIEHorseshoeDataPoint(734, 0.72125, 0.27875, 0.00000),
            new CIEHorseshoeDataPoint(735, 0.72120, 0.27880, 0.00000),
            new CIEHorseshoeDataPoint(736, 0.72115, 0.27885, 0.00000),
            new CIEHorseshoeDataPoint(737, 0.72109, 0.27891, 0.00000),
            new CIEHorseshoeDataPoint(738, 0.72104, 0.27896, 0.00000),
            new CIEHorseshoeDataPoint(739, 0.72097, 0.27903, 0.00000),
            new CIEHorseshoeDataPoint(740, 0.72091, 0.27909, 0.00000),
            new CIEHorseshoeDataPoint(741, 0.72084, 0.27916, 0.00000),
            new CIEHorseshoeDataPoint(742, 0.72078, 0.27922, 0.00000),
            new CIEHorseshoeDataPoint(743, 0.72071, 0.27929, 0.00000),
            new CIEHorseshoeDataPoint(744, 0.72064, 0.27936, 0.00000),
            new CIEHorseshoeDataPoint(745, 0.72057, 0.27943, 0.00000),
            new CIEHorseshoeDataPoint(746, 0.72050, 0.27950, 0.00000),
            new CIEHorseshoeDataPoint(747, 0.72043, 0.27957, 0.00000),
            new CIEHorseshoeDataPoint(748, 0.72036, 0.27964, 0.00000),
            new CIEHorseshoeDataPoint(749, 0.72029, 0.27971, 0.00000),
            new CIEHorseshoeDataPoint(750, 0.72022, 0.27978, 0.00000),
            new CIEHorseshoeDataPoint(751, 0.72015, 0.27985, 0.00000),
            new CIEHorseshoeDataPoint(752, 0.72009, 0.27991, 0.00000),
            new CIEHorseshoeDataPoint(753, 0.72002, 0.27998, 0.00000),
            new CIEHorseshoeDataPoint(754, 0.71995, 0.28005, 0.00000),
            new CIEHorseshoeDataPoint(755, 0.71988, 0.28012, 0.00000),
            new CIEHorseshoeDataPoint(756, 0.71980, 0.28020, 0.00000),
            new CIEHorseshoeDataPoint(757, 0.71973, 0.28027, 0.00000),
            new CIEHorseshoeDataPoint(758, 0.71965, 0.28035, 0.00000),
            new CIEHorseshoeDataPoint(759, 0.71958, 0.28042, 0.00000),
            new CIEHorseshoeDataPoint(760, 0.71950, 0.28050, 0.00000),
            new CIEHorseshoeDataPoint(761, 0.71943, 0.28057, 0.00000),
            new CIEHorseshoeDataPoint(762, 0.71935, 0.28065, 0.00000),
            new CIEHorseshoeDataPoint(763, 0.71928, 0.28072, 0.00000),
            new CIEHorseshoeDataPoint(764, 0.71921, 0.28079, 0.00000),
            new CIEHorseshoeDataPoint(765, 0.71915, 0.28085, 0.00000),
            new CIEHorseshoeDataPoint(766, 0.71908, 0.28092, 0.00000),
            new CIEHorseshoeDataPoint(767, 0.71901, 0.28099, 0.00000),
            new CIEHorseshoeDataPoint(768, 0.71894, 0.28106, 0.00000),
            new CIEHorseshoeDataPoint(769, 0.71888, 0.28112, 0.00000),
            new CIEHorseshoeDataPoint(770, 0.71881, 0.28119, 0.00000),
            new CIEHorseshoeDataPoint(771, 0.71874, 0.28126, 0.00000),
            new CIEHorseshoeDataPoint(772, 0.71867, 0.28133, 0.00000),
            new CIEHorseshoeDataPoint(773, 0.71860, 0.28140, 0.00000),
            new CIEHorseshoeDataPoint(774, 0.71852, 0.28148, 0.00000),
            new CIEHorseshoeDataPoint(775, 0.71845, 0.28155, 0.00000),
            new CIEHorseshoeDataPoint(776, 0.71838, 0.28162, 0.00000),
            new CIEHorseshoeDataPoint(777, 0.71830, 0.28170, 0.00000),
            new CIEHorseshoeDataPoint(778, 0.71822, 0.28178, 0.00000),
            new CIEHorseshoeDataPoint(779, 0.71814, 0.28186, 0.00000),
            new CIEHorseshoeDataPoint(780, 0.71807, 0.28193, 0.00000),
            new CIEHorseshoeDataPoint(781, 0.71799, 0.28201, 0.00000),
            new CIEHorseshoeDataPoint(782, 0.71791, 0.28209, 0.00000),
            new CIEHorseshoeDataPoint(783, 0.71783, 0.28217, 0.00000),
            new CIEHorseshoeDataPoint(784, 0.71775, 0.28225, 0.00000),
            new CIEHorseshoeDataPoint(785, 0.71766, 0.28234, 0.00000),
            new CIEHorseshoeDataPoint(786, 0.71758, 0.28242, 0.00000),
            new CIEHorseshoeDataPoint(787, 0.71750, 0.28250, 0.00000),
            new CIEHorseshoeDataPoint(788, 0.71742, 0.28258, 0.00000),
            new CIEHorseshoeDataPoint(789, 0.71733, 0.28267, 0.00000),
            new CIEHorseshoeDataPoint(790, 0.71725, 0.28275, 0.00000),
            new CIEHorseshoeDataPoint(791, 0.71716, 0.28284, 0.00000),
            new CIEHorseshoeDataPoint(792, 0.71708, 0.28292, 0.00000),
            new CIEHorseshoeDataPoint(793, 0.71699, 0.28301, 0.00000),
            new CIEHorseshoeDataPoint(794, 0.71690, 0.28310, 0.00000),
            new CIEHorseshoeDataPoint(795, 0.71681, 0.28319, 0.00000),
            new CIEHorseshoeDataPoint(796, 0.71671, 0.28329, 0.00000),
            new CIEHorseshoeDataPoint(797, 0.71661, 0.28339, 0.00000),
            new CIEHorseshoeDataPoint(798, 0.71651, 0.28349, 0.00000),
            new CIEHorseshoeDataPoint(799, 0.71641, 0.28359, 0.00000),
            new CIEHorseshoeDataPoint(800, 0.71630, 0.28370, 0.00000),
            new CIEHorseshoeDataPoint(801, 0.71619, 0.28381, 0.00000),
            new CIEHorseshoeDataPoint(802, 0.71609, 0.28391, 0.00000),
            new CIEHorseshoeDataPoint(803, 0.71598, 0.28402, 0.00000),
            new CIEHorseshoeDataPoint(804, 0.71588, 0.28412, 0.00000),
            new CIEHorseshoeDataPoint(805, 0.71577, 0.28423, 0.00000),
            new CIEHorseshoeDataPoint(806, 0.71566, 0.28434, 0.00000),
            new CIEHorseshoeDataPoint(807, 0.71556, 0.28444, 0.00000),
            new CIEHorseshoeDataPoint(808, 0.71545, 0.28455, 0.00000),
            new CIEHorseshoeDataPoint(809, 0.71534, 0.28466, 0.00000),
            new CIEHorseshoeDataPoint(810, 0.71523, 0.28477, 0.00000),
            new CIEHorseshoeDataPoint(811, 0.71513, 0.28487, 0.00000),
            new CIEHorseshoeDataPoint(812, 0.71502, 0.28498, 0.00000),
            new CIEHorseshoeDataPoint(813, 0.71491, 0.28509, 0.00000),
            new CIEHorseshoeDataPoint(814, 0.71480, 0.28520, 0.00000),
            new CIEHorseshoeDataPoint(815, 0.71469, 0.28531, 0.00000),
            new CIEHorseshoeDataPoint(816, 0.71459, 0.28541, 0.00000),
            new CIEHorseshoeDataPoint(817, 0.71449, 0.28551, 0.00000),
            new CIEHorseshoeDataPoint(818, 0.71438, 0.28562, 0.00000),
            new CIEHorseshoeDataPoint(819, 0.71428, 0.28572, 0.00000),
            new CIEHorseshoeDataPoint(820, 0.71418, 0.28582, 0.00000),
            new CIEHorseshoeDataPoint(821, 0.71409, 0.28591, 0.00000),
            new CIEHorseshoeDataPoint(822, 0.71400, 0.28600, 0.00000),
            new CIEHorseshoeDataPoint(823, 0.71391, 0.28609, 0.00000),
            new CIEHorseshoeDataPoint(824, 0.71382, 0.28618, 0.00000),
            new CIEHorseshoeDataPoint(825, 0.71373, 0.28627, 0.00000),
            new CIEHorseshoeDataPoint(826, 0.71365, 0.28635, 0.00000),
            new CIEHorseshoeDataPoint(827, 0.71358, 0.28642, 0.00000),
            new CIEHorseshoeDataPoint(828, 0.71350, 0.28650, 0.00000),
            new CIEHorseshoeDataPoint(829, 0.71343, 0.28657, 0.00000),
            new CIEHorseshoeDataPoint(830, 0.71336, 0.28664, 0.00000),
        ];
    }
}
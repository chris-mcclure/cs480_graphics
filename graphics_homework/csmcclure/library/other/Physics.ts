

class SimpleHarmonicMotion {
    private t0: number = 0;
    private t1: number = 0;
    private dt: number = 0;
    public v: number = 0;
    public E: number = 0;
    constructor(public k: number, public p: Vector3, public x: number, public m: number = 1.53) {
        //this.E = x * m * 9.8;
        this.reset(x);
    }

    reset(x: number) {
        this.x = 0;
        this.v = 0;
        // mg = 1/2 kx
        // x = 2mg/k
        this.E = (2 * this.m * 9.8) / this.k * this.m * 9.8;
    }

    get maxTravel(): number { return this.E / (this.m * 9.8); }

    update(tInSeconds: number) {
        if (this.t0 == 0) this.t0 = tInSeconds;
        this.t0 = this.t1;
        this.t1 = tInSeconds;
        let dt = this.dt = this.t1 - this.t0;

        let F = -this.k * this.x - 9.8 * this.m;
        let a = F / this.m;
        let vnew = a * dt + this.v;

        let xnew = this.x + vnew * dt;

        let K1: number = 0.5 * this.m * Math.pow(this.v, 2);
        let U1: number = this.x * this.m * 9.8;

        let K2: number = 0.5 * this.m * Math.pow(vnew, 2);
        let U2: number = xnew * this.m * 9.8

        xnew = GTE.clamp(xnew, -2 * 9.8 * this.m / this.k, 2 * 9.8 * this.m / this.k);

        this.v = vnew;
        this.x = xnew;

        // limit energy to starting location and displacement of the spring
    }

    getTransform(): Matrix4 {
        return Matrix4.makeTranslation(this.p.x, this.p.y + this.x * 0.05, this.p.z);
    }
}


namespace GTE {
    export function rev(angleInDegrees: number): number {
        return angleInDegrees - Math.floor(angleInDegrees / 360.0) * 360.0;
    }

    export function wrap(x: number, b: number): number {
        let xp = x - Math.floor(x / b) * b;
        if (xp < 0) return xp + b;
        return xp;
    }

    export const toDegrees = 180.0 / Math.PI;
    export const toRadians = Math.PI / 180.0;
}


class SunMotion {
    private obliquityOfEcliptic: number = 23.439167;
    private transformMatrix: Matrix4 = Matrix4.makeIdentity();
    private _dirto: Vector3 = Vector3.make(0.0, 1.0, 0.0);
    constructor(private latitude: number, private longitude: number) {

    }

    public lambda: number = 0;
    public r: number = 0;
    public trueAnomaly: number = 0;
    public tDays: number = 0;
    public tCenturies: number = 0;
    public siderealTime: number = 0;
    public GMST0: number = 0;
    public trueLongitude: number = 0;
    public longitudeOfPerihelion: number = 0;
    public meanAnomaly: number = 0;
    public RA: number = 0;
    public HA: number = 0;
    public Decl: number = 0;
    public LST: number = 0;
    public GST: number = 0;
    public azimuth: number = 0;
    public altitude: number = 0;
    public eclipticV: Vector3 = new Vector3();

    update(t: number): Vector3 {
        //let JD = 
        const toDegrees = 180.0 / Math.PI;
        const toRadians = Math.PI / 180.0;

        let d: number = t / 86400.0; // (days since J2000.0)
        this.tDays = d;
        this.tCenturies = AstroCalc.makeCenturiesFromJ2000(d);

        let w = GTE.rev(282.9404 + 4.70935E-5 * this.tDays); // (longitude of perihelion)
        let a = AstroCalcNOAA.calcSunRadVector(this.tCenturies); // (mean distance, a.u.)
        let e = AstroCalcNOAA.calcEccentricityEarthOrbit(this.tCenturies);
        let M = AstroCalcNOAA.calcGeomMeanAnomalySun(this.tCenturies);//GTE.rev(356.0470 + 0.9856002585 * d); // (mean anomaly)
        let oblecl = AstroCalcNOAA.calcMeanObliquityOfEcliptic(this.tCenturies);// GTE.rev(23.4393 - 3.563E-7 * d); // (obliquity of the ecliptic)
        let L = GTE.rev(w + M);
        let E = M + (180 / Math.PI) * e * Math.sin(M * toRadians) * (1 + e * Math.cos(M * toRadians));
        let x = Math.cos(E * toRadians) - e;
        let y = Math.sin(E * toRadians) * Math.sqrt(1 - e * e);
        let r = this.r = Math.sqrt(x * x + y * y); // distance
        let v = this.trueAnomaly = GTE.rev(Math.atan2(y, x) * toDegrees); // true anomaly
        let lon = this.trueLongitude = GTE.rev(w + v);
        this.lambda = lon;
        this.meanAnomaly = M;
        this.longitudeOfPerihelion = w;
        this.obliquityOfEcliptic = oblecl;

        this.GST = AstroCalc.makeGSTfromJ2000(d);
        this.LST = AstroCalc.makeLSTfromJD(d, this.longitude);
        this.GMST0 = GTE.wrap(L / 15 + 12, 24.0); // hours
        this.siderealTime = this.GMST0 + 24 * (d - Math.floor(d)) + this.longitude / 15;

        let sunecl_x = r * Math.cos(this.trueLongitude * toRadians);
        let sunecl_y = r * Math.sin(this.trueLongitude * toRadians);
        let sunecl_z = 0;

        let sunecl = Vector3.make(
            r * Math.cos(this.trueLongitude * toRadians),
            r * Math.sin(this.trueLongitude * toRadians),
            0
        );

        let suneq = AstroCalc.makeEquatorialfromEcliptic(sunecl, oblecl);
        this.r = suneq.length();
        this.RA = AstroCalc.makeRAfromEquatorial(suneq);
        this.Decl = AstroCalc.makeDeclfromEquatorial(suneq);
        this.HA = GTE.rev(this.LST * 15 - this.RA);
        let vHADecl = Vector3.make(
            Math.cos(this.HA * toRadians) * Math.cos(this.Decl * toRadians),
            Math.sin(this.HA * toRadians) * Math.cos(this.Decl * toRadians),
            Math.sin(this.Decl * toRadians)
        );
        let vHor = Vector3.make(
            vHADecl.x * Math.cos((90.0 - this.latitude) * toRadians) - vHADecl.z * Math.sin((90.0 - this.latitude) * toRadians),
            vHADecl.y,
            vHADecl.x * Math.sin((90.0 - this.latitude) * toRadians) + vHADecl.z * Math.cos((90.0 - this.latitude) * toRadians),
        );

        this.azimuth = Math.atan2(vHor.y, vHor.x) * toDegrees + 180.0;
        this.altitude = Math.asin(vHor.z) * toDegrees;

        this._dirto = AstroCalc.makeRHfromEcliptic(sunecl, this.LST, oblecl, this.latitude, this.longitude);
        return this._dirto;
    }

    get dirTo(): Vector3 { return this._dirto.norm(); }
}


class MoonMotion {
    private obliquityOfEcliptic: number = 23.439167;
    private transformMatrix: Matrix4 = Matrix4.makeIdentity();
    private _dirto: Vector3 = Vector3.make(0.0, 1.0, 0.0);
    public moonAge: number = 0;
    public moonPhase: number = 0;
    public moonE0: Vector3 = new Vector3();

    constructor(private latitude: number, private longitude: number) {

    }

    update(t: number) {
        //let JD = 
        const toDegrees = 180.0 / Math.PI;
        const toRadians = Math.PI / 180.0;
        let d: number = t / 86400.0;//JD - 2451545.0;

        let N = toRadians * GTE.rev(125.1228 - 0.0529538083 * d); // (Long asc. node)
        let i = toRadians * 5.1454; // (Inclination)
        let w = toRadians * GTE.rev(318.0634 + 0.1643573223 * d); // (Arg. of perigee)
        let a = 60.2666; // (Mean distance)
        let e = 0.054900; // (Eccentricity)
        let M = GTE.rev(115.3654 + 13.0649929509 * d); // (Mean anomaly)
        let E = AstroCalc.kepler(M, e);

        let x = a * (Math.cos(toRadians * E) - e)
        let y = a * Math.sqrt(1 - e * e) * Math.sin(toRadians * E)
        let r = Math.sqrt(x * x + y * y);
        let v = Math.atan2(y, x);

        let v_ecliptic = Vector3.make(
            r * (Math.cos(N) * Math.cos(v + w) - Math.sin(N) * Math.sin(v + w) * Math.cos(i)),
            r * (Math.sin(N) * Math.cos(v + w) + Math.cos(N) * Math.sin(v + w) * Math.cos(i)),
            r * Math.sin(v + w) * Math.sin(i)
        );

        let LST = AstroCalc.makeLSTfromJD(d, this.longitude);
        let oblecl = AstroCalc.getMeanObliquityOfEcliptic(d);

        this._dirto = AstroCalc.makeRHfromEcliptic(v_ecliptic, LST, oblecl, this.latitude, this.longitude);

        let j = AstroCalc.J2000 + d;
        //Calculate the approximate phase of the moon
        let ip = (j + 4.867) / 29.53059;
        ip = ip - Math.floor(ip);
        //After several trials I've seen to add the following lines, 
        //which gave the result was not bad 
        let ag = 0;
        if (ip < 0.5)
            ag = ip * 29.53059 + 29.53059 / 2;
        else
            ag = ip * 29.53059 - 29.53059 / 2;
        // Moon's age in days
        ag = Math.floor(ag) + 1;
        this.moonPhase = ip;
        this.moonAge = ag;
        this.moonE0 = Vector3.make(0.2 * ip, 0.2 * ip, ip);

        // let m: Matrix3 = Matrix3.makeIdentity();
        // let cosphi = Math.cos(this.latitude * toRadians);
        // let sinphi = Math.sin(this.latitude * toRadians);
        // let cose = Math.cos(e * toRadians);
        // let sine = Math.sin(e * toRadians);
        // let coso = Math.cos(this.longitude * toRadians);
        // let sino = Math.sin(this.longitude * toRadians);
        // m.LoadIdentity();
        // m.LoadRowMajor(
        //     -sinphi * coso, sine * cosphi - cose * sinphi * sino, sine * sinphi * sino + cose * cosphi,
        //     -cosphi * coso, -cose * cosphi * sino - sine * sinphi, sine * cosphi * sino - cose * sinphi,
        //     -sino, cose * coso, -sine * coso
        // );
        // this.transformMatrix = m.toMatrix4();
        // this._dirto = m.transform(v_ecliptic);
    }

    get dirTo(): Vector3 { return this._dirto.norm(); }
}
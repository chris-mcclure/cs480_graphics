

namespace AstroCalc {
    export const J2000: number = 2451545.0;

    export function makeJD(d: Date): number {
        let Y = d.getUTCFullYear();
        let M = d.getUTCMonth() + 1;
        let D = d.getUTCDate();
        let JD = 367 * Y - Math.floor((7 * (Y + Math.floor((M + 9) / 12))) / 4) + Math.floor((275 * M) / 9) + D - 730530;
        return JD;

        // if (M <= 2) {
        //     Y--;
        //     M += 12;
        // }
        // let A = Math.floor(Y / 100);
        // let B = 2 - A + Math.floor(A / 44);
        // let JD = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5;
        // return JD;
    }

    export function makeUT(d: Date): number {
        let SS = d.getUTCSeconds() + d.getUTCMilliseconds() / 1000.0;
        let MM = d.getUTCMinutes() + SS / 60.0;
        let HH = d.getUTCHours() + MM / 60.0;
        let UT = HH / 24.0;
        return UT;
    }

    export function makeCenturiesFromJ2000(daysSinceJ2000: number): number {
        return daysSinceJ2000 / 36525.0;
    }

    export function makeGSTfromJ2000(daysSinceJ2000: number): number {
        let T = makeCenturiesFromJ2000(daysSinceJ2000);
        let T0 = GTE.wrap(6.697374558 + (2400.051336 * T) + (0.000025862 * T * T), 24.0);
        let UT = 24 * (daysSinceJ2000 - Math.floor(daysSinceJ2000));
        let A = 1.002737909 * UT;
        return GTE.wrap(T0 + UT, 24.0);
    }

    export function makeLSTfromJD(daysSinceJ2000: number, longitudeInDegrees: number): number {
        return GTE.wrap(makeGSTfromJ2000(daysSinceJ2000) + longitudeInDegrees / 15, 24.0);
    }

    export function makeEquatorialfromEcliptic(v: Vector3, oblecl: number): Vector3 {
        // xequat = [ 1           0            0 ] [ xeclip ]
        // yequat = [ 0 cos(oblecl) -sin(oblecl) ] [ yeclip ]
        // zequat = [ 0 sin(oblecl)  cos(oblecl) ] [ zeclip ]
        return Vector3.make(
            v.x,
            v.y * Math.cos(oblecl * GTE.toRadians) - v.z * Math.sin(oblecl * GTE.toRadians),
            v.y * Math.sin(oblecl * GTE.toRadians) + v.z * Math.cos(oblecl * GTE.toRadians)
        );
    }


    export function makeRAfromEquatorial(v: Vector3): number {
        // r    = sqrt( x*x + y*y + z*z )
        // RA   = atan2( y, x )
        // Decl = asin( z / r ) = atan2( z, sqrt( x*x + y*y ) )   
        let r = Math.sqrt(v.x * v.x + v.y * v.y);
        let RA = GTE.rev(Math.atan2(v.y, v.x) * GTE.toDegrees);
        let Decl = Math.atan2(v.z, r) * GTE.toDegrees;
        return RA;
    }

    export function makeDeclfromEquatorial(v: Vector3): number {
        // r    = sqrt( x*x + y*y + z*z )
        // RA   = atan2( y, x )
        // Decl = asin( z / r ) = atan2( z, sqrt( x*x + y*y ) )   
        let r = Math.sqrt(v.x * v.x + v.y * v.y);
        let RA = GTE.rev(Math.atan2(v.y, v.x) * GTE.toDegrees);
        let Decl = Math.atan2(v.z, r) * GTE.toDegrees;
        return Decl;
    }


    export function makeRHfromEcliptic(v: Vector3, LST: number, oblecl: number, earthLatitude: number, earthLongitude: number): Vector3 {
        // xequat = [ 1           0            0 ] [ xeclip ]
        // yequat = [ 0 cos(oblecl) -sin(oblecl) ] [ yeclip ]
        // zequat = [ 0 sin(oblecl)  cos(oblecl) ] [ zeclip ]
        let eq = Vector3.make(
            v.x,
            v.y * Math.cos(oblecl * GTE.toRadians) - v.z * Math.sin(oblecl * GTE.toRadians),
            v.y * Math.sin(oblecl * GTE.toRadians) + v.z * Math.cos(oblecl * GTE.toRadians)
        );

        // r    = sqrt( x*x + y*y + z*z )
        // RA   = atan2( y, x )
        // Decl = asin( z / r ) = atan2( z, sqrt( x*x + y*y ) )   
        let r = Math.sqrt(eq.x * eq.x + eq.y * eq.y);
        let RA = GTE.rev(Math.atan2(eq.y, eq.x) * GTE.toDegrees);
        let Decl = Math.atan2(eq.z, r) * GTE.toDegrees;
        let HA = GTE.rev(LST * 15 - RA);

        // x = cos(HA) * cos(Decl) = -0.947346
        // y = sin(HA) * cos(Decl) = -0.257047
        // z = sin(Decl)           = +0.190953
        let vHADecl = Vector3.make(
            Math.cos(HA * GTE.toRadians) * Math.cos(Decl * GTE.toRadians),
            Math.sin(HA * GTE.toRadians) * Math.cos(Decl * GTE.toRadians),
            Math.sin(Decl * GTE.toRadians)
        );

        let vHor: Vector3 = Vector3.make(
            vHADecl.x * Math.cos((90.0 - earthLatitude) * GTE.toRadians) - vHADecl.z * Math.sin((90.0 - earthLatitude) * GTE.toRadians),
            vHADecl.y,
            vHADecl.x * Math.sin((90.0 - earthLatitude) * GTE.toRadians) + vHADecl.z * Math.cos((90.0 - earthLatitude) * GTE.toRadians),
        );

        let azimuth = Math.atan2(vHor.y, vHor.x) * GTE.toDegrees + 180.0;
        let altitude = Math.asin(vHor.z) * GTE.toDegrees;

        return Vector3.make(
            Math.sin(azimuth * GTE.toRadians) * Math.cos(altitude * GTE.toRadians),
            Math.sin(altitude * GTE.toRadians),
            -Math.cos(azimuth * GTE.toRadians) * Math.cos(altitude * GTE.toRadians)
        );
    }

    export function RADecltoAltAz3f(RADecl: Vector3): Vector3 {
        return Vector3.make(
            RADecl.x,
            RADecl.y,
            RADecl.z
        );
    }

    export function getEccentricityEarthOrbit(daysSinceJ2000: number) {
        let t = makeCenturiesFromJ2000(daysSinceJ2000);
        return 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
    }

    export function getMeanObliquityOfEcliptic(daysSinceJ2000: number) {
        let t = makeCenturiesFromJ2000(daysSinceJ2000);
        let seconds = 21.448 - t * (46.8150 + t * (0.00059 - t * (0.001813)));
        let e0 = 23.0 + (26.0 + (seconds / 60.0)) / 60.0;
        return e0;		// in degrees
    }

    export function getSunGeomMeanAnomaly(daysSinceJ2000: number): number {
        let t = makeCenturiesFromJ2000(daysSinceJ2000);
        return GTE.wrap(357.52911 + t * (35999.05029 - 0.0001537 * t), 360.0);
    }

    export function getSunGeomMeanLongitude(daysSinceJ2000: number): number {
        let t = makeCenturiesFromJ2000(daysSinceJ2000);
        return GTE.wrap(280.46646 + t * (36000.76983 + 0.0003032 * t), 360.0);
    }

    export function kepler(meanAnomaly: number, eccentricity: number): number {
        let E0 = meanAnomaly + GTE.toDegrees * eccentricity * Math.sin(meanAnomaly) * (1.0 + eccentricity * Math.cos(meanAnomaly))
        let E1 = E0 - (E0 - GTE.toDegrees * eccentricity * Math.sin(E0 * GTE.toRadians) - meanAnomaly) / (1.0 - eccentricity * Math.cos(E0 * GTE.toRadians));
        while (Math.abs(E1 - E0) > 0.005) {
            E0 = E1;
            E1 = E0 - (E0 - GTE.toDegrees * eccentricity * Math.sin(E0 * GTE.toRadians) - meanAnomaly) / (1.0 - eccentricity * Math.cos(E0 * GTE.toRadians));
        }
        return GTE.wrap(E1, 360.0);
    }
}
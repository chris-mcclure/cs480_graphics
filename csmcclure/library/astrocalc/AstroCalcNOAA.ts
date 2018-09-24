
namespace AstroCalcNOAA {

    //***********************************************************************/
    //***********************************************************************/
    //*												*/
    //*This section contains subroutines used in calculating solar position */
    //*												*/
    //***********************************************************************/
    //***********************************************************************/

    // Convert radian angle to degrees

    export function radToDeg(angleRad: number): number {
        return (180.0 * angleRad / Math.PI);
    }

    //*********************************************************************/

    // Convert degree angle to radians

    export function degToRad(angleDeg: number): number {
        return (Math.PI * angleDeg / 180.0);
    }

    //*********************************************************************/


    //***********************************************************************/
    //* Name:    calcDayOfYear								*/
    //* Type:    export function									*/
    //* Purpose: Finds numerical day-of-year from mn, day and lp year info  */
    //* Arguments:										*/
    //*   month: January = 1								*/
    //*   day  : 1 - 31									*/
    //*   lpyr : 1 if leap year, 0 if not						*/
    //* Return value:										*/
    //*   The numerical day of year							*/
    //***********************************************************************/

    export function calcDayOfYear(mn: number, dy: number, lpyr: number): number {
        let k = (lpyr ? 1 : 2);
        let doy = Math.floor((275 * mn) / 9) - k * Math.floor((mn + 9) / 12) + dy - 30;
        return doy;
    }


    //***********************************************************************/
    //* Name:    calcDayOfWeek								*/
    //* Type:    export function									*/
    //* Purpose: Derives weekday from Julian Day					*/
    //* Arguments:										*/
    //*   juld : Julian Day									*/
    //* Return value:										*/
    //*   String containing name of weekday						*/
    //***********************************************************************/

    export function calcDayOfWeek(juld: number): string {
        let A = (juld + 1.5) % 7;
        let DOW = (A == 0) ? "Sunday" : (A == 1) ? "Monday" : (A == 2) ? "Tuesday" : (A == 3) ? "Wednesday" : (A == 4) ? "Thursday" : (A == 5) ? "Friday" : "Saturday";
        return DOW;
    }


    //***********************************************************************/
    //* Name:    calcJD									*/
    //* Type:    export function									*/
    //* Purpose: Julian day from calendar day						*/
    //* Arguments:										*/
    //*   year : 4 digit year								*/
    //*   month: January = 1								*/
    //*   day  : 1 - 31									*/
    //* Return value:										*/
    //*   The Julian day corresponding to the date					*/
    //* Note:											*/
    //*   Number is returned for start of day.  Fractional days should be	*/
    //*   added later.									*/
    //***********************************************************************/

    export function calcJD(year: number, month: number, day: number): number {
        if (month <= 2) {
            year -= 1;
            month += 12;
        }
        let A = Math.floor(year / 100);
        let B = 2 - A + Math.floor(A / 4);

        let JD = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
        return JD;
    }


    //***********************************************************************/
    //* Name:    calcTimeJulianCent							*/
    //* Type:    export function									*/
    //* Purpose: convert Julian Day to centuries since J2000.0.			*/
    //* Arguments:										*/
    //*   jd : the Julian Day to convert						*/
    //* Return value:										*/
    //*   the T value corresponding to the Julian Day				*/
    //***********************************************************************/

    export function calcTimeJulianCent(jd: number): number {
        let T = (jd - 2451545.0) / 36525.0;
        return T;
    }


    //***********************************************************************/
    //* Name:    calcJDFromJulianCent							*/
    //* Type:    export function									*/
    //* Purpose: convert centuries since J2000.0 to Julian Day.			*/
    //* Arguments:										*/
    //*   t : number of Julian centuries since J2000.0				*/
    //* Return value:										*/
    //*   the Julian Day corresponding to the t value				*/
    //***********************************************************************/

    export function calcJDFromJulianCent(t: number): number {
        let JD = t * 36525.0 + 2451545.0;
        return JD;
    }


    //***********************************************************************/
    //* Name:    calGeomMeanLongSun							*/
    //* Type:    export function									*/
    //* Purpose: calculate the Geometric Mean Longitude of the Sun		*/
    //* Arguments:										*/
    //*   t : number of Julian centuries since J2000.0				*/
    //* Return value:										*/
    //*   the Geometric Mean Longitude of the Sun in degrees			*/
    //***********************************************************************/

    export function calcGeomMeanLongSun(t: number): number {
        let L0 = 280.46646 + t * (36000.76983 + 0.0003032 * t);
        while (L0 > 360.0) {
            L0 -= 360.0;
        }
        while (L0 < 0.0) {
            L0 += 360.0;
        }
        return L0;		// in degrees
    }


    //***********************************************************************/
    //* Name:    calGeomAnomalySun							*/
    //* Type:    export function									*/
    //* Purpose: calculate the Geometric Mean Anomaly of the Sun		*/
    //* Arguments:										*/
    //*   t : number of Julian centuries since J2000.0				*/
    //* Return value:										*/
    //*   the Geometric Mean Anomaly of the Sun in degrees			*/
    //***********************************************************************/

    export function calcGeomMeanAnomalySun(t: number): number {
        let M = 357.52911 + t * (35999.05029 - 0.0001537 * t);
        return GTE.wrap(M, 360.0);		// in degrees
    }

    //***********************************************************************/
    //* Name:    calcEccentricityEarthOrbit						*/
    //* Type:    export function									*/
    //* Purpose: calculate the eccentricity of earth's orbit			*/
    //* Arguments:										*/
    //*   t : number of Julian centuries since J2000.0				*/
    //* Return value:										*/
    //*   the unitless eccentricity							*/
    //***********************************************************************/


    export function calcEccentricityEarthOrbit(t: number): number {
        let e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
        return e;		// unitless
    }

    //***********************************************************************/
    //* Name:    calcSunEqOfCenter							*/
    //* Type:    export function									*/
    //* Purpose: calculate the equation of center for the sun			*/
    //* Arguments:										*/
    //*   t : number of Julian centuries since J2000.0				*/
    //* Return value:										*/
    //*   in degrees										*/
    //***********************************************************************/


    export function calcSunEqOfCenter(t: number): number {
        let m = calcGeomMeanAnomalySun(t);

        let mrad = degToRad(m);
        let sinm = Math.sin(mrad);
        let sin2m = Math.sin(mrad + mrad);
        let sin3m = Math.sin(mrad + mrad + mrad);

        let C = sinm * (1.914602 - t * (0.004817 + 0.000014 * t)) + sin2m * (0.019993 - 0.000101 * t) + sin3m * 0.000289;
        return C;		// in degrees
    }

    //***********************************************************************/
    //* Name:    calcSunTrueLong								*/
    //* Type:    export function									*/
    //* Purpose: calculate the true longitude of the sun				*/
    //* Arguments:										*/
    //*   t : number of Julian centuries since J2000.0				*/
    //* Return value:										*/
    //*   sun's true longitude in degrees						*/
    //***********************************************************************/


    export function calcSunTrueLong(t: number): number {
        let l0 = calcGeomMeanLongSun(t);
        let c = calcSunEqOfCenter(t);

        let O = l0 + c;
        return O;		// in degrees
    }

    //***********************************************************************/
    //* Name:    calcSunTrueAnomaly							*/
    //* Type:    export function									*/
    //* Purpose: calculate the true anamoly of the sun				*/
    //* Arguments:										*/
    //*   t : number of Julian centuries since J2000.0				*/
    //* Return value:										*/
    //*   sun's true anamoly in degrees							*/
    //***********************************************************************/

    export function calcSunTrueAnomaly(t: number): number {
        let m = calcGeomMeanAnomalySun(t);
        let c = calcSunEqOfCenter(t);

        let v = m + c;
        return v;		// in degrees
    }

    //***********************************************************************/
    //* Name:    calcSunRadVector								*/
    //* Type:    export function									*/
    //* Purpose: calculate the distance to the sun in AU				*/
    //* Arguments:										*/
    //*   t : number of Julian centuries since J2000.0				*/
    //* Return value:										*/
    //*   sun radius vector in AUs							*/
    //***********************************************************************/

    export function calcSunRadVector(t: number): number {
        let v = calcSunTrueAnomaly(t);
        let e = calcEccentricityEarthOrbit(t);

        let R = (1.000001018 * (1 - e * e)) / (1 + e * Math.cos(degToRad(v)));
        return R;		// in AUs
    }

    //***********************************************************************/
    //* Name:    calcSunApparentLong							*/
    //* Type:    export function									*/
    //* Purpose: calculate the apparent longitude of the sun			*/
    //* Arguments:										*/
    //*   t : number of Julian centuries since J2000.0				*/
    //* Return value:										*/
    //*   sun's apparent longitude in degrees						*/
    //***********************************************************************/

    export function calcSunApparentLong(t: number): number {
        let o = calcSunTrueLong(t);

        let omega = 125.04 - 1934.136 * t;
        let lambda = o - 0.00569 - 0.00478 * Math.sin(degToRad(omega));
        return lambda;		// in degrees
    }

    //***********************************************************************/
    //* Name:    calcMeanObliquityOfEcliptic						*/
    //* Type:    export function									*/
    //* Purpose: calculate the mean obliquity of the ecliptic			*/
    //* Arguments:										*/
    //*   t : number of Julian centuries since J2000.0				*/
    //* Return value:										*/
    //*   mean obliquity in degrees							*/
    //***********************************************************************/

    export function calcMeanObliquityOfEcliptic(t: number): number {
        let seconds = 21.448 - t * (46.8150 + t * (0.00059 - t * (0.001813)));
        let e0 = 23.0 + (26.0 + (seconds / 60.0)) / 60.0;
        return e0;		// in degrees
    }

    //***********************************************************************/
    //* Name:    calcObliquityCorrection						*/
    //* Type:    export function									*/
    //* Purpose: calculate the corrected obliquity of the ecliptic		*/
    //* Arguments:										*/
    //*   t : number of Julian centuries since J2000.0				*/
    //* Return value:										*/
    //*   corrected obliquity in degrees						*/
    //***********************************************************************/

    export function calcObliquityCorrection(t: number): number {
        let e0 = calcMeanObliquityOfEcliptic(t);

        let omega = 125.04 - 1934.136 * t;
        let e = e0 + 0.00256 * Math.cos(degToRad(omega));
        return e;		// in degrees
    }

    //***********************************************************************/
    //* Name:    calcSunRtAscension							*/
    //* Type:    export function									*/
    //* Purpose: calculate the right ascension of the sun				*/
    //* Arguments:										*/
    //*   t : number of Julian centuries since J2000.0				*/
    //* Return value:										*/
    //*   sun's right ascension in degrees						*/
    //***********************************************************************/

    export function calcSunRtAscension(t: number): number {
        let e = calcObliquityCorrection(t);
        let lambda = calcSunApparentLong(t);

        let tananum = (Math.cos(degToRad(e)) * Math.sin(degToRad(lambda)));
        let tanadenom = (Math.cos(degToRad(lambda)));
        let alpha = radToDeg(Math.atan2(tananum, tanadenom));
        return alpha;		// in degrees
    }

    //***********************************************************************/
    //* Name:    calcSunDeclination							*/
    //* Type:    export function									*/
    //* Purpose: calculate the declination of the sun				*/
    //* Arguments:										*/
    //*   t : number of Julian centuries since J2000.0				*/
    //* Return value:										*/
    //*   sun's declination in degrees							*/
    //***********************************************************************/

    export function calcSunDeclination(t: number): number {
        let e = calcObliquityCorrection(t);
        let lambda = calcSunApparentLong(t);

        let sint = Math.sin(degToRad(e)) * Math.sin(degToRad(lambda));
        let theta = radToDeg(Math.asin(sint));
        return theta;		// in degrees
    }

    //***********************************************************************/
    //* Name:    calcEquationOfTime							*/
    //* Type:    export function									*/
    //* Purpose: calculate the difference between true solar time and mean	*/
    //*		solar time									*/
    //* Arguments:										*/
    //*   t : number of Julian centuries since J2000.0				*/
    //* Return value:										*/
    //*   equation of time in minutes of time						*/
    //***********************************************************************/

    export function calcEquationOfTime(t: number): number {
        let epsilon = calcObliquityCorrection(t);
        let l0 = calcGeomMeanLongSun(t);
        let e = calcEccentricityEarthOrbit(t);
        let m = calcGeomMeanAnomalySun(t);

        let y = Math.tan(degToRad(epsilon) / 2.0);
        y *= y;

        let sin2l0 = Math.sin(2.0 * degToRad(l0));
        let sinm = Math.sin(degToRad(m));
        let cos2l0 = Math.cos(2.0 * degToRad(l0));
        let sin4l0 = Math.sin(4.0 * degToRad(l0));
        let sin2m = Math.sin(2.0 * degToRad(m));

        let Etime = y * sin2l0 - 2.0 * e * sinm + 4.0 * e * y * sinm * cos2l0
            - 0.5 * y * y * sin4l0 - 1.25 * e * e * sin2m;

        return radToDeg(Etime) * 4.0;	// in minutes of time
    }

    //***********************************************************************/
    //* Name:    calcHourAngleSunrise							*/
    //* Type:    export function									*/
    //* Purpose: calculate the hour angle of the sun at sunrise for the	*/
    //*			latitude								*/
    //* Arguments:										*/
    //*   lat : latitude of observer in degrees					*/
    //*	solarDec : declination angle of sun in degrees				*/
    //* Return value:										*/
    //*   hour angle of sunrise in radians						*/
    //***********************************************************************/

    export function calcHourAngleSunrise(lat: number, solarDec: number): number {
        let latRad = degToRad(lat);
        let sdRad = degToRad(solarDec)

        let HAarg = (Math.cos(degToRad(90.833)) / (Math.cos(latRad) * Math.cos(sdRad)) - Math.tan(latRad) * Math.tan(sdRad));

        let HA = (Math.acos(Math.cos(degToRad(90.833)) / (Math.cos(latRad) * Math.cos(sdRad)) - Math.tan(latRad) * Math.tan(sdRad)));

        return HA;		// in radians
    }

    //***********************************************************************/
    //* Name:    calcHourAngleSunset							*/
    //* Type:    export function									*/
    //* Purpose: calculate the hour angle of the sun at sunset for the	*/
    //*			latitude								*/
    //* Arguments:										*/
    //*   lat : latitude of observer in degrees					*/
    //*	solarDec : declination angle of sun in degrees				*/
    //* Return value:										*/
    //*   hour angle of sunset in radians						*/
    //***********************************************************************/

    export function calcHourAngleSunset(lat: number, solarDec: number): number {
        let latRad = degToRad(lat);
        let sdRad = degToRad(solarDec)

        let HAarg = (Math.cos(degToRad(90.833)) / (Math.cos(latRad) * Math.cos(sdRad)) - Math.tan(latRad) * Math.tan(sdRad));

        let HA = (Math.acos(Math.cos(degToRad(90.833)) / (Math.cos(latRad) * Math.cos(sdRad)) - Math.tan(latRad) * Math.tan(sdRad)));

        return -HA;		// in radians
    }


    //***********************************************************************/
    //* Name:    calcSunriseUTC								*/
    //* Type:    export function									*/
    //* Purpose: calculate the Universal Coordinated Time (UTC) of sunrise	*/
    //*			for the given day at the given location on earth	*/
    //* Arguments:										*/
    //*   JD  : julian day									*/
    //*   latitude : latitude of observer in degrees				*/
    //*   longitude : longitude of observer in degrees				*/
    //* Return value:										*/
    //*   time in minutes from zero Z							*/
    //***********************************************************************/

    export function calcSunriseUTC(JD: number, latitude: number, longitude: number): number {
        let t = calcTimeJulianCent(JD);

        // *** Find the time of solar noon at the location, and use
        //     that declination. This is better than start of the 
        //     Julian day

        let noonmin = calcSolNoonUTC(t, longitude);
        let tnoon = calcTimeJulianCent(JD + noonmin / 1440.0);

        // *** First pass to approximate sunrise (using solar noon)

        let eqTime = calcEquationOfTime(tnoon);
        let solarDec = calcSunDeclination(tnoon);
        let hourAngle = calcHourAngleSunrise(latitude, solarDec);

        let delta = longitude - radToDeg(hourAngle);
        let timeDiff = 4 * delta;	// in minutes of time
        let timeUTC = 720 + timeDiff - eqTime;	// in minutes

        // alert("eqTime = " + eqTime + "\nsolarDec = " + solarDec + "\ntimeUTC = " + timeUTC);

        // *** Second pass includes fractional jday in gamma calc

        let newt = calcTimeJulianCent(calcJDFromJulianCent(t) + timeUTC / 1440.0);
        eqTime = calcEquationOfTime(newt);
        solarDec = calcSunDeclination(newt);
        hourAngle = calcHourAngleSunrise(latitude, solarDec);
        delta = longitude - radToDeg(hourAngle);
        timeDiff = 4 * delta;
        timeUTC = 720 + timeDiff - eqTime; // in minutes

        // alert("eqTime = " + eqTime + "\nsolarDec = " + solarDec + "\ntimeUTC = " + timeUTC);

        return timeUTC;
    }

    //***********************************************************************/
    //* Name:    calcSolNoonUTC								*/
    //* Type:    export function									*/
    //* Purpose: calculate the Universal Coordinated Time (UTC) of solar	*/
    //*		noon for the given day at the given location on earth		*/
    //* Arguments:										*/
    //*   t : number of Julian centuries since J2000.0				*/
    //*   longitude : longitude of observer in degrees				*/
    //* Return value:										*/
    //*   time in minutes from zero Z							*/
    //***********************************************************************/

    export function calcSolNoonUTC(t: number, longitude: number): number {
        // First pass uses approximate solar noon to calculate eqtime
        let tnoon = calcTimeJulianCent(calcJDFromJulianCent(t) + longitude / 360.0);
        let eqTime = calcEquationOfTime(tnoon);
        let solNoonUTC = 720 + (longitude * 4) - eqTime; // min

        let newt = calcTimeJulianCent(calcJDFromJulianCent(t) - 0.5 + solNoonUTC / 1440.0);

        eqTime = calcEquationOfTime(newt);
        // let solarNoonDec = calcSunDeclination(newt);
        solNoonUTC = 720 + (longitude * 4) - eqTime; // min

        return solNoonUTC;
    }

    //***********************************************************************/
    //* Name:    calcSunsetUTC								*/
    //* Type:    export function									*/
    //* Purpose: calculate the Universal Coordinated Time (UTC) of sunset	*/
    //*			for the given day at the given location on earth	*/
    //* Arguments:										*/
    //*   JD  : julian day									*/
    //*   latitude : latitude of observer in degrees				*/
    //*   longitude : longitude of observer in degrees				*/
    //* Return value:										*/
    //*   time in minutes from zero Z							*/
    //***********************************************************************/

    export function calcSunsetUTC(JD: number, latitude: number, longitude: number): number {
        let t = calcTimeJulianCent(JD);

        // *** Find the time of solar noon at the location, and use
        //     that declination. This is better than start of the 
        //     Julian day

        let noonmin = calcSolNoonUTC(t, longitude);
        let tnoon = calcTimeJulianCent(JD + noonmin / 1440.0);

        // First calculates sunrise and approx length of day

        let eqTime = calcEquationOfTime(tnoon);
        let solarDec = calcSunDeclination(tnoon);
        let hourAngle = calcHourAngleSunset(latitude, solarDec);

        let delta = longitude - radToDeg(hourAngle);
        let timeDiff = 4 * delta;
        let timeUTC = 720 + timeDiff - eqTime;

        // first pass used to include fractional day in gamma calc

        let newt = calcTimeJulianCent(calcJDFromJulianCent(t) + timeUTC / 1440.0);
        eqTime = calcEquationOfTime(newt);
        solarDec = calcSunDeclination(newt);
        hourAngle = calcHourAngleSunset(latitude, solarDec);

        delta = longitude - radToDeg(hourAngle);
        timeDiff = 4 * delta;
        timeUTC = 720 + timeDiff - eqTime; // in minutes

        return timeUTC;
    }

    //*********************************************************************/
}
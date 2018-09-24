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


namespace Colors {
    const DarkIntensity = 30;
    const LightIntensity = 210;
    const MediumIntensity = GTE.lerp(DarkIntensity, LightIntensity, 0.5);
    const GrayIntensity33 = GTE.lerp(DarkIntensity, LightIntensity, 0.66);
    const GrayIntensity66 = GTE.lerp(DarkIntensity, LightIntensity, 0.33);
    const Gr33Intensity = GTE.lerp(DarkIntensity, LightIntensity, 0.66);
    const Gr66Intensity = GTE.lerp(DarkIntensity, LightIntensity, 0.33);

    export const Black: Vector3 = Vector3.make(30 / 255, 30 / 255, 30 / 255);
    export const White: Vector3 = Vector3.make(210 / 255, 210 / 255, 210 / 255);
    export const Gray66: Vector3 = Vector3.make(150 / 255, 150 / 255, 150 / 255);
    export const Gray33: Vector3 = Vector3.make(91 / 255, 91 / 255, 91 / 255);
    export const Red: Vector3 = Vector3.make(210 / 255, 30 / 255, 30 / 255);
    export const Orange: Vector3 = Vector3.make(210 / 255, 150 / 255, 30 / 255);
    export const Yellow: Vector3 = Vector3.make(210 / 255, 210 / 255, 30 / 255);
    export const Green: Vector3 = Vector3.make(30 / 255, 210 / 255, 30 / 255);
    export const Cyan: Vector3 = Vector3.make(30 / 255, 210 / 255, 210 / 255);
    export const Blue: Vector3 = Vector3.make(30 / 255, 30 / 255, 210 / 255);
    export const Indigo: Vector3 = Vector3.make(91 / 255, 30 / 255, 210 / 255);
    export const Violet: Vector3 = Vector3.make(150 / 255, 30 / 255, 150 / 255);
    export const Magenta: Vector3 = Vector3.make(210 / 255, 30 / 255, 210 / 255);
    // export const DarkGreen: Vector3 = Vector3.make(30/255, 91/255, 30/255);
    export const Brown: Vector3 = Vector3.make(150 / 255, 91 / 255, 30 / 255);
    export const SkyBlue: Vector3 = Vector3.make(30 / 255, 150 / 255, 210 / 255);
    export const DarkRed: Vector3 = Vector3.make(120 / 255, 30 / 255, 30 / 255);
    export const DarkCyan: Vector3 = Vector3.make(30 / 255, 120 / 255, 120 / 255);
    export const DarkGreen: Vector3 = Vector3.make(30 / 255, 120 / 255, 30 / 255);
    export const DarkMagenta: Vector3 = Vector3.make(120 / 255, 30 / 255, 120 / 255);
    export const DarkBlue: Vector3 = Vector3.make(30 / 255, 30 / 255, 120 / 255);
    export const DarkYellow: Vector3 = Vector3.make(120 / 255, 120 / 255, 30 / 255);
    export const LightRed: Vector3 = Vector3.make(210 / 255, 120 / 255, 120 / 255);
    export const LightCyan: Vector3 = Vector3.make(120 / 255, 210 / 255, 210 / 255);
    export const LightGreen: Vector3 = Vector3.make(120 / 255, 210 / 255, 120 / 255);
    export const LightMagenta: Vector3 = Vector3.make(210 / 255, 120 / 255, 210 / 255);
    export const LightBlue: Vector3 = Vector3.make(120 / 255, 120 / 255, 210 / 255);
    export const LightYellow: Vector3 = Vector3.make(210 / 255, 210 / 255, 120 / 255);

    export const ArneOrange: Vector3 = Vector3.make(235 / 255, 137 / 255, 49 / 255);
    export const ArneYellow: Vector3 = Vector3.make(247 / 255, 226 / 255, 107 / 255);
    export const ArneDarkGreen: Vector3 = Vector3.make(47 / 255, 72 / 255, 78 / 255);
    export const ArneGreen: Vector3 = Vector3.make(68 / 255, 137 / 255, 26 / 255);
    export const ArneSlimeGreen: Vector3 = Vector3.make(163 / 255, 206 / 255, 39 / 255);
    export const ArneNightBlue: Vector3 = Vector3.make(27 / 255, 38 / 255, 50 / 255);
    export const ArneSeaBlue: Vector3 = Vector3.make(0 / 255, 87 / 255, 132 / 255);
    export const ArneSkyBlue: Vector3 = Vector3.make(49 / 255, 162 / 255, 242 / 255);
    export const ArneCloudBlue: Vector3 = Vector3.make(178 / 255, 220 / 255, 239 / 255);
    export const ArneDarkBlue: Vector3 = Vector3.make(52 / 255, 42 / 255, 151 / 255);
    export const ArneDarkGray: Vector3 = Vector3.make(101 / 255, 109 / 255, 113 / 255);
    export const ArneLightGray: Vector3 = Vector3.make(204 / 255, 204 / 255, 204 / 255);
    export const ArneDarkRed: Vector3 = Vector3.make(115 / 255, 41 / 255, 48 / 255);
    export const ArneRose: Vector3 = Vector3.make(203 / 255, 67 / 255, 167 / 255);
    export const ArneTaupe: Vector3 = Vector3.make(82 / 255, 79 / 255, 64 / 255);
    export const ArneGold: Vector3 = Vector3.make(173 / 255, 157 / 255, 51 / 255);
    export const ArneTangerine: Vector3 = Vector3.make(236 / 255, 71 / 255, 0 / 255);
    export const ArneHoney: Vector3 = Vector3.make(250 / 255, 180 / 255, 11 / 255);
    export const ArneMossyGreen: Vector3 = Vector3.make(17 / 255, 94 / 255, 51 / 255);
    export const ArneDarkCyan: Vector3 = Vector3.make(20 / 255, 128 / 255, 126 / 255);
    export const ArneCyan: Vector3 = Vector3.make(21 / 255, 194 / 255, 165 / 255);
    export const ArneBlue: Vector3 = Vector3.make(34 / 255, 90 / 255, 246 / 255);
    export const ArneIndigo: Vector3 = Vector3.make(153 / 255, 100 / 255, 249 / 255);
    export const ArnePink: Vector3 = Vector3.make(247 / 255, 142 / 255, 214 / 255);
    export const ArneSkin: Vector3 = Vector3.make(244 / 255, 185 / 255, 144 / 255);
    export const ArneBlack: Vector3 = Vector3.make(30 / 255, 30 / 255, 30 / 255);
}

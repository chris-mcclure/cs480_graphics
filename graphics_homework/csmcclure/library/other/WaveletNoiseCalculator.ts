namespace GTE {
    export class WaveletNoiseCalculator {
        public noiseTileData: Float32Array;
        private initialized: boolean = false;
        constructor(public noiseTileSize: number = 128) {
            this.noiseTileData = new Float32Array(noiseTileSize * noiseTileSize * noiseTileSize);
            this.GenerateNoiseTile(noiseTileSize);
        }

        Mod(x: number, n: number): number {
            let m = x % n;
            return m < 0 ? m + n : m;
        }

        Downsample(from: Float32Array, to: Float32Array, n: number, stride: number): void {
            const ARAD = 16;
            let coefs: Float32Array = new Float32Array([
                0.000334, -0.001528, 0.000410, 0.003545, -0.000938, -0.008233, 0.002172, 0.019120,
                -0.005040, -0.044412, 0.011655, 0.103311, -0.025936, -0.243780, 0.033979, 0.655340,
                0.655340, 0.033979, -0.243780, -0.025936, 0.103311, 0.011655, -0.044412, -0.005040,
                0.019120, 0.002172, -0.008233, -0.000938, 0.003546, 0.000410, -0.001528, 0.000334,
                0
            ]);
            let a = coefs.subarray(ARAD);

            for (let i = 0; i < ((n / 2) | 0); i++) {
                to[i * stride] = 0;
                for (let k = 2 * i - ARAD; k <= 2 * i + ARAD; k++) {
                    let _a = coefs[ARAD + k - 2 * i];
                    to[i * stride] += _a * from[this.Mod(k, n) * stride];
                    if (!isFinite(to[i * stride])) {
                        console.error("non finite number produced");
                    }
                }
            }
        }

        Upsample(from: Float32Array, to: Float32Array, n: number, stride: number): void {
            const ARAD = 16;
            let pCoefs: Float32Array = new Float32Array([0.25, 0.75, 0.75, 0.25]);
            let p = pCoefs.subarray(2);
            for (let i = 0; i < n; i++) {
                to[i * stride] = 0;
                let k1 = (i / 2) | 0;
                let k2 = k1 + 1;
                for (let k = k1; k <= k2; k++) {
                    let _p = pCoefs[2 + i - 2 * k];
                    to[i * stride] += _p * from[this.Mod(k, n / 2) * stride];
                    if (!isFinite(to[i * stride])) {
                        console.error("non finite number produced");
                    }
                }
            }
        }

        GenerateNoiseTile(n: number): void {
            if (n % 2) {
                n++;
            }
            let ix: number = 0;
            let iy: number = 0;
            let iz: number = 0;
            let sz: number = n * n * n * 4;
            let temp1: Float32Array = new Float32Array(n * n * n);
            let temp2: Float32Array = new Float32Array(n * n * n);
            let noise: Float32Array = new Float32Array(n * n * n);

            for (let i = 0; i < n * n * n; i++) {
                // Wavelet noise paper says "GaussianNoise"
                noise[i] = Math.random() * 2 - 1;
            }

            // Downsample and upsample
            for (iy = 0; iy < n; iy++) {
                for (iz = 0; iz < n; iz++) {
                    let i = iy * n + iz * n * n;
                    this.Downsample(noise.subarray(i), temp1.subarray(i), n, 1);
                    this.Upsample(temp1.subarray(i), temp2.subarray(i), n, 1);
                }
            }

            for (ix = 0; ix < n; ix++) {
                for (iz = 0; iz < n; iz++) {
                    let i = ix + iz * n * n;
                    this.Downsample(temp2.subarray(i), temp1.subarray(i), n, n);
                    this.Upsample(temp1.subarray(i), temp2.subarray(i), n, n);
                }
            }

            for (ix = 0; ix < n; ix++) {
                for (iy = 0; iy < n; iy++) {
                    let i = ix + iy * n;
                    this.Downsample(temp2.subarray(i), temp1.subarray(i), n, n * n);
                    this.Upsample(temp1.subarray(i), temp2.subarray(i), n, n * n);
                }
            }

            for (let i = 0; i < n * n * n; i++) {
                noise[i] -= temp2[i];
            }

            let offset = n / 2;
            if (offset % 2) {
                offset++;
            }
            for (let i = 0, ix = 0; ix < n; ix++) {
                for (iy = 0; iy < n; iy++) {
                    for (iz = 0; iz < n; iz++) {
                        temp1[i++] = noise[this.Mod(ix + offset, n) + this.Mod(iy + offset, n) * n + this.Mod(iz + offset, n) * n * n];
                    }
                }
            }
            for (let i = 0; i < n * n * n; i++) {
                noise[i] += temp1[i];
            }
            this.noiseTileData = noise;
            this.initialized = true;
        }

        WaveletNoise(x: number, y: number, z: number, octave: number = 128): number {
            let p = [octave * x, octave * y, octave * z];
            let i = 0;
            let f = [0, 0, 0];
            let c = [0, 0, 0];
            let n = this.noiseTileSize;
            let mid = [0, 0, 0];
            let w = [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ];
            let t = 0;
            let result = 0;
            // B-spline quadratic basis function
            for (i = 0; i < 3; i++) {
                mid[i] = Math.ceil(p[i] - 0.5);
                t = mid[i] - (p[i] - 0.5);
                w[i][0] = t * t / 2;
                w[i][2] = (1 - t) * (1 - t) / 2;
                w[i][1] = 1 - w[i][0] - w[i][2];
            }

            for (f[2] = -1; f[2] <= 1; f[2]++) {
                for (f[1] = -1; f[1] <= 1; f[1]++) {
                    for (f[0] = -1; f[0] <= 1; f[0]++) {
                        let weight = 1;
                        for (i = 0; i < 3; i++) {
                            c[i] = this.Mod(mid[i] + f[i], n);
                            weight *= w[i][f[i] + 1];
                            result += weight * this.noiseTileData[c[2] * n * n + c[1] * n + c[0]];
                        }
                    }
                }
            }

            return result;
        }
    }

    export var WaveletNoise = new WaveletNoiseCalculator(64);
}
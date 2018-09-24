precision highp float;

uniform samplerCube EnviroCube;
uniform vec3 SunDirTo;
uniform vec3 MoonDirTo;
uniform vec3 MoonE0;

varying vec3 vViewDir;
varying vec3 vTexcoord;

void main() {
  vec3 V = normalize(vViewDir);

  vec3 moonDirTo = normalize(MoonDirTo);
  float moonValue = 0.0;
  if (moonDirTo.y > 0.0 && dot(V, moonDirTo) > 0.999)
    moonValue = 1.0;

  vec3 sunDirTo = normalize(SunDirTo);
  float sunValue = 0.0;
  if (sunDirTo.y > 0.0 && dot(V, sunDirTo) > 0.999)
    sunValue = 1.0;

  vec3 enviroColor = textureCube(EnviroCube, vTexcoord).rgb;
  vec3 enviro = max(0.0, sunDirTo.y) * enviroColor + max(0.0, moonDirTo.y) * enviroColor * MoonE0;
  gl_FragColor = vec4(moonValue * vec3(1.0) + sunValue * vec3(1.0, 1.0, 0.0) + enviro, 1.0);
}

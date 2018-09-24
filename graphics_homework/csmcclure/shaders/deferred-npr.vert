uniform mat4 ProjectionMatrix;
uniform mat4 CameraMatrix;
uniform mat4 WorldMatrix;
uniform vec3 CameraPosition;

uniform mat4 SunShadowBiasMatrix;
uniform mat4 SunShadowProjectionMatrix;
uniform mat4 SunShadowViewMatrix;
uniform mat4 SunShadowInverseViewMatrix;

attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec3 aColor;
attribute vec3 aTexcoord;

varying vec3 vPosition;
varying vec3 vViewDir;
varying vec3 vNormal;
varying vec4 vColor;
varying vec3 vTexcoord;
varying vec4 vSunShadowCoord;

// The inverse transpose of a rotation matrix
// is the original matrix itself!
mat3 Top3x3(in mat4 m)
{
  return mat3(
    m[0].x, m[0].y, m[0].z,
    m[1].x, m[1].y, m[1].z,
    m[2].x, m[2].y, m[2].z);
}
// The transpose of a rotation matrix
// is its inverse.
mat3 Top3x3Transpose(in mat4 m)
{
  return mat3(
    m[0].x, m[1].x, m[2].x,
    m[0].y, m[1].y, m[2].y,
    m[0].z, m[1].z, m[2].z);
}

void main() {
  vec4 P = WorldMatrix * vec4(aPosition, 1.0);
  vPosition = P.xyz;
  vViewDir = P.xyz - CameraPosition.xyz;
  vNormal = Top3x3(WorldMatrix) * aNormal;
  vColor = vec4(aColor, 1.0);
  //vTexcoord = vec3(aTexcoord.x, 1.0 - aTexcoord.y, aTexcoord.z);
  vTexcoord = vec3(aTexcoord.x, aTexcoord.y, aTexcoord.z);

  mat4 SunBiasProjectionModelViewMatrix = SunShadowBiasMatrix * SunShadowProjectionMatrix * SunShadowViewMatrix;
  vSunShadowCoord = SunBiasProjectionModelViewMatrix * vec4(vPosition, 1.0);

  gl_Position = ProjectionMatrix * CameraMatrix * P;
}
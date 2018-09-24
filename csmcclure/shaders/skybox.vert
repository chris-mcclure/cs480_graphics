uniform mat4 ProjectionMatrix;
uniform mat4 CameraMatrix;
uniform mat4 WorldMatrix;

// The inverse transpose of a rotation matrix
// is the original matrix itself!
mat3 Top3x3(in mat4 m)
{
  return mat3(
    m[0].x, m[0].y, m[0].z,
    m[1].x, m[1].y, m[1].z,
    m[2].x, m[2].y, m[2].z);
}

attribute vec3 aPosition;
attribute vec3 aTexcoord;

varying vec3 vPosition;
varying vec3 vTexcoord;
varying vec3 vViewDir;

void main() {
  vec4 P = WorldMatrix * vec4(aPosition, 1.0);
  vPosition = P.xyz;
  vTexcoord = aPosition;
  vViewDir = P.xyz;//vec3(-CameraMatrix[0][2], -CameraMatrix[1][2], -CameraMatrix[2][2]);
  gl_Position = ProjectionMatrix * CameraMatrix * P;
}
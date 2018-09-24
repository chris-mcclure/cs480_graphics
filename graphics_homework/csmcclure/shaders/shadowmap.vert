uniform mat4 ProjectionMatrix;
uniform mat4 CameraMatrix;
uniform mat4 WorldMatrix;

attribute vec3 aPosition;

varying vec3 vPosition;

void main() {
  vec4 P = WorldMatrix * vec4(aPosition, 1.0);
  vPosition = P.xyz;
  gl_Position = ProjectionMatrix * CameraMatrix * P;
}
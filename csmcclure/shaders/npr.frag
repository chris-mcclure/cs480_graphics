#version 100
#extension GL_OES_standard_derivatives: enable

precision highp float;

//////////////////////////////////////////////////////////////////////
// G-BUFFER //////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////

uniform int VizShowGBuffer;
uniform int UsingGBuffer;
uniform vec2 iResolutionGBuffer;
uniform sampler2D GBufferDepth;  // (xyzw) = (Z)
uniform sampler2D GBufferColor0; // (xyzw) = (N.xyz diffuseRoughness)
uniform sampler2D GBufferColor1; // (xyzw) = (V.xyz specularRoughness)
uniform sampler2D GBufferColor2; // (rgba) = (Kd.rgb)
uniform sampler2D GBufferColor3; // (rgba) = (Ks.rgb)

uniform sampler2D map_normal;
uniform float map_normal_mix;

uniform vec3 Kd;
uniform sampler2D map_Kd;
uniform float map_Kd_mix;

uniform vec3 SunDirTo;

const float BumpinessFactor = 2.0;

varying vec3 vPosition;
varying vec3 vViewDir;
varying vec3 vNormal;
varying vec3 vTexcoord;


vec3 lerp(vec3 color1, vec3 color2, float mix) {
	return mix * color1 + (1.0 - mix) * color2;
}


mat3 MakeCotangentFrame(vec3 N, vec3 p, vec2 uv)
{
	vec3 dp1 = dFdx(p);
	vec3 dp2 = dFdy(p);
	vec2 duv1 = dFdx(uv);
	vec2 duv2 = dFdy(uv);

	vec3 dp2perp = cross(dp2, N);
	vec3 dp1perp = cross(N, dp1);
	vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
	vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;

	float fragmentArea = length(dp1) * length(dp2);

	float invmax = inversesqrt(max(dot(T,T), dot(B,B)));
	return mat3(T * invmax, B * invmax, N);
}

vec3 PerturbNormal(vec3 N, vec3 V, vec2 texcoord)
{
	vec3 map = 2.0 * texture2D(map_normal, texcoord).rgb - 1.0;
	map.z *= BumpinessFactor;
	mat3 TBN = MakeCotangentFrame(N, -V, texcoord);
	return normalize(TBN * map);
}


float edgeDetect(float spread, float maxVariance) {
  float sum = 0.0;
  float du = spread / iResolutionGBuffer.x;
  float dv = spread / iResolutionGBuffer.y;
  vec2 uv = vTexcoord.xy;
  float s1 = texture2D(GBufferDepth, uv + vec2(-du, -dv)).r;
  float s2 = texture2D(GBufferDepth, uv + vec2( du, -dv)).r;
  float s3 = texture2D(GBufferDepth, uv + vec2(-du,  dv)).r;
  float s4 = texture2D(GBufferDepth, uv + vec2( du,  dv)).r;
  float s5 = texture2D(GBufferDepth, uv).r;
  float mean = (s1+s2+s3+s4+s5) / 5.0;
  float v1 = pow(s1 - mean, 2.0);
  float v2 = pow(s2 - mean, 2.0);
  float v3 = pow(s3 - mean, 2.0);
  float v4 = pow(s4 - mean, 2.0);
  float v5 = pow(s5 - mean, 2.0);
  float var = (v1 + v2 + v3 + v4 + v5) / 5.0;
  return var < maxVariance ? 0.0 : 1.0;
}


void main() {
  vec3 N;
  if (length(vNormal) < 0.1) {
    vec3 dp1 = dFdx(vPosition);
    vec3 dp2 = dFdy(vPosition);
    N = normalize(cross(dp1, dp2));
  }
  else {
    N = normalize(vNormal);
  }

	vec3 V = normalize(-vViewDir);
  if (map_normal_mix > 0.0) {
    
    N = PerturbNormal(N, V, vTexcoord.st);
  }

	float NdotV = dot(N, V);
	vec3 kd = map_Kd_mix > 0.0 ? texture2D(map_Kd, vTexcoord.st).rgb : Kd;

	vec3 L = normalize(SunDirTo);
	float NdotL = dot(N, L);

	// if (NdotL > 0.8) {
	// 	NdotL = (NdotL - 0.8) / 2.0 + 0.9;
	// } else if (NdotL > 0.5) {
	// 	NdotL = (NdotL - 0.5) / 2.0 + 0.5;
	// } else {
	// 	NdotL = (NdotL - 0.5) / 2.0 + 0.25;
	// }	

	if (NdotV < 0.25) gl_FragColor = vec4(vec3(1.0 - NdotV * (1.0*0.25)), 1.0);
  else gl_FragColor = vec4(kd * NdotL, 1.0);

	vec3 Blue = vec3(0.0, 0.0, 1.0);
	vec3 Yellow = vec3(1.0, 1.0, 0.0);

	vec3 gooch = 0.5 * lerp(Yellow, Blue, NdotL);

	gl_FragColor = vec4(0.5 * NdotL * kd + gooch, 1.0);
	gl_FragColor = vec4(N, 1.0);
}

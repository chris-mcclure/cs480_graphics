#version 100
#extension GL_OES_standard_derivatives: enable

precision highp float;

const vec3 White = vec3(1.0, 1.0, 1.0);
const vec3 Black = vec3(0.0, 0.0, 0.0);
const vec3 Gold = vec3(0.8118, 0.7216, 0.4863);
const vec3 Clay = vec3(0.7290, 0.2120, 0.1920);
const float BumpinessFactor = 4.0;

uniform float uWindowWidth;
uniform float uWindowHeight;
uniform float uWindowCenterX;
uniform float uWindowCenterY;

uniform vec3 SunDirTo;
uniform vec3 SunE0;
uniform vec3 MoonDirTo;
uniform vec3 MoonE0;
uniform samplerCube EnviroCube;
uniform sampler2D SunShadowColorMap;
uniform sampler2D SunShadowDepthMap;

uniform vec3 Kd;// = Clay;
uniform vec3 Ks;// = White;
uniform sampler2D map_Kd;
uniform sampler2D map_Ks;
uniform sampler2D map_normal;
uniform float map_Kd_mix;
uniform float map_Ks_mix;
uniform float map_normal_mix;
uniform float PBKdm;
uniform float PBKsm;
uniform float PBn2;
uniform float PBk2;
uniform float PBGGXgamma;
uniform float PBirradiance;
uniform float PBreflections;

uniform float uPBKdm;
uniform float uPBKsm;
uniform float uPBn2;
uniform float uPBk2;
uniform float uPBGGXgamma;
uniform float uPBirradiance;
uniform float uPBreflections;
uniform float uToneMapExposure;
uniform float uToneMapGamma;

uniform vec3 uSpectralFresnelF0;
uniform vec3 uSpectralFresnelF1;
uniform vec3 uSpectralFresneln2;
uniform vec3 uSpectralFresnelk2;
// choices
// 1 - Ks Metal
// 2 - Schlick's approximation
// 3 - Schlick's K2 approximation
// 4 - PBR approximation
// 5 - Full equation
uniform int uSpectralFresnelMethod;
// choices 0 = disable
uniform int uSpectralFresnelComp1;
uniform int uSpectralFresnelComp2;

uniform float PageValue1;
uniform float PageValue2;
uniform float PageValue3;
uniform float PageValue4;

varying vec3 vPosition;
varying vec3 vViewDir;
varying vec3 vNormal;
varying vec4 vColor;
varying vec3 vTexcoord;
varying vec4 vSunShadowCoord;

struct FragmentInfo {
  vec3 N;
  vec3 Nbump;
  vec3 tangent;
  vec3 binormal;
  vec3 R; // reflection vector
  vec3 V; // view vector
  float NdotV;
  float NdotR;
  vec3 Kd;
  float Kd_alpha;
  vec3 Ks;
  float Ks_alpha;
};

struct LightInfo {
    float enabled;
    vec3 L;
    vec3 H;
    vec3 D;
    float NdotV;
    float NdotR;
    float NdotL;
    float NdotH;
    float LdotD; // difference angle
    float LdotH;
    float VdotH;
    vec3 E0;
};

struct MaterialInfo
{
	vec3 Kd;
	vec3 Ks;
	vec3 Ka;
	float diffuseRoughness;
	float diffuseRoughness2;
  float disneyDiffuseRoughness;
	float specularRoughness;
	float specularRoughness2;
	float specularExponent;
	float specularGGXgamma;
	float specularN2;
	float specularK2;
	float F0;
};

MaterialInfo Material;
FragmentInfo Fragment;
LightInfo Lights[8];
vec3 sunTexMapColor;
vec3 sunDirTo;
vec3 moonDirTo;


// Physically Based Lighting -------------------------------

float F_Schlick(float F0, float cos_theta);
vec3 F_SpectralMethod(int method, float cos_theta);
vec3 F_SpectralSpecular(float cos_theta);
vec3 F_SpectralSchlick(float cos_theta);
vec3 F_SpectralLazani(float cos_theta);
vec3 F_SpectralApprox(float cos_theta);
vec3 F_SpectralExact(float cos_theta);
vec3 F_SpectralSpectral(float cos_theta);

float F_Schlick(float F0, float cos_theta)
{
	return F0 + (1.0 - F0) * pow(1.0 - cos_theta, 5.0);
}

vec3 F_Spectral(float cos_theta)
{
  vec3 F;
  if (uSpectralFresnelComp1 != uSpectralFresnelComp2) {
    if (gl_FragCoord.x < uWindowCenterX) {
      F = F_SpectralMethod(uSpectralFresnelComp1, cos_theta);
    }
    else {
      F = F_SpectralMethod(uSpectralFresnelComp2, cos_theta);
    }
  }
  else {
    F = F_SpectralMethod(uSpectralFresnelMethod, cos_theta);        
  }
  return F;
}

vec3 F_SpectralMethod(int method, float cos_theta)
{
#ifndef GL_ES
  switch (method)
  {
    case 0: return F_SpectralSpecular(cos_theta);
    case 1: return F_SpectralSchlick(cos_theta);
    case 2: return F_SpectralLazani(cos_theta);
    case 3: return F_SpectralApprox(cos_theta);
    case 4: return F_SpectralExact(cos_theta);
    case 5: return F_SpectralExact(cos_theta);
  }
#else
  if (method == 0) return F_SpectralSpecular(cos_theta);
  if (method == 1) return F_SpectralSchlick(cos_theta);
  if (method == 2) return F_SpectralLazani(cos_theta);
  if (method == 3) return F_SpectralApprox(cos_theta);
  if (method == 4) return F_SpectralExact(cos_theta);
  if (method == 5) return F_SpectralExact(cos_theta);
#endif
  return vec3(1.0, 0.0, 1.0);
}


vec3 F_SpectralSpecular(float cos_theta)
{
  float c = pow(1.0 - cos_theta, 5.0);
  float f0 = uSpectralFresnelF1.g;//0.333 * (uSpectralFresnelF1.r + uSpectralFresnelF1.b + uSpectralFresnelF1.g);
  return uSpectralFresnelF1 * (f0 + (1.0 - f0) * c);
}


vec3 F_SpectralSchlick(float cos_theta)
{
  float c = pow(1.0 - cos_theta, 5.0);
  return uSpectralFresnelF0 + (1.0 - uSpectralFresnelF0) * c;
  // vec3 t1 = uSpectralFresneln2 - vec3(1.0);
  // vec3 t2 = uSpectralFresneln2 + vec3(1.0);
  // vec3 t3 = uSpectralFresnelk2 * uSpectralFresnelk2;
  // return (t1*t1 + 4.0*c*uSpectralFresneln2) / (t2*t2);
}


vec3 F_SpectralLazani(float cos_theta)
{
  float c = pow(1.0 - cos_theta, 5.0);
  vec3 t1 = uSpectralFresneln2 - vec3(1.0);
  vec3 t2 = uSpectralFresneln2 + vec3(1.0);
  vec3 t3 = uSpectralFresnelk2 * uSpectralFresnelk2;
  return (t1*t1 + 4.0 * c * uSpectralFresneln2 + t3) / (t2*t2 + t3);
}


vec3 F_SpectralApprox(float cos_theta)
{
  vec3 n = uSpectralFresneln2;
  vec3 k = uSpectralFresnelk2;
	vec3 n2 = n * n;
	vec3 k2 = k * k;
	float cos2 = cos_theta * cos_theta;
	vec3 n2k2cos2 = (n2 + k2) * cos2;
	vec3 n2cos = 2.0 * cos_theta * n;
	vec3 n_minus_cos_2 = (n - cos_theta) * (n - cos_theta);
	vec3 n_plus_cos_2 = (n + cos_theta) * (n + cos_theta);

	vec3 Rs = (n_minus_cos_2 + k2) / (n_plus_cos_2 + k2);
	vec3 Rp = (n2k2cos2 - n2cos + 1.0) / (n2k2cos2 + n2cos + 1.0);

	return (Rs*Rs + Rp*Rp) * 0.5;
}


vec3 F_SpectralExact(float cos_theta)
{
  vec3 n_1 = vec3(1.0);
  vec3 n_2 = uSpectralFresneln2;
  vec3 k_2 = uSpectralFresnelk2;
	vec3 k_2Squared = k_2 * k_2;
	vec3 n_2Squared = n_2 * n_2;
	vec3 n_1Squared = n_1 * n_1;
	float NcrossLSquared = 1.0 - cos_theta * cos_theta;
	vec3 a = n_2Squared - k_2Squared - n_1Squared * NcrossLSquared;
	vec3 aSquared = a * a;
	vec3 b = 4.0 * n_2Squared * k_2Squared;
	vec3 c = sqrt(aSquared + b);
	vec3 p2 = 0.5 * (c + a);
	vec3 p = sqrt(p2);
	vec3 q2 = 0.5 * (c - a);
	vec3 d1 = n_1 * cos_theta - p;
	vec3 d2 = n_1 * cos_theta + p;
	vec3 rho_perp = (d1*d1 + q2)/(d2*d2 + q2);
	vec3 e1 = p - n_1 * (1.0/cos_theta - cos_theta);
	vec3 e2 = p + n_1 * (1.0/cos_theta - cos_theta);
	vec3 rho_parl = rho_perp * (e1*e1 + q2)/(e2*e2 + q2);

	return (rho_perp*rho_perp + rho_parl*rho_parl) * 0.5;  
}


vec3 F_SpectralSpectral(float cos_theta)
{
  vec3 n_1 = vec3(1.0);
  vec3 n_2 = uSpectralFresneln2;
  vec3 k_2 = uSpectralFresnelk2;
	vec3 k_2Squared = k_2 * k_2;
	vec3 n_2Squared = n_2 * n_2;
	vec3 n_1Squared = n_1 * n_1;
	float NcrossLSquared = 1.0 - cos_theta * cos_theta;
	vec3 a = n_2Squared - k_2Squared - n_1Squared * NcrossLSquared;
	vec3 aSquared = a * a;
	vec3 b = 4.0 * n_2Squared * k_2Squared;
	vec3 c = sqrt(aSquared + b);
	vec3 p2 = 0.5 * (c + a);
	vec3 p = sqrt(p2);
	vec3 q2 = 0.5 * (c - a);
	vec3 d1 = n_1 * cos_theta - p;
	vec3 d2 = n_1 * cos_theta + p;
	vec3 rho_perp = (d1*d1 + q2)/(d2*d2 + q2);
	vec3 e1 = p - n_1 * (1.0/cos_theta - cos_theta);
	vec3 e2 = p + n_1 * (1.0/cos_theta - cos_theta);
	vec3 rho_parl = rho_perp * (e1*e1 + q2)/(e2*e2 + q2);

	return (rho_perp*rho_perp + rho_parl*rho_parl) * 0.5;  
}


float ComputeDisneyDiffuse(float NdotL, float LdotD)
{
	// Disney Diffuse BRDF
	// Disney BRDF uses 0.5 + 2.0 * ...		
	float FD90 = 0.5 + 2.0 * LdotD * LdotD * Material.disneyDiffuseRoughness;
	float t = FD90 - 1.0;
	float c1 = pow(1.0 - NdotL, 5.0);
	float c2 = pow(1.0 - Fragment.NdotV, 5.0);
	return (1.0 + t * c1) * (1.0 + t * c2) / 3.14159;	
}


float ComputeOrenNayer2(vec3 L, float NdotL)
{
	// According to Disney BRDF, some models use double Fresnel in this way
	// float cos_theta_d = dot(Lights[i].L, Lights[i].H);
	// float Fl = F_Schlick(Material.F0, Lights[i].NdotL);
	// float Fd = F_Schlick(Material.F0, cos_theta_d);
	// Oren-Nayer BRDF

	// (vec3 N, vec3 L, vec3 V, float m
	float theta_NL = acos(NdotL);
	float theta_NV = acos(Fragment.NdotV);

	float alpha = max(theta_NV, theta_NL);
	float beta = min(theta_NV, theta_NL);

	float gamma = max(dot(Fragment.V - Fragment.N * Fragment.NdotV, L - Fragment.N * Fragment.NdotV), 0.0);
	float m2 = Material.diffuseRoughness2;

	float A = 1.0 - 0.5 * m2 / (m2 + 0.57);
	float B = 0.45 * m2 / (m2 + 0.09);
	float C = sin(alpha) * tan(beta);
	float L1 = (A + B * gamma * C) / 3.14159;
	return L1;
}


float G1_GGX(float c, float aSquared)
{
	return 2.0 / (1.0 + sqrt(1.0 + aSquared * (1.0 - c*c) / (c*c)));
}


float G2_GGX(float NdotL)
{	
	float t = Material.specularRoughness * 0.5 + 0.5;
	float alphaSquared = t*t;
	return G1_GGX(NdotL, alphaSquared) * G1_GGX(Fragment.NdotV, alphaSquared);
}


float D_GTR(float NdotH)
{
		// GGX Generalized-Trowbridge-Reitz
		float alpha = Material.specularRoughness2;    
		float c2 = NdotH * NdotH;
    float D;
    if (c2 == 0.0) {
      D = (1.0 / 3.14159) * pow(alpha, Material.specularGGXgamma);
    } else {
      float t2 = (1.0 - c2) / c2;
      D = (1.0 / 3.14159) * pow(alpha / (c2 * (alpha*alpha + t2)), Material.specularGGXgamma);
    }		
    return D;
}


// Shadow Mapping Code --------------------------------------

uniform int ShadowMapAlgorithm;
uniform int ShadowMapParam1;
uniform int ShadowMapParam2;
const float minShadow = 0.50;
const float shadowSpread = 0.0025;
const float shadowBias = 0.007;

float GetSunShadow0(); // from http://chinedufn.com/webgl-shadow-mapping-tutorial/
float GetSunShadow1(); // Basic 1 sample shadow
float GetSunShadow2(); // PCF sample shadow (3x3)
float GetSunShadow3(); // PCF sample shadow (4x4)
float GetSunShadow4(); // PCF sample shadow (5x5)
float GetSunShadow5(); // Circular (8 samples)
float GetSunShadow6(); // Random (8 samples)
float GetSunShadow7();
float GetSunShadow8();
float GetSunShadow9();
float GetSunShadow10();

// TODO: Add two advanced techniques here

float GetSunShadow()
{
  // Remember that method 0 relies on color writes being enabled!
  float s = 1.0;
  if (ShadowMapAlgorithm == 0) s = GetSunShadow0();
  else if (ShadowMapAlgorithm == 1) s = GetSunShadow1();
  else if (ShadowMapAlgorithm == 2) s = GetSunShadow2();
  else if (ShadowMapAlgorithm == 3) s = GetSunShadow3();
  else if (ShadowMapAlgorithm == 4) s = GetSunShadow4();
  else if (ShadowMapAlgorithm == 5) s = GetSunShadow5();
  else if (ShadowMapAlgorithm == 6) s = GetSunShadow6();
  else if (ShadowMapAlgorithm == 7) s = GetSunShadow7();
  else if (ShadowMapAlgorithm == 8) s = GetSunShadow8();
  else if (ShadowMapAlgorithm == 9) s = GetSunShadow9();
  else if (ShadowMapAlgorithm == 10) s = GetSunShadow10();
  return (1.0 - minShadow) * s + minShadow;
}


float decodeFloat (vec4 color) {
  const vec4 bitShift = vec4(
    1.0 / (256.0 * 256.0 * 256.0),
    1.0 / (256.0 * 256.0),
    1.0 / 256.0,
    1
  );
  return dot(color, bitShift);
}


float check(float shadowMapZ, float fragmentZ)
{
  if (shadowMapZ >= 1.0 || shadowMapZ >= fragmentZ)
    return 1.0;
  return 0.0;
}

float checkOffset(float fragmentZ, vec2 xy, vec2 offset) {
  float sample = texture2D(SunShadowDepthMap, xy + offset).r;
  if (sample >= 1.0 || sample > fragmentZ)
    return 1.0;
  return 0.0;
}


float GetSunShadow0()
{
  vec3 fragmentDepth = vSunShadowCoord.xyz;
  float shadowAcneRemover = 0.007;
  fragmentDepth.z -= shadowAcneRemover;

  float texelSize = 1.0 / 512.0;
  float amountInLight = 0.0;

  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      float texelDepth = decodeFloat(texture2D(SunShadowColorMap,
      fragmentDepth.xy + vec2(x, y) * texelSize));
      if (fragmentDepth.z < texelDepth) {
        amountInLight += 1.0;
      }
    }
  }
  amountInLight /= 9.0;
  return amountInLight;
}


float GetSunShadow1()
{
	vec3 sunShadowCoord = vec3(vSunShadowCoord) / vSunShadowCoord.w;
  float sunShadowCoordZ = sunShadowCoord.z - shadowBias;

  sunTexMapColor = texture2DProj(SunShadowColorMap, vSunShadowCoord.xyw).rgb;
	float sunZ = shadowBias + texture2DProj(SunShadowDepthMap, vSunShadowCoord.xyw).r;
  if (sunZ >= 1.0) return 1.0;
  if (sunZ > sunShadowCoordZ)
    return 1.0;
  return 0.0;
}


float GetSunShadow2()
{
	vec3 sunShadowCoord = vec3(vSunShadowCoord) / vSunShadowCoord.w;
  vec2 xy = sunShadowCoord.xy;
  float fragmentZ = sunShadowCoord.z - shadowBias;

  float spread = 0.2 * (1.0 / 512.0) * float(ShadowMapParam1);
  float accum = 0.0;
  const float numSamples = 9.0;
  accum += checkOffset(fragmentZ, xy, spread*vec2(-1.0000, -1.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.0000, -1.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(1.0000, -1.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-1.0000, 0.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.0000, 0.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(1.0000, 0.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-1.0000, 1.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.0000, 1.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(1.0000, 1.0000));
  return accum / numSamples;
}


float GetSunShadow3()
{
	vec3 sunShadowCoord = vec3(vSunShadowCoord) / vSunShadowCoord.w;
  vec2 xy = sunShadowCoord.xy;
  float fragmentZ = sunShadowCoord.z - shadowBias;

  float spread = 0.2 * (1.0 / 512.0) * float(ShadowMapParam1);
  float accum = 0.0;
  const float numSamples = 16.0;
  accum += checkOffset(fragmentZ, xy, spread*vec2(-1.5000, -1.5000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-0.5000, -1.5000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.5000, -1.5000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(1.5000, -1.5000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-1.5000, -0.5000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-0.5000, -0.5000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.5000, -0.5000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(1.5000, -0.5000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-1.5000, 0.5000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-0.5000, 0.5000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.5000, 0.5000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(1.5000, 0.5000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-1.5000, 1.5000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-0.5000, 1.5000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.5000, 1.5000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(1.5000, 1.5000));
  return accum / numSamples;
}


float GetSunShadow4()
{
	vec3 sunShadowCoord = vec3(vSunShadowCoord) / vSunShadowCoord.w;
  vec2 xy = sunShadowCoord.xy;
  float fragmentZ = sunShadowCoord.z - shadowBias;

  float spread = 0.2 * (1.0 / 512.0) * float(ShadowMapParam1);
  float accum = 0.0;
  const float numSamples = 25.0;
  accum += checkOffset(fragmentZ, xy, spread*vec2(-1.0000, -1.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.0000, -1.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(1.0000, -1.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-1.0000, 0.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.0000, 0.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(1.0000, 0.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-1.0000, 1.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.0000, 1.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(1.0000, 1.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-2.0000, -2.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-1.0000, -2.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.0000, -2.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(1.0000, -2.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(2.0000, -2.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-2.0000, -1.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(2.0000, 1.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-2.0000, 0.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(2.0000, 0.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-2.0000, 1.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(2.0000, 1.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-2.0000, -2.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-1.0000, -2.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.0000, -2.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(1.0000, -2.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(2.0000, -2.0000));
  return accum / numSamples;
}


float GetSunShadow5()
{
	vec3 sunShadowCoord = vec3(vSunShadowCoord) / vSunShadowCoord.w;
  vec2 xy = sunShadowCoord.xy;
  float fragmentZ = sunShadowCoord.z - shadowBias;

  float spread = 0.2 * (1.0 / 512.0) * float(ShadowMapParam1);
  float accum = 0.0;
  const float numSamples = 8.0;
  accum += checkOffset(fragmentZ, xy, spread*vec2(1.0000, 0.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.7071, 0.7071));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.0000, 1.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-0.7071, 0.7071));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-1.0000, 0.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-0.7071, -0.7071));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.0000, -1.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.7071, -0.7071));
  return accum / numSamples;
}


float GetSunShadow6()
{
	vec3 sunShadowCoord = vec3(vSunShadowCoord) / vSunShadowCoord.w;
  vec2 xy = sunShadowCoord.xy;
  float fragmentZ = sunShadowCoord.z - shadowBias;

  float spread = 0.2 * (1.0 / 512.0) * float(ShadowMapParam1);
  float accum = 0.0;
  const float numSamples = 16.0;
  accum += checkOffset(fragmentZ, xy, spread*vec2(1.0000, 0.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.7071, 0.7071));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.0000, 1.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-0.7071, 0.7071));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-1.0000, 0.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-0.7071, -0.7071));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.0000, -1.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.7071, -0.7071));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.6548, 1.3495));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-0.4912, 1.4173));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-1.3495, 0.6548));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-1.4173, -0.4912));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-0.6548, -1.3495));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.4912, -1.4173));
  accum += checkOffset(fragmentZ, xy, spread*vec2(1.3495, -0.6548));
  accum += checkOffset(fragmentZ, xy, spread*vec2(1.4173, 0.4912));
  return accum / numSamples;
}


float GetSunShadow7()
{
	vec3 sunShadowCoord = vec3(vSunShadowCoord) / vSunShadowCoord.w;
  vec2 xy = sunShadowCoord.xy;
  float fragmentZ = sunShadowCoord.z - shadowBias;

  float spread = 0.2 * (1.0 / 512.0) * float(ShadowMapParam1);
  float accum = 0.0;
  const float numSamples = 8.0;
  accum += checkOffset(fragmentZ, xy, spread*vec2(-1.0000, -1.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-0.8750, -0.8750));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.0000, 1.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.3750, 0.7500));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-0.3750, -0.7500));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.3750, -0.1250));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.2500, -0.5000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-0.7500, -0.3750));
  return accum / numSamples;
}


float GetSunShadow8()
{
	vec3 sunShadowCoord = vec3(vSunShadowCoord) / vSunShadowCoord.w;
  vec2 xy = sunShadowCoord.xy;
  float fragmentZ = sunShadowCoord.z - shadowBias;

  float spread = 0.2 * (1.0 / 512.0) * float(ShadowMapParam1);
  float accum = 0.0;
  const float numSamples = 16.0;
  accum += checkOffset(fragmentZ, xy, spread*vec2(-1.0000, -1.0000));		accum += checkOffset(fragmentZ, xy, spread*vec2(0.7500, 0.2500));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-0.8750, -0.8750));		accum += checkOffset(fragmentZ, xy, spread*vec2(1.7500, 0.2500));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.0000, 1.0000));		accum += checkOffset(fragmentZ, xy, spread*vec2(2.0000, -1.7500));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.3750, 0.7500));		accum += checkOffset(fragmentZ, xy, spread*vec2(-0.5000, -1.7500));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-0.3750, -0.7500));		accum += checkOffset(fragmentZ, xy, spread*vec2(-0.7500, -1.2500));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.3750, -0.1250));		accum += checkOffset(fragmentZ, xy, spread*vec2(1.7500, -1.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.2500, -0.5000));		accum += checkOffset(fragmentZ, xy, spread*vec2(-1.7500, -0.7500));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-0.7500, -0.3750));		accum += checkOffset(fragmentZ, xy, spread*vec2(-0.7500, -1.7500));
  return accum / numSamples;
}


float GetSunShadow9()
{
	vec3 sunShadowCoord = vec3(vSunShadowCoord) / vSunShadowCoord.w;
  vec2 xy = sunShadowCoord.xy;
  float fragmentZ = sunShadowCoord.z - shadowBias;

  float spread = 0.2 * (1.0 / 512.0) * float(ShadowMapParam1);
  float accum = 0.0;
  const float numSamples = 24.0;
  accum += checkOffset(fragmentZ, xy, spread*vec2(-1.0000, -1.0000));		accum += checkOffset(fragmentZ, xy, spread*vec2(0.7500, 0.2500));		accum += checkOffset(fragmentZ, xy, spread*vec2(2.6250, 3.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-0.8750, -0.8750));		accum += checkOffset(fragmentZ, xy, spread*vec2(1.7500, 0.2500));		accum += checkOffset(fragmentZ, xy, spread*vec2(1.8750, 0.3750));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.0000, 1.0000));		accum += checkOffset(fragmentZ, xy, spread*vec2(2.0000, -1.7500));		accum += checkOffset(fragmentZ, xy, spread*vec2(0.3750, -2.2500));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.3750, 0.7500));		accum += checkOffset(fragmentZ, xy, spread*vec2(-0.5000, -1.7500));		accum += checkOffset(fragmentZ, xy, spread*vec2(2.6250, 3.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-0.3750, -0.7500));		accum += checkOffset(fragmentZ, xy, spread*vec2(-0.7500, -1.2500));		accum += checkOffset(fragmentZ, xy, spread*vec2(0.0000, 1.1250));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.3750, -0.1250));		accum += checkOffset(fragmentZ, xy, spread*vec2(1.7500, -1.0000));		accum += checkOffset(fragmentZ, xy, spread*vec2(-2.2500, 1.1250));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.2500, -0.5000));		accum += checkOffset(fragmentZ, xy, spread*vec2(-1.7500, -0.7500));		accum += checkOffset(fragmentZ, xy, spread*vec2(-1.8750, 0.7500));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-0.7500, -0.3750));		accum += checkOffset(fragmentZ, xy, spread*vec2(-0.7500, -1.7500));		accum += checkOffset(fragmentZ, xy, spread*vec2(-3.0000, -3.0000));
  return accum / numSamples;
}


float GetSunShadow10()
{
	vec3 sunShadowCoord = vec3(vSunShadowCoord) / vSunShadowCoord.w;
  vec2 xy = sunShadowCoord.xy;
  float fragmentZ = sunShadowCoord.z - shadowBias;

  float spread = 0.2 * (1.0 / 512.0) * float(ShadowMapParam1);
  float accum = 0.0;
  const float numSamples = 32.0;
  accum += checkOffset(fragmentZ, xy, spread*vec2(-1.0000, -1.0000));		accum += checkOffset(fragmentZ, xy, spread*vec2(0.7500, 0.2500));		accum += checkOffset(fragmentZ, xy, spread*vec2(2.6250, 3.0000));		accum += checkOffset(fragmentZ, xy, spread*vec2(0.0000, -3.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-0.8750, -0.8750));		accum += checkOffset(fragmentZ, xy, spread*vec2(1.7500, 0.2500));		accum += checkOffset(fragmentZ, xy, spread*vec2(1.8750, 0.3750));		accum += checkOffset(fragmentZ, xy, spread*vec2(3.5000, 4.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.0000, 1.0000));		accum += checkOffset(fragmentZ, xy, spread*vec2(2.0000, -1.7500));		accum += checkOffset(fragmentZ, xy, spread*vec2(0.3750, -2.2500));		accum += checkOffset(fragmentZ, xy, spread*vec2(1.5000, 0.5000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.3750, 0.7500));		accum += checkOffset(fragmentZ, xy, spread*vec2(-0.5000, -1.7500));		accum += checkOffset(fragmentZ, xy, spread*vec2(2.6250, 3.0000));		accum += checkOffset(fragmentZ, xy, spread*vec2(2.5000, -3.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-0.3750, -0.7500));		accum += checkOffset(fragmentZ, xy, spread*vec2(-0.7500, -1.2500));		accum += checkOffset(fragmentZ, xy, spread*vec2(0.0000, 1.1250));		accum += checkOffset(fragmentZ, xy, spread*vec2(-3.5000, -1.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.3750, -0.1250));		accum += checkOffset(fragmentZ, xy, spread*vec2(1.7500, -1.0000));		accum += checkOffset(fragmentZ, xy, spread*vec2(-2.2500, 1.1250));		accum += checkOffset(fragmentZ, xy, spread*vec2(-1.0000, 2.5000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(0.2500, -0.5000));		accum += checkOffset(fragmentZ, xy, spread*vec2(-1.7500, -0.7500));		accum += checkOffset(fragmentZ, xy, spread*vec2(-1.8750, 0.7500));		accum += checkOffset(fragmentZ, xy, spread*vec2(-3.0000, 4.0000));
  accum += checkOffset(fragmentZ, xy, spread*vec2(-0.7500, -0.3750));		accum += checkOffset(fragmentZ, xy, spread*vec2(-0.7500, -1.7500));		accum += checkOffset(fragmentZ, xy, spread*vec2(-3.0000, -3.0000));		accum += checkOffset(fragmentZ, xy, spread*vec2(4.0000, 2.0000));
  return accum / numSamples;
}


// Fragment Preparation ------------------------------------

mat3 transpose(mat3 m) {
  return mat3(
    m[0].x, m[1].x, m[2].x,
    m[0].y, m[1].y, m[2].y,
    m[0].z, m[1].z, m[2].z);
}

mat3 MakeInverseMat3(mat3 M)
{
	mat3 M_t = transpose(M);
	float det = dot(cross(M_t[0], M_t[1]), M_t[2]);
	mat3 adjugate = mat3(
		cross(M_t[1], M_t[2]),
		cross(M_t[2], M_t[1]),
		cross(M_t[0], M_t[1]));
	return adjugate / det;
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


void PrepareForShading() {
  vec3 dp1 = dFdx(vPosition);
  vec3 dp2 = dFdy(vPosition);
  Fragment.N = normalize(vNormal);
  Fragment.Nbump = normalize(cross(dp1, dp2));
  if (length(Fragment.N) < 0.1)
    Fragment.N = Fragment.Nbump;
  Fragment.V = normalize(-vViewDir);
  if (map_normal_mix > 0.0)
    Fragment.N = PerturbNormal(Fragment.N, Fragment.V, vTexcoord.st);
  Fragment.R = reflect(-Fragment.V, Fragment.N);
  Fragment.NdotV = max(1e-3, dot(Fragment.N, Fragment.V));
  Fragment.NdotR = max(1e-3, dot(Fragment.N, Fragment.R));

  if (map_Kd_mix > 0.5) {
    vec4 sample = texture2D(map_Kd, vTexcoord.st);
    Fragment.Kd = map_Kd_mix * sample.rgb + (1.0 - map_Kd_mix) * Kd;
    Fragment.Kd_alpha = sample.a;
  } else if (map_Kd_mix > 0.0) {
    vec4 sample = texture2D(map_Kd, 0.025 * gl_FragCoord.xy);
    Fragment.Kd = sample.rgb;//map_Kd_mix * sample.rgb + (1.0 - map_Kd_mix) * Kd;
    Fragment.Kd_alpha = sample.a;
  } else {
    Fragment.Kd = Kd;
    Fragment.Kd_alpha = 1.0;
  }

  if (map_Ks_mix > 0.0) {
    vec4 sample = texture2D(map_Ks, vTexcoord.st);
    Fragment.Ks = map_Ks_mix * sample.rgb + (1.0 - map_Ks_mix) * Ks;
    Fragment.Ks_alpha = sample.a;
  } else {
    Fragment.Ks = Ks;
    Fragment.Ks_alpha = 1.0;
  }
}


void PrepareMaterial() {
  float n2 = 1.333;
  float t = (1.0 - uPBn2) / (1.0 + uPBn2);
  float m = uPBKsm;//0.15;
  Material.Kd = Fragment.Kd;
  Material.Ks = Fragment.Ks;
  Material.specularExponent = max(0.00001, 2.0 / (m * m + .00001) - 2.00001);
  Material.F0 = t*t;
  Material.diffuseRoughness = uPBKdm;
  Material.diffuseRoughness2 = uPBKdm * uPBKdm + 0.00001;
  Material.disneyDiffuseRoughness = -uPBKdm;
  Material.specularRoughness = m;
  Material.specularRoughness2 = m*m + 0.00001;
  Material.specularGGXgamma = uPBGGXgamma;
}


void PrepareLights() {
  sunDirTo = normalize(SunDirTo);
  moonDirTo = normalize(MoonDirTo);

  if (SunDirTo.y > 0.0){
    Lights[0].enabled = 1.0;
    Lights[0].L = sunDirTo;
    Lights[0].E0 = vec3(1.0, 1.0, 1.0);//SunE0;
    Lights[1].enabled = uPBirradiance;
    Lights[1].L = Fragment.N;
    Lights[1].E0 = uPBirradiance * sunDirTo.y * textureCube(EnviroCube, Fragment.N).rgb;
    Lights[2].enabled = uPBreflections;
    Lights[2].L = Fragment.R;
    Lights[2].E0 = uPBreflections * sunDirTo.y * textureCube(EnviroCube, Fragment.R).rgb;
  } else {
    Lights[0].enabled = 0.0;
    Lights[1].enabled = 0.0;
    Lights[2].enabled = 0.0;
  }

  if (MoonDirTo.y > 0.0) {
    Lights[3].enabled = 1.0;
    Lights[3].L = moonDirTo;
    Lights[3].E0 = MoonE0;
  } else {
    Lights[3].enabled = 0.0;
  }
  

    for (int i = 0; i < 8; i++) {
      if (Lights[i].enabled == 0.0)
        continue;
      Lights[i].H = normalize(Lights[i].L + Fragment.V);
      Lights[i].D = normalize(Lights[i].L + Lights[i].H);
      Lights[i].NdotV = Fragment.NdotV;
      Lights[i].NdotR = Fragment.NdotR;
      Lights[i].NdotL = max(0.0, dot(Fragment.N, Lights[i].L));
      Lights[i].NdotH = max(0.0, dot(Fragment.N, Lights[i].H));
      Lights[i].LdotD = max(0.0, dot(Lights[i].L, Lights[i].D));
      Lights[i].LdotH = max(0.0, dot(Lights[i].L, Lights[i].H));
      Lights[i].VdotH = max(0.0, dot(Fragment.V, Lights[i].H));
    }
}

vec3 GetEnviroColor()
{
  float denom = 4.0 * Fragment.NdotV * Fragment.NdotV;
  float LdotD = Fragment.NdotR;
  float F = F_Schlick(Material.F0, LdotD);
  float D = 1.0;
  float G = 1.0;
  float f_r = (D * F * G) / denom;
  return f_r * Fragment.NdotR * textureCube(EnviroCube, Fragment.R).rgb * Material.Ks;
}

vec3 GetNormalColor()
{
  float F = F_Schlick(Material.F0, 1.0);
  return textureCube(EnviroCube, Fragment.N).rgb * Material.Ks;
}

float MaskingShadowingG2(float NdotL, float NdotV, float NdotH, float VdotH)
{
	float G1 = 2.0 * NdotH * NdotV / VdotH;
	float G2 = 2.0 * NdotH * NdotL / VdotH;
	return min(1.0, min(G1, G2));
}

float D_BlinnPhong(float e, float NdotH)
{
    if (NdotH < 0.00001) return 0.0;
		float C = (2.0 + e) / (2.0 * 3.14159);
		float D = C * pow(NdotH, e);
    return D;
}

void main() {
  PrepareForShading();
  PrepareMaterial();
  PrepareLights();

  vec3 enviroColor = GetEnviroColor() + GetNormalColor();

  vec3 c_d = texture2D(map_Kd, vTexcoord.st).rgb;
  vec3 c_normal = texture2D(map_normal, vTexcoord.st).rgb;

  vec3 finalColor = Black;//enviroColor;
  for (int i = 0; i < 8; i++) {
    if (Lights[i].enabled == 0.0 || Lights[i].NdotL <= 0.0)
      continue;

    vec3 F = F_Spectral(Lights[i].LdotD);
    if (uPBKsm != 0.0)
    {
      float D = uPBKsm >= 0.0 ? D_GTR(Lights[i].NdotH)
                              : D_BlinnPhong(Material.specularExponent, Lights[i].NdotH);
      //float F = F_Schlick(Material.F0, Lights[i].LdotD);
      
      float G = MaskingShadowingG2(Lights[i].NdotL, Fragment.NdotV, Lights[i].NdotH, Lights[i].VdotH);
      float denom = 4.0 * Lights[i].NdotL * Fragment.NdotV;

      vec3 specularColor = Black;
      vec3 f_r = vec3(0.0);
      if (denom >= 0.00001) {
        f_r = (D * F * G) / denom;//(D * F * G) / denom;
        // specularColor += f_r * Material.Ks * Lights[i].E0 * Lights[i].NdotL;
        specularColor += f_r * Lights[i].E0 * Lights[i].NdotL;//f_r * Lights[i].E0 * Lights[i].NdotL;
      }
      finalColor += specularColor;
    }

    //vec3 diffuseColor = Lights[i].E0 * Material.Kd * Lights[i].NdotL;
    vec3 diffuseColor = Lights[i].E0 * White * Lights[i].NdotL * (1.0 - F);
    if (Material.diffuseRoughness > 0.0) {
      diffuseColor *= ComputeOrenNayer2(Lights[i].L, Lights[i].NdotL);
    } else if (Material.diffuseRoughness < 0.0) {      
      diffuseColor *= ComputeDisneyDiffuse(Lights[i].NdotL, Lights[i].LdotD);
    } else {
      diffuseColor *= 1.0 / 3.14159;
    }

    //finalColor += diffuseColor;
  }

  // if (sunDirTo.y > 0.0)
  //   finalColor *= GetSunShadow();// * normalize(SunDirTo).y;

  float toneMapScale = uToneMapExposure;// 0.0;
  float gamma = uToneMapGamma;// 2.2;
  vec3 c_exposure = 2.5 * pow(2.0, toneMapScale) * finalColor;
  vec3 c_gamma = pow(c_exposure, vec3(1.0 / gamma));
  gl_FragColor = vec4(c_gamma, 1.0);

  //gl_FragColor = vec4(Lights[0].NdotL * Gold * GetSunShadow(), 1.0);
  //gl_FragColor = vec4(Fragment.N * 0.5 + 0.5, 1.0);
  //gl_FragColor = vec4(textureCube(EnviroCube, Fragment.R).rgb, 1.0);
}

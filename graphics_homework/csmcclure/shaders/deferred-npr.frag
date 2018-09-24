#version 100
#extension GL_OES_standard_derivatives: enable

precision highp float;


//////////////////////////////////////////////////////////////////////
// C O L O R   C O N S T A N T S /////////////////////////////////////
//////////////////////////////////////////////////////////////////////

const vec3 White = vec3(1.0, 1.0, 1.0);
const vec3 Black = vec3(0.0, 0.0, 0.0);
const vec3 Red = vec3(1.0, 0.0, 0.0);
const vec3 Orange = vec3(1.0, 0.5, 0.0);
const vec3 Yellow = vec3(1.0, 1.0, 0.0);
const vec3 YellowGreen = vec3(0.5, 1.0, 0.0);
const vec3 Green = vec3(0.0, 1.0, 0.0);
const vec3 GreenBlue = vec3(0.0, 1.0, 0.5);
const vec3 Cyan = vec3(0.0, 1.0, 1.0);
const vec3 BlueGreen = vec3(0.0, 0.5, 1.0);
const vec3 Blue = vec3(0.0, 0.0, 1.0);
const vec3 Purple = vec3(0.5, 0.0, 1.0);
const vec3 Magenta = vec3(1.0, 0.0, 1.0);
const vec3 Rose = vec3(1.0, 0.0, 0.5);
const vec3 Gold = vec3(0.8118, 0.7216, 0.4863);
const vec3 Clay = vec3(0.7290, 0.2120, 0.1920);


//////////////////////////////////////////////////////////////////////
// E N V I R O N M E N T   C O N S T A N T S /////////////////////////
//////////////////////////////////////////////////////////////////////

uniform vec3 SunDirTo;
uniform vec3 SunE0;
uniform vec3 MoonDirTo;
uniform vec3 MoonE0;
uniform samplerCube EnviroCube;
uniform sampler2D SunShadowColorMap;
uniform sampler2D SunShadowDepthMap;
uniform vec2 iResolutionSunShadow;

uniform float uWindowWidth;
uniform float uWindowHeight;
uniform float uWindowCenterX;
uniform float uWindowCenterY;

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

//////////////////////////////////////////////////////////////////////
// M A T E R I A L   P R O P E R T I E S /////////////////////////////
//////////////////////////////////////////////////////////////////////

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

const float BumpinessFactor = 4.0;


//////////////////////////////////////////////////////////////////////
// G A M M A   C O R R E C T I O N ///////////////////////////////////
//////////////////////////////////////////////////////////////////////

uniform float uToneMapExposure;
uniform float uToneMapGamma;

uniform float PageValue1;
uniform float PageValue2;
uniform float PageValue3;
uniform float PageValue4;


//////////////////////////////////////////////////////////////////////
// V E R T E X   S H A D E R   I N P U T S ///////////////////////////
//////////////////////////////////////////////////////////////////////

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


//////////////////////////////////////////////////////////////////////
// P H Y S I C A L L Y   B A S E D   L I G H T I N G /////////////////
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////
// F R E S N E L /////////////////////////////////
//////////////////////////////////////////////////

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
  vec3 t1 = uSpectralFresneln2 - vec3(1.0);
  vec3 t2 = uSpectralFresneln2 + vec3(1.0);
  vec3 t3 = uSpectralFresnelk2 * uSpectralFresnelk2;
  return (t1*t1 + 4.0*c*uSpectralFresneln2) / (t2*t2);
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


//////////////////////////////////////////////////
// D I F F U S E   B R D F S /////////////////////
//////////////////////////////////////////////////


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


//////////////////////////////////////////////////
// S P E C U L A R   B R D F S ///////////////////
//////////////////////////////////////////////////

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
		float t2 = (1.0 - c2) / c2;
		float D = (1.0 / 3.14159) * pow(alpha / (c2 * (alpha*alpha + t2)), Material.specularGGXgamma);
    return D;
}


float G2_MaskingShadowing(float NdotL, float NdotV, float NdotH, float VdotH)
{
	float G1 = 2.0 * NdotH * NdotV / VdotH;
	float G2 = 2.0 * NdotH * NdotL / VdotH;
	return min(1.0, min(G1, G2));
}


float D_BlinnPhong(float e, float NdotH)
{
		float C = (2.0 + e) / (2.0 * 3.14159);
		float D = C * pow(NdotH, e);
    return D;
}


//////////////////////////////////////////////////////////////////////
// S H A D O W   M A P P I N G ///////////////////////////////////////
//////////////////////////////////////////////////////////////////////

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


float SM_DecodeFloat (vec4 color) {
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

float SM_checkOffset(float fragmentZ, vec2 xy, vec2 offset) {
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

  float texelSize = iResolutionSunShadow.x;
  float amountInLight = 0.0;

  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      float texelDepth = SM_DecodeFloat(texture2D(SunShadowColorMap,
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

  float spread = 0.2 * (iResolutionSunShadow.x) * float(ShadowMapParam1);
  float accum = 0.0;
  const float numSamples = 9.0;
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.0000, -1.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.0000, -1.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.0000, -1.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.0000, 0.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.0000, 0.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.0000, 0.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.0000, 1.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.0000, 1.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.0000, 1.0000));
  return accum / numSamples;
}


float GetSunShadow3()
{
	vec3 sunShadowCoord = vec3(vSunShadowCoord) / vSunShadowCoord.w;
  vec2 xy = sunShadowCoord.xy;
  float fragmentZ = sunShadowCoord.z - shadowBias;

  float spread = 0.2 * (iResolutionSunShadow.x) * float(ShadowMapParam1);
  float accum = 0.0;
  const float numSamples = 16.0;
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.5000, -1.5000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.5000, -1.5000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.5000, -1.5000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.5000, -1.5000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.5000, -0.5000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.5000, -0.5000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.5000, -0.5000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.5000, -0.5000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.5000, 0.5000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.5000, 0.5000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.5000, 0.5000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.5000, 0.5000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.5000, 1.5000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.5000, 1.5000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.5000, 1.5000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.5000, 1.5000));
  return accum / numSamples;
}


float GetSunShadow4()
{
	vec3 sunShadowCoord = vec3(vSunShadowCoord) / vSunShadowCoord.w;
  vec2 xy = sunShadowCoord.xy;
  float fragmentZ = sunShadowCoord.z - shadowBias;

  float spread = 0.2 * (iResolutionSunShadow.x) * float(ShadowMapParam1);
  float accum = 0.0;
  const float numSamples = 25.0;
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.0000, -1.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.0000, -1.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.0000, -1.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.0000, 0.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.0000, 0.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.0000, 0.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.0000, 1.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.0000, 1.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.0000, 1.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-2.0000, -2.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.0000, -2.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.0000, -2.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.0000, -2.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(2.0000, -2.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-2.0000, -1.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(2.0000, 1.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-2.0000, 0.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(2.0000, 0.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-2.0000, 1.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(2.0000, 1.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-2.0000, -2.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.0000, -2.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.0000, -2.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.0000, -2.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(2.0000, -2.0000));
  return accum / numSamples;
}


float GetSunShadow5()
{
	vec3 sunShadowCoord = vec3(vSunShadowCoord) / vSunShadowCoord.w;
  vec2 xy = sunShadowCoord.xy;
  float fragmentZ = sunShadowCoord.z - shadowBias;

  float spread = 0.2 * (iResolutionSunShadow.x) * float(ShadowMapParam1);
  float accum = 0.0;
  const float numSamples = 8.0;
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.0000, 0.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.7071, 0.7071));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.0000, 1.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.7071, 0.7071));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.0000, 0.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.7071, -0.7071));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.0000, -1.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.7071, -0.7071));
  return accum / numSamples;
}


float GetSunShadow6()
{
	vec3 sunShadowCoord = vec3(vSunShadowCoord) / vSunShadowCoord.w;
  vec2 xy = sunShadowCoord.xy;
  float fragmentZ = sunShadowCoord.z - shadowBias;

  float spread = 0.2 * (iResolutionSunShadow.x) * float(ShadowMapParam1);
  float accum = 0.0;
  const float numSamples = 16.0;
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.0000, 0.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.7071, 0.7071));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.0000, 1.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.7071, 0.7071));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.0000, 0.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.7071, -0.7071));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.0000, -1.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.7071, -0.7071));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.6548, 1.3495));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.4912, 1.4173));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.3495, 0.6548));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.4173, -0.4912));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.6548, -1.3495));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.4912, -1.4173));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.3495, -0.6548));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.4173, 0.4912));
  return accum / numSamples;
}


float GetSunShadow7()
{
	vec3 sunShadowCoord = vec3(vSunShadowCoord) / vSunShadowCoord.w;
  vec2 xy = sunShadowCoord.xy;
  float fragmentZ = sunShadowCoord.z - shadowBias;

  float spread = 0.2 * (iResolutionSunShadow.x) * float(ShadowMapParam1);
  float accum = 0.0;
  const float numSamples = 8.0;
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.0000, -1.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.8750, -0.8750));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.0000, 1.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.3750, 0.7500));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.3750, -0.7500));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.3750, -0.1250));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.2500, -0.5000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.7500, -0.3750));
  return accum / numSamples;
}


float GetSunShadow8()
{
	vec3 sunShadowCoord = vec3(vSunShadowCoord) / vSunShadowCoord.w;
  vec2 xy = sunShadowCoord.xy;
  float fragmentZ = sunShadowCoord.z - shadowBias;

  float spread = 0.2 * (iResolutionSunShadow.x) * float(ShadowMapParam1);
  float accum = 0.0;
  const float numSamples = 16.0;
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.0000, -1.0000));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.7500, 0.2500));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.8750, -0.8750));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.7500, 0.2500));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.0000, 1.0000));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(2.0000, -1.7500));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.3750, 0.7500));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.5000, -1.7500));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.3750, -0.7500));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.7500, -1.2500));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.3750, -0.1250));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.7500, -1.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.2500, -0.5000));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.7500, -0.7500));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.7500, -0.3750));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.7500, -1.7500));
  return accum / numSamples;
}


float GetSunShadow9()
{
	vec3 sunShadowCoord = vec3(vSunShadowCoord) / vSunShadowCoord.w;
  vec2 xy = sunShadowCoord.xy;
  float fragmentZ = sunShadowCoord.z - shadowBias;

  float spread = 0.2 * (iResolutionSunShadow.x) * float(ShadowMapParam1);
  float accum = 0.0;
  const float numSamples = 24.0;
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.0000, -1.0000));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.7500, 0.2500));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(2.6250, 3.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.8750, -0.8750));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.7500, 0.2500));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.8750, 0.3750));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.0000, 1.0000));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(2.0000, -1.7500));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.3750, -2.2500));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.3750, 0.7500));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.5000, -1.7500));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(2.6250, 3.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.3750, -0.7500));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.7500, -1.2500));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.0000, 1.1250));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.3750, -0.1250));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.7500, -1.0000));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-2.2500, 1.1250));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.2500, -0.5000));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.7500, -0.7500));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.8750, 0.7500));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.7500, -0.3750));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.7500, -1.7500));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-3.0000, -3.0000));
  return accum / numSamples;
}


float GetSunShadow10()
{
	vec3 sunShadowCoord = vec3(vSunShadowCoord) / vSunShadowCoord.w;
  vec2 xy = sunShadowCoord.xy;
  float fragmentZ = sunShadowCoord.z - shadowBias;

  float spread = 0.2 * (iResolutionSunShadow.x) * float(ShadowMapParam1);
  float accum = 0.0;
  const float numSamples = 32.0;
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.0000, -1.0000));	accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.7500, 0.2500));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(2.6250, 3.0000));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.0000, -3.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.8750, -0.8750));	accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.7500, 0.2500));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.8750, 0.3750));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(3.5000, 4.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.0000, 1.0000));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(2.0000, -1.7500));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.3750, -2.2500));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.5000, 0.5000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.3750, 0.7500));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.5000, -1.7500));	accum += SM_checkOffset(fragmentZ, xy, spread*vec2(2.6250, 3.0000));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(2.5000, -3.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.3750, -0.7500));	accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.7500, -1.2500));	accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.0000, 1.1250));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-3.5000, -1.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.3750, -0.1250));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(1.7500, -1.0000));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-2.2500, 1.1250));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.0000, 2.5000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(0.2500, -0.5000));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.7500, -0.7500));	accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-1.8750, 0.7500));		accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-3.0000, 4.0000));
  accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.7500, -0.3750));	accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-0.7500, -1.7500));	accum += SM_checkOffset(fragmentZ, xy, spread*vec2(-3.0000, -3.0000));	accum += SM_checkOffset(fragmentZ, xy, spread*vec2(4.0000, 2.0000));
  return accum / numSamples;
}


//////////////////////////////////////////////////////////////////////
// F R A G M E N T   P R E P A R A T I O N ///////////////////////////
//////////////////////////////////////////////////////////////////////


mat3 TransposeMatrix(mat3 m) {
  return mat3(
    m[0].x, m[1].x, m[2].x,
    m[0].y, m[1].y, m[2].y,
    m[0].z, m[1].z, m[2].z);
}


mat3 MakeInverseMat3(mat3 M)
{
	mat3 M_t = TransposeMatrix(M);
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
  if (length(vNormal) < 0.1)
    Fragment.N = Fragment.Nbump;
  Fragment.V = normalize(vViewDir);
  if (map_normal_mix > 0.0)
    Fragment.N = PerturbNormal(Fragment.N, Fragment.V, vTexcoord.st);
  Fragment.R = reflect(Fragment.N, Fragment.R);
  Fragment.NdotV = max(0.0, dot(Fragment.N, Fragment.V));
  Fragment.NdotR = max(0.0, dot(Fragment.N, Fragment.R));

  if (map_Kd_mix > 0.0) {
    vec4 sample = texture2D(map_Kd, vTexcoord.st);
    Fragment.Kd = map_Kd_mix * sample.rgb + (1.0 - map_Kd_mix) * Kd;
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
  Material.specularExponent = max(0.0, 2.0 / (m * m + .00001) - 2.0);
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
    Lights[0].E0 = vec3(2.0, 2.0, 1.0);//SunE0;
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

float calcVariance4(float s1, float s2, float s3, float s4)
{
  float mean = (s1+s2+s3+s4) / 4.0;
  float v1 = pow(s1 - mean, 2.0);
  float v2 = pow(s2 - mean, 2.0);
  float v3 = pow(s3 - mean, 2.0);
  float v4 = pow(s4 - mean, 2.0);
  return (v1 + v2 + v3 + v4) / 4.0;
}

float calcVariance5(float s1, float s2, float s3, float s4, float s5)
{
  float mean = (s1+s2+s3+s4+s5) / 5.0;
  float v1 = pow(s1 - mean, 2.0);
  float v2 = pow(s2 - mean, 2.0);
  float v3 = pow(s3 - mean, 2.0);
  float v4 = pow(s4 - mean, 2.0);
  float v5 = pow(s5 - mean, 2.0);
  return (v1 + v2 + v3 + v4 + v5) / 5.0;
}

float edgeDepthSample(vec2 uv, vec2 duv) {
  return texture2D(GBufferDepth, uv + vec2(-duv.x, -duv.y)).r;
}

vec3 edgeNormalSample(vec2 uv, vec2 duv) {
  return texture2D(GBufferColor0, uv +  + vec2(-duv.x, -duv.y)).rgb;
}

float edgeDepthDetect(float spread, float maxVariance) {
  float du = spread / iResolutionGBuffer.x;
  float dv = spread / iResolutionGBuffer.y;
  vec2 uv = vTexcoord.xy / 2.0;
  float s1 = edgeDepthSample(uv, vec2(0, 0));
  float s2 = edgeDepthSample(uv, vec2(-du, -dv));
  float s3 = edgeDepthSample(uv, vec2( du, -dv));
  float s4 = edgeDepthSample(uv, vec2(-du,  dv));
  float s5 = edgeDepthSample(uv, vec2( du,  dv));

  if (s1 == 1.0)
    return 0.0;
  if (s2 == 1.0 || s3 == 1.0 || s4 == 1.0 || s5 == 1.0)
    return 1.0;
  
  float var = calcVariance5(s1, s2, s3, s4, s5);
  return var < maxVariance ? 0.0 : 1.0;
}

float edgeNormalDetect(float spread, float maxVariance) {
  float du = spread / iResolutionGBuffer.x;
  float dv = spread / iResolutionGBuffer.y;
  vec2 uv = vTexcoord.xy / 2.0;
  vec3 n1 = edgeNormalSample(uv, vec2(0, 0));
  vec3 n2 = edgeNormalSample(uv, vec2(-du, -dv));
  vec3 n3 = edgeNormalSample(uv, vec2(-du, -dv));
  vec3 n4 = edgeNormalSample(uv, vec2(-du, -dv));
  vec3 n5 = edgeNormalSample(uv, vec2(-du, -dv));
  float d1 = dot(n1, n2);
  float d2 = dot(n1, n3);
  float d3 = dot(n1, n4);
  float d4 = dot(n1, n5);
  if (d1 == 0.0 || d2 == 0.0 || d3 == 0.0 || d4 == 0.0)
    return 0.0;
  float var = calcVariance4(dot(n1, n2), dot(n1, n3), dot(n1, n4), dot(n1, n5));
  return 1.0 - (dot(n1, n2) + dot(n1, n3) + dot(n1, n4) + dot(n1, n5)) / 4.0;// < maxVariance ? 0.0 : 1.0;
}


vec3 kernel(float spread, mat3 K)
{
  vec2 scale = spread / iResolutionGBuffer.xy;
  vec2 uv = vTexcoord.xy / 2.0;
  vec3 result = Black;
  for (int i=0; i<3; i++) {
    for (int j=0; j<3; j++) {
        vec3 sample = texture2D(GBufferColor0, uv + scale * vec2(i-1, j-1)).rgb;
        result += sample * K[i][j];
    }
  }
  result *= 1.0 / 9.0;
  return result;
}

uniform int EdgeSampling;
vec3 edgeCenterColor;

float monochrome(vec3 color) {
  return 0.5 * dot(vec3(0.2126, 0.7152, 0.0722), color);
}

float getSample(vec2 uv) {
  int type = 4;
  if (EdgeSampling != 0) {
    type = EdgeSampling;
  }
  vec3 c = texture2D(GBufferColor0, uv).rgb;
  float z = texture2D(GBufferDepth, uv).r;
  if (type == 1) {
    return length(c);
  }
  if (type == 2) {
    return 1.0 - z;
  }
  if (type == 3) {
    float c = length(c);
    float d = 1.0 - z;
    return c*d;
  }
  if (type == 4) {
    return dot(c, edgeCenterColor);
  }
  if (type == 5) {
    return monochrome(c);
  }
  if (type == 6) {
    return (1.0 - z) * monochrome(c);
  }
}


float robertsCrossFilter(vec2 spacing, vec2 uv)
{
  mat2 sx = mat2(1.0, 0.0, 0.0, -1.0);
  mat2 sy = mat2(0.0, -1.0, 1.0, 0.0);
  mat2 I;
  for (int i = 0; i < 2; i++) {
    for (int j = 0; j < 2; j++) {
      I[i][j] = getSample(uv + spacing * vec2(i-1, j-1));
    }
  }

  float gx = dot(sx[0], I[0]) + dot(sx[1], I[1]);
  float gy = dot(sy[0], I[0]) + dot(sy[1], I[1]);
  float g = sqrt(gx*gx + gy*gy);
  return g;
}


float sobelEdge(vec2 spacing, vec2 uv) {
  mat3 sx = mat3( 
      1.0, 2.0, 1.0, 
      0.0, 0.0, 0.0, 
    -1.0, -2.0, -1.0 
  );
  mat3 sy = mat3( 
      1.0, 0.0, -1.0, 
      2.0, 0.0, -2.0, 
      1.0, 0.0, -1.0 
  );  

  mat3 I;
  for (int i=0; i<3; i++) {
    for (int j=0; j<3; j++) {
        I[i][j] = getSample(uv + spacing * vec2(i-1, j-1));
    }
  }

  float gx = dot(sx[0], I[0]) + dot(sx[1], I[1]) + dot(sx[2], I[2]); 
  float gy = dot(sy[0], I[0]) + dot(sy[1], I[1]) + dot(sy[2], I[2]);

  float g = sqrt(pow(gx, 2.0)+pow(gy, 2.0));  
  return g;
}


float prewittEdge(vec2 spacing, vec2 uv) {
  mat3 sx = mat3( 
      -1.0, -1.0, -1.0, 
       0.0,  0.0,  0.0, 
       1.0,  1.0,  1.0 
  );
  mat3 sy = mat3( 
      -1.0,  0.0,  1.0, 
      -1.0,  0.0,  1.0, 
      -1.0,  0.0,  1.0 
  );  

  mat3 I;
  for (int i=0; i<3; i++) {
    for (int j=0; j<3; j++) {
        I[i][j] = getSample(uv + spacing * vec2(i-1, j-1));
    }
  }

  float gx = dot(sx[0], I[0]) + dot(sx[1], I[1]) + dot(sx[2], I[2]); 
  float gy = dot(sy[0], I[0]) + dot(sy[1], I[1]) + dot(sy[2], I[2]);

  float g = sqrt(pow(gx, 2.0)+pow(gy, 2.0));  
  return g;
}

float samenessNormal(vec3 center, vec3 N) {
  if (length(center - N) < 0.1) return 0.0;
  return 1.0;
}

float samenessEdge(vec2 spacing, vec2 uv) {
  float a = 0.0;
  for (int i=0; i<3; i++) {
    for (int j=0; j<3; j++) {
      vec3 N = texture2D(GBufferColor0, uv + spacing * vec2(i-1, j-1)).rgb;
      a += samenessNormal(2.0 * (edgeCenterColor - 0.5), 2.0 * (N - 0.5));
    }
  }
  return a / 9.0;
}


const int NONE = 0;
const int ROBERTS_CROSS = 1;
const int SOBEL = 2;
const int PREWITT = 3;
const int SAMENESS_EDGE = 4;
const int SAMENESS_DEPTH = 5;
float Edge(int type, vec2 spacing, vec2 uv)
{
  if (type == ROBERTS_CROSS) return robertsCrossFilter(spacing, uv);
  if (type == SOBEL) return sobelEdge(spacing, uv);
  if (type == PREWITT) return prewittEdge(spacing, uv);
  if (type == SAMENESS_EDGE) return samenessEdge(spacing, uv);
  return getSample(uv);
}

float AAEdge(int type, vec2 spacing, vec2 uv)
{
  float a = 0.0;
  for (int i = -1; i <= 1; i++) {
    for (int j = -1; j <= 1; j++) {
      a += Edge(type, spacing, uv + spacing * vec2(i, j));
    }
  }
  a /= 9.0;
  return a;
}

float AAEdgeVar(int type, vec2 spacing, vec2 uv)
{
  float a = 0.0;
  float s[9];
  for (int i = -1; i <= 1; i++) {
    for (int j = -1; j <= 1; j++) {
      float sample = Edge(type, spacing, uv + spacing * vec2(i, j));
      a += sample;
      s[(i+1)*3+(j+1)] = sample;
    }
  }
  a /= 9.0;
  float Var = 0.0;
  for (int i = 0; i < 9; i++) {
    Var += pow(s[i] - a, 2.0);
  }
  return 1000.0 * Var / 9.0;
}

uniform float EdgeThreshold;
uniform int EdgeAlgorithm;

void main() {
  float edge = 0.0;
  float spread = 1.0;
  vec2 spacing = spread / iResolutionGBuffer.xy;
  vec2 uv = vTexcoord.xy;
  edgeCenterColor = texture2D(GBufferColor0, uv).rgb;
  //gl_FragColor = vec4(edgeCenterColor, 1.0);
  //return;
  // gl_FragColor = vec4(Red * getSample(uv), 1.0);
  // return;

  if (EdgeAlgorithm == 0) {
    gl_FragColor = vec4(getSample(uv) * White, 1.0);
    return;
  }

  edge = AAEdge(EdgeAlgorithm, spacing, uv);
  // edge += Edge(EdgeAlgorithm, spacing * 2.0, uv);
  // edge += Edge(EdgeAlgorithm, spacing * 4.0, uv);
  // edge *= 0.33;
  if (edge < EdgeThreshold)
    discard;

  edge = clamp(edge, 0.0, 1.0);
  vec3 finalColor = Black;
  edge = 1.0;//edge > 0.5 ? 1.0 : 0.0;
  gl_FragColor = vec4(finalColor, 1.0);
  return;

  // Adjust exposure and gamma correction
  float toneMapScale = uToneMapExposure;
  float gamma = uToneMapGamma;
  vec3 c_exposure = 2.5 * pow(2.0, toneMapScale) * finalColor;
  vec3 c_gamma = pow(c_exposure, vec3(1.0 / gamma));
  gl_FragColor = vec4(c_gamma, 1.0);
}

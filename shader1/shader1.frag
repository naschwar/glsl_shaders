#ifdef GL_ES
precision highp float;
#endif
#define PI 3.141592653589793238
uniform vec2 u_resolution;
uniform float u_time;

vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec2 P){
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x,gy.x);
  vec2 g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z);
  vec2 g11 = vec2(gx.w,gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 * 
    vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
  g00 *= norm.x;
  g01 *= norm.y;
  g10 *= norm.z;
  g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}

vec2 getRadialUv(vec2 uv)
{
    float angle = atan(uv.x, -uv.y); //get an angle ranging -PI to PI
    vec2 radialUV = vec2(0.0);
    radialUV.x = angle / (PI * 2.0) + 0.5;
    radialUV.y = 1.0 - pow(1.0- length(uv), 5.0);
    return radialUV;
}

vec3 getTerrainColor(float elevation, vec3 cPalette){
    vec3 orange = vec3(0.9059, 0.6471, 0.0824); 
    
    return mix(cPalette, orange, abs(elevation));
}

vec3 getWaterColor(float elevation, vec3 cPalette){
    vec3 blue = vec3(0.2314, 0.5412, 0.8275);
    return mix(blue, cPalette.yzx, abs(elevation));
}

vec3 cosPalette(float t, vec3 a, vec3 b, vec3 c, vec3 d){
    return a + b*cos(2.0*PI*c*t+d);
}

float getElevation(vec2 uv)
{
    float elevation = cnoise(uv*15.0);
    elevation += abs(cnoise(uv*20.0))*.7;
    elevation += abs(cnoise(uv*110.0))*.3;
    elevation += abs(cnoise(uv*400.0))*.25 ;

    return elevation;
}

float getShadow(float elevation, vec2 uv){
    vec2 towardSun = normalize(vec2(-uv.x, uv.y));
    float towardElevation = getElevation(towardSun*.0005+uv);
    if (towardElevation > elevation){
        return .2;
    }
    return 0.0;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - u_resolution*.5)/u_resolution.yy;
    vec2 radialUV = getRadialUv(uv);
    radialUV.y -= u_time*.01;
    radialUV.x -= u_time*.005;
    
    float elevation = getElevation(radialUV);
    vec3 col = vec3(elevation);

    vec3 cPalette = cosPalette(u_time*.25, vec3(.6, .45, .65), vec3(.15), vec3(.2, .5, .35), vec3(.1, .2, .2));
    if (elevation < 0.0){
        col = getWaterColor(elevation, cPalette);
    }else{
        col = getTerrainColor(elevation, cPalette);
    }
    col += getShadow(elevation, uv);
 
    gl_FragColor=vec4(col,1.0);
}
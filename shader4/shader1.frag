#ifdef GL_ES
precision highp float;
#endif
#define PI 3.141592653589793238
uniform vec2 u_resolution;
uniform float u_time;

vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
uniform sampler2D u_tex0;

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
float circleDF(float centerX, float centerY, vec2 uv){
    vec2 centerPt = vec2(centerX, centerY);
    float dist = length(centerPt - uv);
    return dist;
}

float vmax(vec2 v) {
	return max(v.x, v.y);
}

void pR(inout vec2 p, float a) {
    p = cos(a)*p + sin(a)*vec2(p.y, -p.x);
}

float pMod1(inout float p, float size) {
    float halfsize = size*0.5;
    float c = floor((p + halfsize)/size);
    p = mod(p + halfsize, size) - halfsize;
    return c;
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float fBox2(vec2 p, vec2 b) {
	vec2 d = abs(p) - b;
	return length(max(d, vec2(0))) + vmax(min(d, vec2(0)));
}
vec2 sgn(vec2 v) {
	return vec2((v.x<0.)?-1.:1., (v.y<0.)?-1.:1.);
}

float sgn(float x) {
	return (x<0.)?-1.:1.;
}

float smoothMod(float axis, float amp, float rad){
    float top = cos(PI * (axis / amp)) * sin(PI * (axis / amp));
    float bottom = pow(sin(PI * (axis / amp)), 2.0) + pow(rad, 2.0);
    float at = atan(top / bottom);
    return amp * (1.0 / 2.0) - (1.0 / PI) * at;
}

float pMirror (inout float p, float dist) {
	float s = sgn(p);
	p = abs(p)-dist;
	return s;
}
vec2 pMirrorOctant (inout vec2 p, vec2 dist) {
	vec2 s = sgn(p);
	pMirror(p.x, dist.x);
	pMirror(p.y, dist.y);
	if (p.y > p.x)
		p.xy = p.yx;
	return s;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - u_resolution*.5)/u_resolution.yy;
    float noise = cnoise(uv);
    pR(uv, cos(u_time*.15));
    float circle = circleDF(0.,0., uv);

    float beam = circleDF(0.05*cos(u_time*.02), 0.05*sin(u_time*.02), uv);

  
    float swirl = length(mix(uv*sin(u_time*.07), vec2(2.*cnoise(vec2(u_time*.15 + uv.y,u_time*.05))), noise));
    vec2 pos = uv;
    pMirrorOctant(pos, vec2(beam, sin(u_time*.02) + beam));
    float d = fBox2(pos, vec2(.5*sin(.1*u_time), .15*sin(.1*u_time)));
    
    float boxB = smoothMod(d+sin(.05*u_time), max(d*cos(u_time*.02), .2), swirl*2.5);

    pMirror(d, beam);
    float boxG= smoothMod(d+sin(.03*u_time), max(d*sin(u_time*.05), .3), .8);
    
    pR(pos, d);
    float boxR= smoothMod(pos.x-sin(.05*u_time), max(pos.y*sin(u_time*.05), .15), .6);
    
    vec3 col = vec3(boxR, .5*boxG, boxB);
    vec3 swirlCol = vec3(min(swirl, .5)) +  col;
    gl_FragColor= vec4(mix(swirlCol, hsv2rgb(vec3(col.x, min(col.y, .65), max(.5, col.z))), pos.x/pos.y+d*sin(u_time*.01)), 1.);
}
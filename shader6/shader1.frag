#ifdef GL_ES
precision highp float;
#endif
#define PI 3.141592653589793238
uniform vec2 u_resolution;
uniform float u_time;
#define PHI (sqrt(5.)*0.5 + 0.5)

float circleDF(float centerX, float centerY, vec2 uv){
    vec2 centerPt = vec2(centerX, centerY);
    float dist = length(centerPt - uv);
    return dist;
}

vec3 cosPal(float t, vec3 a, vec3 b, vec3 c, vec3 d){
    return a + b * (cos(((c*t) + d)*2.*PI));   
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
    uv.y *= smoothMod(.5*uv.y, .05, .1);
    float loop = .5*cos(u_time*.25);
    float temp = uv.y/loop*u_time;
    pMirror(temp, .5);

    float outter = .70 - (length(temp));

     gl_FragColor= vec4(vec3(temp, cos(u_time*.15), outter), 1.);
}
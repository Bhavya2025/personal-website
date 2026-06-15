/**
 * TEMPORARY (preview) — real WebGL2 / GLSL background scenes.
 *
 * Two Shadertoy-style fragment shaders rendered on a fullscreen triangle:
 *   - 'complexgrid'  : a complex-plane grid warped by a cubic Bézier map
 *                      (recoloured to the dark amber/bone/cool theme; time-only
 *                      animation, independent of scroll & cursor).
 *   - 'complexgrid2' : the same shader, calmer — slower (timeScale 0.5), more
 *                      faded (uFade 0.55), and collapsed to a single faded hue
 *                      (uMono 1) so it recedes further behind text.
 *   - 'synthwave'    : a raymarched retro sunset over an endless grid terrain
 *                     (recoloured to an amber sunset to fit the brand — the
 *                     site avoids purple; flip the COLOR consts for classic
 *                     synthwave; raymarch iterations + resolution reduced so it
 *                     runs as a calm full-screen backdrop).
 *
 * Each scene compiles once and exposes render()/dispose(). Driven by GlSky.tsx,
 * which owns sizing (DPR cap + per-scene quality), the scroll progress, the
 * cursor and reduced-motion. Uniforms follow the Shadertoy convention
 * (iResolution/iTime/iTimeDelta/iMouse) plus uProgress.
 *
 * Delete with the rest of the bg-preview system once a background is chosen.
 */

import type { BgPage } from '../bgVariants'
import type { BgVariant } from '../bgStore'

export interface GlSceneInput {
  /** drawing-buffer size in px (already DPR/quality scaled by GlSky) */
  w: number
  h: number
  timeSec: number
  dtSec: number
  /** scroll 0..1 (home) or a fixed ambient value (projects) */
  progress: number
  reduced: boolean
  /** cursor in drawing-buffer px, y measured from the BOTTOM (Shadertoy convention) */
  mouseX: number
  mouseY: number
  mouseDown: boolean
}

export interface GlScene {
  render(input: GlSceneInput): void
  dispose(): void
}

// fullscreen triangle — no vertex buffer needed (gl_VertexID)
const VERT = `#version 300 es
void main() {
  vec2 v = vec2((gl_VertexID == 1) ? 3.0 : -1.0, (gl_VertexID == 2) ? 3.0 : -1.0);
  gl_Position = vec4(v, 0.0, 1.0);
}`

// ---------------------------------------------------------------------------
// COMPLEX GRID — complex-plane grid warped by a cubic Bézier map
// ---------------------------------------------------------------------------
const COMPLEX_BODY = `
vec2 ortho(vec2 v){ return vec2(v.y, -v.x); }

// uMono (0/1) collapses every line/axis/square hue to this single faded tone;
// uFade scales line/axis/square alpha down so the grid recedes behind text.
// (complexgrid: uMono=0, uFade=1. complexgrid2: uMono=1, uFade~0.55.)
const vec3 MONO_COL = vec3(0.62, 0.56, 0.44);     // dim faded bone/amber
vec3 themed(vec3 color){ return mix(color, MONO_COL, uMono); }

void stroke(float dist, vec3 color, inout vec3 fragColor, float thickness, float aa){
    float alpha = smoothstep(0.5*(thickness+aa), 0.5*(thickness-aa), abs(dist)) * uFade;
    fragColor = mix(fragColor, themed(color), alpha);
}
void fill(float dist, vec3 color, inout vec3 fragColor, float aa){
    float alpha = smoothstep(0.5*aa, -0.5*aa, dist) * uFade;
    fragColor = mix(fragColor, themed(color), alpha);
}

void renderGrid(vec2 pos, out vec3 fragColor){
    vec3 background = vec3(0.018, 0.018, 0.032);   // near-black ink
    vec3 axes = vec3(1.0, 0.69, 0.0);              // amber
    vec3 lines = vec3(0.34, 0.32, 0.26);           // dim bone
    vec3 sublines = vec3(0.10, 0.10, 0.10);        // very dim
    float subdiv = 10.0;
    float thickness = 0.003;
    float aa = length(fwidth(pos));
    fragColor = background;
    vec2 toSubGrid = pos - round(pos*subdiv)/subdiv;
    stroke(min(abs(toSubGrid.x), abs(toSubGrid.y)), sublines, fragColor, thickness, aa);
    vec2 toGrid = pos - round(pos);
    stroke(min(abs(toGrid.x), abs(toGrid.y)), lines, fragColor, thickness, aa);
    stroke(min(abs(pos.x), abs(pos.y)), axes, fragColor, thickness, aa);
}

float distLineSeg(vec2 a, vec2 b, vec2 pos){
    float proj = dot(pos - a, b - a) / dot(b - a, b - a);
    vec2 posNearest = mix(a, b, clamp(proj, 0.0, 1.0));
    return length(pos - posNearest);
}
float sdistLine(vec2 a, vec2 b, vec2 pos){ return dot(pos - a, normalize(ortho(b - a))); }
float sdistTri(vec2 a, vec2 b, vec2 c, vec2 pos){
    return max(sdistLine(a, b, pos), max(sdistLine(b, c, pos), sdistLine(c, a, pos)));
}
float sdistQuadConvex(vec2 a, vec2 b, vec2 c, vec2 d, vec2 pos){
    return max(sdistLine(a, b, pos), max(sdistLine(b, c, pos), max(sdistLine(c, d, pos), sdistLine(d, a, pos))));
}
void renderUnitSquare(vec2 pos, inout vec3 fragColor){
    float dist = sdistQuadConvex(vec2(0,0), vec2(1,0), vec2(1,1), vec2(0,1), pos);
    stroke(dist, vec3(0.47, 0.66, 1.0), fragColor, 0.007, length(fwidth(pos))); // cool
}
void renderAxes(vec2 origin, vec2 pos, inout vec3 fragColor){
    float len = 0.1;
    float thickness = 0.0075;
    float aa = length(fwidth(pos));
    float xshaft = sdistQuadConvex(origin + vec2(0.5*thickness), origin - vec2(0.5*thickness),
                                   origin + vec2(len, -0.5*thickness), origin + vec2(len, 0.5*thickness), pos);
    float xhead = sdistTri(origin + vec2(len, -2.0*thickness), origin + vec2(len + 6.0*thickness, 0),
                           origin + vec2(len, 2.0*thickness), pos);
    fill(min(xshaft, xhead), vec3(1.0, 0.69, 0.0), fragColor, aa);     // amber x
    float yshaft = sdistQuadConvex(origin - vec2(0.5*thickness), origin + vec2(0.5*thickness),
                                   origin + vec2(0.5*thickness, len), origin + vec2(-0.5*thickness, len), pos);
    float yhead = sdistTri(origin + vec2(2.0*thickness, len), origin + vec2(0, len + 6.0*thickness),
                           origin + vec2(-2.0*thickness, len), pos);
    fill(min(yshaft, yhead), vec3(0.47, 0.66, 1.0), fragColor, aa);    // cool y
}

vec2 cmul(vec2 a, vec2 b){ return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x); }
vec2 csqr(vec2 z){ return cmul(z, z); }
vec2 ccube(vec2 z){ return cmul(cmul(z, z), z); }
vec2 cexpi(float theta){ return vec2(cos(theta), sin(theta)); }

void mainImage(out vec4 fragColor, in vec2 fragCoord){
    float aspect = iResolution.x / iResolution.y;
    vec2 pos = (fragCoord / iResolution.y) * 1.5 - vec2((1.5*aspect - 1.0)/2.0, 0.25);

    vec2 b3_0 = ccube(vec2(1,0) - pos);
    vec2 b3_1 = 3.0 * cmul(pos, csqr(vec2(1,0) - pos));
    vec2 b3_2 = 3.0 * cmul(csqr(pos), vec2(1,0) - pos);
    vec2 b3_3 = ccube(pos);

    // Independent of cursor AND scroll — a calm, continuous time-only animation.
    float angle0 = 0.8*sin(iTime*1.2);
    float angle1 = 0.8*cos(iTime*0.9);
    pos =
        cmul(1.0/3.0 * cexpi(angle0), b3_1) +
        cmul(vec2(1, 0) - 1.0/3.0 * cexpi(angle1), b3_2) +
        1.0*b3_3;

    fragColor.a = 1.0;
    renderGrid(pos, fragColor.rgb);
    renderUnitSquare(pos, fragColor.rgb);
    renderAxes(vec2(0), pos, fragColor.rgb);
    renderAxes(vec2(1, 0), pos, fragColor.rgb);

    // keep page edges dark for overlaid text; the faded cut (uFade<1) pulls the
    // whole frame darker and deepens the vignette floor so it recedes further.
    vec2 uv = fragCoord / iResolution.xy;
    float vig = smoothstep(1.2, 0.32, length(uv - 0.5));
    float vigFloor = mix(0.18, 0.5, uFade);  // darker corners when faded
    fragColor.rgb *= mix(vigFloor, 1.0, vig) * mix(0.7, 1.0, uFade);
}`

// ---------------------------------------------------------------------------
// SYNTHWAVE — raymarched retro sunset over an endless grid (amber recolour)
// ---------------------------------------------------------------------------
const SYNTH_BODY = `
#define disable_sound_texture_sampling
#define speed 8.0
#define wave_thing
#define audio_vibration_amplitude 0.125
#define textureMirror(a, b) vec4(0.0)

float jTime;

float amp(vec2 p){ return smoothstep(1.0, 8.0, abs(p.x)); }
float pow512(float a){ a*=a;a*=a;a*=a;a*=a;a*=a;a*=a;a*=a;a*=a; return a*a; }
float pow1d5(float a){ return a*sqrt(a); }
float hash21(vec2 co){ return fract(sin(dot(co.xy, vec2(1.9898,7.233)))*45758.5433); }

float hashw(vec2 uv){
    float a = amp(uv);
    #ifdef wave_thing
    float w = a>0.0 ? (1.0 - 0.4*pow512(0.51 + 0.49*sin((0.02*(uv.y+0.5*uv.x) - jTime)*2.0))) : 0.0;
    #else
    float w = 1.0;
    #endif
    return (a>0.0 ? a*pow1d5(hash21(uv))*w : 0.0)
           - (textureMirror(iChannel0, vec2((uv.x*29.0+uv.y)*0.03125, 1.0)).x)*audio_vibration_amplitude;
}

float edgeMin(float dx, vec2 da, vec2 db, vec2 uv){
    uv.x += 5.0;
    vec3 c = fract((round(vec3(uv, uv.x+uv.y)))*(vec3(0,1,2)+0.61803398875));
    float a1 = textureMirror(iChannel0, vec2(c.y,0.0)).x>0.6 ? 0.15 : 1.0;
    float a2 = textureMirror(iChannel0, vec2(c.x,0.0)).x>0.6 ? 0.15 : 1.0;
    float a3 = textureMirror(iChannel0, vec2(c.z,0.0)).x>0.6 ? 0.15 : 1.0;
    return min(min((1.0-dx)*db.y*a3, da.x*a2), da.y*a1);
}

vec2 trinoise(vec2 uv){
    const float sq = sqrt(3.0/2.0);
    uv.x *= sq;
    uv.y -= 0.5*uv.x;
    vec2 d = fract(uv);
    uv -= d;
    bool c = dot(d, vec2(1)) > 1.0;
    vec2 dd = 1.0 - d;
    vec2 da = c ? dd : d, db = c ? d : dd;
    float nn = hashw(uv + float(c));
    float n2 = hashw(uv + vec2(1,0));
    float n3 = hashw(uv + vec2(0,1));
    float nmid = mix(n2, n3, d.y);
    float ns = mix(nn, c ? n2 : n3, da.y);
    float dx = da.x/db.y;
    return vec2(mix(ns, nmid, dx), edgeMin(dx, da, db, uv+d));
}

vec2 map(vec3 p){
    vec2 n = trinoise(p.xz);
    return vec2(p.y - 2.0*n.x, n.y);
}
vec3 grad(vec3 p){
    const vec2 e = vec2(0.005, 0.0);
    float a = map(p).x;
    return vec3(map(p+e.xyy).x - a, map(p+e.yxy).x - a, map(p+e.yyx).x - a)/e.x;
}

vec2 intersect(vec3 ro, vec3 rd){
    float d = 0.0, h = 0.0;
    for (int i = 0; i < 90; i++){   // reduced from 500 for a background
        vec3 p = ro + d*rd;
        vec2 s = map(p);
        h = s.x;
        d += h*0.5;
        if (abs(h) < 0.003*d) return vec2(d, s.y);
        if (d > 90.0 || p.y > 2.0) break;
    }
    return vec2(-1.0);
}

void addsun(vec3 rd, vec3 ld, inout vec3 col){
    float sun = smoothstep(0.21, 0.2, distance(rd, ld));
    if (sun > 0.0){
        float yd = (rd.y - ld.y);
        float a = sin(3.1*exp(-(yd)*14.0));
        sun *= smoothstep(-0.8, 0.0, a);
        col = mix(col, vec3(1.0, 0.72, 0.32)*0.85, sun);   // amber sun
    }
}

float starnoise(vec3 rd){
    float c = 0.0;
    vec3 p = normalize(rd)*300.0;
    for (float i = 0.0; i < 4.0; i++){
        vec3 q = fract(p) - 0.5;
        vec3 id = floor(p);
        float c2 = smoothstep(0.5, 0.0, length(q));
        c2 *= step(hash21(id.xz/id.y), 0.06 - i*i*0.005);
        c += c2;
        p = p*0.6 + 0.5*p*mat3(3.0/5.0,0,4.0/5.0, 0,1,0, -4.0/5.0,0,3.0/5.0);
    }
    c *= c;
    float g = dot(sin(rd*10.512), cos(rd.yzx*10.512));
    c *= smoothstep(-3.14, -0.9, g)*0.5 + 0.5*smoothstep(-0.3, 1.0, g);
    return c*c;
}

vec3 gsky(vec3 rd, vec3 ld, bool mask){
    float haze = exp2(-5.0*(abs(rd.y) - 0.2*dot(rd, ld)));
    float st = mask ? (starnoise(rd))*(1.0 - min(haze, 1.0)) : 0.0;
    vec3 back = vec3(0.10, 0.07, 0.17)*(1.0 - 0.5*textureMirror(iChannel0, vec2(0.5+0.05*rd.x/rd.y, 0.0)).x
        * exp2(-0.1*abs(length(rd.xz)/rd.y)) * max(sign(rd.y), 0.0));
    vec3 col = clamp(mix(back, vec3(0.95, 0.5, 0.18), haze) + st, 0.0, 1.0);  // amber haze
    if (mask) addsun(rd, ld, col);
    return col;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord){
    fragColor = vec4(0.0);
    vec2 uv = (2.0*fragCoord - iResolution.xy)/iResolution.y;

    const float shutter_speed = 0.25;
    float dt = fract(hash21(fragCoord) + iTime)*shutter_speed;
    jTime = mod(iTime - dt*iTimeDelta, 4000.0);
    vec3 ro = vec3(0.0, 1.0, -20000.0 + jTime*speed);

    vec3 rd = normalize(vec3(uv, 4.0/3.0));
    vec2 inter = intersect(ro, rd);
    float d = inter.x;

    vec3 ld = normalize(vec3(0.0, 0.125 + 0.05*sin(0.1*jTime), 1.0));
    vec3 fog = d > 0.0 ? exp2(-d*vec3(0.14, 0.11, 0.24)) : vec3(0.0);
    vec3 sky = gsky(rd, ld, d < 0.0);

    vec3 p = ro + d*rd;
    vec3 n = normalize(grad(p));
    float diff = dot(n, ld) + 0.1*n.y;
    vec3 col = vec3(0.10, 0.11, 0.18)*diff;

    vec3 rfd = reflect(rd, n);
    vec3 rfcol = gsky(rfd, ld, true);
    col = mix(col, rfcol, 0.05 + 0.95*pow(max(1.0 + dot(rd, n), 0.0), 5.0));
    // amber grid lines
    float lineAmt = smoothstep(0.05, 0.0, inter.y);
    col = mix(col, vec3(0.95, 0.5, 0.12), lineAmt);
    col = mix(sky, col, fog);

    // keep page edges dark for overlaid text
    float vig = smoothstep(1.25, 0.35, length(fragCoord/iResolution.xy - 0.5));
    col *= mix(0.55, 1.0, vig);

    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`

function fragSource(body: string): string {
  return `#version 300 es
precision highp float;
uniform vec3 iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform vec4 iMouse;
uniform float uProgress;
uniform float uFade;
uniform float uMono;
out vec4 outColor;
${body}
void main() {
  vec4 c;
  mainImage(c, gl_FragCoord.xy);
  outColor = vec4(c.rgb, 1.0);
}`
}

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type)
  if (!sh) return null
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('[glScenes] shader compile failed:', gl.getShaderInfoLog(sh))
    gl.deleteShader(sh)
    return null
  }
  return sh
}

function makeProgram(gl: WebGL2RenderingContext, body: string): WebGLProgram | null {
  const vs = compile(gl, gl.VERTEX_SHADER, VERT)
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragSource(body))
  if (!vs || !fs) return null
  const prog = gl.createProgram()
  if (!prog) return null
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[glScenes] program link failed:', gl.getProgramInfoLog(prog))
    gl.deleteProgram(prog)
    return null
  }
  return prog
}

export function makeGlScene(
  gl: WebGL2RenderingContext,
  variant: BgVariant,
  _page: BgPage,
): GlScene {
  const isSynth = variant === 'synthwave'
  const body = isSynth ? SYNTH_BODY : COMPLEX_BODY
  // complexgrid2 = a calmer cut of the complex grid: slower motion, faded lines,
  // collapsed to a single monotone hue.
  const timeScale = variant === 'complexgrid2' ? 0.5 : 1
  const fade = variant === 'complexgrid2' ? 0.55 : 1
  const mono = variant === 'complexgrid2' ? 1 : 0

  const prog = makeProgram(gl, body)
  const vao = gl.createVertexArray() // empty VAO; the triangle is gl_VertexID-only

  const u = prog
    ? {
        res: gl.getUniformLocation(prog, 'iResolution'),
        time: gl.getUniformLocation(prog, 'iTime'),
        dt: gl.getUniformLocation(prog, 'iTimeDelta'),
        mouse: gl.getUniformLocation(prog, 'iMouse'),
        progress: gl.getUniformLocation(prog, 'uProgress'),
        fade: gl.getUniformLocation(prog, 'uFade'),
        mono: gl.getUniformLocation(prog, 'uMono'),
      }
    : null

  return {
    render(input) {
      if (!prog || !u) {
        gl.clearColor(0.012, 0.012, 0.02, 1)
        gl.clear(gl.COLOR_BUFFER_BIT)
        return
      }
      gl.viewport(0, 0, input.w, input.h)
      gl.useProgram(prog)
      gl.bindVertexArray(vao)
      gl.uniform3f(u.res, input.w, input.h, 1)
      gl.uniform1f(u.time, input.timeSec * timeScale)
      gl.uniform1f(u.dt, input.dtSec * timeScale)
      gl.uniform1f(u.progress, input.progress)
      gl.uniform1f(u.fade, fade) // null location → silently ignored
      gl.uniform1f(u.mono, mono)
      // iMouse: xy = position (buffer px, y from bottom), z>0 while the cursor is active
      gl.uniform4f(u.mouse, input.mouseX, input.mouseY, input.mouseDown ? 1 : 0, 0)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      gl.bindVertexArray(null)
    },
    dispose() {
      if (prog) gl.deleteProgram(prog)
      if (vao) gl.deleteVertexArray(vao)
    },
  }
}

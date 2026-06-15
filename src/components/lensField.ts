/**
 * lensField.ts — gravitational-lens displacement map for SVG feDisplacementMap.
 *
 * Generates a true VECTOR field (a "normal map"), NOT a grayscale radial gradient.
 * feDisplacementMap samples each output pixel from a source offset:
 *
 *   P'(x,y) = P( x + scale*(R_map - 0.5), y + scale*(G_map - 0.5) )
 *
 * with xChannelSelector="R", yChannelSelector="G". So the RED channel must carry the
 * X-component of the displacement and GREEN the Y-component — independently. A radial
 * grey ramp (R == G everywhere) gives a constant diagonal (s,s) push (the old boxy
 * pinch bug). Here R and G encode a genuine radial+tangential field that curves DOM
 * content INTO the hole and wraps it with a swirl, and that smoothly decays to neutral
 * by the disc edge so nothing outside the lens warps.
 *
 * WIRING (only the lens region warps — the rest of the screen is left untouched):
 *
 *   <filter id="blackhole" color-interpolation-filters="sRGB"
 *           x="-20%" y="-20%" width="140%" height="140%">
 *     <feImage href={dataURL}
 *              x={cx - size/2} y={cy - size/2} width={size} height={size}
 *              result="lensRaw" />
 *     <feFlood flood-color="rgb(128,128,128)" result="flat" />
 *     <feComposite in="lensRaw" in2="flat" operator="over" result="map" />
 *     <feDisplacementMap in="SourceGraphic" in2="map"
 *                        scale={RECOMMENDED_SCALE}
 *                        xChannelSelector="R" yChannelSelector="G" />
 *   </filter>
 *
 * The map PNG emits alpha 0 (AND rgb 128,128,128) outside the disc, so feComposite
 * "over" the neutral flood guarantees a seamless neutral surround regardless of how the
 * <feImage> is scaled. color-interpolation-filters="sRGB" on the <filter> is REQUIRED so
 * that channel value 128 is the true neutral midpoint (linearRGB would shift it).
 */

export interface LensOptions {
  /** Map texture resolution in px (square). Pairs with the on-screen <feImage> size. */
  size?: number;
  /** Radial pull magnitude (0..1-ish). Higher = content curves harder into the hole. */
  strength?: number;
  /** Tangential (rotational) magnitude. Higher = tighter wrap/swirl around centre. */
  swirl?: number;
  /** -1 = suck inward (default, black hole); +1 = bulge outward (lens/magnifier). */
  radialSign?: 1 | -1;
  /** Normalized radius where the magnitude profile peaks (0..1). ~0.6–0.8 feels gravitational. */
  peak?: number;
}

export const LENS_DEFAULTS: Required<LensOptions> = {
  size: 256,
  strength: 0.85,
  swirl: 0.22,
  radialSign: -1,
  peak: 0.7,
};

/**
 * Good feDisplacementMap `scale` (in CSS px) to pair with the defaults.
 *
 * The encoded field components are in [-1,1] but typically peak around `strength`, so the
 * actual pixel shift ≈ scale * fieldMagnitude. A scale roughly ~14% of the on-screen lens
 * size gives a strong-but-stable wrap without tearing. Rule of thumb:
 *   scale ≈ 0.14 * (on-screen lens size in px).
 * (e.g. a 256px lens → scale ≈ 36). Raise `scale` OR `strength` for a deeper well.
 */
export const RECOMMENDED_SCALE = 36;

const NEUTRAL_1X1 =
  'data:image/png;base64,' +
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==';

/** Hermite smoothstep on [edge0, edge1]; returns 0 below edge0, 1 above edge1. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  let t = (x - edge0) / (edge1 - edge0);
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  return t * t * (3 - 2 * t);
}

/**
 * Magnitude profile mag(r) over the unit disc r∈[0,1]:
 *   - 0 at the very centre (r→0), rising,
 *   - peaks near `peak`,
 *   - smoothly returns to 0 by r=1 (seamless blend into the neutral surround).
 * Built as (ramp toward the peak) * (smoothstep falloff to the rim).
 */
function magProfile(r: number, peak: number): number {
  if (r <= 0 || r >= 1) return 0;
  // rise from centre to the peak, then ease back down — a soft bell weighted toward `peak`.
  const rise = smoothstep(0, peak, r);
  const fall = 1 - smoothstep(peak, 1, r);
  return rise * fall;
}

/** Encode a signed value f∈[-1,1] into an 8-bit channel (0.5 == neutral 128). */
function encode(f: number): number {
  const c = 0.5 + 0.5 * f;
  const clamped = c < 0 ? 0 : c > 1 ? 1 : c;
  return Math.round(clamped * 255);
}

function makeCanvas(size: number): {
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  toURL: () => string;
} | null {
  if (typeof OffscreenCanvas !== 'undefined') {
    const oc = new OffscreenCanvas(size, size);
    const ctx = oc.getContext('2d');
    if (!ctx) return null;
    return {
      ctx,
      // convertToBlob is async; for a sync data-URI fall back to a paint-through canvas.
      toURL: () => {
        const tmp = document.createElement('canvas');
        tmp.width = size;
        tmp.height = size;
        const tctx = tmp.getContext('2d');
        if (!tctx) return NEUTRAL_1X1;
        tctx.drawImage(oc, 0, 0);
        return tmp.toDataURL('image/png');
      },
    };
  }
  const cv = document.createElement('canvas');
  cv.width = size;
  cv.height = size;
  const ctx = cv.getContext('2d');
  if (!ctx) return null;
  return { ctx, toURL: () => cv.toDataURL('image/png') };
}

/**
 * Build the lens displacement map as a `data:image/png;base64,...` URL.
 * Pure & deterministic: no Math.random, no time, no global state.
 */
export function buildLensMap(opts?: LensOptions): string {
  // SSR guard — no DOM means no canvas; return a tiny neutral map.
  if (typeof document === 'undefined') return NEUTRAL_1X1;

  const o: Required<LensOptions> = { ...LENS_DEFAULTS, ...opts };
  const size = Math.max(1, Math.floor(o.size));

  const made = makeCanvas(size);
  if (!made) return NEUTRAL_1X1;
  const { ctx, toURL } = made;

  const img = ctx.createImageData(size, size);
  const data = img.data;

  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const radius = size / 2; // lens disc radius in px → normalized so r=1 at the rim.
  const sign = o.radialSign;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      const u = (x - cx) / radius; // normalized offset from centre, r=1 at the disc edge
      const v = (y - cy) / radius;
      const r = Math.hypot(u, v);

      let cr = 128;
      let cg = 128;
      let alpha = 0; // outside the disc: fully transparent + neutral.

      if (r > 0 && r < 1) {
        const inv = 1 / r;
        const radDirX = u * inv; // unit radial direction (centre → pixel)
        const radDirY = v * inv;
        const tanDirX = -radDirY; // unit tangential direction (90° CCW)
        const tanDirY = radDirX;

        const mag = magProfile(r, o.peak) * o.strength;
        const swr = magProfile(r, o.peak) * o.swirl; // swirl shares the falloff → 0 at r=1

        let fx = sign * radDirX * mag + tanDirX * swr;
        let fy = sign * radDirY * mag + tanDirY * swr;

        // clamp to the encodable range
        if (fx < -1) fx = -1;
        else if (fx > 1) fx = 1;
        if (fy < -1) fy = -1;
        else if (fy > 1) fy = 1;

        cr = encode(fx);
        cg = encode(fy);
        alpha = 255;
      }

      data[idx] = cr;
      data[idx + 1] = cg;
      data[idx + 2] = 128; // blue unused by the displacement; keep neutral.
      data[idx + 3] = alpha;
    }
  }

  ctx.putImageData(img, 0, 0);
  return toURL();
}

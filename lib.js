// Pure helpers for Pramaan. No DOM, so they run under node --test.

export const mmToPx = (mm, dpi) => Math.round((mm / 25.4) * dpi);

/**
 * Source rectangle that fills a tw x th target without distortion.
 * zoom >= 1 tightens the crop; fx, fy in [0,1] choose where the window sits.
 */
export function coverCrop(sw, sh, tw, th, zoom = 1, fx = 0.5, fy = 0.5) {
  const ta = tw / th;
  let cw = sw, ch = sw / ta;
  if (ch > sh) { ch = sh; cw = sh * ta; }
  cw /= zoom;
  ch /= zoom;
  const sx = (sw - cw) * Math.min(1, Math.max(0, fx));
  const sy = (sh - ch) * Math.min(1, Math.max(0, fy));
  return { sx, sy, sw: cw, sh: ch };
}

/**
 * Binary search over JPEG quality. encode(q) resolves to something with .size.
 * Returns the best-quality result whose size is within [minBytes, maxBytes].
 */
export async function fitQuality(encode, maxBytes, minBytes = 0) {
  let lo = 0.05, hi = 0.98, best = null;
  const top = await encode(hi);
  if (top.size <= maxBytes) {
    return top.size >= minBytes ? { ok: true, q: hi, size: top.size, out: top } : { ok: false, reason: 'small', q: hi, size: top.size, out: top };
  }
  for (let k = 0; k < 9; k++) {
    const q = (lo + hi) / 2;
    const r = await encode(q);
    if (r.size <= maxBytes) { best = { q, size: r.size, out: r }; lo = q; } else { hi = q; }
  }
  if (!best) {
    const r = await encode(0.05);
    if (r.size <= maxBytes) best = { q: 0.05, size: r.size, out: r };
  }
  if (!best) return { ok: false, reason: 'big' };
  if (best.size < minBytes) return { ok: false, reason: 'small', ...best };
  return { ok: true, ...best };
}

/** Patch the JFIF APP0 density so portals that read DPI see the right value. */
export function setJpegDpi(bytes, dpi) {
  const b = new Uint8Array(bytes);
  const isJfif = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff && b[3] === 0xe0 &&
    b[6] === 0x4a && b[7] === 0x46 && b[8] === 0x49 && b[9] === 0x46 && b[10] === 0x00;
  if (!isJfif) return b;
  b[13] = 1; // dots per inch
  b[14] = (dpi >> 8) & 0xff; b[15] = dpi & 0xff;
  b[16] = (dpi >> 8) & 0xff; b[17] = dpi & 0xff;
  return b;
}

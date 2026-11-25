import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coverCrop, fitQuality, setJpegDpi, mmToPx } from './lib.js';

test('coverCrop keeps target aspect and stays inside the source', () => {
  const c = coverCrop(4000, 3000, 413, 531);
  assert.ok(Math.abs(c.sw / c.sh - 413 / 531) < 0.001);
  assert.ok(c.sx >= 0 && c.sy >= 0 && c.sx + c.sw <= 4000 && c.sy + c.sh <= 3000);
});

test('coverCrop focus moves the window and zoom shrinks it', () => {
  const left = coverCrop(4000, 3000, 600, 600, 1, 0, 0.5);
  const right = coverCrop(4000, 3000, 600, 600, 1, 1, 0.5);
  assert.equal(left.sx, 0);
  assert.equal(right.sx + right.sw, 4000);
  const z = coverCrop(4000, 3000, 600, 600, 2, 0.5, 0.5);
  assert.equal(z.sw, 1500);
});

test('fitQuality finds the highest quality under the limit', async () => {
  const encode = async (q) => ({ size: Math.round(q * 100000) }); // size grows with quality
  const r = await fitQuality(encode, 50000);
  assert.ok(r.ok);
  assert.ok(r.size <= 50000);
  assert.ok(r.size > 47000, `expected near the limit, got ${r.size}`);
});

test('fitQuality reports failure when even the lowest quality is too big', async () => {
  const encode = async () => ({ size: 90000 });
  const r = await fitQuality(encode, 50000);
  assert.equal(r.ok, false);
});

test('fitQuality respects a minimum size when the maximum is easy', async () => {
  const encode = async (q) => ({ size: Math.round(q * 30000) });
  const r = await fitQuality(encode, 50000, 20000);
  assert.ok(r.ok && r.size >= 20000 && r.size <= 50000);
});

test('setJpegDpi writes density into the JFIF header', () => {
  const jfif = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00]);
  const out = setJpegDpi(jfif, 300);
  assert.equal(out[13], 1);
  assert.equal((out[14] << 8) | out[15], 300);
  assert.equal((out[16] << 8) | out[17], 300);
});

test('setJpegDpi leaves non-JFIF data untouched', () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(setJpegDpi(png, 300), png);
});

test('mmToPx converts at a given dpi', () => {
  assert.equal(mmToPx(35, 300), 413);
  assert.equal(mmToPx(45, 300), 531);
});

import { coverCrop, fitQuality, setJpegDpi } from './lib.js';
import { $, bindDropzone, download, fmtBytes } from './ui.js';

let img = null;
let result = null;
let job = 0;

const fields = ['w', 'h', 'minkb', 'maxkb', 'dpi'];
function applyPreset() {
  const v = $('#preset').value;
  if (v === 'custom') return;
  const [w, h, min, max, dpi] = v.split(',');
  Object.entries({ w, h, minkb: min, maxkb: max, dpi }).forEach(([k, val]) => { $('#' + k).value = val; });
}

const toBlob = (canvas, q) => new Promise((res) => canvas.toBlob(res, 'image/jpeg', q));

function whiten(ctx, w, h) {
  const d = ctx.getImageData(0, 0, w, h);
  const p = d.data;
  // Estimate paper brightness from the brightest tenth of pixels, then push it to white.
  const lum = new Uint8Array(w * h);
  for (let i = 0, j = 0; i < p.length; i += 4, j++) lum[j] = (p[i] * 299 + p[i + 1] * 587 + p[i + 2] * 114) / 1000;
  const sorted = Uint8Array.from(lum).sort();
  const paper = sorted[Math.floor(sorted.length * 0.9)] || 255;
  const cut = paper * 0.82;
  for (let i = 0, j = 0; i < p.length; i += 4, j++) {
    if (lum[j] >= cut) { p[i] = p[i + 1] = p[i + 2] = 255; }
    else {
      const k = Math.min(1, lum[j] / cut);
      p[i] *= k; p[i + 1] *= k; p[i + 2] *= k;
    }
  }
  ctx.putImageData(d, 0, 0);
}

async function render() {
  if (!img) return;
  const my = ++job;
  const err = $('#err');
  const w = Math.round(+$('#w').value), h = Math.round(+$('#h').value);
  const maxB = +$('#maxkb').value * 1024, minB = (+$('#minkb').value || 0) * 1024;
  const dpi = Math.round(+$('#dpi').value) || 300;
  if (!(w >= 16 && h >= 16 && w <= 6000 && h <= 6000) || !(maxB > 0) || minB > maxB) {
    err.textContent = 'Check the size: width and height between 16 and 6000 px, and the KB range the right way round.';
    return;
  }
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = 'high';
  const c = coverCrop(img.naturalWidth, img.naturalHeight, w, h, +$('#zoom').value, +$('#fx').value, +$('#fy').value);
  ctx.drawImage(img, c.sx, c.sy, c.sw, c.sh, 0, 0, w, h);
  if ($('#whiten').checked) whiten(ctx, w, h);

  const r = await fitQuality((q) => toBlob(canvas, q), maxB, minB);
  if (my !== job) return;
  $('#preview').replaceChildren(canvas);
  $('#dims').textContent = `${w} x ${h}`;
  if (!r.out) {
    result = null;
    $('#dl').disabled = true;
    $('#size').textContent = '-';
    $('#q').textContent = '-';
    err.textContent = 'Even at the lowest quality this is too big. Lower the pixel size or raise the maximum KB.';
    return;
  }
  let bytes = setJpegDpi(new Uint8Array(await r.out.arrayBuffer()), dpi);
  // Below the minimum? Pad with a JPEG comment segment so the image stays identical.
  if (bytes.length < minB) {
    const chunks = [bytes.slice(0, 2)];
    let left = minB - bytes.length + 64;
    while (left > 0) {
      const n = Math.max(4, Math.min(left, 65537));
      const s = new Uint8Array(n);
      const L = n - 2;
      s[0] = 0xff; s[1] = 0xfe; s[2] = (L >> 8) & 0xff; s[3] = L & 0xff;
      s.fill(0x20, 4);
      chunks.push(s);
      left -= n;
    }
    chunks.push(bytes.slice(2));
    bytes = new Uint8Array(await new Blob(chunks).arrayBuffer());
  }
  result = new Blob([bytes], { type: 'image/jpeg' });
  $('#size').textContent = fmtBytes(result.size);
  $('#q').textContent = Math.round(r.q * 100) + '%';
  err.textContent = '';
  $('#dl').disabled = false;
}

function load(files) {
  const f = files.find((x) => x.type.startsWith('image/'));
  if (!f) { $('#err').textContent = 'That file is not an image.'; return; }
  const url = URL.createObjectURL(f);
  const im = new Image();
  im.onload = () => { img = im; render(); };
  im.onerror = () => { $('#err').textContent = 'This image could not be opened. Try a JPG or PNG.'; };
  im.src = url;
}

bindDropzone($('#drop'), $('#file'), load);
$('#preset').addEventListener('change', () => { applyPreset(); render(); });
for (const id of fields) $('#' + id).addEventListener('input', () => { $('#preset').value = 'custom'; render(); });
for (const id of ['zoom', 'fx', 'fy', 'whiten']) $('#' + id).addEventListener('input', render);
$('#dl').onclick = () => result && download(result, `pramaan-${$('#w').value}x${$('#h').value}.jpg`);
applyPreset();

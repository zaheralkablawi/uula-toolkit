// UULA PDF — makes the PDF smaller (images) and adds picture links. Needs pdf-lib (PDFLib) and a browser canvas.
const PDFOPT = (() => {
'use strict';
const { PDFDocument, PDFName, PDFRawStream, PDFDict, PDFArray, PDFNumber, PDFString, PDFRef } = PDFLib;
const N = s => PDFName.of(s);

async function inflate(u8){
  const ds = new DecompressionStream('deflate');
  return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(ds)).arrayBuffer());
}
async function deflate(u8){
  const cs = new CompressionStream('deflate');
  return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(cs)).arrayBuffer());
}
// PNG predictors (Predictor >= 10)
function unpredict(data, colors, columns, bpc){
  const bpp = Math.max(1, Math.ceil(colors * bpc / 8)), row = Math.ceil(colors * bpc * columns / 8);
  const rows = Math.floor(data.length / (row + 1)), out = new Uint8Array(rows * row);
  for (let r = 0; r < rows; r++){
    const f = data[r * (row + 1)], src = r * (row + 1) + 1, dst = r * row;
    for (let i = 0; i < row; i++){
      const x = data[src + i], a = i >= bpp ? out[dst + i - bpp] : 0, b = r ? out[dst - row + i] : 0, c = (r && i >= bpp) ? out[dst - row + i - bpp] : 0;
      let v;
      switch (f){
        case 0: v = x; break; case 1: v = x + a; break; case 2: v = x + b; break; case 3: v = x + ((a + b) >> 1); break;
        case 4: { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); break; }
        default: v = x;
      }
      out[dst + i] = v & 255;
    }
  }
  return out;
}
function canvasOf(w, h){
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
}
async function toJpeg(canvas, q){
  if (canvas.convertToBlob) return new Uint8Array(await (await canvas.convertToBlob({ type: 'image/jpeg', quality: q })).arrayBuffer());
  return new Promise(res => canvas.toBlob(async b => res(new Uint8Array(await b.arrayBuffer())), 'image/jpeg', q));
}
const num = (d, k) => { const v = d.lookup(N(k)); return v instanceof PDFNumber ? v.asNumber() : (v && v.asNumber ? v.asNumber() : null); };
function filters(d){
  const f = d.lookup(N('Filter'));
  if (!f) return [];
  if (f instanceof PDFArray) return f.asArray().map(x => x.toString());
  return [f.toString()];
}
function components(ctx, d){
  let cs = d.lookup(N('ColorSpace'));
  if (!cs) return null;
  if (cs instanceof PDFArray){
    const a = cs.asArray(), kind = a[0] && a[0].toString();
    if (kind === '/ICCBased'){ const s = ctx.lookup(a[1]); const n = s && s.dict && num(s.dict, 'N'); return n === 1 || n === 3 ? n : null; }
    return null; // Indexed, Separation, DeviceN… left alone
  }
  const k = cs.toString();
  return k === '/DeviceRGB' ? 3 : k === '/DeviceGray' ? 1 : null;
}

// quality: 'high' | 'medium'
async function optimize(bytes, opts){
  const q = opts.quality === 'medium' ? { side: 1500, jpg: 0.8 } : { side: 2400, jpg: 0.88 };
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const ctx = doc.context;
  const objs = ctx.enumerateIndirectObjects();
  // 1) the same image stored many times -> keep one copy
  let dups = 0;
  {
    const seen = new Map(), alias = new Map();
    for (const [ref, o] of objs){
      if (!(o instanceof PDFRawStream) || o.dict.lookup(N('Subtype')) !== N('Image')) continue;
      const c = o.contents; let h = 2166136261 >>> 0;
      for (let i = 0; i < c.length; i += Math.max(1, (c.length / 4096) | 0)) h = Math.imul(h ^ c[i], 16777619) >>> 0;
      const key = c.length + ':' + h + ':' + o.dict.toString().replace(/\/SMask \d+ \d+ R/, '');
      const sm = o.dict.get(N('SMask'));
      const k2 = key + (sm ? ':' + ((ctx.lookup(sm) || {}).contents || []).length : '');
      const first = seen.get(k2);
      if (first && first.o.contents.length === c.length && first.o.contents.every((v, i) => v === c[i])) alias.set(ref.toString(), first.ref);
      else seen.set(k2, { ref, o });
    }
    if (alias.size){
      const fix = v => (v instanceof PDFRef && alias.has(v.toString())) ? alias.get(v.toString()) : v;
      const walk = v => {
        if (v instanceof PDFDict){ for (const [k, x] of v.entries()){ const y = fix(x); if (y !== x) v.set(k, y); else walk(x); } }
        else if (v instanceof PDFArray){ v.asArray().forEach((x, i) => { const y = fix(x); if (y !== x) v.set(i, y); else walk(x); }); }
        else if (v instanceof PDFRawStream) walk(v.dict);
      };
      for (const [, o] of objs) walk(o);
      for (const [r] of objs) if (alias.has(r.toString())){ ctx.delete(r); dups++; }
    }
  }
  const objs2 = ctx.enumerateIndirectObjects();
  const masks = new Set();
  for (const [, o] of objs2) if (o instanceof PDFRawStream){ const m = o.dict.get(N('SMask')); if (m instanceof PDFRef) masks.add(m.toString()); }
  let imgs = 0, saved = 0;
  for (const [ref, o] of objs2){
    if (!(o instanceof PDFRawStream)) continue;
    const d = o.dict;
    if (d.lookup(N('Subtype')) !== N('Image')) continue;
    const w = num(d, 'Width'), h = num(d, 'Height'), bpc = num(d, 'BitsPerComponent');
    if (!w || !h || bpc !== 8 || d.get(N('Decode')) || d.get(N('ImageMask'))) continue;
    const fl = filters(d), isMask = masks.has(ref.toString());
    const comps = components(ctx, d);
    if (!comps) continue;
    const scale = Math.min(1, q.side / Math.max(w, h));
    const nw = Math.max(1, Math.round(w * scale)), nh = Math.max(1, Math.round(h * scale));
    try {
      // decode to a canvas
      let src;
      if (fl.length === 1 && fl[0] === '/DCTDecode'){
        if (isMask) continue;
        src = await createImageBitmap(new Blob([o.contents], { type: 'image/jpeg' }));
      } else if (fl.length === 1 && fl[0] === '/FlateDecode'){
        let raw = await inflate(o.contents);
        const dp = d.lookup(N('DecodeParms'));
        if (dp instanceof PDFDict && (num(dp, 'Predictor') || 1) >= 10) raw = unpredict(raw, num(dp, 'Colors') || comps, num(dp, 'Columns') || w, 8);
        if (raw.length < w * h * comps) continue;
        const id = new ImageData(w, h);
        for (let i = 0, j = 0; i < w * h; i++, j += comps){
          const r = raw[j], g = comps === 3 ? raw[j + 1] : r, b = comps === 3 ? raw[j + 2] : r;
          id.data[i * 4] = r; id.data[i * 4 + 1] = g; id.data[i * 4 + 2] = b; id.data[i * 4 + 3] = 255;
        }
        const c0 = canvasOf(w, h); c0.getContext('2d').putImageData(id, 0, 0); src = c0;
      } else continue;
      const c = canvasOf(nw, nh), g = c.getContext('2d');
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.drawImage(src, 0, 0, nw, nh);
      let data, dict;
      if (isMask || (comps === 1 && fl[0] === '/FlateDecode' && scale === 1)){
        if (scale === 1) continue; // a mask is only made smaller, never turned into JPEG
        const px = g.getImageData(0, 0, nw, nh).data, gray = new Uint8Array(nw * nh);
        for (let i = 0; i < nw * nh; i++) gray[i] = px[i * 4];
        data = await deflate(gray);
        dict = ctx.obj({ Type: 'XObject', Subtype: 'Image', Width: nw, Height: nh, ColorSpace: 'DeviceGray', BitsPerComponent: 8, Filter: 'FlateDecode' });
      } else {
        data = await toJpeg(c, q.jpg);
        dict = ctx.obj({ Type: 'XObject', Subtype: 'Image', Width: nw, Height: nh, ColorSpace: 'DeviceRGB', BitsPerComponent: 8, Filter: 'DCTDecode' });
        const sm = d.get(N('SMask')); if (sm) dict.set(N('SMask'), sm);
        const it = d.get(N('Interpolate')); if (it) dict.set(N('Interpolate'), it);
      }
      if (data.length >= o.contents.length * 0.92) continue; // not worth it
      ctx.assign(ref, PDFRawStream.of(dict, data));
      imgs++; saved += o.contents.length - data.length;
    } catch (e){ /* this image stays as it is */ }
  }
  // picture links: [{ page, x0, y0, x1, y1 (0..1, from top-left), url }]
  let linksAdded = 0;
  const pages = doc.getPages();
  for (const L of opts.links || []){
    const page = pages[L.page]; if (!page) continue;
    const { width: W, height: H } = page.getSize();
    const rect = [L.x0 * W, H - L.y1 * H, L.x1 * W, H - L.y0 * H];
    let annots = page.node.lookup(N('Annots'));
    const has = annots instanceof PDFArray && annots.asArray().some(a => {
      const ad = ctx.lookup(a); if (!(ad instanceof PDFDict) || ad.lookup(N('Subtype')) !== N('Link')) return false;
      const r = ad.lookup(N('Rect')); if (!(r instanceof PDFArray)) return false;
      const [a0, b0, a1, b1] = r.asArray().map(x => x.asNumber());
      const ix = Math.max(0, Math.min(a1, rect[2]) - Math.max(a0, rect[0])), iy = Math.max(0, Math.min(b1, rect[3]) - Math.max(b0, rect[1]));
      return ix * iy > 0.5 * (rect[2] - rect[0]) * (rect[3] - rect[1]);
    });
    if (has) continue;
    const link = ctx.register(ctx.obj({ Type: 'Annot', Subtype: 'Link', Rect: rect, Border: [0, 0, 0],
      A: { Type: 'Action', S: 'URI', URI: PDFString.of(encodeURI(decodeURI(L.url))) } }));
    if (!(annots instanceof PDFArray)){ annots = ctx.obj([]); page.node.set(N('Annots'), annots); }
    annots.push(link); linksAdded++;
  }
  const out = await doc.save({ useObjectStreams: true });
  return { bytes: out, images: imgs, dups, linksAdded, before: bytes.length, after: out.length };
}
return { optimize };
})();
if (typeof module !== 'undefined') module.exports = PDFOPT;

// UULA Dark — XML engine: split a slide at red separator lines, and convert a slide to dark mode.
// Works on the XML of a single-slide package (from slide.exportAsBase64). No Office.js here.
const UD = (() => {
'use strict';
const NS = {
  p: 'http://schemas.openxmlformats.org/presentationml/2006/main',
  a: 'http://schemas.openxmlformats.org/drawingml/2006/main',
  m: 'http://schemas.openxmlformats.org/officeDocument/2006/math',
  r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  mc: 'http://schemas.openxmlformats.org/markup-compatibility/2006',
  a14: 'http://schemas.microsoft.com/office/drawing/2010/main',
  rel: 'http://schemas.openxmlformats.org/package/2006/relationships'
};
const PT = 12700;
const MARGIN = 28 * PT;
const GAP = 8 * PT;

// ---------- DOM helpers ----------
const kids = (el, ln, ns) => el ? [...el.children].filter(c => c.localName === ln && (!ns || c.namespaceURI === NS[ns])) : [];
const kid = (el, ln, ns) => kids(el, ln, ns)[0] || null;
const desc = (el, ns, ln) => el ? [...el.getElementsByTagNameNS(NS[ns], ln)] : [];
const mk = (doc, ns, ln) => doc.createElementNS(NS[ns], ns + ':' + ln);
const parseXml = s => new DOMParser().parseFromString(s, 'application/xml');
const serialize = d => new XMLSerializer().serializeToString(d);
function frag(doc, xml) {
  const w = parseXml('<w xmlns:a="' + NS.a + '" xmlns:p="' + NS.p + '" xmlns:m="' + NS.m + '">' + xml + '</w>');
  return doc.importNode(w.documentElement.firstElementChild, true);
}
function placeChild(parent, el, order) {
  const idx = order.indexOf(el.localName);
  for (const c of [...parent.children]) {
    if (c === el) continue;
    const ci = order.indexOf(c.localName);
    if (ci > idx) { parent.insertBefore(el, c); return el; }
  }
  parent.appendChild(el); return el;
}
const removeKids = (el, names) => { for (const c of [...el.children]) if (names.includes(c.localName)) el.removeChild(c); };
const hasAncestor = (el, test) => { for (let e = el.parentNode; e && e.nodeType === 1; e = e.parentNode) if (test(e)) return true; return false; };
const inMath = el => hasAncestor(el, e => e.namespaceURI === NS.m);
const inFallback = el => hasAncestor(el, e => e.localName === 'Fallback');

const FILLS = ['noFill', 'solidFill', 'gradFill', 'blipFill', 'pattFill', 'grpFill'];
const RPR_ORDER = ['ln', 'noFill', 'solidFill', 'gradFill', 'blipFill', 'pattFill', 'grpFill', 'effectLst', 'effectDag', 'highlight', 'uLnTx', 'uLn', 'uFillTx', 'uFill', 'latin', 'ea', 'cs', 'sym', 'hlinkClick', 'hlinkMouseOver', 'rtl', 'extLst'];
const PPR_ORDER = ['lnSpc', 'spcBef', 'spcAft', 'buClrTx', 'buClr', 'buSzTx', 'buSzPct', 'buSzPts', 'buFontTx', 'buFont', 'buNone', 'buAutoNum', 'buChar', 'buBlip', 'tabLst', 'defRPr', 'extLst'];
const SPPR_ORDER = ['xfrm', 'custGeom', 'prstGeom', 'noFill', 'solidFill', 'gradFill', 'blipFill', 'pattFill', 'grpFill', 'ln', 'effectLst', 'effectDag', 'scene3d', 'sp3d', 'extLst'];
const LN_ORDER = ['noFill', 'solidFill', 'gradFill', 'pattFill', 'prstDash', 'custDash', 'round', 'bevel', 'miter', 'headEnd', 'tailEnd', 'extLst'];
const TCPR_ORDER = ['lnL', 'lnR', 'lnT', 'lnB', 'lnTlToBr', 'lnBlToTr', 'cell3D', 'noFill', 'solidFill', 'gradFill', 'blipFill', 'pattFill', 'grpFill', 'headers', 'extLst'];
const BODYPR_ORDER = ['prstTxWarp', 'noAutofit', 'normAutofit', 'spAutoFit', 'scene3d', 'sp3d', 'flatTx', 'extLst'];

// ---------- colors ----------
const PRST = { black: '000000', white: 'FFFFFF', red: 'FF0000', blue: '0000FF', darkBlue: '00008B', navy: '000080', gray: '808080', grey: '808080', darkGray: 'A9A9A9', dkGray: '808080', yellow: 'FFFF00', green: '008000' };
const rgb = h => [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16));
const isRed = ([r, g, b]) => r > 170 && g < 100 && b < 100;
const isBlue = ([r, g, b]) => b > 140 && r < 110 && b - r > 60;
const isDark = ([r, g, b]) => Math.max(r, g, b) - Math.min(r, g, b) < 40 && Math.max(r, g, b) < 200;
const isLight = h => { const [r, g, b] = rgb(h); return 0.299 * r + 0.587 * g + 0.114 * b > 200; };

function readTheme(files) {
  const scheme = {};
  if (!files.theme) return scheme;
  const d = parseXml(files.theme);
  const cs = desc(d, 'a', 'clrScheme')[0];
  if (!cs) return scheme;
  for (const c of cs.children) {
    const s = kid(c, 'srgbClr'), y = kid(c, 'sysClr');
    scheme[c.localName] = s ? s.getAttribute('val').toUpperCase() : y ? (y.getAttribute('lastClr') || '000000').toUpperCase() : null;
  }
  scheme.tx1 = scheme.dk1; scheme.bg1 = scheme.lt1; scheme.tx2 = scheme.dk2; scheme.bg2 = scheme.lt2;
  return scheme;
}
// hex of a color element container (solidFill, lnRef, ...)
function colorOf(container, ctx) {
  for (const c of container.children) {
    const v = c.getAttribute('val');
    if (c.localName === 'srgbClr') return (v || '').toUpperCase();
    if (c.localName === 'schemeClr') return ctx.scheme[v] || null;
    if (c.localName === 'prstClr') return PRST[v] || null;
    if (c.localName === 'sysClr') return (c.getAttribute('lastClr') || (v === 'windowText' ? '000000' : 'FFFFFF')).toUpperCase();
    if (c.localName === 'scrgbClr' || c.localName === 'hslClr') return null;
  }
  return null;
}
function mapColor(hex, ctx) {
  if (!hex || !/^[0-9A-F]{6}$/.test(hex)) return null;
  const c = rgb(hex);
  if (isRed(c)) return ctx.text;
  if (isBlue(c)) return ctx.accent;
  if (isDark(c)) return ctx.text;
  return null;
}
function solid(doc, hex) { const f = mk(doc, 'a', 'solidFill'), s = mk(doc, 'a', 'srgbClr'); s.setAttribute('val', hex); f.appendChild(s); return f; }
function setSolid(parent, hex, order) { removeKids(parent, FILLS); return placeChild(parent, solid(parent.ownerDocument, hex), order); }
function recolorFill(parent, ctx, order, fallbackHex) {
  const sf = kid(parent, 'solidFill', 'a');
  if (sf) {
    const m = mapColor(colorOf(sf, ctx), ctx);
    if (m) setSolid(parent, m, order);
    return;
  }
  if (fallbackHex && !FILLS.some(n => kid(parent, n, 'a'))) setSolid(parent, fallbackHex, order);
}
// swap the color element inside a container (lnRef/fontRef) if it maps
function recolorRef(ref, ctx) {
  if (!ref) return;
  const m = mapColor(colorOf(ref, ctx), ctx);
  if (!m) return;
  for (const c of [...ref.children]) ref.removeChild(c);
  const s = mk(ref.ownerDocument, 'a', 'srgbClr'); s.setAttribute('val', m); ref.appendChild(s);
}

// ---------- package ----------
const readText = async f => new TextDecoder('utf-8').decode(await f.async('uint8array'));
async function openPackage(b64) {
  const zip = await JSZip.loadAsync(b64, { base64: true });
  const names = Object.keys(zip.files);
  const slidePath = names.find(n => /^ppt\/slides\/slide\d+\.xml$/.test(n));
  const files = { slide: await readText(zip.file(slidePath)) };
  const pres = zip.file('ppt/presentation.xml');
  let slideW = 12192000, slideH = 6858000;
  if (pres) {
    const sz = desc(parseXml(await readText(pres)), 'p', 'sldSz')[0];
    if (sz) { slideW = +sz.getAttribute('cx'); slideH = +sz.getAttribute('cy'); }
    var presDoc = sz && sz.ownerDocument;
  }
  const th = names.find(n => /^ppt\/theme\/theme\d+\.xml$/.test(n));
  if (th) files.theme = await readText(zip.file(th));
  // layout + master of this slide, for placeholders without their own position
  const relPath = slidePath.replace('slides/', 'slides/_rels/') + '.rels';
  const layouts = [];
  try {
    const rels = parseXml(await readText(zip.file(relPath)));
    const lr = desc(rels, 'rel', 'Relationship').find(r => /slideLayout$/.test(r.getAttribute('Type')));
    if (lr) {
      const lp = 'ppt/slideLayouts/' + lr.getAttribute('Target').split('/').pop();
      layouts.push(await readText(zip.file(lp)));
      const lrels = parseXml(await readText(zip.file(lp.replace('slideLayouts/', 'slideLayouts/_rels/') + '.rels')));
      const mr = desc(lrels, 'rel', 'Relationship').find(r => /slideMaster$/.test(r.getAttribute('Type')));
      if (mr) layouts.push(await readText(zip.file('ppt/slideMasters/' + mr.getAttribute('Target').split('/').pop())));
    }
  } catch (e) { /* no layout info */ }
  let baseSz = 1800;
  try { const d = presDoc && desc(desc(presDoc, 'p', 'defaultTextStyle')[0], 'a', 'defRPr')[0]; if (d && d.getAttribute('sz')) baseSz = +d.getAttribute('sz'); } catch (e) {}
  return { zip, slidePath, files, slideW, slideH, baseSz, layouts: layouts.map(parseXml) };
}
async function buildPackage(pkg, slideXml) {
  // write bytes, not a string: JSZip splits long strings into chunks and can cut a math letter (like 𝑖) in half
  pkg.zip.file(pkg.slidePath, new TextEncoder().encode(slideXml));
  return pkg.zip.generateAsync({ type: 'base64', compression: 'DEFLATE' });
}

// ---------- shapes ----------
const SHAPE_TAGS = ['sp', 'pic', 'cxnSp', 'graphicFrame', 'grpSp', 'AlternateContent', 'contentPart'];
const spTreeOf = doc => desc(doc, 'p', 'spTree')[0];
const topItems = doc => [...spTreeOf(doc).children].filter(c => SHAPE_TAGS.includes(c.localName));
// the real shape element of a top item (AlternateContent -> its Choice shape)
function core(el) {
  if (el.localName !== 'AlternateContent') return el;
  const ch = kid(el, 'Choice', 'mc') || kid(el, 'Fallback', 'mc');
  return ch ? ch.firstElementChild : el;
}
function xfrmOf(el) {
  el = core(el);
  if (!el) return null;
  if (el.localName === 'graphicFrame') return kid(el, 'xfrm', 'p');
  if (el.localName === 'grpSp') return kid(kid(el, 'grpSpPr', 'p'), 'xfrm', 'a');
  return kid(kid(el, 'spPr', 'p'), 'xfrm', 'a');
}
function phOf(el) {
  el = core(el);
  const nv = el && el.firstElementChild;
  return nv ? desc(nv, 'p', 'ph')[0] || null : null;
}
function geomFromXfrm(x) {
  if (!x) return null;
  const off = kid(x, 'off', 'a'), ext = kid(x, 'ext', 'a');
  if (!off || !ext) return null;
  return { x: +off.getAttribute('x'), y: +off.getAttribute('y'), w: +ext.getAttribute('cx'), h: +ext.getAttribute('cy') };
}
function geomOf(el, pkg) {
  const g = geomFromXfrm(xfrmOf(el));
  if (g) return g;
  const ph = phOf(el);
  if (ph) {
    const type = ph.getAttribute('type') || 'body', idx = ph.getAttribute('idx');
    for (const L of pkg.layouts) {
      for (const sp of desc(L, 'p', 'sp')) {
        const lph = phOf(sp); if (!lph) continue;
        const lt = lph.getAttribute('type') || 'body';
        if ((idx != null && lph.getAttribute('idx') === idx) || lt === type) {
          const lg = geomFromXfrm(xfrmOf(sp)); if (lg) return lg;
        }
      }
    }
  }
  return { x: 0, y: 0, w: 0, h: 0 };
}
function setGeom(el, g) {
  const c = core(el), doc = c.ownerDocument;
  let x = xfrmOf(el);
  if (!x) {
    if (c.localName === 'graphicFrame') { x = mk(doc, 'p', 'xfrm'); c.insertBefore(x, kid(c, 'graphic', 'a')); }
    else {
      const sp = kid(c, c.localName === 'grpSp' ? 'grpSpPr' : 'spPr', 'p'); if (!sp) return;
      x = mk(doc, 'a', 'xfrm'); sp.insertBefore(x, sp.firstChild);
    }
    x.appendChild(mk(doc, 'a', 'off')); x.appendChild(mk(doc, 'a', 'ext'));
  }
  const off = kid(x, 'off', 'a'), ext = kid(x, 'ext', 'a');
  // groups: keep children in place by moving chOff together with off (sizes unchanged)
  const n = (v, min) => { v = Math.round(+v); return isFinite(v) ? Math.max(min, v) : min; };
  off.setAttribute('x', n(g.x, -2e7)); off.setAttribute('y', n(g.y, -2e7));
  ext.setAttribute('cx', n(g.w, 0)); ext.setAttribute('cy', n(g.h, 0));
  // also move the Fallback copy of an AlternateContent so both agree
  if (el.localName === 'AlternateContent') {
    const fb = kid(el, 'Fallback', 'mc'), fs = fb && fb.firstElementChild;
    const fx = fs && kid(kid(fs, 'spPr', 'p'), 'xfrm', 'a');
    if (fx) { kid(fx, 'off', 'a').setAttribute('x', Math.round(g.x)); kid(fx, 'off', 'a').setAttribute('y', Math.round(g.y)); const fe = kid(fx, 'ext', 'a'); if (fe && g.w > 0) { fe.setAttribute('cx', Math.round(g.w)); fe.setAttribute('cy', Math.round(g.h)); } }
  }
}
const textOf = el => desc(el, 'a', 't').map(t => t.textContent).join('') + desc(el, 'm', 't').map(t => t.textContent).join('');
const hasText = el => textOf(el).trim().length > 0;
const isLineGeom = c => {
  if (c.localName === 'cxnSp') return true;
  const pg = desc(kid(c, 'spPr', 'p'), 'a', 'prstGeom')[0];
  return !!pg && /^(line|straightConnector1|bentConnector\d|curvedConnector\d)$/.test(pg.getAttribute('prst'));
};
function lineColorOf(c, ctx) {
  const ln = kid(kid(c, 'spPr', 'p'), 'ln', 'a');
  const sf = ln && kid(ln, 'solidFill', 'a');
  if (sf) return colorOf(sf, ctx);
  const ref = desc(kid(c, 'style', 'p'), 'a', 'lnRef')[0];
  return ref ? colorOf(ref, ctx) : null;
}
function fillColorOf(c, ctx) {
  const sf = kid(kid(c, 'spPr', 'p'), 'solidFill', 'a');
  if (sf) return colorOf(sf, ctx);
  if (kid(kid(c, 'spPr', 'p'), 'noFill', 'a')) return null;
  const ref = desc(kid(c, 'style', 'p'), 'a', 'fillRef')[0];
  return ref && +ref.getAttribute('idx') > 0 ? colorOf(ref, ctx) : null;
}

// classify every top-level item
function analyze(doc, pkg, ctx) {
  const W = pkg.slideW, H = pkg.slideH;
  const items = topItems(doc).map((el, i) => {
    const c = core(el), g = geomOf(el, pkg), ph = phOf(el);
    const it = { i, el, g, tag: c ? c.localName : el.localName, kind: 'other', drop: null };
    if (!c) return it;
    const phType = ph && ph.getAttribute('type');
    const text = textOf(c).trim();
    if (it.tag === 'pic') it.kind = 'pic';
    else if (it.tag === 'graphicFrame') it.kind = desc(c, 'a', 'tbl').length ? 'table' : 'other';
    else if (it.tag === 'grpSp') it.kind = 'group';
    else if ((it.tag === 'sp' || it.tag === 'cxnSp') && isLineGeom(c)) it.kind = 'line';
    else if (it.tag === 'sp' && text) it.kind = 'text';
    const nv = c.firstElementChild, cnv = nv && kid(nv, 'cNvPr', 'p');
    it.name = cnv ? cnv.getAttribute('name') || '' : '';
    it.hidden = !!cnv && /^(1|true)$/.test(cnv.getAttribute('hidden') || '');
    const pm = /^UULA جزء (\d+)/.exec(it.name); it.part = pm ? +pm[1] : 0;
    it.text = text;
    // separator added by the add-in's button
    if (/^UULA فاصل/.test(it.name)) { it.kind = 'sep'; it.drop = 'sep'; return it; }
    if (['sldNum', 'ftr', 'dt'].includes(phType)) { it.drop = 'pagenum'; return it; }
    // page number: small box with digits only, low on the slide
    if (it.kind === 'text' && /^[0-9٠-٩]{1,4}$/.test(text) && g.w < W * 0.2 && g.y > H * 0.75) { it.drop = 'pagenum'; return it; }
    // QR code: small picture, linked or near the top or square
    if (it.kind === 'pic' && Math.max(g.w, g.h) < 80 * PT) {
      const linked = !!desc(c, 'a', 'hlinkClick').length;
      const square = g.h > 0 && Math.abs(g.w / g.h - 1) < 0.15;
      if (linked || square || g.y < H * 0.25) { it.drop = 'qr'; return it; }
    }
    // light decorative card behind the text (a filled shape without text)
    if (it.tag === 'sp' && !text && it.kind !== 'line') {
      const f = fillColorOf(c, ctx);
      if (f && isLight(f) && g.w > 80 * PT && g.h > 40 * PT) { it.drop = 'card'; return it; }
    }
    return it;
  });
  // only separators added with the add-in's button count; other lines stay as they are
  return items;
}

// ---------- split ----------
// returns [{ids:[item index...]}] in top-to-bottom order; one entry = no separators
function sections(items) {
  const keep = items.filter(t => !t.drop);
  // parts chosen by selection ("جزء مستقل") come first; anything not in a part goes on one more slide at the end
  if (keep.some(t => t.part)) {
    const nums = [...new Set(keep.filter(t => t.part).map(t => t.part))].sort((a, b) => a - b);
    const parts = nums.map(n => keep.filter(t => t.part === n).map(t => t.i));
    const rest = keep.filter(t => !t.part);
    if (rest.some(t => !t.hidden)) parts.push(rest.map(t => t.i));
    else if (rest.length) parts[parts.length - 1].push(...rest.map(t => t.i));
    return { count: parts.length > 1 ? parts.length - 1 : 0, parts, byPart: true };
  }
  const seps = items.filter(t => t.kind === 'sep').map(t => t.g.y + t.g.h / 2).sort((a, b) => a - b);
  const out = Array.from({ length: seps.length + 1 }, () => []);
  for (const t of keep) {
    const cy = t.g.y + t.g.h / 2;
    let k = 0; while (k < seps.length && cy > seps[k]) k++;
    out[k].push(t.i);
  }
  return { count: seps.length, parts: out.filter(p => p.length) };
}
// suggested separators: horizontal gaps between the questions of a worksheet (EMU)
const QMARK = /^(Q\b|Q(?=[\u0600-\u06FF])|[ⓐ-ⓩ]|[①-⑳]|\(?[0-9٠-٩]{1,2}\s*[\)\.\-]|مثال|تحقق|سؤال|تمرين|التمرين|أوجد|اكتب|ارسم|حل )/;
function suggestCuts(items, pkg) {
  const vis = items.filter(t => !t.drop && !t.hidden && t.kind !== 'sep' && t.g.h > 0 && t.g.w > 0);
  if (vis.length < 2) return [];
  const marked = t => /^ZAHER_QUESTION/i.test(t.name || '') || QMARK.test((t.text || '').trim());
  const top = Math.min(...vis.map(t => t.g.y)), bottom = Math.max(...vis.map(t => t.g.y + t.g.h));
  // a part is worth its own slide when it holds a picture/table/drawing or a real block of text
  const worth = (y0, y1) => {
    const inside = vis.filter(t => t.g.y + t.g.h / 2 > y0 && t.g.y + t.g.h / 2 < y1);
    return y1 - y0 >= 60 * PT && inside.some(t => t.kind !== 'text' || t.g.h >= 40 * PT);
  };
  let cand;
  const marks = vis.filter(marked).sort((a, b) => a.g.y - b.g.y);
  if (marks.length >= 1) {
    // cut just above every question start (only when what is above it is worth a slide)
    cand = marks.map(m => {
      const above = vis.filter(t => t !== m && t.g.y < m.g.y && t.g.y + t.g.h <= m.g.y + 4 * PT);
      const end = above.length ? Math.max(...above.map(t => t.g.y + t.g.h)) : m.g.y;
      return Math.max(Math.min(end, m.g.y) + (m.g.y - Math.min(end, m.g.y)) / 2, m.g.y - 6 * PT);
    });
  } else {
    // no question marks: use the big empty bands between groups of content
    const sorted = [...vis].sort((a, b) => a.g.y - b.g.y), bands = [];
    for (const t of sorted) {
      const b = bands[bands.length - 1];
      if (b && t.g.y <= b.end + PT) b.end = Math.max(b.end, t.g.y + t.g.h); else bands.push({ y: t.g.y, end: t.g.y + t.g.h });
    }
    const gaps = []; for (let i = 0; i + 1 < bands.length; i++) gaps.push({ size: bands[i + 1].y - bands[i].end, mid: (bands[i].end + bands[i + 1].y) / 2 });
    if (!gaps.length) return [];
    const sizes = gaps.map(g => g.size).sort((a, b) => a - b), median = sizes[Math.floor(sizes.length / 2)];
    cand = gaps.filter(g => g.size >= Math.max(14 * PT, 2.2 * median)).map(g => g.mid);
  }
  const out = []; let last = top;
  for (const y of [...new Set(cand)].sort((a, b) => a - b)) if (worth(last, y) && worth(y, bottom + 1)) { out.push(y); last = y; }
  const x0 = Math.min(...vis.map(t => t.g.x)), x1 = Math.max(...vis.map(t => t.g.x + t.g.w));
  return out.map(y => ({ y, x: x0 - 6 * PT, w: x1 - x0 + 12 * PT }));
}
// a copy of the slide holding only the given items, moved up to the top margin
function sectionXml(slideXml, pkg, ctx, ids) {
  const doc = parseXml(slideXml);
  const items = analyze(doc, pkg, ctx);
  const set = new Set(ids);
  let top = Infinity;
  for (const t of items) if (set.has(t.i)) top = Math.min(top, t.g.y);
  for (const tm of kids(doc.documentElement, 'timing', 'p')) doc.documentElement.removeChild(tm);
  for (const t of items) {
    if (!set.has(t.i)) { t.el.parentNode.removeChild(t.el); continue; }
    if (isFinite(top) && top > MARGIN) setGeom(t.el, { ...t.g, y: t.g.y - top + MARGIN });
  }
  return serialize(doc);
}

// ---------- dark ----------
function styleRPr(rPr, ctx, opt) {
  const math = inMath(rPr);
  recolorFill(rPr, ctx, RPR_ORDER, ctx.text);
  if (opt.size) {
    const s = rPr.getAttribute('sz');
    rPr.setAttribute('sz', s && +s > 1500 ? ctx.title : ctx.body);
  }
  if (!math && opt.font) {
    for (const ln of ['latin', 'cs']) {
      let f = kid(rPr, ln, 'a');
      if (!f) { f = placeChild(rPr, mk(rPr.ownerDocument, 'a', ln), RPR_ORDER); f.setAttribute('typeface', ctx.font); continue; }
      const tf = f.getAttribute('typeface') || '';
      if (tf === 'UULA Sans' || tf === '' || /^\+(mn|mj)-/.test(tf)) f.setAttribute('typeface', ctx.font);
    }
  }
}
function ensure(parent, ns, ln, order, first) {
  let e = kid(parent, ln, ns);
  if (!e) { e = mk(parent.ownerDocument, ns, ln); if (order) placeChild(parent, e, order); else if (first) parent.insertBefore(e, parent.firstChild); else parent.appendChild(e); }
  return e;
}
// mode: false (normal box), 'table' (table cell), 'group' (part of a drawing: colors only, sizes and layout kept)
function styleTxBody(tx, ctx, mode) {
  const doc = tx.ownerDocument;
  const inTable = mode === 'table', grp = mode === 'group', sz = !grp;
  const arabic = /[؀-ۿ]/.test(textOf(tx));
  const bp = kid(tx, 'bodyPr', 'a');
  if (bp && !inTable && !grp) {
    bp.setAttribute('anchor', 't'); bp.setAttribute('wrap', 'square');
    removeKids(bp, ['noAutofit', 'normAutofit', 'spAutoFit']);
    placeChild(bp, mk(doc, 'a', 'spAutoFit'), BODYPR_ORDER);
  }
  const lst = kid(tx, 'lstStyle', 'a');
  if (lst) for (const d of desc(lst, 'a', 'defRPr')) styleRPr(d, ctx, { size: sz, font: true });
  for (const p of kids(tx, 'p', 'a')) {
    let pPr = kid(p, 'pPr', 'a');
    if (!pPr) { pPr = mk(doc, 'a', 'pPr'); p.insertBefore(pPr, p.firstChild); }
    // Arabic box: right aligned; an English-only line inside it stays LTR so its punctuation is right
    const arP = /[؀-ۿ]/.test(textOf(p));
    if (!grp) {
      pPr.setAttribute('algn', arabic ? 'r' : 'l'); pPr.setAttribute('rtl', arabic && (arP || !textOf(p).trim()) ? '1' : '0');
      removeKids(pPr, ['lnSpc', 'spcAft']);
      placeChild(pPr, frag(doc, '<a:lnSpc><a:spcPct val="150000"/></a:lnSpc>'), PPR_ORDER);
      placeChild(pPr, frag(doc, '<a:spcAft><a:spcPts val="0"/></a:spcAft>'), PPR_ORDER);
    }
    const d = kid(pPr, 'defRPr', 'a'); if (d) styleRPr(d, ctx, { size: sz, font: true });
    // runs, fields, line breaks
    for (const r of [...kids(p, 'r', 'a'), ...kids(p, 'fld', 'a'), ...kids(p, 'br', 'a')]) {
      let rPr = kid(r, 'rPr', 'a');
      if (!rPr) { rPr = mk(doc, 'a', 'rPr'); r.insertBefore(rPr, r.firstChild); }
      styleRPr(rPr, ctx, { size: sz, font: true });
    }
    let e = kid(p, 'endParaRPr', 'a');
    if (!e) { e = mk(doc, 'a', 'endParaRPr'); p.appendChild(e); }
    styleRPr(e, ctx, { size: sz, font: true });
    // math inside the paragraph (a14:m): colors + sizes, keep the math font
    for (const mr of desc(p, 'm', 'r')) {
      let rPr = kid(mr, 'rPr', 'a');
      if (!rPr) { rPr = mk(doc, 'a', 'rPr'); const mp = kid(mr, 'rPr', 'm'); mr.insertBefore(rPr, mp ? mp.nextSibling : mr.firstChild); }
      styleRPr(rPr, ctx, { size: sz, font: false });
    }
    for (const cp of desc(p, 'm', 'ctrlPr')) for (const rPr of kids(cp, 'rPr', 'a')) styleRPr(rPr, ctx, { size: sz, font: false });
    if (arabic && !grp) for (const op of desc(p, 'm', 'oMathPara')) {
      let pp = kid(op, 'oMathParaPr', 'm');
      if (!pp) { pp = mk(doc, 'm', 'oMathParaPr'); op.insertBefore(pp, op.firstChild); }
      let jc = kid(pp, 'jc', 'm');
      if (!jc) { jc = mk(doc, 'm', 'jc'); pp.appendChild(jc); }
      jc.setAttributeNS(NS.m, 'm:val', 'right');
    }
  }
  return arabic;
}
function styleShapeProps(c, ctx) {
  const spPr = kid(c, 'spPr', 'p'); if (!spPr) return;
  const doc = c.ownerDocument;
  // drawings (shapes inside a group, or text-less shapes when zooming): light fills vanish, dark ones turn light
  const grp = hasAncestor(c, e => e.localName === 'grpSp') || (ctx.layoutMode !== 'stack' && !hasText(c));
  if (!isLineGeom(c) && c.localName === 'sp') {
    const sf = kid(spPr, 'solidFill', 'a'), hex = sf && colorOf(sf, ctx);
    if (grp && hex && !isLight(hex)) recolorFill(spPr, ctx, SPPR_ORDER);
    else if (!grp || hex) { removeKids(spPr, FILLS); placeChild(spPr, mk(doc, 'a', 'noFill'), SPPR_ORDER); }
  }
  const ln = kid(spPr, 'ln', 'a'); if (ln) recolorFill(ln, ctx, LN_ORDER);
  const st = kid(c, 'style', 'p');
  if (st) { recolorRef(kid(st, 'lnRef', 'a'), ctx); recolorRef(kid(st, 'fontRef', 'a'), ctx); if (c.localName === 'sp' && !isLineGeom(c)) { const fr = kid(st, 'fillRef', 'a'); if (fr) fr.setAttribute('idx', '0'); } }
}
function styleTable(tbl, ctx, txMode) {
  const doc = tbl.ownerDocument;
  for (const tc of desc(tbl, 'a', 'tc')) {
    const tx = kid(tc, 'txBody', 'a'); if (tx) styleTxBody(tx, ctx, txMode || 'table');
    let tcPr = kid(tc, 'tcPr', 'a');
    if (!tcPr) { tcPr = mk(doc, 'a', 'tcPr'); const ext = kid(tc, 'extLst', 'a'); tc.insertBefore(tcPr, ext); }
    removeKids(tcPr, ['lnL', 'lnR', 'lnT', 'lnB', ...FILLS]);
    for (const s of ['lnL', 'lnR', 'lnT', 'lnB'])
      placeChild(tcPr, frag(doc, '<a:' + s + ' w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:srgbClr val="' + ctx.text + '"/></a:solidFill><a:prstDash val="solid"/><a:round/><a:headEnd type="none" w="med" len="med"/><a:tailEnd type="none" w="med" len="med"/></a:' + s + '>'), TCPR_ORDER);
    placeChild(tcPr, solid(doc, ctx.bg), TCPR_ORDER);
  }
}
function duotone(pic, ctx) {
  const blip = desc(pic, 'a', 'blip')[0]; if (!blip) return false;
  if (kid(blip, 'duotone', 'a')) return false;
  const d = frag(blip.ownerDocument, '<a:duotone><a:srgbClr val="' + ctx.text + '"/><a:srgbClr val="' + ctx.bg + '"/></a:duotone>');
  blip.insertBefore(d, kid(blip, 'extLst', 'a'));
  return true;
}

// estimated height (EMU) of a text body at a given width
function estimateText(tx, widthEmu, ctx) {
  let h = 7.2 * PT;
  for (const p of kids(tx, 'p', 'a')) {
    let sz = 0;
    for (const r of desc(p, 'a', 'rPr')) sz = Math.max(sz, +(r.getAttribute('sz') || 0));
    const e = kid(p, 'endParaRPr', 'a'); if (!sz && e) sz = +(e.getAttribute('sz') || 0);
    sz = (sz || +ctx.body) / 100; // pt
    const len = textOf(p).length;
    const cpl = Math.max(1, Math.floor((widthEmu / PT - 14.4) / (sz * 0.5)));
    const lines = Math.max(1, Math.ceil(len / cpl)) + Math.max(0, desc(p, 'm', 'f').length ? 1 : 0);
    h += lines * sz * 1.2 * 1.5 * PT;
  }
  return h;
}
function estimateTable(tbl, widthEmu, ctx) {
  const cols = desc(tbl, 'a', 'gridCol').map(c => +c.getAttribute('w'));
  const total = cols.reduce((a, b) => a + b, 0) || 1;
  let h = 0;
  for (const tr of desc(tbl, 'a', 'tr')) {
    let rh = +(tr.getAttribute('h') || 0), ci = 0;
    for (const tc of kids(tr, 'tc', 'a')) {
      const span = +(tc.getAttribute('gridSpan') || 1);
      let w = 0; for (let k = 0; k < span; k++) w += cols[ci + k] || 0; ci += span;
      const tx = kid(tc, 'txBody', 'a');
      if (tx) rh = Math.max(rh, estimateText(tx, w / total * widthEmu, ctx) + 1.6 * 2 * PT);
    }
    h += rh;
  }
  return h;
}
function scaleGroup(el, k) {
  if (!(k > 0) || Math.abs(k - 1) < 0.01) return;
  const c = core(el);
  for (const r of [...desc(c, 'a', 'rPr'), ...desc(c, 'a', 'endParaRPr'), ...desc(c, 'a', 'defRPr')]) {
    const v = +r.getAttribute('sz'); if (v) r.setAttribute('sz', Math.max(100, Math.min(400000, Math.round(v * k))));
  }
  for (const ln of desc(c, 'a', 'ln')) { const w = +ln.getAttribute('w'); if (w) ln.setAttribute('w', Math.round(w * k)); }
}
function resizeTable(el, newW) {
  const c = core(el), tbl = desc(c, 'a', 'tbl')[0];
  const cols = desc(tbl, 'a', 'gridCol');
  const total = cols.reduce((a, g) => a + +g.getAttribute('w'), 0) || 1;
  for (const g of cols) g.setAttribute('w', Math.round(+g.getAttribute('w') / total * newW));
}

// the whole dark conversion of one slide XML; returns {xml, plan, report}
// ctx: {bg, text, accent, body:'3600', title:'4800', font, images:true}
function darkXml(slideXml, pkg, ctxIn) {
  const doc = parseXml(slideXml);
  const ctx = { ...ctxIn, scheme: readTheme(pkg.files) };
  const items = analyze(doc, pkg, ctx);
  const report = { removed: 0, duotone: 0 };
  // remove separators, page numbers, QR codes, decorative cards
  const skip = new Set(ctx.skip || []);
  for (const t of items) if (t.drop) { t.el.parentNode.removeChild(t.el); report.removed++; }
  const keep = items.filter(t => !t.drop);
  for (const tm of kids(doc.documentElement, 'timing', 'p')) doc.documentElement.removeChild(tm);
  for (const cn of desc(doc, 'p', 'cNvPr')) { const n = cn.getAttribute('name') || ''; if (/^UULA جزء \d+/.test(n)) cn.setAttribute('name', n.replace(/^UULA جزء \d+\s*·?\s*/, '') || 'Shape'); }
  // background
  const cSld = kid(doc.documentElement, 'cSld', 'p');
  const oldBg = kid(cSld, 'bg', 'p'); if (oldBg) cSld.removeChild(oldBg);
  cSld.insertBefore(frag(doc, '<p:bg><p:bgPr><a:solidFill><a:srgbClr val="' + ctx.bg + '"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>'), kid(cSld, 'spTree', 'p'));
  // shapes, text, tables (skip the Fallback copies of equations)
  const tree = spTreeOf(doc);
  if (!skip.has('shapes')) for (const c of [...desc(tree, 'p', 'sp'), ...desc(tree, 'p', 'cxnSp')]) if (!inFallback(c)) styleShapeProps(c, ctx);
  // zoom (default): the part keeps its own arrangement and is enlarged as one piece; text keeps its layout
  const zoom = ctx.layoutMode !== 'stack';
  if (!skip.has('text')) for (const tx of desc(tree, 'p', 'txBody')) if (!inFallback(tx)) styleTxBody(tx, ctx, zoom || hasAncestor(tx, e => e.localName === 'grpSp') ? 'group' : false);
  if (!skip.has('tables')) for (const tbl of desc(tree, 'a', 'tbl')) styleTable(tbl, ctx, zoom ? 'group' : 'table');
  // big pictures: white lines on the dark background
  const W = pkg.slideW, H = pkg.slideH;
  if (ctx.images !== false && !skip.has('images')) for (const t of keep) if (t.kind === 'pic' && Math.max(t.g.w, t.g.h) >= 80 * PT) { if (duotone(core(t.el), ctx)) report.duotone++; }
  if (zoom) {
    const plan = skip.has('layout') ? { mode: 'zoom', items: [], bottom: 0 } : zoomPart(keep, pkg, ctx, report);
    return { xml: serialize(doc), plan, report };
  }
  // first layout guess in the XML (the add-in refines it with real heights)
  const plan = layout(keep.filter(t => !t.hidden), pkg, ctx);
  if (!skip.has('layout')) for (const s of plan.items) {
    const t = keep.find(k => k.i === s.i);
    if (t.kind === 'table') resizeTable(t.el, s.w);
    if (t.kind === 'group' && t.g.w) scaleGroup(t.el, s.w / t.g.w);
    setGeom(t.el, { x: s.x, y: s.y, w: s.w, h: s.h });
  }
  // plan indexes refer to the order of the remaining top items
  const order = topItems(doc);
  for (const s of plan.items) s.idx = order.indexOf(keep.find(k => k.i === s.i).el);
  return { xml: serialize(doc), plan, report };
}

// enlarge the whole part as one piece so it fills the slide; every position, size, text size and line keeps its proportion
function zoomPart(keep, pkg, ctx, report) {
  const W = pkg.slideW, H = pkg.slideH;
  const vis = keep.filter(t => !t.hidden && t.g.w > 0);
  if (!vis.length) return { mode: 'zoom', items: [], bottom: MARGIN };
  const x0 = Math.min(...vis.map(t => t.g.x)), y0 = Math.min(...vis.map(t => t.g.y));
  const bw = Math.max(...vis.map(t => t.g.x + t.g.w)) - x0, bh = Math.max(...vis.map(t => t.g.y + t.g.h)) - y0;
  let maxSz = 0;
  for (const t of vis) for (const r of desc(core(t.el), 'a', 'rPr')) maxSz = Math.max(maxSz, +(r.getAttribute('sz') || 0));
  let k = Math.min((W - 2 * MARGIN) / (bw || 1), (H - 2 * MARGIN) / (bh || 1), 4);
  if (maxSz) k = Math.min(k, 6000 / maxSz); // the biggest text never goes past 60 pt
  k = Math.max(k, 0.2);
  const ox = MARGIN + ((W - 2 * MARGIN) - bw * k) / 2, oy = MARGIN;
  for (const t of keep) {
    setGeom(t.el, { x: ox + (t.g.x - x0) * k, y: oy + (t.g.y - y0) * k, w: t.g.w * k, h: t.g.h * k });
    scaleContent(t.el, k, pkg, !!phOf(t.el));
  }
  // smallest body text after zooming (pt)
  let minSz = Infinity;
  for (const t of vis) for (const r of [...desc(core(t.el), 'a', 'rPr'), ...desc(core(t.el), 'a', 'defRPr')]) { const v = +(r.getAttribute('sz') || 0); if (v) minSz = Math.min(minSz, v); }
  report.minPt = isFinite(minSz) ? Math.round(minSz / 100) : 0;
  report.zoom = k;
  return { mode: 'zoom', items: [], bottom: oy + bh * k };
}
function scaleContent(el, k, pkg, isPh) {
  const c = core(el); if (!c) return;
  const mul = (e, at, def) => { const v = e.getAttribute(at); const n = v == null ? def : +v; if (n != null && isFinite(n)) e.setAttribute(at, Math.round(n * k)); };
  // text sizes (missing sizes: the presentation's default size, except in placeholders which follow their layout)
  for (const r of [...desc(c, 'a', 'rPr'), ...desc(c, 'a', 'endParaRPr'), ...desc(c, 'a', 'defRPr')]) {
    if (r.getAttribute('sz')) { r.setAttribute('sz', Math.max(100, Math.min(400000, Math.round(+r.getAttribute('sz') * k)))); continue; }
    if (isPh || r.localName === 'defRPr') continue;
    let tx = null; for (let e = r.parentNode; e && e.nodeType === 1; e = e.parentNode) if (e.localName === 'txBody') { tx = e; break; }
    const lst = tx && desc(kid(tx, 'lstStyle', 'a'), 'a', 'defRPr').find(d => d.getAttribute('sz'));
    if (!lst) r.setAttribute('sz', Math.round(pkg.baseSz * k));
  }
  // inner margins, indents, fixed spacing, line widths
  for (const b of desc(c, 'a', 'bodyPr')) { mul(b, 'lIns', 91440); mul(b, 'rIns', 91440); mul(b, 'tIns', 45720); mul(b, 'bIns', 45720); }
  for (const p of [...desc(c, 'a', 'pPr'), ...['lvl1pPr', 'lvl2pPr', 'lvl3pPr'].flatMap(n => desc(c, 'a', n))]) for (const at of ['marL', 'marR', 'indent']) if (p.getAttribute(at)) mul(p, at);
  for (const sp of desc(c, 'a', 'spcPts')) mul(sp, 'val');
  for (const ln of desc(c, 'a', 'ln')) if (ln.getAttribute('w')) mul(ln, 'w');
  for (const s of ['lnL', 'lnR', 'lnT', 'lnB']) for (const ln of desc(c, 'a', s)) if (ln.getAttribute('w')) mul(ln, 'w');
  // tables: columns, rows and cell margins
  for (const g of desc(c, 'a', 'gridCol')) mul(g, 'w');
  for (const tr of desc(c, 'a', 'tr')) if (tr.getAttribute('h')) mul(tr, 'h');
  for (const tc of desc(c, 'a', 'tcPr')) { mul(tc, 'marL', 91440); mul(tc, 'marR', 91440); mul(tc, 'marT', 45720); mul(tc, 'marB', 45720); }
}
// layout: full-width stack, or title + picture (left) + texts/tables (right)
function layout(keep, pkg, ctx) {
  const W = pkg.slideW - 2 * MARGIN, H = pkg.slideH;
  const sorted = [...keep].sort((a, b) => a.g.y - b.g.y || b.g.x - a.g.x);
  const pics = sorted.filter(t => (t.kind === 'pic' || t.kind === 'group') && Math.max(t.g.w, t.g.h) >= 80 * PT);
  const rest = sorted.filter(t => !pics.includes(t));
  const items = [];
  const est = (t, w) => {
    const c = core(t.el);
    if (t.kind === 'text') return estimateText(kid(c, 'txBody', 'p'), w, ctx);
    if (t.kind === 'table') return estimateTable(desc(c, 'a', 'tbl')[0], w, ctx);
    return t.g.h;
  };
  const twoCol = pics.length > 0 && rest.some(t => t.kind === 'text' || t.kind === 'table');
  if (!twoCol) {
    let y = MARGIN;
    for (const t of sorted) {
      let w, x, h;
      if (t.kind === 'text' || t.kind === 'table') { w = W; x = MARGIN; h = est(t, w); }
      else {
        // pictures and drawings grow up to 45% of the slide height (never wider than the slide)
        const big = (t.kind === 'pic' || t.kind === 'group') && Math.max(t.g.w, t.g.h) >= 80 * PT;
        const k = big ? Math.max(0.05, Math.min(W / (t.g.w || 1), H * 0.45 / (t.g.h || 1))) : Math.min(1, W / (t.g.w || 1), (H - 2 * MARGIN) / (t.g.h || 1));
        w = t.g.w * k; h = t.g.h * k; x = MARGIN + (W - w) / 2;
      }
      items.push({ i: t.i, kind: t.kind, col: 'full', x, y, w, h });
      y += h + GAP;
    }
    return { mode: 'stack', items, bottom: y - GAP };
  }
  const half = (W - 12 * PT) / 2;
  let y0 = MARGIN;
  const first = rest[0];
  let title = null;
  if (first && first.kind === 'text' && first.g.y <= pics[0].g.y && rest.some(t => t !== first && (t.kind === 'text' || t.kind === 'table'))) {
    title = first;
    const h = est(first, W);
    items.push({ i: first.i, kind: 'text', col: 'title', x: MARGIN, y: MARGIN, w: W, h });
    y0 = MARGIN + h + GAP;
  }
  // left column: pictures (Office x grows to the right, so "left" is x = MARGIN)
  let yl = y0;
  for (const t of pics) {
    const k = Math.max(0.05, Math.min(half / (t.g.w || 1), Math.max(H * 0.25, H - MARGIN - yl) / (t.g.h || 1)));
    const w = t.g.w * k, h = t.g.h * k;
    items.push({ i: t.i, kind: t.kind, col: 'left', x: MARGIN, y: yl, w, h });
    yl += h + GAP;
  }
  let yr = y0;
  for (const t of rest) {
    if (t === title) continue;
    const big = t.kind === 'text' || t.kind === 'table';
    const w = big ? half : Math.min(half, t.g.w), h = big ? est(t, w) : t.g.h * (w / (t.g.w || 1));
    items.push({ i: t.i, kind: t.kind, col: 'right', x: MARGIN + half + 12 * PT, y: yr, w, h });
    yr += h + GAP;
  }
  return { mode: 'two', items, bottom: Math.max(yl, yr) - GAP };
}

return { NS, PT, MARGIN, GAP, openPackage, buildPackage, parseXml, serialize, analyze, sections, suggestCuts, sectionXml, darkXml, readTheme, mapColor, rgb };
})();
if (typeof module !== 'undefined') module.exports = UD;

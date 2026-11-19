// UULA Restyle — XML engine: turns one slide (a single-slide package from slide.exportAsBase64)
// into the UULA study-guide style, and builds the ready templates. No Office.js here.
const UR = (() => {
'use strict';
const NS = {
  p: 'http://schemas.openxmlformats.org/presentationml/2006/main',
  a: 'http://schemas.openxmlformats.org/drawingml/2006/main',
  m: 'http://schemas.openxmlformats.org/officeDocument/2006/math',
  r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  mc: 'http://schemas.openxmlformats.org/markup-compatibility/2006',
  a14: 'http://schemas.microsoft.com/office/drawing/2010/main',
  rel: 'http://schemas.openxmlformats.org/package/2006/relationships',
  ct: 'http://schemas.openxmlformats.org/package/2006/content-types'
};
const PT = 12700;
// the page grid of the UULA layout ("Math Grid"): horizontal lines every 6.695pt from y=22.58 to 725.66,
// and the vertical guides below. Two grid steps = one line of 11pt text.
const G = Math.round(6.695 * PT);
const Y0 = Math.round(22.58 * PT);
const ROW = 2 * G;
const XGUIDES = [36, 51.2, 76.24, 85.98, 258.4, 270, 280.4, 397.92, 454.16, 463.79, 488.8, 504].map(v => Math.round(v * PT));
const snapUp = y => Y0 + Math.max(0, Math.ceil((y - Y0 - 0.3 * PT) / G)) * G;
const snapNear = y => Y0 + Math.max(0, Math.round((y - Y0) / G)) * G;
const snapX = (x, tol) => { let best = x, d = (tol == null ? 12 : tol) * PT; for (const g of XGUIDES) if (Math.abs(g - x) < d) { d = Math.abs(g - x); best = g; } return best; };
const M = 36 * PT;                          // side margins
const FOOT = 54 * PT;                       // space kept for the footer
const REL_IMG = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image';
const REL_LINK = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink';

// ---------- the UULA design system ----------
const C = {
  chapter: 'A6A6A6', lesson: '1F71DD', topic: '000000', body: '000000', qhead: 'FF0000', q: 'FF0000',
  answer: '1F71DE', answerOk: '2070DF', givens: '00B050', formula: 'FE00FE', otherform: 'C45A11',
  pill: '1F71DC', grid: 'D9D9D9', head: 'CAD0D8', mainCol: 'DAE0E9', alt: 'F1F1F1'
};
const STY = {
  chapter: { sz: 1100, b: 1, c: C.chapter },
  lesson: { sz: 2200, b: 1, c: C.lesson },
  topic: { sz: 1650, b: 1, c: C.topic },
  body: { sz: 1100, c: C.body, keepB: 1 },
  choice: { sz: 1100, c: '000000', keepB: 1, ind: 1 },
  boxtitle: { sz: 1100, b: 1, c: '000000' },
  qhead: { sz: 1100, b: 1, c: C.qhead },
  question: { sz: 1100, c: '000000', q: 1 },                 // the skill: question text is not bold
  answer: { sz: 1100, c: C.answer, ind: 1 },                 // the skill: answers are not bold
  source: { sz: 1100, b: 1, c: '000000' },
  label: { sz: 1100, c: '000000', keepB: 1 },         // small labels beside pictures / inside groups
  qcont: { sz: 1100, c: '000000' }                    // the lines that continue a question (not bold, like the question)
};
// containers: fill, icon, icon tint (for the vertical line)
const BOX = {
  note: { fill: 'FBEBD3', icon: 'bulb', name: 'Note' },
  quote: { fill: 'E2F0D9', icon: 'book', line: '2AB672', name: 'Quote' },
  def: { fill: 'E2F0D9', icon: 'book', line: '2AB672', name: 'Definition' },
  formula: { fill: 'D3E4F5', icon: null, name: 'Formula' },
  other: { fill: 'FBEBD3', icon: 'star', name: 'Other Form' },
  activity: { fill: 'F1F1F1', icon: 'palette', name: 'Activity' },
  mars: { fill: 'F1F1F1', icon: 'target', name: 'Challenge' },
  practice: { fill: 'F1F1F1', icon: null, name: 'Practice' }
};
const TEXT_ROLES = ['chapter', 'lesson', 'topic', 'body', 'bullets', 'qhead', 'question', 'answer', 'choice'];
const BOX_ROLES = ['note', 'quote', 'def', 'formula', 'other', 'activity', 'mars'];
const PIN = /^UULA:([a-z]+)\s*/;
const PALETTE = ['000000', 'FFFFFF', 'A6A6A6', '1F71DD', '1F71DE', '1F71DC', '2070DF', 'FF0000', '00B050', 'FE00FE', 'C45A11', 'FFC000'];
const CIRC = /[①-⓿❶-➓㉑-㉟㊱-㊿]/;
const CIRC_SPLIT = /([①-⓿❶-➓㉑-㉟㊱-㊿]+)/;
const AR = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

// ---------- DOM helpers ----------
const kids = (el, ln, ns) => el ? [...el.children].filter(c => c.localName === ln && (!ns || c.namespaceURI === NS[ns])) : [];
const kid = (el, ln, ns) => kids(el, ln, ns)[0] || null;
const desc = (el, ns, ln) => el ? [...el.getElementsByTagNameNS(NS[ns], ln)] : [];
const mk = (doc, ns, ln) => doc.createElementNS(NS[ns], ns + ':' + ln);
const parseXml = s => new DOMParser().parseFromString(s, 'application/xml');
const serialize = d => new XMLSerializer().serializeToString(d);
const XMLNS = 'xmlns:a="' + NS.a + '" xmlns:p="' + NS.p + '" xmlns:r="' + NS.r + '" xmlns:m="' + NS.m + '"';
function frag(doc, xml) {
  const w = parseXml('<w ' + XMLNS + '>' + xml + '</w>');
  return doc.importNode(w.documentElement.firstElementChild, true);
}
function placeChild(parent, el, order) {
  const idx = order.indexOf(el.localName);
  for (const c of [...parent.children]) {
    if (c === el) continue;
    if (order.indexOf(c.localName) > idx) { parent.insertBefore(el, c); return el; }
  }
  parent.appendChild(el); return el;
}
const removeKids = (el, names) => { if (el) for (const c of [...el.children]) if (names.includes(c.localName)) el.removeChild(c); };
const hasAncestor = (el, test) => { for (let e = el.parentNode; e && e.nodeType === 1; e = e.parentNode) if (test(e)) return true; return false; };
const inMath = el => hasAncestor(el, e => e.namespaceURI === NS.m);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const FILLS = ['noFill', 'solidFill', 'gradFill', 'blipFill', 'pattFill', 'grpFill'];
const RPR_ORDER = ['ln', 'noFill', 'solidFill', 'gradFill', 'blipFill', 'pattFill', 'grpFill', 'effectLst', 'effectDag', 'highlight', 'uLnTx', 'uLn', 'uFillTx', 'uFill', 'latin', 'ea', 'cs', 'sym', 'hlinkClick', 'hlinkMouseOver', 'rtl', 'extLst'];
const PPR_ORDER = ['lnSpc', 'spcBef', 'spcAft', 'buClrTx', 'buClr', 'buSzTx', 'buSzPct', 'buSzPts', 'buFontTx', 'buFont', 'buNone', 'buAutoNum', 'buChar', 'buBlip', 'tabLst', 'defRPr', 'extLst'];
const SPPR_ORDER = ['xfrm', 'custGeom', 'prstGeom', 'noFill', 'solidFill', 'gradFill', 'blipFill', 'pattFill', 'grpFill', 'ln', 'effectLst', 'effectDag', 'scene3d', 'sp3d', 'extLst'];
const TCPR_ORDER = ['lnL', 'lnR', 'lnT', 'lnB', 'lnTlToBr', 'lnBlToTr', 'cell3D', 'noFill', 'solidFill', 'gradFill', 'blipFill', 'pattFill', 'grpFill', 'headers', 'extLst'];
const BODYPR_ORDER = ['prstTxWarp', 'noAutofit', 'normAutofit', 'spAutoFit', 'scene3d', 'sp3d', 'flatTx', 'extLst'];

// ---------- colors ----------
const PRST = { black: '000000', white: 'FFFFFF', red: 'FF0000', blue: '0000FF', darkBlue: '00008B', navy: '000080', gray: '808080', grey: '808080', yellow: 'FFFF00', green: '008000' };
const rgb = h => [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16));
const isRed = ([r, g, b]) => r > 170 && g < 110 && b < 110;
const isBlue = ([r, g, b]) => b > 140 && r < 120 && b - r > 60;
const isGreen = ([r, g, b]) => g > 120 && r < 110 && b < 120 && g - r > 50;
const isMagenta = ([r, g, b]) => r > 170 && b > 170 && g < 90;
const isOrange = ([r, g, b]) => r > 170 && g > 60 && g < 150 && b < 60;
const lum = h => { const [r, g, b] = rgb(h); return 0.299 * r + 0.587 * g + 0.114 * b; };

function readTheme(files) {
  const scheme = {};
  if (!files.theme) return scheme;
  const cs = desc(parseXml(files.theme), 'a', 'clrScheme')[0];
  if (!cs) return scheme;
  for (const c of cs.children) {
    const s = kid(c, 'srgbClr'), y = kid(c, 'sysClr');
    scheme[c.localName] = s ? s.getAttribute('val').toUpperCase() : y ? (y.getAttribute('lastClr') || '000000').toUpperCase() : null;
  }
  scheme.tx1 = scheme.dk1; scheme.bg1 = scheme.lt1; scheme.tx2 = scheme.dk2; scheme.bg2 = scheme.lt2;
  return scheme;
}
function colorOf(container, ctx) {
  if (!container) return null;
  for (const c of container.children) {
    const v = c.getAttribute('val');
    let hex = null;
    if (c.localName === 'srgbClr') hex = (v || '').toUpperCase();
    else if (c.localName === 'schemeClr') hex = ctx.scheme[v] || null;
    else if (c.localName === 'prstClr') hex = PRST[v] || null;
    else if (c.localName === 'sysClr') hex = (c.getAttribute('lastClr') || (v === 'windowText' ? '000000' : 'FFFFFF')).toUpperCase();
    else continue;
    // lumMod / lumOff tints (bg1 lumMod 85% = light gray …)
    const lm = kid(c, 'lumMod'), lo = kid(c, 'lumOff');
    if (hex && (lm || lo)) {
      const f = lm ? +lm.getAttribute('val') / 1e5 : 1, o = lo ? +lo.getAttribute('val') / 1e5 : 0;
      hex = rgb(hex).map(x => Math.max(0, Math.min(255, Math.round(x * f + 255 * o))).toString(16).padStart(2, '0')).join('').toUpperCase();
    }
    return hex;
  }
  return null;
}
function solid(doc, hex) { const f = mk(doc, 'a', 'solidFill'), s = mk(doc, 'a', 'srgbClr'); s.setAttribute('val', hex); f.appendChild(s); return f; }
function setSolid(parent, hex, order) { removeKids(parent, FILLS); return placeChild(parent, solid(parent.ownerDocument, hex), order); }

// ---------- package ----------
async function openPackage(b64) {
  const zip = await JSZip.loadAsync(b64, { base64: true });
  const names = Object.keys(zip.files);
  const slidePath = names.find(n => /^ppt\/slides\/slide\d+\.xml$/.test(n));
  const relsPath = slidePath.replace('slides/', 'slides/_rels/') + '.rels';
  const files = { slide: await zip.file(slidePath).async('string') };
  files.rels = zip.file(relsPath) ? await zip.file(relsPath).async('string')
    : '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="' + NS.rel + '"/>';
  let slideW = 6858000, slideH = 9899650;
  const pres = zip.file('ppt/presentation.xml');
  if (pres) {
    const sz = desc(parseXml(await pres.async('string')), 'p', 'sldSz')[0];
    if (sz) { slideW = +sz.getAttribute('cx'); slideH = +sz.getAttribute('cy'); }
  }
  const th = names.find(n => /^ppt\/theme\/theme\d+\.xml$/.test(n));
  if (th) files.theme = await zip.file(th).async('string');
  const layouts = [];
  try {
    const rels = parseXml(files.rels);
    const lr = desc(rels, 'rel', 'Relationship').find(r => /slideLayout$/.test(r.getAttribute('Type')));
    if (lr) {
      const lp = 'ppt/slideLayouts/' + lr.getAttribute('Target').split('/').pop();
      layouts.push(await zip.file(lp).async('string'));
      const lrels = parseXml(await zip.file(lp.replace('slideLayouts/', 'slideLayouts/_rels/') + '.rels').async('string'));
      const mr = desc(lrels, 'rel', 'Relationship').find(r => /slideMaster$/.test(r.getAttribute('Type')));
      if (mr) layouts.push(await zip.file('ppt/slideMasters/' + mr.getAttribute('Target').split('/').pop()).async('string'));
    }
  } catch (e) { /* no layout info */ }
  // a slide whose layout/master already carries the UULA footer keeps it from there
  const uulaMaster = layouts.some(x => /U U L A \. C O M|UULA Footer/.test(x));
  return { zip, slidePath, relsPath, files, slideW, slideH, layouts: layouts.map(parseXml), uulaMaster };
}
// media + relationships added while building a slide
function makeRels(pkg) {
  const doc = parseXml(pkg.files.rels);
  const root = doc.documentElement;
  let n = 1;
  const used = new Set(desc(doc, 'rel', 'Relationship').map(r => r.getAttribute('Id')));
  const media = {};
  return {
    doc,
    image(key, data) {
      if (media[key]) return media[key];
      let id; do { id = 'rIdUR' + (n++); } while (used.has(id)); used.add(id);
      const file = 'ur_' + key + (/\.[a-z0-9]+$/i.test(key) ? '' : '.png');
      pkg.zip.file('ppt/media/' + file, data || UR_ASSETS[key], { base64: true });
      const r = doc.createElementNS(NS.rel, 'Relationship');
      r.setAttribute('Id', id); r.setAttribute('Type', REL_IMG); r.setAttribute('Target', '../media/' + file);
      root.appendChild(r);
      return (media[key] = id);
    },
    link(url) {
      let id; do { id = 'rIdURl' + (n++); } while (used.has(id)); used.add(id);
      const r = doc.createElementNS(NS.rel, 'Relationship');
      r.setAttribute('Id', id); r.setAttribute('Type', REL_LINK); r.setAttribute('Target', url); r.setAttribute('TargetMode', 'External');
      root.appendChild(r);
      return id;
    }
  };
}
// strings go into the zip as UTF-8 bytes: JSZip's own encoder can split an emoji / math letter (surrogate pair)
// that falls on one of its chunk borders, which PowerPoint then refuses
const utf8 = s => new TextEncoder().encode(s);
async function buildPackage(pkg, slideXml, rels) {
  pkg.zip.file(pkg.slidePath, utf8(slideXml));
  if (rels) pkg.zip.file(pkg.relsPath, utf8(serialize(rels.doc)));
  let ct = await pkg.zip.file('[Content_Types].xml').async('string');
  const TYPES = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', bmp: 'image/bmp', tif: 'image/tiff', tiff: 'image/tiff', emf: 'image/x-emf', wmf: 'image/x-wmf', svg: 'image/svg+xml', wdp: 'image/vnd.ms-photo' };
  const exts = new Set(['png']);
  pkg.zip.forEach(n => { const m = /^ppt\/media\/.+\.([a-z0-9]+)$/i.exec(n); if (m) exts.add(m[1].toLowerCase()); });
  let changed = false;
  for (const e of exts) if (TYPES[e] && !new RegExp('Extension="' + e + '"', 'i').test(ct)) { ct = ct.replace(/<Default /, '<Default Extension="' + e + '" ContentType="' + TYPES[e] + '"/><Default '); changed = true; }
  if (changed) pkg.zip.file('[Content_Types].xml', utf8(ct));
  return pkg.zip.generateAsync({ type: 'base64', compression: 'DEFLATE' });
}

// ---------- shapes ----------
const SHAPE_TAGS = ['sp', 'pic', 'cxnSp', 'graphicFrame', 'grpSp', 'AlternateContent', 'contentPart'];
const spTreeOf = doc => desc(doc, 'p', 'spTree')[0];
const topItems = doc => [...spTreeOf(doc).children].filter(c => SHAPE_TAGS.includes(c.localName));
function core(el) {
  if (el.localName !== 'AlternateContent') return el;
  const ch = kid(el, 'Choice', 'mc') || kid(el, 'Fallback', 'mc');
  return ch ? ch.firstElementChild : el;
}
const allCores = el => el.localName === 'AlternateContent' ? [...kids(el, 'Choice', 'mc'), ...kids(el, 'Fallback', 'mc')].map(x => x.firstElementChild).filter(Boolean) : [el];
function xfrmOf(c) {
  if (!c) return null;
  if (c.localName === 'graphicFrame') return kid(c, 'xfrm', 'p');
  if (c.localName === 'grpSp') return kid(kid(c, 'grpSpPr', 'p'), 'xfrm', 'a');
  return kid(kid(c, 'spPr', 'p'), 'xfrm', 'a');
}
function phOf(c) {
  const nv = c && c.firstElementChild;
  return nv ? desc(nv, 'p', 'ph')[0] || null : null;
}
function geomFromXfrm(x) {
  if (!x) return null;
  const off = kid(x, 'off', 'a'), ext = kid(x, 'ext', 'a');
  if (!off || !ext) return null;
  return { x: +off.getAttribute('x'), y: +off.getAttribute('y'), w: +ext.getAttribute('cx'), h: +ext.getAttribute('cy') };
}
function geomOf(el, pkg) {
  const c = core(el);
  const g = geomFromXfrm(xfrmOf(c));
  if (g) return g;
  const ph = phOf(c);
  if (ph) {
    const type = ph.getAttribute('type') || 'body', idx = ph.getAttribute('idx');
    for (const L of pkg.layouts) for (const sp of desc(L, 'p', 'sp')) {
      const lph = phOf(sp); if (!lph) continue;
      const lt = lph.getAttribute('type') || 'body';
      if ((idx != null && lph.getAttribute('idx') === idx) || lt === type) {
        const lg = geomFromXfrm(xfrmOf(sp)); if (lg) return lg;
      }
    }
  }
  return null;
}
// write a position; for groups the children follow (chOff/chExt are left alone, so the group scales)
function setGeom(el, g) {
  for (const c of allCores(el)) {
    const doc = c.ownerDocument;
    let x = xfrmOf(c);
    if (!x) {
      if (c.localName === 'graphicFrame') { x = mk(doc, 'p', 'xfrm'); c.insertBefore(x, kid(c, 'graphic', 'a')); }
      else {
        const sp = kid(c, c.localName === 'grpSp' ? 'grpSpPr' : 'spPr', 'p'); if (!sp) continue;
        x = mk(doc, 'a', 'xfrm'); sp.insertBefore(x, sp.firstChild);
      }
      x.appendChild(mk(doc, 'a', 'off')); x.appendChild(mk(doc, 'a', 'ext'));
    }
    const off = kid(x, 'off', 'a'), ext = kid(x, 'ext', 'a');
    const n = v => { v = Math.round(+v); return isFinite(v) ? v : 0; };
    if (g.x != null) off.setAttribute('x', n(g.x));
    if (g.y != null) off.setAttribute('y', n(g.y));
    if (g.w != null) ext.setAttribute('cx', Math.max(0, n(g.w)));
    if (g.h != null) ext.setAttribute('cy', Math.max(0, n(g.h)));
    if (c.localName === 'grpSp' && g.keepChildren) {
      const co = kid(x, 'chOff', 'a'), ce = kid(x, 'chExt', 'a');
      if (co && ce) { /* children keep their own coordinates, the group frame maps them */ }
    }
  }
}
const textOf = el => desc(el, 'a', 't').map(t => t.textContent).join('') + desc(el, 'm', 't').map(t => t.textContent).join('');
const paraText = p => [...p.getElementsByTagNameNS(NS.a, 't'), ...p.getElementsByTagNameNS(NS.m, 't')].map(t => t.textContent).join('');
const isLineGeom = c => {
  if (c.localName === 'cxnSp') return true;
  const pg = desc(kid(c, 'spPr', 'p'), 'a', 'prstGeom')[0];
  return !!pg && /^(line|straightConnector1|bentConnector\d|curvedConnector\d)$/.test(pg.getAttribute('prst'));
};
function fillColorOf(c, ctx) {
  const spPr = kid(c, 'spPr', 'p');
  const sf = kid(spPr, 'solidFill', 'a');
  if (sf) return colorOf(sf, ctx);
  const gf = kid(spPr, 'gradFill', 'a');
  if (gf) { const gs = desc(gf, 'a', 'gs')[0]; return gs ? colorOf(gs, ctx) : null; }
  if (kid(spPr, 'noFill', 'a') || kid(spPr, 'blipFill', 'a')) return null;
  const ref = desc(kid(c, 'style', 'p'), 'a', 'fillRef')[0];
  return ref && +ref.getAttribute('idx') > 0 ? colorOf(ref, ctx) : null;
}
function cnvOf(c) { const nv = c && c.firstElementChild; return nv ? kid(nv, 'cNvPr', 'p') : null; }
function maxId(doc) { let m = 1; for (const n of desc(doc, 'p', 'cNvPr')) m = Math.max(m, +n.getAttribute('id') || 0); return m; }

// ---------- text helpers ----------
// size (hundredths of pt) of the first run in a paragraph, falling back to the body size
function runSz(p) {
  for (const r of desc(p, 'a', 'rPr')) if (r.getAttribute('sz')) return +r.getAttribute('sz');
  const e = kid(p, 'endParaRPr', 'a'); if (e && e.getAttribute('sz')) return +e.getAttribute('sz');
  return 0;
}
function runBold(p) {
  const rs = desc(p, 'a', 'r').filter(r => (kid(r, 't', 'a') || {}).textContent && kid(r, 't', 'a').textContent.trim());
  if (!rs.length) return false;
  return rs.every(r => { const pr = kid(r, 'rPr', 'a'); return pr && /^(1|true)$/.test(pr.getAttribute('b') || ''); });
}
function runColor(p, ctx) {
  for (const r of desc(p, 'a', 'r')) {
    const t = kid(r, 't', 'a'); if (!t || !t.textContent.trim()) continue;
    const pr = kid(r, 'rPr', 'a'); const sf = pr && kid(pr, 'solidFill', 'a');
    return sf ? colorOf(sf, ctx) : null;
  }
  for (const r of desc(p, 'm', 'r')) { const pr = desc(r, 'a', 'rPr')[0]; const sf = pr && kid(pr, 'solidFill', 'a'); if (sf) return colorOf(sf, ctx); }
  return null;
}
const hasBullet = p => { const pPr = kid(p, 'pPr', 'a'); return !!pPr && !!(kid(pPr, 'buChar', 'a') || kid(pPr, 'buAutoNum', 'a')); };
const bulletChar = p => { const pPr = kid(p, 'pPr', 'a'); const b = pPr && kid(pPr, 'buChar', 'a'); return b ? b.getAttribute('char') : null; };

// question / answer / heading patterns (Arabic + English)
const Q_START = /^\s*(س\s*[0-9٠-٩]+|سؤال|السؤال|علل|عل+ل|اذكر|اُذكر|عرّف|عرف|قارن|وضّح|وضح|اشرح|بيّن|بين\s|ما\s|ماذا|متى|لماذا|كيف|هل\s|أوجد|اوجد|احسب|بسّط|بسط|حل\s|حلّ|أثبت|اثبت|ارسم|أكمل|اكمل|اختر|ضع\s|صحح|Q\s*[0-9]|Find|Solve|Prove|Simplify|Evaluate|What|Why|How|Explain|Define)/i;
const Q_NUM = /^\s*([0-9٠-٩]{1,2}\s*[-.)]|[(]\s*[0-9٠-٩]{1,2}\s*[)])\s*\S/;
const Q_PREFIX = /^\s*(س\s*[0-9٠-٩]*\s*[:/\-).]|السؤال\s*\S*\s*:|سؤال\s*[0-9٠-٩]*\s*:|[0-9٠-٩]{1,2}\s*[-.)]|[(]\s*[0-9٠-٩]{1,2}\s*[)]|Q\s*[0-9]*\s*[:.)])\s*/i;
const A_START = /^\s*(ج\s*[0-9٠-٩]*\s*[:/\-]|الجواب|الإجابة|الاجابة|الحل\s*:|الحل$|Answer|Solution)/i;
const QHEAD = /^\s*(أجب|اجب|مثال|أمثلة|حاول أن تحل|حاول ان تحل|تدريب|تمرين|تمارين|التمارين|أسئلة|اسئلة|تحقق من فهمك|Example|Exercise|Try)/i;
const PILL = /^\s*((?:تعريف|نظرية|خاصية|قاعدة|مسلّمة|مسلمة|نتيجة|Definition|Theorem|Property|Rule)\s*[0-9٠-٩]*\s*[:：])\s*/i;
const CHOICE = /^\s*([\u24B6-\u24E9]|[(]?[a-dA-Dأبجد]\s*[)]\s)/;
const KW = {
  note: /ملاحظة|ملاحظه|تنبيه|هام\b|مهم\b|انتبه|تذكّر|تذكر|Note|Important|Remember/i,
  quote: /قال تعالى|قال رسول الله|ﷺ|﴿|﴾|«|»|من كتاب|قال الشاعر/,
  def: /^\s*(تعريف|المفهوم|مفهوم|Definition)/i,
  formula: /قانون|معادلة|نظرية|القاعدة|الصيغة|Formula|Theorem/i,
  activity: /^\s*(نشاط|Activity)/i,
  mars: /إثراء|اثراء|تحدي|تحدٍّ|فكّر|فكر\b|سؤال ذكاء|من المريخ|Challenge/i,
  practice: /تـ*د*ر*ب\s*و\s*تـ*ف*و*ق|تدرب وتفوق|Practice\s*&\s*Succeed/i
};

// ---------- analysis ----------
// returns the items of the slide with a role each
function analyze(doc, pkg, ctx) {
  const W = pkg.slideW, H = pkg.slideH;
  const items = topItems(doc).map((el, i) => {
    const c = core(el);
    const it = { i, el, c, g: geomOf(el, pkg), tag: c.localName, kind: 'other', drop: null, role: null, text: '' };
    const cnv = cnvOf(c);
    it.name = cnv ? cnv.getAttribute('name') || '' : '';
    it.id = cnv ? cnv.getAttribute('id') : null;
    if (!it.g) { it.g = { x: 0, y: 0, w: 0, h: 0 }; it.nogeom = true; }
    const ph = phOf(c); it.ph = ph ? ph.getAttribute('type') || 'body' : null;
    it.text = textOf(c).trim();
    if (it.tag === 'pic') it.kind = 'pic';
    else if (it.tag === 'graphicFrame') it.kind = desc(c, 'a', 'tbl').length ? 'table' : 'object';
    else if (it.tag === 'grpSp') it.kind = 'group';
    else if (it.tag === 'contentPart') it.kind = 'ink';
    else if (isLineGeom(c)) it.kind = 'line';
    else if (it.tag === 'sp') it.kind = it.text ? 'text' : 'shape';
    if (it.tag === 'sp') it.fill = fillColorOf(c, ctx);
    it.off = it.g.x + it.g.w <= 0 || it.g.x >= W || it.g.y >= H || it.g.y + it.g.h <= 0;
    return it;
  });
  for (const it of items) classify(it, items, pkg, ctx);
  findContainers(items, pkg);
  return items;
}
function classify(it, items, pkg, ctx) {
  const W = pkg.slideW, H = pkg.slideH, g = it.g;
  if (it.off) { it.drop = it.kind === 'pic' ? 'offpic' : (it.kind === 'text' && /^(https?:|www\.)/i.test(it.text.replace(/\s+/g, '')) ? 'link' : 'off'); return; }
  if (/^UULA (Footer|Watermark)|^CustomPageNumber_/.test(it.name)) { it.drop = 'footer'; return; }
  const pin = PIN.exec(it.name);
  if (pin) { if (TEXT_ROLES.includes(pin[1])) it.pinText = pin[1]; else if (BOX_ROLES.includes(pin[1])) it.pinBox = pin[1]; else it.pinObj = pin[1]; if (it.kind === 'text') return; }
  if (['sldNum', 'ftr', 'dt'].includes(it.ph)) { it.drop = 'footer'; return; }
  if (it.kind === 'text') {
    const t = it.text.replace(/\s+/g, ' ');
    if (/^[0-9٠-٩]{1,4}$/.test(t) && g.w < W * 0.25 && g.y > H * 0.85) { it.drop = 'pagenum'; return; }
    if (/^(صفحة|الصفحة|ص|Page|P\.)\s*[0-9٠-٩]{1,4}$/i.test(t) && g.y > H * 0.85) { it.drop = 'pagenum'; return; }
    if (g.y > H * 0.9 && (/U\s*U\s*L\s*A\s*\.\s*C\s*O\s*M/i.test(t) || /جـ*م*ـ*ي*ـ*ع.*محفوظة|حقوق/.test(t) || /^20\d\d\s*[—–-]\s*20\d\d$/.test(t))) { it.drop = 'footer'; return; }
  }
  if (it.kind === 'pic') {
    // a picture covering most of the slide is a background
    if (g.w > W * 0.85 && g.h > H * 0.6) { it.drop = 'keepbg'; return; }   // a background picture stays as it is
    // footer logo
    if (g.y > H * 0.92 && g.w < 60 * PT && g.h < 60 * PT) { it.drop = 'footer'; return; }
    const small = Math.max(g.w, g.h) < 100 * PT, linked = !!desc(it.c, 'a', 'hlinkClick').length;
    const r = g.h ? g.w / g.h : 0;
    if (small && (linked || (r > 0.75 && r < 1.3 && Math.max(g.w, g.h) < 70 * PT && g.x < W * 0.3))) { it.kind = 'qr'; return; }
    if (Math.max(g.w, g.h) < 22 * PT) { it.kind = 'icon'; return; }
    return;
  }
  if (it.kind === 'shape') {
    // a filled shape without text: card (container) candidate or decoration
    const edge = g.y <= 2 * PT || g.y + g.h >= H - 2 * PT;
    if (edge && g.w > W * 0.8 && g.h < H * 0.12) { it.drop = 'decor'; return; }     // header / footer strip
    if (it.fill && g.w > W * 0.3 && g.h > 18 * PT) { it.kind = 'card'; return; }
    if (g.w > W * 0.9 && g.h < 12 * PT) { it.drop = 'decor'; return; }       // colored strip
    if (!it.fill && !desc(it.c, 'a', 'ln').length) { it.drop = 'decor'; return; }
    return;
  }
  if (it.kind === 'line') {
    if (g.w > W * 0.85 && g.y < H * 0.2) { it.drop = 'decor'; return; }      // old header rule
    return;
  }
  if (it.kind === 'text') {
    // a big filled text shape works as a container holding its own text
    if (it.fill && lum(it.fill) < 250 && g.w > W * 0.45) { it.boxText = true; }
    else if (it.fill && g.w < W * 0.3) { it.kind = 'chip'; return; }      // small colored label (س / ج bubbles …)
  }
}
// cards hold the items whose centre lies inside them
function findContainers(items, pkg) {
  const cards = items.filter(t => !t.drop && (t.kind === 'card' || t.boxText));
  for (const t of items) {
    if (t.drop || t.kind === 'card' || t.boxText) continue;
    const cx = t.g.x + t.g.w / 2, cy = t.g.y + t.g.h / 2;
    let best = null;
    for (const k of cards) {
      const g = k.g;
      if (cx >= g.x && cx <= g.x + g.w && cy >= g.y && cy <= g.y + g.h && (!best || g.w * g.h < best.g.w * best.g.h)) best = k;
    }
    if (best) t.box = best;
  }
  // a card holding nothing is decoration
  for (const k of cards) if (k.kind === 'card' && !items.some(t => t.box === k)) k.drop = 'decor';
}
// container type from the text it holds and its original color
function boxType(k, members) {
  const nm = /^UULA (.+) Container/.exec(k.name || '');
  if (nm) { const key = Object.keys(BOX).find(b => BOX[b].name === nm[1]); if (key) return key; }
  const txt = [k.boxText ? k.text : '', ...members.filter(t => t.kind === 'text').map(t => t.text)].join(' ').replace(/\u0640/g, '');
  const first = txt.trim();
  if (KW.practice.test(first)) return 'practice';
  if (KW.activity.test(first)) return 'activity';
  if (KW.mars.test(first.slice(0, 60))) return 'mars';
  if (KW.note.test(first.slice(0, 40))) return 'note';
  if (KW.quote.test(first)) return 'quote';
  if (KW.def.test(first)) return 'def';
  const f = k.fill ? k.fill.toUpperCase() : '';
  if (f === 'FBEBD3') return 'note';
  if (f === 'E2F0D9') return 'def';
  if (f === 'F1F1F1') return 'activity';
  return 'formula';
}

// ---------- paragraph roles ----------
function paraRoles(it, ctx, pkg) {
  const ps = kids(kid(it.c, 'txBody', 'p'), 'p', 'a');
  const W = pkg.slideW, H = pkg.slideH;
  const out = [];
  let lastQ = -1;
  for (let k = 0; k < ps.length; k++) {
    const p = ps[k], t = paraText(p).replace(/\u0640/g, '').trim();
    let role = 'body';
    const col = runColor(p, ctx), crgb = col && /^[0-9A-F]{6}$/.test(col) ? rgb(col) : null;
    const sz = runSz(p), bold = runBold(p), bu = bulletChar(p);
    const body = ctx.bodySz || 1100;
    const big = sz && sz >= body * 1.2, nPar = ps.filter(x => paraText(x).trim()).length;
    if (!t) role = out.length ? out[out.length - 1].role : 'body';
    else if (it.ph === 'title' || it.ph === 'ctrTitle') role = 'lesson';
    else if (A_START.test(t)) role = 'answer';
    else if (CHOICE.test(t) || (CIRC.test(t.charAt(0)) && /[Ⓐ-ⓩ]/.test(t))) role = 'choice';
    else if (bu === 'Q' || bu === 'س') role = 'question';
    else if (QHEAD.test(t) && (t.length < 140)) role = 'qhead';
    else if (crgb && isRed(crgb) && bold && t.length < 160 && !/[؟?]\s*$/.test(t)) role = 'qhead';
    else if (crgb && isBlue(crgb) && lastQ >= 0) role = 'answer';
    else if (Q_START.test(t) || Q_NUM.test(t) || /[؟?]\s*$/.test(t)) role = 'question';
    else if (crgb && isBlue(crgb) && (!sz || sz <= body * 1.15)) role = 'answer';
    else if (((bold && (!sz || sz >= body)) || big) && t.length < 70 && nPar <= 2 && !hasBullet(p) && !/[.:،,]\s*$/.test(t)) role = it.box ? 'boxtitle' : 'topic';
    if (role === 'question') lastQ = k;
    out.push({ p, role, text: t, bullet: hasBullet(p) && bu !== 'Q' && bu !== 'س', col: col });
  }
  // a lone short first line ending with ':' followed by questions introduces them
  for (let k = 0; k < out.length - 1; k++) if (out[k].role === 'question' && /[:：]\s*$/.test(out[k].text) && out[k + 1].role === 'question') out[k].role = 'qhead';
  return out;
}
// chapter + lesson at the top of the slide
function headerRoles(items, pkg) {
  const H = pkg.slideH;
  const texts = items.filter(t => !t.drop && t.kind === 'text' && !t.box && t.g.y < H * 0.16);
  if (!texts.length) return;
  const sz = t => Math.max(...kids(kid(t.c, 'txBody', 'p'), 'p', 'a').map(runSz), 0);
  const title = texts.find(t => t.ph === 'title' || t.ph === 'ctrTitle')
    || texts.filter(t => sz(t) >= 1600 && t.text.length < 120).sort((a, b) => sz(b) - sz(a) || a.g.y - b.g.y)[0];
  if (title) {
    title.role = 'lesson';
    const above = texts.filter(t => t !== title && t.g.y + t.g.h <= title.g.y + title.g.h * 0.5 && t.text.length < 80);
    if (above.length) above.sort((a, b) => a.g.y - b.g.y)[0].role = 'chapter';
  } else {
    const ch = texts.find(t => /الوحدة|الفصل|Unit|Chapter/.test(t.text) && t.text.length < 80 && sz(t) <= 1200);
    if (ch) ch.role = 'chapter';
  }
}

// ---------- styling ----------
function snapColor(hex, role) {
  // keep meaningful colors, snapped to the palette; everything else takes the role color
  if (!hex || !/^[0-9A-F]{6}$/.test(hex)) return null;
  const c = rgb(hex);
  if (isMagenta(c)) return C.formula;
  if (isGreen(c)) return C.givens;
  if (isOrange(c) && role !== 'qhead') return C.otherform;
  if (isRed(c) && role === 'answer') return C.answer;              // a solution is always blue (old red answers too)
  if (isRed(c) && (role === 'body' || role === 'label')) return 'FF0000';
  if (isBlue(c) && (role === 'body' || role === 'question' || role === 'label' || role === 'choice' || role === 'qcont')) return C.answer;
  return null;
}
function styleRPr(rPr, st, role, keepCol, math) {
  const doc = rPr.ownerDocument;
  rPr.setAttribute('sz', String(st.sz));
  if (st.b) rPr.setAttribute('b', '1');
  else if (!st.keepB) rPr.removeAttribute('b');
  ['i', 'u', 'strike', 'cap', 'spc', 'kern', 'baseline'].forEach(a => { if (a !== 'baseline' && a !== 'i') rPr.removeAttribute(a); });
  if (!math) rPr.removeAttribute('i');
  const old = kid(rPr, 'solidFill', 'a');
  const oldHex = old ? colorOf(old, { scheme: {} }) : null;
  removeKids(rPr, ['ln', 'noFill', 'solidFill', 'gradFill', 'blipFill', 'pattFill', 'grpFill', 'effectLst', 'effectDag', 'highlight']);
  const keep = keepCol ? snapColor(keepCol, role) || snapColor(oldHex, role) : null;
  let col = keep || st.c;
  // the correct choice of a multiple-choice question: bold 2070DF (the skill); an answer marked inside a question: 1F71DE, not bold
  const mark = rPr.getAttribute('bmk') || '';
  if (mark === 'UULA:correct' || (role === 'choice' && col === C.answer)) { col = C.answerOk; rPr.setAttribute('b', '1'); }
  else if (mark === 'UULA:answer') { col = C.answer; rPr.removeAttribute('b'); }
  placeChild(rPr, solid(doc, col), RPR_ORDER);
  if (!math) {
    removeKids(rPr, ['latin', 'ea', 'cs']);
    for (const t of ['latin', 'cs']) { const e = mk(doc, 'a', t); e.setAttribute('typeface', 'UULA Sans'); placeChild(rPr, e, RPR_ORDER); }
  }
}
// circled numbers / letters are always black (split runs when needed)
function blackCircles(root) {
  const doc = root.ownerDocument;
  const setBlack = r => {
    let rPr = [...r.children].find(n => n.localName === 'rPr');
    if (!rPr) { rPr = mk(doc, 'a', 'rPr'); rPr.setAttribute('lang', 'ar-KW'); r.insertBefore(rPr, r.firstChild); }
    removeKids(rPr, FILLS);
    placeChild(rPr, solid(doc, '000000'), RPR_ORDER);
  };
  for (const r of [...desc(root, 'a', 'r'), ...desc(root, 'm', 'r')]) {
    const t = [...r.children].find(x => x.localName === 't'); if (!t || !CIRC.test(t.textContent)) continue;
    if (hasAncestor(r, e => e.localName === 'tc' && e.getAttribute('data-ur-sol') === '1')) continue;
    const parts = t.textContent.split(CIRC_SPLIT).filter(s => s.length);
    if (parts.length === 1) { setBlack(r); continue; }
    for (const s of parts) {
      const c = r.cloneNode(true); const ct = [...c.children].find(x => x.localName === 't'); ct.textContent = s;
      if (/^\s|\s$/.test(s)) ct.setAttribute('xml:space', 'preserve');
      if (CIRC.test(s)) setBlack(c);
      r.parentNode.insertBefore(c, r);
    }
    r.parentNode.removeChild(r);
  }
}
function setPPr(p, opt) {
  const doc = p.ownerDocument;
  let pPr = kid(p, 'pPr', 'a');
  if (!pPr) { pPr = mk(doc, 'a', 'pPr'); p.insertBefore(pPr, p.firstChild); }
  const tabs = kid(pPr, 'tabLst', 'a');
  while (pPr.firstChild) pPr.removeChild(pPr.firstChild);
  ['lvl', 'marR', 'defTabSz', 'eaLnBrk', 'fontAlgn', 'latinLnBrk', 'hangingPunct'].forEach(a => pPr.removeAttribute(a));
  pPr.setAttribute('algn', opt.algn); pPr.setAttribute('rtl', opt.rtl ? '1' : '0');
  pPr.setAttribute('marL', String(opt.marL || 0)); pPr.setAttribute('indent', String(opt.indent || 0));
  const add = x => { const w = parseXml('<w ' + XMLNS + '>' + x + '</w>').documentElement; for (const n of [...w.children]) pPr.appendChild(doc.importNode(n, true)); };
  add('<a:lnSpc><a:spcPct val="100000"/></a:lnSpc>');
  add('<a:spcBef><a:spcPts val="0"/></a:spcBef>');
  add('<a:spcAft><a:spcPts val="0"/></a:spcAft>');
  if (opt.bullet === 'Q') add('<a:buClr><a:srgbClr val="FF0000"/></a:buClr><a:buSzPct val="100000"/><a:buFont typeface="UULA Sans Black" panose="00000300000000000000" pitchFamily="2" charset="-78"/><a:buChar char="Q"/>');
  else if (opt.bullet === '§') add('<a:buFont typeface="Wingdings" pitchFamily="2" charset="2"/><a:buChar char="§"/>');
  else if (opt.bullet && opt.bullet.auto) { const b = frag(doc, '<a:buAutoNum type="' + opt.bullet.auto + '"/>'); if (opt.bullet.start) b.setAttribute('startAt', opt.bullet.start); add('<a:buFontTx/>'); pPr.appendChild(b); }
  else add('<a:buNone/>');
  if (tabs) pPr.appendChild(tabs);
  return pPr;
}
// normalise the text body of a shape (insets 0, autofit, top anchor)
function setBody(c, opt) {
  const doc = c.ownerDocument;
  const tb = kid(c, 'txBody', 'p'); if (!tb) return;
  const bp = kid(tb, 'bodyPr', 'a');
  const ins = opt.ins || [0, 0, 0, 0];
  ['lIns', 'tIns', 'rIns', 'bIns'].forEach((a, k) => bp.setAttribute(a, String(ins[k])));
  bp.setAttribute('wrap', opt.wrap || 'square'); bp.setAttribute('rtlCol', '0');
  bp.setAttribute('anchor', opt.anchor || 't');
  ['vert', 'numCol', 'spcCol', 'rot', 'upright'].forEach(a => bp.removeAttribute(a));
  removeKids(bp, ['prstTxWarp', 'noAutofit', 'normAutofit', 'spAutoFit']);
  placeChild(bp, mk(doc, 'a', opt.autofit === false ? 'noAutofit' : 'spAutoFit'), BODYPR_ORDER);
  const ls = kid(tb, 'lstStyle', 'a'); if (ls) while (ls.firstChild) ls.removeChild(ls.firstChild);
}
function plainShape(c, keepFill) {
  const doc = c.ownerDocument;
  const spPr = kid(c, 'spPr', 'p'); if (!spPr) return;
  removeKids(spPr, ['effectLst', 'effectDag', 'scene3d', 'sp3d']);
  if (!keepFill) {
    removeKids(spPr, [...FILLS, 'ln']);
    placeChild(spPr, mk(doc, 'a', 'noFill'), SPPR_ORDER);
    placeChild(spPr, frag(doc, '<a:ln><a:noFill/></a:ln>'), SPPR_ORDER);
  }
  const x = xfrmOf(c); if (x) { x.removeAttribute('rot'); x.removeAttribute('flipH'); x.removeAttribute('flipV'); }
  const st = kid(c, 'style', 'p'); if (st) c.removeChild(st);
}
// style every paragraph of a text item; returns the roles found (for spacing)
function styleText(it, ctx, pkg, forcedRole) {
  const c = it.c;
  let roles = forcedRole ? kids(kid(c, 'txBody', 'p'), 'p', 'a').map(p => ({ p, role: forcedRole === 'bullets' ? 'body' : forcedRole, text: paraText(p).trim(), bullet: forcedRole === 'bullets' ? !!paraText(p).trim() : hasBullet(p), col: runColor(p, ctx) })) : paraRoles(it, ctx, pkg);
  // a box marked "question" keeps its answer lines as answers
  if (forcedRole === 'question') {
    const auto = paraRoles(it, ctx, pkg);
    let seenQ = false;
    roles.forEach((r, k) => {
      if (!r.text && !desc(r.p, 'm', 'oMath').length) return;
      if (seenQ && auto[k] && ['answer', 'choice'].includes(auto[k].role)) r.role = auto[k].role;
      // the lines that continue a question (an equation, the rest of the sentence) sit under it without a new Q
      else if (seenQ && !(auto[k] && auto[k].role === 'question') && !Q_START.test(r.text) && !Q_NUM.test(r.text)) r.role = 'qcont';
      if (r.role === 'question') seenQ = true;
    });
  }
  const arAll = AR.test(it.text);
  let stripped = false;
  for (const pr of roles) {
    const st = STY[pr.role] || STY.body;
    let ar = pr.text ? AR.test(pr.text) : arAll;
    // an equation line inside an Arabic box stays on the right with the text around it
    if (!ar && arAll && pr.role !== 'question' && desc(pr.p, 'm', 'oMath').length && !desc(pr.p, 'a', 't').some(x => /[A-Za-z]{3,}/.test(x.textContent))) ar = true;
    let bullet = null, marL = 0, indent = 0;
    if (st.q) {
      bullet = 'Q'; marL = 182880; indent = -182880;
      const t0 = desc(pr.p, 'a', 't')[0];
      if (t0 && Q_PREFIX.test(t0.textContent)) { t0.textContent = t0.textContent.replace(Q_PREFIX, ''); stripped = true; }
      // a question that is only math (no Arabic left): Q stays on the right, the math keeps its left-to-right order
      if (!AR.test(paraText(pr.p)) && arAll) {
        ar = true;
        const ts = desc(pr.p, 'a', 't').filter(x => !inMath(x));
        if (ts.length && !/^\u202A/.test(ts[0].textContent)) { ts[0].textContent = '\u202A' + ts[0].textContent; ts[ts.length - 1].textContent += '\u202C'; }
      }
    } else if (pr.role === 'answer' || pr.role === 'choice' || pr.role === 'qcont') { marL = 182880; }
    else if (pr.bullet && (pr.role === 'body')) {
      const auto = desc(kid(pr.p, 'pPr', 'a'), 'a', 'buAutoNum')[0];
      bullet = auto ? { auto: auto.getAttribute('type'), start: auto.getAttribute('startAt') } : '§';
      marL = 182880; indent = -182880;
    }
    setPPr(pr.p, { algn: (pr.role === 'pill' ? 'ctr' : ar ? 'r' : 'l'), rtl: ar, marL, indent, bullet });
    const keepCol = ['body', 'answer', 'question', 'label', 'choice', 'qcont'].includes(pr.role);
    for (const r of desc(pr.p, 'a', 'r')) { let rPr = kid(r, 'rPr', 'a'); if (!rPr) { rPr = mk(r.ownerDocument, 'a', 'rPr'); rPr.setAttribute('lang', ar ? 'ar-KW' : 'en-US'); r.insertBefore(rPr, r.firstChild); } styleRPr(rPr, st, pr.role, keepCol ? (rPr.querySelector && kid(rPr, 'solidFill', 'a') ? colorOf(kid(rPr, 'solidFill', 'a'), ctx) : null) : null, false); }
    for (const r of desc(pr.p, 'a', 'fld')) { let rPr = kid(r, 'rPr', 'a'); if (rPr) styleRPr(rPr, st, pr.role, null, false); }
    for (const rPr of desc(pr.p, 'a', 'rPr').filter(x => inMath(x))) styleRPr(rPr, st, pr.role, keepCol ? colorOf(kid(rPr, 'solidFill', 'a'), ctx) : null, true);
    const e = kid(pr.p, 'endParaRPr', 'a'); if (e) styleRPr(e, st, pr.role, null, false);
    if (pr.role === 'qhead') labelOnly(pr.p);
  }
  return { roles: roles.map(r => r.role), stripped };
}

// "تحقق من فهمك 2: أوجد …": only the label up to ':' is red and bold, the instruction after it is black
function labelOnly(p) {
  const runs = desc(p, 'a', 'r');
  const full = runs.map(r => (kid(r, 't', 'a') || { textContent: '' }).textContent).join('');
  const ci = full.search(/[:：]/);
  if (ci <= 0 || ci > 40 || full.length - ci < 12) return;
  const cut = ci + 1;
  const plain = r => { const pr = kid(r, 'rPr', 'a'); if (!pr) return; pr.setAttribute('b', '0'); removeKids(pr, FILLS); placeChild(pr, solid(pr.ownerDocument, '000000'), RPR_ORDER); };
  let acc = 0;
  for (const r of runs) {
    const t = kid(r, 't', 'a'); if (!t) continue;
    const len = t.textContent.length;
    if (acc >= cut) plain(r);
    else if (acc + len > cut) {
      const c = r.cloneNode(true), ct = kid(c, 't', 'a');
      ct.textContent = t.textContent.slice(cut - acc); ct.setAttribute('xml:space', 'preserve');
      t.textContent = t.textContent.slice(0, cut - acc);
      r.parentNode.insertBefore(c, r.nextSibling); plain(c);
    }
    acc += len;
  }
}
// ---------- tables ----------
function styleTable(it, ctx, W) {
  const doc = it.c.ownerDocument;
  const tbl = desc(it.c, 'a', 'tbl')[0]; if (!tbl) return;
  const tblPr = kid(tbl, 'tblPr', 'a');
  if (tblPr) { removeKids(tblPr, ['tableStyleId', ...FILLS, 'effectLst']); ['bandRow', 'bandCol', 'lastRow', 'lastCol'].forEach(a => tblPr.removeAttribute(a)); }
  const rows = kids(tbl, 'tr', 'a');
  const grid = kids(kid(tbl, 'tblGrid', 'a'), 'gridCol', 'a');
  const cellText = tc => textOf(tc).trim();
  // the answer table at the end of the objective exercises: a cell reading exactly "الحل"
  const sol = rows.some(r => kids(r, 'tc', 'a').some(tc => /^(الحل|الإجابة|الاجابة)$/.test(cellText(tc)))) && !/شرط الحل/.test(textOf(tbl));
  const firstColHead = rows.length > 1 && rows.every(r => { const t = kids(r, 'tc', 'a')[0]; return t && cellText(t); }) && grid.length > 2 && !sol
    ? false : false;
  // a header row has short labels; a table of statements (true / false, sentences) has none
  const headRow = rows.length > 1 && kids(rows[0], 'tc', 'a').every(tc => cellText(tc).length <= 25 && !/[.؟?]\s*$/.test(cellText(tc)));
  rows.forEach((tr, ri) => {
    tr.setAttribute('h', '254000');
    kids(tr, 'tc', 'a').forEach((tc, ci) => {
      const txt = cellText(tc);
      const head = headRow && ri === 0;
      let fill = head ? C.head : ((ri + (headRow ? 0 : 1)) % 2 ? 'FFFFFF' : C.alt), bold = head;
      if (sol) {
        const ansRow = ri > 0;
        const solCol = kids(tr, 'tc', 'a').findIndex(x => /^(الحل|الإجابة|الاجابة|السؤال)$/.test(cellText(x)));
        fill = ri === 0 ? C.head : 'FFFFFF'; bold = ri === 0;
        if (ci === solCol || /^(الحل|الإجابة|الاجابة|السؤال)$/.test(txt)) { fill = ri === 0 ? C.head : C.mainCol; bold = true; }
        if (ansRow && /^[a-dA-D]$/.test(txt)) {
          const t = desc(tc, 'a', 't')[0];
          t.textContent = String.fromCharCode(0x24D0 + txt.toLowerCase().charCodeAt(0) - 97);
          tc.setAttribute('data-ur-sol', '1');
        }
      } else if (firstColHead && ci === 0 && ri > 0) { fill = C.mainCol; bold = true; }
      let tcPr = kid(tc, 'tcPr', 'a');
      if (tcPr) tc.removeChild(tcPr);
      tcPr = frag(doc, '<a:tcPr marL="72000" marR="72000" marT="0" marB="0" anchor="ctr">'
        + ['lnL', 'lnR', 'lnT', 'lnB'].map(n => '<a:' + n + ' w="6350"><a:solidFill><a:srgbClr val="D9D9D9"/></a:solidFill></a:' + n + '>').join('')
        + '<a:solidFill><a:srgbClr val="' + fill + '"/></a:solidFill></a:tcPr>');
      tc.appendChild(tcPr);
      const solCell = tc.getAttribute('data-ur-sol') === '1';
      for (const p of desc(tc, 'a', 'p')) {
        const ar = AR.test(paraText(p));
        // short labels and numbers in the middle; a sentence reads from its side
        setPPr(p, { algn: !bold && paraText(p).trim().length > 30 ? (ar ? 'r' : 'l') : 'ctr', rtl: ar });
        const st = { sz: 1100, b: bold ? 1 : 0, c: solCell ? C.answer : '000000' };
        for (const r of desc(p, 'a', 'r')) { let rPr = kid(r, 'rPr', 'a'); if (!rPr) { rPr = mk(doc, 'a', 'rPr'); r.insertBefore(rPr, r.firstChild); } styleRPr(rPr, st, 'cell', null, false); if (solCell) rPr.removeAttribute('b'); }
        for (const rPr of desc(p, 'a', 'rPr').filter(inMath)) styleRPr(rPr, st, 'cell', null, true);
        const e = kid(p, 'endParaRPr', 'a'); if (e) styleRPr(e, st, 'cell', null, false);
      }
    });
  });
  it.tableRows = rows.length; it.sol = sol;
  if (!it.fullW) return;                     // something sits beside the table: keep its size
  // width = content width, keeping the column ratios
  const CW = W - 2 * M;
  const tot = grid.reduce((s, g) => s + (+g.getAttribute('w') || 0), 0) || 1;
  let acc = 0;
  grid.forEach((g, k) => { const w = k === grid.length - 1 ? CW - acc : Math.round((+g.getAttribute('w') || 0) * CW / tot); acc += w; g.setAttribute('w', String(w)); });
  it.tableRows = rows.length; it.sol = sol;
}

// ---------- pictures ----------
function stylePic(it, inBox) {
  const doc = it.c.ownerDocument;
  for (const c of allCores(it.el)) {
    const spPr = kid(c, 'spPr', 'p'); if (!spPr) continue;
    removeKids(spPr, ['ln', 'effectLst', 'effectDag', 'scene3d', 'sp3d']);
    if (!inBox && it.kind === 'pic') placeChild(spPr, frag(doc, '<a:ln w="6350"><a:solidFill><a:srgbClr val="D9D9D9"/></a:solidFill></a:ln>'), SPPR_ORDER);
    const st = kid(c, 'style', 'p'); if (st) c.removeChild(st);
    const bf = kid(c, 'blipFill', 'p'), blip = bf && kid(bf, 'blip', 'a');
    if (blip) removeKids(blip, ['alphaModFix', 'duotone', 'grayscl', 'lum', 'biLevel', 'clrChange', 'tint']);
  }
}
// fonts inside groups / small labels: UULA Sans, sizes kept
function fontOnly(root) {
  for (const rPr of [...desc(root, 'a', 'rPr'), ...desc(root, 'a', 'endParaRPr'), ...desc(root, 'a', 'defRPr')]) {
    if (inMath(rPr)) continue;
    const doc = rPr.ownerDocument;
    removeKids(rPr, ['latin', 'ea', 'cs']);
    for (const t of ['latin', 'cs']) { const e = mk(doc, 'a', t); e.setAttribute('typeface', 'UULA Sans'); placeChild(rPr, e, RPR_ORDER); }
  }
}

// ---------- XML builders (also used by the templates) ----------
let NEXT = 1000;
const nid = () => String(NEXT++);
const rPrX = (o) => '<a:rPr lang="' + (o.ar === false ? 'en-US' : 'ar-KW') + '" sz="' + (o.sz || 1100) + '"' + (o.b ? ' b="1"' : ' b="0"') + ' dirty="0"><a:solidFill><a:srgbClr val="' + (o.c || '000000') + '"/></a:solidFill><a:latin typeface="' + (o.font || 'UULA Sans') + '"/><a:cs typeface="' + (o.font || 'UULA Sans') + '"/></a:rPr>';
function pX(text, o) {
  o = o || {};
  const ar = o.ar !== false;
  let ppr = '<a:pPr marL="' + (o.marL || 0) + '" indent="' + (o.indent || 0) + '" algn="' + (o.algn || (ar ? 'r' : 'l')) + '" rtl="' + (ar ? 1 : 0) + '"><a:lnSpc><a:spcPct val="100000"/></a:lnSpc><a:spcBef><a:spcPts val="0"/></a:spcBef><a:spcAft><a:spcPts val="0"/></a:spcAft>';
  if (o.q) ppr += '<a:buClr><a:srgbClr val="FF0000"/></a:buClr><a:buSzPct val="100000"/><a:buFont typeface="UULA Sans Black" panose="00000300000000000000" pitchFamily="2" charset="-78"/><a:buChar char="Q"/>';
  else if (o.dot) ppr += '<a:buFont typeface="Wingdings" pitchFamily="2" charset="2"/><a:buChar char="§"/>';
  else ppr += '<a:buNone/>';
  ppr += '</a:pPr>';
  const runs = (Array.isArray(text) ? text : [[text, {}]]).map(([t, ro]) => '<a:r>' + rPrX(Object.assign({}, o, ro)) + '<a:t>' + esc(t) + '</a:t></a:r>').join('');
  return '<a:p>' + ppr + runs + '<a:endParaRPr lang="ar-KW" sz="' + (o.sz || 1100) + '" dirty="0"><a:solidFill><a:srgbClr val="' + (o.c || '000000') + '"/></a:solidFill><a:latin typeface="UULA Sans"/><a:cs typeface="UULA Sans"/></a:endParaRPr></a:p>';
}
function txX(name, x, y, w, h, paras, o) {
  o = o || {};
  const ins = o.ins || [0, 0, 0, 0];
  return '<p:sp><p:nvSpPr><p:cNvPr id="' + nid() + '" name="' + esc(name) + '"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="' + Math.round(x) + '" y="' + Math.round(y) + '"/><a:ext cx="' + Math.round(w) + '" cy="' + Math.round(h) + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>'
    + '<p:txBody><a:bodyPr wrap="' + (o.wrap || 'square') + '" lIns="' + ins[0] + '" tIns="' + ins[1] + '" rIns="' + ins[2] + '" bIns="' + ins[3] + '" rtlCol="0" anchor="' + (o.anchor || 't') + '">' + (o.noFit ? '<a:noAutofit/>' : '<a:spAutoFit/>') + '</a:bodyPr><a:lstStyle/>' + paras + '</p:txBody></p:sp>';
}
function boxX(name, y, h, fill, W) {
  return '<p:sp><p:nvSpPr><p:cNvPr id="' + nid() + '" name="UULA ' + esc(name) + ' Container"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="0" y="' + Math.round(y) + '"/><a:ext cx="' + W + '" cy="' + Math.round(h) + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="' + fill + '"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:endParaRPr lang="ar-KW" dirty="0"/></a:p></p:txBody></p:sp>';
}
function gradBoxX(name, y, h, W) {
  return '<p:sp><p:nvSpPr><p:cNvPr id="' + nid() + '" name="UULA ' + esc(name) + ' Container"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="0" y="' + Math.round(y) + '"/><a:ext cx="' + W + '" cy="' + Math.round(h) + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:gradFill flip="none" rotWithShape="1"><a:gsLst><a:gs pos="0"><a:srgbClr val="F2F2F2"/></a:gs><a:gs pos="100000"><a:srgbClr val="EBE6FE"/></a:gs></a:gsLst><a:path path="circle"><a:fillToRect l="50000" t="50000" r="50000" b="50000"/></a:path><a:tileRect/></a:gradFill><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:endParaRPr lang="ar-KW" dirty="0"/></a:p></p:txBody></p:sp>';
}
function picX(name, rId, x, y, w, h, o) {
  o = o || {};
  return '<p:pic><p:nvPicPr><p:cNvPr id="' + nid() + '" name="' + esc(name) + '"' + (o.descr ? ' descr="' + esc(o.descr) + '"' : '') + '>' + (o.link ? '<a:hlinkClick r:id="' + o.link + '"/>' : '') + '</p:cNvPr><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="' + rId + '"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="' + Math.round(x) + '" y="' + Math.round(y) + '"/><a:ext cx="' + Math.round(w) + '" cy="' + Math.round(h) + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom>' + (o.border ? '<a:ln w="6350"><a:solidFill><a:srgbClr val="D9D9D9"/></a:solidFill></a:ln>' : '') + '</p:spPr></p:pic>';
}
function pillX(term, x, y, w) {
  return '<p:sp><p:nvSpPr><p:cNvPr id="' + nid() + '" name="UULA Definition Pill"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="' + Math.round(x) + '" y="' + Math.round(y) + '"/><a:ext cx="' + Math.round(w) + '" cy="254000"/></a:xfrm><a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 50000"/></a:avLst></a:prstGeom><a:solidFill><a:srgbClr val="1F71DC"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr wrap="none" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0" anchor="ctr"><a:noAutofit/></a:bodyPr><a:lstStyle/>'
    + pX(term, { algn: 'ctr', b: 1, c: 'FFFFFF' }) + '</p:txBody></p:sp>';
}
const pillW = term => Math.max(75.6, term.length * 6 + 24) * PT;
function lineX(x, y, h, color) {
  return '<p:cxnSp><p:nvCxnSpPr><p:cNvPr id="' + nid() + '" name="UULA Container Line"/><p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr><p:spPr><a:xfrm><a:off x="' + Math.round(x) + '" y="' + Math.round(y) + '"/><a:ext cx="0" cy="' + Math.round(h) + '"/></a:xfrm><a:prstGeom prst="line"><a:avLst/></a:prstGeom><a:ln w="29210"><a:solidFill><a:srgbClr val="' + color + '"/></a:solidFill></a:ln></p:spPr></p:cxnSp>';
}
function tableX(rows, W, o) {
  o = o || {};
  const CW = W - 2 * M, n = rows[0].length;
  const ws = o.widths ? o.widths.map(f => Math.round(f * CW)) : Array.from({ length: n }, () => Math.floor(CW / n));
  ws[n - 1] = CW - ws.slice(0, n - 1).reduce((a, b) => a + b, 0);
  const cell = (t, fill, b, c) => '<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>' + pX(t, { algn: 'ctr', b, c: c || '000000', ar: AR.test(t) || !t }) + '</a:txBody><a:tcPr marL="72000" marR="72000" marT="0" marB="0" anchor="ctr">'
    + ['lnL', 'lnR', 'lnT', 'lnB'].map(k => '<a:' + k + ' w="6350"><a:solidFill><a:srgbClr val="D9D9D9"/></a:solidFill></a:' + k + '>').join('')
    + '<a:solidFill><a:srgbClr val="' + fill + '"/></a:solidFill></a:tcPr></a:tc>';
  const trs = rows.map((r, ri) => '<a:tr h="254000">' + r.map((t, ci) => {
    if (o.sol) return ri === 0 ? cell(t, ci === n - 1 ? C.head : C.head, 1) : cell(t, ci === n - 1 ? C.mainCol : 'FFFFFF', ci === n - 1 ? 1 : 0, ci === n - 1 ? '000000' : C.answer);
    if (ri === 0) return cell(t, C.head, 1);
    if (o.mainCol && ci === n - 1) return cell(t, C.mainCol, 1);
    return cell(t, ri % 2 ? 'FFFFFF' : C.alt, 0);
  }).join('') + '</a:tr>').join('');
  return '<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="' + nid() + '" name="' + (o.name || 'UULA Table') + '"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="' + M + '" y="' + Math.round(o.y || 0) + '"/><a:ext cx="' + CW + '" cy="' + rows.length * 254000 + '"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr firstRow="1"/><a:tblGrid>'
    + ws.map(w => '<a:gridCol w="' + w + '"/>').join('') + '</a:tblGrid>' + trs + '</a:tbl></a:graphicData></a:graphic></p:graphicFrame>';
}
// the footer (only when the slide's master is not a UULA master)
function yearText(now) {
  const d = now || new Date();
  const Y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1;
  return (Y + 1) + ' — ' + Y;
}
function footerX(W, H, rels, opt) {
  const fy = H - 499863, gray = 'A6A6A6';
  let x = '';
  if (opt.watermark) {
    // two-part UULA watermark as in the reference layout (light gray)
    x += picX('UULA Watermark Logo', rels.image('wm1'), 1110043 + 807934, 2690083, 3012000, 2635000);
    x += picX('UULA Watermark Text', rels.image('wm2'), 1110043, 2690083 + 3485000, 4637914, 840000);
  }
  x += picX('UULA Footer Logo', rels.image('logo'), 416175, fy, 358657, 358657);
  x += txX('UULA Footer Site', 883108, fy + 50820, 1100000, 230832, '<a:p><a:pPr algn="l" rtl="0"><a:buNone/></a:pPr><a:r><a:rPr lang="en-US" sz="900" b="0"><a:solidFill><a:srgbClr val="' + gray + '"/></a:solidFill><a:latin typeface="Nasalization Rg"/><a:cs typeface="UULA Sans"/></a:rPr><a:t>U U L A . C O M</a:t></a:r></a:p>', { wrap: 'none', anchor: 'ctr', noFit: true });
  x += txX('UULA Footer Rights', 885489, fy + 196471, 900000, 169277, '<a:p><a:pPr algn="l" rtl="0"><a:buNone/></a:pPr><a:r><a:rPr lang="ar-KW" sz="500" b="1"><a:solidFill><a:srgbClr val="' + gray + '"/></a:solidFill><a:latin typeface="Avenir Next Arabic"/><a:cs typeface="Avenir Next Arabic"/></a:rPr><a:t>© جـــــمـــيـــع الـــحـــقـــوق مـــحـفـــوظـــة</a:t></a:r></a:p>', { wrap: 'none', anchor: 'ctr', noFit: true });
  x += txX('UULA Footer Year', W - 460381 - 900000, fy + 94811, 900000, 261610, '<a:p><a:pPr algn="r" rtl="0"><a:buNone/></a:pPr><a:r><a:rPr lang="en-US" sz="1100"><a:solidFill><a:srgbClr val="' + gray + '"/></a:solidFill><a:latin typeface="UULA Sans Medium"/><a:cs typeface="UULA Sans Medium"/></a:rPr><a:t>' + yearText(opt.now) + '</a:t></a:r></a:p>', { wrap: 'none', anchor: 'ctr', noFit: true });
  return x;
}
function pageNumX(W, H, n) {
  return txX('CustomPageNumber_' + n, Math.round(W / 2 - 25 * PT), H - Math.round(34.5 * PT), 50 * PT, Math.round(20.6 * PT),
    '<a:p><a:pPr algn="ctr" rtl="0"><a:buNone/></a:pPr><a:r><a:rPr lang="en-US" sz="1100" dirty="0"><a:solidFill><a:srgbClr val="A6A6A6"/></a:solidFill><a:latin typeface="UULA Sans"/><a:cs typeface="UULA Sans"/></a:rPr><a:t>' + n + '</a:t></a:r></a:p>', { anchor: 'ctr', noFit: true });
}

// ---------- text height estimate (refined later with the real heights) ----------
function estimateText(c, widthEmu) {
  const tb = kid(c, 'txBody', 'p'); if (!tb) return ROW;
  const bp = kid(tb, 'bodyPr', 'a');
  const ins = bp ? (+(bp.getAttribute('tIns') || 45720) + +(bp.getAttribute('bIns') || 45720)) : 0;
  let h = 0;
  for (const p of kids(tb, 'p', 'a')) {
    const sz = (runSz(p) || 1100) / 100;
    const pPr = kid(p, 'pPr', 'a');
    const marL = pPr ? Math.max(0, +(pPr.getAttribute('marL') || 0)) : 0;
    const t = paraText(p);
    const mathCount = desc(p, 'm', 'oMath').length + desc(p, 'm', 'f').length * 2;
    const avail = Math.max(PT * 20, widthEmu - marL) / PT;
    const lines = Math.max(1, Math.ceil(t.length * sz * 0.5 / avail));
    h += lines * sz * 1.21 * PT + (mathCount ? Math.min(mathCount, 3) * 4 * PT : 0);
  }
  return Math.max(ROW, Math.round(h + ins));
}

// ---------- restyle ----------
// opts: { pageNum, watermark, now, newIds }
function restyle(pkg, opts) {
  opts = opts || {};
  const W = pkg.slideW, H = pkg.slideH, CW = W - 2 * M;
  const doc = parseXml(pkg.files.slide);
  const ctx = { scheme: readTheme(pkg.files) };
  const rels = makeRels(pkg);
  NEXT = maxId(doc) + 1;
  const report = { boxes: 0, tables: 0, qr: 0, links: [], linkFail: [], dropped: 0, questions: 0 };
  const items = analyze(doc, pkg, ctx);
  // the usual body size on this slide (topics are bigger than it)
  const szCount = {};
  for (const t of items) if (t.kind === 'text' && !t.drop) for (const p of desc(t.c, 'a', 'p')) { const z = runSz(p) || 1800; szCount[z] = (szCount[z] || 0) + paraText(p).length; }
  ctx.bodySz = +Object.entries(szCount).sort((a, b) => b[1] - a[1]).map(e => e[0])[0] || 1100;
  headerRoles(items, pkg);
  for (const t of items) if (t.pinText) t.role = t.pinText === 'bullets' ? 'body' : t.pinText;
  const spTree = spTreeOf(doc);

  // 1) replace an old QR with a new one parked outside the slide (+ its link box)
  const newQr = items.filter(t => t.drop === 'offpic');
  const linkBox = items.find(t => t.drop === 'link');
  if (newQr.length) {
    const nq = newQr[0];
    const old = items.filter(t => t.kind === 'qr').sort((a, b) => Math.abs(a.g.y - nq.g.y) - Math.abs(b.g.y - nq.g.y))[0];
    if (linkBox) {
      const url = linkBox.text.replace(/\s+/g, '');
      try {
        const id = rels.link(/^www\./i.test(url) ? 'https://' + url : url);
        const cnv = cnvOf(nq.c); for (const h of kids(cnv, 'hlinkClick', 'a')) cnv.removeChild(h);
        const h = frag(doc, '<a:hlinkClick r:id="' + id + '"/>'); cnv.insertBefore(h, cnv.firstChild);
        report.links.push(url);
      } catch (e) { report.linkFail.push(url); }
    }
    const ratio = nq.g.w ? nq.g.h / nq.g.w : 1;
    const w = old ? old.g.w : 513080;
    nq.g = { x: old ? old.g.x : M, y: old ? old.g.y : nq.g.y, w, h: Math.round(w * ratio) };
    const xf = xfrmOf(nq.c); if (xf) { xf.removeAttribute('rot'); xf.removeAttribute('flipH'); xf.removeAttribute('flipV'); }
    setGeom(nq.el, nq.g);
    nq.drop = null; nq.kind = 'qr'; nq.off = false; nq.box = old ? old.box : null;
    if (old) { spTree.insertBefore(nq.el, old.el); old.drop = 'replaced'; nq.i = old.i; }
    report.qr++;
  }

  // 2) remove decoration, old footers and page numbers (links outside the slide stay)
  for (const t of items) {
    if (!t.drop || t.drop === 'link' || t.drop === 'off' || t.drop === 'offpic' || t.drop === 'keepbg') continue;
    if (t.el.parentNode) t.el.parentNode.removeChild(t.el);
    if (t.drop === 'decor' || t.drop === 'replaced') report.dropped++;
  }
  const live = items.filter(t => !t.drop);

  // a table becomes full width only when nothing sits beside it
  for (const t of live.filter(x => x.kind === 'table')) {
    const g = t.g;
    t.fullW = !live.some(o => o !== t && !o.drop && o.kind !== 'card' && !o.boxText && o.box === t.box && o.kind !== 'line'
      && Math.min(o.g.y + o.g.h, g.y + g.h) - Math.max(o.g.y, g.y) > Math.min(o.g.h, g.h) * 0.3
      && (o.g.x + o.g.w <= g.x + 2 * PT || o.g.x >= g.x + g.w - 2 * PT));
  }
  // 3) style each item
  for (const t of live) {
    if (t.kind === 'text' || (t.kind === 'chip')) {
      if (t.kind === 'chip') { fontOnly(t.c); continue; }
      const forced = t.pinText || (t.pinBox ? 'body' : null) || (t.role === 'lesson' || t.role === 'chapter' ? t.role : null);
      const r = styleText(t, ctx, pkg, forced);
      t.roles = r.roles;
      if (forced) t.role = forced === 'bullets' ? 'body' : forced;
      if (!forced) {
        const rs = r.roles.filter((x, k) => t.paraTexts ? t.paraTexts[k] : true);
        const firstR = rs[0] || 'body';
        t.role = rs.every(x => x === firstR) ? firstR : (firstR === 'qhead' && rs.includes('question') ? 'qhead' : firstR);
      }
      report.questions += r.roles.filter(x => x === 'question').length;
      setBody(t.c, { ins: t.boxText ? [M, ROW, M, 2 * ROW] : null });
      plainShape(t.c, !!t.boxText);
    } else if (t.kind === 'table') { styleTable(t, ctx, W); report.tables++; }
    else if (t.kind === 'pic' || t.kind === 'qr' || t.kind === 'icon') stylePic(t, !!t.box || t.kind !== 'pic');
    else if (t.kind === 'group') { fontOnly(t.c); for (const p of desc(t.c, 'p', 'pic')) { const spPr = kid(p, 'spPr', 'p'); removeKids(spPr, ['effectLst']); } }
    else if (t.kind === 'shape' || t.kind === 'line') { const spPr = kid(t.c, 'spPr', 'p'); removeKids(spPr, ['effectLst', 'effectDag', 'scene3d', 'sp3d']); }
  }
  // old box icons (book / bulb …) inside cards are replaced by ours
  for (const t of live) if (t.box && (t.kind === 'icon' || (t.kind === 'line' && t.g.w < 3 * PT && t.g.x > W * 0.8))) { t.el.parentNode && t.el.parentNode.removeChild(t.el); t.drop = 'icon'; }
  blackCircles(spTree);

  // 4) definition pills: "تعريف: …" → pill + text
  const extra = [];
  for (const t of live.filter(x => !x.drop && x.kind === 'text' && x.role === 'body' && !x.boxText)) {
    const ps = kids(kid(t.c, 'txBody', 'p'), 'p', 'a').filter(p => paraText(p).trim());
    if (!ps.length) continue;
    const t0 = desc(ps[0], 'a', 't')[0]; if (!t0) continue;
    const m = paraText(ps[0]).match(PILL);
    if (!m || !t0.textContent.startsWith(m[0].slice(0, Math.min(m[0].length, t0.textContent.length))) || t0.textContent.length < m[0].trim().length) continue;
    const term = m[1].trim();
    t0.textContent = t0.textContent.slice(Math.min(t0.textContent.length, m[0].length)).replace(/^\s+/, '');
    t.pill = { term, w: pillW(term) };
  }

  // 5) containers (a free text starting with ملاحظة / نشاط / قال تعالى … gets its own container)
  for (const t of live.filter(x => !x.drop && x.kind === 'text' && !x.box && !x.boxText && !['lesson', 'chapter'].includes(x.role))) {
    const s0 = t.text.trim().slice(0, 50);
    let type = t.pinBox || null;
    if (type) { /* pinned by the user */ }
    else if (KW.activity.test(s0)) type = 'activity';
    else if (/^\s*(ملاحظة|ملاحظه|تنبيه|انتبه|تذكّر|تذكر|هام|مهم|Note|Important|Remember)/i.test(s0)) type = 'note';
    else if (/^\s*(إثراء|اثراء|تحدي|فكّر|سؤال ذكاء|أسئلة من المريخ)/.test(s0)) type = 'mars';
    else if (/^\s*(قال تعالى|قال رسول الله|قال الشاعر|﴿)/.test(s0)) type = 'quote';
    if (!type) continue;
    const el = frag(doc, boxX(BOX[type].name, t.g.y, t.g.h, BOX[type].fill, W));
    spTree.insertBefore(el, kid(spTree, 'grpSpPr', 'p').nextSibling);
    const v = { kind: 'card', virtual: true, el, c: el, g: { x: 0, y: t.g.y, w: W, h: t.g.h }, fill: BOX[type].fill, text: '', forced: type };
    t.box = v; live.push(v);
  }
  const cards = live.filter(t => !t.drop && (t.kind === 'card' || t.boxText));
  for (const k of cards) {
    const members = live.filter(t => t.box === k && !t.drop);
    k.type = k.forced || boxType(k, members);
    const B = BOX[k.type];
    report.boxes++;
    if (k.kind === 'card') {
      // the card itself becomes the container: full width, square corners, our fill, at the back
      const c = k.c;
      const spPr = kid(c, 'spPr', 'p');
      const geo = kid(spPr, 'prstGeom', 'a') || kid(spPr, 'custGeom', 'a');
      if (geo) spPr.removeChild(geo);
      placeChild(spPr, frag(doc, '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'), SPPR_ORDER);
      removeKids(spPr, [...FILLS, 'ln', 'effectLst', 'effectDag', 'scene3d', 'sp3d']);
      if (k.type === 'practice') placeChild(spPr, frag(doc, '<a:gradFill flip="none" rotWithShape="1"><a:gsLst><a:gs pos="0"><a:srgbClr val="F2F2F2"/></a:gs><a:gs pos="100000"><a:srgbClr val="EBE6FE"/></a:gs></a:gsLst><a:path path="circle"><a:fillToRect l="50000" t="50000" r="50000" b="50000"/></a:path><a:tileRect/></a:gradFill>'), SPPR_ORDER);
      else placeChild(spPr, solid(doc, B.fill), SPPR_ORDER);
      placeChild(spPr, frag(doc, '<a:ln><a:noFill/></a:ln>'), SPPR_ORDER);
      const st = kid(c, 'style', 'p'); if (st) c.removeChild(st);
      const cnv = cnvOf(c); if (cnv) cnv.setAttribute('name', 'UULA ' + B.name + ' Container');
      spTree.insertBefore(k.el, kid(spTree, 'grpSpPr', 'p').nextSibling);
    } else {
      const spPr = kid(k.c, 'spPr', 'p');
      const geo = kid(spPr, 'prstGeom', 'a') || kid(spPr, 'custGeom', 'a');
      if (geo) spPr.removeChild(geo);
      placeChild(spPr, frag(doc, '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'), SPPR_ORDER);
      removeKids(spPr, [...FILLS, 'ln', 'effectLst']);
      placeChild(spPr, solid(doc, B.fill), SPPR_ORDER);
      placeChild(spPr, frag(doc, '<a:ln><a:noFill/></a:ln>'), SPPR_ORDER);
      spTree.insertBefore(k.el, kid(spTree, 'grpSpPr', 'p').nextSibling);
    }
    if (B.icon) {
      const ic = frag(doc, picX('UULA ' + B.name + ' Icon', rels.image(B.icon), 0, 0, (B.icon === 'bulb' ? 11.1 : 14.1) * PT, (B.icon === 'bulb' ? 15.4 : 15.9) * PT));
      spTree.appendChild(ic);
      k.iconEl = ic;
      if (B.line) { const ln = frag(doc, lineX(0, 0, ROW, B.line)); spTree.appendChild(ln); k.lineEl = ln; }
    }
  }

  // 6) pills become shapes now (they need ids after the containers)
  for (const t of live.filter(x => x.pill)) {
    const el = frag(doc, pillX(t.pill.term, 0, 0, t.pill.w));
    t.el.parentNode.insertBefore(el, t.el.nextSibling);
    t.pill.el = el;
  }

  // 7) the background, watermark and footer come from the slide layout: left alone here
  const root = doc.documentElement;
  if (opts.pageNum != null) spTree.appendChild(frag(doc, pageNumX(W, H, opts.pageNum)));
  // animations point at shapes that may be gone
  for (const tm of kids(root, 'timing', 'p')) root.removeChild(tm);

  // 8) layout plan (text boxes count by the height of their text, not of an oversized box)
  for (const t of live) if (!t.drop && t.kind === 'text' && !t.boxText && !t.nogeom) t.g = Object.assign({}, t.g, { h: Math.min(t.g.h, estimateText(t.c, t.g.w)) });
  const plan = buildPlan(doc, live.filter(t => !t.drop), cards, pkg);
  applyLayout(doc, plan, layout(plan, null, pkg), pkg);
  markNames(doc);
  report.items = live.length;
  return { xml: serialize(doc), rels, plan, report, doc };
}

// ---------- layout ----------
// The plan lists blocks from top to bottom. A block is a container (with rows inside) or a row.
// A row holds items side by side; inside a row, items that overlap horizontally form a column stacked top-down.
function buildPlan(doc, live, cards, pkg) {
  const W = pkg.slideW, H = pkg.slideH, CW = W - 2 * M;
  const order = topItems(doc);
  const idxOf = el => order.indexOf(el);
  const flow = live.filter(t => !(t.kind === 'card' || t.boxText) && !t.box && !t.drop);
  const header = flow.filter(t => t.role === 'chapter' || t.role === 'lesson');
  const free = flow.filter(t => !header.includes(t));
  const units = [];
  for (const k of cards) {
    const members = live.filter(t => t.box === k && !t.drop);
    units.push({ box: k, y: k.g.y, members });
  }
  for (const t of free) units.push({ item: t, y: t.g.y });
  units.sort((a, b) => a.y - b.y);
  // rows: free items that overlap vertically (a container is always its own block)
  const blocks = [];
  let cur = null;
  const ov = (a, b) => Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  for (const u of units) {
    if (u.box) { cur = null; blocks.push({ type: 'box', box: u.box, rows: makeRows(u.members, u.box) }); continue; }
    const g = u.item.g;
    if (cur && ov(cur.span, g) > Math.min(g.h, cur.span.h) * 0.3 && u.item.kind !== 'line') {
      cur.items.push(u.item);
      const y0 = Math.min(cur.span.y, g.y), y1 = Math.max(cur.span.y + cur.span.h, g.y + g.h); cur.span = { y: y0, h: y1 - y0 };
    } else if (u.item.kind === 'line' && cur && g.y < cur.span.y + cur.span.h) {
      cur.items.push(u.item);
    } else { cur = { type: 'row', items: [u.item], span: { y: g.y, h: g.h } }; blocks.push(cur); }
  }
  for (const b of blocks) if (b.type === 'row') b.cols = makeCols(b.items);
  // a question with one figure (graph / picture) and its texts / tables: the figure on the left,
  // the question and everything belonging to it stacked on the right — whatever the current positions are
  const isFig = t => (t.kind === 'pic' || t.kind === 'group') && t.g.w > CW * 0.25 && t.g.h > 60 * PT;
  const merged = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === 'row') {
      const figs = b.items.filter(isFig), others = b.items.filter(t => !isFig(t));
      if (figs.length === 1 && others.length && others.every(t => t.kind === 'text' || t.kind === 'table') && others.some(t => t.role === 'question')) {
        const stack = [...others];
        while (i + 1 < blocks.length && blocks[i + 1].type === 'row' && blocks[i + 1].items.every(t => t.kind === 'table' || (t.kind === 'text' && ['answer', 'choice'].includes(t.role)))) { stack.push(...blocks[i + 1].items); i++; }
        // order: the question, short lines (the equation), tables, then longer texts
        const rank = t => t.role === 'question' ? 0 : t.kind === 'table' ? 2 : (kids(kid(t.c, 'txBody', 'p'), 'p', 'a').filter(p => paraText(p).trim()).length <= 1 ? 1 : 3);
        stack.sort((a, c) => rank(a) - rank(c) || a.g.y - c.g.y || (c.g.x + c.g.w) - (a.g.x + a.g.w));
        const qi = stack.findIndex(t => t.role === 'question'); if (qi > 0) stack.unshift(stack.splice(qi, 1)[0]);
        const fig = figs[0];
        const figW = Math.min(fig.g.w, Math.round(CW * 0.5));
        const colW = CW - figW - 18 * PT;
        // tables take the width of the right column
        for (const t of stack.filter(x => x.kind === 'table')) {
          const tbl = desc(t.c, 'a', 'tbl')[0]; if (!tbl) continue;
          const grid = kids(kid(tbl, 'tblGrid', 'a'), 'gridCol', 'a');
          const tot = grid.reduce((a, g) => a + (+g.getAttribute('w') || 0), 0) || 1;
          let acc = 0;
          grid.forEach((g, k) => { const w = k === grid.length - 1 ? colW - acc : Math.round((+g.getAttribute('w') || 0) * colW / tot); acc += w; g.setAttribute('w', String(w)); });
          t.g = Object.assign({}, t.g, { w: colW });
        }
        merged.push({ type: 'row', items: [fig, ...stack], cols: [[fig], stack], unit: { figW } });
        continue;
      }
    }
    merged.push(b);
  }
  blocks.length = 0; blocks.push(...merged);
  const mapItem = t => ({
    idx: idxOf(t.el), kind: t.kind, role: t.role || null, roles: t.roles || null,
    g0: t.g, text: t.text ? t.text.slice(0, 40) : '', est: 0, inBox: !!t.box, fullW: !!t.fullW,
    pill: t.pill ? { idx: idxOf(t.pill.el), w: t.pill.w } : null,
    paras: t.kind === 'text' ? kids(kid(t.c, 'txBody', 'p'), 'p', 'a').map(p => { const pPr = kid(p, 'pPr', 'a'); return [paraText(p).length, (runSz(p) || 1100) / 100, pPr ? Math.max(0, +(pPr.getAttribute('marL') || 0)) : 0, desc(p, 'm', 'oMath').length + desc(p, 'm', 'f').length * 2]; }) : null
  });
  const plan = {
    W, H, header: header.sort((a, b) => a.g.y - b.g.y).map(mapItem),
    blocks: blocks.map(b => b.type === 'box'
      ? { type: 'box', idx: idxOf(b.box.el), boxType: b.box.type, textBox: !!b.box.boxText, icon: b.box.iconEl ? idxOf(b.box.iconEl) : -1, line: b.box.lineEl ? idxOf(b.box.lineEl) : -1,
        hasQr: b.rows.some(r => r.items.some(t => t.kind === 'qr')),
        rows: b.rows.map(r => ({ cols: makeCols(r.items).map(c => c.map(mapItem)) })) }
      : { type: 'row', cols: b.cols.map(c => c.map(mapItem)), unit: b.unit || null })
  };
  // estimated heights (for text) so the first layout is close
  const els = order;
  const each = f => { plan.header.forEach(f); plan.blocks.forEach(b => (b.type === 'box' ? b.rows : [b]).forEach(r => r.cols.forEach(c => c.forEach(f)))); };
  each(it => {
    const el = els[it.idx]; const c = el && core(el);
    it.est = it.kind === 'text' ? 0 : it.g0.h;
    it._c = c;
  });
  return plan;
}
function makeRows(items) {
  const rows = [];
  const s = [...items].sort((a, b) => a.g.y - b.g.y);
  let cur = null;
  for (const t of s) {
    const g = t.g;
    if (cur && Math.min(cur.y1, g.y + g.h) - Math.max(cur.y0, g.y) > Math.min(g.h, cur.y1 - cur.y0) * 0.3) { cur.items.push(t); cur.y0 = Math.min(cur.y0, g.y); cur.y1 = Math.max(cur.y1, g.y + g.h); }
    else { cur = { items: [t], y0: g.y, y1: g.y + g.h }; rows.push(cur); }
  }
  return rows;
}
function makeCols(items) {
  // columns: items overlapping horizontally (transitively); ordered right-to-left
  const cols = [];
  for (const t of [...items].sort((a, b) => a.g.y - b.g.y)) {
    const hit = cols.find(c => c.some(u => Math.min(u.g.x + u.g.w, t.g.x + t.g.w) - Math.max(u.g.x, t.g.x) > Math.min(u.g.w, t.g.w) * 0.25));
    if (hit) hit.push(t); else cols.push([t]);
  }
  return cols.sort((a, b) => Math.max(...b.map(t => t.g.x + t.g.w)) - Math.max(...a.map(t => t.g.x + t.g.w)));
}
// gap (in rows) before an item, from the roles
function gapBefore(prev, it) {
  if (!prev) return 1;
  const pr = prev.role, r = it.role;
  if ((r === 'answer' || r === 'choice') && (pr === 'question' || pr === 'answer' || pr === 'choice')) return 0;
  if (r === 'question' && (pr === 'answer' || pr === 'choice' || pr === 'question')) return 1;
  // the skill: 3 lines between unrelated parts — a new topic, or a question (group) after an explanation
  if (r === 'topic' && pr !== 'lesson' && pr !== 'chapter') return 3;
  if ((r === 'question' || r === 'qhead') && (pr === 'body' || pr === 'bullets' || pr === 'source')) return 3;
  return 1;
}
// heights: map idx -> real height (EMU) from PowerPoint; null = estimate
// returns positions for every idx + container rects + overflow info
function layout(plan, heights, pkg) {
  const a = layoutPass(plan, heights, 'rule');
  if (a.overflow < 0) return a;
  const b = layoutPass(plan, heights, 'tight');
  return b.bottom < a.bottom ? b : a;
}
// mode 'rule': the gaps of the design system (1 line, 3 lines, 0 between a question and its answer)
// mode 'tight': the original gaps rounded to the grid, never more than the rule (to save a page)
function layoutPass(plan, heights, mode) {
  const W = plan.W, H = plan.H, CW = W - 2 * M, LIMIT = H - FOOT;
  const pos = {};
  const hOf = (it, w) => (heights && heights[it.idx] != null) ? heights[it.idx] : it.kind === 'text' ? estParas(it.paras, w || CW) : it.g0.h;
  const ch = plan.header.find(i => i.role === 'chapter'), le = plan.header.find(i => i.role === 'lesson');
  let afterHeader = null;
  if (ch) { pos[ch.idx] = { x: M, y: Y0, w: CW }; afterHeader = Y0 + hOf(ch); }
  if (le) { const ly = ch ? Y0 + 3 * G : Y0; pos[le.idx] = { x: M, y: Math.round(ly), w: CW }; afterHeader = ly + hOf(le); }
  for (const h of plan.header) if (h !== ch && h !== le) { const yy = afterHeader || 22.6 * PT; pos[h.idx] = { x: M, y: Math.round(yy), w: CW }; afterHeader = yy + hOf(h); }
  const snap = d => Math.max(0, Math.round(d / ROW));
  const gapRows = (prev, it, origGap) => {
    const rule = gapBefore(prev, it);
    if (mode !== 'tight' || origGap == null) return rule;
    return Math.min(rule, snap(origGap));
  };
  const allOf = cols => cols.flat();
  const top0 = items => Math.min(...items.map(i => i.g0.y));
  const bot0 = items => Math.max(...items.map(i => i.g0.y + i.g0.h));
  const firstOf = items => [...items].sort((a, b) => a.g0.y - b.g0.y || (b.g0.x + b.g0.w) - (a.g0.x + a.g0.w))[0];
  const lastOf = items => [...items].sort((a, b) => (b.g0.y + b.g0.h) - (a.g0.y + a.g0.h))[0];
  const TEXTY = ['question', 'answer', 'body', 'topic', 'qhead', 'choice', 'source'];
  // place one row (columns side by side) with its top at `top` inside [x0, x1]; returns the bottom
  function placeRow(cols, top, x0, x1) {
    const items = allOf(cols);
    const rt = top0(items);
    const minX = Math.min(...items.map(i => i.g0.x)), maxX = Math.max(...items.map(i => i.g0.x + i.g0.w));
    const span = Math.max(1, maxX - minX);
    const k = Math.min(1, (x1 - x0) / span);
    const inside = minX >= x0 - 2 * PT && maxX <= x1 + 2 * PT;
    const single = items.length === 1 || cols.length === 1;
    let rb = top;
    const hasQr = items.some(i => i.kind === 'qr');
    const placed = [];
    for (const it of [...items].sort((a, b) => a.g0.y - b.g0.y)) {
      let x, w;
      const wide = (it.kind === 'table' && it.fullW) || (it.kind === 'text' && (it.g0.w > W * 0.45 || (single && TEXTY.includes(it.role))));
      if (wide && cols.length === 1) { x = x0; w = x1 - x0; }
      else if (inside) { x = Math.max(x0, it.g0.x); w = Math.min(it.g0.w, x1 - x); }
      else { w = Math.round(it.g0.w * k); x = Math.round(x1 - (maxX - it.g0.x - it.g0.w) * k - w); x = Math.max(x0, Math.min(x, x1 - w)); }
      if (it.kind === 'table' && it.fullW) { x = x0; w = x1 - x0; }
      if (it.kind === 'table' && !it.fullW) { w = it.g0.w; x = Math.max(x0, Math.min(inside ? it.g0.x : x, x1 - w)); }
      if (it.kind === 'qr') { x = x0; w = it.g0.w; }
      // edges on the page guides
      if (!wide && it.kind === 'text') { const l = snapX(x), r = snapX(x + w); if (r - l > 20 * PT) { x = l; w = r - l; } }
      else if (!wide && it.kind !== 'qr' && it.kind !== 'line') { const l = snapX(x); if (l + w <= x1 + 2 * PT) x = l; }
      let y = snapUp(top + (it.g0.y - rt));
      // keep clear of what was above it (and overlaps it horizontally): text may have grown
      for (const q of placed) {
        const above = q.it.g0.y + q.it.g0.h <= it.g0.y + 3 * PT;
        const hov = Math.min(q.it.g0.x + q.it.g0.w, it.g0.x + it.g0.w) - Math.max(q.it.g0.x, it.g0.x);
        if (!above || hov <= Math.min(q.it.g0.w, it.g0.w) * 0.1) continue;
        const og = it.g0.y - (q.it.g0.y + q.it.g0.h);
        const need = (q.it.role === 'question' && (it.role === 'answer' || it.role === 'choice')) ? 0 : Math.max(0, Math.min(og, ROW));
        y = Math.max(y, snapUp(q.bottom) + (need > 0 ? ROW : 0));
      }
      let bottomNow;
      if (it.pill) {
        const pw = it.pill.w, long = pw > (x1 - x0) / 3;
        pos[it.pill.idx] = { x: x + w - pw, y: Math.round(y), w: pw, h: 254000 };
        if (long) pos[it.idx] = { x, y: Math.round(y + 254000 + 4 * PT), w };
        else pos[it.idx] = { x, y: Math.round(y + 1.5 * PT), w: Math.max(40 * PT, w - pw - 8 * PT) };
        bottomNow = y + Math.max(254000, (long ? 254000 + 4 * PT : 1.5 * PT) + hOf(it, pos[it.idx].w));
      } else {
        const p = { x: Math.round(x), y: Math.round(y), w: Math.round(w) };
        if (['pic', 'group', 'qr', 'icon', 'object', 'chip', 'shape', 'ink'].includes(it.kind)) p.h = Math.round(it.g0.h * (w / (it.g0.w || w)));
        if (it.kind === 'line') { p.w = Math.round(it.g0.w * (inside ? 1 : k)); p.h = it.g0.h; }
        pos[it.idx] = p;
        bottomNow = y + (it.kind === 'text' ? hOf(it, p.w) : it.kind === 'table' ? hOf(it) : (p.h != null ? p.h : hOf(it)));
      }
      placed.push({ it, bottom: bottomNow, h: bottomNow - y });
      rb = Math.max(rb, bottomNow);
    }
    if (hasQr) shiftForQr(cols, pos, x1);
    // nothing may overlap now that did not overlap before: move the lower one down
    const R = q => { const p = pos[q.it.idx]; const pp = q.it.pill ? pos[q.it.pill.idx] : null;
      const x = pp ? Math.min(p.x, pp.x) : p.x, r = pp ? Math.max(p.x + p.w, pp.x + pp.w) : p.x + p.w;
      const y = pp ? Math.min(p.y, pp.y) : p.y; return { x, y, w: r - x, h: q.h }; };
    const hit = (a, b, tol) => a.x < b.x + b.w - tol && b.x < a.x + a.w - tol && a.y < b.y + b.h - tol && b.y < a.y + a.h - tol;
    for (let pass = 0; pass < 4; pass++) {
      let moved = false;
      for (let i = 1; i < placed.length; i++) for (let j = 0; j < i; j++) {
        const a = placed[j], b = placed[i];
        if (a.it.kind === 'line' || b.it.kind === 'line') continue;
        const na = R(a), nb = R(b);
        if (!hit(na, nb, PT) || hit(a.it.g0, b.it.g0, PT)) continue;
        const dy = snapUp(na.y + na.h) + ((a.it.role === 'question' && (b.it.role === 'answer' || b.it.role === 'choice')) ? 0 : ROW) - nb.y;
        if (dy <= 0) continue;
        pos[b.it.idx].y = Math.round(pos[b.it.idx].y + dy);
        if (b.it.pill) pos[b.it.pill.idx].y = Math.round(pos[b.it.pill.idx].y + dy);
        b.bottom += dy; moved = true;
      }
      if (!moved) break;
    }
    for (const q of placed) rb = Math.max(rb, q.bottom);
    return rb;
  }
  // figure on the left, the question and its parts stacked on the right
  function placeUnit(b, top) {
    const fig = b.cols[0][0], stack = b.cols[1];
    const figW = b.unit.figW, figH = Math.round(fig.g0.h * figW / (fig.g0.w || figW));
    pos[fig.idx] = { x: M, y: Math.round(top), w: figW, h: figH };
    const cx = snapX(M + figW + 18 * PT, 20), cw = W - M - cx;
    let sy = top, prev = null;
    for (const it of stack) {
      if (prev) sy = snapUp(sy) + (prev.role === 'question' && (it.role === 'answer' || it.role === 'choice') ? 0 : ROW);
      pos[it.idx] = { x: Math.round(cx), y: Math.round(sy), w: Math.round(cw) };
      sy += it.kind === 'text' ? hOf(it, cw) : hOf(it);
      prev = it;
    }
    return Math.max(top + figH, sy);
  }
  let y = afterHeader != null ? afterHeader : 0, first = true, prevItems = null, prevBox = false, bottom = afterHeader || 0;
  const rowsInfo = [];
  plan.blocks.forEach((b, bi) => {
    if (b.type === 'box') {
      const members = b.rows.flatMap(r => allOf(r.cols));
      let cTop;
      if (first) cTop = afterHeader != null ? snapUp(afterHeader) + ROW : 0;
      else cTop = snapUp(y) + ROW;
      let iy = cTop + (first && afterHeader == null ? 2 * ROW : ROW);
      const x1 = W - M - (b.icon >= 0 ? 15 * PT : 0);
      let prevR = null;
      for (const r of b.rows) {
        const its = allOf(r.cols);
        if (prevR) { const pi = allOf(prevR.cols); iy = snapUp(iy) + gapRows(lastOf(pi), firstOf(its), top0(its) - bot0(pi)) * ROW; }
        iy = placeRow(r.cols, iy, M, x1);
        prevR = r;
      }
      if (!b.rows.length) iy = cTop + ROW;
      const cBot = snapUp(iy) + (mode === 'tight' ? 1 : 2) * ROW;   // the skill: 1 line above the first item, 2 lines under the last (1 only to save a page)
      pos[b.idx] = { x: 0, y: Math.round(cTop), w: W, h: Math.round(cBot - cTop), box: true };
      if (b.icon >= 0) pos[b.icon] = { x: W - 47 * PT, y: Math.round(cTop + ROW - 2 * PT), keep: true };
      if (b.line >= 0) {
        const lines = (iy - cTop - ROW) / ROW;
        pos[b.line] = lines > 2.2 ? { x: W - 40 * PT, y: Math.round(cTop + ROW + 17 * PT), w: 0, h: Math.round(Math.max(ROW, iy - (cTop + ROW + 17 * PT))) } : { hide: true };
      }
      rowsInfo.push({ bi, top: cTop, bottom: cBot, role: 'box' });
      y = cBot; first = false; prevItems = members; prevBox = true; bottom = Math.max(bottom, y);
      return;
    }
    const its = allOf(b.cols), f = firstOf(its);
    let top;
    if (first) top = afterHeader != null ? snapUp(afterHeader) + ROW : Y0;
    else if (prevBox) top = snapUp(y) + (f && ['topic', 'question', 'qhead'].includes(f.role) && mode !== 'tight' ? 3 : 1) * ROW;
    else top = snapUp(y) + gapRows(lastOf(prevItems), f, top0(its) - bot0(prevItems)) * ROW;
    const rb = b.unit ? placeUnit(b, top) : placeRow(b.cols, top, M, W - M);
    rowsInfo.push({ bi, top, bottom: rb, role: b.unit ? 'question' : f && f.role });
    y = rb; first = false; prevItems = its; prevBox = false; bottom = Math.max(bottom, y);
  });
  let overflow = -1;
  for (const r of rowsInfo) if (r.bottom > LIMIT + PT) { overflow = r.bi; break; }
  return { pos, bottom, overflow, rowsInfo, limit: LIMIT, mode };
}
// text height from paragraph info at a given width
function estParas(paras, w) {
  if (!paras || !paras.length) return ROW;
  let h = 0;
  for (const [n, sz, marL, math] of paras) {
    const avail = Math.max(20 * PT, w - marL) / PT;
    const lines = Math.max(1, Math.ceil(n * sz * 0.47 / avail));
    h += lines * sz * 1.21 * PT + Math.min(math, 3) * 3 * PT;
  }
  return Math.max(ROW, Math.round(h));
}
// a QR at x=36: the other items of the row start at 86.5pt
function shiftForQr(cols, pos, x1) {
  const flat = cols.flat();
  const q = flat.find(i => i.kind === 'qr'); if (!q) return;
  const qx = M, qy = pos[q.idx].y;
  pos[q.idx] = Object.assign(pos[q.idx], { x: qx, w: q.g0.w, h: q.g0.h });
  for (const it of flat) {
    if (it === q || it.kind !== 'text') continue;
    const p = pos[it.idx]; if (!p) continue;
    const vo = Math.min(p.y + (it.g0.h || ROW), pos[q.idx].y + q.g0.h) - Math.max(p.y, pos[q.idx].y);
    if (vo <= 0) continue;
    const minX = Math.round(86.5 * PT);
    if (p.x < minX) { const right = p.x + p.w; p.x = minX; p.w = Math.max(30 * PT, Math.min(right, x1) - minX); }
    if (it.pill) { const pp = pos[it.pill.idx]; if (pp && pp.x < minX) pp.x = minX; }
  }
  // the QR lines up with the top of the row
  const tops = flat.filter(i => i !== q && pos[i.idx]).map(i => pos[i.idx].y);
  if (tops.length) pos[q.idx].y = Math.min(qy, ...tops);
}
function applyLayout(doc, plan, lay) {
  const order = topItems(doc);
  for (const [idx, p] of Object.entries(lay.pos)) {
    const el = order[+idx]; if (!el) continue;
    if (p.hide) { setGeom(el, { h: 0 }); continue; }   // removed by the app (indexes must not shift here)
    const g = {};
    if (p.x != null) g.x = p.x; if (p.y != null) g.y = p.y;
    if (p.w != null && !p.keep) g.w = p.w;
    if (p.h != null && !p.keep) g.h = p.h;
    const c = core(el);
    if (c.localName === 'sp' && desc(c, 'a', 'spAutoFit').length && p.h == null) {
      // text: keep a sensible height so PowerPoint draws it before autofit runs
      g.h = Math.max(ROW, estimateText(c, g.w || ROW));
    }
    if (c.localName === 'graphicFrame') { const tbl = desc(c, 'a', 'tbl')[0]; if (tbl) g.h = kids(tbl, 'tr', 'a').length * 254000; g.w = g.w; }
    setGeom(el, g);
  }
}
// every top-level shape gets " #ur<n>" at the end of its name: the app finds shapes by it, then removes it
const MARK = / #ur\d+$/;
function markNames(doc) {
  topItems(doc).forEach((el, i) => {
    for (const c of allCores(el)) { const n = cnvOf(c); if (n) n.setAttribute('name', (n.getAttribute('name') || '').replace(MARK, '') + ' #ur' + i); }
  });
}
// ---------- one object at a time ----------
// the user picks what a selected object is; its name keeps the choice ("UULA:answer …") so a later
// full conversion respects it. Selected shapes carry " #ursel" at the end of their name.
function applyRole(pkg, role) {
  const W = pkg.slideW, H = pkg.slideH, CW = W - 2 * M;
  const doc = parseXml(pkg.files.slide);
  const ctx = { scheme: readTheme(pkg.files), bodySz: 1100 };
  const rels = makeRels(pkg);
  NEXT = maxId(doc) + 1;
  const spTree = spTreeOf(doc);
  const items = topItems(doc).map((el, i) => {
    const c = core(el), n = cnvOf(c);
    return { i, el, c, name: n ? n.getAttribute('name') || '' : '', g: geomOf(el, pkg) || { x: 0, y: 0, w: 0, h: 0 }, kind: c.localName === 'pic' ? 'pic' : c.localName === 'graphicFrame' ? (desc(c, 'a', 'tbl').length ? 'table' : 'object') : c.localName === 'sp' && kid(c, 'txBody', 'p') ? 'text' : c.localName, text: textOf(c).trim() };
  });
  const sel = items.filter(t => / #ursel$/.test(t.name));
  if (!sel.length) throw new Error('nosel');
  const out = [];
  const rename = (t, r) => { for (const c of allCores(t.el)) { const n = cnvOf(c); if (n) n.setAttribute('name', 'UULA:' + r + ' ' + (n.getAttribute('name') || '').replace(/ #ursel$/, '').replace(PIN, '')); } };
  let shift = 0;
  for (const t of sel.sort((a, b) => a.g.y - b.g.y)) {
    t.g = Object.assign({}, t.g, { y: t.g.y + shift });
    if (t.kind === 'table') { t.fullW = false; styleTable(t, ctx, W); rename(t, 'table'); out.push({ idx: t.i, kind: 'table' }); continue; }
    if (['given', 'correct'].includes(role)) { rename(t, role); continue; }       // marks only: no styling, no moving
    if (t.kind === 'pic' || t.kind === 'grpSp') { stylePic(t, false); rename(t, role === 'answer' ? 'answer' : 'pic'); out.push({ idx: t.i, kind: 'pic' }); continue; }
    if (t.kind !== 'text') { rename(t, role); continue; }
    const isBox = BOX_ROLES.includes(role);
    styleText(t, ctx, pkg, isBox ? 'body' : role);
    setBody(t.c, {});
    plainShape(t.c, false);
    rename(t, role);
    const rec = { idx: t.i, kind: 'text', role };
    if (role === 'chapter') setGeom(t.el, { x: M, y: 22.6 * PT, w: CW });
    else if (role === 'lesson') setGeom(t.el, { x: M, y: 42.7 * PT, w: CW });
    else if (isBox) {
      const B = BOX[role];
      const iconW = B.icon ? 15 * PT : 0;
      // something beside the text (a graph …): the container covers only the text's side
      const beside = items.some(o => o !== t && o.g.w && !/^UULA (Footer|Watermark)|^CustomPageNumber_/.test(o.name)
        && Math.min(o.g.y + o.g.h, t.g.y + t.g.h) - Math.max(o.g.y, t.g.y) > 4 * PT && (o.g.x + o.g.w <= t.g.x + 2 * PT || o.g.x >= t.g.x + t.g.w - 2 * PT));
      const narrow = role === 'other' || beside;
      const tx = narrow ? t.g.x : M, tw = role === 'other' ? t.g.w - 24 * PT : narrow ? Math.min(t.g.w, W - M - iconW - t.g.x) : CW - iconW;
      const est = estimateText(t.c, tw);
      const top = role === 'other' ? t.g.y - 4 * PT : t.g.y - ROW;
      const boxH = role === 'other' ? est + 8 * PT : est + 3 * ROW;
      setGeom(t.el, { x: tx, y: t.g.y, w: tw, h: est });
      const bx = role === 'other' ? t.g.x - 6 * PT : beside ? t.g.x - 10 * PT : 0, bw = role === 'other' ? t.g.w : beside ? W - (t.g.x - 10 * PT) : W;
      const box = frag(doc, boxX(B.name, top, boxH, B.fill, W));
      setGeom(box, { x: bx, w: bw });
      spTree.insertBefore(box, t.el);
      rec.box = true; rec.boxType = role; rec.top = top; rec.x = tx; rec.w = tw; rec.boxX = bx; rec.boxW = bw;
      if (B.icon) {
        const bulb = B.icon === 'bulb';
        const ic = frag(doc, picX('UULA ' + B.name + ' Icon', rels.image(B.icon), role === 'other' ? bx + bw - 18 * PT : Math.max(tx + tw + 2 * PT, W - 47 * PT), role === 'other' ? top + 2 * PT : top + ROW - 2 * PT, (bulb ? 11.1 : 14.1) * PT, (bulb ? 15.4 : 15.9) * PT));
        spTree.insertBefore(ic, t.el.nextSibling); rec.iconEl = ic;
      }
      if (B.line) { const ln = frag(doc, lineX(W - 40 * PT, top + ROW + 17 * PT, Math.max(ROW, est - 17 * PT), B.line)); spTree.insertBefore(ln, t.el.nextSibling); rec.lineEl = ln; }
      rec.boxEl = box;
      // the pane puts the object on the grid and moves what is under it (with the real heights)
    }
    out.push(rec);
  }
  blackCircles(spTree);
  markNames(doc);
  const order = topItems(doc);
  for (const r of out) { r.idx = order.indexOf(sel.find(t => t.i === r.idx).el); if (r.boxEl) { r.box = order.indexOf(r.boxEl); delete r.boxEl; } if (r.iconEl) { r.icon = order.indexOf(r.iconEl); delete r.iconEl; } if (r.lineEl) { r.line = order.indexOf(r.lineEl); delete r.lineEl; } }
  // the marks were set before the final order was known: set them again
  markNames(doc);
  return { xml: serialize(doc), rels, targets: out, W, H };
}
// rects: [{ key, x, y, w, h, fixed }] (fixed = footer, page number …); group: keys of the object (+ its container)
// returns { key: { x?, y?, w? } }: the object sits two grid steps under what is above it, on the page guides,
// and everything under it keeps two grid steps from it
function reflow(rects, group, opts) {
  opts = opts || {};
  const inG = r => group.includes(r.key);
  const G0 = rects.filter(inG); if (!G0.length) return {};
  const gx = Math.min(...G0.map(r => r.x)), gy = Math.min(...G0.map(r => r.y));
  const gr = Math.max(...G0.map(r => r.x + r.w)), gb = Math.max(...G0.map(r => r.y + r.h));
  const free = rects.filter(r => !inG(r) && !r.fixed);
  const hov = r => Math.min(r.x + r.w, gr) - Math.max(r.x, gx) > 2 * PT;
  const above = free.filter(r => r.y + r.h <= gy + 2 * PT && hov(r));
  const newTop = above.length ? snapUp(Math.max(...above.map(r => r.y + r.h))) + ROW : snapUp(gy);
  const dy = newTop - gy;
  const out = {};
  for (const r of G0) out[r.key] = { y: r.y + dy };
  // the text itself on the guides
  if (opts.textKey != null && !opts.keepX) {
    const t = rects.find(r => r.key === opts.textKey);
    if (t) {
      let l = snapX(t.x); const rr = snapX(t.x + t.w);
      // a QR / picture on its left in the same band: the text starts at the next guide after it
      const ty = t.y + dy;
      for (const o of free) {
        const vo = Math.min(o.y + o.h, ty + t.h) - Math.max(o.y, ty);
        if (vo > 2 * PT && o.x < l && o.x + o.w > l - 2 * PT && o.x + o.w < rr - 40 * PT) { const g = XGUIDES.find(v => v >= o.x + o.w + 8 * PT); if (g) l = Math.max(l, g); }
      }
      if (rr - l > 20 * PT) Object.assign(out[t.key], { x: l, w: rr - l });
    }
  }
  // what comes after the object (under it, not beside it) keeps two grid steps from it
  const below = free.filter(r => r.y > gy + 2 * PT && (hov(r) || r.y >= gb - 2 * PT));
  if (below.length) {
    const first = Math.min(...below.map(r => r.y));
    const d2 = snapUp(gb + dy) + ROW - first;
    if (d2) for (const r of below) out[r.key] = Object.assign(out[r.key] || {}, { y: r.y + d2 });
  }
  return out;
}
// ---------- vertical spacing only ("تنسيق المسافات") ----------
// rects: [{ key, x, y, w, h, fixed, box }] in EMU. Nothing moves sideways: each object keeps its x,
// rows of objects side by side keep their arrangement, and between rows there are two grid steps
// (objects that were touching stay touching). Containers keep one line above and two below their content.
function spacing(rects, W, H) {
  const free = rects.filter(r => !r.fixed);
  const inside = (o, b) => { const cx = o.x + o.w / 2, cy = o.y + o.h / 2; return cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h; };
  const boxes = free.filter(b => b.box && free.some(o => o !== b && !o.box && inside(o, b)));
  const parent = new Map();
  for (const o of free) {
    if (boxes.includes(o)) continue;
    let best = null;
    for (const b of boxes) if (inside(o, b) && (!best || b.w * b.h < best.w * best.h)) best = b;
    if (best) parent.set(o, best);
  }
  for (const b of boxes) { let best = null; for (const c of boxes) if (c !== b && inside(b, c) && c.w * c.h > b.w * b.h && (!best || c.w * c.h < best.w * best.h)) best = c; if (best) parent.set(b, best); }
  const out = {};
  const kidsOf = p => free.filter(o => parent.get(o) === p);
  // lay a set of units from `start`; returns the bottom
  function level(units, start, keepFirst) {
    const s = [...units].sort((a, b) => a.y - b.y);
    const rows = [];
    for (const u of s) {
      const r = rows[rows.length - 1];
      if (r && Math.min(r.y1, u.y + u.h) - Math.max(r.y0, u.y) > Math.min(u.h, r.y1 - r.y0) * 0.3) { r.items.push(u); r.y1 = Math.max(r.y1, u.y + u.h); }
      else rows.push({ items: [u], y0: u.y, y1: u.y + u.h });
    }
    let bottom = start, prev = null;
    rows.forEach((r, k) => {
      let top;
      if (k === 0) top = keepFirst ? r.y0 : start;
      else if (start === Y0 && k === 1 && rows[0].y0 < 40 * PT && r.y0 < 60 * PT) top = Math.max(Y0 + 3 * G, snapUp(bottom) + G);   // the lesson name under the unit name
      else top = (r.y0 - prev.y1 <= 3 * PT) ? snapUp(bottom) : snapUp(bottom) + ROW;
      let rb = top;
      for (const u of r.items) {
        const ny = top + (u.y - r.y0);
        out[u.key] = Object.assign(out[u.key] || {}, { y: Math.round(ny) });
        let ub = ny + u.h;
        if (boxes.includes(u)) {
          const ks = kidsOf(u);
          if (ks.length) {
            const inner = level(ks, snapUp(ny) + ROW, false);
            const nh = snapUp(inner) + ROW - ny;
            out[u.key].h = Math.round(nh); ub = ny + nh;
          }
        }
        rb = Math.max(rb, ub);
      }
      bottom = rb; prev = r;
    });
    return bottom;
  }
  const top = free.filter(o => !parent.has(o));
  if (!top.length) return out;
  const first = Math.min(...top.map(o => o.y));
  // a container touching the top of the page stays there; otherwise the content starts on a grid line
  level(top, first <= 2 * PT ? first : Math.max(Y0, snapNear(first)), first <= 2 * PT);
  return out;
}
// ---------- horizontal alignment only ----------
// mode: 'auto' (an object on the right half goes to the right margin, on the left half to the left margin),
// 'right' or 'left' (all to that side). Objects side by side move as one group, so they never overlap.
// Inside a container with an icon, the right margin is the 488.8 guide.
function align(rects, W, mode, only) {
  const insideR = (o, b) => { const cx = o.x + o.w / 2, cy = o.y + o.h / 2; return cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h; };
  const boxes = rects.filter(r => r.box && r.w > W * 0.9);
  const L = M, R0 = W - M;
  const rightOf = o => {
    const b = boxes.find(bx => insideR(o, bx));
    if (!b) return R0;
    const icon = rects.some(r => r !== o && r.w < 20 * PT && r.h < 20 * PT && r.x > W - 60 * PT && insideR(r, b));
    return icon ? Math.round(488.8 * PT) : R0;
  };
  // QR codes (small squares at the left margin) stay where they are
  const isQr = r => r.w < 60 * PT && r.h < 60 * PT && r.x < 80 * PT && r.kind !== 'line';
  let items = rects.filter(r => !r.fixed && !(r.box && r.w > W * 0.9) && r.kind !== 'line' && !isQr(r) && !(r.w < 20 * PT && r.h < 20 * PT));
  // a QR in the same band: the left margin is the guide after it (85.98)
  const qrs = rects.filter(r => !r.fixed && isQr(r));
  const leftOf = o => qrs.some(q => Math.min(q.y + q.h, o.y + o.h) - Math.max(q.y, o.y) > 2 * PT) ? Math.round(85.98 * PT) : L;
  if (only && only.length) items = items.filter(r => only.includes(r.key));
  const out = {};
  const cur = new Map(rects.map(r => [r.key, { x: r.x, y: r.y, w: r.w, h: r.h }]));
  const hits = (k, x) => { const a = cur.get(k); for (const [kk, b] of cur) { if (kk === k) continue; const o = rects.find(r => r.key === kk); if (o.fixed || (o.box && o.w > W * 0.9) || o.kind === 'line' || insideR(rects.find(r => r.key === k), o) && o.box) continue;
      if (x < b.x + b.w - PT && b.x < x + a.w - PT && a.y < b.y + b.h - PT && b.y < a.y + a.h - PT) return true; } return false; };
  const place = (o, x) => {
    const RR = rightOf(o), LL = leftOf(o);
    if (o.w > RR - LL) x = o.w > RR - L ? RR - o.w : Math.max(L, RR - o.w); else x = Math.max(LL, Math.min(x, RR - o.w));
    if (Math.abs(x - o.x) <= 0.2 * PT) return;
    if (hits(o.key, x)) return;
    out[o.key] = { x: Math.round(x) }; cur.get(o.key).x = x;
  };
  if (mode === 'auto') {
    // each object goes to the margin it is closer to (right for Arabic when equal)
    for (const o of items) {
      const RR = rightOf(o), LL = leftOf(o), dl = o.x - LL, dr = RR - (o.x + o.w);
      place(o, dr <= dl ? RR - o.w : LL);
    }
    return out;
  }
  // right / left: objects side by side move as one group
  const rows = [];
  for (const u of [...items].sort((a, b) => a.y - b.y)) {
    const r = rows.find(rw => rw.items.some(o => Math.min(o.y + o.h, u.y + u.h) - Math.max(o.y, u.y) > Math.min(o.h, u.h) * 0.3));
    if (r) r.items.push(u); else rows.push({ items: [u] });
  }
  for (const r of rows) {
    const s = r.items.sort((a, b) => mode === 'right' ? (b.x + b.w) - (a.x + a.w) : a.x - b.x);
    const RR = Math.min(...s.map(rightOf));
    const LL = Math.max(...s.map(leftOf));
    const d = mode === 'right' ? RR - Math.max(...s.map(o => o.x + o.w)) : LL - Math.min(...s.map(o => o.x));
    for (const o of s) {
      let x = o.x + d;
      const lo = leftOf(o);
      if (o.w > RR - lo) x = o.w > RR - L ? RR - o.w : Math.max(L, RR - o.w); else x = Math.max(lo, Math.min(x, RR - o.w));
      if (Math.abs(x - o.x) > 0.2 * PT) { out[o.key] = { x: Math.round(x) }; cur.get(o.key).x = x; }
    }
  }
  return out;
}
// ---------- a container around the selected objects ----------
// the selected objects (" #ursel" at the end of their name) get the container behind them: full width, one line
// above and two below the content, the icon on the right and the content kept clear of it. Their text keeps its roles.
const WRAP = { note: 'note', quote: 'quote', formula: 'formula', activity: 'activity', mars: 'mars', other: 'other', cancelled: 'cancelled', practice: 'practice' };
function wrapBox(pkg, type) {
  const W = pkg.slideW, H = pkg.slideH;
  const doc = parseXml(pkg.files.slide);
  const rels = makeRels(pkg);
  NEXT = maxId(doc) + 1;
  const spTree = spTreeOf(doc);
  const all = topItems(doc).map((el, i) => { const c = core(el), n = cnvOf(c); return { i, el, c, name: n ? n.getAttribute('name') || '' : '', g: geomOf(el, pkg) || { x: 0, y: 0, w: 0, h: 0 } }; });
  const sel = all.filter(t => / #ursel$/.test(t.name));
  if (!sel.length) throw new Error('nosel');
  for (const t of sel) for (const c of allCores(t.el)) { const n = cnvOf(c); if (n) n.setAttribute('name', (n.getAttribute('name') || '').replace(/ #ursel$/, '')); }
  const B = type === 'cancelled' ? { name: 'Cancelled', frame: 'FFC000' } : type === 'practice' ? { name: 'Practice', grad: true } : BOX[type];
  let x0 = Math.min(...sel.map(t => t.g.x)), x1 = Math.max(...sel.map(t => t.g.x + t.g.w));
  const y0 = Math.min(...sel.map(t => t.g.y)), y1 = Math.max(...sel.map(t => t.g.y + t.g.h));
  const small = type === 'other';
  // something beside the selection (a graph …): the container covers only the selection's side
  const others = all.filter(t => !sel.includes(t) && t.g.w && !/^UULA (Footer|Watermark)|^CustomPageNumber_/.test(t.name) && !(t.g.w > W * 0.85 && t.g.h > H * 0.6));
  const besideL = others.some(o => Math.min(o.g.y + o.g.h, y1) - Math.max(o.g.y, y0) > 4 * PT && o.g.x + o.g.w <= x0 + 2 * PT);
  const besideR = others.some(o => Math.min(o.g.y + o.g.h, y1) - Math.max(o.g.y, y0) > 4 * PT && o.g.x >= x1 - 2 * PT);
  // content clear of the icon and inside the page margins
  const right = B.icon && !small && !besideR ? Math.round(488.8 * PT) : besideR ? x1 : W - M;
  for (const t of sel) {
    let x = t.g.x, w = t.g.w;
    if (x + w > right) { if (w > right - M) { w = right - M; x = M; } else x = right - w; }
    if (x < M && !small && !besideL) { x = M; if (x + w > right) w = right - M; }
    if (x !== t.g.x || w !== t.g.w) { setGeom(t.el, { x, w: w !== t.g.w ? w : null }); t.g = Object.assign({}, t.g, { x, w }); }
    if (t.c.localName === 'pic') stylePic({ el: t.el, c: t.c, kind: 'pic' }, true);    // no frame inside a container
  }
  const top = small ? y0 - 4 * PT : y0 - ROW, h = small ? (y1 - y0) + 8 * PT : (y1 - y0) + 3 * ROW;
  let box;
  if (B.grad) box = frag(doc, gradBoxX(B.name, top, Math.max(h, 68 * PT), W));
  else if (B.frame) box = frag(doc, '<p:sp><p:nvSpPr><p:cNvPr id="' + nid() + '" name="UULA Cancelled Container"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="0" y="' + Math.round(top) + '"/><a:ext cx="' + W + '" cy="' + Math.round(h) + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln w="19050"><a:solidFill><a:srgbClr val="FFC000"/></a:solidFill></a:ln></p:spPr><p:txBody><a:bodyPr rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:endParaRPr lang="ar-KW" dirty="0"/></a:p></p:txBody></p:sp>');
  else box = frag(doc, boxX(B.name, top, h, B.fill, W));
  if (small) setGeom(box, { x: x0 - 6 * PT, w: (x1 - x0) + 30 * PT });
  else if (besideL || besideR) {
    const bx = besideL ? x0 - 10 * PT : 0, br = besideR ? x1 + 10 * PT : W;
    setGeom(box, { x: bx, w: br - bx });
  }
  const first = sel.reduce((a, b) => (a.i < b.i ? a : b));
  spTree.insertBefore(box, first.el);
  let icon = null, line = null;
  if (B.icon) {
    const bulb = B.icon === 'bulb';
    icon = frag(doc, picX('UULA ' + B.name + ' Icon', rels.image(B.icon), small ? x1 + 6 * PT : besideR ? x1 - 16 * PT : W - 47 * PT, small ? top + 2 * PT : top + ROW - 2 * PT, (bulb ? 11.1 : 14.1) * PT, (bulb ? 15.4 : 15.9) * PT));
    spTree.appendChild(icon);
  }
  if (B.line) { line = frag(doc, lineX(W - 40 * PT, top + ROW + 17 * PT, Math.max(ROW, (y1 - y0) - 17 * PT), B.line)); spTree.appendChild(line); }
  markNames(doc);
  const order = topItems(doc);
  return { xml: serialize(doc), rels, W, H, small, minH: B.grad ? 68 * PT : 0,
    sel: sel.map(t => order.indexOf(t.el)), box: order.indexOf(box), icon: icon ? order.indexOf(icon) : null, line: line ? order.indexOf(line) : null };
}
// ---------- hide / show the solutions ----------
// Hidden originals keep everything: each object holding a solution gets hidden="1" and the name prefix
// "UULA SolHidden "; when only part of it is a solution, a student copy ("UULA SolView …") is put after it:
// answers made invisible (space kept), blue chosen answers back to black, filled circles emptied,
// a solution graph replaced by the same picture with the drawing removed (empty grid, made by the pane).
const DRAW = /ارسم|ارسمي|مثّل|مثل\s|مثلي|مث[ّ]?ل بياني|التمثيل البياني|بيان الدالة|منحنى الدالة/;
const NEG = c => { const p = c.codePointAt(0);
  if (p >= 0x2776 && p <= 0x277F) return String.fromCodePoint(0x2460 + p - 0x2776);
  if (p >= 0x24EB && p <= 0x24F4) return String.fromCodePoint(0x246A + p - 0x24EB);
  if (p >= 0x1F150 && p <= 0x1F169) return String.fromCodePoint(0x24B6 + p - 0x1F150);
  return c; };
const hasSolutions = xml => /name="UULA SolHidden /.test(xml);
// what would be hidden on this slide; pics that need an empty-grid image are listed with their media path
function findSolutions(pkg) {
  const W = pkg.slideW, H = pkg.slideH;
  const doc = parseXml(pkg.files.slide);
  const ctx = { scheme: readTheme(pkg.files), bodySz: 1100 };
  const items = analyze(doc, pkg, ctx);
  headerRoles(items, pkg);
  const rels = parseXml(pkg.files.rels);
  const relT = id => { const r = desc(rels, 'rel', 'Relationship').find(x => x.getAttribute('Id') === id); return r ? r.getAttribute('Target') : null; };
  const texts = items.filter(t => t.kind === 'text' && !t.drop);
  const found = [];
  for (const t of items) {
    if (t.drop || /^UULA (SolHidden|SolView)/.test(t.name)) continue;
    const pin = PIN.exec(t.name);
    if (pin && pin[1] === 'given') continue;                                   // part of the question: never touched
    if (pin && pin[1] === 'correct') { found.push({ i: t.i, how: 'copy', correct: true }); continue; }
    if (pin && pin[1] === 'answer') {
      if (t.kind === 'pic') { const blip = desc(t.c, 'a', 'blip')[0], rid = blip && blip.getAttributeNS(NS.r, 'embed'), target = rid && relT(rid); if (target) { found.push({ i: t.i, how: 'grid', pinned: true, media: 'ppt/media/' + target.split('/').pop() }); continue; } }
      found.push({ i: t.i, how: 'hide' }); continue;
    }
    if (t.kind === 'text') {
      if (['lesson', 'chapter'].includes(t.role) || t.fill) continue;
      const roles = paraRoles(t, ctx, pkg).filter(r => r.text);
      if (!roles.length) continue;
      const choiceLike = r => r.role === 'choice' || /[①-⓿❶-➓]/.test(bulletChar(r.p) || '') || (t.g.w < W * 0.45 && r.text.length < 60);
      const ans = roles.filter(r => r.role === 'answer');
      const blueChoice = roles.filter(r => r.role !== 'answer' && choiceLike(r) && desc(r.p, 'a', 'rPr').some(pr => { const c = colorOf(kid(pr, 'solidFill', 'a'), ctx); return c && isBlue(rgb(c)); }));
      const neg = /[❶-❿⓫-⓴]|\uD83C[\uDD50-\uDD69]/.test(t.text);
      // answers written inside the question's line (marked from Word: bmk="UULA:answer" / "UULA:correct")
      if (desc(t.c, 'a', 'rPr').some(pr => /^UULA:(answer|correct)$/.test(pr.getAttribute('bmk') || ''))) { found.push({ i: t.i, how: 'copy' }); continue; }
      if (ans.length === roles.length && !blueChoice.length) found.push({ i: t.i, how: 'hide' });
      else if (ans.length || blueChoice.length || neg) found.push({ i: t.i, how: 'copy' });
      continue;
    }
    if (t.kind === 'table') {
      if (desc(t.c, 'a', 'tc').some(tc => /^(الحل|الإجابة|الاجابة)$/.test(textOf(tc).trim()))
        || desc(t.c, 'a', 'rPr').some(pr => /^UULA:(answer|correct)$/.test(pr.getAttribute('bmk') || ''))) found.push({ i: t.i, how: 'copy' });
      continue;
    }
    if (t.kind === 'shape' && /ellipse|flowChartConnector/.test((desc(t.c, 'a', 'prstGeom')[0] || { getAttribute: () => '' }).getAttribute('prst')) && t.g.w < 34 * PT && t.g.h < 34 * PT && t.fill && lum(t.fill) < 250) { found.push({ i: t.i, how: 'copy' }); continue; }
    if (t.kind === 'pic' && t.g.w > 80 * PT && t.g.h > 70 * PT) {
      // a graph that answers a "draw" question: the nearest questions above it or beside it
      const near = texts.filter(x => x.g.y < t.g.y + t.g.h && x.g.y > t.g.y - 260 * PT).sort((a, b) => Math.abs(a.g.y - t.g.y) - Math.abs(b.g.y - t.g.y)).slice(0, 6);
      const qs = near.filter(x => DRAW.test(x.text));
      const above = texts.filter(x => x.g.y + x.g.h <= t.g.y + 4 * PT && DRAW.test(x.text) && QHEAD.test(x.text.replace(/ـ/g, '')));
      // the question shows the drawing ("المرسوم", "المجاور", "في الشكل") → the graph belongs to the question
      const given = near.some(x => /المرسوم|المرسومة|المجاور|الشكل التالي|في الشكل|من الشكل|الرسم المجاور|التمثيل المجاور/.test(x.text));
      // answers written beside the graph (blue text in the same band) → the graph is part of the solution
      const besideAns = texts.some(x => Math.min(x.g.y + x.g.h, t.g.y + t.g.h) - Math.max(x.g.y, t.g.y) > 10 * PT
        && (x.g.x >= t.g.x + t.g.w - 4 * PT || x.g.x + x.g.w <= t.g.x + 4 * PT)
        && paraRoles(x, ctx, pkg).some(r => r.text && r.role === 'answer'));
      if (!given && (qs.length || above.length || besideAns)) {
        const blip = desc(t.c, 'a', 'blip')[0], rid = blip && blip.getAttributeNS(NS.r, 'embed');
        const target = rid && relT(rid);
        if (target) found.push({ i: t.i, how: 'grid', media: 'ppt/media/' + target.split('/').pop() });
      }
    }
  }
  // a letter written in white over a filled circle (the circle is a separate shape): it turns black with it
  for (const f of found.slice()) {
    const sh = items.find(x => x.i === f.i);
    if (!sh || sh.kind !== 'shape') continue;
    for (const t of texts) {
      if (found.some(x => x.i === t.i)) continue;
      const cx = t.g.x + t.g.w / 2, cy = t.g.y + t.g.h / 2;
      if (cx < sh.g.x || cx > sh.g.x + sh.g.w || cy < sh.g.y || cy > sh.g.y + sh.g.h) continue;
      const light = desc(t.c, 'a', 'rPr').some(pr => { const c = colorOf(kid(pr, 'solidFill', 'a'), ctx); return c && lum(c) > 230; });
      if (light) found.push({ i: t.i, how: 'copy', correct: true });
    }
  }
  return found;
}
function hideSolutions(pkg, grids) {
  grids = grids || {};
  const W = pkg.slideW;
  const doc = parseXml(pkg.files.slide);
  const ctx = { scheme: readTheme(pkg.files), bodySz: 1100 };
  const items = analyze(doc, pkg, ctx);
  const rels = makeRels(pkg);
  NEXT = maxId(doc) + 1;
  const list = findSolutions(pkg);
  let n = 0;
  for (const f of list) {
    const t = items.find(x => x.i === f.i); if (!t) continue;
    if (f.how === 'grid' && !grids[f.i]) { if (!f.pinned) continue; f.how = 'hide'; }   // no drawing found: hide it (marked) or leave it
    n++;
    const view = f.how === 'hide' ? null : t.el.cloneNode(true);
    for (const c of allCores(t.el)) { const nv = cnvOf(c); if (nv) { nv.setAttribute('hidden', '1'); nv.setAttribute('name', 'UULA SolHidden ' + (nv.getAttribute('name') || '')); } }
    if (!view) continue;
    for (const c of allCores(view)) { const nv = cnvOf(c); if (nv) { nv.setAttribute('id', String(NEXT++)); nv.setAttribute('name', 'UULA SolView ' + (nv.getAttribute('name') || '')); nv.removeAttribute('hidden'); } }
    const vt = { c: core(view), el: view, text: t.text, g: t.g, box: null, ph: null };
    if (f.how === 'grid') {
      const id = rels.image('grid' + f.i + '_' + Date.now().toString(36), grids[f.i]);
      for (const b of desc(view, 'a', 'blip')) { b.setAttributeNS(NS.r, 'r:embed', id); for (const e of [...b.children]) b.removeChild(e); }
    } else if (t.kind === 'text') {
      const roles = paraRoles(vt, ctx, pkg);
      const W45 = W * 0.45;
      for (const r of roles) {
        if (!r.text) continue;
        if (f.correct) { for (const pr of desc(r.p, 'a', 'rPr')) { removeKids(pr, FILLS); placeChild(pr, solid(doc, '000000'), RPR_ORDER); pr.setAttribute('b', '0'); } continue; }
        const choiceLike = r.role === 'choice' || /[①-⓿❶-➓]/.test(bulletChar(r.p) || '') || (t.g.w < W45 && r.text.length < 60);
        if (r.role === 'answer') {
          // invisible, the space stays for the student
          for (const pr of [...desc(r.p, 'a', 'rPr'), ...desc(r.p, 'a', 'endParaRPr')]) { removeKids(pr, FILLS); placeChild(pr, frag(doc, '<a:solidFill><a:srgbClr val="FFFFFF"><a:alpha val="0"/></a:srgbClr></a:solidFill>'), RPR_ORDER); }
          const pPr = kid(r.p, 'pPr', 'a'); if (pPr && kid(pPr, 'buChar', 'a')) { removeKids(pPr, ['buClr']); placeChild(pPr, frag(doc, '<a:buClr><a:srgbClr val="FFFFFF"><a:alpha val="0"/></a:srgbClr></a:buClr>'), PPR_ORDER); }
        } else if (choiceLike) {
          for (const pr of desc(r.p, 'a', 'rPr')) { const c = colorOf(kid(pr, 'solidFill', 'a'), ctx); if (c && isBlue(rgb(c))) { removeKids(pr, FILLS); placeChild(pr, solid(doc, '000000'), RPR_ORDER); pr.setAttribute('b', '0'); } }
        }
      }
      // a blank to fill: the answer words disappear (their space stays); a marked correct choice turns black
      for (const pr of desc(view, 'a', 'rPr')) {
        const m = /^UULA:(answer|correct)$/.exec(pr.getAttribute('bmk') || ''); if (!m) continue;
        removeKids(pr, FILLS);
        if (m[1] === 'answer') placeChild(pr, frag(doc, '<a:solidFill><a:srgbClr val="FFFFFF"><a:alpha val="0"/></a:srgbClr></a:solidFill>'), RPR_ORDER);
        else { placeChild(pr, solid(doc, '000000'), RPR_ORDER); pr.setAttribute('b', '0'); }
      }
      for (const tn of [...desc(view, 'a', 't'), ...desc(view, 'm', 't')]) tn.textContent = [...tn.textContent].map(NEG).join('');
    } else if (t.kind === 'table') {
      for (const tr of desc(view, 'a', 'tr')) {
        const tcs = kids(tr, 'tc', 'a');
        if (!tcs.some(tc => /^(الحل|الإجابة|الاجابة)$/.test(textOf(tc).trim()))) continue;
        for (const tc of tcs) { if (/^(الحل|الإجابة|الاجابة)$/.test(textOf(tc).trim())) continue; for (const pr of [...desc(tc, 'a', 'rPr'), ...desc(tc, 'a', 'endParaRPr')]) { removeKids(pr, FILLS); placeChild(pr, frag(doc, '<a:solidFill><a:srgbClr val="FFFFFF"><a:alpha val="0"/></a:srgbClr></a:solidFill>'), RPR_ORDER); } }
      }
      // answers marked inside cells (from Word): blank to fill / the correct choice turns black
      for (const pr of desc(view, 'a', 'rPr')) {
        const m = /^UULA:(answer|correct)$/.exec(pr.getAttribute('bmk') || ''); if (!m) continue;
        removeKids(pr, FILLS);
        if (m[1] === 'answer') placeChild(pr, frag(doc, '<a:solidFill><a:srgbClr val="FFFFFF"><a:alpha val="0"/></a:srgbClr></a:solidFill>'), RPR_ORDER);
        else { placeChild(pr, solid(doc, '000000'), RPR_ORDER); pr.setAttribute('b', '0'); }
      }
    } else if (t.kind === 'shape' || (f.correct && t.kind !== 'text')) {
      const spPr = kid(vt.c, 'spPr', 'p'); removeKids(spPr, FILLS); placeChild(spPr, mk(doc, 'a', 'noFill'), SPPR_ORDER);
      for (const pr of desc(view, 'a', 'rPr')) { removeKids(pr, FILLS); placeChild(pr, solid(doc, '000000'), RPR_ORDER); }
      const st = kid(vt.c, 'style', 'p'); if (st) { const fr = desc(st, 'a', 'fillRef')[0]; if (fr) fr.setAttribute('idx', '0'); }
    }
    t.el.parentNode.insertBefore(view, t.el.nextSibling);
  }
  return { xml: serialize(doc), rels, count: n };
}
function showSolutions(pkg) {
  const doc = parseXml(pkg.files.slide);
  let n = 0;
  for (const el of topItems(doc)) {
    const nv = cnvOf(core(el)); if (!nv) continue;
    const name = nv.getAttribute('name') || '';
    if (/^UULA SolView /.test(name)) { el.parentNode.removeChild(el); continue; }
    if (/^UULA SolHidden /.test(name)) {
      n++;
      for (const c of allCores(el)) { const v = cnvOf(c); if (v) { v.removeAttribute('hidden'); v.setAttribute('name', (v.getAttribute('name') || '').replace(/^UULA SolHidden /, '')); } }
    }
  }
  return { xml: serialize(doc), count: n };
}
// ---------- splitting ----------
// two slides from one: blocks [0, k) stay (with the header), blocks [k, …) move to a new slide.
// returns [{ xml, plan }, { xml, plan }] with item indexes renumbered for each part
function splitParts(xml, plan, k, opts) {
  opts = opts || {};
  const idsOf = b => b.type === 'box'
    ? [b.idx, b.icon, b.line, ...b.rows.flatMap(r => r.cols.flat().flatMap(i => [i.idx, i.pill ? i.pill.idx : -1]))]
    : b.cols.flat().flatMap(i => [i.idx, i.pill ? i.pill.idx : -1]);
  const head = plan.header.map(h => h.idx);
  const planned = new Set([...head, ...plan.blocks.flatMap(idsOf)].filter(i => i >= 0));
  const part = (blocks, withHead, pageNum, first) => {
    const doc = parseXml(xml);
    const order = topItems(doc);
    const keep = new Set([...(withHead ? head : []), ...blocks.flatMap(idsOf)].filter(i => i >= 0));
    const removed = new Set();
    order.forEach((el, i) => {
      const c = core(el), n = cnvOf(c), name = n ? n.getAttribute('name') || '' : '';
      let drop = planned.has(i) && !keep.has(i);
      if (/^CustomPageNumber_/.test(name)) drop = true;
      // items parked outside the slide (links) stay with the first part only
      if (!planned.has(i) && !first && !/^UULA (Footer|Watermark)/.test(name)) {
        const g = geomFromXfrm(xfrmOf(c));
        if (g && (g.x + g.w <= 0 || g.x >= plan.W)) drop = true;
      }
      if (drop) { el.parentNode.removeChild(el); removed.add(i); }
    });
    if (pageNum != null) spTreeOf(doc).appendChild(frag(doc, pageNumX(plan.W, plan.H, pageNum)));
    const map = {}; let n = 0;
    order.forEach((el, i) => { if (!removed.has(i)) map[i] = n++; });
    const re = i => i >= 0 && map[i] != null ? map[i] : -1;
    const ri = it => Object.assign({}, it, { idx: re(it.idx), pill: it.pill ? Object.assign({}, it.pill, { idx: re(it.pill.idx) }) : null });
    const p = {
      W: plan.W, H: plan.H,
      header: withHead ? plan.header.map(ri) : [],
      blocks: blocks.map(b => b.type === 'box'
        ? Object.assign({}, b, { idx: re(b.idx), icon: re(b.icon), line: re(b.line), rows: b.rows.map(r => ({ cols: r.cols.map(c => c.map(ri)) })) })
        : Object.assign({}, b, { cols: b.cols.map(c => c.map(ri)) }))
    };
    markNames(doc);
    return { xml: serialize(doc), plan: p };
  };
  return [part(plan.blocks.slice(0, k), true, opts.pageA, true), part(plan.blocks.slice(k), false, opts.pageB, false)];
}
// ---------- where a split may happen ----------
// returns the block index where the second slide should start (or -1)
function splitPoint(plan, lay) {
  const bi = lay.overflow;
  if (bi <= 0) return bi === 0 ? -1 : -1;
  let k = bi;
  const roleOf = b => b.type === 'box' ? 'box' : (b.cols.flat().sort((x, y) => x.g0.y - y.g0.y)[0] || {}).role;
  // never separate an answer from its question: move back while the block starts with an answer
  while (k > 1 && roleOf(plan.blocks[k]) === 'answer') k--;
  // a new topic should not start in the last quarter of the page
  const prevTop = lay.rowsInfo.find(r => r.bi === k - 1);
  if (k > 1 && ['topic', 'qhead'].includes(roleOf(plan.blocks[k - 1])) && prevTop && prevTop.top > plan.H * 0.75) k--;
  return k;
}

return {
  NS, PT, ROW, M, FOOT, C, STY, BOX, openPackage, buildPackage, parseXml, serialize, restyle, layout, applyLayout, splitParts, splitPoint, markNames, MARK, applyRole, wrapBox, WRAP, reflow, spacing, align, findSolutions, hideSolutions, showSolutions, hasSolutions, TEXT_ROLES, BOX_ROLES, G, Y0, snapUp, snapX,
  // used by the templates module
  util: { pX, txX, boxX, gradBoxX, picX, pillX, pillW, lineX, tableX, makeRels, frag, topItems, core, cnvOf, maxId, spTreeOf, kid, kids, desc, xfrmOf, geomOf, setNext: n => { NEXT = n; }, yearText, pageNumX, estimateText }
};
})();
if (typeof module !== 'undefined') module.exports = UR;

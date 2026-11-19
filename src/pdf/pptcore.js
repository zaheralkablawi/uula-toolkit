// UULA MathType Code — reading engine
// pptx bytes -> MathType objects on each slide -> UULA Arabic Math text (+ color, size)
const MTC = (() => {
'use strict';

// ---------- zip ----------
async function inflateRaw(u8){
  const ds = new DecompressionStream('deflate-raw');
  const buf = await new Response(new Blob([u8]).stream().pipeThrough(ds)).arrayBuffer();
  return new Uint8Array(buf);
}
function openZip(u8){
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  let e = u8.length - 22;
  while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error('ليس ملف باوربوينت صالحًا');
  const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true);
  const files = {}, td = new TextDecoder();
  for (let i = 0; i < n; i++){
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
    const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true);
    const off = dv.getUint32(p + 42, true);
    const name = td.decode(u8.subarray(p + 46, p + 46 + nl));
    files[name] = { method, csize, off };
    p += 46 + nl + xl + cl;
  }
  const cache = {};
  async function bytes(name){
    const f = files[name]; if (!f) return null;
    if (cache[name]) return cache[name];
    const lnl = dv.getUint16(f.off + 26, true), lxl = dv.getUint16(f.off + 28, true);
    const raw = u8.subarray(f.off + 30 + lnl + lxl, f.off + 30 + lnl + lxl + f.csize);
    return (cache[name] = f.method === 0 ? raw : await inflateRaw(raw));
  }
  async function text(name){ const b = await bytes(name); return b ? new TextDecoder().decode(b) : null; }
  return { files, bytes, text };
}

// ---------- OLE compound file ----------
function cfbStream(u8, want){
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const u32 = o => dv.getUint32(o, true);
  if (u32(0) !== 0xE011CFD0) return null;
  const ss = 1 << dv.getUint16(30, true), mss = 1 << dv.getUint16(32, true);
  const dirStart = u32(48), miniCut = u32(56), miniFatStart = u32(60);
  const nDifatSec = u32(72); let difatSec = u32(68);
  const secOff = s => 512 + s * ss;
  const difat = [];
  for (let i = 0; i < 109; i++) difat.push(u32(76 + i * 4));
  for (let k = 0; k < nDifatSec && difatSec < 0xFFFFFFFA; k++){
    for (let i = 0; i < ss / 4 - 1; i++) difat.push(u32(secOff(difatSec) + i * 4));
    difatSec = u32(secOff(difatSec) + ss - 4);
  }
  const fat = [];
  for (const d of difat){ if (d >= 0xFFFFFFFA) continue; for (let i = 0; i < ss / 4; i++) fat.push(u32(secOff(d) + i * 4)); }
  const read = s => { const parts = []; let guard = 0;
    while (s < 0xFFFFFFFA && guard++ < 1e6){ parts.push(u8.subarray(secOff(s), secOff(s) + ss)); s = fat[s]; }
    const out = new Uint8Array(parts.length * ss); parts.forEach((p, i) => out.set(p, i * ss)); return out; };
  const dir = read(dirStart), ddv = new DataView(dir.buffer);
  let root = null, hit = null;
  for (let i = 0; i < dir.length / 128; i++){
    const o = i * 128, nl = ddv.getUint16(o + 64, true);
    let nm = ''; for (let k = 0; k < Math.max(nl - 2, 0); k += 2) nm += String.fromCharCode(ddv.getUint16(o + k, true));
    const ent = { nm, start: ddv.getUint32(o + 116, true), size: ddv.getUint32(o + 120, true) };
    if (i === 0) root = ent;
    if (nm === want) hit = ent;
  }
  if (!hit) return null;
  if (hit.size >= miniCut) return read(hit.start).subarray(0, hit.size);
  const mini = read(root.start), mf = read(miniFatStart), mfv = new DataView(mf.buffer);
  const out = new Uint8Array(hit.size); let s = hit.start, w = 0, guard = 0;
  while (s < 0xFFFFFFFA && w < hit.size && guard++ < 1e6){
    const take = Math.min(mss, hit.size - w); out.set(mini.subarray(s * mss, s * mss + take), w); w += take;
    s = mfv.getUint32(s * 4, true);
  }
  return out;
}

// ---------- MTEF v5 ----------
const TMPL = ['angle','paren','brace','brack','bar','dbar','floor','ceil','obrack','interval','root','frac','ubar','obar',
  'arrow','integ','sum','prod','coprod','union','inter','intop','sumop','lim','hbrace','hbrack','ldiv','sub','sup','subsup',
  'dirac','vec','tilde','hat','arc','jstatus','strike','box'];
function parseMTEF(d){
  const dv = new DataView(d.buffer, d.byteOffset, d.byteLength);
  let p = dv.getUint16(0, true);
  const u8 = () => d[p++], u16 = () => { const v = dv.getUint16(p, true); p += 2; return v; };
  const cstr = () => { let s = ''; while (p < d.length && d[p]) s += String.fromCharCode(d[p++]); p++; return s; };
  const ver = u8(); if (ver !== 5) throw new Error('MTEF' + ver);
  u8(); u8(); u8(); u8(); cstr(); u8();
  const fonts = [], styles = [], colors = []; let fullPt = null, curColor = null;
  const nudge = () => { const a = u8(), b = u8(); if (a === 128 && b === 128){ u16(); u16(); } };
  const ruler = () => { const n = u8(); for (let i = 0; i < n; i++){ u8(); u16(); } };
  const dims = n => { const vals = []; let half = null;
    const nib = () => { if (half === null){ const v = u8(); half = v & 15; return v >> 4; } const v = half; half = null; return v; };
    for (let i = 0; i < n; i++){ const unit = nib(); let s = ''; for (;;){ const x = nib(); if (x === 15) break; s += x < 10 ? x : x === 10 ? '.' : '-'; } vals.push({ unit, v: parseFloat(s) }); }
    return vals; };
  function list(){ const out = []; while (p < d.length){ const t = u8(); if (t === 0) return out; const o = rec(t); if (o) out.push(o); } return out; }
  function rec(t){
    switch (t){
      case 1: { const o = u8(); if (o & 8) nudge(); if (o & 4) u16(); if (o & 2) ruler(); return { k: 'line', c: (o & 1) ? [] : list() }; }
      case 2: { const o = u8(); if (o & 8) nudge(); const tf = u8() - 128; let mt = null, fp = null;
        if (!(o & 0x20)) mt = u16(); if (o & 0x04) fp = u8(); if (o & 0x10) fp = u16();
        const color = curColor; const emb = (o & 0x01) ? list() : [];
        return { k: 'char', mt, tf, fp, emb, color }; }
      case 3: { const o = u8(); if (o & 8) nudge(); const sel = u8(); let v = u8(); if (v & 0x80) v = (v & 0x7F) | (u8() << 7); u8();
        return { k: 'tmpl', t: TMPL[sel] || ('t' + sel), v, c: list() }; }
      case 4: { const o = u8(); if (o & 8) nudge(); u8(); u8(); if (o & 2) ruler(); return { k: 'pile', c: list() }; }
      case 5: { const o = u8(); if (o & 8) nudge(); u8(); u8(); u8(); const rows = u8(), cols = u8();
        p += Math.ceil((rows + 1) * 2 / 8) + Math.ceil((cols + 1) * 2 / 8); return { k: 'matrix', rows, cols, c: list() }; }
      case 6: { const o = u8(); if (o & 8) nudge(); return { k: 'embell', e: u8() }; }
      case 7: ruler(); return null;
      case 8: u8(); u8(); return null;
      case 9: { const b = u8(); if (b === 101) u16(); else if (b === 100){ u8(); u16(); } else u8(); return null; }
      case 10: case 11: case 12: case 13: case 14: return null;
      case 15: { const i = u8(); curColor = i > 0 ? (colors[i - 1] || null) : null; return null; } // 1-based, 0 = black
      case 16: { const o = u8(); const vals = []; const n = (o & 1) ? 4 : 3; for (let i = 0; i < n; i++) vals.push(u16());
        if (o & 4) cstr();
        let rgb = vals; if (n === 4){ const [c, m, y, k] = vals.map(x => x / 1000); rgb = [(1 - c) * (1 - k), (1 - m) * (1 - k), (1 - y) * (1 - k)].map(x => x * 1000); }
        colors.push('#' + rgb.map(x => Math.round(Math.min(1000, x) / 1000 * 255).toString(16).padStart(2, '0')).join(''));
        return null; }
      case 17: u8(); fonts.push(cstr()); return null;
      case 18: { u8(); let n = u8(); const sz = dims(n); n = u8(); dims(n); n = u8();
        for (let i = 0; i < n; i++){ const fd = u8(); if (fd) u8(); styles.push(fd); }
        if (sz[0]){ const { unit, v } = sz[0]; fullPt = unit === 2 ? v : unit === 0 ? v * 72 : unit === 1 ? v * 72 / 2.54 : unit === 3 ? v * 12 : null; }
        return null; }
      case 19: cstr(); return null;
      default:
        if (t >= 100){ const n = u16(); p += n; return null; }
        throw new Error('tag ' + t);
    }
  }
  const tree = list();
  return { tree, fonts, styles, fullPt };
}

// ---------- MTEF (visual, left to right) -> UULA Arabic Math (logical, right to left) ----------
// Mazeri "normal arabic letters": typed on Latin keys with the Arabic keyboard layout
const KB = {q:'ض',w:'ص',e:'ث',r:'ق',t:'ف',y:'غ',u:'ع',i:'ه',o:'خ',p:'ح','[':'ج',']':'د',a:'ش',s:'س',d:'ي',f:'ب',g:'ل',
  h:'أ',j:'ت',k:'ن',l:'م',';':'ك',"'":'ط',z:'ئ',x:'ء',c:'ؤ',v:'ر',n:'ى',m:'ة','`':'ذ',H:'أ',Y:'إ',N:'آ',b:'لا'};
// Mazeri Arabic Math symbol: letter positions (same table as UULA Arabic Math)
const MATHLETTER_POS = {0x41:'أ',0x42:'ب',0x43:'ت',0x44:'ث',0x45:'ج',0x48:'ح',0x47:'خ',0x49:'د',0x4E:'ذ',0x4B:'ر',0x4D:'ز',0x4F:'س',
  0x50:'ش',0x51:'ص',0x52:'ض',0x53:'ط',0x54:'ظ',0x55:'ع',0x56:'غ',0x57:'ف',0x58:'ق',0x59:'ك',0x5A:'ل',0x5C:'م',0x5D:'ن',0x60:'ه',
  0x61:'و',0x62:'ي',0x4A:'ء'};
// characters UULA Arabic Math draws mirrored: written the other way in logical text
const MIRROR = {'<':'>','>':'<','≤':'≥','≥':'≤','∈':'∋','∋':'∈','∉':'∌','∌':'∉','⊂':'⊃','⊃':'⊂','⊆':'⊇','⊇':'⊆','⊄':'⊅','⊅':'⊄',
  '(':')',')':'(','[':']',']':'[','«':'»','»':'«'};
const AR = '٠١٢٣٤٥٦٧٨٩';
const OPS = new Set(['=','≠','≈','≅','≡','×','÷','+','-','−','±','∓','<','>','≤','≥','∈','∉','⊂','⊃','⊆','⊇','∩','∪','←','→','⟸','⟹','⟺','∴','∵',':','،']);

// a color close to one of the booklet colors becomes that color
const BOOK = ['#000000','#ffffff','#1f71de','#fe00fe','#ffe600'];
function snap(c){
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const a = rgb(c); let best = c, bd = 40;
  for (const b of BOOK){ const d = Math.max(...rgb(b).map((v, i) => Math.abs(v - a[i]))); if (d < bd){ bd = d; best = b; } }
  return best;
}
function convert(eq){
  const { tree, fonts, styles } = eq;
  const warn = [];
  const colorCount = {};
  const fontOf = tf => { if (tf < 0) return fonts[-tf - 1] || ''; const fd = styles[tf - 1]; return fd ? (fonts[fd - 1] || '') : ''; };
  // first pass: count colors to find the main one
  (function walk(list){ for (const o of list){ if (o.k === 'char' && o.mt != null && o.mt !== 0xF700){ const c = o.color || '#000000'; colorCount[c] = (colorCount[c] || 0) + 1; }
    if (o.c) walk(o.c); if (o.emb) walk(o.emb); } })(tree);
  const main = Object.entries(colorCount).sort((a, b) => b[1] - a[1])[0];
  const mainColor = snap(main ? main[0] : '#000000');

  const lineOf = o => o && o.k === 'line' ? o.c : (o ? [o] : []);
  const slots = o => o.c.filter(x => x.k === 'line' || x.k === 'pile');
  const fenceChars = o => o.c.filter(x => x.k === 'char').map(ch => ch.mt ? String.fromCharCode(ch.mt) : '');
  const esc = ch => ch === '{' ? '\\{' : ch === '}' ? '\\}' : ch;

  function charText(o){
    const font = fontOf(o.tf).toLowerCase();
    const mt = o.mt;
    if (mt == null){ return null; }
    if (mt === 0xF700) return null; // the hook of the old Arabic root (drawn by the box template)
    if (mt >= 0xEF00 && mt <= 0xEFFF) return ' '; // MathType spaces
    const c = String.fromCharCode(mt);
    if (/mazeri arabic math symbol\s*2/.test(font) && o.fp != null) return String.fromCharCode(0xE200 + o.fp);
    if (/mazeri arabic math symbol/.test(font)){
      const pos = o.fp != null ? o.fp : mt;
      if (MATHLETTER_POS[pos]) return MATHLETTER_POS[pos];
      if (/[0-9]/.test(c)) return c;
      if (pos >= 0x21 && pos < 0x100 && !/[=+\-<>(),.\[\]]/.test(c)) return String.fromCharCode(0xE000 + pos);
      return c;
    }
    if (/mazeri/.test(font) && /normal|letter/.test(font) && KB[c]) return KB[c];
    if (mt >= 0xE000 && mt <= 0xF8FF){ warn.push('رمز غير معروف'); return '⟦?⟧'; }
    return c;
  }

  // turns a line (visual order) into logical text
  function line(objs){
    const atoms = []; // {s, kind: 'num'|'word'|'op'|'x', color}
    const push = (s, kind, color) => atoms.push({ s, kind, color: color || null });
    for (let i = 0; i < objs.length; i++){
      const o = objs[i];
      if (o.k === 'char'){
        let s = charText(o); if (s == null) continue;
        if (s === ' '){ continue; }
        let col = o.color && snap(o.color) !== mainColor ? snap(o.color) : null;
        const last = atoms[atoms.length - 1];
        if (/[0-9]/.test(s)){ s = AR[+s];
          if (last && last.kind === 'num' && last.color === col){ last.s += s; continue; }
          push(s, 'num', col); }
        else if ((s === ',' || s === '.' || s === '٫') && last && last.kind === 'num' && objs[i + 1] && objs[i + 1].k === 'char' && /[0-9]/.test(String.fromCharCode(objs[i + 1].mt || 0))){ last.s += ','; }
        else if (/[؀-ۿ]/.test(s) && s.length === 1 && !/mazeri/i.test(fontOf(o.tf))){ // real Arabic text: already in reading order
          if (last && last.kind === 'arab' && last.color === col){ last.s += s; continue; } push(s, 'arab', col); }
        else {
          s = MIRROR[s] || s; s = s === '−' ? '-' : s;
          let e = s;
          for (const em of o.emb || []){ if (em.k !== 'embell') continue;
            if (em.e === 5) e += '′'; else if (em.e === 6) e += '″'; else if (em.e === 18) e += '‴';
            else if (em.e === 17 || em.e === 16) e = 'خط{' + e + '}';
            else if (em.e === 11 || em.e === 14) e = 'متجه{' + e + '}';
            else if (em.e === 10 && e === '=') e = '≠';
            else { warn.push('علامة فوق حرف'); } }
          push(e === '{' || e === '}' ? esc(e) : e, OPS.has(s) ? 'op' : 'x', col);
        }
        continue;
      }
      if (o.k === 'line'){ push(line(o.c), 'x'); continue; }
      if (o.k === 'pile'){ push(o.c.map(l => line(lineOf(l))).join('\n'), 'x'); continue; }
      if (o.k === 'matrix'){
        const cells = o.c.map(l => line(lineOf(l))); const rows = [];
        for (let r = 0; r < o.rows; r++) rows.push(cells.slice(r * o.cols, (r + 1) * o.cols).reverse().join(' & '));
        push('مصفوفة{' + rows.join(' ; ') + '}', 'x'); continue;
      }
      if (o.k !== 'tmpl') continue;
      const sl = slots(o), S = i => sl[i] ? line(lineOf(sl[i])) : '';
      switch (o.t){
        case 'box': {
          const nx = objs[i + 1];
          if (nx && nx.k === 'tmpl' && nx.t === 'sub' && JSON.stringify(nx).includes('63232')){ push('جذر{' + S(0) + '}', 'x'); i++; }
          else push('مربع{' + S(0) + '}', 'x');
          break; }
        case 'root': push(o.v ? 'جذر[' + S(1) + ']{' + S(0) + '}' : 'جذر{' + S(0) + '}', 'x'); break;
        case 'frac': push('كسر{' + S(0) + '}{' + S(1) + '}', 'x'); break;
        case 'sub': case 'sup': case 'subsup': {
          const sub = S(0), sup = S(1);
          const s = (sub ? '_{' + sub + '}' : '') + (sup ? '^{' + sup + '}' : '');
          const last = atoms[atoms.length - 1];
          if (last) last.s += s; else push(s, 'x');
          break; }
        case 'paren': case 'brack': case 'brace': case 'angle': case 'interval': case 'floor': case 'ceil': case 'obrack': case 'dbar': {
          const f = fenceChars(o); const L = f[0] || '', R = f[1] || '';
          const open = esc(MIRROR[R] || R), close = esc(MIRROR[L] || L);
          push(open + S(0) + close, 'x'); break; }
        case 'bar': push('مطلق{' + S(0) + '}', 'x'); break;
        case 'obar': push('خط{' + S(0) + '}', 'x'); break;
        case 'ubar': push('تسطير{' + S(0) + '}', 'x'); break;
        case 'vec': push('متجه{' + S(0) + '}', 'x'); break;
        case 'arc': push('قوس{' + S(0) + '}', 'x'); break;
        case 'strike': push('شطب{' + S(0) + '}', 'x'); break;
        case 'lim': push('نها{' + S(1) + '}', 'x'); break;
        case 'sum': push('مجموع{' + S(1) + '}' + (S(2) ? '{' + S(2) + '}' : ''), 'x'); push(S(0), 'x'); break;
        case 'integ': push('تكامل{' + S(1) + '}' + (S(2) ? '{' + S(2) + '}' : ''), 'x'); push(S(0), 'x'); break;
        case 'ldiv': push('قسمة{' + S(1) + '}{' + S(0) + '}', 'x'); warn.push('قسمة مطولة'); break;
        default: warn.push('قالب ' + o.t); push('⟦' + sl.map((_, k) => S(k)).join(' ، ') + '⟧', 'x');
      }
    }
    // a template that is just «( … )» around «sum» etc. keeps its order; now reverse into reading order
    atoms.reverse();
    let out = '';
    for (const a of atoms){
      let s = a.color ? 'لون{' + a.color + '}{' + a.s + '}' : a.s;
      if (!s) continue;
      if (out && (a.kind === 'op' || /[=≠≈×÷+\-<>≤≥∈∉⊂⊃⊆⊇∩∪←→∴∵:]$/.test(out) && !/^[_^]/.test(s))) out += ' ';
      else if (out && a.kind === 'arab') out += ' ';
      out += s;
    }
    return out.replace(/ {2,}/g, ' ').trim();
  }

  const lines = [];
  for (const o of tree){
    if (o.k === 'line'){
      if (o.c.length === 1 && o.c[0].k === 'pile') o.c[0].c.forEach(l => lines.push(line(lineOf(l))));
      else lines.push(line(o.c));
    } else if (o.k === 'pile') o.c.forEach(l => lines.push(line(lineOf(l))));
  }
  return { code: lines.join('\n').replace(/^\n+|\n+$/g, ''), color: mainColor, warn: [...new Set(warn)] };
}

// ---------- the whole presentation ----------
const attr = (s, n) => { const m = new RegExp('\\b' + n + '="([^"]*)"').exec(s); return m ? m[1] : null; };
function resolve(base, target){
  if (target.startsWith('/')) return target.slice(1);
  const parts = base.split('/'); parts.pop();
  for (const seg of target.split('/')){ if (seg === '..') parts.pop(); else if (seg !== '.') parts.push(seg); }
  return parts.join('/');
}
async function rels(zip, path){
  const i = path.lastIndexOf('/');
  const t = await zip.text(path.slice(0, i) + '/_rels/' + path.slice(i + 1) + '.rels'); const m = {};
  if (t) for (const r of t.match(/<Relationship\b[^>]*>/g) || []) m[attr(r, 'Id')] = resolve(path, attr(r, 'Target'));
  return m;
}
// returns [{ slide: index, shapes: [{ id, name, left, top, width, height, code, color, pt, warn, empty, error }] }]
async function scan(u8, onlySlides){
  const zip = openZip(u8);
  const pres = await zip.text('ppt/presentation.xml'), prel = await rels(zip, 'ppt/presentation.xml');
  const ids = (pres.match(/<p:sldId\b[^>]*>/g) || []).map(s => attr(s, 'r:id'));
  const out = [];
  for (let si = 0; si < ids.length; si++){
    if (onlySlides && !onlySlides.includes(si)) continue;
    const path = prel[ids[si]]; const xml = await zip.text(path); if (!xml) continue;
    const srel = await rels(zip, path); const shapes = [];
    const frames = xml.split(/<p:graphicFrame\b/).slice(1);
    for (const fr of frames){
      const ole = (fr.match(/<p:oleObj\b[^>]*>/) || [])[0];
      if (!ole) continue;
      const prog = attr(ole, 'progId') || '';
      if (!/^Equation\./i.test(prog)) continue;
      const cnv = (fr.match(/<p:cNvPr\b[^>]*>/) || [''])[0];
      const off = (fr.match(/<a:off\b[^>]*>/) || [''])[0], ext = (fr.match(/<a:ext\b[^>]*cx=[^>]*>/) || [''])[0];
      const E = 12700;
      const sh = { id: attr(cnv, 'id'), name: attr(cnv, 'name'), left: +attr(off, 'x') / E, top: +attr(off, 'y') / E,
        width: +attr(ext, 'cx') / E, height: +attr(ext, 'cy') / E, prog };
      try {
        const bin = await zip.bytes(srel[attr(ole, 'r:id')]);
        const st = bin && cfbStream(bin, 'Equation Native');
        if (!st) throw new Error('لا توجد بيانات معادلة');
        const eq = parseMTEF(st), r = convert(eq);
        const imgH = +attr(ole, 'imgH');
        Object.assign(sh, r);
        if (eq.fullPt) sh.pt = Math.round(eq.fullPt * (imgH ? (+attr(ext, 'cy')) / imgH : 1) * 2) / 2;
        if (!r.code) sh.empty = true;
      } catch (e){ sh.error = /^MTEF/.test(e.message) ? 'نسخة قديمة من MathType غير مدعومة' : 'تعذّرت القراءة'; }
      shapes.push(sh);
    }
    out.push({ slide: si, shapes });
  }
  return out;
}

// paragraphs that hold a PowerPoint equation (a14:m), as pieces in order: { k:'t', s:text } or { k:'m' }.
// The add-in must only change the 't' pieces: editing inside an equation turns it into plain text.
// -> [{ slide, shapes: [{ id, name, left, top, paras: { index: [pieces] } }] }]
async function mathParas(u8, onlySlides){
  const zip = openZip(u8);
  const pres = await zip.text('ppt/presentation.xml'), prel = await rels(zip, 'ppt/presentation.xml');
  const ids = (pres.match(/<p:sldId\b[^>]*>/g) || []).map(s => attr(s, 'r:id'));
  const unesc = t => t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  const out = [];
  for (let si = 0; si < ids.length; si++){
    if (onlySlides && !onlySlides.includes(si)) continue;
    const xml = await zip.text(prel[ids[si]]); if (!xml || !xml.includes('a14:m')) continue;
    const shapes = [];
    for (const sp of xml.split(/<p:sp>/).slice(1)){
      const body = (sp.match(/<p:txBody>[\s\S]*?<\/p:txBody>/) || [''])[0];
      if (!body.includes('a14:m')) continue;
      const cnv = (sp.match(/<p:cNvPr\b[^>]*>/) || [''])[0], off = (sp.match(/<a:off\b[^>]*>/) || [''])[0];
      const paras = {};
      (body.match(/<a:p>[\s\S]*?<\/a:p>|<a:p\/>/g) || []).forEach((pp, k) => {
        if (!pp.includes('a14:m')) return;
        const pieces = [];
        const re = /<a14:m>[\s\S]*?<\/a14:m>|<a:t>([^<]*)<\/a:t>|<a:br\b[^>]*\/>/g; let m;
        while ((m = re.exec(pp))){
          if (m[0].startsWith('<a14:m>')) pieces.push({ k: 'm' });
          else if (m[0].startsWith('<a:br')) pieces.push({ k: 't', s: '\v', br: true });
          else pieces.push({ k: 't', s: unesc(m[1]) });
        }
        paras[k] = pieces;
      });
      if (Object.keys(paras).length) shapes.push({ id: attr(cnv, 'id'), name: attr(cnv, 'name'), left: +attr(off, 'x') / 12700, top: +attr(off, 'y') / 12700, paras });
    }
    if (shapes.length) out.push({ slide: si, shapes });
  }
  return out;
}
// where the plain-text pieces sit inside the paragraph text PowerPoint gives the add-in; null when unsure
function textSpans(para, pieces){
  const spans = []; let cur = 0;
  for (const pc of pieces){
    if (pc.k !== 't' || !pc.s || pc.br) continue;
    const i = para.indexOf(pc.s, cur);
    if (i < 0) return null;
    spans.push([i, i + pc.s.length]); cur = i + pc.s.length;
  }
  return spans;
}
const startsWithMath = pieces => { for (const pc of pieces){ if (pc.k === 'm') return true; if (pc.s && pc.s.replace(/[\s‏‎\v]/g, '')) return false; } return false; };

// ---------- digits inside PowerPoint equations (m:t) -> Hindi, on a one-slide pptx ----------
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++){ let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8){ let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
const HINDI_D = '٠١٢٣٤٥٦٧٨٩';
const mathDigits = xml => xml.replace(/(<m:t(?:\s[^>]*)?>)([^<]*)(<\/m:t>)/g, (m, a, t, b) => a + t.replace(/[0-9]/g, c => HINDI_D[+c]) + b);
const hasMathDigits = xml => /<m:t(?:\s[^>]*)?>[^<]*[0-9][^<]*<\/m:t>/.test(xml);
// rewrite a zip: changed entries stored uncompressed, the others copied as they are
function rezip(u8, changed){
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  let e = u8.length - 22; while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true);
  const ents = [], td = new TextDecoder();
  for (let i = 0; i < n; i++){
    const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true);
    const nameB = u8.slice(p + 46, p + 46 + nl), name = td.decode(nameB);
    const off = dv.getUint32(p + 42, true), lnl = dv.getUint16(off + 26, true), lxl = dv.getUint16(off + 28, true);
    const csize = dv.getUint32(p + 20, true);
    ents.push({ nameB, name, flags: dv.getUint16(p + 8, true) & ~8, method: dv.getUint16(p + 10, true), time: dv.getUint32(p + 12, true),
      crc: dv.getUint32(p + 16, true), csize, usize: dv.getUint32(p + 24, true), data: u8.subarray(off + 30 + lnl + lxl, off + 30 + lnl + lxl + csize) });
    p += 46 + nl + xl + cl;
  }
  for (const en of ents) if (changed[en.name]){ const d = changed[en.name]; en.method = 0; en.data = d; en.csize = en.usize = d.length; en.crc = crc32(d); }
  let size = 22; for (const en of ents) size += 30 + en.nameB.length + en.data.length + 46 + en.nameB.length;
  const out = new Uint8Array(size), ov = new DataView(out.buffer); let w = 0; const offs = [];
  for (const en of ents){
    offs.push(w);
    ov.setUint32(w, 0x04034b50, true); ov.setUint16(w + 4, 20, true); ov.setUint16(w + 6, en.flags, true); ov.setUint16(w + 8, en.method, true);
    ov.setUint32(w + 10, en.time, true); ov.setUint32(w + 14, en.crc, true); ov.setUint32(w + 18, en.csize, true); ov.setUint32(w + 22, en.usize, true);
    ov.setUint16(w + 26, en.nameB.length, true); ov.setUint16(w + 28, 0, true); out.set(en.nameB, w + 30); out.set(en.data, w + 30 + en.nameB.length);
    w += 30 + en.nameB.length + en.data.length;
  }
  const cd = w;
  ents.forEach((en, i) => {
    ov.setUint32(w, 0x02014b50, true); ov.setUint16(w + 4, 20, true); ov.setUint16(w + 6, 20, true); ov.setUint16(w + 8, en.flags, true); ov.setUint16(w + 10, en.method, true);
    ov.setUint32(w + 12, en.time, true); ov.setUint32(w + 16, en.crc, true); ov.setUint32(w + 20, en.csize, true); ov.setUint32(w + 24, en.usize, true);
    ov.setUint16(w + 28, en.nameB.length, true); ov.setUint32(w + 42, offs[i], true); out.set(en.nameB, w + 46); w += 46 + en.nameB.length;
  });
  ov.setUint32(w, 0x06054b50, true); ov.setUint16(w + 8, ents.length, true); ov.setUint16(w + 10, ents.length, true);
  ov.setUint32(w + 12, w - cd, true); ov.setUint32(w + 16, cd, true);
  return out;
}
// English digits -> Hindi inside every text box that holds an equation (its text and its equations);
// words with English letters (fx-991) keep their digits
function fixMathShapesDigits(xml){
  let n = 0;
  const fixText = t => t.replace(/\S+/g, w => /[A-Za-z]/.test(w) ? w : w.replace(/[0-9]/g, c => { n++; return HINDI_D[+c]; }));
  const out = xml.replace(/<p:sp>[\s\S]*?<\/p:sp>/g, sp => {
    if (!sp.includes('a14:m') || sp.includes('custDataLst')) return sp;
    return sp.replace(/(<a:t>)([^<]*)(<\/a:t>)/g, (m, a, t, b) => a + fixText(t) + b)
             .replace(/(<m:t(?:\s[^>]*)?>)([^<]*)(<\/m:t>)/g, (m, a, t, b) => a + t.replace(/[0-9]/g, c => { n++; return HINDI_D[+c]; }) + b);
  });
  return { xml: out, n };
}
// one-slide pptx (from exportAsBase64) -> same with Hindi digits in its equation text boxes; null if nothing to change
async function slideMathDigits(u8){
  const zip = openZip(u8), changed = {}; let n = 0;
  for (const name of Object.keys(zip.files)){
    if (!/^ppt\/slides\/slide\d+\.xml$/.test(name)) continue;
    const x = await zip.text(name); const r = fixMathShapesDigits(x); if (!r.n) continue;
    n += r.n; changed[name] = new TextEncoder().encode(r.xml);
  }
  return n ? { bytes: rezip(u8, changed), n } : null;
}
// slides (by index) whose equation text boxes hold English digits
async function slidesWithMathDigits(u8){
  const zip = openZip(u8);
  const pres = await zip.text('ppt/presentation.xml'), prel = await rels(zip, 'ppt/presentation.xml');
  const ids = (pres.match(/<p:sldId\b[^>]*>/g) || []).map(s => attr(s, 'r:id'));
  const out = [];
  for (let i = 0; i < ids.length; i++){ const x = await zip.text(prel[ids[i]]); if (x && x.includes('a14:m') && fixMathShapesDigits(x).n) out.push(i); }
  return out;
}

// ---------- digits, both ways ----------
const LATIN_D = '0123456789';
// Office.js text: runs to replace. dir 'hindi': 0-9 -> ٠-٩ (words with English letters stay); dir 'latin': ٠-٩ -> 0-9
function digitEdits(t, dir){
  const runs = [];
  if (dir === 'hindi'){
    const re = /\S+/g; let m;
    while ((m = re.exec(t))){ if (/[A-Za-z]/.test(m[0])) continue;
      const d = /[0-9]+/g; let k; while ((k = d.exec(m[0]))) runs.push({ start: m.index + k.index, len: k[0].length, rep: k[0].replace(/[0-9]/g, c => HINDI_D[+c]) }); }
  } else {
    const d = /[٠-٩]+/g; let k; while ((k = d.exec(t))) runs.push({ start: k.index, len: k[0].length, rep: k[0].replace(/[٠-٩]/g, c => LATIN_D[HINDI_D.indexOf(c)]) });
  }
  return runs;
}
// page numbers, footers and dates are not content: they keep their digits
// ctx: { SH: slide height (EMU), tagNames: { rId: 'MYNUMBER …' } }
function isPageNumberSp(sp, ctx){
  if (/<p:ph\b[^>]*type="(?:sldNum|ftr|dt)"/.test(sp)) return true;
  const tg = /<p:tags r:id="([^"]+)"/.exec(sp);
  if (tg && ctx && ctx.tagNames && /MYNUMBER/i.test(ctx.tagNames[tg[1]] || '')) return true;
  const text = (sp.match(/<a:t>([^<]*)<\/a:t>/g) || []).map(t => t.replace(/<\/?a:t>/g, '')).join('');
  const off = /<a:off x="-?\d+" y="(-?\d+)"\/>/.exec(sp);
  if (ctx && ctx.SH && off && +off[1] > ctx.SH * 0.88 && /^[\s0-9٠-٩\-—–|/.]+$/.test(text)) return true;
  return false;
}
// whole slide XML: text (a:t) and equations (m:t), page numbers left alone
function slideDigits(xml, dir, ctx){
  let n = 0;
  const conv = t => dir === 'hindi'
    ? t.replace(/\S+/g, w => /[A-Za-z]/.test(w) ? w : w.replace(/[0-9]/g, c => { n++; return HINDI_D[+c]; }))
    : t.replace(/[٠-٩]/g, c => { n++; return LATIN_D[HINDI_D.indexOf(c)]; });
  const fix = part => part.replace(/(<a:t>)([^<]*)(<\/a:t>)/g, (m, a, t, b) => a + conv(t) + b)
                          .replace(/(<m:t(?:\s[^>]*)?>)([^<]*)(<\/m:t>)/g, (m, a, t, b) => a + conv(t) + b);
  const out = xml.replace(/<p:sp>[\s\S]*?<\/p:sp>|<p:graphicFrame>[\s\S]*?<\/p:graphicFrame>/g, el => (el.startsWith('<p:sp>') && isPageNumberSp(el, ctx)) ? el : fix(el));
  return { xml: out, n };
}
// what a slide's page-number check needs: slide height and the names inside its tags
async function slideCtx(zip, path, SH){
  const i0 = path.lastIndexOf('/');
  const rt = await zip.text(path.slice(0, i0) + '/_rels/' + path.slice(i0 + 1) + '.rels') || '';
  const tagNames = {};
  for (const r of rt.match(/<Relationship\b[^>]*>/g) || []){
    if (!/\/tags"/.test(r)) continue;
    const t = resolve(path, attr(r, 'Target')); tagNames[attr(r, 'Id')] = (await zip.text(t)) || '';
  }
  return { SH, tagNames };
}
async function slideHeight(zip){ const p = await zip.text('ppt/presentation.xml'); const m = p && /<p:sldSz\b[^>]*\bcy="(\d+)"/.exec(p); return m ? +m[1] : 0; }
// cover / front pages: when macOS makes the PDF, digits in a paragraph marked Arabic (its end mark, or an Arabic
// "complex script" font on the run) come out Hindi although the screen shows them English. In paragraphs that hold
// digits and no Arabic letters: English language everywhere, no complex-script font -> the PDF keeps them as typed.
function coverLatin(xml){
  let n = 0;
  const out = xml.replace(/<a:p>[\s\S]*?<\/a:p>/g, p => {
    const t = (p.match(/<a:t>([^<]*)<\/a:t>/g) || []).join('');
    if (!/[0-9]/.test(t) || /[\u0621-\u064A]/.test(t)) return p;
    const q = p.replace(/(<a:(?:rPr|endParaRPr)\b[^>]*?)\blang="[^"]*"/g, '$1lang="en-US"')
               .replace(/\s+altLang="[^"]*"/g, '')
               .replace(/<a:cs\b[^>]*\/>/g, '');
    if (q !== p) n++;
    return q;
  });
  return { xml: out, n };
}
async function coverSlides(u8, content){
  if (!content) return [];
  const zip = openZip(u8);
  const pres = await zip.text('ppt/presentation.xml'), prel = await rels(zip, 'ppt/presentation.xml');
  const ids = (pres.match(/<p:sldId\b[^>]*>/g) || []).map(s => attr(s, 'r:id'));
  const out = [];
  for (let i = 0; i < ids.length; i++){ if (content.includes(i)) continue; const x = await zip.text(prel[ids[i]]); if (x && coverLatin(x).n) out.push(i); }
  return out;
}
async function coverLatinBytes(u8){
  const zip = openZip(u8), changed = {}; let n = 0;
  for (const name of Object.keys(zip.files)){
    if (!/^ppt\/slides\/slide\d+\.xml$/.test(name)) continue;
    const r = coverLatin(await zip.text(name)); if (!r.n) continue;
    n += r.n; changed[name] = new TextEncoder().encode(r.xml);
  }
  return n ? { bytes: rezip(u8, changed), n } : null;
}
// content slides = slides with a page number (MYNUMBER box or slide-number placeholder); the cover and front pages have none.
// -> array of indexes, or null when the file has no page numbers at all (then every slide counts)
async function contentSlides(u8){
  const zip = openZip(u8);
  const pres = await zip.text('ppt/presentation.xml'), prel = await rels(zip, 'ppt/presentation.xml');
  const ids = (pres.match(/<p:sldId\b[^>]*>/g) || []).map(s => attr(s, 'r:id'));
  const out = [];
  for (let i = 0; i < ids.length; i++){
    const x = await zip.text(prel[ids[i]]); if (!x) continue;
    if (/<p:ph\b[^>]*type="sldNum"/.test(x)){ out.push(i); continue; }
    if (!x.includes('<p:tags ')) continue;
    const ctx = await slideCtx(zip, prel[ids[i]], 0);
    if (Object.values(ctx.tagNames).some(t => /MYNUMBER/i.test(t))) out.push(i);
  }
  return out.length ? out : null;
}
// slides (index) whose equation text boxes need digits changed in direction dir
async function slidesNeedingRebuild(u8, dir){
  const zip = openZip(u8);
  const pres = await zip.text('ppt/presentation.xml'), prel = await rels(zip, 'ppt/presentation.xml');
  const SH = await slideHeight(zip);
  const ids = (pres.match(/<p:sldId\b[^>]*>/g) || []).map(s => attr(s, 'r:id'));
  const out = [];
  for (let i = 0; i < ids.length; i++){
    const x = await zip.text(prel[ids[i]]); if (!x || !x.includes('a14:m')) continue;
    const ctx = await slideCtx(zip, prel[ids[i]], SH);
    const need = (x.match(/<p:sp>[\s\S]*?<\/p:sp>/g) || []).some(sp => sp.includes('a14:m') && !isPageNumberSp(sp, ctx) && slideDigits(sp, dir, ctx).n);
    if (need) out.push(i);
  }
  return out;
}
async function slideRebuildBytes(u8, dir){
  const zip = openZip(u8), changed = {}; let n = 0;
  const SH = await slideHeight(zip);
  for (const name of Object.keys(zip.files)){
    if (!/^ppt\/slides\/slide\d+\.xml$/.test(name)) continue;
    const r = slideDigits(await zip.text(name), dir, await slideCtx(zip, name, SH)); if (!r.n) continue;
    n += r.n; changed[name] = new TextEncoder().encode(r.xml);
  }
  return n ? { bytes: rezip(u8, changed), n } : null;
}

// ---------- links on pictures and shapes -> PDF link areas ----------
// [{ page, x0, y0, x1, y1 (0..1 from top-left), url }]; hidden slides are not in the PDF
async function pictureLinks(u8){
  const zip = openZip(u8);
  const pres = await zip.text('ppt/presentation.xml'), prel = await rels(zip, 'ppt/presentation.xml');
  const sz = /<p:sldSz\b[^>]*>/.exec(pres)[0], SW = +attr(sz, 'cx'), SH = +attr(sz, 'cy');
  const ids = (pres.match(/<p:sldId\b[^>]*>/g) || []).map(s => attr(s, 'r:id'));
  const out = []; let page = -1;
  for (const rid of ids){
    const path = prel[rid]; const x = await zip.text(path); if (!x) continue;
    if (/<p:sld\b[^>]*\bshow="0"/.test(x)) continue;
    page++;
    const i0 = path.lastIndexOf('/');
    const rt = await zip.text(path.slice(0, i0) + '/_rels/' + path.slice(i0 + 1) + '.rels') || '';
    const ext = {};
    for (const r of rt.match(/<Relationship\b[^>]*>/g) || []) if (/TargetMode="External"/.test(r) && /hyperlink/.test(r)) ext[attr(r, 'Id')] = attr(r, 'Target').replace(/&amp;/g, '&');
    if (!Object.keys(ext).length) continue;
    // walk the shape tree with group transforms
    const stack = []; const seen = new Set();
    const tagRe = /<(\/?)(p:grpSp|p:pic|p:sp|p:graphicFrame|p:cxnSp|mc:Fallback)\b[^>]*?(\/?)>/g; let m;
    let skipFallback = 0;
    while ((m = tagRe.exec(x))){
      const close = m[1] === '/', name = m[2];
      if (name === 'mc:Fallback'){ skipFallback += close ? -1 : 1; continue; }
      if (skipFallback) continue;
      if (name === 'p:grpSp'){
        if (close){ stack.pop(); continue; }
        const g = x.slice(m.index, x.indexOf('</p:grpSpPr>', m.index));
        const o = /<a:off x="(-?\d+)" y="(-?\d+)"\/>\s*<a:ext cx="(\d+)" cy="(\d+)"\/>\s*<a:chOff x="(-?\d+)" y="(-?\d+)"\/>\s*<a:chExt cx="(\d+)" cy="(\d+)"\/>/.exec(g);
        stack.push(o ? o.slice(1).map(Number) : null); continue;
      }
      if (close) continue;
      const end = x.indexOf('</' + name + '>', m.index); if (end < 0) continue;
      const el = x.slice(m.index, end);
      const cnv = /<p:cNvPr\b[^>]*>([\s\S]*?)<\/p:cNvPr>/.exec(el);
      const hl = cnv && /<a:hlinkClick\b[^>]*r:id="([^"]+)"/.exec(cnv[1]);
      if (!hl || !ext[hl[1]]) continue;
      const xf = /<a:off x="(-?\d+)" y="(-?\d+)"\/>\s*<a:ext cx="(\d+)" cy="(\d+)"\/>/.exec(el); if (!xf) continue;
      let [ox, oy, cx, cy] = xf.slice(1).map(Number);
      for (let k = stack.length - 1; k >= 0; k--){ const g = stack[k]; if (!g) continue;
        const [gx, gy, gw, gh, chx, chy, chw, chh] = g, sx = chw ? gw / chw : 1, sy = chh ? gh / chh : 1;
        ox = gx + (ox - chx) * sx; oy = gy + (oy - chy) * sy; cx *= sx; cy *= sy; }
      const key = page + ':' + Math.round(ox) + ':' + Math.round(oy) + ':' + ext[hl[1]];
      if (seen.has(key)) continue; seen.add(key);
      out.push({ page, x0: ox / SW, y0: oy / SH, x1: (ox + cx) / SW, y1: (oy + cy) / SH, url: ext[hl[1]] });
    }
  }
  return out;
}

return { digitEdits, slideDigits, isPageNumberSp, slideHeight, contentSlides, coverSlides, coverLatinBytes, coverLatin, slidesNeedingRebuild, slideRebuildBytes, pictureLinks, scan, openZip, cfbStream, parseMTEF, convert, mathParas, textSpans, startsWithMath, slideMathDigits, slidesWithMathDigits, rezip, crc32, mathDigits, fixMathShapesDigits };

})();
if (typeof module !== 'undefined') module.exports = MTC;

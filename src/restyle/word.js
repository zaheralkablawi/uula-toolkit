// UULA Restyle — Word side
// 1) the types a Word user can tag (shared by the Word pane and the PowerPoint import)
// 2) reading a .docx: every tagged part (content control "UULA:<type>") becomes one unit
// 3) turning units into raw slide shapes named "UULA:<type> …", which UR.restyle then styles and lays out
const UW = (() => {
'use strict';
const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const M_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/math';
const A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const WP_NS = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';
const V_NS = 'urn:schemas-microsoft-com:vml';
const PT = 12700;

// ---------- the types ----------
// id, Arabic, English, frame colour in Word (and the swatch in the pane)
const TYPES = [
  { g: 'نصوص', ge: 'Text', items: [
    ['chapter', 'اسم الوحدة', 'Unit', 'A6A6A6'], ['lesson', 'اسم الدرس', 'Lesson', '1F71DD'], ['topic', 'موضوع', 'Topic', '404040'],
    ['body', 'فقرة', 'Paragraph', '8C8C8C'], ['bullets', 'نقاط', 'Bullets', '8C8C8C'], ['qhead', 'عنوان أسئلة', 'Q head', 'C00000'],
    ['question', 'سؤال', 'Question', 'FF0000'], ['choice', 'خيارات', 'Choices', '7030A0'], ['answer', 'حل', 'Solution', '1F71DE'],
    ['correct', 'الخيار الصحيح', 'Correct choice', '2070DF']] },
  { g: 'إطارات', ge: 'Frames', items: [
    ['note', 'ملاحظة', 'Note', 'E69138'], ['def', 'تعريف', 'Definition', '2AB672'], ['quote', 'نص مقتطف', 'Quote', '2AB672'],
    ['formula', 'قوانين', 'Formulas', '5B9BD5'], ['other', 'صيغة أخرى', 'Other form', 'C45A11'], ['activity', 'نشاط', 'Activity', '7F7F7F'],
    ['mars', 'من المريخ', 'Challenge', '595959']] },
  { g: 'أخرى', ge: 'Other', items: [['table', 'جدول', 'Table', '44546A'], ['figure', 'شكل', 'Figure', '00B050'], ['given', 'شكل من السؤال', 'Part of question', 'A6A6A6']] }
];
const TYPE = {};
TYPES.forEach(g => g.items.forEach(([id, ar, en, col]) => { TYPE[id] = { id, ar, en, col }; }));
const TAG = /^UULA:([a-z]+)$/;
// the highlight Word shows on content that is not tagged yet
const UNTAGGED = '#00FFFF';
// an answer of a word or two written inside a question (a blank to fill) stays in its line
const INLINE = ['answer', 'correct'];

// ---------- guessing a type from a paragraph (auto-tag in Word) ----------
const RX = {
  q: /^\s*(س\s*[0-9٠-٩]+|سؤال|السؤال|مثال\s*[0-9٠-٩]*\s*[:：]|علل|اذكر|اُذكر|عرّف|قارن|وضّح|وضح|اشرح|بيّن|ماذا|لماذا|كيف|هل\s|أوجد|اوجد|احسب|بسّط|بسط|حلّ|أثبت|اثبت|ارسم|أكمل|اكمل|اختر|ضع\s|صحح|Q\s*[0-9]|Find|Solve|Prove|Simplify|Evaluate)/i,
  qnum: /^\s*([0-9٠-٩]{1,2}\s*[-.)]|[(]\s*[0-9٠-٩]{1,2}\s*[)])\s*\S/,
  a: /^\s*(ج\s*[0-9٠-٩]*\s*[:/\-]|الجواب|الإجابة|الاجابة|الحل\s*[:：]?|Answer|Solution)/i,
  qhead: /^\s*(أجب|اجب|أمثلة|حاول أن تحل|حاول ان تحل|تدريب|تمارين|التمارين|أسئلة|اسئلة|تحقق من فهمك|Exercises?|Try)/i,
  def: /^\s*(تعريف|المفهوم|Definition)/i,
  formula: /^\s*(قانون|القانون|القوانين|نظرية|النظرية|قاعدة|القاعدة|الصيغة|خاصية|Formula|Theorem|Rule|Property)/i,
  note: /^\s*(ملاحظة|ملاحظه|تنبيه|انتبه|تذكّر|تذكر|هام|مهم|Note|Important|Remember)/i,
  activity: /^\s*(نشاط|Activity)/i,
  mars: /^\s*(إثراء|اثراء|تحدي|تحدٍّ|فكّر|سؤال ذكاء|من المريخ|Challenge)/i,
  quote: /^\s*(قال تعالى|قال رسول الله|قال الشاعر|﴿)/,
  choice: /^\s*([Ⓐ-ⓩ]|[(]?[a-dA-Dأبجد]\s*[)]\s)/,
  other: /^\s*(صيغة أخرى|طريقة أخرى|حل آخر)/,
  qord: /^\s*(أولاً|أولا|ثانياً|ثانيا|ثالثاً|ثالثا|رابعاً|رابعا|خامساً|خامسا)\s*[:：-]/
};
// p: { text, style, color (hex or ''), table, pic, bold, size }
function guess(p) {
  const t = (p.text || '').replace(/ـ/g, '').trim();
  const st = (p.style || '').toLowerCase();
  if (p.table) return 'table';
  if (p.pic && !t) return 'figure';
  if (!t) return null;
  if (/^(title|العنوان)$/.test(st) || /heading 1|عنوان 1/.test(st)) return 'lesson';
  if (/heading [23]|عنوان [23]/.test(st)) return 'topic';
  if (RX.a.test(t)) return 'answer';
  if (RX.qhead.test(t)) return 'qhead';
  if (RX.def.test(t)) return 'def';
  if (RX.formula.test(t)) return 'formula';
  if (RX.note.test(t)) return 'note';
  if (RX.activity.test(t)) return 'activity';
  if (RX.mars.test(t)) return 'mars';
  if (RX.quote.test(t)) return 'quote';
  if (RX.other.test(t)) return 'other';
  if (RX.choice.test(t)) return 'choice';
  if (RX.q.test(t) || RX.qnum.test(t) || RX.qord.test(t) || /(المطلوب|ما يلي|يأتي)\s*[:：]\s*$/.test(t)) return 'question';
  const c = (p.color || '').toUpperCase();
  if (c && isBlue(c)) return 'answer';
  if (c && isRed(c) && t.length < 60) return 'qhead';
  if (p.bold && t.length < 50 && (p.size || 0) >= 14) return 'topic';
  return 'body';
}
function rgb(h) { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function isBlue(h) { if (!/^#?[0-9A-F]{6}$/i.test(h)) return false; const [r, g, b] = rgb(h); return b > 150 && b > r + 60 && b > g + 30; }
function isRed(h) { if (!/^#?[0-9A-F]{6}$/i.test(h)) return false; const [r, g, b] = rgb(h); return r > 170 && g < 90 && b < 90; }
// paragraphs (with guessed types) → groups [{ type, from, to }]: what follows a question / answer / container stays with it
function group(paras) {
  const out = [];
  let cur = null;
  const CONT = { answer: ['body', 'bullets', 'figure', 'choice'], question: ['choice', 'figure', 'given'], note: [], def: [], formula: ['body'], quote: [], other: ['body'], activity: ['body', 'bullets', 'figure'], mars: ['body', 'choice', 'figure'], body: ['bullets'], bullets: ['body', 'bullets'] };
  paras.forEach((p, i) => {
    if (p.skip) return;                                   // already tagged / inside a table handled elsewhere
    const g = p.type;
    if (!g) { if (cur && cur.type !== 'answer') cur = null; return; }   // an empty line ends a group (an answer may hold empty lines)
    if (cur && i === cur.to + 1 && g === cur.type && !['question', 'lesson', 'topic', 'chapter', 'qhead', 'table', 'figure'].includes(g)) { cur.to = i; return; }
    // "- …" lines under a question are its parts
    if (cur && cur.type === 'question' && i <= cur.to + 1 && g === 'body' && /^\s*[-–•▪]/.test(p.text || '')) { cur.to = i; return; }
    if (cur && i <= cur.to + 2 && (CONT[cur.type] || []).includes(g) && !(cur.type === 'question' && g === 'figure' && p.big)) { cur.to = i; if (g === 'choice' && cur.type === 'question') cur.choices = true; return; }
    cur = { type: g, from: i, to: i };
    out.push(cur);
  });
  return out;
}

// ---------- reading a .docx ----------
const parse = s => new DOMParser().parseFromString(s, 'application/xml');
const wk = (el, name) => { for (let c = el && el.firstElementChild; c; c = c.nextElementSibling) if (c.localName === name && c.namespaceURI === W_NS) return c; return null; };
const wa = (el, name) => el ? el.getAttributeNS(W_NS, name) || el.getAttribute('w:' + name) : null;
const isW = (el, name) => el && el.namespaceURI === W_NS && el.localName === name;

// numbering: numId → abstract levels { fmt, text, start }
function readNumbering(xml) {
  const out = { num: {}, abs: {} };
  if (!xml) return out;
  const d = parse(xml);
  for (const a of d.getElementsByTagNameNS(W_NS, 'abstractNum')) {
    const lv = {};
    for (const l of a.getElementsByTagNameNS(W_NS, 'lvl')) {
      lv[wa(l, 'ilvl')] = { fmt: wa(wk(l, 'numFmt'), 'val') || 'decimal', text: wa(wk(l, 'lvlText'), 'val') || '', start: +(wa(wk(l, 'start'), 'val') || 1) };
    }
    out.abs[wa(a, 'abstractNumId')] = lv;
  }
  for (const n of d.getElementsByTagNameNS(W_NS, 'num')) out.num[wa(n, 'numId')] = wa(wk(n, 'abstractNumId'), 'val');
  return out;
}
const ABJAD = 'أبجدهوزحطيكلمنسعفصقرشتثخذضظغ';
const ALPHA = 'أبتثجحخدذرزسشصضطظعغفقكلمنهوي';
function fmtNum(n, fmt) {
  if (fmt === 'lowerLetter') return String.fromCharCode(96 + ((n - 1) % 26) + 1);
  if (fmt === 'upperLetter') return String.fromCharCode(64 + ((n - 1) % 26) + 1);
  if (fmt === 'arabicAbjad') return ABJAD[(n - 1) % ABJAD.length];
  if (fmt === 'arabicAlpha') return ALPHA[(n - 1) % ALPHA.length];
  if (fmt === 'hindiNumbers' || fmt === 'arabicNumbers') return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  if (fmt === 'lowerRoman' || fmt === 'upperRoman') { const r = ['', 'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'][n] || String(n); return fmt === 'upperRoman' ? r.toUpperCase() : r; }
  return String(n);
}

// reads the docx (ArrayBuffer / base64) → { units, report }
// unit: { kind: 'text', role, paras: [{ runs: xml, rtl, math }], math } | { kind: 'table', role, rows } | { kind: 'pic', role, media, ext, cx, cy, inline }
async function read(data, opts) {
  opts = opts || {};
  const zip = await JSZip.loadAsync(data, typeof data === 'string' ? { base64: true } : {});
  const docXml = zip.file('word/document.xml');
  if (!docXml) throw new Error('not a Word file');
  const doc = parse(await docXml.async('string'));
  const relsF = zip.file('word/_rels/document.xml.rels');
  const rels = {};
  if (relsF) for (const r of parse(await relsF.async('string')).getElementsByTagName('Relationship')) rels[r.getAttribute('Id')] = { target: r.getAttribute('Target'), ext: r.getAttribute('TargetMode') === 'External' };
  const numF = zip.file('word/numbering.xml');
  const numbering = readNumbering(numF ? await numF.async('string') : null);
  const counters = {};
  const report = { tagged: 0, untagged: 0, pics: 0, tables: 0, math: 0, inlineObj: 0, skipped: 0 };
  const units = [];
  const media = {};      // rId → { path, ext }
  const mediaOf = rid => {
    if (!rid || !rels[rid] || rels[rid].ext) return null;
    if (media[rid]) return media[rid];
    const path = 'word/' + rels[rid].target.replace(/^\.?\//, '').replace(/^\/?word\//, '');
    const f = zip.file(path) || zip.file(rels[rid].target.replace(/^\//, ''));
    if (!f) return null;
    return (media[rid] = { file: f, ext: (path.split('.').pop() || 'png').toLowerCase() });
  };
  let curText = null;      // the open text unit (paragraphs of the same group join it)
  let gkey = 0;
  const close = () => { curText = null; };
  const pushText = (role, key, para) => {
    if (!curText || curText.key !== key) { curText = { kind: 'text', role, tagged: !!role, key, paras: [] }; units.push(curText); if (role) report.tagged++; else report.untagged++; }
    curText.paras.push(para);
    if (para.math) curText.math = true;
  };

  // paragraph → runs xml (DrawingML) + found pictures
  function convP(p, inherit0) {
    const pPr = wk(p, 'pPr');
    const rtl = !!(pPr && wk(pPr, 'bidi') && wa(wk(pPr, 'bidi'), 'val') !== '0');
    const jc = pPr && wa(wk(pPr, 'jc'), 'val');
    let out = '', text = '', math = false;
    const pics = [];
    // numbering label
    const numPr = pPr && wk(pPr, 'numPr');
    let label = '';
    if (numPr) {
      const id = wa(wk(numPr, 'numId'), 'val'), lvl = wa(wk(numPr, 'ilvl'), 'val') || '0';
      const abs = numbering.abs[numbering.num[id]];
      const L = abs && abs[lvl];
      if (L && L.fmt !== 'none') {
        const key = id + ':' + lvl;
        counters[key] = (counters[key] || (L.start - 1)) + 1;
        for (const k of Object.keys(counters)) if (k.startsWith(id + ':') && +k.split(':')[1] > +lvl) delete counters[k];
        if (L.fmt === 'bullet') label = '• ';
        else label = L.text.replace(/%(\d)/g, (m, d) => { const lv = abs[String(+d - 1)]; return fmtNum(counters[id + ':' + (+d - 1)] || (lv ? lv.start : 1), lv ? lv.fmt : 'decimal'); }) + ' ';
      }
    }
    if (label) { out += runX(label, {}); text += label; }
    const walkRuns = (el, inherit) => {
      for (let c = el.firstElementChild; c; c = c.nextElementSibling) {
        const ln = c.localName, ns = c.namespaceURI;
        if (ns === W_NS && ln === 'r') {
          const rPr = wk(c, 'rPr');
          const st = Object.assign(runStyle(rPr), inherit || {});
          for (let k = c.firstElementChild; k; k = k.nextElementSibling) {
            if (k.namespaceURI !== W_NS && k.localName !== 'AlternateContent') continue;
            const kn = k.localName;
            if (kn === 't') { out += runX(k.textContent, st); text += k.textContent; }
            else if (kn === 'tab') { out += runX('\t', st); text += '\t'; }
            else if (kn === 'br' && wa(k, 'type') !== 'page') out += '<a:br><a:rPr lang="ar-SA"/></a:br>';
            else if (kn === 'sym') { const ch = wa(k, 'char'); if (ch) { const s = String.fromCharCode(parseInt(ch, 16) > 0xF000 ? parseInt(ch, 16) - 0xF000 : parseInt(ch, 16)); out += runX(s, st); text += s; } }
            else if (kn === 'noBreakHyphen') { out += runX('-', st); text += '-'; }
            else if (kn === 'drawing' || kn === 'AlternateContent') { const tb = txbxOf(k); if (tb) boxes.push(tb); pics.push(...picsOf(k)); }
            else if (kn === 'object' || kn === 'pict') { const tb = txbxOf(k); if (tb) boxes.push(tb); else { const pc = vmlPic(k); if (pc) { pc.obj = kn === 'object'; pics.push(pc); } } }
          }
        } else if (ns === M_NS && (ln === 'oMath' || ln === 'oMathPara')) {
          const mx = mathX(c);
          if (mx) { out += '<a14:m>' + mx + '</a14:m>'; text += mathText(c); math = true; }
        } else if (ns === W_NS && ['hyperlink', 'ins', 'smartTag', 'customXml', 'fldSimple', 'dir', 'bdo', 'moveTo'].includes(ln)) walkRuns(c, inherit);
        else if (ns === W_NS && ln === 'sdt') {
          // an inline content control: a tagged part splits the paragraph
          const tag = sdtTag(c);
          const body = wk(c, 'sdtContent');
          if (tag && body && INLINE.includes(tag)) walkRuns(body, Object.assign({}, inherit, { c: tag === 'correct' ? '2070DF' : '1F71DE', bmk: 'UULA:' + tag }));
          else if (tag && body && opts.splitInline !== false) { inlineSplits.push({ at: out.length, tag, body }); }
          else if (body) walkRuns(body, inherit);
        }
      }
    };
    const inlineSplits = [], boxes = [];
    walkRuns(p, inherit0);
    return { runs: out, text, rtl: rtl || /[؀-ۿ]/.test(text), jc, math, pics, inlineSplits, boxes };
  }
  function runStyle(rPr) {
    const st = {};
    if (!rPr) return st;
    const on = n => { const e = wk(rPr, n); return e && !['0', 'false', 'off'].includes(wa(e, 'val') || ''); };
    if (on('b') || on('bCs')) st.b = 1;
    if (on('i') || on('iCs')) st.i = 1;
    if (wk(rPr, 'u') && wa(wk(rPr, 'u'), 'val') !== 'none') st.u = 1;
    const col = wa(wk(rPr, 'color'), 'val');
    if (col && /^[0-9A-F]{6}$/i.test(col)) st.c = col.toUpperCase();
    const sz = wa(wk(rPr, 'sz'), 'val') || wa(wk(rPr, 'szCs'), 'val');
    if (sz) st.sz = +sz * 50;
    const va = wa(wk(rPr, 'vertAlign'), 'val');
    if (va === 'superscript') st.base = 30000; else if (va === 'subscript') st.base = -25000;
    return st;
  }
  // the text inside a text box / shape (first copy when the drawing has a fallback)
  function txbxOf(el) { return el.getElementsByTagNameNS(W_NS, 'txbxContent')[0] || null; }
  // every picture of a drawing, with its crop, rotation and flips (groups and shapes filled with a picture too)
  function picsOf(el) {
    const out = [];
    const inBox = b => { for (let n = b.parentNode; n && n !== el; n = n.parentNode) if (n.localName === 'txbxContent') return true; return false; };
    // a drawing in mc:AlternateContent is there twice (Choice / Fallback): read the first copy only
    const fb = [...el.getElementsByTagName('*')].filter(e => e.localName === 'Fallback');
    const inFb = b => fb.some(f => f.contains(b));
    const blips = [...el.getElementsByTagNameNS(A_NS, 'blip')].filter(b => !inBox(b) && !inFb(b));
    if (!blips.length) return out;
    const ext = el.getElementsByTagNameNS(WP_NS, 'extent')[0];
    const W0 = ext ? +ext.getAttribute('cx') : 0, H0 = ext ? +ext.getAttribute('cy') : 0;
    const grp = [...el.getElementsByTagName('*')].find(e => e.localName === 'grpSpPr' || e.localName === 'wgp');
    let sx = 1, sy = 1;
    if (grp) {
      const gx = [...el.getElementsByTagNameNS(A_NS, 'chExt')][0];
      if (gx && W0) { sx = W0 / Math.max(1, +gx.getAttribute('cx')); sy = H0 / Math.max(1, +gx.getAttribute('cy')); }
    }
    for (const blip of blips) {
      const rid = blip.getAttributeNS(R_NS, 'embed') || blip.getAttribute('r:embed');
      const m = mediaOf(rid); if (!m) continue;
      const fill = blip.parentNode;
      const src = [...fill.children].find(k => k.localName === 'srcRect');
      const crop = src ? ['l', 't', 'r', 'b'].reduce((o, k) => { const v = +(src.getAttribute(k) || 0); if (v) o[k] = v; return o; }, {}) : null;
      // the shape that holds the picture: its own size, rotation and flips
      let host = fill.parentNode;
      while (host && host !== el && ![...host.children].some(k => k.localName === 'spPr')) host = host.parentNode;
      const spPr = host && host !== el ? [...host.children].find(k => k.localName === 'spPr') : null;
      const xf = spPr ? [...spPr.children].find(k => k.localName === 'xfrm') : null;
      const xe = xf ? [...xf.children].find(k => k.localName === 'ext') : null;
      let cx = W0, cy = H0;
      if ((blips.length > 1 || grp || !W0) && xe) { cx = Math.round(+xe.getAttribute('cx') * sx); cy = Math.round(+xe.getAttribute('cy') * sy); }
      if (!cx || !cy) { cx = cx || 2000000; cy = cy || 1500000; }
      out.push({ media: m, cx, cy, crop: crop && Object.keys(crop).length ? crop : null,
        rot: xf ? +(xf.getAttribute('rot') || 0) : 0, flipH: xf && xf.getAttribute('flipH') === '1', flipV: xf && xf.getAttribute('flipV') === '1' });
    }
    return out;
  }
  function vmlPic(el) {
    const im = el.getElementsByTagNameNS(V_NS, 'imagedata')[0];
    if (!im) return null;
    const rid = im.getAttributeNS(R_NS, 'id') || im.getAttribute('r:id');
    const m = mediaOf(rid); if (!m) return null;
    const sh = el.getElementsByTagNameNS(V_NS, 'shape')[0];
    const style = sh ? sh.getAttribute('style') || '' : '';
    const dim = n => { const r = new RegExp(n + ':\\s*([\\d.]+)(pt|in|px)?').exec(style); if (!r) return null; const v = +r[1]; return Math.round(r[2] === 'in' ? v * 914400 : r[2] === 'px' ? v * 9525 : v * PT); };
    return { media: m, cx: dim('width') || 1000000, cy: dim('height') || 300000 };
  }
  const sdtTag = sdt => { const pr = wk(sdt, 'sdtPr'); const t = pr && wk(pr, 'tag'); const v = t && wa(t, 'val'); const m = v && TAG.exec(v); return m && TYPE[m[1]] ? m[1] : null; };

  function handleP(p, role, key) {
    const c = convP(p);
    handleConv(p, c, role, key);
    // text boxes / shapes anchored in this paragraph: their content (and its tags) comes right after it
    for (const tb of c.boxes) { close(); walk(tb, role, role ? key : null); close(); gkey++; }
  }
  function handleConv(p, c, role, key) {
    // pictures in the paragraph
    const picUnits = c.pics.map(pc => {
      report.pics++;
      const small = pc.cy < 34 * PT && c.text.trim();
      if (small && pc.obj) report.inlineObj++;
      const pr = role === 'figure' ? null : ['question', 'choice', 'qhead', 'given'].includes(role) ? 'given' : role;
      return { kind: 'pic', role: pr, tagged: !!role, media: pc.media, cx: pc.cx, cy: pc.cy, crop: pc.crop, rot: pc.rot, flipH: pc.flipH, flipV: pc.flipV, inline: !!small };
    });
    if (c.inlineSplits.length) {
      // text before | tagged inline part | text after (each its own box)
      let pos = 0;
      for (const s of c.inlineSplits) {
        const before = c.runs.slice(pos, s.at);
        if (stripRuns(before)) pushText(role, key, { runs: before, rtl: c.rtl, jc: c.jc });
        close();
        const fake = p.ownerDocument.createElementNS(W_NS, 'w:p');
        for (let k = s.body.firstElementChild; k; k = k.nextElementSibling) fake.appendChild(k.cloneNode(true));
        const ic = convP(fake);
        if (ic.text.trim() || ic.math) pushText(s.tag, 'in' + (++gkey), { runs: ic.runs, rtl: c.rtl, jc: c.jc, math: ic.math });
        close();
        pos = s.at;
      }
      const after = c.runs.slice(pos);
      if (stripRuns(after)) pushText(role, key + 'b' + (++gkey), { runs: after, rtl: c.rtl, jc: c.jc });
      if (c.math) report.math++;
      picUnits.forEach(u => { close(); units.push(u); });
      return;
    }
    const empty = !c.text.trim() && !c.math;
    if (empty) {
      if (!picUnits.length) { if (!role) { close(); gkey++; } return; }
      close(); picUnits.forEach(u => units.push(u)); gkey++;
      return;
    }
    if (c.math) report.math++;
    pushText(role, role ? key : 'u' + gkey, { runs: c.runs, rtl: c.rtl, jc: c.jc, math: c.math, text: c.text });
    if (picUnits.length) { close(); picUnits.forEach(u => units.push(u)); if (!role) gkey++; }
  }
  function handleTbl(tbl, role) {
    close();
    const rows = [];
    for (const tr of [...tbl.children].filter(x => isW(x, 'tr'))) {
      const row = [];
      for (const tc of [...tr.children].filter(x => isW(x, 'tc'))) {
        const tcPr = wk(tc, 'tcPr');
        const span = +(wa(wk(tcPr, 'gridSpan'), 'val') || 1);
        const vm = tcPr && wk(tcPr, 'vMerge');
        const shd = wa(wk(tcPr, 'shd'), 'fill');
        // everything in a table is text; what is tagged «حل» / «الخيار الصحيح» inside a cell is a solution
        const tagIn = p => { for (let n = p.parentNode; n && n !== tc; n = n.parentNode) if (isW(n, 'sdt')) { const tg = sdtTag(n); if (tg) return tg; } return null; };
        const paras = [...tc.getElementsByTagNameNS(W_NS, 'p')].map(p => { const tg = tagIn(p); return convP(p, INLINE.includes(tg) ? { c: tg === 'correct' ? '2070DF' : '1F71DE', bmk: 'UULA:' + tg } : undefined); }).filter(x => x.text.trim() || x.math);
        row.push({ span, vmerge: vm ? (wa(vm, 'val') === 'restart' ? 'restart' : 'cont') : null, fill: shd && /^[0-9A-F]{6}$/i.test(shd) ? shd.toUpperCase() : null, paras });
      }
      rows.push(row);
    }
    if (!rows.length) return;
    let grid = [...(wk(tbl, 'tblGrid') || { children: [] }).children].filter(x => isW(x, 'gridCol')).map(g => +wa(g, 'w') || 0);
    // the cells' own widths are what Word shows (the grid can be stale): take them from the row with the most cells
    const trs = [...tbl.children].filter(x => isW(x, 'tr'));
    let best = null;
    for (const tr of trs) {
      const tcs = [...tr.children].filter(x => isW(x, 'tc'));
      const ws = [];
      let ok = true;
      for (const tc of tcs) {
        const pr = wk(tc, 'tcPr'), w = pr && wk(pr, 'tcW'), span = +(wa(wk(pr, 'gridSpan'), 'val') || 1);
        const v = w ? +wa(w, 'w') : 0, ty = w ? wa(w, 'type') : '';
        if (!v || !(ty === 'dxa' || ty === 'pct' || !ty)) { ok = false; break; }
        for (let k = 0; k < span; k++) ws.push(v / span);
      }
      if (ok && ws.length && (!best || ws.length > best.length)) best = ws;
    }
    if (best && (!grid.length || best.length === grid.length)) grid = best;
    if (!grid.length || grid.some(g => !g)) grid = grid.length ? grid.map(g => g || 1) : [];
    const pr = wk(tbl, 'tblPr');
    const rtl = !!(pr && wk(pr, 'bidiVisual'));
    units.push({ kind: 'table', role: role || 'table', tagged: true, rows, grid, rtl });
    report.tables++;
    gkey++;
  }
  function walk(el, role, key) {
    for (let c = el.firstElementChild; c; c = c.nextElementSibling) {
      if (isW(c, 'p')) handleP(c, role, key);
      else if (isW(c, 'tbl')) handleTbl(c, role);
      else if (isW(c, 'sdt')) {
        const tag = sdtTag(c), body = wk(c, 'sdtContent');
        if (!body) continue;
        if (tag) { close(); const k = 'sdt' + (++gkey); walk(body, tag, k); close(); gkey++; }
        else walk(body, role, key);
      } else if (isW(c, 'customXml') || isW(c, 'ins') || isW(c, 'moveTo')) walk(c, role, key);
    }
  }
  const body = doc.getElementsByTagNameNS(W_NS, 'body')[0];
  walk(body, null, null);
  // pictures: read their bytes now
  // only what was tagged in Word is brought over; the rest is counted so the user can be told
  const all = units.filter(u => u.kind !== 'text' || u.paras.length);
  const kept = opts.all ? all : all.filter(u => u.tagged);
  report.skippedParts = all.length - kept.length;
  report.skippedText = all.filter(u => !u.tagged && u.kind === 'text').map(u => (u.paras[0].text || u.paras[0].runs.replace(/<[^>]+>/g, '')).trim().slice(0, 50));
  for (const u of kept) if (u.kind === 'pic') u.data = await u.media.file.async('base64');
  return { units: kept, report };
}
const stripRuns = x => /<a:t>[^<]*\S|<a14:m>/.test(x);
const xe = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function runX(t, st) {
  if (t == null || t === '') return '';
  const ar = /[؀-ۿ]/.test(t);
  let a = '<a:rPr lang="' + (ar ? 'ar-SA' : 'en-US') + '"' + (st.bmk ? ' bmk="' + st.bmk + '"' : '') + (st.sz ? ' sz="' + Math.max(800, Math.min(4000, st.sz)) + '"' : '') + (st.b ? ' b="1"' : '') + (st.i ? ' i="1"' : '') + (st.u ? ' u="sng"' : '') + (st.base ? ' baseline="' + st.base + '"' : '') + '>';
  if (st.c) a += '<a:solidFill><a:srgbClr val="' + st.c + '"/></a:solidFill>';
  a += '</a:rPr>';
  return '<a:r>' + a + '<a:t>' + xe(t) + '</a:t></a:r>';
}
// OMML from Word → OMML for PowerPoint (run properties become DrawingML)
const MATH_RPR = '<a:rPr xmlns:a="' + A_NS + '" lang="en-US" i="1"><a:latin typeface="Cambria Math" panose="02040503050406030204" pitchFamily="18" charset="0"/><a:cs typeface="Cambria Math" panose="02040503050406030204" pitchFamily="18" charset="0"/></a:rPr>';
function mathX(el) {
  const c = el.cloneNode(true);
  const d = c.ownerDocument;
  const all = [c, ...c.getElementsByTagName('*')];
  for (const e of all.reverse()) {
    if (e.namespaceURI === M_NS) continue;
    if (!e.parentNode) continue;
    if (e.namespaceURI === W_NS && e.localName === 'rPr') {
      const host = e.parentNode;
      const n = new DOMParser().parseFromString(MATH_RPR, 'application/xml').documentElement;
      host.replaceChild(d.importNode(n, true), e);
    } else e.parentNode.removeChild(e);
  }
  // m:r without run properties gets ours (PowerPoint wants them for the font)
  for (const r of c.getElementsByTagNameNS(M_NS, 'r')) {
    if (![...r.children].some(k => k.localName === 'rPr' && k.namespaceURI === A_NS)) {
      const n = new DOMParser().parseFromString(MATH_RPR, 'application/xml').documentElement;
      const t = [...r.children].find(k => k.localName === 't');
      r.insertBefore(d.importNode(n, true), t || null);
    }
  }
  let s = new XMLSerializer().serializeToString(c);
  // keep only the namespaces we use on the root of the math
  s = s.replace(/\s+xmlns:(w|w14|w15|wp|wp14|r|mc|o|v|wps|wpg|wpc|wne|w10|wpi|wps|cx|aink|am3d|w16[a-z]*)="[^"]*"/g, '');
  return s;
}
function mathText(el) { return [...el.getElementsByTagNameNS(M_NS, 't')].map(t => t.textContent).join(''); }

// ---------- units → raw slide shapes ----------
// returns shape xml strings stacked top-down from y0 (the engine lays them out again on the grid)
// ctx: { W (slide width EMU), rels (UR makeRels), nextId(), mediaKey }
function shapes(units, ctx) {
  const CW = ctx.W - 2 * 36 * PT, X0 = 36 * PT;
  let y = ctx.y0 || 60 * PT, n = 0;
  const out = [];
  const nm = (u, base) => (u.role ? 'UULA:' + u.role + ' ' : '') + base + ' ' + (++n);
  for (let k = 0; k < units.length; k++) {
    const u = units[k];
    if (u.kind === 'text') {
      const h = estH(u, CW);
      out.push({ y, h, xml: textSp(u, nm(u, 'Word'), X0, y, CW, h, ctx), unit: u });
      y += h + 2 * 13 * PT;
    } else if (u.kind === 'pic') {
      let w = u.cx, h = u.cy;
      const max = CW * (u.inline ? 0.4 : 1);
      if (w > max) { h = Math.round(h * max / w); w = max; }
      // a narrow picture right after a question / text sits beside it (graph question layout)
      const prev = out[out.length - 1];
      const beside = prev && prev.unit && prev.unit.kind === 'text' && w <= CW * 0.48 && !prev.side && ['question', 'answer', null, 'body', 'choice'].includes(prev.unit.role) && u.role !== 'figure';
      const ext = u.media.ext === 'jpeg' ? 'jpg' : u.media.ext;
      const rid = ctx.rels.image('w' + (ctx.mediaKey++) + '.' + ext, u.data);
      if (beside) {
        const tw = CW - w - 2 * 13 * PT;
        prev.xml = prev.xml.replace(/<a:off x="\d+" y="(\d+)"\/><a:ext cx="\d+"/, (m, yy) => '<a:off x="' + (X0 + w + 2 * 13 * PT) + '" y="' + yy + '"/><a:ext cx="' + tw + '"');
        prev.side = true;
        out.push({ y: prev.y, h, xml: picSp(nm(u, 'Picture'), rid, X0, prev.y, w, h, u), side: true });
        y = Math.max(y, prev.y + h + 2 * 13 * PT);
      } else {
        const x = X0 + Math.round((CW - w) / 2);
        out.push({ y, h, xml: picSp(nm(u, 'Picture'), rid, x, y, w, h, u) });
        y += h + 2 * 13 * PT;
      }
    } else if (u.kind === 'table') {
      const h = u.rows.length * 22 * PT;
      out.push({ y, h, xml: tableX(u, nm(u, 'Table'), X0, y, CW, h, ctx) });
      y += h + 2 * 13 * PT;
    }
  }
  // everything has to start on the slide (shapes below it count as parked outside): squeeze the stack, keeping its order
  const top = ctx.y0 || 60 * PT, bot = Math.max(...out.map(o => o.y + o.h), top), lim = (ctx.H || 9899650) - 70 * PT;
  if (bot > lim) {
    const f = (lim - top) / (bot - top);
    for (const o of out) {
      const ny = Math.round(top + (o.y - top) * f), nh = Math.max(PT, Math.round(o.h * f));
      o.xml = o.xml.replace(/<a:off x="(\d+)" y="\d+"\/><a:ext cx="(\d+)" cy="\d+"\/>/g, (m, x, cx) => '<a:off x="' + x + '" y="' + ny + '"/><a:ext cx="' + cx + '" cy="' + nh + '"/>');
      o.y = ny; o.h = nh;
    }
  }
  return out;
}
function estH(u, w) {
  const cpl = Math.max(10, Math.floor(w / PT / 5.2));
  let lines = 0;
  for (const p of u.paras) { const t = (p.text || p.runs.replace(/<[^>]+>/g, '')).length; lines += Math.max(1, Math.ceil(t / cpl)) * (p.math ? 1.4 : 1); }
  return Math.round(lines * 13.39 * PT + 2 * PT);
}
function paraX(p) {
  const algn = p.jc === 'center' ? 'ctr' : p.rtl ? 'r' : 'l';
  return '<a:p><a:pPr algn="' + algn + '"' + (p.rtl ? ' rtl="1"' : '') + '/>' + p.runs + '<a:endParaRPr lang="ar-SA"/></a:p>';
}
function textSp(u, name, x, y, w, h, ctx) {
  const id = ctx.nextId();
  const sp = (math) => '<p:sp><p:nvSpPr><p:cNvPr id="' + id + '" name="' + xe(name) + '"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>'
    + '<p:spPr><a:xfrm><a:off x="' + x + '" y="' + y + '"/><a:ext cx="' + w + '" cy="' + h + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>'
    + '<p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0"><a:spAutoFit/></a:bodyPr><a:lstStyle/>'
    + u.paras.map(p => paraX(math ? p : Object.assign({}, p, { runs: p.runs.replace(/<a14:m>[\s\S]*?<\/a14:m>/g, '') }))).join('') + '</p:txBody></p:sp>';
  if (!u.math) return sp(false);
  return '<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:a14="http://schemas.microsoft.com/office/drawing/2010/main"><mc:Choice Requires="a14">' + sp(true) + '</mc:Choice><mc:Fallback>' + sp(false) + '</mc:Fallback></mc:AlternateContent>';
}
function picSp(name, rid, x, y, w, h, u) {
  u = u || {};
  const c = u.crop;
  const src = c ? '<a:srcRect' + ['l', 't', 'r', 'b'].map(k => c[k] ? ' ' + k + '="' + c[k] + '"' : '').join('') + '/>' : '';
  const xa = (u.rot ? ' rot="' + u.rot + '"' : '') + (u.flipH ? ' flipH="1"' : '') + (u.flipV ? ' flipV="1"' : '');
  return '<p:pic><p:nvPicPr><p:cNvPr id="0" name="' + xe(name) + '"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>'
    + '<p:blipFill><a:blip r:embed="' + rid + '"/>' + src + '<a:stretch><a:fillRect/></a:stretch></p:blipFill>'
    + '<p:spPr><a:xfrm' + xa + '><a:off x="' + x + '" y="' + y + '"/><a:ext cx="' + w + '" cy="' + h + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>';
}
function tableX(u, name, x, y, w, h, ctx) {
  const ncol = u.grid.length || Math.max(...u.rows.map(r => r.reduce((s, c) => s + c.span, 0)));
  const tot = u.grid.length ? u.grid.reduce((a, b) => a + b, 0) : ncol;
  let cols = (u.grid.length ? u.grid : Array(ncol).fill(1)).map(g => Math.round(w * g / tot));
  // the grid is in reading order in both Word and PowerPoint (rtl="1" shows the first column on the right): no reversing
  // vertical merges: rowSpan on the first cell, vMerge on the rest
  const grid = u.rows.map(r => { const cells = []; let ci = 0; for (const c of r) { cells.push(Object.assign({ ci }, c)); ci += c.span; } return cells; });
  grid.forEach((row, ri) => row.forEach(c => {
    if (c.vmerge === 'restart') { let n = 1; for (let k = ri + 1; k < grid.length; k++) { const o = grid[k].find(z => z.ci === c.ci); if (o && o.vmerge === 'cont') n++; else break; } c.rowSpan = n; }
  }));
  const rowH = 22 * PT;
  let x0 = '<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="' + ctx.nextId() + '" name="' + xe(name) + '"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>'
    + '<p:xfrm><a:off x="' + x + '" y="' + y + '"/><a:ext cx="' + w + '" cy="' + (rowH * u.rows.length) + '"/></p:xfrm>'
    + '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr firstRow="1" bandRow="1"' + (u.rtl ? ' rtl="1"' : '') + '/><a:tblGrid>'
    + cols.map(c => '<a:gridCol w="' + c + '"/>').join('') + '</a:tblGrid>';
  for (const row of grid) {
    x0 += '<a:tr h="' + rowH + '">';
    let used = 0;
    for (const c of row) {
      const paras = c.paras.length ? c.paras.map(p => paraX(Object.assign({}, p, { runs: p.runs.replace(/<a14:m>[\s\S]*?<\/a14:m>/g, m => '') || '' }))).join('') : '<a:p><a:endParaRPr lang="ar-SA"/></a:p>';
      const attrs = (c.span > 1 ? ' gridSpan="' + c.span + '"' : '') + (c.rowSpan > 1 ? ' rowSpan="' + c.rowSpan + '"' : '') + (c.vmerge === 'cont' ? ' vMerge="1"' : '');
      x0 += '<a:tc' + attrs + '><a:txBody><a:bodyPr/><a:lstStyle/>' + (c.vmerge === 'cont' ? '<a:p><a:endParaRPr lang="ar-SA"/></a:p>' : paras) + '</a:txBody><a:tcPr anchor="ctr"/></a:tc>';
      for (let k = 1; k < c.span; k++) x0 += '<a:tc hMerge="1"><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="ar-SA"/></a:p></a:txBody><a:tcPr/></a:tc>';
      used += c.span;
    }
    for (; used < ncol; used++) x0 += '<a:tc><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="ar-SA"/></a:p></a:txBody><a:tcPr/></a:tc>';
    x0 += '</a:tr>';
  }
  return x0 + '</a:tbl></a:graphicData></a:graphic></p:graphicFrame>';
}

// ---------- batches: about one page of content each (the pane then splits what is still too long) ----------
const BOXY = ['note', 'def', 'quote', 'formula', 'other', 'activity', 'mars'];
function batches(units, W, H) {
  const CW = W - 72 * PT, cap = (H - 22.58 * PT - 54 * PT - 20 * PT);
  const hOf = u => u.kind === 'text' ? estH(u, CW) : u.kind === 'pic' ? Math.round(u.cy * Math.min(1, CW / Math.max(1, u.cx))) : u.rows.length * 22 * PT;
  // chains: a heading goes with what follows it, a question with its answer / figure, a text with the picture beside it
  const chains = [];
  let cur = null;
  units.forEach((u, k) => {
    const prev = units[k - 1];
    const join = cur && prev && (['lesson', 'topic', 'qhead', 'chapter'].includes(prev.role)
      || (prev.role === 'question' && (u.role === 'answer' || u.role === 'choice' || u.kind === 'pic'))
      || (u.kind === 'pic' && prev.kind === 'text' && u.cx <= CW * 0.48));
    if (!join) { cur = { units: [], h: 0 }; chains.push(cur); }
    const h = hOf(u);
    const gap = prev && prev.role === 'question' && (u.role === 'answer' || u.role === 'choice') ? 0 : 13.39 * PT;
    if (u.kind === 'pic' && prev && prev.kind === 'text' && u.cx <= CW * 0.48 && cur.units.length) cur.h += Math.max(0, h - hOf(prev));
    else cur.h += h + gap + (BOXY.includes(u.role) ? 2 * 13.39 * PT : 0);
    cur.units.push(u);
  });
  const out = []; let b = [], h = 0;
  for (const c of chains) {
    if (b.length && h + c.h > cap) { out.push(b); b = []; h = 0; }
    b.push(...c.units); h += c.h;
  }
  if (b.length) out.push(b);
  return out;
}

// builds the raw shapes of one batch into a slide package's xml (the old content of the slide is removed)
function fillSlide(pkg, units, opts) {
  opts = opts || {};
  const U = UR.util;
  const doc = UR.parseXml(pkg.files.slide);
  const tree = U.spTreeOf(doc);
  if (opts.clear) for (const el of U.topItems(doc)) {
    const c = U.core(el), n = U.cnvOf(c), name = n ? n.getAttribute('name') || '' : '';
    if (/^CustomPageNumber_/.test(name)) continue;
    tree.removeChild(el);
  }
  let id = U.maxId(doc) + 1;
  const rels = U.makeRels(pkg);
  let y0 = 60 * PT;
  if (!opts.clear) for (const el of U.topItems(doc)) { const g = U.geomOf(el, pkg); if (g && g.y + g.h < pkg.slideH - 54 * PT) y0 = Math.max(y0, g.y + g.h + 26 * PT); }
  const list = shapes(units, { W: pkg.slideW, H: pkg.slideH, rels, nextId: () => id++, mediaKey: opts.mediaKey || 1, y0 });
  for (const s of list) {
    const el = U.frag(doc, s.xml);
    tree.appendChild(el);
  }
  // pictures get ids too
  for (const c of tree.getElementsByTagNameNS(UR.NS.p, 'cNvPr')) if (c.getAttribute('id') === '0') c.setAttribute('id', String(id++));
  pkg.files.slide = UR.serialize(doc);
  pkg.files.rels = UR.serialize(rels.doc);
  return list.length;
}

// the fallback copy of a shape with math (what older readers show) follows the styled copy, with the math as plain text
function syncFallback(xml) {
  const MC = 'http://schemas.openxmlformats.org/markup-compatibility/2006', A14 = 'http://schemas.microsoft.com/office/drawing/2010/main';
  const doc = UR.parseXml(xml);
  for (const ac of [...doc.getElementsByTagNameNS(MC, 'AlternateContent')]) {
    const ch = [...ac.children].find(x => x.localName === 'Choice'), fb = [...ac.children].find(x => x.localName === 'Fallback');
    if (!ch || !fb || !ch.firstElementChild || ch.firstElementChild.localName !== 'sp') continue;
    const sp = ch.firstElementChild;
    const nm = sp.getElementsByTagNameNS(UR.NS.p, 'cNvPr')[0];
    if (!nm || !/ Word \d+/.test(nm.getAttribute('name') || '')) continue;
    const copy = sp.cloneNode(true);
    for (const m of [...copy.getElementsByTagNameNS(A14, 'm')]) {
      const t = [...m.getElementsByTagNameNS(M_NS, 't')].map(x => x.textContent).join('');
      const rPr = m.getElementsByTagNameNS(A_NS, 'rPr')[0];
      const r = doc.createElementNS(A_NS, 'a:r');
      if (rPr) { const c = rPr.cloneNode(true); r.appendChild(c); }
      const at = doc.createElementNS(A_NS, 'a:t'); at.textContent = t; r.appendChild(at);
      m.parentNode.replaceChild(r, m);
    }
    while (fb.firstChild) fb.removeChild(fb.firstChild);
    fb.appendChild(copy);
  }
  return UR.serialize(doc);
}

return { TYPES, TYPE, TAG, INLINE, UNTAGGED, guess, group, read, shapes, batches, fillSlide, syncFallback, isBlue, RX };
})();
if (typeof module !== 'undefined') module.exports = UW;

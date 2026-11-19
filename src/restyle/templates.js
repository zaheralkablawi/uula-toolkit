// UULA Restyle — ready templates for the study guide. Each template is a small spec:
// rows of cells stacked top-down (optionally inside a full-width container).
const URT = (() => {
'use strict';
const { PT, ROW, M, C } = UR;
const U = UR.util;
const T = (t, o) => [t, o || {}];

// paragraph helpers in the UULA style
const P = {
  body: t => U.pX(t, {}),
  bold: t => U.pX(t, { b: 1 }),
  topic: t => U.pX(t, { sz: 1650, b: 1 }),
  qhead: t => U.pX(t, { b: 1, c: C.qhead }),
  q: t => U.pX(t, { q: 1, marL: 182880, indent: -182880 }),
  a: t => U.pX(t, { c: C.answer, marL: 182880 }),
  dot: t => U.pX(t, { dot: 1, marL: 182880, indent: -182880 }),
  src: t => U.pX(t, { b: 1, algn: 'l' }),
  ctr: t => U.pX(t, { b: 1, algn: 'ctr', c: C.formula }),
  runs: (runs, o) => U.pX(runs, o || {})
};

// ---------- the list shown in the pane ----------
// group: section title in the pane; id; name; spec(W)
const LIST = [
  { g: 'عناوين', id: 'header', name: 'اسم الدرس', en: 'Lesson' },
  { g: 'عناوين', id: 'topic', name: 'موضوع', en: 'Topic', full: 'عنوان موضوع' },
  { g: 'نصوص', id: 'body', name: 'فقرة', en: 'Paragraph' },
  { g: 'نصوص', id: 'bullets', name: 'نقاط', en: 'Bullets' },
  { g: 'نصوص', id: 'cols', name: 'أعمدة نقاط', en: 'Columns', full: 'نقاط قصيرة بأعمدة' },
  { g: 'نصوص', id: 'pill', name: 'كبسولة', en: 'Term pill', full: 'كبسولة تعريف' },
  { g: 'أسئلة', id: 'qhead', name: 'عنوان أسئلة', en: 'Q head' },
  { g: 'أسئلة', id: 'question', name: 'سؤال', en: 'Question' },
  { g: 'أسئلة', id: 'qa', name: 'سؤال وجواب', en: 'Q + A' },
  { g: 'أسئلة', id: 'answer', name: 'جواب', en: 'Answer' },
  { g: 'أسئلة', id: 'qqr', name: 'سؤال مع QR', en: 'Q + QR' },
  { g: 'أسئلة', id: 'mcq', name: 'اختيار متعدد', en: 'Choices', full: 'اختيار من متعدد' },
  { g: 'أسئلة', id: 'problem', name: 'مسألة', en: 'Problem', full: 'مسألة: معطيات وقانون وحل' },
  { g: 'أسئلة', id: 'other', name: 'صيغة أخرى', en: 'Other form', full: 'السؤال بصيغة أخرى' },
  { g: 'إطارات', id: 'note', name: 'ملاحظة', en: 'Note', full: 'ملاحظة مهمة' },
  { g: 'إطارات', id: 'quote', name: 'نص مقتطف', en: 'Quote' },
  { g: 'إطارات', id: 'formula', name: 'قوانين', en: 'Formulas', full: 'معادلات وقوانين' },
  { g: 'إطارات', id: 'activity', name: 'نشاط', en: 'Activity' },
  { g: 'إطارات', id: 'mars', name: 'من المريخ', en: 'Challenge', full: 'أسئلة من المريخ' },
  { g: 'إطارات', id: 'cancelled', name: 'محتوى معلّق', en: 'Suspended' },
  { g: 'جداول', id: 'table', name: 'جدول', en: 'Table' },
  { g: 'جداول', id: 'tableMain', name: 'جدول رئيسي', en: 'Main table', full: 'جدول بعمود رئيسي' },
  { g: 'جداول', id: 'solTable', name: 'جدول الحل', en: 'Answers', full: 'جدول حل التمارين الموضوعية' },
  { g: 'نهاية الدرس', id: 'practice', name: 'تدرب وتفوق', en: 'Practice' }
];

// ---------- specs ----------
// cell: { t:'text', xml, x?, w? (EMU, default content width) } | { t:'pic', key, w, h, x? } | { t:'pill', term }
//       | { t:'table', rows, o } ; row: { cells, gap (lines before), side (cells share the top) }
function spec(id, W) {
  const CW = W - 2 * M, R = W - M;
  const txt = (xml, o) => Object.assign({ t: 'text', xml }, o || {});
  switch (id) {
    case 'header': return { fixed: true, rows: [
      { cells: [txt(U.pX('الوحدة 1 / اسم الوحدة', { b: 1, c: C.chapter }))], y: 22.6 * PT },
      { cells: [txt(U.pX('(1 – 1) اسم الدرس', { sz: 2200, b: 1, c: C.lesson }))], y: 42.7 * PT }
    ], gap: 0 };
    case 'topic': return { gap: 3, rows: [{ cells: [txt(P.topic('عنوان الموضوع'))] }] };
    case 'body': return { gap: 1, rows: [{ cells: [txt(P.body('اكتب الفقرة هنا. النص بحجم 11 والكلمات المهمة يمكن جعلها غامقة.'))] }] };
    case 'bullets': return { gap: 1, rows: [{ cells: [txt(P.dot('النقطة الأولى') + P.dot('النقطة الثانية') + P.dot('النقطة الثالثة'))] }] };
    case 'cols': {
      const w = 134 * PT;
      return { gap: 1, rows: [{ side: true, cells: [0, 1, 2].map(k => txt(P.dot(['النقطة الأولى', 'النقطة الثانية', 'النقطة الثالثة'][k]), { x: R - (k + 1) * w, w })) }] };
    }
    case 'pill': return { gap: 1, rows: [{ side: true, cells: [{ t: 'pill', term: 'المصطلح' }, txt(P.body('اكتب التعريف هنا بجانب الكبسولة.'), { pillText: true })] }] };
    case 'qhead': return { gap: 3, rows: [{ cells: [txt(P.qhead('أجب عن الأسئلة التالية:'))] }] };
    case 'question': return { gap: 1, rows: [{ cells: [txt(P.q('اكتب نص السؤال هنا؟'))] }] };
    case 'qa': return { gap: 1, rows: [{ cells: [txt(P.q('اكتب نص السؤال هنا؟'))] }, { gap: 0, cells: [txt(P.a('اكتب الإجابة هنا.'))] }] };
    case 'answer': return { gap: 0, rows: [{ cells: [txt(P.a('اكتب الإجابة هنا.'))] }] };
    case 'qqr': return { gap: 1, rows: [{ side: true, cells: [
      { t: 'pic', key: 'qr', w: 40.4 * PT, h: 46.7 * PT, x: M, name: 'QR' },
      txt(P.q('اكتب نص السؤال هنا؟') + P.a('اكتب الإجابة هنا.'), { x: 86.5 * PT, w: CW - 50.5 * PT })
    ] }] };
    case 'mcq': {
      const w = CW / 4, L = ['ⓐ', 'ⓑ', 'ⓒ', 'ⓓ'];
      return { gap: 1, rows: [
        { cells: [txt(P.q('اكتب نص السؤال هنا؟'))] },
        { gap: 0, side: true, cells: L.map((l, k) => txt(P.runs([T(l + ' '), T(k === 0 ? 'الإجابة الصحيحة' : 'خيار', k === 0 ? { b: 1, c: C.answerOk } : {})], { marL: 182880 }), { x: R - (k + 1) * w, w })) }
      ] };
    }
    case 'problem': return { gap: 1, rows: [
      { cells: [txt(P.q('اكتب نص المسألة هنا؟'))] },
      { gap: 0, cells: [txt(P.runs([T('المعطيات: '), T('اكتب المعطيات هنا', { c: C.givens })], { marL: 182880 }))] },
      { gap: 0, cells: [txt(P.runs([T('القانون: '), T('اكتب القانون هنا', { c: C.formula, b: 1 })], { marL: 182880 }))] },
      { gap: 0, cells: [txt(P.a('الحل: اكتب خطوات الحل هنا.'))] }
    ] };
    case 'other': return { gap: 0, rows: [{ cells: [txt(U.pX('اكتب السؤال بصيغة أخرى هنا', { c: C.otherform }), { x: M + 6 * PT, w: CW - 6 * PT - 24 * PT })] }],
      box: { fill: 'FBEBD3', icon: 'star', name: 'Other Form', small: true } };
    case 'note': return { gap: 1, box: { fill: 'FBEBD3', icon: 'bulb', name: 'Note' }, rows: [
      { cells: [txt(P.bold('ملاحظة مهمه'), { w: CW - 15 * PT })] },
      { gap: 0, cells: [txt(P.body('اكتب نص الملاحظة هنا.'), { w: CW - 15 * PT })] }
    ] };
    case 'quote': return { gap: 1, box: { fill: 'E2F0D9', icon: 'book', line: '2AB672', name: 'Quote' }, rows: [
      { cells: [txt(P.body('اكتب النص المقتطف هنا (آية، حديث، بيت شعر، اقتباس من كتاب).') + P.body('السطر الثاني من النص.') + P.body('السطر الثالث من النص.'), { w: CW - 15 * PT })] },
      { gap: 0, cells: [txt(P.src('المصدر'), { w: CW - 15 * PT })] }
    ] };
    case 'formula': return { gap: 1, box: { fill: 'D3E4F5', name: 'Formula' }, rows: [
      { side: true, cells: [{ t: 'pill', term: 'اسم القانون' }, txt(P.body(''), { pillText: true })] },
      { gap: 1, cells: [txt(U.pX('a² + b² = c²', { b: 1, algn: 'ctr', ar: false }))] }
    ] };
    case 'activity': return { gap: 1, box: { fill: 'F1F1F1', icon: 'palette', name: 'Activity' }, rows: [
      { cells: [txt(P.bold('نشاط'), { w: CW - 15 * PT })] },
      { gap: 0, cells: [txt(P.body('اكتب نص النشاط هنا.'), { w: CW - 15 * PT })] }
    ] };
    case 'mars': return { gap: 1, box: { fill: 'F1F1F1', icon: 'target', name: 'Challenge' }, rows: [
      { cells: [txt(P.bold('أسئلة من المريخ:'), { w: CW - 15 * PT })] },
      { gap: 1, cells: [txt(P.q('اكتب سؤال التحدي هنا؟'), { w: CW - 15 * PT })] }
    ] };
    case 'cancelled': return { gap: 1, box: { frame: 'FFC000', name: 'Cancelled' }, rows: [
      { cells: [txt(U.pX('محتوى معلّق', { b: 1, c: 'FFC000' }))] },
      { gap: 0, cells: [txt(U.pX('اكتب المحتوى المعلّق هنا.', { c: 'FFC000' }))] }
    ] };
    case 'table': return { gap: 1, rows: [{ cells: [{ t: 'table', rows: [['العنوان', 'العنوان', 'العنوان'], ['', '', ''], ['', '', ''], ['', '', '']], o: {} }] }] };
    case 'tableMain': return { gap: 1, rows: [{ cells: [{ t: 'table', rows: [['العنوان', 'العنوان', 'العمود الرئيسي'], ['', '', 'البند'], ['', '', 'البند'], ['', '', 'البند']], o: { mainCol: true } }] }] };
    case 'solTable': {
      const n = 10;
      const head = Array.from({ length: n }, (_, k) => String(n - k)); head.push('السؤال');
      const ans = Array.from({ length: n }, () => 'ⓐ'); ans.push('الحل');
      return { gap: 1, rows: [{ cells: [{ t: 'table', rows: [head, ans], o: { sol: true, name: 'UULA Solution Table', widths: [...Array(n).fill(0.8 / n), 0.2] } }] }] };
    }
    case 'practice': return { gap: 1, box: { grad: true, name: 'Practice', h: 68 * PT }, rows: [
      { side: true, cells: [
        { t: 'pic', key: 'trophy', w: 44.7 * PT, h: 44.7 * PT, x: W - M - 50 * PT, dy: 4 * PT, name: 'Trophy' },
        txt(U.pX('تـــــدرب وتــــفـــوق', { sz: 1400, b: 1, c: '6666FF' }), { x: 160 * PT, w: W - M - 60 * PT - 160 * PT, dy: 13 * PT }),
        { t: 'pic', key: 'qr', w: 40.4 * PT, h: 46.7 * PT, x: M, dy: 10 * PT, name: 'QR' }
      ] },
      { gap: 0, cells: [txt(U.pX('جاوب على أهم أسئلة الدرس واثبت لنا قوتك في هذا الدرس!', { c: '180230' }), { x: 160 * PT, w: W - M - 60 * PT - 160 * PT })] }
    ] };
  }
  return null;
}

// ---------- build XML ----------
// returns { xml, shapes: [{ role, cell, row }], spec }; shapes are in the order they are appended
function build(id, W, top, rels) {
  const s = spec(id, W); if (!s) return null;
  const CW = W - 2 * M;
  const shapes = []; let xml = '';
  const add = (x, meta) => { xml += x; shapes.push(meta); };
  if (s.box) {
    const b = s.box;
    if (b.grad) add(U.gradBoxX(b.name, top, 68 * PT, W), { role: 'box' });
    else if (b.frame) add('<p:sp><p:nvSpPr><p:cNvPr id="' + nid() + '" name="UULA Cancelled Container"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="0" y="' + Math.round(top) + '"/><a:ext cx="' + W + '" cy="' + ROW * 4 + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:ln w="19050"><a:solidFill><a:srgbClr val="FFC000"/></a:solidFill></a:ln></p:spPr><p:txBody><a:bodyPr rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:endParaRPr lang="ar-KW" dirty="0"/></a:p></p:txBody></p:sp>', { role: 'box' });
    else if (b.small) add('<p:sp><p:nvSpPr><p:cNvPr id="' + nid() + '" name="UULA Other Form Container"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="' + M + '" y="' + Math.round(top) + '"/><a:ext cx="' + CW + '" cy="' + ROW * 2 + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="FBEBD3"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:endParaRPr lang="ar-KW" dirty="0"/></a:p></p:txBody></p:sp>', { role: 'box' });
    else add(U.boxX(b.name, top, ROW * 4, b.fill, W), { role: 'box' });
    if (b.icon) {
      const bulb = b.icon === 'bulb';
      add(U.picX('UULA ' + b.name + ' Icon', rels.image(b.icon), 0, 0, (bulb ? 11.1 : 14.1) * PT, (bulb ? 15.4 : 15.9) * PT), { role: 'icon' });
    }
    if (b.line) add(U.lineX(0, 0, ROW, b.line), { role: 'line' });
  }
  s.rows.forEach((r, ri) => r.cells.forEach((c, ci) => {
    const meta = { role: 'cell', row: ri, cell: ci, t: c.t };
    if (c.t === 'text') add(U.txX('UULA ' + id, c.x != null ? c.x : M, 0, c.w != null ? c.w : CW, ROW, c.xml), meta);
    else if (c.t === 'pic') add(U.picX('UULA ' + (c.name || c.key), rels.image(c.key), c.x != null ? c.x : M, 0, c.w, c.h), meta);
    else if (c.t === 'pill') add(U.pillX(c.term, 0, 0, U.pillW(c.term)), meta);
    else if (c.t === 'table') add(U.tableX(c.rows, W, c.o), meta);
  }));
  return { xml, shapes, spec: s };
}
let NID = 5000;
function nid() { return String(NID++); }

// positions for the template shapes, given their heights (EMU; text heights from PowerPoint or estimates)
// returns array (same order as shapes) of { x, y, w, h } (missing fields = keep)
function place(id, W, top, built, heights) {
  const s = built.spec, CW = W - 2 * M, out = built.shapes.map(() => ({}));
  const hOf = (k, def) => heights && heights[k] != null ? heights[k] : def;
  const box = s.box;
  const boxK = built.shapes.findIndex(x => x.role === 'box');
  let y = top + (box && !box.small ? ROW : 0);
  if (box && box.small) y = top + 4 * PT;
  const x1 = box && box.icon && !box.small ? W - M - 15 * PT : W - M;
  let bottom = y;
  s.rows.forEach((r, ri) => {
    if (s.fixed) y = r.y;
    else if (ri > 0) y = bottom + (r.gap != null ? r.gap : 1) * ROW;
    let rb = y;
    let pillW = 0;
    r.cells.forEach((c, ci) => {
      const k = built.shapes.findIndex(x => x.role === 'cell' && x.row === ri && x.cell === ci);
      const yy = y + (c.dy || 0);
      if (c.t === 'pill') {
        pillW = U.pillW(c.term);
        out[k] = { x: x1 - pillW, y: yy, w: pillW, h: 254000 };
        rb = Math.max(rb, yy + 254000);
      } else if (c.t === 'text') {
        let x = c.x != null ? c.x : M, w = c.w != null ? c.w : (x1 - M);
        if (c.pillText) { w = Math.max(40 * PT, x1 - pillW - 8 * PT - M); }
        const h = hOf(k, ROW);
        out[k] = { x, y: yy + (c.pillText ? 1.5 * PT : 0), w };
        rb = Math.max(rb, yy + h);
      } else if (c.t === 'pic') {
        out[k] = { x: c.x != null ? c.x : M, y: yy, w: c.w, h: c.h };
        rb = Math.max(rb, yy + c.h);
      } else if (c.t === 'table') {
        out[k] = { x: M, y: yy };
        rb = Math.max(rb, yy + c.rows.length * 254000);
      }
    });
    bottom = rb;
  });
  if (box) {
    const bk = boxK;
    let h = box.small ? (bottom - top + 4 * PT) : (bottom + 2 * ROW - top);
    if (box.h) h = Math.max(box.h, h);
    out[bk] = box.small ? { x: M, y: top, w: CW, h } : { x: 0, y: top, w: W, h };
    const ik = built.shapes.findIndex(x => x.role === 'icon');
    if (ik >= 0) out[ik] = box.small ? { x: W - M - 18 * PT, y: top + 2 * PT } : { x: W - 47 * PT, y: top + ROW - 2 * PT };
    const lk = built.shapes.findIndex(x => x.role === 'line');
    if (lk >= 0) out[lk] = { x: W - 40 * PT, y: top + ROW + 17 * PT, w: 0, h: Math.max(ROW, bottom - (top + ROW + 17 * PT)) };
    bottom = top + h;
  }
  return { pos: out, bottom };
}

// where a template goes: under the lowest content of the slide (or at the top of an empty slide)
function freeTop(pkg, gapRows, fixed) {
  const doc = UR.parseXml(pkg.files.slide);
  const W = pkg.slideW, H = pkg.slideH;
  let low = null, hasHeader = false;
  for (const el of U.topItems(doc)) {
    const c = U.core(el), n = U.cnvOf(c), name = n ? n.getAttribute('name') || '' : '';
    if (/^UULA (Footer|Watermark)|^CustomPageNumber_/.test(name)) continue;
    const ph = c.firstElementChild && U.desc(c.firstElementChild, 'p', 'ph')[0];
    if (ph && ['sldNum', 'ftr', 'dt'].includes(ph.getAttribute('type'))) continue;
    const g = U.geomOf(el, pkg); if (!g) continue;
    if (g.x + g.w <= 0 || g.x >= W || g.y >= H - UR.FOOT * 0.6) continue;        // outside the slide / in the footer
    if (g.w > W * 0.85 && g.h > H * 0.6) continue;                               // background picture
    if (g.y < 75 * PT && g.y + g.h < 75 * PT) hasHeader = true;
    low = low == null ? g.y + g.h : Math.max(low, g.y + g.h);
  }
  if (fixed) return { top: 0, empty: low == null };
  if (low == null) return { top: Math.round(22.6 * PT), empty: true };
  return { top: Math.round(low + gapRows * ROW), empty: false };
}

// put a template on a slide package; returns the new slide XML + what is needed to refine it later
function apply(pkg, id) {
  const s = spec(id, pkg.slideW); if (!s) throw new Error('template?');
  const doc = UR.parseXml(pkg.files.slide);
  const mx = U.maxId(doc);
  U.setNext(mx + 1); NID = mx + 600;
  const ft = freeTop(pkg, s.gap != null ? s.gap : 1, s.fixed);
  const rels = U.makeRels(pkg);
  const built = build(id, pkg.slideW, ft.top, rels);
  const wrap0 = UR.parseXml('<w xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' + built.xml + '</w>').documentElement;
  // estimated text heights (PowerPoint gives the real ones after insertion)
  const est = [...wrap0.children].map((el, k) => {
    const m = built.shapes[k]; if (!m || m.t !== 'text') return null;
    const x = U.xfrmOf(U.core(el)); const w = x ? +U.kid(x, 'ext', 'a').getAttribute('cx') : pkg.slideW - 2 * M;
    return U.estimateText(U.core(el), w);
  });
  const pl = place(id, pkg.slideW, ft.top, built, est);
  pl.pos.forEach((p, k) => { if (est[k] != null && p && p.h == null) p.h = est[k]; });
  const wrap = UR.parseXml('<w xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' + built.xml + '</w>').documentElement;
  const tree = U.spTreeOf(doc);
  const els = [...wrap.children].map(n => doc.importNode(n, true));
  els.forEach((el, k) => {
    tree.appendChild(el);
    const p = pl.pos[k]; if (!p) return;
    const c = U.core(el);
    const x = U.xfrmOf(c); if (!x) return;
    const off = U.kid(x, 'off', 'a'), ext = U.kid(x, 'ext', 'a');
    if (p.x != null) off.setAttribute('x', Math.round(p.x)); if (p.y != null) off.setAttribute('y', Math.round(p.y));
    if (p.w != null) ext.setAttribute('cx', Math.round(p.w)); if (p.h != null) ext.setAttribute('cy', Math.round(p.h));
  });
  const total = U.topItems(doc).length;
  UR.markNames(doc);
  return { xml: UR.serialize(doc), rels, built, top: ft.top, first: total - els.length, count: els.length, bottom: pl.bottom, fits: pl.bottom <= pkg.slideH - UR.FOOT };
}

const GROUP_EN = { 'عناوين': 'Headings', 'نصوص': 'Text', 'أسئلة': 'Questions', 'إطارات': 'Frames', 'جداول': 'Tables', 'نهاية الدرس': 'Lesson end' };
return { LIST, GROUP_EN, spec, build, place, freeTop, apply };
})();
if (typeof module !== 'undefined') module.exports = URT;

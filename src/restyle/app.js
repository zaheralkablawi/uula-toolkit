(() => {
'use strict';
const $ = id => document.getElementById(id);
const VER = '1.1';
const PT = UR.PT;
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const load = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
let lang = load('ur-lang', 'ar');
const L = (ar, en) => lang === 'en' ? en : ar;
let scope = load('ur-scope', 'cur'); if (scope !== 'all') scope = 'cur';
let busy = false, supported = false;

// ---------- status / results ----------
const status = $('status'), res = $('res');
const say = (m, cls) => { status.textContent = m || ''; status.className = 'status' + (cls ? ' ' + cls : ''); };
const tsay = m => say(m);
const prog = f => { $('prog').hidden = f == null; if (f != null) $('prog').firstElementChild.style.width = Math.round(f * 100) + '%'; };
function line(cls, html) { const d = document.createElement('div'); d.className = 'ln ' + cls; d.innerHTML = html; res.appendChild(d); return d; }
const slideLinks = (ids, num) => ids.map(id => '<a data-id="' + id + '">' + num(id) + '</a>').join('، ');
res.addEventListener('click', e => {
  const a = e.target.closest('a[data-id]'); if (!a) return;
  PowerPoint.run(async ctx => { ctx.presentation.setSelectedSlides([a.dataset.id]); await ctx.sync(); }).catch(() => {});
});
const errText = e => { const loc = e && e.debugInfo && e.debugInfo.errorLocation; return (e && (e.code || e.message) || String(e)) + (loc ? ' (' + loc + ')' : ''); };
const cnt = n => lang === 'en' ? (n === 1 ? '1 slide' : n + ' slides') : n === 1 ? 'شريحة واحدة' : n === 2 ? 'شريحتان' : n <= 10 ? n + ' شرائح' : n + ' شريحة';
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// ---------- Office helpers ----------
const run = f => PowerPoint.run(f);
async function targetIds() {
  return run(async ctx => {
    const col = scope === 'cur' ? ctx.presentation.getSelectedSlides() : ctx.presentation.slides;
    col.load('items/id'); await ctx.sync();
    const ids = col.items.map(s => s.id);
    return scope === 'cur' ? ids.slice(0, 1) : ids;
  });
}
async function allIds() { return run(async ctx => { const s = ctx.presentation.slides; s.load('items/id'); await ctx.sync(); return s.items.map(x => x.id); }); }
async function currentId() { return run(async ctx => { const s = ctx.presentation.getSelectedSlides(); s.load('items/id'); await ctx.sync(); return s.items.length ? s.items[0].id : null; }); }
async function exportSlide(id) { return run(async ctx => { const r = ctx.presentation.slides.getItem(id).exportAsBase64(); await ctx.sync(); return r.value; }); }
async function deleteSlide(id) { return run(async ctx => { ctx.presentation.slides.getItem(id).delete(); await ctx.sync(); }); }
async function insertAfter(b64, afterId) {
  const before = await allIds();
  const tryIns = async target => run(async ctx => {
    ctx.presentation.insertSlidesFromBase64(b64, { formatting: 'UseDestinationTheme', targetSlideId: target });
    await ctx.sync();
  });
  try { await tryIns(afterId); }
  catch (e) { await tryIns(String(afterId).split('#')[0] + '#'); }
  const ids = await allIds();
  const fresh = ids.find(i => !before.includes(i));
  return fresh || ids[ids.indexOf(afterId) + 1];
}
// the shapes of a slide by their " #ur<n>" mark
async function shapesByMark(ctx, slideId) {
  const shapes = ctx.presentation.slides.getItem(slideId).shapes;
  shapes.load('items/id,items/name,items/type'); await ctx.sync();
  const map = {};
  for (const s of shapes.items) { const m = / #ur(\d+)$/.exec(s.name || ''); if (m) map[+m[1]] = s; }
  return { map, shapes };
}
// the text items of a plan (with the width they get from a first layout)
function textItems(plan) {
  const out = [];
  const add = it => { if (it.kind === 'text') out.push(it); };
  plan.header.forEach(add);
  plan.blocks.forEach(b => (b.type === 'box' ? b.rows : [b]).forEach(r => r.cols.forEach(c => c.forEach(add))));
  return out;
}
// real text heights from PowerPoint, then the final positions
async function refine(slideId, plan) {
  return run(async ctx => {
    const { map } = await shapesByMark(ctx, slideId);
    const first = UR.layout(plan, null);
    const texts = textItems(plan).filter(it => map[it.idx]);
    for (const it of texts) {
      const s = map[it.idx], p = first.pos[it.idx];
      if (p && p.w) { s.width = p.w / PT; }
      try { s.textFrame.wordWrap = true; s.textFrame.autoSizeSetting = 'AutoSizeShapeToFitText'; } catch (e) {}
    }
    await ctx.sync();
    const tables = [];
    plan.blocks.forEach(b => (b.type === 'box' ? b.rows : [b]).forEach(r => r.cols.forEach(c => c.forEach(it => { if (it.kind === 'table' && map[it.idx]) tables.push(it); }))));
    [...texts, ...tables].forEach(it => map[it.idx].load('height'));
    await ctx.sync();
    const heights = {};
    for (const it of [...texts, ...tables]) heights[it.idx] = Math.round(map[it.idx].height * PT);
    const lay = UR.layout(plan, heights);
    for (const [k, p] of Object.entries(lay.pos)) {
      const s = map[+k]; if (!s) continue;
      if (p.hide) { s.delete(); continue; }
      if (p.x != null) s.left = p.x / PT;
      if (p.y != null) s.top = p.y / PT;
      if (!p.keep) {
        if (p.w != null && p.w > 0) s.width = p.w / PT;
        if (p.h != null && p.h > 0) s.height = p.h / PT;
      }
    }
    await ctx.sync();
    return lay;
  });
}
// remove the " #ur<n>" marks
async function unmark(slideId) {
  return run(async ctx => {
    const shapes = ctx.presentation.slides.getItem(slideId).shapes;
    shapes.load('items/name'); await ctx.sync();
    for (const s of shapes.items) if (/ #ur\d+$/.test(s.name || '')) s.name = s.name.replace(/ #ur\d+$/, '');
    await ctx.sync();
  }).catch(() => {});
}

// ---------- convert ----------
// The converted slide replaces the original in place (same number of slides).
// A slide longer than the page is NOT split on its own: the pane asks first.
const MAX_PARTS = 6;
const pendingSplit = new Map();      // slide id -> { pkg, rels, xml, plan }
async function convertOne(id, opts, rep) {
  const b64 = await exportSlide(id);
  const pkg = await UR.openPackage(b64);
  let r;
  try { r = UR.restyle(pkg, { watermark: opts.watermark }); }
  catch (e) { throw new Error(L('تحليل الشريحة: ', 'Reading the slide: ') + errText(e)); }
  let newId;
  try { newId = await insertAfter(await UR.buildPackage(pkg, r.xml, r.rels), id); }
  catch (e) { throw new Error(L('إدراج الشريحة: ', 'Inserting the slide: ') + errText(e)); }
  const lay = await refine(newId, r.plan);
  await unmark(newId);
  await deleteSlide(id);
  if (lay.overflow >= 0 && UR.splitPoint(r.plan, lay) > 0) { pendingSplit.set(newId, { pkg, rels: r.rels, xml: r.xml, plan: r.plan }); rep.full.push(newId); }
  else if (lay.overflow >= 0) rep.tooLong.push(newId);
  rep.boxes += r.report.boxes; rep.tables += r.report.tables;
  r.report.links.forEach(u => rep.links.push(u)); r.report.linkFail.forEach(u => rep.linkFail.push(u));
  if (r.report.qr) rep.qr += r.report.qr;
  return newId;
}
// split a long slide into as many slides as needed (only after the user agrees)
async function splitSlide(id) {
  const st = pendingSplit.get(id); if (!st) return [id];
  const queue = [{ xml: st.xml, plan: st.plan }];
  let prev = id, made = [], parts = 0;
  while (queue.length) {
    const part = queue.shift();
    const newId = await insertAfter(await UR.buildPackage(st.pkg, part.xml, st.rels), prev);
    const lay = await refine(newId, part.plan);
    if (lay.overflow >= 0 && parts < MAX_PARTS) {
      const k = UR.splitPoint(part.plan, lay);
      if (k > 0) { await deleteSlide(newId); const [A, B] = UR.splitParts(part.xml, part.plan, k); queue.unshift(A, B); parts++; continue; }
    }
    await unmark(newId);
    made.push(newId); prev = newId;
  }
  await deleteSlide(id);
  pendingSplit.delete(id);
  return made;
}
async function askSplit(ids) {
  if (busy) return;
  busy = true; lock();
  try {
    let added = 0;
    for (let k = 0; k < ids.length; k++) {
      say(L('تقسيم الشريحة ', 'Splitting slide ') + (k + 1) + L(' من ', ' of ') + ids.length + '…');
      const made = await splitSlide(ids[k]); added += made.length - 1;
    }
    if ($('numChk').checked) await renumber();
    const box = res.querySelector('.splitask'); if (box) box.remove();
    say(added ? L('تم التقسيم، وأُضيفت ', 'Split; added ') + cnt(added) + '.' : L('تم.', 'Done.'));
  } catch (e) { say(L('تعذّر التقسيم: ', 'Could not split: ') + errText(e)); }
  finally { busy = false; lock(); }
}
async function doConvert() {
  const ids = await targetIds();
  if (!ids.length) { say(L('حدّد شريحة أولًا.', 'Select a slide first.')); return; }
  pendingSplit.clear();
  const rep = { done: [], full: [], tooLong: [], errs: [], boxes: 0, tables: 0, links: [], linkFail: [], qr: 0 };
  const opts = {};
  for (let k = 0; k < ids.length; k++) {
    prog(k / ids.length); say(L('تحويل الشريحة ', 'Restyling slide ') + (k + 1) + L(' من ', ' of ') + ids.length + '…');
    try { const nid = await convertOne(ids[k], opts, rep); rep.done.push(nid); if (scope === 'cur') await run(async ctx => { ctx.presentation.setSelectedSlides([nid]); await ctx.sync(); }).catch(() => {}); }
    catch (e) { rep.errs.push(errText(e)); }
  }
  prog(null);
  if ($('numChk').checked && rep.done.length) { say(L('ترقيم الصفحات…', 'Numbering pages…')); try { await renumber(); } catch (e) { rep.errs.push(L('الترقيم: ', 'Numbering: ') + errText(e)); } }
  const all = await allIds(), num = i => all.indexOf(i) + 1;
  res.innerHTML = '';
  if (rep.done.length) line('ok', L('✓ تم تحويل ', '✓ Restyled ') + cnt(rep.done.length) + ': ' + slideLinks(rep.done, num));
  if (rep.full.length) {
    const d = line('warn splitask', L('• أطول من الصفحة: ', '• Longer than the page: ') + slideLinks(rep.full, num)
      + '<br><span style="display:flex;gap:6px;margin-top:4px"><button type="button" class="mini" data-split="yes">' + L('قسّمها إلى شرائح جديدة', 'Split into new slides') + '</button><button type="button" class="mini" data-split="no">' + L('لا، اتركها', 'No, leave it') + '</button></span>');
    d.style.display = 'block';
    const list = rep.full.slice();
    d.querySelector('[data-split="yes"]').addEventListener('click', () => askSplit(list));
    d.querySelector('[data-split="no"]').addEventListener('click', () => { d.remove(); list.forEach(i => pendingSplit.delete(i)); });
  }
  if (rep.tooLong.length) line('err', L('• أطول من الصفحة ولا يمكن تقسيمها، راجعها: ', '• Too long and cannot be split, check: ') + slideLinks(rep.tooLong, num));
  if (rep.qr) line('ok', L('• استُبدل QR جديد: ', '• New QR placed: ') + rep.qr + (rep.links.length ? L(' (رُبط الرابط)', ' (link added)') : ''));
  rep.linkFail.forEach(u => line('warn', L('• أضف هذا الرابط للـQR يدويًا: ', '• Add this link to the QR yourself: ') + '<span dir="ltr">' + esc(u) + '</span>'));
  rep.errs.forEach(m => line('err', '✗ ' + esc(m)));
  if (rep.done.length) line('', '<span class="note">' + L('يلزم تثبيت خط UULA Sans على الجهاز.', 'The UULA Sans font must be installed.') + '</span>');
  say(rep.done.length ? L('تم التحويل.', 'Restyled.') : L('لم يتم تحويل أي شريحة.', 'No slide was restyled.'));
}

// ---------- page numbers ----------
function docSettings() { try { return Office.context.document.settings; } catch (e) { return null; } }
function numStart() { return Math.max(1, parseInt($('numStart').value, 10) || 1); }
let slideSize = null;
async function getSize() {
  if (slideSize) return slideSize;
  try { const id = (await allIds())[0]; const pkg = await UR.openPackage(await exportSlide(id)); slideSize = { W: pkg.slideW / PT, H: pkg.slideH / PT }; }
  catch (e) { slideSize = { W: 540, H: 779.5 }; }
  return slideSize;
}
async function renumber() {
  const start = numStart();
  const { W, H } = await getSize();
  await run(async ctx => {
    const slides = ctx.presentation.slides; slides.load('items/id'); await ctx.sync();
    const cols = slides.items.map(s => { const sh = s.shapes; sh.load('items/name,items/id'); return sh; });
    await ctx.sync();
    slides.items.forEach((s, i) => {
      const n = i + 1 - start + 1;
      const boxes = cols[i].items.filter(x => /^CustomPageNumber_/.test(x.name || ''));
      if (n < 1) { boxes.forEach(b => b.delete()); return; }
      if (boxes.length) {
        boxes.slice(1).forEach(b => b.delete());
        const b = boxes[0]; b.name = 'CustomPageNumber_' + n; b.textFrame.textRange.text = String(n);
      } else {
        const tb = s.shapes.addTextBox(String(n), { left: W / 2 - 25, top: H - 34.5, width: 50, height: 20.6 });
        tb.name = 'CustomPageNumber_' + n;
        const tf = tb.textFrame; tf.leftMargin = 0; tf.rightMargin = 0; tf.topMargin = 0; tf.bottomMargin = 0;
        tf.verticalAlignment = 'Middle'; tf.autoSizeSetting = 'AutoSizeNone';
        const f = tf.textRange.font; f.name = 'UULA Sans'; f.size = 11; f.color = '#A6A6A6';
        tf.textRange.paragraphFormat.horizontalAlignment = 'Center';
      }
    });
    await ctx.sync();
  });
}
$('numHere').addEventListener('click', async () => {
  if (!supported) return;
  try { const id = await currentId(); const all = await allIds(); const i = all.indexOf(id); if (i >= 0) { $('numStart').value = i + 1; saveNum(); } } catch (e) {}
});
function saveNum() { const s = docSettings(); if (s) { s.set('urNumStart', numStart()); s.set('urNum', $('numChk').checked); s.saveAsync(); } $('numRow').style.opacity = $('numChk').checked ? '' : '.5'; }
$('numStart').addEventListener('change', saveNum);
$('numChk').addEventListener('change', saveNum);
$('numAll').addEventListener('click', async () => {
  if (busy || !supported) return;
  busy = true; lock();
  try { say(L('ترقيم الصفحات…', 'Numbering pages…')); await renumber(); say(L('تم تحديث أرقام الصفحات.', 'Page numbers updated.')); }
  catch (e) { say(L('تعذّر الترقيم: ', 'Could not number pages: ') + errText(e)); }
  finally { busy = false; lock(); }
});

// ---------- templates ----------
const SW = { header: '1F71DD', topic: '000000', body: 'FFFFFF', bullets: 'FFFFFF', cols: 'FFFFFF', pill: '1F71DC', qhead: 'FF0000', question: 'FF0000', qa: '1F71DE', answer: '1F71DE', qqr: 'FF0000', mcq: 'FF0000', problem: '00B050', other: 'FBEBD3',
  note: 'FBEBD3', quote: 'E2F0D9', formula: 'D3E4F5', activity: 'F1F1F1', mars: 'F1F1F1', cancelled: 'FFC000', table: 'CAD0D8', tableMain: 'DAE0E9', solTable: 'CAD0D8', practice: 'EBE6FE' };
function buildTemplateList() {
  const host = $('tpls'); host.innerHTML = '';
  const groups = [];
  for (const t of URT.LIST) { let g = groups.find(x => x.name === t.g); if (!g) groups.push(g = { name: t.g, items: [] }); g.items.push(t); }
  for (const g of groups) {
    const d = document.createElement('div'); d.className = 'tgroup';
    d.innerHTML = '<div class="gt">' + L(g.name, URT.GROUP_EN[g.name] || g.name) + '</div>';
    const grid = document.createElement('div'); grid.className = 'tgrid';
    for (const t of g.items) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'tbtn'; b.dataset.id = t.id;
      b.title = L(t.full || t.name, t.en); b.innerHTML = '<i style="background:#' + (SW[t.id] || 'FFFFFF') + '"></i><span>' + L(t.name, t.en) + '</span>';
      grid.appendChild(b);
    }
    d.appendChild(grid); host.appendChild(d);
  }
}
$('tpls').addEventListener('click', e => { const b = e.target.closest('.tbtn'); if (b) insertTemplate(b.dataset.id); });
// a container chosen while objects are selected: it goes around them (without the template's own text)
async function wrapSelected(id, tid) {
  const n = await run(async ctx => {
    const shapes = ctx.presentation.getSelectedShapes(); shapes.load('items/name'); await ctx.sync();
    if (!shapes.items.length) return 0;
    shapes.items.forEach(s => { s.name = (s.name || '').replace(/ #ursel$/, '') + ' #ursel'; });
    await ctx.sync();
    return shapes.items.length;
  }).catch(() => 0);
  if (!n) return false;
  const pkg = await UR.openPackage(await exportSlide(id));
  let r;
  try { r = UR.wrapBox(pkg, UR.WRAP[tid]); }
  catch (e) { await clearSel(id); throw e; }
  const newId = await insertAfter(await UR.buildPackage(pkg, r.xml, r.rels), id);
  await deleteSlide(id);
  await run(async ctx => {
    const sh = ctx.presentation.slides.getItem(newId).shapes;
    sh.load('items/name,items/left,items/top,items/width,items/height'); await ctx.sync();
    const byIdx = {}; sh.items.forEach((s, k) => { const m = / #ur(\d+)$/.exec(s.name || ''); if (m) byIdx[+m[1]] = k; });
    const sel = r.sel.map(i => byIdx[i]).filter(k => k != null);
    // real sizes: the container fits around what it holds
    const y0 = Math.min(...sel.map(k => sh.items[k].top)), y1 = Math.max(...sel.map(k => sh.items[k].top + sh.items[k].height));
    const G = 13.39;
    const bk = byIdx[r.box];
    if (bk != null) { const b = sh.items[bk]; b.top = r.small ? y0 - 4 : y0 - G; b.height = Math.max(r.minH / PT, r.small ? (y1 - y0) + 8 : (y1 - y0) + 3 * G); }
    if (r.icon != null && byIdx[r.icon] != null && !r.small) sh.items[byIdx[r.icon]].top = y0 - G + G - 2;
    if (r.line != null && byIdx[r.line] != null) { const l = sh.items[byIdx[r.line]]; l.top = y0 + 17; l.height = Math.max(G, (y1 - y0) - 17); }
    await ctx.sync();
    sh.items.forEach(s => s.load('left,top,width,height')); await ctx.sync();
    // on the page grid, and what is under it moves with two grid steps
    const H = r.H / PT;
    const rects = sh.items.map((s, k) => ({ key: k, x: s.left * PT, y: s.top * PT, w: s.width * PT, h: s.height * PT,
      fixed: /^UULA (Footer|Watermark)|^CustomPageNumber_/.test((s.name || '').replace(/ #ur\d+$/, '')) || s.top > H - 54 || s.left + s.width <= 0 || s.left >= r.W / PT }));
    const group = [...sel, bk, r.icon != null ? byIdx[r.icon] : null, r.line != null ? byIdx[r.line] : null].filter(k => k != null);
    const mv = UR.reflow(rects, group, { keepX: true });
    for (const [k, m] of Object.entries(mv)) if (m.y != null) sh.items[+k].top = m.y / PT;
    await ctx.sync();
    ctx.presentation.setSelectedSlides([newId]); await ctx.sync();
  });
  await unmark(newId);
  return true;
}
async function insertTemplate(tid) {
  if (busy || !supported) return;
  busy = true; lock(); tsay('');
  try {
    const id = await currentId();
    if (!id) { tsay(L('حدّد شريحة أولًا.', 'Select a slide first.')); return; }
    if (UR.WRAP[tid] && await wrapSelected(id, tid)) { tsay(L('وُضعت الحاوية حول العناصر المحددة.', 'The container was put around the selected objects.')); return; }
    const pkg = await UR.openPackage(await exportSlide(id));
    const r = URT.apply(pkg, tid);
    const newId = await insertAfter(await UR.buildPackage(pkg, r.xml, r.rels), id);
    await deleteSlide(id);
    // real text heights, then place the template again
    await run(async ctx => {
      const { map } = await shapesByMark(ctx, newId);
      const idx = Array.from({ length: r.count }, (_, k) => r.first + k);
      const texts = idx.filter((i, k) => r.built.shapes[k].t === 'text' && map[i]);
      texts.forEach(i => { try { map[i].textFrame.autoSizeSetting = 'AutoSizeShapeToFitText'; map[i].textFrame.wordWrap = true; } catch (e) {} });
      await ctx.sync();
      texts.forEach(i => map[i].load('height'));
      await ctx.sync();
      const heights = r.built.shapes.map((m, k) => { const s = map[r.first + k]; return m.t === 'text' && s ? Math.round(s.height * PT) : null; });
      const pl = URT.place(tid, pkg.slideW, r.top, r.built, heights);
      pl.pos.forEach((p, k) => {
        const s = map[r.first + k]; if (!s || !p) return;
        if (p.x != null) s.left = p.x / PT; if (p.y != null) s.top = p.y / PT;
        if (p.w != null && p.w > 0) s.width = p.w / PT;
        if (p.h != null && p.h > 0 && r.built.shapes[k].t !== 'text') s.height = p.h / PT;
      });
      await ctx.sync();
      r.fitsReal = pl.bottom <= pkg.slideH - UR.FOOT;
      ctx.presentation.setSelectedSlides([newId]); await ctx.sync();
      try {
        const sel = idx.map(i => map[i]).filter(Boolean).map(s => s.id);
        ctx.presentation.slides.getItem(newId).setSelectedShapes(sel); await ctx.sync();
      } catch (e) {}
    });
    await unmark(newId);
    tsay(r.fitsReal === false ? L('أُضيف القالب، لكنه تجاوز أسفل الصفحة.', 'Inserted, but it goes past the bottom of the page.') : L('أُضيف القالب.', 'Inserted.'));
  } catch (e) { tsay(L('تعذّرت الإضافة: ', 'Could not insert: ') + errText(e)); }
  finally { busy = false; lock(); }
}

// ---------- one object at a time ----------
const ROLES = [
  { g: 'نصوص', ge: 'Text', items: [['chapter', 'اسم الوحدة', 'A6A6A6'], ['lesson', 'اسم الدرس', '1F71DD'], ['topic', 'موضوع', '000000'], ['body', 'فقرة', 'FFFFFF'], ['bullets', 'نقاط', 'FFFFFF'], ['qhead', 'عنوان أسئلة', 'FF0000'], ['question', 'سؤال', 'FF0000'], ['choice', 'خيارات', 'FFFFFF']] },
  { g: 'للحلول', ge: 'For solutions', items: [['answer', 'حل', '1F71DE'], ['correct', 'الخيار الصحيح', '2070DF'], ['given', 'شكل من السؤال', 'A6A6A6']] },
  { g: 'حاويات', ge: 'Containers', items: [['note', 'ملاحظة', 'FBEBD3'], ['quote', 'نص مقتطف', 'E2F0D9'], ['def', 'تعريف', 'E2F0D9'], ['formula', 'قوانين', 'D3E4F5'], ['other', 'صيغة أخرى', 'FBEBD3'], ['activity', 'نشاط', 'F1F1F1'], ['mars', 'من المريخ', 'F1F1F1']] }
];
const ROLE_EN = { chapter: 'Unit', lesson: 'Lesson', topic: 'Topic', body: 'Paragraph', bullets: 'Bullets', qhead: 'Q head', question: 'Question', answer: 'Solution', choice: 'Choices',
  correct: 'Correct choice', given: 'Part of question', note: 'Note', quote: 'Quote', def: 'Definition', formula: 'Formulas', other: 'Other form', activity: 'Activity', mars: 'Challenge' };
function buildRoleList() {
  const host = $('roles'); host.innerHTML = '';
  for (const g of ROLES) {
    const d = document.createElement('div'); d.className = 'tgroup';
    d.innerHTML = '<div class="gt">' + L(g.g, g.ge) + '</div>';
    const grid = document.createElement('div'); grid.className = 'tgrid';
    for (const [id, nameAr, col] of g.items) {
      const name = L(nameAr, ROLE_EN[id]);
      const b = document.createElement('button'); b.type = 'button'; b.className = 'tbtn'; b.dataset.role = id;
      b.title = name === 'موضوع' ? 'عنوان موضوع' : name; b.innerHTML = '<i style="background:#' + col + '"></i><span>' + name + '</span>';
      grid.appendChild(b);
    }
    d.appendChild(grid); host.appendChild(d);
  }
}
$('roles').addEventListener('click', e => { const b = e.target.closest('.tbtn'); if (b) pinRole(b.dataset.role); });
const rsay = m => say(m);
async function clearSel(slideId) {
  await run(async ctx => {
    const sh = ctx.presentation.slides.getItem(slideId).shapes; sh.load('items/name'); await ctx.sync();
    sh.items.forEach(s => { if (/ #ursel$/.test(s.name || '')) s.name = s.name.replace(/ #ursel$/, ''); });
    await ctx.sync();
  }).catch(() => {});
}
async function pinRole(role) {
  if (busy || !supported) return;
  busy = true; lock(); rsay('');
  let slideId = null;
  try {
    const got = await run(async ctx => {
      const slides = ctx.presentation.getSelectedSlides(); slides.load('items/id');
      const shapes = ctx.presentation.getSelectedShapes(); shapes.load('items/name');
      await ctx.sync();
      if (!slides.items.length || !shapes.items.length) return null;
      shapes.items.forEach(s => { s.name = (s.name || '').replace(/ #ursel$/, '') + ' #ursel'; });
      await ctx.sync();
      return { id: slides.items[0].id, n: shapes.items.length };
    });
    if (!got) { rsay(L('حدّد مربعًا في الشريحة أولًا.', 'Select a box on the slide first.')); return; }
    slideId = got.id;
    const pkg = await UR.openPackage(await exportSlide(slideId));
    let r;
    try { r = UR.applyRole(pkg, role); if (['given', 'correct'].includes(role)) r.targets = []; }
    catch (e) { await clearSel(slideId); rsay(e.message === 'nosel' ? L('حدّد مربعًا في الشريحة أولًا.', 'Select a box on the slide first.') : L('تعذّر التحويل: ', 'Could not restyle: ') + errText(e)); return; }
    const newId = await insertAfter(await UR.buildPackage(pkg, r.xml, r.rels), slideId);
    await deleteSlide(slideId); slideId = null;
    // real text heights: fit the container around the text
    await run(async ctx => {
      const { map } = await shapesByMark(ctx, newId);
      const texts = r.targets.filter(t => t.kind === 'text' && map[t.idx]);
      texts.forEach(t => { const s = map[t.idx]; try { s.textFrame.wordWrap = true; s.textFrame.autoSizeSetting = 'AutoSizeShapeToFitText'; } catch (e) {} });
      await ctx.sync();
      texts.forEach(t => map[t.idx].load('height,top'));
      await ctx.sync();
      for (const t of texts) {
        if (!t.box || !map[t.box]) continue;
        const h = map[t.idx].height, other = t.boxType === 'other';
        const b = map[t.box]; b.top = t.top / PT; b.height = other ? h + 8 : h + 3 * 13.3;
        if (t.line != null && map[t.line]) map[t.line].height = Math.max(13.3, h - 17);
      }
      await ctx.sync();
      // on the page grid: two grid steps under what is above, and what is under keeps two grid steps
      const sh = ctx.presentation.slides.getItem(newId).shapes;
      sh.load('items/name,items/left,items/top,items/width,items/height'); await ctx.sync();
      const H = r.H / PT;
      const rects = sh.items.map((s, k) => ({ key: k, x: s.left * PT, y: s.top * PT, w: s.width * PT, h: s.height * PT,
        fixed: /^UULA (Footer|Watermark)|^CustomPageNumber_/.test((s.name || '').replace(/ #ur\d+$/, '')) || s.top > H - 54 || s.left + s.width <= 0 || s.left >= r.W / PT }));
      const keyOf = idx => { const s = map[idx]; return s ? sh.items.findIndex(x => x.name === s.name) : -1; };
      const order = r.targets.slice().sort((a, c) => (rects[keyOf(a.idx)] || {}).y - (rects[keyOf(c.idx)] || {}).y);
      for (const t of order) {
        const tk = keyOf(t.idx); if (tk < 0) continue;
        const group = [tk, t.box != null ? keyOf(t.box) : -1, t.icon != null ? keyOf(t.icon) : -1, t.line != null ? keyOf(t.line) : -1].filter(k => k >= 0);
        const mv = UR.reflow(rects, group, { textKey: tk, keepX: !!t.box || t.role === 'chapter' || t.role === 'lesson' });
        for (const [k, m] of Object.entries(mv)) {
          const R = rects[+k], s = sh.items[+k];
          if (m.y != null) { R.y = m.y; s.top = m.y / PT; }
          if (m.x != null) { R.x = m.x; s.left = m.x / PT; }
          if (m.w != null) { R.w = m.w; s.width = m.w / PT; }
        }
      }
      await ctx.sync();
      ctx.presentation.setSelectedSlides([newId]); await ctx.sync();
      try { const ids = r.targets.map(t => map[t.idx]).filter(Boolean).map(s => s.id); ctx.presentation.slides.getItem(newId).setSelectedShapes(ids); await ctx.sync(); } catch (e) {}
    });
    await unmark(newId);
    rsay(L('تم.', 'Done.'));
  } catch (e) { if (slideId) await clearSel(slideId); rsay(L('تعذّر التحويل: ', 'Could not restyle: ') + errText(e)); }
  finally { busy = false; lock(); }
}

// ---------- vertical spacing only ----------
async function spaceSlide(id) {
  const { W, H } = await getSize();
  return run(async ctx => {
    const sh = ctx.presentation.slides.getItem(id).shapes;
    sh.load('items/name,items/type,items/left,items/top,items/width,items/height'); await ctx.sync();
    // text boxes take the height of their text (so the gaps are real)
    for (const s of sh.items) if (s.type === 'TextBox') { try { s.textFrame.autoSizeSetting = 'AutoSizeShapeToFitText'; } catch (e) {} }
    await ctx.sync();
    const fills = sh.items.map(s => { try { s.fill.load('type'); return s.fill; } catch (e) { return null; } });
    sh.items.forEach(s => s.load('top,height'));
    await ctx.sync();
    const rects = sh.items.map((s, k) => {
      const nm = s.name || '';
      const fixed = /^UULA (Footer|Watermark)|^CustomPageNumber_/.test(nm) || s.top >= H - 54 || s.left + s.width <= 0 || s.left >= W || s.top + s.height <= 0 || (s.width > W * 0.85 && s.height > H * 0.6) || / #ur\d+$/.test(nm) && false;
      let solid = false; try { solid = fills[k] && fills[k].type === 'Solid' || fills[k] && fills[k].type === 'Gradient'; } catch (e) {}
      const box = (s.type === 'GeometricShape' && solid && s.width > W * 0.5) || /Container$/.test(nm);
      return { key: k, x: s.left * PT, y: s.top * PT, w: s.width * PT, h: s.height * PT, fixed, box };
    });
    const mv = UR.spacing(rects, W * PT, H * PT);
    let moved = 0, low = 0;
    for (const [k, m] of Object.entries(mv)) {
      const s = sh.items[+k];
      if (m.y != null && Math.abs(m.y / PT - s.top) > 0.2) { s.top = m.y / PT; moved++; }
      if (m.h != null) s.height = m.h / PT;
      low = Math.max(low, (m.y != null ? m.y : rects[+k].y) + (m.h != null ? m.h : rects[+k].h));
    }
    await ctx.sync();
    return { moved, over: low > (H - 54) * PT + PT };
  });
}
// horizontal: to the right / left margin (selected objects only, if any are selected on the current slide)
let hMode = load('ur-halign', 'auto');
function setH(v) { hMode = v; save('ur-halign', v); $('hAlign').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v))); }
$('hAlign').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setH(b.dataset.v); });
setH(hMode);
async function alignSlide(id, mode, useSel) {
  const { W, H } = await getSize();
  return run(async ctx => {
    const sh = ctx.presentation.slides.getItem(id).shapes;
    sh.load('items/id,items/name,items/type,items/left,items/top,items/width,items/height');
    let selIds = [];
    if (useSel) { const ss = ctx.presentation.getSelectedShapes(); ss.load('items/id'); await ctx.sync(); selIds = ss.items.map(s => s.id); }
    await ctx.sync();
    const fills = sh.items.map(s => { try { s.fill.load('type'); return s.fill; } catch (e) { return null; } });
    await ctx.sync();
    const rects = sh.items.map((s, k) => {
      const nm = s.name || '';
      const fixed = /^UULA (Footer|Watermark)|^CustomPageNumber_/.test(nm) || s.top >= H - 54 || s.left + s.width <= 0 || s.left >= W || (s.width > W * 0.85 && s.height > H * 0.6);
      let solid = false; try { solid = fills[k] && (fills[k].type === 'Solid' || fills[k].type === 'Gradient'); } catch (e) {}
      return { key: k, x: s.left * PT, y: s.top * PT, w: s.width * PT, h: s.height * PT, fixed, box: (s.type === 'GeometricShape' && solid && s.width > W * 0.5) || /Container$/.test(nm), kind: s.type === 'Line' ? 'line' : '' };
    });
    const only = selIds.length ? sh.items.map((s, k) => selIds.includes(s.id) ? k : -1).filter(k => k >= 0) : null;
    const mv = UR.align(rects, W * PT, mode, only);
    for (const [k, m] of Object.entries(mv)) sh.items[+k].left = m.x / PT;
    await ctx.sync();
    return Object.keys(mv).length;
  });
}
async function spacingRun(kind) {
  if (busy || !supported) return;
  busy = true; lock(); res.innerHTML = '';
  try {
    const ids = await targetIds();
    if (!ids.length) { say(L('حدّد شريحة أولًا.', 'Select a slide first.')); return; }
    const over = [];
    for (let k = 0; k < ids.length; k++) {
      prog(k / ids.length); say(L('تنسيق المسافات ', 'Spacing ') + (k + 1) + L(' من ', ' of ') + ids.length + '…');
      try {
        if (kind === 'v') { const r = await spaceSlide(ids[k]); if (r.over) over.push(ids[k]); }
        else await alignSlide(ids[k], hMode, scope === 'cur');
      } catch (e) { line('err', '✗ ' + esc(errText(e))); }
    }
    prog(null);
    if (over.length) { const all = await allIds(); line('warn', L('• المحتوى أطول من الصفحة: ', '• Longer than the page: ') + slideLinks(over, i => all.indexOf(i) + 1)); }
    say(L('تم تنسيق المسافات.', 'Spacing done.'));
  } catch (e) { prog(null); say(L('حدث خطأ: ', 'Error: ') + errText(e)); }
  finally { busy = false; lock(); }
}
$('spV').addEventListener('click', () => spacingRun('v'));
$('spH').addEventListener('click', () => spacingRun('h'));

// ---------- hide / show the solutions ----------
// an empty grid from a graph picture: the coloured drawing is removed and the grid lines / axes it covered are drawn again
async function emptyGrid(b64, ext) {
  const mime = /jpe?g/i.test(ext) ? 'image/jpeg' : 'image/png';
  const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = 'data:' + mime + ';base64,' + b64; });
  const w = img.naturalWidth, h = img.naturalHeight;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'); g.drawImage(img, 0, 0);
  const im = g.getImageData(0, 0, w, h), d = im.data;
  const colGray = new Uint32Array(w), rowGray = new Uint32Array(h), colDark = new Uint32Array(w), rowDark = new Uint32Array(h);
  let colored = 0, transparent = 0, grayR = 0, grayN = 0;
  const kind = new Uint8Array(w * h);           // 1 coloured, 2 gray, 3 dark
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = (y * w + x) * 4, a = d[k + 3]; if (a < 30) { transparent++; continue; }
    const r = d[k], gg = d[k + 1], b = d[k + 2], mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), av = (r + gg + b) / 3;
    if (mx - mn > 55) { kind[y * w + x] = 1; colored++; }
    else if (mx - mn < 25 && av >= 130 && av <= 238) { kind[y * w + x] = 2; colGray[x]++; rowGray[y]++; grayR += av; grayN++; }
    else if (mx - mn < 45 && av < 110) { kind[y * w + x] = 3; colDark[x]++; rowDark[y]++; }
  }
  if (colored < w * h * 0.002) return null;     // nothing drawn on it
  const bgClear = transparent > w * h * 0.3;
  const gv = grayN ? Math.round(grayR / grayN) : 190;
  const gx = new Uint8Array(w), gy = new Uint8Array(h), ax = new Uint8Array(w), ay = new Uint8Array(h);
  for (let x = 0; x < w; x++) { if (colGray[x] > h * 0.3) gx[x] = 1; if (colDark[x] > h * 0.45) ax[x] = 1; }
  for (let y = 0; y < h; y++) { if (rowGray[y] > w * 0.3) gy[y] = 1; if (rowDark[y] > w * 0.45) ay[y] = 1; }
  // a coloured pixel is erased (with a 1px halo for antialiasing), then the line under it comes back
  const erase = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (kind[y * w + x] === 1)
    for (let yy = Math.max(0, y - 1); yy <= Math.min(h - 1, y + 1); yy++) for (let xx = Math.max(0, x - 1); xx <= Math.min(w - 1, x + 1); xx++) if (kind[yy * w + xx] !== 3 || kind[y * w + x] === 1) erase[yy * w + xx] = 1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!erase[y * w + x]) continue;
    const k = (y * w + x) * 4;
    if (ax[x] || ay[y]) { d[k] = d[k + 1] = d[k + 2] = 0; d[k + 3] = 255; }
    else if (gx[x] || gy[y]) { d[k] = d[k + 1] = d[k + 2] = gv; d[k + 3] = 255; }
    else if (bgClear) d[k + 3] = 0;
    else { d[k] = d[k + 1] = d[k + 2] = 255; d[k + 3] = 255; }
  }
  g.putImageData(im, 0, 0);
  return cv.toDataURL('image/png').split(',')[1];
}
function solHidden() { const s = docSettings(); return !!(s && s.get('urSolHidden')); }
function solLabel() { const h = solHidden(); $('solLbl').textContent = h ? L('إظهار الحلول', 'Show solutions') : L('إخفاء الحلول', 'Hide solutions'); $('solSlash').style.display = h ? 'none' : ''; }
async function solSlide(id, mode) {
  const pkg = await UR.openPackage(await exportSlide(id));
  let r;
  if (mode === 'show') { if (!UR.hasSolutions(pkg.files.slide)) return 0; r = UR.showSolutions(pkg); r.rels = null; }
  else {
    if (UR.hasSolutions(pkg.files.slide)) return 0;
    const found = UR.findSolutions(pkg);
    if (!found.length) return 0;
    const grids = {};
    for (const f of found.filter(x => x.how === 'grid')) {
      const file = pkg.zip.file(f.media); if (!file || !/\.(png|jpe?g)$/i.test(f.media)) continue;
      try { const png = await emptyGrid(await file.async('base64'), f.media); if (png) grids[f.i] = png; } catch (e) {}
    }
    r = UR.hideSolutions(pkg, grids);
  }
  if (!r.count) return 0;
  const newId = await insertAfter(await UR.buildPackage(pkg, r.xml, r.rels), id);
  await deleteSlide(id);
  if (scope === 'cur') await run(async ctx => { ctx.presentation.setSelectedSlides([newId]); await ctx.sync(); }).catch(() => {});
  return r.count;
}
$('solBtn').addEventListener('click', async () => {
  if (busy || !supported) return;
  busy = true; lock(); res.innerHTML = '';
  const mode = solHidden() ? 'show' : 'hide';
  try {
    const ids = await targetIds();
    if (!ids.length) { say(L('حدّد شريحة أولًا.', 'Select a slide first.')); return; }
    let total = 0, slides = 0;
    for (let k = 0; k < ids.length; k++) {
      prog(k / ids.length); say((mode === 'hide' ? L('إخفاء الحلول ', 'Hiding solutions ') : L('إظهار الحلول ', 'Showing solutions ')) + (k + 1) + L(' من ', ' of ') + ids.length + '…');
      try { const n = await solSlide(ids[k], mode); if (n) { total += n; slides++; } }
      catch (e) { line('err', '✗ ' + esc(errText(e))); }
    }
    prog(null);
    const s = docSettings(); if (s) { s.set('urSolHidden', mode === 'hide'); s.saveAsync(); }
    solLabel();
    say(total ? (mode === 'hide' ? L('أُخفيت الحلول في ', 'Solutions hidden in ') : L('ظهرت الحلول في ', 'Solutions shown in ')) + cnt(slides) + '.' : (mode === 'hide' ? L('لم أجد حلولًا لإخفائها.', 'No solutions found to hide.') : L('لا توجد حلول مخفية.', 'No hidden solutions.')));
  } catch (e) { prog(null); say(L('حدث خطأ: ', 'Error: ') + errText(e)); }
  finally { busy = false; lock(); }
});

// ---------- Word file → slides ----------
// every tagged part of the Word file becomes its own text box (named "UULA:<type>"), then the slide is restyled
function slideEmpty(pkg) {
  const doc = UR.parseXml(pkg.files.slide), U = UR.util;
  return !U.topItems(doc).some(el => { const c = U.core(el), n = U.cnvOf(c), nm = n ? n.getAttribute('name') || '' : ''; if (/^CustomPageNumber_/.test(nm)) return false; return c.localName !== 'sp' || /\S/.test([...c.getElementsByTagNameNS(UR.NS.a, 't')].map(t => t.textContent).join('')); });
}
let docxPending = null;
async function importDocx(file) {
  res.innerHTML = '';
  say(L('قراءة ملف الوورد…', 'Reading the Word file…'));
  const parsed = await UW.read(await file.arrayBuffer());
  const units = parsed.units;
  const rp0 = parsed.report;
  if (!units.length) {
    say(rp0.skippedParts ? L('لا يوجد في الملف أي جزء مميز. ميّز الأجزاء في الوورد أولًا.', 'Nothing in the file is tagged. Tag the parts in Word first.') : L('لم أجد محتوى في الملف.', 'No content found in the file.'));
    return;
  }
  const id = await currentId();
  if (!id) { say(L('حدّد شريحة أولًا.', 'Select a slide first.')); return; }
  const b64 = await exportSlide(id);
  const pkg0 = await UR.openPackage(b64);
  const parts = UW.batches(units, pkg0.slideW, pkg0.slideH);
  const empty = slideEmpty(pkg0);
  const adds = parts.length - (empty ? 1 : 0);
  const rp = parsed.report;
  line('', esc(L('عدد الأجزاء المميزة التي ستُنقل: ', 'Tagged parts to bring over: ') + units.length + '.'));
  if (rp.skippedParts) line('warn', L('• في ملف الوورد أجزاء غير مميزة (عددها ' + rp.skippedParts + ')، تجاهلتها ولن تُنقل. لرؤيتها: في الوورد افتح «مراجعة» واضغط «لوّن غير المميز».', '• ' + rp.skippedParts + ' untagged parts of the Word file are skipped. To see them: in Word open Review and press Colour untagged.')
    + (rp.skippedText.length ? '<br><span class="note">' + rp.skippedText.slice(0, 4).map(x => '«' + esc(x) + '…»').join('، ') + '</span>' : ''));
  if (adds > 0) {
    docxPending = { units, parts, b64, id, empty, report: rp };
    const d = line('warn splitask', L('سيُضاف تقريبًا ', 'About ') + cnt(adds) + L(' بعد الشريحة الحالية' + (empty ? ' (والشريحة الحالية الفارغة تُستخدم أولًا)' : '') + '.', ' will be added after the current slide' + (empty ? ' (the empty current slide is used first)' : '') + '.')
      + '<br><span style="display:flex;gap:6px;margin-top:4px"><button type="button" class="mini" data-dx="yes">' + L('موافق، أضفها', 'OK, add them') + '</button><button type="button" class="mini" data-dx="no">' + L('إلغاء', 'Cancel') + '</button></span>');
    d.style.display = 'block';
    d.querySelector('[data-dx="yes"]').addEventListener('click', () => { d.remove(); runDocx(); });
    d.querySelector('[data-dx="no"]').addEventListener('click', () => { d.remove(); docxPending = null; say(L('أُلغي الإدراج.', 'Cancelled.')); });
    say(L('بانتظار موافقتك.', 'Waiting for your OK.'));
    return;
  }
  docxPending = { units, parts, b64, id, empty, report: rp };
  await runDocx(true);
}
async function runDocx(already) {
  const st = docxPending; if (!st) return;
  if (!already) { if (busy) return; busy = true; lock(); }
  try {
    let prev = st.id, made = [], mediaKey = 1, first = true;
    for (let k = 0; k < st.parts.length; k++) {
      prog(k / st.parts.length); say(L('إنشاء الشريحة ', 'Building slide ') + (k + 1) + L(' من ', ' of ') + st.parts.length + '…');
      const pkg = await UR.openPackage(st.b64);
      UW.fillSlide(pkg, st.parts[k], { clear: true, mediaKey });
      mediaKey += st.parts[k].length + 1;
      const r = UR.restyle(pkg, {});
      r.xml = UW.syncFallback(r.xml);
      const newId = await insertAfter(await UR.buildPackage(pkg, r.xml, r.rels), prev);
      if (first && st.empty) await deleteSlide(st.id);
      first = false;
      const lay = await refine(newId, r.plan);
      await unmark(newId);
      // still longer than the page: split it (already agreed)
      if (lay.overflow >= 0 && UR.splitPoint(r.plan, lay) > 0) {
        pendingSplit.set(newId, { pkg, rels: r.rels, xml: r.xml, plan: r.plan });
        const ids = await splitSlide(newId);
        made.push(...ids); prev = ids[ids.length - 1];
      } else { made.push(newId); prev = newId; }
    }
    prog(null);
    if ($('numChk').checked) { try { await renumber(); } catch (e) {} }
    await run(async ctx => { ctx.presentation.setSelectedSlides([made[0]]); await ctx.sync(); }).catch(() => {});
    const all = await allIds(), num = i => all.indexOf(i) + 1;
    line('ok', L('✓ أُدرج ملف الوورد في ', '✓ The Word file was inserted in ') + cnt(made.length) + ': ' + slideLinks(made, num));
    if (st.report.inlineObj) line('warn', L('• ' + st.report.inlineObj + ' معادلة كصورة داخل السطر وُضعت كصورة مستقلة، راجعها.', '• ' + st.report.inlineObj + ' inline equation pictures were placed as separate pictures; check them.'));
    line('', '<span class="note">' + L('يلزم تثبيت خط UULA Sans على الجهاز.', 'The UULA Sans font must be installed.') + '</span>');
    say(L('تم إدراج ملف الوورد.', 'The Word file was inserted.'));
  } catch (e) { prog(null); say(L('تعذّر الإدراج: ', 'Could not insert: ') + errText(e)); }
  finally { docxPending = null; busy = false; lock(); }
}
$('docxBtn').addEventListener('click', () => { if (!busy && supported) $('docxFile').click(); });
$('docxFile').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f || busy) return;
  busy = true; lock();
  try { await importDocx(f); }
  catch (e2) { prog(null); say(L('تعذّر قراءة الملف: ', 'Could not read the file: ') + errText(e2)); }
  finally { busy = false; lock(); }
});

// ---------- Word: tagging ----------
let isWord = false;
const wtype = id => UW.TYPE[id];
const wname = id => { const t = wtype(id); return t ? L(t.ar, t.en) : id; };
function buildWordRoles() {
  const host = $('wroles'); host.innerHTML = '';
  for (const g of UW.TYPES) {
    const d = document.createElement('div'); d.className = 'tgroup';
    d.innerHTML = '<div class="gt">' + L(g.g, g.ge) + '</div>';
    const grid = document.createElement('div'); grid.className = 'tgrid';
    for (const [id, ar, en, col] of g.items) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'tbtn'; b.dataset.wrole = id;
      b.title = L(ar, en); b.innerHTML = '<i style="background:#' + col + '"></i><span>' + L(ar, en) + '</span>';
      grid.appendChild(b);
    }
    d.appendChild(grid); host.appendChild(d);
  }
}
function styleCC(cc, type) {
  const t = wtype(type);
  cc.tag = 'UULA:' + type; cc.title = L(t.ar, t.en); cc.color = '#' + t.col; cc.appearance = 'BoundingBox';
}
const isRedHex = h => { const m = /^#?([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i.exec(h || ''); if (!m) return false; const [r, g, b] = m.slice(1).map(x => parseInt(x, 16)); return r > 170 && g < 90 && b < 90; };
const isUula = cc => cc && !cc.isNullObject && /^UULA:/.test(cc.tag || '');
// an empty line between two tagged parts that touch (so their frames do not stick together)
function spacer(par, where) {
  const s = par.insertParagraph('', where);
  try { s.spaceAfter = 0; s.spaceBefore = 0; s.font.size = 6; } catch (e) {}
  return s;
}
async function tagSelection(type) {
  return Word.run(async ctx => {
    const sel = ctx.document.getSelection();
    sel.load('text,isEmpty');
    const pcc = sel.parentContentControlOrNullObject; pcc.load('isNullObject,tag,text');
    await ctx.sync();
    // inside a tagged part with nothing (or all of it) selected: change its type
    if (isUula(pcc) && (sel.isEmpty || sel.text.trim() === (pcc.text || '').trim())) { styleCC(pcc, type); await ctx.sync(); return 'retag'; }
    // the cursor (or a selection) inside a text box / shape: the whole box is tagged
    let pb = null;
    try { pb = sel.parentBody; pb.load('type'); await ctx.sync(); } catch (e) { pb = null; }
    if (pb && pb.type && !['MainDoc', 'TableCell', 'Header', 'Footer', 'Section', 'Footnote', 'Endnote'].includes(pb.type)) {
      const all = pb.getRange('Content'); all.load('text'); await ctx.sync();
      const whole = sel.isEmpty || sel.text.trim().length >= all.text.trim().length - 1;
      if (whole && all.text.trim()) {
        const cc = all.insertContentControl(); styleCC(cc, type); await ctx.sync();
        return 'box';
      }
    }
    if (sel.isEmpty || !sel.text.trim()) {
      // the cursor in a paragraph: that whole paragraph
      const ps = sel.paragraphs; ps.load('items/text'); await ctx.sync();
      if (!ps.items.length || !ps.items[0].text.trim()) return 'empty';
    }
    const ps = sel.paragraphs; ps.load('items/text,items/tableNestingLevel'); await ctx.sync();
    const first = ps.items[0], last = ps.items[ps.items.length - 1];
    const partial = !sel.isEmpty && ps.items.length === 1 && sel.text.trim().length < first.text.trim().length - 1;
    let range;
    if (partial) range = sel;                       // part of one paragraph: an inline frame
    else if (first.tableNestingLevel > 0 && ps.items.every(p => p.tableNestingLevel > 0)) { const tb = first.parentTable; range = tb.getRange('Whole'); }
    else {
      const prev = first.getPreviousOrNullObject(), next = last.getNextOrNullObject();
      prev.load('isNullObject,text'); next.load('isNullObject,text');
      await ctx.sync();
      const pc = prev.isNullObject ? null : prev.parentContentControlOrNullObject, nc = next.isNullObject ? null : next.parentContentControlOrNullObject;
      if (pc) pc.load('isNullObject,tag'); if (nc) nc.load('isNullObject,tag');
      await ctx.sync();
      const inPrev = isUula(pc) && !(isUula(pcc) && pc.tag === pcc.tag), inNext = isUula(nc) && !(isUula(pcc) && nc.tag === pcc.tag);
      if (inPrev && prev.text.trim()) spacer(first, 'Before');
      if (inNext && next.text.trim()) spacer(last, 'After');
      range = first.getRange('Whole').expandTo(last.getRange('Whole'));
    }
    const cc = range.insertContentControl();
    styleCC(cc, type);
    cc.font.load('highlightColor');
    await ctx.sync();
    // the "not tagged" colour goes once the part is tagged
    if ((cc.font.highlightColor || '').toUpperCase() === UW.UNTAGGED) { cc.font.highlightColor = null; await ctx.sync(); }
    return partial ? 'inline' : 'new';
  });
}
async function untagSelection() {
  return Word.run(async ctx => {
    const sel = ctx.document.getSelection();
    const pcc = sel.parentContentControlOrNullObject; pcc.load('isNullObject,tag');
    const inside = sel.contentControls; inside.load('items/tag');
    await ctx.sync();
    let n = 0;
    for (const c of inside.items) if (/^UULA:/.test(c.tag || '')) { c.delete(true); n++; }
    if (isUula(pcc)) { pcc.delete(true); n++; }
    await ctx.sync();
    return n;
  });
}
async function autoTag() {
  return Word.run(async ctx => {
    const ps = ctx.document.body.paragraphs;
    ps.load('items/text,items/style,items/tableNestingLevel');
    await ctx.sync();
    const extra = ps.items.map(p => {
      const cc = p.parentContentControlOrNullObject; cc.load('isNullObject,tag');
      const pics = p.inlinePictures; pics.load('items/width');
      p.font.load('color,bold,size');
      return { cc, pics };
    });
    await ctx.sync();
    const paras = ps.items.map((p, i) => {
      const e = extra[i];
      const tagged = !e.cc.isNullObject;
      const table = p.tableNestingLevel > 0;
      const pic = e.pics.items.length > 0;
      const o = { text: p.text, style: p.style, color: p.font.color || '', bold: p.font.bold === true, size: p.font.size || 0, table, pic, big: pic && Math.max(...e.pics.items.map(x => x.width)) > 230 };
      o.type = tagged ? null : UW.guess(o);
      o.skip = tagged;
      return o;
    });
    // table paragraphs: one group per table
    const groups = [];
    const plain = paras.map((p, i) => p.table ? Object.assign({}, p, { skip: true }) : p);
    UW.group(plain).forEach(g => groups.push(g));
    for (let i = 0; i < paras.length; i++) {
      if (!paras[i].table || paras[i].skip) continue;
      let j = i; while (j + 1 < paras.length && paras[j + 1].table) j++;
      groups.push({ type: 'table', from: i, to: j, table: true });
      i = j;
    }
    groups.sort((a, b) => a.from - b.from);
    // ranges first (before anything moves), then spacers, then the frames
    const plans = groups.map(g => ({ g, range: g.table ? ps.items[g.from].parentTable.getRange('Whole') : ps.items[g.from].getRange('Whole').expandTo(ps.items[g.to].getRange('Whole')) }));
    let prevEnd = -10, prevTagged = false;
    for (let k = 0; k < plans.length; k++) {
      const g = plans[k].g;
      const touch = g.from === prevEnd + 1 || (g.from > 0 && paras[g.from - 1].skip && paras[g.from - 1].text.trim() && !paras[g.from - 1].table);
      if (touch && !g.table) spacer(ps.items[g.from], 'Before');
      // a part tagged before, right after this one
      const nx = paras[g.to + 1];
      if (nx && nx.skip && (nx.text.trim() || nx.table) && !g.table && !(plans[k + 1] && plans[k + 1].g.from === g.to + 1)) spacer(ps.items[g.to], 'After');
      prevEnd = g.to;
    }
    let n = 0;
    for (const pl of plans) { const cc = pl.range.insertContentControl(); styleCC(cc, pl.g.type); n++; if (n % 40 === 0) await ctx.sync(); }
    await ctx.sync();
    // answers of a word or two written inside a question in another colour (red / blue): an inline «حل» frame
    const qpars = [];
    for (const pl of plans) if (['question', 'choice'].includes(pl.g.type)) for (let i = pl.g.from; i <= pl.g.to; i++) if (paras[i].text.trim()) qpars.push(ps.items[i]);
    const words = qpars.map(p => { const w = p.getTextRanges([' '], false); w.load('items/text,items/font/color'); return w; });
    await ctx.sync();
    for (const w of words) {
      const it = w.items; if (it.length < 2) continue;
      const base = (it[0].font.color || '').toUpperCase();
      const odd = x => { const c = (x.font.color || '').toUpperCase(); return c && c !== base && (UW.isBlue(c) || isRedHex(c)); };
      for (let a = 0; a < it.length; a++) {
        if (!odd(it[a])) continue;
        let b = a; while (b + 1 < it.length && odd(it[b + 1])) b++;
        const cc = it[a].expandTo(it[b]).insertContentControl(); styleCC(cc, 'answer'); n++;
        a = b;
      }
    }
    await ctx.sync();
    return n;
  });
}
async function clearAllTags() {
  return Word.run(async ctx => {
    const ccs = ctx.document.contentControls; ccs.load('items/tag'); await ctx.sync();
    let n = 0;
    for (const c of ccs.items) if (/^UULA:/.test(c.tag || '')) { c.delete(true); n++; }
    await ctx.sync();
    return n;
  });
}
// content that is not tagged: counted, and coloured on request so it stands out
async function untaggedParas(ctx) {
  const ps = ctx.document.body.paragraphs; ps.load('items/text,items/tableNestingLevel'); await ctx.sync();
  const ex = ps.items.map(p => { const cc = p.parentContentControlOrNullObject; cc.load('isNullObject,tag'); const pics = p.inlinePictures; pics.load('items/width'); p.font.load('highlightColor'); return { cc, pics }; });
  await ctx.sync();
  // tables count as tagged (their content is text; solutions inside are tagged by hand)
  return ps.items.filter((p, i) => (p.text.trim() || ex[i].pics.items.length) && !(isUula(ex[i].cc)) && !(p.tableNestingLevel > 0));
}
async function markUntagged(on) {
  return Word.run(async ctx => {
    if (on) { const list = await untaggedParas(ctx); list.forEach(p => { p.font.highlightColor = UW.UNTAGGED; }); await ctx.sync(); return list.length; }
    const ps = ctx.document.body.paragraphs; ps.load('items/font/highlightColor'); await ctx.sync();
    let n = 0; for (const p of ps.items) if ((p.font.highlightColor || '').toUpperCase() === UW.UNTAGGED) { p.font.highlightColor = null; n++; }
    await ctx.sync(); return n;
  });
}
async function reviewList() {
  const items = await Word.run(async ctx => {
    const ccs = ctx.document.contentControls; ccs.load('items/id,items/tag,items/text'); await ctx.sync();
    return ccs.items.filter(c => /^UULA:[a-z]+$/.test(c.tag || '')).map(c => ({ id: c.id, type: c.tag.slice(5), text: (c.text || '').replace(/\s+/g, ' ').trim().slice(0, 70) }));
  });
  const list = $('wlist'), sum = $('wsum');
  list.innerHTML = ''; sum.innerHTML = '';
  const counts = {};
  for (const it of items) {
    counts[it.type] = (counts[it.type] || 0) + 1;
    const t = wtype(it.type) || { col: '999999' };
    const d = document.createElement('div'); d.className = 'witem'; d.dataset.id = it.id;
    d.innerHTML = '<i style="background:#' + t.col + '"></i><b>' + esc(wname(it.type)) + '</b><span>' + esc(it.text || '—') + '</span><button type="button" class="x" title="' + L('إزالة التمييز', 'Remove tag') + '">×</button>';
    list.appendChild(d);
  }
  for (const [k, v] of Object.entries(counts)) { const s = document.createElement('span'); s.textContent = wname(k) + ' ' + v; sum.appendChild(s); }
  const un = await Word.run(async ctx => (await untaggedParas(ctx)).length).catch(() => 0);
  $('wwarn').hidden = !un;
  $('wwarnT').textContent = L('⚠ فقرات غير مميزة (عددها ' + un + ')، ولن تُنقل إلى الباوربوينت.', '⚠ ' + un + ' paragraphs are not tagged and will not be brought into PowerPoint.');
  if (!items.length) list.innerHTML = '<span class="note">' + L('لا توجد أجزاء مميزة بعد.', 'No tagged parts yet.') + '</span>';
}
$('wlist').addEventListener('click', e => {
  const it = e.target.closest('.witem'); if (!it) return;
  const id = +it.dataset.id;
  if (e.target.closest('.x')) {
    Word.run(async ctx => { ctx.document.contentControls.getById(id).delete(true); await ctx.sync(); }).then(reviewList).catch(er => say(errText(er)));
    return;
  }
  Word.run(async ctx => { ctx.document.contentControls.getById(id).select('Select'); await ctx.sync(); }).catch(() => {});
});
$('wroles').addEventListener('click', async e => {
  const b = e.target.closest('.tbtn'); if (!b || busy || !supported) return;
  busy = true; lock();
  try {
    const r = await tagSelection(b.dataset.wrole);
    if (r === 'empty') say(L('حدّد المحتوى أولًا.', 'Select the content first.'));
    else say((r === 'retag' ? L('تغيّر النوع إلى: ', 'Type changed to: ') : r === 'box' ? L('مُيّز مربع النص كاملًا كـ: ', 'The whole text box is tagged as: ') : L('مُيّز كـ: ', 'Tagged as: ')) + wname(b.dataset.wrole));
  } catch (er) { say(L('تعذّر التمييز: ', 'Could not tag: ') + errText(er)); }
  finally { busy = false; lock(); }
});
$('wUntag').addEventListener('click', async () => {
  if (busy || !supported) return; busy = true; lock();
  try { const n = await untagSelection(); say(n ? L('أُزيل التمييز.', 'Tag removed.') : L('لا يوجد تمييز في المحدد.', 'Nothing tagged in the selection.')); }
  catch (er) { say(errText(er)); } finally { busy = false; lock(); }
});
$('wAuto').addEventListener('click', async () => {
  if (busy || !supported) return; busy = true; lock();
  try { say(L('تمييز المستند…', 'Tagging the document…')); const n = await autoTag(); say(n ? L('مُيّز ', 'Tagged ') + n + L(' جزءًا. راجعها في «مراجعة».', ' parts. Check them in Review.') : L('كل المحتوى مميز.', 'Everything is already tagged.')); }
  catch (er) { say(L('تعذّر التمييز التلقائي: ', 'Auto-tag failed: ') + errText(er)); } finally { busy = false; lock(); }
});
$('wMark').addEventListener('click', async () => {
  if (busy || !supported) return; busy = true; lock();
  try { const n = await markUntagged(true); say(n ? L('لُوّنت الفقرات غير المميزة (' + n + ') بالأزرق الفاتح.', n + ' untagged paragraphs are coloured light blue.') : L('كل المحتوى مميز.', 'Everything is tagged.')); }
  catch (er) { say(errText(er)); } finally { busy = false; lock(); }
});
$('wUnmark').addEventListener('click', async () => {
  if (busy || !supported) return; busy = true; lock();
  try { await markUntagged(false); say(L('أُزيل التلوين.', 'Colouring removed.')); }
  catch (er) { say(errText(er)); } finally { busy = false; lock(); }
});
$('wRefresh').addEventListener('click', () => { if (supported) reviewList().catch(er => say(errText(er))); });
$('wClear').addEventListener('click', () => {
  if (busy || !supported) return;
  res.innerHTML = '';
  const d = line('warn', L('إزالة كل التمييز من المستند؟ (يبقى النص كما هو)', 'Remove all tags from the document? (the text stays)')
    + '<br><span style="display:flex;gap:6px;margin-top:4px"><button type="button" class="mini" data-c="yes">' + L('نعم، أزلها', 'Yes, remove') + '</button><button type="button" class="mini" data-c="no">' + L('لا', 'No') + '</button></span>');
  d.style.display = 'block';
  d.querySelector('[data-c="no"]').addEventListener('click', () => d.remove());
  d.querySelector('[data-c="yes"]').addEventListener('click', async () => {
    d.remove(); busy = true; lock();
    try { const n = await clearAllTags(); say(L('أُزيل ', 'Removed ') + n + L(' تمييز.', ' tags.')); await reviewList(); }
    catch (er) { say(errText(er)); } finally { busy = false; lock(); }
  });
});

// ---------- main button ----------
function lock() {
  $('goBtn').disabled = busy || !supported;
  $('solBtn').disabled = busy || !supported;
  $('spV').disabled = busy || !supported; $('spH').disabled = busy || !supported;
  document.querySelectorAll('.tbtn').forEach(b => { b.disabled = busy || !supported; });
  ['docxBtn', 'wAuto', 'wUntag', 'wClear', 'wMark', 'wUnmark'].forEach(k => { if ($(k)) $(k).disabled = busy || !supported; });
}
$('goBtn').addEventListener('click', async () => {
  if (busy || !supported) return;
  busy = true; lock(); res.innerHTML = '';
  try { await doConvert(); }
  catch (e) { prog(null); say(L('حدث خطأ: ', 'Error: ') + errText(e)); }
  finally { busy = false; lock(); }
});
function setScope(v) { scope = v; save('ur-scope', v); document.querySelectorAll('.scopeSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v))); }
document.querySelectorAll('.scopeSeg').forEach(sg => sg.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setScope(b.dataset.v); }));
setScope(scope);
// tabs
function setTab(t) {
  document.querySelectorAll('#tabs button, #wtabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
  document.querySelectorAll('[data-pane]').forEach(s => { s.hidden = s.dataset.pane !== t; });
  save(isWord ? 'ur-wtab' : 'ur-tab', t);
  if (t === 'wrev' && supported) reviewList().catch(() => {});
}
$('tabs').addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (b) setTab(b.dataset.tab); });
$('wtabs').addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (b) setTab(b.dataset.tab); });
setTab((t => t === 'conv' || t === 'spc' ? 'obj' : t)(load('ur-tab', 'obj')));  // the old تحويل and تنسيق المسافات tabs are now inside تنسيق
// language
function applyLang() {
  document.documentElement.lang = lang; document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
  document.querySelectorAll('[data-en]').forEach(el => { if (el.dataset.ar == null) el.dataset.ar = el.textContent; el.textContent = lang === 'en' ? el.dataset.en : el.dataset.ar; });
  document.querySelectorAll('[data-en-title]').forEach(el => { el.title = lang === 'en' ? el.dataset.enTitle : el.dataset.arTitle; });
  $('langBtn').textContent = lang === 'en' ? 'ع' : 'EN';
  buildTemplateList(); buildRoleList(); buildWordRoles(); solLabel(); lock();
  if (isWord && supported && !$('wlist').closest('[data-pane]').hidden) reviewList().catch(() => {});
}
$('langBtn').addEventListener('click', () => { lang = lang === 'en' ? 'ar' : 'en'; save('ur-lang', lang); applyLang(); say(''); });

// ---------- menu / about ----------
function menu(o) { $('appMenu').hidden = !o; $('menuBtn').setAttribute('aria-expanded', String(o)); }
$('menuBtn').addEventListener('click', e => { e.stopPropagation(); menu($('appMenu').hidden); });
document.addEventListener('click', e => { if (!$('appMenu').hidden && !e.target.closest('.appmenu')) menu(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { menu(false); $('modal').hidden = true; } });
function modal(t, html) { $('modalT').textContent = t; $('modalB').innerHTML = html; $('modal').hidden = false; }
$('modalX').addEventListener('click', () => { $('modal').hidden = true; });
$('modal').addEventListener('click', e => { if (e.target === $('modal')) $('modal').hidden = true; });
$('aboutBtn').addEventListener('click', () => {
  menu(false);
  modal(L('حول الأداة', 'About'), (lang === 'en'
    ? '<p>Restyles A4 slides into the UULA study-guide style with one click, and inserts the ready study-guide objects.</p><ul><li>UULA Sans font, 11pt text on the page grid</li><li>Headings, questions and answers in UULA colors</li><li>Full-width containers, tables and pictures in one style</li><li>Hide / show the solutions</li><li>In Word: tag the parts (question, solution, definition…), then insert the Word file into PowerPoint</li></ul><p>No content is deleted; only old decoration is removed.</p>'
    : '<p>تحوّل شرائح A4 إلى ستايل مذكرات علا بضغطة زر، وتضيف قوالب المذكرة الجاهزة.</p><ul><li>خط UULA Sans، والنص 11 على شبكة الصفحة</li><li>العناوين والأسئلة والإجابات بألوان علا</li><li>حاويات بعرض الصفحة، وجداول وصور بالشكل الموحّد</li><li>إخفاء الحلول وإظهارها</li><li>في الوورد: تمييز الأجزاء (سؤال، حل، تعريف…) ثم إدراج ملف الوورد في الباوربوينت</li></ul><p>لا يُحذف أي محتوى؛ تُحذف الزخارف القديمة فقط.</p>')
    + '<p class="foot" dir="ltr">Developed by <b>Zaher Alkablawi</b> · Version ' + VER + '<br>© 2026 UULA. All rights reserved.</p>');
});


// ---------- updates (same method as UULA Arabic Math) ----------
(function () {
  const head = () => fetch('app.html?chk=' + Date.now(), { method: 'HEAD', cache: 'no-store' })
    .then(r => r.ok ? (r.headers.get('etag') || r.headers.get('last-modified')) : null).catch(() => null);
  let base = null, last = 0;
  const note = m => { if (busy) return; say(m); setTimeout(() => { if (status.textContent === m) say(''); }, 5000); };
  async function check(manual) {
    last = Date.now(); const t = await head();
    if (!base) { base = t; if (manual) note(t ? L('لديك آخر إصدار.', 'You have the latest version.') : L('تعذّر الاتصال.', 'Could not connect.')); return; }
    if (t && t !== base) { $('updBtn').hidden = false; if (manual) note(L('يوجد تحديث.', 'An update is available.')); }
    else if (manual) note(t ? L('لديك آخر إصدار.', 'You have the latest version.') : L('تعذّر الاتصال.', 'Could not connect.'));
  }
  head().then(t => { base = t; });
  setInterval(() => check(false), 60 * 60 * 1000);
  const soon = () => { if (Date.now() - last > 60 * 60 * 1000) check(false); };
  window.addEventListener('focus', soon); document.addEventListener('visibilitychange', () => { if (!document.hidden) soon(); });
  $('updBtn').addEventListener('click', () => { if (!busy) location.replace('app.html?v=' + Date.now()); });
  $('chkUpd').addEventListener('click', () => { menu(false); check(true); });
})();

// ---------- start ----------
$('appVer').textContent = VER;
applyLang();
const ready = (window.Office && Office.onReady) ? Office.onReady() : Promise.resolve({});
ready.then(info => {
  if (info && info.host === Office.HostType.Word) {
    isWord = true;
    $('tabs').hidden = true; $('wtabs').hidden = false;
    let wt = load('ur-wtab', 'wtag'); if (!['wtag', 'wrev'].includes(wt)) wt = 'wtag';
    if (!Office.context.requirements.isSetSupported('WordApi', '1.3')) { setTab(wt); say(L('حدّث برنامج Word لاستخدام الأداة.', 'Update Word to use this tool.')); return; }
    supported = true; lock(); setTab(wt);
    return;
  }
  if (!window.PowerPoint || (info && info.host && info.host !== Office.HostType.PowerPoint)) { say(L('هذه الأداة تعمل داخل PowerPoint وWord فقط.', 'This tool works inside PowerPoint and Word only.')); return; }
  if (!Office.context.requirements.isSetSupported('PowerPointApi', '1.8')) { say(L('حدّث برنامج PowerPoint لاستخدام الأداة.', 'Update PowerPoint to use this tool.')); return; }
  supported = true;
  const s = docSettings();
  if (s) {
    const st = s.get('urNumStart'); if (st) $('numStart').value = st;
    const on = s.get('urNum'); if (on === false) $('numChk').checked = false;
  }
  $('numRow').style.opacity = $('numChk').checked ? '' : '.5';
  solLabel();
  lock();
});
})();

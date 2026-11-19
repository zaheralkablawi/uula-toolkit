(() => {
'use strict';
const $ = id => document.getElementById(id);
const VER = '1.0';
const PT = UD.PT;
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const load = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const DEF = { bg: '#101217', text: '#ffffff', accent: '#ffff00', images: true };
const st = Object.assign({}, DEF, load('ud-settings', {}));
let scope = load('ud-scope2', 'all');
let busy = false;

// ---------- status / results ----------
const status = $('status'), res = $('res');
const say = (m, cls) => { status.textContent = m || ''; status.className = 'status' + (cls ? ' ' + cls : ''); };
const prog = f => { $('prog').hidden = f == null; if (f != null) $('prog').firstElementChild.style.width = Math.round(f * 100) + '%'; };
function line(cls, html) { const d = document.createElement('div'); d.className = 'ln ' + cls; d.innerHTML = html; res.appendChild(d); return d; }
function slideLinks(ids, nums) {
  return ids.map((id, k) => '<a data-id="' + id + '">' + nums[k] + '</a>').join(T('sep'));
}
res.addEventListener('click', e => {
  const a = e.target.closest('a[data-id]'); if (!a) return;
  PowerPoint.run(async ctx => { ctx.presentation.setSelectedSlides([a.dataset.id]); await ctx.sync(); }).catch(() => {});
});

// ---------- Office helpers ----------
const run = f => PowerPoint.run(f);
const timeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
async function targetIds() {
  return run(async ctx => {
    const col = scope === 'sel' ? ctx.presentation.getSelectedSlides() : ctx.presentation.slides;
    col.load('items/id'); await ctx.sync();
    return col.items.map(s => s.id);
  });
}
async function allIds() { return run(async ctx => { const s = ctx.presentation.slides; s.load('items/id'); await ctx.sync(); return s.items.map(x => x.id); }); }
async function exportSlide(id) { return run(async ctx => { const r = ctx.presentation.slides.getItem(id).exportAsBase64(); await ctx.sync(); return r.value; }); }
async function deleteSlide(id) { return run(async ctx => { ctx.presentation.slides.getItem(id).delete(); await ctx.sync(); }); }
async function insertAfter(b64, afterId) {
  const tryIns = async target => run(async ctx => {
    ctx.presentation.insertSlidesFromBase64(b64, { formatting: 'UseDestinationTheme', targetSlideId: target });
    await ctx.sync();
  });
  try { await tryIns(afterId); }
  catch (e) { await tryIns(String(afterId).split('#')[0] + '#'); }
  const ids = await allIds();
  return ids[ids.indexOf(afterId) + 1];
}
async function slideMark(id) {
  return run(async ctx => {
    const t = ctx.presentation.slides.getItem(id).tags; t.load('items/key,items/value'); await ctx.sync();
    const keys = t.items.map(x => x.key.toUpperCase());
    return keys.includes('UULATITLE') ? 'title' : keys.includes('UULADARK') ? 'dark' : null;
  }).catch(() => null);
}
async function markDark(id) { return run(async ctx => { ctx.presentation.slides.getItem(id).tags.add('UULADARK', VER); await ctx.sync(); }).catch(() => {}); }

// refine the layout with real text heights; returns the lowest bottom (pt)
async function refine(id, plan) {
  return run(async ctx => {
    const shapes = ctx.presentation.slides.getItem(id).shapes;
    shapes.load('items/id'); await ctx.sync();
    if (!plan.items.length) return plan.bottom / PT;
    const L = plan.items.map(s => ({ s, sh: shapes.items[s.idx] }));
    if (L.some(x => !x.sh)) return plan.bottom / PT;
    const texts = L.filter(x => x.s.kind === 'text');
    for (const x of L) if (x.s.kind !== 'text') {
      x.sh.left = x.s.x / PT;
      if (x.s.kind !== 'table') { x.sh.width = Math.max(1, x.s.w / PT); x.sh.height = Math.max(1, x.s.h / PT); }
    }
    for (const x of texts) { x.sh.left = x.s.x / PT; x.sh.width = x.s.w / PT; x.sh.textFrame.autoSizeSetting = 'AutoSizeNone'; }
    await ctx.sync();
    for (const x of texts) { x.sh.textFrame.autoSizeSetting = 'AutoSizeShapeToFitText'; x.sh.textFrame.verticalAlignment = 'Top'; }
    await ctx.sync();
    L.forEach(x => x.sh.load('height'));
    await ctx.sync();
    const H = x => x.s.kind === 'text' ? x.sh.height : Math.max(x.sh.height || 0, x.s.h / PT);
    const M = UD.MARGIN / PT, G = UD.GAP / PT;
    const title = L.find(x => x.s.col === 'title');
    let start = M, bottom = M;
    if (title) { title.sh.top = M; start = M + H(title) + G; bottom = M + H(title); }
    const y = { full: M, left: start, right: start };
    for (const x of L) {
      if (x.s.col === 'title') continue;
      x.sh.top = y[x.s.col];
      y[x.s.col] += H(x) + G;
      bottom = Math.max(bottom, y[x.s.col] - G);
    }
    await ctx.sync();
    return bottom;
  });
}

// ---------- dark (splits at the separators first, then converts each part) ----------
const LEVELS = ['3600', '3200', '3000'];
// if PowerPoint refuses the converted slide, retry without parts of the conversion (also tells us which part)
const SKIPS = [[], ['layout'], ['images'], ['tables'], ['shapes'], ['text'], ['layout', 'images', 'tables', 'shapes']];

async function doDark(ids) {
  const done = [], small = [], over = [], gray = [], skipped = [], errs = [];
  let srcCount = 0; const fallbacks = [], titles = [];
  const ctxBase = { bg: st.bg.slice(1).toUpperCase(), text: st.text.slice(1).toUpperCase(), accent: st.accent.slice(1).toUpperCase(), title: '4800', font: 'UULA Sans Medium', images: st.images };
  for (let k = 0; k < ids.length; k++) {
    prog(k / ids.length); say(T('converting', k + 1, ids.length));
    const id = ids[k];
    let stage = 'stRead', origB64 = null;
    try {
      const mark = await slideMark(id);
      if (mark === 'title') { titles.push(id); continue; }
      if (mark === 'dark') { skipped.push(id); continue; }
      origB64 = await exportSlide(id);
      const pkg = await UD.openPackage(origB64);
      const slideHpt = pkg.slideH / PT;
      const ctx0 = { scheme: UD.readTheme(pkg.files) };
      const sec = UD.sections(UD.analyze(UD.parseXml(pkg.files.slide), pkg, ctx0));
      const parts = sec.count && sec.parts.length ? sec.parts.map(p => UD.sectionXml(pkg.files.slide, pkg, ctx0, p)) : [pkg.files.slide];
      let prev = id;
      for (const base of parts) {
        let newId = null, lvl = 0, bottom = 0, rep = null;
        for (lvl = 0; lvl < LEVELS.length; lvl++) {
          stage = 'stInsert';
          let d = null, lastErr = null;
          for (const sk of SKIPS) {
            d = UD.darkXml(base, pkg, Object.assign({}, ctxBase, { body: LEVELS[lvl], skip: sk }));
            try { newId = await insertAfter(await UD.buildPackage(pkg, d.xml), prev); lastErr = null; if (sk.length) fallbacks.push([sk, null]); d.skipped = sk; break; }
            catch (e) { lastErr = e; }
          }
          if (lastErr) throw lastErr;
          rep = d.report;
          stage = 'stLayout';
          bottom = await refine(newId, d.plan);
          if (d.plan.mode === 'zoom' || bottom <= slideHpt - UD.MARGIN / PT + 0.5 || lvl === LEVELS.length - 1) break;
          await deleteSlide(newId);
        }
        if (fallbacks.length && fallbacks[fallbacks.length - 1][1] === null) fallbacks[fallbacks.length - 1][1] = newId;
        await markDark(newId);
        prev = newId;
        done.push(newId);
        if (lvl > 0) small.push([newId, LEVELS[lvl] / 100]);
        else if (rep && rep.minPt && rep.minPt < 20) small.push([newId, rep.minPt]);
        if (bottom > slideHpt - UD.MARGIN / PT + 0.5) over.push(newId);
        if (rep && rep.duotone) gray.push(newId);
      }
      stage = 'stDelete';
      await deleteSlide(id);
      srcCount++;
    } catch (e) {
      let extra = '';
      if (stage === 'stInsert' && origB64) {
        // diagnosis: can the untouched slide be inserted? then the problem is in the converted XML
        try { const t = await insertAfter(origB64, id); await deleteSlide(t); extra = T('diagOk'); }
        catch (e2) { extra = T('diagBad') + errText(e2); }
      }
      errs.push(T(stage) + ': ' + errText(e) + extra);
    }
  }
  prog(null);
  const all = await allIds(), num = i => all.indexOf(i) + 1;
  res.innerHTML = '';
  if (done.length) line('ok', T('resDone', srcCount, done.length) + slideLinks(done, done.map(num)));
  if (small.length) line('warn', T('resSmall') + small.map(([i, s]) => '<a data-id="' + i + '">' + num(i) + '</a> (' + s + ')').join(T('sep')));
  if (over.length) line('err', T('resOver') + slideLinks(over, over.map(num)));
  if (gray.length) line('warn', T('resGray') + slideLinks(gray, gray.map(num)));
  if (skipped.length) line('warn', T('resSkipped', skipped.length));
  if (titles.length) line('', '<span class="note">' + T('resTitles', titles.length) + '</span>');
  fallbacks.forEach(([sk, i]) => { if (i) line('warn', T('resFallback').replace('{n}', '<a data-id="' + i + '">' + num(i) + '</a>') + sk.map(k => T('skip')[k]).join(T('sep'))); });
  errs.forEach(m => line('err', '✗ ' + esc(m)));
  if (done.length) line('', '<span class="note">' + T('fontNeeded') + '</span>');
  say(done.length ? T('doneMsg') : T('noneMsg'));
}
const errText = e => { const loc = e && e.debugInfo && e.debugInfo.errorLocation; return (e && (e.code || e.message) || String(e)) + (loc ? ' (' + loc + ')' : ''); };
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

async function go(fn) {
  if (busy || !canConvert()) return;
  busy = true; refreshLock(); res.innerHTML = '';
  try {
    const ids = await targetIds();
    if (!ids.length) { say(T('selFirst')); return; }
    await fn(ids);
  } catch (e) { prog(null); say(T('errPrefix') + (e.message || e)); }
  finally { busy = false; refreshLock(); }
}
$('darkBtn').addEventListener('click', () => go(doDark));

// ---------- the two steps the user does himself ----------
let supported = false, step1 = false, step2 = false;
const step2ok = () => step2;
const canConvert = () => supported && step1 && step2ok();
function refreshLock() {
  $('darkBtn').disabled = busy || !canConvert();
  $('step1').classList.toggle('done', step1);
  $('step2').classList.toggle('done', step2ok());
  const miss = [!step1 && 1, !step2ok() && 2].filter(Boolean);
  $('lockNote').hidden = !supported || !miss.length;
  $('lockNote').textContent = miss.length === 2 ? T('lockBoth') : T('lockOne', miss[0]);
}
// step 1: remembered inside the presentation file
function docSettings() { try { return Office.context.document.settings; } catch (e) { return null; } }
$('s1Done').addEventListener('change', () => {
  step1 = $('s1Done').checked; refreshLock();
  const s = docSettings(); if (s) { s.set('udStep1', step1); s.saveAsync(); }
});
// "أضف فواصل": a red full-width line in the middle of the current slide, selected so it can be dragged into place
$('addSep').addEventListener('click', async () => {
  if (!supported) return;
  try {
    await run(async ctx => {
      const sel = ctx.presentation.getSelectedSlides(); sel.load('items/id'); await ctx.sync();
      if (!sel.items.length) { say(T('selFirst')); return; }
      const slide = sel.items[0];
      let W = 960, H = 540;
      try { const pkg = await UD.openPackage(await exportSlide(slide.id)); W = pkg.slideW / PT; H = pkg.slideH / PT; } catch (e) {}
      // a thin red bar (not a connector line): it always stays horizontal, even when dragged
      const bw = (W - 80) * 1.2; // 20% longer than the slide width minus the side margins, centered
      const ln = slide.shapes.addGeometricShape(PowerPoint.GeometricShapeType.rectangle, { left: (W - bw) / 2, top: H / 2, width: bw, height: 3 });
      ln.name = 'UULA فاصل';
      ln.fill.setSolidColor('#FF0000');
      ln.lineFormat.visible = false;
      ln.load('id'); await ctx.sync();
      try { slide.setSelectedShapes([ln.id]); await ctx.sync(); } catch (e) {}
      say(T('dragSep'));
    });
  } catch (e) { say(T('sepFail') + (e.message || e)); }
});
// step 2: the user changes the slide size himself and ticks the box
function setStep2(v) { step2 = v; $('s2Done').checked = v; const s = docSettings(); if (s) { s.set('udStep2', v); s.saveAsync(); } refreshLock(); }
$('s2Done').addEventListener('change', () => setStep2($('s2Done').checked));



// ---------- step 1 tools: suggested separators, own parts ----------
const s1Say = m => { $('s1Status').textContent = m || ''; };
const PART_RE = /^UULA جزء (\d+)\s*·?\s*/;
async function addBar(ctx, slide, x, y, w, name) {
  const ln = slide.shapes.addGeometricShape(PowerPoint.GeometricShapeType.rectangle, { left: x, top: y - 1.5, width: w, height: 3 });
  ln.name = name; ln.fill.setSolidColor('#FF0000'); ln.lineFormat.visible = false;
  return ln;
}
$('suggestSep').addEventListener('click', async () => {
  if (!supported || busy) return;
  busy = true; refreshLock(); s1Say('');
  let bars = 0, slidesWith = 0, skipped = 0;
  try {
    const ids = await targetIds();
    for (let k = 0; k < ids.length; k++) {
      s1Say(T('suggesting', k + 1, ids.length));
      const pkg = await UD.openPackage(await exportSlide(ids[k]));
      const items = UD.analyze(UD.parseXml(pkg.files.slide), pkg, { scheme: UD.readTheme(pkg.files) });
      // the user's own separators or parts are left alone; earlier suggestions are replaced
      const own = items.some(t => t.part || (t.kind === 'sep' && !/تلقائي/.test(t.name)));
      if (own) { skipped++; continue; }
      const cuts = UD.suggestCuts(items.filter(t => t.kind !== 'sep'), pkg);
      await run(async ctx => {
        const slide = ctx.presentation.slides.getItem(ids[k]);
        slide.shapes.load('items/name'); await ctx.sync();
        slide.shapes.items.filter(x => /^UULA فاصل تلقائي/.test(x.name)).forEach(x => x.delete());
        for (const c of cuts) await addBar(ctx, slide, c.x / PT, c.y / PT, c.w / PT, 'UULA فاصل تلقائي');
        await ctx.sync();
      });
      if (cuts.length) { bars += cuts.length; slidesWith++; }
    }
    s1Say((bars ? T('suggested', bars, slidesWith) : T('suggestedNone')) + (skipped ? T('suggestSkip', skipped) : ''));
  } catch (e) { s1Say(T('errPrefix') + errText(e)); }
  finally { busy = false; refreshLock(); }
});
$('makePart').addEventListener('click', async () => {
  if (!supported || busy) return;
  try {
    await run(async ctx => {
      const sel = ctx.presentation.getSelectedShapes(); sel.load('items/id,items/name');
      const ss = ctx.presentation.getSelectedSlides(); ss.load('items/id'); await ctx.sync();
      if (!sel.items.length || !ss.items.length) { s1Say(T('partNeedSel')); return; }
      const all = ctx.presentation.slides.getItem(ss.items[0].id).shapes; all.load('items/id,items/name'); await ctx.sync();
      const chosen = new Set(sel.items.map(x => x.id));
      let max = 0;
      for (const x of all.items) { const m = PART_RE.exec(x.name || ''); if (m && !chosen.has(x.id)) max = Math.max(max, +m[1]); }
      const n = max + 1;
      for (const x of sel.items) x.name = 'UULA جزء ' + n + ' · ' + (x.name || '').replace(PART_RE, '');
      await ctx.sync();
      s1Say(T('partDone', n, sel.items.length));
    });
  } catch (e) { s1Say(T('errPrefix') + errText(e)); }
});
$('clearParts').addEventListener('click', async () => {
  if (!supported || busy) return;
  try {
    const ids = await targetIds(); let n = 0;
    await run(async ctx => {
      for (const id of ids) {
        const sh = ctx.presentation.slides.getItem(id).shapes; sh.load('items/name'); await ctx.sync();
        let hit = false;
        for (const x of sh.items) if (PART_RE.test(x.name || '')) { x.name = x.name.replace(PART_RE, '') || 'Shape'; hit = true; }
        if (hit) n++;
      }
      await ctx.sync();
    });
    s1Say(T('partsCleared', n));
  } catch (e) { s1Say(T('errPrefix') + errText(e)); }
});

// ---------- title slide (UULA video template) ----------
let tType = load('ud-ttype', 'explain'), tVar = load('ud-tvar', 1);
function paintTitle() {
  $('tType').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === tType)));
  const box = $('tThumbs'); box.innerHTML = '';
  for (let k = 1; k <= 3; k++) {
    const b = document.createElement('button'); b.type = 'button'; b.title = T('style', k);
    b.setAttribute('aria-pressed', String(k === tVar));
    const im = document.createElement('img'); im.src = 'templates/title-' + tType + '-' + k + '.jpg'; im.alt = '';
    b.appendChild(im); b.addEventListener('click', () => { tVar = k; save('ud-tvar', k); paintTitle(); });
    box.appendChild(b);
  }
}
$('tType').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; tType = b.dataset.v; save('ud-ttype', tType); paintTitle(); });
paintTitle();
const b64of = buf => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
// writes the text into the placeholder and copies the layout's position and text style onto it,
// so the slide keeps its look even if PowerPoint does not link it back to the template's layout
function fillPlaceholder(doc, idx, text, layout, scheme) {
  const P = UD.NS.p, A = UD.NS.a;
  const find = d => [...d.getElementsByTagNameNS(P, 'sp')].find(e => { const ph = e.getElementsByTagNameNS(P, 'ph')[0]; return ph && ph.getAttribute('idx') === String(idx); });
  const sp = find(doc); if (!sp) return;
  const lsp = layout && find(layout);
  const tx = sp.getElementsByTagNameNS(P, 'txBody')[0];
  if (lsp) {
    const lspPr = lsp.getElementsByTagNameNS(P, 'spPr')[0], spPr = sp.getElementsByTagNameNS(P, 'spPr')[0];
    const lx = lspPr && lspPr.getElementsByTagNameNS(A, 'xfrm')[0];
    if (lx && spPr && !spPr.getElementsByTagNameNS(A, 'xfrm')[0]) spPr.insertBefore(doc.importNode(lx, true), spPr.firstChild);
    const ltx = lsp.getElementsByTagNameNS(P, 'txBody')[0];
    for (const name of ['bodyPr', 'lstStyle']) {
      const src = ltx && [...ltx.children].find(c => c.localName === name), dst = [...tx.children].find(c => c.localName === name);
      if (src && dst) {
        const c = doc.importNode(src, true);
        // theme colors (like bg1) become fixed colors, so they look the same in any presentation
        for (const sc of [...c.getElementsByTagNameNS(A, 'schemeClr')]) {
          const hex = scheme && scheme[sc.getAttribute('val')];
          if (!hex) continue;
          const rgbEl = doc.createElementNS(A, 'a:srgbClr'); rgbEl.setAttribute('val', hex);
          for (const k of [...sc.children]) rgbEl.appendChild(k);
          sc.parentNode.replaceChild(rgbEl, sc);
        }
        tx.replaceChild(c, dst);
      }
    }
  }
  if (!text) return null;
  for (const p of [...tx.getElementsByTagNameNS(A, 'p')]) tx.removeChild(p);
  const p = doc.createElementNS(A, 'a:p'), r = doc.createElementNS(A, 'a:r'), rp = doc.createElementNS(A, 'a:rPr'), t = doc.createElementNS(A, 'a:t');
  // the style is also written on the paragraph and on the text itself (PowerPoint keeps these in every case)
  const lvl = [...tx.getElementsByTagNameNS(A, 'lvl1pPr')][0];
  const spec = { size: 0, bold: false, color: null, font: null, align: 'Center', boxW: 0 };
  const lxf = lsp && lsp.getElementsByTagNameNS(A, 'xfrm')[0], lext = lxf && lxf.getElementsByTagNameNS(A, 'ext')[0];
  if (lext) spec.boxW = +lext.getAttribute('cx') / 12700;
  if (lvl) {
    const pPr = doc.createElementNS(A, 'a:pPr');
    for (const at of [...lvl.attributes]) pPr.setAttribute(at.name, at.value);
    for (const c of [...lvl.children]) if (c.localName !== 'defRPr') pPr.appendChild(c.cloneNode(true));
    p.appendChild(pPr);
    const al = lvl.getAttribute('algn'); spec.align = al === 'r' ? 'Right' : al === 'l' ? 'Left' : al === 'just' ? 'Justify' : 'Center';
    const d = [...lvl.children].find(c => c.localName === 'defRPr');
    if (d) {
      for (const at of [...d.attributes]) rp.setAttribute(at.name, at.value);
      for (const c of [...d.children]) rp.appendChild(c.cloneNode(true));
      spec.size = +(d.getAttribute('sz') || 0) / 100; spec.bold = d.getAttribute('b') === '1';
      const clr = d.getElementsByTagNameNS(A, 'srgbClr')[0]; if (clr) spec.color = '#' + clr.getAttribute('val');
      const lat = d.getElementsByTagNameNS(A, 'latin')[0]; if (lat) spec.font = lat.getAttribute('typeface');
    }
  }
  rp.setAttribute('lang', 'ar-SA'); t.textContent = text; r.appendChild(rp); r.appendChild(t); p.appendChild(r); tx.appendChild(p);
  return spec;
}
const tSay = m => { $('tStatus').textContent = m || ''; };
let hasSel = false;
function paintPos() {}
$('tPos').addEventListener('click', e => { const b = e.target.closest('button'); if (b) insertTitle(b.dataset.v); });
let selBusy = false;
async function refreshSel() {
  if (!supported || selBusy) return;
  selBusy = true;
  try {
    await run(async ctx => { const s = ctx.presentation.getSelectedSlides(); s.load('items/id'); await ctx.sync(); hasSel = s.items.length > 0; });
  } catch (e) { hasSel = false; }
  selBusy = false;
}
paintPos();
// ---------- inner slides (UULA video template: three styles, with or without a header) ----------
let iVar = load('ud-ivar', 1);
function paintInner() {
  const box = $('iThumbs'); box.innerHTML = '';
  for (let k = 1; k <= 3; k++) {
    const b = document.createElement('button'); b.type = 'button'; b.title = T('style', k);
    b.setAttribute('aria-pressed', String(k === iVar));
    const im = document.createElement('img'); im.src = 'templates/inner-' + k + '.jpg'; im.alt = '';
    b.appendChild(im); b.addEventListener('click', () => { iVar = k; save('ud-ivar', k); paintInner(); });
    box.appendChild(b);
  }
}
$('iPos').addEventListener('click', e => { const b = e.target.closest('button'); if (b) insertInner(b.dataset.v); });
$('iHead').checked = !!load('ud-ihead', false);
$('iHead').addEventListener('change', () => save('ud-ihead', $('iHead').checked));
async function insertInner(pos) {
  if (!supported || busy) return;
  const say2 = m => { $('iStatus').textContent = m || ''; };
  busy = true; refreshLock(); say2(T('inserting'));
  try {
    const r = await fetch('templates/inner-' + iVar + '-' + ($('iHead').checked ? 2 : 1) + '.pptx', { cache: 'no-cache' });
    if (!r.ok) throw new Error(T('tplFail'));
    const pkg = await UD.openPackage(b64of(await r.arrayBuffer()));
    const doc = UD.parseXml(pkg.files.slide);
    const scheme = UD.readTheme(pkg.files);
    // empty placeholders: only the layout's place and text style are copied, the teacher writes the content
    fillPlaceholder(doc, 11, '', pkg.layouts[0], scheme); fillPlaceholder(doc, 12, '', pkg.layouts[0], scheme);
    const b64 = await UD.buildPackage(pkg, UD.serialize(doc));
    await run(async ctx => {
      const sel = ctx.presentation.getSelectedSlides(); sel.load('items/id');
      const all = ctx.presentation.slides; all.load('items/id'); await ctx.sync();
      const opts = { formatting: 'KeepSourceFormatting' };
      const ids = all.items.map(x => x.id), selIds = sel.items.map(x => x.id);
      if (pos === 'end' && ids.length) opts.targetSlideId = ids[ids.length - 1];
      if (pos === 'after' && selIds.length) opts.targetSlideId = selIds[selIds.length - 1];
      if (pos === 'before' && selIds.length) {
        const first = Math.min(...selIds.map(i => ids.indexOf(i)));
        if (first > 0) opts.targetSlideId = ids[first - 1];
      }
      if ((pos === 'before' || pos === 'after') && !selIds.length) throw new Error(T('selFirst'));
      ctx.presentation.insertSlidesFromBase64(b64, opts); await ctx.sync();
      const after = ctx.presentation.slides; after.load('items/id'); await ctx.sync();
      const before = new Set(ids);
      const added = after.items.find(x => !before.has(x.id));
      if (added) { try { ctx.presentation.setSelectedSlides([added.id]); await ctx.sync(); } catch (e) {} }
    });
    say2(T('iInserted'));
  } catch (e) { say2(T('insertFail') + errText(e)); }
  finally { busy = false; refreshLock(); }
}

paintInner();
async function insertTitle(pos) {
  if (!supported || busy) return;
  busy = true; refreshLock(); tSay(T('inserting'));
  try {
    const r = await fetch('templates/title-' + tType + '-' + tVar + '.pptx', { cache: 'no-cache' });
    if (!r.ok) throw new Error(T('tplFail'));
    const pkg = await UD.openPackage(b64of(await r.arrayBuffer()));
    const doc = UD.parseXml(pkg.files.slide);
    const scheme = UD.readTheme(pkg.files);
    const specs = [fillPlaceholder(doc, 10, $('tTitle').value.trim(), pkg.layouts[0], scheme), fillPlaceholder(doc, 11, $('tSub').value.trim(), pkg.layouts[0], scheme)];
    const b64 = await UD.buildPackage(pkg, UD.serialize(doc));
    await run(async ctx => {
      const sel = ctx.presentation.getSelectedSlides(); sel.load('items/id');
      const all = ctx.presentation.slides; all.load('items/id'); await ctx.sync();
      const opts = { formatting: 'KeepSourceFormatting' };
      const ids = all.items.map(x => x.id), selIds = sel.items.map(x => x.id);
      if (pos === 'after' && selIds.length) opts.targetSlideId = selIds[selIds.length - 1];
      if (pos === 'before' && selIds.length) {
        const first = Math.min(...selIds.map(i => ids.indexOf(i)));
        if (first > 0) opts.targetSlideId = ids[first - 1];
      }
      if ((pos === 'before' || pos === 'after') && !selIds.length) throw new Error(T('selFirst'));
      ctx.presentation.insertSlidesFromBase64(b64, opts); await ctx.sync();
      const after = ctx.presentation.slides; after.load('items/id'); await ctx.sync();
      const before = new Set(all.items.map(x => x.id));
      const added = after.items.find(x => !before.has(x.id));
      if (added) {
        added.tags.add('UULATITLE', '1'); await ctx.sync();
        // last safety net: apply the template's text style through PowerPoint itself
        try {
          const sh = ctx.presentation.slides.getItem(added.id).shapes; sh.load('items/name,items/width'); await ctx.sync();
          const ph = sh.items.filter(x => /^Text Placeholder/.test(x.name));
          ph.forEach((x, k) => {
            const sp = specs[k]; if (!sp) return;
            const f = x.textFrame.textRange.font;
            // the template is 960 pt wide: on a bigger slide the text grows with its box, so it looks the same
            const scale = sp.boxW && x.width ? x.width / sp.boxW : 1;
            if (sp.size) f.size = Math.round(sp.size * (scale > 0.3 && scale < 4 ? scale : 1)); if (sp.color) f.color = sp.color; if (sp.font) f.name = sp.font; f.bold = sp.bold;
            x.textFrame.textRange.paragraphFormat.horizontalAlignment = sp.align;
          });
          await ctx.sync();
        } catch (e) {}
        try { ctx.presentation.setSelectedSlides([added.id]); await ctx.sync(); } catch (e) {}
      }
    });
    tSay(T('inserted'));
  } catch (e) { tSay(T('insertFail') + errText(e)); }
  finally { busy = false; refreshLock(); }
}


// ---------- language ----------
function setLang(l) {
  I18N.set(l); paintTitle(); paintPos(); paintInner(); refreshLock(); closeColors();
  if (!busy) { say(''); tSay(''); s1Say(''); res.innerHTML = ''; }
}
$('langBtn').addEventListener('click', () => setLang(I18N.lang === 'ar' ? 'en' : 'ar'));
$('langItem').addEventListener('click', () => { menu(false); setLang(I18N.lang === 'ar' ? 'en' : 'ar'); });

// ---------- two menus: dark conversion / title slide ----------
function setTab(t) {
  save('ud-tab', t);
  $('tabs').querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === t)));
  $('pageDark').hidden = t !== 'dark'; $('pageTitle').hidden = t !== 'title';
  if (t === 'title') refreshSel();
}
$('tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setTab(b.dataset.t); });
const MODE = window.UD_MODE || '';
if (MODE) document.body.classList.add('m-' + MODE);
setTab(MODE === 'cover' ? 'title' : MODE === 'dark' ? 'dark' : load('ud-tab', 'dark'));

// ---------- scope ----------
function setScope(v) { scope = v; save('ud-scope2', v); $('scope').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v))); }
$('scope').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setScope(b.dataset.v); });
setScope(scope);

// ---------- settings ----------
$('setTog').addEventListener('click', () => { const o = $('setTog').getAttribute('aria-expanded') !== 'true'; $('setTog').setAttribute('aria-expanded', String(o)); $('setBody').hidden = !o; });
$('imgChk').checked = st.images;
$('imgChk').addEventListener('change', () => { st.images = $('imgChk').checked; save('ud-settings', st); });
$('resetBtn').addEventListener('click', () => { Object.assign(st, DEF); save('ud-settings', st); $('imgChk').checked = st.images; paintSwatches(); });
function paintSwatches() { document.querySelectorAll('.colorbtn').forEach(b => { b.querySelector('.sw').style.background = st[b.dataset.k]; }); }
paintSwatches();

// ---------- color picker (standard for all tools) ----------
const COLORS = [['cWhite', '#ffffff'], ['cBlack', '#000000'], ['cBlue', '#1f71de'], ['cMagenta', '#fe00fe'], ['cYellow', '#ffe600']];
const THEME = ['#ffffff', '#000000', '#e7e6e6', '#44546a', '#4472c4', '#ed7d31', '#a5a5a5', '#ffc000', '#5b9bd5', '#70ad47'];
const STANDARD = ['#c00000', '#ff0000', '#ffc000', '#ffff00', '#92d050', '#00b050', '#00b0f0', '#0070c0', '#002060', '#7030a0'];
function hex2hsl(h) {
  let [r, g, b] = [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16) / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), L = (mx + mn) / 2; let H = 0, S = 0;
  if (mx !== mn) { const d = mx - mn; S = L > .5 ? d / (2 - mx - mn) : d / (mx + mn);
    H = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; H /= 6; }
  return [H, S, L];
}
function hsl2hex(H, S, L) {
  let r, g, b;
  if (!S) r = g = b = L; else {
    const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    const q = L < .5 ? L * (1 + S) : L + S - L * S, p = 2 * L - q; r = f(p, q, H + 1 / 3); g = f(p, q, H); b = f(p, q, H - 1 / 3);
  }
  return '#' + [r, g, b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}
function shades(h) {
  const [H, S, L] = hex2hsl(h);
  const mods = L > .95 ? [.95, .85, .75, .65, .5].map(m => [0, m]) : L < .05 ? [.5, .35, .25, .15, .05].map(m => [1, m]) : [[1, .8], [1, .6], [1, .4], [0, .75], [0, .5]];
  return mods.map(([up, m]) => hsl2hex(H, S, up ? L + (1 - L) * m : L * m));
}
const cpop = $('cpop'), custom = $('custom');
let cKey = null, cBtn = null;
function setColorKey(k, c) { st[k] = c.toLowerCase(); save('ud-settings', st); paintSwatches(); }
function swatch(c, title) {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'c'; b.style.background = c; b.title = title || c; b.dataset.c = c;
  b.addEventListener('click', () => { const k = cKey; closeColors(); if (k) setColorKey(k, c); });
  return b;
}
function buildColors() {
  cpop.innerHTML = '';
  const lab = t => { const d = document.createElement('div'); d.className = 'clab'; d.textContent = t; cpop.appendChild(d); };
  lab(T('brand'));
  const mine = document.createElement('div'); mine.className = 'mine'; for (const [n, c] of COLORS) mine.appendChild(swatch(c, T(n))); cpop.appendChild(mine);
  lab(T('others'));
  const top = document.createElement('div'); top.className = 'crow'; THEME.forEach(c => top.appendChild(swatch(c))); cpop.appendChild(top);
  const grid = document.createElement('div'); grid.className = 'ccol'; const sh = THEME.map(shades);
  for (let k = 0; k < 5; k++) THEME.forEach((_, i) => grid.appendChild(swatch(sh[i][k]))); cpop.appendChild(grid);
  const std = document.createElement('div'); std.className = 'crow'; STANDARD.forEach(c => std.appendChild(swatch(c))); cpop.appendChild(std);
  const more = document.createElement('button'); more.type = 'button'; more.className = 'more'; more.textContent = T('moreColor');
  more.addEventListener('click', () => { const k = cKey; closeColors(); custom.value = st[k]; custom.dataset.k = k; custom.click(); });
  cpop.appendChild(more);
  cpop.querySelectorAll('button.c').forEach(b => b.classList.toggle('on', b.dataset.c.toLowerCase() === String(st[cKey]).toLowerCase()));
}
function openColors(btn) {
  cKey = btn.dataset.k; cBtn = btn; buildColors(); cpop.hidden = false; btn.setAttribute('aria-expanded', 'true');
  const r = btn.getBoundingClientRect(), pw = cpop.offsetWidth, ph = cpop.offsetHeight;
  let left = Math.max(6, Math.min(r.left, innerWidth - pw - 6));
  let top = r.bottom + 4; if (top + ph > innerHeight - 6) top = Math.max(6, r.top - ph - 4);
  cpop.style.position = 'fixed'; cpop.style.left = left + 'px'; cpop.style.top = (top + scrollY * 0) + 'px';
}
function closeColors() { cpop.hidden = true; if (cBtn) cBtn.setAttribute('aria-expanded', 'false'); cKey = null; cBtn = null; }
document.querySelectorAll('.colorbtn').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); if (cBtn === b) closeColors(); else { closeColors(); openColors(b); } }));
custom.addEventListener('input', () => { if (custom.dataset.k) setColorKey(custom.dataset.k, custom.value); });
document.addEventListener('click', e => { if (!cpop.hidden && !cpop.contains(e.target)) closeColors(); if (!$('appMenu').hidden && !e.target.closest('.appmenu')) menu(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeColors(); menu(false); $('modal').hidden = true; } });

// ---------- menu / about ----------
function menu(o) { $('appMenu').hidden = !o; $('menuBtn').setAttribute('aria-expanded', String(o)); }
$('menuBtn').addEventListener('click', e => { e.stopPropagation(); menu($('appMenu').hidden); });
function modal(t, html) { $('modalT').textContent = t; $('modalB').innerHTML = html; $('modal').hidden = false; }
$('modalX').addEventListener('click', () => { $('modal').hidden = true; });
$('modal').addEventListener('click', e => { if (e.target === $('modal')) $('modal').hidden = true; });
$('aboutBtn').addEventListener('click', () => {
  menu(false);
  modal(T('about'), T(MODE === 'cover' ? 'aboutCover' : MODE === 'dark' ? 'aboutDark' : 'aboutHtml')
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
    if (!base) { base = t; if (manual) note(t ? T('latest') : T('noConn')); return; }
    if (t && t !== base) { $('updBtn').hidden = false; if (manual) note(T('hasUpd')); }
    else if (manual) note(t ? T('latest') : T('noConn'));
  }
  head().then(t => { base = t; });
  setInterval(() => check(false), 60 * 60 * 1000);
  const soon = () => { if (Date.now() - last > 60 * 60 * 1000) check(false); };
  window.addEventListener('focus', () => { soon(); if (!$('pageTitle').hidden) refreshSel(); }); document.addEventListener('visibilitychange', () => { if (!document.hidden) soon(); });
  $('updBtn').addEventListener('click', () => { if (!busy) location.replace('app.html?v=' + Date.now()); });
  $('chkUpd').addEventListener('click', () => { menu(false); check(true); });
})();

// ---------- start ----------
I18N.apply();
$('appVer').textContent = VER;
refreshLock();
const ready = (window.Office && Office.onReady) ? Office.onReady() : Promise.resolve({});
ready.then(info => {
  if (!window.PowerPoint || (info && info.host && info.host !== Office.HostType.PowerPoint)) { say(T('onlyPpt')); return; }
  if (!Office.context.requirements.isSetSupported('PowerPointApi', '1.8')) { say(T('needNew')); return; }
  supported = true;
  try { Office.context.document.addHandlerAsync(Office.EventType.DocumentSelectionChanged, () => { if (!$('pageTitle').hidden) refreshSel(); }); } catch (e) {}
  refreshSel();
  const s = docSettings(); step1 = !!(s && s.get('udStep1')); $('s1Done').checked = step1;
  step2 = !!(s && s.get('udStep2')); $('s2Done').checked = step2;
  refreshLock();
});
})();

// UULA PDF — export to a small, high-quality PDF (Arabic / English interface)
(function(){
'use strict';
const VER = '1.4';
const $ = id => document.getElementById(id);
const I18N = (() => {
  const D = {
    ar: { dir: 'rtl', langName: 'English', update: 'تحديث جديد', menu: 'القائمة', chkUpd: 'التحقق من التحديثات', about: 'حول الأداة', close: 'إغلاق', ok: 'متابعة',
      digitsLabel: 'الأرقام في الـ PDF', hindi: 'هندية ١٢٣', latin: 'إنجليزية 123', qualityLabel: 'الجودة', high: 'عالية', medium: 'متوسطة (أصغر حجمًا)',
      linksChk: 'روابط الصور قابلة للضغط', export: 'تصدير PDF', exporting: 'جارٍ التصدير…', restoreNote: 'العرض التقديمي يرجع كما كان بعد التصدير.',
      download: 'تنزيل PDF', open: 'فتح', latest: 'لديك أحدث نسخة.', offline: 'لا يوجد اتصال.', newUpd: 'يوجد تحديث جديد: اضغط زر التحديث.',
      onlyPpt: 'تعمل الأداة في PowerPoint فقط (نسخة حديثة).', sRead: 'قراءة الملف…', sDigits: 'تحويل الأرقام…', sSlide: n => 'تجهيز الشريحة ' + n + '…',
      sPdf: 'إنشاء الـ PDF…', sRestore: 'إرجاع العرض كما كان…', sSmall: 'تصغير الحجم…',
      mathTitle: 'نسخ مؤقت لبعض الشرائح',
      mathAsk: n => '<p>' + n + ' من الشرائح تحتاج نسخة مؤقتة: الشرائح التي فيها معادلات (لتتحول أرقامها دون أن تتفكك)، والغلاف والصفحات الأولى (لتبقى أرقامها إنجليزية في الـ PDF). بعد التصدير تُعاد الأصلية.</p><p>احفظ الملف قبل المتابعة احتياطًا.</p>',
      oldPpt: ' أرقام المعادلات بقيت كما هي (نسخة PowerPoint قديمة).', mathSkipped: ' الشرائح التي فيها معادلات والغلاف بقيت كما هي.',
      done: 'تم.', restoreFail: ' تنبيه: تعذّر إرجاع بعض التغييرات، استخدم ⌘Z.', fail: 'تعذّر التصدير: ', dlHint: 'إن لم يبدأ التنزيل، اضغط «فتح» ثم احفظ الملف من النافذة.', noWin: 'تعذّر فتح نافذة جديدة.',
      aboutHtml: '<p>تصدّر العرض التقديمي إلى PDF من باوربوينت نفسه (بنفس الشكل والخطوط والمعادلات)، ثم تصغّر حجمه بضغط الصور وحذف المكرر منها.</p>' +
        '<p><b>الأرقام</b>: هندية أو إنجليزية في الـ PDF، ثم يرجع العرض كما كان. الشرائح التي فيها معادلات باوربوينت تُنسخ مؤقتًا لتتحول أرقامها دون أن تتفكك، ثم تُعاد الأصلية.</p>' +
        '<p><b>روابط الصور</b>: كل صورة أو شكل عليه رابط يبقى قابلًا للضغط في الـ PDF.</p><p>تتغير أرقام المحتوى العلمي فقط (الشرائح التي عليها رقم صفحة): الغلاف والصفحات الأولى وأرقام الصفحات والتذييل والقالب والخلفية تبقى كما هي.</p>' },
    en: { dir: 'ltr', langName: 'العربية', update: 'New update', menu: 'Menu', chkUpd: 'Check for updates', about: 'About', close: 'Close', ok: 'Continue',
      digitsLabel: 'Digits in the PDF', hindi: 'Arabic ١٢٣', latin: 'English 123', qualityLabel: 'Quality', high: 'High', medium: 'Medium (smaller)',
      linksChk: 'Picture links are clickable', export: 'Export PDF', exporting: 'Exporting…', restoreNote: 'The presentation goes back as it was after the export.',
      download: 'Download PDF', open: 'Open', latest: 'You have the latest version.', offline: 'No connection.', newUpd: 'A new update is ready: press the update button.',
      onlyPpt: 'This tool works in PowerPoint only (recent version).', sRead: 'Reading the file…', sDigits: 'Changing digits…', sSlide: n => 'Preparing slide ' + n + '…',
      sPdf: 'Creating the PDF…', sRestore: 'Putting the presentation back…', sSmall: 'Making it smaller…',
      mathTitle: 'Copying some slides for a moment',
      mathAsk: n => '<p>' + n + ' slides need a copy for a moment: slides with equations (so their digits change without breaking them) and the cover and front pages (so their digits stay English in the PDF). The originals come back after the export.</p><p>Save the file before you continue, just in case.</p>',
      oldPpt: ' Digits in equations stayed as they are (older PowerPoint).', mathSkipped: ' Digits on slides with equations stayed as they are.',
      done: 'Done.', restoreFail: ' Note: some changes could not be put back, use ⌘Z.', fail: 'Export failed: ', dlHint: 'If the download does not start, press “Open” and save it from the window.', noWin: 'Could not open a new window.',
      aboutHtml: '<p>Exports the presentation to PDF from PowerPoint itself (same look, fonts and equations), then makes it smaller by compressing pictures and removing duplicates.</p>' +
        '<p><b>Digits</b>: Arabic or English in the PDF, then the presentation goes back as it was. Slides with PowerPoint equations are copied for a moment so their digits change without breaking.</p>' +
        '<p><b>Picture links</b>: every picture or shape with a link stays clickable in the PDF.</p><p>Only the content slides change (those with a page number): the cover, front pages, page numbers, footers, the template and the background keep their digits.</p>' }
  };
  let lang = 'ar';
  try { lang = localStorage.getItem('tkpdf-lang') || (localStorage.getItem('tk-lang') === 'en' ? 'en' : 'ar'); } catch (e) {}
  if (!D[lang]) lang = 'ar';
  const T = (k, ...a) => { const v = D[lang][k]; return typeof v === 'function' ? v(...a) : v; };
  function apply(){
    document.documentElement.lang = lang; document.documentElement.dir = D[lang].dir;
    document.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = T(e.dataset.i18n); });
    document.querySelectorAll('[data-i18n-dir]').forEach(e => { e.dir = D[lang].dir; });
    document.querySelectorAll('[data-i18n-title]').forEach(e => { e.title = T(e.dataset.i18nTitle); e.setAttribute('aria-label', e.title); });
  }
  function set(l){ lang = l; try { localStorage.setItem('tkpdf-lang', l); localStorage.setItem('tk-lang', l); } catch (e) {} apply(); }
  return { T, apply, set, get lang(){ return lang; } };
})();
const T = I18N.T;
I18N.apply();
const say = (t, cls) => { const s = $('status'); s.textContent = t || ''; s.className = 'status' + (cls ? ' ' + cls : ''); };
const step = t => { $('steps').textContent = t || ''; };

// ---- menu, about, language ----
const menu = open => { $('appMenu').hidden = !open; $('menuBtn').setAttribute('aria-expanded', String(!!open)); };
$('menuBtn').addEventListener('click', e => { e.stopPropagation(); menu($('appMenu').hidden); });
document.addEventListener('click', e => { if (!e.target.closest('.appmenu')) menu(false); });
$('modalX').addEventListener('click', () => { $('modal').hidden = true; $('modalOk').hidden = true; });
$('aboutBtn').addEventListener('click', () => {
  menu(false); $('modalT').textContent = T('about');
  $('modalB').innerHTML = T('aboutHtml') + '<p class="foot" dir="ltr">Developed by <b>Zaher Alkablawi</b> · Version ' + VER + '<br>© 2026 UULA. All rights reserved.</p>';
  $('modal').hidden = false;
});
$('langItem').addEventListener('click', () => { menu(false); I18N.set(I18N.lang === 'ar' ? 'en' : 'ar'); if (!busy){ say(''); step(''); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape'){ menu(false); $('modal').hidden = true; } });
function ask(title, html, okText){
  return new Promise(res => {
    $('modalT').textContent = title; $('modalB').innerHTML = html;
    const ok = $('modalOk'), x = $('modalX'); ok.textContent = okText || T('ok'); ok.hidden = false; $('modal').hidden = false;
    const done = v => { $('modal').hidden = true; ok.hidden = true; ok.onclick = x.onclick = null; res(v); };
    ok.onclick = () => done(true); x.onclick = () => done(false);
  });
}

// ---- updates (same method as UULA Arabic Math) ----
(function(){
  const head = () => fetch('app.html?chk=' + Date.now(), { method: 'HEAD', cache: 'no-store' })
    .then(r => r.ok ? (r.headers.get('etag') || r.headers.get('last-modified')) : null).catch(() => null);
  let base = null, last = 0;
  async function check(manual){
    last = Date.now(); const t = await head();
    if (!base){ base = t; if (manual) say(t ? T('latest') : T('offline')); return; }
    if (t && t !== base){ $('updBtn').hidden = false; if (manual) say(T('newUpd')); }
    else if (manual) say(t ? T('latest') : T('offline'));
  }
  head().then(t => { base = t; });
  setInterval(() => check(false), 60 * 60 * 1000);
  const soon = () => { if (Date.now() - last > 60 * 60 * 1000) check(false); };
  window.addEventListener('focus', soon);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) soon(); });
  $('updBtn').addEventListener('click', () => location.replace('app.html?v=' + Date.now()));
  $('chkUpd').addEventListener('click', () => { menu(false); check(true); });
})();

// ---- options ----
const opt = { digits: 'hindi', quality: 'high' };
for (const id of ['digits', 'quality']) $(id).addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  opt[id] = b.dataset.v; [...$(id).children].forEach(x => x.setAttribute('aria-pressed', String(x === b)));
});
let busy = false;

// ---- the document as bytes (pptx or pdf) ----
function fileBytes(type){
  return new Promise((res, rej) => {
    Office.context.document.getFileAsync(type || Office.FileType.Compressed, { sliceSize: 4194304 }, r => {
      if (r.status !== Office.AsyncResultStatus.Succeeded) return rej(new Error(r.error && r.error.message || 'getFile'));
      const f = r.value, n = f.sliceCount, parts = []; let got = 0;
      const done = () => { f.closeAsync(); const len = parts.reduce((a, p) => a + p.length, 0), out = new Uint8Array(len); let o = 0; parts.forEach(p => { out.set(p, o); o += p.length; }); res(out); };
      for (let i = 0; i < n; i++) f.getSliceAsync(i, s => {
        if (s.status !== Office.AsyncResultStatus.Succeeded){ f.closeAsync(); return rej(new Error('slice')); }
        parts[i] = new Uint8Array(s.value.data); if (++got === n) done(); });
    });
  });
}
const b64 = { from: s => Uint8Array.from(atob(s), c => c.charCodeAt(0)),
  to: u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); } };
const MB = n => (n / 1048576).toFixed(n < 10485760 ? 1 : 0) + ' MB';
const TEXT_TYPES = new Set(['GeometricShape','TextBox','Placeholder','Callout','Freeform']);

// ---- 1) digits in ordinary text boxes (not on rebuilt slides, never in boxes with equations); returns an undo list ----
async function textDigits(dir, skipSlides, mathShapes, SH){
  const undo = [];
  await PowerPoint.run(async ctx => {
    const slides = ctx.presentation.slides; slides.load('items/id'); await ctx.sync();
    for (let si = 0; si < slides.items.length; si++){
      if (skipSlides.has(si)) continue;
      const sl = slides.items[si];
      const PROPS = 'items/id,items/type,items/name,items/left,items/top,items/height';
      const leaves = [];
      let level = [{ c: sl.shapes, path: [] }]; sl.shapes.load(PROPS); await ctx.sync();
      for (let depth = 0; level.length && depth < 6; depth++){
        const next = [];
        for (const { c, path } of level) for (const sh of c.items){
          if (sh.type === 'Group'){ try { const g = sh.group.shapes; g.load(PROPS); next.push({ c: g, path: path.concat(sh.id) }); } catch (e){} continue; }
          if (TEXT_TYPES.has(sh.type) || sh.type === 'Table'){ sh._path = path.concat(sh.id); leaves.push(sh); }
        }
        try { await ctx.sync(); } catch (e){ break; }
        level = next;
      }
      const ms = mathShapes[si] || [];
      const isMath = sh => ms.some(x => (String(x.id) === String(sh.id) && x.name === sh.name) || (x.name === sh.name && Math.abs(x.left - sh.left) + Math.abs(x.top - sh.top) < 3));
      // page numbers, footers and dates keep their digits
      for (const sh of leaves){ sh._num = sh.tags.getItemOrNullObject('MYNUMBER'); sh._num.load('value'); if (sh.type === 'Placeholder'){ try { sh.placeholderFormat.load('type'); } catch (e){} } }
      await ctx.sync();
      const pageNo = sh => !sh._num.isNullObject || (sh.type === 'Placeholder' && sh.placeholderFormat && ['SlideNumber', 'Footer', 'Date'].includes(sh.placeholderFormat.type));
      const text = leaves.filter(sh => sh.type !== 'Table' && !isMath(sh) && !pageNo(sh));
      for (const sh of text){ sh._tr = sh.textFrame.textRange; sh._tr.load('text'); }
      try { await ctx.sync(); }
      catch (e){ for (const sh of text){ try { sh._tr = sh.textFrame.textRange; sh._tr.load('text'); await ctx.sync(); } catch (e2){ sh._tr = null; } } }
      for (const sh of text){
        if (!sh._tr) continue; let t; try { t = sh._tr.text; } catch (e){ continue; }
        if (!t) continue;
        if (SH && sh.top > SH * 0.88 && /^[\s0-9٠-٩\-—–|/.]+$/.test(t)) continue; // a lone number at the bottom: the page number
        for (const r of MTC.digitEdits(t, dir)){
          sh._tr.getSubstring(r.start, r.len).text = r.rep;
          undo.push({ slide: sl.id, path: sh._path, start: r.start, len: r.len, orig: t.substr(r.start, r.len) });
        }
      }
      await ctx.sync();
      for (const sh of leaves.filter(x => x.type === 'Table')){
        try {
          const tb = sh.getTable(); tb.load('rowCount,columnCount'); await ctx.sync();
          const cells = [];
          for (let r = 0; r < tb.rowCount; r++) for (let c = 0; c < tb.columnCount; c++){ const cl = tb.getCellOrNullObject(r, c); cl.load('text'); cells.push({ cl, r, c }); }
          await ctx.sync();
          for (const { cl, r, c } of cells){
            if (cl.isNullObject || !cl.text) continue;
            const runs = MTC.digitEdits(cl.text, dir); if (!runs.length) continue;
            let t = cl.text; for (const x of runs.slice().reverse()) t = t.slice(0, x.start) + x.rep + t.slice(x.start + x.len);
            undo.push({ slide: sl.id, path: sh._path, cell: [r, c], orig: cl.text }); cl.text = t;
          }
          await ctx.sync();
        } catch (e){}
      }
    }
  });
  return undo;
}
async function undoText(undo){
  if (!undo.length) return;
  await PowerPoint.run(async ctx => {
    for (const u of undo.slice().reverse()){
      let col = ctx.presentation.slides.getItem(u.slide).shapes, sh = null;
      u.path.forEach((id, i) => { sh = col.getItem(id); if (i < u.path.length - 1) col = sh.group.shapes; });
      if (u.cell) sh.getTable().getCellOrNullObject(u.cell[0], u.cell[1]).text = u.orig;
      else sh.textFrame.textRange.getSubstring(u.start, u.len).text = u.orig;
    }
    await ctx.sync();
  });
}
// ---- 2) slides with equations: a copy with changed digits takes the place of the slide; returns an undo list ----
async function rebuildSlides(list, dir, covers){
  covers = new Set(covers || []);
  const undo = [];
  for (const idx of list.slice().sort((a, b) => b - a)){
    step(T('sSlide', idx + 1));
    await PowerPoint.run(async ctx => {
      const all = ctx.presentation.slides; all.load('items/id'); await ctx.sync();
      const slide = all.items[idx]; const ex = slide.exportAsBase64(); await ctx.sync();
      const r = covers.has(idx) ? await MTC.coverLatinBytes(b64.from(ex.value)) : await MTC.slideRebuildBytes(b64.from(ex.value), dir); if (!r) return;
      ctx.presentation.insertSlidesFromBase64(b64.to(r.bytes), { formatting: 'UseDestinationTheme', targetSlideId: slide.id });
      await ctx.sync(); all.load('items/id'); await ctx.sync();
      const fresh = all.items[idx + 1]; if (!fresh || fresh.id === slide.id) throw new Error('insert');
      slide.delete(); await ctx.sync();
      undo.push({ idx, orig: ex.value });
    });
  }
  return undo;
}
async function undoSlides(undo){
  for (const u of undo.slice().sort((a, b) => a.idx - b.idx)){
    await PowerPoint.run(async ctx => {
      const all = ctx.presentation.slides; all.load('items/id'); await ctx.sync();
      const cur = all.items[u.idx];
      ctx.presentation.insertSlidesFromBase64(u.orig, { formatting: 'UseDestinationTheme', targetSlideId: cur.id });
      await ctx.sync(); cur.delete(); await ctx.sync();
    });
  }
}

// ---- export ----
let result = null;
function fileName(){
  const u = (Office.context.document && Office.context.document.url) || '';
  const n = decodeURIComponent(u.split(/[\\/]/).pop() || '').replace(/\.(pptx?|potx?)$/i, '');
  return (n || 'UULA') + '.pdf';
}
async function run(){
  if (busy) return;
  if (!window.PowerPoint || !Office.context.requirements.isSetSupported('PowerPointApi', '1.5')) return say(T('onlyPpt'), 'bad');
  busy = true;
  const btn = $('go'), ico = btn.querySelector('svg'), sp = document.createElement('span'); sp.className = 'spin';
  btn.disabled = true; ico.replaceWith(sp); $('goTxt').textContent = T('exporting'); say(''); $('result').hidden = true;
  let tUndo = [], sUndo = [], pdf = null, restoreFail = false;
  try {
    step(T('sRead'));
    const pptx = await fileBytes(Office.FileType.Compressed);
    const dir = opt.digits;
    const links = $('links').checked ? await MTC.pictureLinks(pptx) : [];
    // only the scientific content: slides with a page number (not the cover or front pages)
    const content = await MTC.contentSlides(pptx);
    let rebuild = (await MTC.slidesNeedingRebuild(pptx, dir)).filter(i => !content || content.includes(i));
    const mp = await MTC.mathParas(pptx);
    const mathShapes = {}; for (const s of mp) mathShapes[s.slide] = s.shapes;
    let covers = await MTC.coverSlides(pptx, content);
    let skipNote = '';
    if (rebuild.length || covers.length){
      if (!Office.context.requirements.isSetSupported('PowerPointApi', '1.8')){ skipNote = T('oldPpt'); rebuild = []; covers = []; }
      else if (!(await ask(T('mathTitle'), T('mathAsk', rebuild.length + covers.length)))){ rebuild = []; covers = []; skipNote = T('mathSkipped'); }
    }
    const skip = new Set(rebuild);
    if (content){ const n = (await PowerPoint.run(async ctx => { const c = ctx.presentation.slides; c.load('items'); await ctx.sync(); return c.items.length; })); for (let i = 0; i < n; i++) if (!content.includes(i)) skip.add(i); }
    try {
      step(T('sDigits'));
      const SH = (await MTC.slideHeight(MTC.openZip(pptx))) / 12700;
      tUndo = await textDigits(dir, skip, mathShapes, SH);
      if (rebuild.length || covers.length) sUndo = await rebuildSlides(rebuild.concat(covers), dir, covers);
      step(T('sPdf'));
      pdf = await fileBytes(Office.FileType.Pdf);
    } finally {
      step(T('sRestore'));
      try { await undoText(tUndo); } catch (e){ restoreFail = true; }
      try { await undoSlides(sUndo); } catch (e){ restoreFail = true; }
    }
    step(T('sSmall'));
    const r = await PDFOPT.optimize(pdf, { quality: opt.quality, links });
    result = { bytes: r.bytes, name: fileName() };
    $('rName').textContent = result.name;
    $('rSize').innerHTML = MB(r.before) + ' → <b>' + MB(r.after) + '</b>' + (r.linksAdded ? ' · +' + r.linksAdded + ' links' : '');
    $('result').hidden = false; step('');
    say(T('done') + skipNote + (restoreFail ? T('restoreFail') : ''), restoreFail ? 'bad' : 'ok');
  } catch (e){ step(''); say(T('fail') + (e && e.message || e), 'bad'); }
  finally { busy = false; btn.disabled = false; sp.replaceWith(ico); $('goTxt').textContent = T('export'); }
}
$('go').addEventListener('click', run);

// ---- save ----
let url = null;
const blobUrl = () => { if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(new Blob([result.bytes], { type: 'application/pdf' })); return url; };
$('dl').addEventListener('click', () => {
  if (!result) return;
  const a = document.createElement('a'); a.href = blobUrl(); a.download = result.name; document.body.appendChild(a); a.click(); a.remove();
});

$('appVer').textContent = VER;
if (window.Office && Office.onReady) Office.onReady(() => {});
})();

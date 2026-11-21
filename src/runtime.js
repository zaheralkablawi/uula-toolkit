// UULA Toolkit — opens a tool from its own repository, live:
// fetches the newest app.html of the tool (e.g. https://zaheralkablawi.github.io/uula-math/app.html),
// adds the Toolkit parts (the "All tools" bar, one look, tooltips, logos) and shows it in this page.
// No connection → the copy saved with the Toolkit (bundle.html next to this tool's page).
// build.py fills /*TK_PARTS*/ with the shared Toolkit code.
(function () {
  'use strict';
  var TOOL = window.TK_TOOL, SRC = window.TK_SRC;
  /*TK_PARTS*/

  function rx(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function transform(html) {
    // UULA Dark and PPT Video Template are one page: the mode decides which part shows
    if (TOOL === 'dark' || TOOL === 'cover') {
      html = html.replace("window.UD_MODE='';", "window.UD_MODE='" + TOOL + "';");
      if (TOOL === 'cover') {
        html = html.replace('<title>UULA Dark</title>', '<title>PPT Video Template</title>')
          .replace('<span class="sub">Dark</span>', '<span class="sub">PPT Video Template</span>')
          .replace(P.DARK_HALF + '</svg><span class="bt">', P.COVER_LOGO + '</svg><span class="bt">');
      }
    }
    // Restyle is called "Design" inside the Toolkit (its own repository keeps the name UULA Restyle)
    if (TOOL === 'restyle') html = html.replace('<title>UULA Restyle</title>', '<title>Design</title>').replace('<span class="sub">Restyle</span>', '<span class="sub">Design</span>');
    // inside the Toolkit a tool shows its own name only (no "UULA" above it)
    html = html.replace(/<span class="root">UULA<\/span><span class="sub">([^<]*)<\/span>/, '<span class="root">$1</span>');
    html = html.replace('<b>UULA</b><i>Graph</i>', '<b>Graph</b>');
    // one logo style: a blue ring with the tool's sign
    if (TOOL === 'math') html = html.replace(/<h1 dir="ltr"><img class="logo" alt="" src="data:image\/png;base64,[A-Za-z0-9+\/=]*"[^>]*>/, '<h1 dir="ltr"><svg class="logo" viewBox="0 0 32 32" aria-hidden="true">' + P.MATH_LOGO + '</svg>');
    if (TOOL === 'graph') html = html.replace(/<svg class="lg" width="30" height="30" viewBox="0 0 512 512" aria-hidden="true"[\s\S]*?<\/svg>/, '<svg class="lg" width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">' + P.GRAPH_LOGO + '</svg>');
    if (TOOL === 'restyle') html = html.replace(P.RESTYLE_OLD, P.RESTYLE_LOGO);
    // the shared tooltips read Arabic Math's typed forms and shortcuts
    if (TOOL === 'math') {
      var a = "document.addEventListener('pointerdown', ()=>{ tip.hidden=true; tipEl=null; });";
      html = html.replace(a, a + "\nwindow.TK_MATH = { get TIPEX(){ return TIPEX; }, get SB(){ return typeof SHORT_BY_INS !== 'undefined' ? SHORT_BY_INS : null; }, get K(){ return K; } };");
    }
    // the tool's own update check watches its repository (the page here is only the loader)
    if (SRC !== 'bundle.html') {
      html = html.split("fetch('app.html?chk='").join('fetch(' + JSON.stringify(SRC) + " + '?chk='");
      html = html.split("fetch(page+'?chk='").join('fetch(' + JSON.stringify(SRC) + "+'?chk='");
    }
    // the Toolkit parts go last, so they win
    var tail = '<style>' + P.THEME + (P.TOOL_CSS[TOOL] || '') + '</style>\n<script>window.TK_TOOL = ' + JSON.stringify(TOOL) +
      '; window.TK_SRC = ' + JSON.stringify(SRC) + ';\n' + P.SCRIPTS + '<\/script>\n';
    var i = html.lastIndexOf('</body>');
    return i >= 0 ? html.slice(0, i) + tail + html.slice(i) : html + '\n' + tail;
  }
  function show(html) { document.open(); document.write(transform(html)); document.close(); }
  function fail() {
    document.body.innerHTML = '<p style="font:14px -apple-system,Segoe UI,sans-serif;color:#5d6878;text-align:center;padding:40px 16px" dir="rtl">تعذّر فتح الأداة. تأكد من الاتصال بالإنترنت ثم أعد فتحها.<br><a href="../../index.html">كل الأدوات</a></p>';
  }
  var ok = function (r) { if (!r.ok) throw new Error(r.status); return r.text(); };
  var good = function (t) { return t && t.length > 2000 && /<\/(body|html)>|<script/i.test(t); };
  // the newest copy, straight from the repository (no cached copy)
  fetch(SRC + (SRC.indexOf('?') < 0 ? '?' : '&') + 'v=' + Date.now(), { cache: 'no-store' })
    .then(ok).then(function (t) { if (!good(t)) throw new Error('bad'); show(t); })
    .catch(function () { fetch('bundle.html', { cache: 'no-cache' }).then(ok).then(show).catch(fail); });
})();

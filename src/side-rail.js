// UULA Toolkit — side rail inside every tool: a very small arrow on the right edge; click it and every tool
// shows in a slim column (the user's own order, hidden tools left out). A click opens that tool here; the rail
// hides again by itself when the pointer leaves it.
(function () {
  if (typeof TK_TOOLS === 'undefined') return;
  var TOOL = window.TK_TOOL || '';
  function list() {
    var hidden = [], order = [];
    try { hidden = JSON.parse(localStorage.getItem('tk-hidden')) || []; order = JSON.parse(localStorage.getItem('tk-order')) || []; } catch (e) {}
    var host = '';
    try { var h = Office.context.host; host = h === 'Word' ? 'word' : h === 'PowerPoint' ? 'ppt' : ''; } catch (e) {}
    return TK_TOOLS.slice().sort(function (a, b) {
      var i = order.indexOf(a.id), j = order.indexOf(b.id);
      return (i < 0 ? 1e3 + TK_TOOLS.indexOf(a) : i) - (j < 0 ? 1e3 + TK_TOOLS.indexOf(b) : j);
    }).filter(function (t) { return (!host || t.hosts.indexOf(host) >= 0) && (hidden.indexOf(t.id) < 0 || t.id === TOOL); });
  }
  function add() {
    if (document.getElementById('tkRail')) return;
    var en = false; try { en = localStorage.getItem('tk-lang') === 'en'; } catch (e) {}
    var css = document.createElement('style');
    css.textContent =
      '#tkTab{position:fixed;right:0;top:50%;z-index:1001;width:11px;height:46px;margin-top:-23px;padding:0;border:1px solid #d9dfe7;border-right:0;' +
      'border-radius:7px 0 0 7px;background:#fff;color:#1f71de;cursor:pointer;display:grid;place-items:center;box-shadow:-1px 1px 4px rgb(0 0 0 / .08);opacity:.85}' +
      '#tkTab:hover{opacity:1;width:14px;background:#e7effc;border-color:#1f71de}' +
      '#tkTab svg{width:8px;height:8px}' +
      '#tkRail{position:fixed;right:0;top:0;bottom:0;z-index:1002;width:54px;background:#fff;border-left:1px solid #d9dfe7;box-shadow:-6px 0 18px rgb(0 0 0 / .14);' +
      'display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 0;overflow-y:auto;transform:translateX(100%);transition:transform .16s ease;visibility:hidden}' +
      '#tkRail.open{transform:none;visibility:visible}' +
      '#tkRail button{flex:none;width:40px;height:40px;padding:0;border:1px solid transparent;border-radius:10px;background:none;cursor:pointer;display:grid;place-items:center}' +
      '#tkRail button:hover{background:#e7effc;border-color:#1f71de}' +
      '#tkRail button.cur{background:#e7effc;border-color:#9dbcf0}' +
      '#tkRail button svg{width:28px;height:28px}' +
      '#tkRail .home svg{width:20px;height:20px;color:#1f71de}' +
      '#tkRail hr{width:30px;border:0;border-top:1px solid #d9dfe7;margin:2px 0}';
    document.head.appendChild(css);
    var tab = document.createElement('button');
    tab.type = 'button'; tab.id = 'tkTab'; tab.setAttribute('aria-label', en ? 'Tools' : 'الأدوات');
    tab.innerHTML = '<svg viewBox="0 0 8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 1L2.5 4l3 3"/></svg>';
    var rail = document.createElement('nav');
    rail.id = 'tkRail'; rail.setAttribute('aria-label', en ? 'Tools' : 'الأدوات');
    document.body.appendChild(tab); document.body.appendChild(rail);

    var timer = 0;
    function draw() {
      var h = '<button type="button" class="home" data-go="home" data-tkn="' + (en ? 'All tools' : 'كل الأدوات') + '">' +
        '<svg viewBox="0 0 20 20" fill="currentColor"><rect x="3" y="3" width="6" height="6" rx="1.3"/><rect x="11" y="3" width="6" height="6" rx="1.3"/><rect x="3" y="11" width="6" height="6" rx="1.3"/><rect x="11" y="11" width="6" height="6" rx="1.3"/></svg></button><hr>';
      list().forEach(function (t) {
        h += '<button type="button" data-go="' + t.id + '" data-tkn="' + t.name + '"' + (t.id === TOOL ? ' class="cur" aria-current="page"' : '') +
          '><svg viewBox="0 0 32 32" aria-hidden="true">' + t.icon + '</svg></button>';
      });
      rail.innerHTML = h;
    }
    function open() { clearTimeout(timer); draw(); rail.classList.add('open'); tab.style.visibility = 'hidden'; }
    function close() { clearTimeout(timer); rail.classList.remove('open'); tab.style.visibility = ''; }
    tab.addEventListener('click', open);
    tab.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') timer = setTimeout(open, 350); });
    tab.addEventListener('pointerleave', function () { if (!rail.classList.contains('open')) clearTimeout(timer); });
    rail.addEventListener('pointerleave', function () { timer = setTimeout(close, 450); });
    rail.addEventListener('pointerenter', function () { clearTimeout(timer); });
    document.addEventListener('pointerdown', function (e) { if (rail.classList.contains('open') && !rail.contains(e.target) && e.target !== tab) close(); }, true);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    rail.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var go = b.dataset.go;
      if (go === TOOL) { close(); return; }
      location.href = go === 'home' ? '../../index.html?v=' + Date.now() : '../' + go + '/app.html?v=' + Date.now();
    });
  }
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
})();

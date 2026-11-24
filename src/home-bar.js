// UULA Toolkit — thin bar added on top of every tool: back to the tools list
var TK_MENU_LEFT = 10;
(function () {
  function add() {
    if (document.getElementById('tkBar')) return;
    var en = false;
    try { en = localStorage.getItem('tk-lang') === 'en'; } catch (e) {}
    var label = en ? 'All tools' : 'كل الأدوات';
    var css = document.createElement('style');
    css.textContent =
      '#tkBar{position:sticky;top:0;z-index:1000;display:flex;align-items:center;gap:8px;height:30px;padding:0 10px;' +
      'background:#fff;border-bottom:1px solid #d9dfe7;direction:rtl;font:13px "UULA Sans",-apple-system,"Segoe UI",Tahoma,sans-serif}' +
      '#tkBar button{display:inline-flex;align-items:center;gap:5px;height:24px;padding:0 8px;border:1px solid #d9dfe7;border-radius:7px;' +
      'background:#fff;color:#1f71de;font:inherit;font-size:12px;font-weight:600;cursor:pointer}' +
      '#tkBar button:hover{border-color:#1f71de;background:#e7effc}' +
      '#tkBar span{margin-inline-start:auto;color:#9aa3b0;font-size:11px;direction:ltr}';
    document.head.appendChild(css);
    var b = document.createElement('div');
    b.id = 'tkBar';
    b.innerHTML =
      '<button type="button" title="' + label + '"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M8 4l6 6-6 6"/></svg>' + label + '</button><span>UULA Toolkit</span>';
    b.querySelector('button').addEventListener('click', function () {
      location.href = '../../index.html?v=' + Date.now();
    });
    document.body.insertBefore(b, document.body.firstChild);
    menuIcons(); pinGraphMenu();
  }
  function menuIcons() {
    var css2 = document.createElement('style'); css2.textContent = TK_MENU_CSS; document.head.appendChild(css2);
    var m = document.getElementById('appMenu'); if (!m) return;
    var q = function (s) { return m.querySelector(s); };
    var lb = document.getElementById('langBtn');
    // a tool with a language button but no language item in its menu (Restyle): add the item, so the button can go
    if (lb && !q('#langItem')) {
      var li = document.createElement('button'); li.type = 'button'; li.id = 'langItem';
      var label = function () { li.textContent = document.documentElement.lang === 'en' ? 'العربية' : 'English'; };
      label();
      li.addEventListener('click', function (e) {
        e.stopPropagation(); m.hidden = true;
        var mb = document.getElementById('menuBtn'); if (mb) mb.setAttribute('aria-expanded', 'false');
        lb.click(); label();
      });
      m.insertBefore(li, q('#aboutBtn'));
    }
    if (lb && q('#langItem')) lb.style.display = 'none';
    // keep the menu inside the pane in both languages (in English some tools open it towards the outside)
    // every tool's menu opens at the same place: the left edge of the pane, in Arabic and English
    var fit = function () {
      if (m.hidden) return;
      var d = document.documentElement.lang === 'en' ? 'ltr' : 'rtl'; if (m.dir !== d) m.dir = d;
      var mb = document.getElementById('menuBtn'), top = mb ? mb.getBoundingClientRect().bottom + 4 : 40;
      m.style.setProperty('position', 'fixed', 'important'); m.style.setProperty('left', TK_MENU_LEFT + 'px', 'important');
      m.style.setProperty('right', 'auto', 'important'); m.style.setProperty('top', top + 'px', 'important');
    };
    new MutationObserver(fit).observe(m, { attributes: true, attributeFilter: ['hidden', 'dir'] });
    tkIcon(q('#chkUpd'), 'upd'); tkIcon(q('#langItem'), 'lang'); tkIcon(q('#aboutBtn'), 'about');
    ['new', 'help', 'keys', 'news', 'about', 'edit'].forEach(function (a) { tkIcon(q('[data-act="' + a + '"]'), a); });
  }
  // UULA Graph opens its menus from the top bar (#mnu): keep them at the same left edge too
  function pinGraphMenu() {
    var g = document.getElementById('mnu'); if (!g) return;
    new MutationObserver(function () { if (g.hidden) return;
      if (g.style.left !== TK_MENU_LEFT + 'px') { g.style.left = TK_MENU_LEFT + 'px'; g.style.right = 'auto'; } })
      .observe(g, { attributes: true, attributeFilter: ['hidden', 'style'] });
  }
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
})();

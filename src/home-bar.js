// UULA Toolkit — thin bar added on top of every tool: back to the tools list
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
  }
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
})();

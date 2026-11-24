// UULA Toolkit — one icon set for every menu (same drawings as UULA Graph's menu: 24px grid, stroke 2)
var TK_ICONS = {
  upd: '<path d="M20 11a8 8 0 0 0-14.9-3.5L4 9"/><path d="M4 4v5h5"/><path d="M4 13a8 8 0 0 0 14.9 3.5L20 15"/><path d="M20 20v-5h-5"/>',
  lang: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  pic: '<rect x="3" y="4" width="10" height="9" rx="1.5"/><path d="M3 11l3-3 3 3"/><path d="M15 9h3l-1.5-1.5M18 9l-1.5 1.5"/><path d="M14 20l3.5-6 3.5 6z"/>',
  tools: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  about: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  new: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M12 11v6M9 14h6"/>',
  help: '<path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M8 7h7M8 11h5"/>',
  keys: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/>',
  news: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z"/>'
};
var TK_MENU_CSS =
  '.tki{display:flex!important;align-items:center;gap:8px}' +
  '.tki::before{content:"";flex:none;width:15px;height:15px;background:currentColor;' +
  '-webkit-mask:var(--tki) center/contain no-repeat;mask:var(--tki) center/contain no-repeat}';
function tkIcon(el, name) {
  if (!el || !TK_ICONS[name]) return;
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + TK_ICONS[name] + '</svg>';
  el.classList.add('tki');
  el.style.setProperty('--tki', 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")');
}

# UULA Toolkit — build.
#   python3 build.py
#
# Each tool opens LIVE from its own repository: tools/<id>/app.html is a small loader that fetches the newest
# app.html of the tool (e.g. https://zaheralkablawi.github.io/uula-math/app.html), adds the Toolkit parts
# (the "كل الأدوات" bar, one look, tooltips, logos — all in tk-runtime.js) and shows it.
# So a change pushed to a tool's own repository reaches the Toolkit at once, with no Toolkit build.
#
# tools/<id>/bundle.html is the copy saved with the Toolkit, used only when the repository can't be reached.
# Bundles come from the sibling clones (../uula-math etc.) when they exist, else from src/.
import json, pathlib, re, shutil

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / 'src'
PAGES = 'https://zaheralkablawi.github.io/'

# ---------- the tools: id → its live page ----------
TOOLS = {
    'restyle': PAGES + 'uula-restyle/app.html',
    'math': PAGES + 'uula-math/app.html',
    'graph': PAGES + 'uula-graph/app.html',
    'geometry': PAGES + 'uula-geometry/app.html',
    'dark': PAGES + 'uula-dark/app.html',
    'cover': PAGES + 'uula-dark/app.html',      # PPT Video Template = UULA Dark's page in "cover" mode
}

# ---------- Toolkit parts added to every tool ----------
MATH_LOGO = ('<circle cx="16" cy="16" r="12.5" fill="none" stroke="#1f71de" stroke-width="2.6"/>'
             '<path d="M23.5 16.5l-2.4 4.6-4.2-11.1H8.5" fill="none" stroke="#1f71de" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
             '<path d=\"M14.6 13.2c-1-.9-3-.6-3 .8 0 1.2 1.5 1.7 2.9 1.3-2.2.4-3.8 1.6-3.5 3.2.3 1.4 2 1.9 3.8 1.4\" fill=\"none\" stroke=\"#1f71de\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>')
GRAPH_LOGO = ('<circle cx="16" cy="16" r="12.5" fill="none" stroke="#1f71de" stroke-width="2.6"/>'
              '<path d="M9 16h14M16 9v14" stroke="#9aa3b0" stroke-width="1.4"/>'
              '<path d="M10.5 9.5c2 9 9 9 11 0" fill="none" stroke="#1f71de" stroke-width="2.4" stroke-linecap="round"/>')
COVER_LOGO = ('<rect x="8.6" y="11" width="14.8" height="10" rx="1.6" fill="#1f71de"/>'
              '<path d="M12 15h8M13.5 18h5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>')
DARK_HALF = '<path d="M16 3.5a12.5 12.5 0 0 1 0 25z" fill="#1f71de"/>'
RESTYLE_OLD = '<path fill="#1f71de" d="M16 7.2l2.1 5.6 5.7 2.2-5.7 2.2L16 22.8l-2.1-5.6-5.7-2.2 5.7-2.2z"/><circle cx="22.3" cy="22.3" r="1.9" fill="#1f71de"/>'
RESTYLE_LOGO = '<rect x="10.5" y="9" width="11" height="14" rx="1.6" fill="#1f71de"/><path d="M13 12.5h6M13 15.5h6M13 18.5h3.5" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>'
# per-tool look fixes (headers line up, one blue, same sizes) — on top of src/theme.css
TOOL_CSS = {
    'dark': '.dbtn{height:30px!important;font-size:13.5px!important;border-radius:8px!important}.sbody b{font-size:13.5px}',
    'cover': '#tPos button,#iPos button{font-weight:600!important}',
    'math': 'body{font-size:14px}h1{margin-right:0!important;position:relative;left:2px}',
    'graph': ':root{--bg:#f3f5f8;--line:#d9dfe7;--fg:#18212e;--muted:#5d6878;--accent:#1f71de}'
             'body>footer,#app>footer,footer{font-size:11.5px!important;color:#5d6878!important;text-align:center}.brand{position:relative;right:4px}',
    'restyle': '.ib.lang{color:#5d6878;font-weight:600;font-size:.8rem}header h1{margin-right:4px}',
}
read = lambda p: p.read_text(encoding='utf8')
TIPS = read(SRC / 'tips.js')
SCRIPTS = (read(SRC / 'menu-icons.js') + read(SRC / 'home-bar.js') + TIPS).replace('</script', '<\\/script')
PARTS = {'THEME': read(SRC / 'theme.css'), 'TOOL_CSS': TOOL_CSS, 'SCRIPTS': SCRIPTS,
         'MATH_LOGO': MATH_LOGO, 'GRAPH_LOGO': GRAPH_LOGO, 'COVER_LOGO': COVER_LOGO, 'DARK_HALF': DARK_HALF,
         'RESTYLE_OLD': RESTYLE_OLD, 'RESTYLE_LOGO': RESTYLE_LOGO}
runtime = read(SRC / 'runtime.js').replace('/*TK_PARTS*/', 'var P = ' + json.dumps(PARTS, ensure_ascii=False) + ';')
(ROOT / 'tk-runtime.js').write_text(runtime, encoding='utf8')
print('tk-runtime.js', len(runtime))


# ---------- bundles (the saved copies) ----------
def inline(folder, parts, extra=None):
    t = read(folder / 'app.template.html')
    for key, val in (extra or {}).items():
        t = t.replace('/*' + key + '*/', val)
    for key, f in parts:
        t = t.replace('/*' + key + '*/', read(folder / f).replace('</script', '<\\/script'))
    return t


def sibling(repo):
    p = ROOT.parent / repo / 'app.html'
    return read(p) if p.exists() else None


dark = sibling('uula-dark') or inline(SRC / 'dark', [('I18N', 'i18n.js'), ('JSZIP', 'jszip.min.js'), ('ENGINE', 'engine.js'), ('APP', 'app.js')],
                                      {'MODE': '', 'TITLE': 'UULA Dark', 'SUB': 'Dark'})
BUNDLES = {
    'restyle': sibling('uula-restyle') or inline(SRC / 'restyle', [('JSZIP', 'jszip.min.js'), ('ASSETS', 'assets.js'), ('ENGINE', 'engine.js'),
                                                                   ('TEMPLATES', 'templates.js'), ('WORD', 'word.js'), ('APP', 'app.js')]),
    'math': sibling('uula-math') or read(SRC / 'math' / 'app.html'),
    'graph': sibling('uula-graph') or read(SRC / 'graph' / 'app.html'),
    'geometry': sibling('uula-geometry') or read(SRC / 'geometry' / 'app.html'),
    'dark': dark,
    'cover': dark,
}
# keep src/math and src/graph in step with the bundles
for k, f in [('math', SRC / 'math' / 'app.html'), ('graph', SRC / 'graph' / 'app.html'), ('geometry', SRC / 'geometry' / 'app.html')]:
    f.parent.mkdir(exist_ok=True)
    if not f.exists() or BUNDLES[k] != read(f): f.write_text(BUNDLES[k], encoding='utf8')

LOADER = '''<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Cache-Control" content="no-cache"><title>UULA Toolkit</title>
<style>body{{margin:0;height:100vh;display:grid;place-items:center;background:#f3f5f8;color:#9aa3b0;font:13px -apple-system,"Segoe UI",sans-serif}}</style>
</head><body>…
<script>
// UULA Toolkit — opens {tool} from its own repository (newest version), see tk-runtime.js
window.TK_TOOL = {tool_js}; window.TK_SRC = {src_js};
(function () {{ var s = document.createElement('script'); s.src = '../../tk-runtime.js?v=' + Date.now(); document.head.appendChild(s); }})();
</script>
</body></html>
'''
for tool, src in TOOLS.items():
    d = ROOT / 'tools' / tool
    d.mkdir(parents=True, exist_ok=True)
    (d / 'bundle.html').write_text(BUNDLES[tool], encoding='utf8')
    (d / 'app.html').write_text(LOADER.format(tool=tool, tool_js=json.dumps(tool), src_js=json.dumps(src)), encoding='utf8')
    print(f'tools/{tool}: loader -> {src}  (bundle {len(BUNDLES[tool])})')

# PPT Video Template opens UULA Dark's page from this folder: its slide templates live here
tpl = ROOT / 'tools' / 'cover' / 'templates'
shutil.rmtree(tpl, ignore_errors=True)
shutil.copytree(SRC / 'cover-templates', tpl)

# ---------- home page: shared menu icons and tooltips (between the markers) ----------
idx = ROOT / 'index.html'
h = read(idx)
mi = '/*MI*/\n' + read(SRC / 'menu-icons.js') + '/*MI-END*/\n'
h = re.sub(r'/\*MI\*/\n(?:.*?/\*MI-END\*/\n)?', lambda m: mi, h, count=1, flags=re.S)
tl = '/*TL*/\n' + read(SRC / 'tools-list.js') + '/*TL-END*/\n'
h = re.sub(r'/\*TL\*/\n(?:.*?/\*TL-END\*/\n)?', lambda m: tl, h, count=1, flags=re.S)
tips = "/*TIPS*/\nwindow.TK_TOOL = 'home';\n" + TIPS.replace('</script', '<\\/script') + '/*TIPS-END*/\n'
h = re.sub(r'/\*TIPS\*/\n(?:.*?/\*TIPS-END\*/\n)?', lambda m: tips, h, count=1, flags=re.S)
idx.write_text(h, encoding='utf8')
print('index.html: menu icons and tooltips updated')

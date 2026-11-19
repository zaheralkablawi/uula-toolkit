# UULA Toolkit — builds every tool into tools/<name>/app.html (one self-contained file per tool,
# so each tool's own update check covers it) and adds the "كل الأدوات" bar on top of each tool.
#   python3 build.py
import pathlib, re, shutil

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / 'src'
MATH_LOGO = ('<circle cx="16" cy="16" r="12.5" fill="none" stroke="#1f71de" stroke-width="2.6"/>'
             '<path d="M8.5 16.5l2.4 4.6 4.2-11.1h8.4" fill="none" stroke="#1f71de" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>')
GRAPH_LOGO = ('<circle cx="16" cy="16" r="12.5" fill="none" stroke="#1f71de" stroke-width="2.6"/>'
              '<path d="M9 16h14M16 9v14" stroke="#9aa3b0" stroke-width="1.4"/>'
              '<path d="M10.5 9.5c2 9 9 9 11 0" fill="none" stroke="#1f71de" stroke-width="2.4" stroke-linecap="round"/>')
BAR = '<script>' + (SRC / 'menu-icons.js').read_text(encoding='utf8') + (SRC / 'home-bar.js').read_text(encoding='utf8') + '</script>\n'


def inline(folder, parts, extra=None):
    t = (folder / 'app.template.html').read_text(encoding='utf8')
    for key, val in (extra or {}).items():
        t = t.replace('/*' + key + '*/', val)
    for key, f in parts:
        code = (folder / f).read_text(encoding='utf8').replace('</script', '<\\/script')
        t = t.replace('/*' + key + '*/', code)
    return t


# small per-tool fixes so all tool headers look the same inside the toolkit
FIX_CSS = {
    'math': 'h1{margin-right:0!important;position:relative;left:2px}',
    'graph': '.brand{position:relative;right:4px}',
    'restyle': '.ib.lang{color:#5d6878;font-weight:600;font-size:.8rem}header h1{margin-right:4px}',
}
COVER_LOGO = ('<rect x="8.6" y="11" width="14.8" height="10" rx="1.6" fill="#1f71de"/>'
              '<path d="M12 15h8M13.5 18h5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>')

RESTYLE_OLD = '<path fill="#1f71de" d="M16 7.2l2.1 5.6 5.7 2.2-5.7 2.2L16 22.8l-2.1-5.6-5.7-2.2 5.7-2.2z"/><circle cx="22.3" cy="22.3" r="1.9" fill="#1f71de"/>'
RESTYLE_LOGO = '<rect x="10.5" y="9" width="11" height="14" rx="1.6" fill="#1f71de"/><path d="M13 12.5h6M13 15.5h6M13 18.5h3.5" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>'


def out(name, html):
    if name in FIX_CSS:
        tag = '<style>' + FIX_CSS[name] + '</style>'
        html = html.replace('</head>', tag + '</head>', 1) if '</head>' in html else html.replace('</style>', '</style>' + tag, 1)
    if name == 'restyle':  # Restyle: booklet-page logo
        html = html.replace(RESTYLE_OLD, RESTYLE_LOGO, 1)
    if name == 'cover':  # Cover gets its own logo (the slide), not Dark's half circle
        html = html.replace('<path d="M16 3.5a12.5 12.5 0 0 1 0 25z" fill="#1f71de"/></svg><span class="bt">', COVER_LOGO + '</svg><span class="bt">', 1)
    # inside the toolkit the tools show their own name only (no "UULA" above it)
    html = re.sub(r'<span class="root">UULA</span><span class="sub">([^<]*)</span>', r'<span class="root">\1</span>', html, count=1)
    html = html.replace('<b>UULA</b><i>Graph</i>', '<b>Graph</b>', 1)
    # Arabic Math: same logo style as the other tools (blue ring + symbol), instead of the UULA picture
    html = re.sub(r'<h1 dir="ltr"><img class="logo" alt="" src="data:image/png;base64,[A-Za-z0-9+/=]*"[^>]*>',
                  '<h1 dir="ltr"><svg class="logo" viewBox="0 0 32 32" aria-hidden="true">' + MATH_LOGO + '</svg>', html, count=1)
    # Graph: same logo style as the other tools (blue ring + parabola), instead of the filled square
    html = re.sub(r'<svg class="lg" width="30" height="30" viewBox="0 0 512 512" aria-hidden="true".*?</svg>',
                  '<svg class="lg" width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">' + GRAPH_LOGO + '</svg>', html, count=1, flags=re.S)
    d = ROOT / 'tools' / name
    d.mkdir(parents=True, exist_ok=True)
    i = html.rfind('</body>')
    html = html[:i] + BAR + html[i:] if i >= 0 else html + '\n' + BAR
    (d / 'app.html').write_text(html, encoding='utf8')
    print(f'tools/{name}/app.html', len(html))


dark_parts = [('I18N', 'i18n.js'), ('JSZIP', 'jszip.min.js'), ('ENGINE', 'engine.js'), ('APP', 'app.js')]
# UULA Dark and UULA Cover share one source (src/dark); MODE decides which part is shown
out('dark', inline(SRC / 'dark', dark_parts, {'MODE': 'dark', 'TITLE': 'UULA Dark', 'SUB': 'Dark'}))
out('cover', inline(SRC / 'dark', dark_parts, {'MODE': 'cover', 'TITLE': 'UULA Cover', 'SUB': 'Cover'}))
tpl = ROOT / 'tools' / 'cover' / 'templates'
shutil.rmtree(tpl, ignore_errors=True)
shutil.copytree(SRC / 'cover-templates', tpl)

out('restyle', inline(SRC / 'restyle', [('JSZIP', 'jszip.min.js'), ('ASSETS', 'assets.js'), ('ENGINE', 'engine.js'),
                                         ('TEMPLATES', 'templates.js'), ('WORD', 'word.js'), ('APP', 'app.js')]))
out('math', (SRC / 'math' / 'app.html').read_text(encoding='utf8'))
out('graph', (SRC / 'graph' / 'app.html').read_text(encoding='utf8'))

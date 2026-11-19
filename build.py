# UULA Toolkit — builds every tool into tools/<name>/app.html (one self-contained file per tool,
# so each tool's own update check covers it) and adds the "كل الأدوات" bar on top of each tool.
#   python3 build.py
import pathlib, re, shutil

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / 'src'
BAR = '<script>' + (SRC / 'home-bar.js').read_text(encoding='utf8') + '</script>\n'


def inline(folder, parts, extra=None):
    t = (folder / 'app.template.html').read_text(encoding='utf8')
    for key, val in (extra or {}).items():
        t = t.replace('/*' + key + '*/', val)
    for key, f in parts:
        code = (folder / f).read_text(encoding='utf8').replace('</script', '<\\/script')
        t = t.replace('/*' + key + '*/', code)
    return t


def out(name, html):
    # inside the toolkit the tools show their own name only (no "UULA" above it)
    html = re.sub(r'<span class="root">UULA</span><span class="sub">([^<]*)</span>', r'<span class="root">\1</span>', html, count=1)
    html = html.replace('<b>UULA</b><i>Graph</i>', '<b>Graph</b>', 1)
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

# UULA Toolkit — writes UULA-Toolkit.xml (the install file): the UULA tab with a UULA Toolkit button
# (opens the tools list) and one button per tool (opens that tool in its own pane, so several tools can be open together).
#   python3 build_manifest.py
# A changed install file means installing again (once). Tools added later still show in the UULA Toolkit list at once.
import json, pathlib, re, subprocess
from xml.sax.saxutils import escape

ROOT = pathlib.Path(__file__).parent
U = 'https://zaheralkablawi.github.io/uula-toolkit/'
ID = '36f5f959-c945-487a-b5d3-c33d6c76f199'
VERSION = '1.4.0.0'
# the tool buttons, in ribbon order: id, label, Arabic tip, hosts (from src/tools-list.js)
tools = json.loads(subprocess.check_output(['node', '-e', '''
global.window = {}; eval(require('fs').readFileSync('src/tools-list.js', 'utf8').replace(/var /g, 'global.'));
console.log(JSON.stringify(TK_TOOLS.map(t => ({ id: t.id, name: t.name, hosts: t.hosts, tip: t.desc.ppt }))));'''], cwd=ROOT))
HOSTS = {'Presentation': 'ppt', 'Document': 'word'}


def button(host_key, bid, label_res, tip_res, icon, pane, url_res):
    return f'''                <Control xsi:type="Button" id="UULATK.{bid}{host_key}">
                  <Label resid="{label_res}"/>
                  <Supertip><Title resid="{label_res}"/><Description resid="{tip_res}"/></Supertip>
                  <Icon><bt:Image size="16" resid="{icon}16"/><bt:Image size="32" resid="{icon}32"/><bt:Image size="80" resid="{icon}80"/></Icon>
                  <Action xsi:type="ShowTaskpane"><TaskpaneId>{pane}</TaskpaneId><SourceLocation resid="{url_res}"/></Action>
                </Control>
'''


def group(k, gid, label_res, icon, ctl):
    return f'''              <Group id="UULATK.G{gid}{k}">
                <Label resid="{label_res}"/>
                <Icon><bt:Image size="16" resid="{icon}16"/><bt:Image size="32" resid="{icon}32"/><bt:Image size="80" resid="{icon}80"/></Icon>
{ctl}              </Group>
'''


def host(name):
    # one group per button: Office keeps a one-button group at full size, so all buttons look the same
    k = name[0]
    groups = group(k, 'Main', 'TK.Button', 'TK.Icon', button(k, 'Open', 'TK.Button', 'TK.Tip', 'TK.Icon', 'UULAToolkitPane', 'TK.Url'))
    for t in tools:
        if HOSTS[name] in t['hosts']:
            i = t['id']
            groups += group(k, '_' + i, 'T.' + i, 'T.' + i + '.i',
                            button(k, 'T_' + i, 'T.' + i, 'T.' + i + '.tip', 'T.' + i + '.i', 'UULA_' + i, 'T.' + i + '.u'))
    return f'''      <Host xsi:type="{name}">
        <DesktopFormFactor>
          <ExtensionPoint xsi:type="PrimaryCommandSurface">
            <CustomTab id="UULATK.Tab{k}">
{groups}              <Label resid="TK.Tab"/>
            </CustomTab>
          </ExtensionPoint>
        </DesktopFormFactor>
      </Host>
'''


images = ''.join(f'        <bt:Image id="TK.Icon{s}" DefaultValue="{U}icon-{s}.png"/>\n' for s in (16, 32, 80))
images += ''.join(f'        <bt:Image id="T.{t["id"]}.i{s}" DefaultValue="{U}icons/{t["id"]}-{s}.png"/>\n' for t in tools for s in (16, 32, 80))
urls = f'        <bt:Url id="TK.Url" DefaultValue="{U}taskpane.html"/>\n'
urls += ''.join(f'        <bt:Url id="T.{t["id"]}.u" DefaultValue="{U}taskpane.html?tool={t["id"]}"/>\n' for t in tools)
short = '        <bt:String id="TK.Tab" DefaultValue="UULA Toolkit"/>\n        <bt:String id="TK.Group" DefaultValue="UULA"/>\n        <bt:String id="TK.Button" DefaultValue="UULA Toolkit"/>\n'
short += ''.join(f'        <bt:String id="T.{t["id"]}" DefaultValue="{escape(t["name"])}"/>\n' for t in tools)
long_ = '        <bt:String id="TK.Tip" DefaultValue="كل أدوات علا في مكان واحد"/>\n'
long_ += ''.join(f'        <bt:String id="T.{t["id"]}.tip" DefaultValue="{escape(t["tip"])}. تفتح في نافذة خاصة بها."/>\n' for t in tools)
names = ' و'.join(t['name'] for t in tools)

xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bt="http://schemas.microsoft.com/office/officeappbasictypes/1.0"
  xmlns:ov="http://schemas.microsoft.com/office/taskpaneappversionoverrides"
  xsi:type="TaskPaneApp">
  <Id>{ID}</Id>
  <Version>{VERSION}</Version>
  <ProviderName>Zaher Alkablawi</ProviderName>
  <DefaultLocale>ar-SA</DefaultLocale>
  <DisplayName DefaultValue="UULA Toolkit"/>
  <Description DefaultValue="كل أدوات علا للباوربوينت والوورد في إضافة واحدة: {escape(names)}."/>
  <IconUrl DefaultValue="{U}icon-32.png"/>
  <HighResolutionIconUrl DefaultValue="{U}icon-64.png"/>
  <SupportUrl DefaultValue="https://github.com/zaheralkablawi/uula-toolkit"/>
  <AppDomains>
    <AppDomain>https://zaheralkablawi.github.io</AppDomain>
  </AppDomains>
  <Hosts>
    <Host Name="Presentation"/>
    <Host Name="Document"/>
  </Hosts>
  <DefaultSettings>
    <SourceLocation DefaultValue="{U}taskpane.html"/>
  </DefaultSettings>
  <Permissions>ReadWriteDocument</Permissions>
  <VersionOverrides xmlns="http://schemas.microsoft.com/office/taskpaneappversionoverrides" xsi:type="VersionOverridesV1_0">
    <Hosts>
{host("Presentation")}{host("Document")}    </Hosts>
    <Resources>
      <bt:Images>
{images}      </bt:Images>
      <bt:Urls>
{urls}      </bt:Urls>
      <bt:ShortStrings>
{short}      </bt:ShortStrings>
      <bt:LongStrings>
{long_}      </bt:LongStrings>
    </Resources>
  </VersionOverrides>
</OfficeApp>
'''
(ROOT / 'UULA-Toolkit.xml').write_text(xml, encoding='utf8')
(ROOT / 'mac' / 'UULA-Toolkit.xml').write_text(xml, encoding='utf8')
print('UULA-Toolkit.xml', VERSION, '—', len(tools), 'tool buttons')

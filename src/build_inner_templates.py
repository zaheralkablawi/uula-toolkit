import sys
from pptx import Presentation
SRC='t.pptx'; OUT=sys.argv[1]
RID='{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'
P='{http://schemas.openxmlformats.org/presentationml/2006/main}'
def one(n, out, fill=False):
    prs=Presentation(SRC); part=f'/ppt/slideLayouts/slideLayout{n}.xml'
    lst=prs.slides._sldIdLst
    for sid in list(lst): prs.part.drop_rel(sid.get(RID)); lst.remove(sid)
    for m in prs.slide_masters:
        for l in m.slide_layouts:
            if str(l.part.partname)==part: km,kl=m,l
    mlst=prs.part._element.find(P+'sldMasterIdLst')
    for mid in list(mlst):
        if prs.part.related_part(mid.get(RID)) is not km.part: prs.part.drop_rel(mid.get(RID)); mlst.remove(mid)
    llst=km._element.find(P+'sldLayoutIdLst')
    for lid in list(llst):
        if km.part.related_part(lid.get(RID)) is not kl.part: km.part.drop_rel(lid.get(RID)); llst.remove(lid)
    s=prs.slides.add_slide(kl)
    if fill:
        for ph in s.placeholders: ph.text = {11:'عنوان الشريحة', 12:'العنوان الثانوي', 10:'عنوان الفيديو'}.get(ph.placeholder_format.idx,'نص')
    prs.save(out)
for n in range(7,13):
    one(n, f'{OUT}/L{n}.pptx', fill=True)

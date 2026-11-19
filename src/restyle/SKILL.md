---
name: uula-restyle
description: يحوّل أي ملف بوربوينت مفتوح تلقائياً إلى هوية مذكرات علا (UULA SG 4.3 / V4.1): الخط، الألوان، الأحجام، الحاويات، الأسئلة، الجداول، الصور، التذييل والمسافات، بدون تدخل المستخدم. استخدمها عندما يطلب المستخدم: تنسيق علا، هوية علا، تصميم علا، ستايل علا، قالب المذكرة، هوية المذكرات، نسّق الملف مثل المذكرة، حوّله لتصميم علا، وحّد التنسيق على طريقة علا، أو UULA style / restyle.
---

## متى تستخدم هذه المهارة
- عندما يفتح المستخدم أي ملف بوربوينت ويطلب "طبّق تصميم علا" أو "حوّله لنفس تصميم المذكرة" أو "/uula-restyle".
- وأيضاً عند أي صيغة مشابهة حتى لو لم يكتب اسم المهارة، مثل: "نسّق الملف"، "تنسيق علا"، "هوية علا"، "ستايل علا"، "قالب علا"، "هوية المذكرات"، "خلّه مثل المذكرة"، "وحّد التنسيق"، "UULA style".
- الهدف: تنفيذ التحويل كاملاً بنفسك من البداية إلى النهاية. لا تسأل المستخدم أي سؤال، ولا تنتظر موافقته على خطة. قراراتك تأخذها من القواعد المكتوبة هنا.
- لتصميم مذكرة جديدة من محتوى خام، استخدم المهارة `uula-study-guide`. هذه المهارة مخصّصة لإعادة تصميم ملف موجود.

## قواعد لا تُكسر
1. **لا تحذف أي محتوى** كتبه المستخدم: نص، صورة، جدول أو QR. المسموح لك:
   - تغيير الشكل.
   - تغيير المكان.
   - التقسيم على أكثر من شريحة.
   - إزالة الزخارف التي لا تحمل محتوى، مثل خلفيات الصور والإطارات والأشرطة الملونة والظلال وشعارات قالب آخر.
2. تعديل النص يقتصر على حالتين:
   - حذف بادئة ترقيم السؤال، مثل "س1:" أو "1)" أو "السؤال:"، لأن رمز Q يحل محلها.
   - فصل "المصطلح: التعريف" إلى كبسولة ونص.
   في الحالتين تبقى الكلمات نفسها.
3. **الخط الوحيد UULA Sans**، في `latin` و`cs` معاً. الاستثناءات:
   - رمز Q: يكون بخط `Avenir Next Arabic Black`، وإن تعذّر فبخط `UULA Sans Black`.
   - نصوص التذييل.
4. استخدم الألوان الواردة في جدول الألوان أدناه فقط، ولا تضف أي لون غيرها.
5. كل نصوص الجسم 11pt، والسطر يساوي **13.3pt**. هذه هي وحدة الشبكة لكل المسافات.
6. اشتغل على كل الشرائح، شريحة في كل استدعاء أداة.
7. في النهاية:
   - تحقّق من كل شريحة.
   - اكتب تقريراً قصيراً فيه عدد الشرائح المحوّلة، والشرائح التي قُسّمت، وأي شيء لم يمكن تنفيذه.

## نظام التصميم (مقاسات من الملف المرجعي، بالنقاط pt)
**الصفحة:** المرجع 540×779 عمودي. لا يمكن تغيير مقاس الشريحة بالأدوات، فطبّق القواعد على المقاس الحالي:
- الهامش الأيمن والأيسر 36pt.
- عرض المحتوى = عرض الشريحة − 72.
- لا يتجاوز المحتوى (ارتفاع الشريحة − 54) لأن التذييل في الأسفل.

| الدور (role) | الحجم sz | غامق | اللون | المكان |
|---|---|---|---|---|
| chapter (اسم الوحدة) | 1100 | نعم | A6A6A6 | y=22.6، عرض كامل، h=13.3 |
| lesson (اسم الدرس / عنوان الشريحة) | 2200 | نعم | 1F71DD | y=42.7، h=26.7 |
| topic (عنوان موضوع) | 1650 | نعم | 000000 | h=20، قبله 3 أسطر |
| body (فقرة / نقاط) | 1100 | للكلمات المهمة فقط (احتفظ بالغامق الموجود) | 000000 | عرض كامل |
| qhead (عنوان مجموعة أسئلة) | 1100 | نعم | FF0000 | — |
| question (نص السؤال) | 1100 | لا | 000000، ورمز Q أحمر FF0000 | marL=14.4، indent=−14.4 |
| circled (الأرقام والحروف داخل دائرة ① ② ⓐ ⓑ Ⓐ ❶) | كحجم النص المحيط | كما هو | **000000 دائماً** مهما كان لون النص حولها (عنوان أحمر، إجابة زرقاء، معادلة) | في مكانها |
| answer (الإجابة) | 1100 | لا (الإجابة الصحيحة في الاختيار من متعدد غامقة 2070DF) | 1F71DE | marL=14.4، indent=0 |
| givens (معطيات المسألة) | 1100 | لا | 00B050 | — |
| formula (معادلة السؤال) | 1100 | الرمز الرئيسي غامق | FE00FE | — |
| otherform (السؤال بصيغة أخرى) | 1100 | لا | C45A11 | داخل صندوق FBEBD3 |
| pill (كبسولة تعريف) | 1100 | نعم | FFFFFF على 1F71DC | — |
| source (مصدر النص المقتطف) | 1100 | نعم | 000000 | أسفل يسار الحاوية |
| cancelled (محتوى معلّق) | 1100 | نعم للعنوان | FFC000 | إطار 1.5pt FFC000، خلفية بيضاء |

**الأرقام والحروف داخل دائرة:** كل حرف من النطاقات U+2460–U+24FF و U+2776–U+2793 و U+3251–U+325F و U+32B1–U+32BF (مثل ① ⑳ ㉑ ㉟ ㊱ ㊿ ⓐ ⓩ Ⓐ ❶؛ الأرقام 21–50 داخل دائرة في نطاق مختلف فلا تنسَها) لونه أسود 000000، في النص العادي وداخل المعادلات (`m:r`). إذا كان الرمز في نفس run مع نص آخر، قسّم الـ run إلى أجزاء: الرمز أسود، وباقي النص يحتفظ بلونه. نفّذ ذلك على كل شريحة كآخر خطوة في الخطوة 3 بالكود التالي داخل `edit_slide_xml`:

```javascript
const A="http://schemas.openxmlformats.org/drawingml/2006/main";
const RE=/[\u2460-\u24FF\u2776-\u2793\u3251-\u325F\u32B1-\u32BF]/, SPLIT=/([\u2460-\u24FF\u2776-\u2793\u3251-\u325F\u32B1-\u32BF]+)/;
const p="ppt/slides/slide1.xml"; const doc=new DOMParser().parseFromString(await zip.file(p).async("string"),"text/xml");
function setBlack(r){
  let rPr=[...r.childNodes].find(n=>n.nodeName==="a:rPr");
  if(!rPr){ rPr=doc.createElementNS(A,"a:rPr"); rPr.setAttribute("lang","ar-KW"); r.insertBefore(rPr,[...r.childNodes].find(n=>n.nodeName==="a:t"||n.nodeName==="m:t")); }
  for(const n of [...rPr.childNodes]) if(["a:solidFill","a:gradFill","a:noFill","a:pattFill"].includes(n.nodeName)) rPr.removeChild(n);
  const f=doc.createElementNS(A,"a:solidFill"), c=doc.createElementNS(A,"a:srgbClr"); c.setAttribute("val","000000"); f.appendChild(c);
  const ln=[...rPr.childNodes].find(n=>n.nodeName==="a:ln"); rPr.insertBefore(f, ln?ln.nextSibling:rPr.firstChild);
}
for(const r of [...doc.getElementsByTagName("a:r"),...doc.getElementsByTagName("m:r")]){
  const t=[...r.childNodes].find(x=>x.nodeName==="a:t"||x.nodeName==="m:t"); if(!t||!RE.test(t.textContent)) continue;
  const parts=t.textContent.split(SPLIT).filter(s=>s.length);
  if(parts.length===1){ setBlack(r); continue; }
  for(const s of parts){ const c=r.cloneNode(true); const ct=[...c.childNodes].find(x=>x.nodeName===t.nodeName); ct.textContent=s;
    if(/^\s|\s$/.test(s)) ct.setAttribute("xml:space","preserve"); if(RE.test(s)) setBlack(c); r.parentNode.insertBefore(c,r); }
  r.parentNode.removeChild(r);
}
zip.file(p,new XMLSerializer().serializeToString(doc)); markDirty();
```

**المحاذاة:**
- النص العربي: `algn="r" rtl="1"`.
- النص الإنجليزي أو الفرنسي: `algn="l" rtl="0"`.
- النقاط المرقّمة بأرقام فقط تُعامل حسب لغة الفقرة.

**صناديق النص:** كل الإزاحات الداخلية 0 (`lIns tIns rIns bIns = 0`)، و`wrap="square"`، و`spAutoFit`، وبلا تعبئة وبلا إطار وبلا ظل.

**النقاط:**
- رمز النقطة `§` بخط Wingdings، مع `marL=14.4pt` و`indent=−14.4pt`.
- النقاط القصيرة التي تقل عن ثلث السطر: 2 أو 3 أعمدة في سطر واحد، عرض كل عمود حوالي 134pt.

**الحاويات:** مستطيل بعرض الصفحة كاملاً (x=0، w=عرض الشريحة)، بزوايا حادة، بلا إطار، وفي الخلف.

| الحاوية | التعبئة | الأيقونة (أعلى اليمين، x≈عرض−47، حوالي 14×16pt) |
|---|---|---|
| ملاحظة مهمة / تنبيه | FBEBD3 | مصباح `lightbulb` لون F5B800، وعنوان "ملاحظة مهمه" غامق بجانبه |
| نص مقتطف (آية، حديث، قصيدة، اقتباس من كتاب) | E2F0D9 | كتاب `book` لون 2AB672. إذا زاد النص عن سطرين يُضاف خط عمودي 2.3pt بلون 2AB672 تحت الأيقونة |
| معادلات وقوانين | D3E4F5 | بلا أيقونة. المعادلة الرئيسية غامقة، واسم المعادلة في كبسولة |
| صيغة أخرى للسؤال | FBEBD3 | نجمة `star` لون FFC000. الصندوق على قدر النص، ويبدأ من هامش السؤال |
| نشاط | F1F1F1 | `palette`، وعنوان "نشاط" غامق |
| أسئلة إثرائية / تحدي | F1F1F1 | عنوان "أسئلة من المريخ:" |
| اختبارات QR "تـــــدرب و تــــفـــوق" | F1F1F1 | `target` |

**مسافات الحاويات:**
- سطر واحد (13.3) فوق أول عنصر.
- سطران (26.6) تحت آخر عنصر.
- سطر واحد بين حاويتين متتاليتين.
- إذا بدأت الصفحة بحاوية، تُمدّ الحاوية إلى y=0 ويبدأ محتواها عند y≈26.6.

**الجداول:**
- العرض = عرض المحتوى، تبدأ من x=36.
- الحدود 0.5pt (6350 EMU) بلون D9D9D9 على كل الجهات.
- صف الرأس CAD0D8 بخط غامق 000000 في الوسط.
- العمود الرئيسي (إن وجد) DAE0E9 غامق.
- الصفوف بالتناوب: أبيض ثم F1F1F1.
- الخلايا بهامش يمين ويسار 5.67pt (72000 EMU)، وهامش أعلى وأسفل 0، والنص في الوسط عمودياً.
- ارتفاع الصف 20pt، والخط 11pt.
- أزل أي نمط جدول ملوّن.

**الصور:**
- الصورة خارج الحاوية: إطار 0.5pt بلون D9D9D9.
- الصورة داخل الحاوية: بلا إطار.
- أزل الظلال والحواف الناعمة والتأثيرات ثلاثية الأبعاد.
- الارتفاع الافتراضي 8 أسطر (حوالي 106pt). لا تمطّ الصورة: غيّر العرض والارتفاع بالنسبة نفسها.
- المحاذاة لليسار (x=36)، والنص المرتبط بالصورة يوضع على يمينها.

**QR:** الصورة المربعة الصغيرة التي فيها نمط QR:
- المقاس 40.4×40.4، وتوضع عند x=36 بمحاذاة أعلى السؤال.
- نص السؤال يبدأ عند x=86.5 بعرض (عرض المحتوى − 50.5).
- لا يوضع أي شيء تحت QR.

**استبدال QR بنسخة جديدة مع رابطها (QR خارج الشريحة):**
أحياناً توجد خارج حدود الشريحة (يساراً أو يميناً، left < 0 أو left > W) صورة QR جديدة، ومعها صندوق نص فيه رابط (يبدأ بـ `http` أو `www`). في هذه الحالة نفّذ دائماً، في استدعاء `edit_slide_xml` واحد للشريحة:
1. **تحديد العناصر:**
   - NEW_QR: الصورة خارج الشريحة (شبه مربعة أو قريبة من نسبة الـ QR الحالي).
   - LINK: صندوق النص خارج الشريحة الذي نصه رابط. خذ الرابط من `<a:t>` بعد حذف المسافات.
   - OLD_QR: صورة الـ QR الموجودة داخل الشريحة (عادة عند x=36 أعلى الصفحة أو بجانب السؤال). إذا وُجد أكثر من QR داخل الشريحة، خذ الأقرب لصورة NEW_QR عمودياً.
2. **دمج الرابط بالصورة:** أضف علاقة hyperlink خارجية في `ppt/slides/_rels/slide1.xml.rels` (`Type=".../relationships/hyperlink" Target="{URL}" TargetMode="External"`)، ثم أضف `<a:hlinkClick r:id="{rId}"/>` داخل `<p:cNvPr>` لصورة NEW_QR (بعد أي `a:hlinkClick` قديم يُحذف).
3. **الحجم والمكان (التحجيم ثم النقل بنفس المحاذاة الأفقية تماماً):**
   - احذف `rot` و`flipH/flipV` من NEW_QR.
   - **التحجيم أولاً:** اجعل عرض NEW_QR = عرض OLD_QR، والارتفاع = العرض × نسبة NEW_QR الأصلية (لا تمطّ الصورة). إذا لم يوجد OLD_QR فالعرض 40.4pt (513080 EMU).
   - **النقل بعد التحجيم:** ضع `a:off x` لـ NEW_QR مساوياً تماماً لـ `a:off x` لـ OLD_QR (نفس قيمة EMU حرفياً، بلا تقريب ولا إعادة حساب من النقاط). إذا لم يوجد OLD_QR فـ x = 457200 EMU (36pt) بالضبط. و`y` = y لـ OLD_QR، أو top السؤال المرتبط إن لم يوجد.
   - لا تحرّك NEW_QR أفقياً بعد ذلك في أي خطوة لاحقة (الخطوة 4 تغيّر `top` فقط). بعد الحفظ تأكد بـ `list_slide_shapes` أن `left` لـ NEW_QR يساوي left القديم (أو 36) تماماً، وصحّحه إن اختلف.
4. **الترتيب:** انقل عقدة NEW_QR في `p:spTree` إلى مكان OLD_QR نفسه (insertBefore ثم احذف OLD_QR).
5. **الحذف:** احذف OLD_QR فقط (لأن الجديد حلّ محله). **لا تحذف صندوق LINK أبداً**: اتركه خارج حدود الشريحة في مكانه كما هو، سواء نجح ربط الرابط بالصورة أو فشل. إذا فشل الربط، اذكر الرابط نصاً في التقرير حتى يضيفه المستخدم يدوياً.
6. لا تطبّق على NEW_QR أي تأثيرات؛ يأخذ إطار الصور العادي فقط إن كان خارج حاوية.
7. اذكر في التقرير الشرائح التي استُبدل فيها QR والرابط الذي رُبط.

```javascript
const NEW_ID="7", LINK_ID="15", OLD_ID="4", Q_TOP_EMU=0; // من list_slide_shapes؛ OLD_ID=null إن لم يوجد QR قديم
// ملاحظة: إذا فشلت إضافة الرابط (الأداة ترفض الروابط الخارجية)، ضع جزء الـ rels و hlinkClick داخل try/catch وأكمل الباقي، فالحذف والتحجيم يتمّان في كل الأحوال
const R="http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const doc=new DOMParser().parseFromString(await zip.file("ppt/slides/slide1.xml").async("string"),"text/xml");
const byId={}; for(const n of doc.getElementsByTagName("p:cNvPr")) byId[n.getAttribute("id")]=n;
const node=id=>byId[id].parentNode.parentNode;
const nq=node(NEW_ID), oq=OLD_ID?node(OLD_ID):null, lk=node(LINK_ID);
const url=[...lk.getElementsByTagName("a:t")].map(t=>t.textContent).join("").replace(/\s+/g,"");
const relsPath="ppt/slides/_rels/slide1.xml.rels";
const rd=new DOMParser().parseFromString(await zip.file(relsPath).async("string"),"text/xml");
const rId="rIdQrLink"+Date.now()%100000; const rel=rd.createElementNS(rd.documentElement.namespaceURI,"Relationship");
rel.setAttribute("Id",rId); rel.setAttribute("Type",R+"/hyperlink"); rel.setAttribute("Target",url); rel.setAttribute("TargetMode","External");
rd.documentElement.appendChild(rel); zip.file(relsPath,new XMLSerializer().serializeToString(rd));
const c=byId[NEW_ID]; for(const h of [...c.getElementsByTagName("a:hlinkClick")]) c.removeChild(h);
const h=doc.createElementNS("http://schemas.openxmlformats.org/drawingml/2006/main","a:hlinkClick"); h.setAttributeNS(R,"r:id",rId); c.insertBefore(h,c.firstChild);
const nx=nq.getElementsByTagName("a:xfrm")[0]; ["rot","flipH","flipV"].forEach(a=>nx.removeAttribute(a));
const nOff=nx.getElementsByTagName("a:off")[0], nExt=nx.getElementsByTagName("a:ext")[0];
const ratio=Number(nExt.getAttribute("cy"))/Number(nExt.getAttribute("cx"));
// OLD_ID قد يكون null إذا لم يوجد QR قديم؛ عندها Q_TOP_EMU = top السؤال المرتبط
const ox=oq?oq.getElementsByTagName("a:xfrm")[0]:null;
const X = ox ? ox.getElementsByTagName("a:off")[0].getAttribute("x") : "457200"; // نفس المحاذاة الأفقية تماماً
const Y = ox ? ox.getElementsByTagName("a:off")[0].getAttribute("y") : String(Q_TOP_EMU);
const CX = ox ? Number(ox.getElementsByTagName("a:ext")[0].getAttribute("cx")) : 513080;
nExt.setAttribute("cx",String(CX)); nExt.setAttribute("cy",String(Math.round(CX*ratio))); // التحجيم أولاً
nOff.setAttribute("x",X); nOff.setAttribute("y",Y); // ثم النقل بنفس x حرفياً
if(oq){ oq.parentNode.insertBefore(nq,oq); oq.parentNode.removeChild(oq); }
// لا تحذف صندوق الرابط lk — يبقى خارج الشريحة
zip.file("ppt/slides/slide1.xml",new XMLSerializer().serializeToString(doc)); markDirty();
```

**الكبسولة (pill):**
- شكل roundRect بقيمة adj=50000، تعبئة 1F71DC، ارتفاع 20pt.
- عرضها على قدر الكلمة: عدد الحروف × 6 + 24، وأقل عرض 75.6.
- ملاصقة للهامش الأيمن في العربي، ويوضع التعريف بجانبها بفاصل 8pt.
- إذا كان التعريف أطول من سطر، تكون المحاذاة إلى الأعلى.
- إذا تجاوزت كلمة الكبسولة ثلث السطر، يوضع التعريف تحتها.

**المسافات:**
- سطر واحد بين العناصر المرتبطة.
- 3 أسطر (40) بين العناصر غير المرتبطة: موضوع جديد، أو سؤال بعد شرح.
- بين الأسئلة المتتالية: سطر واحد.
- بين السؤال وإجابته: 0، أي مباشرة.

**التذييل (يُوضع في الماستر فقط):**
- شعار علا يسار الأسفل.
- "U U L A . C O M" ثم "جـــمـيـع الحقوق محفوظة ©".
- رقم الصفحة في الوسط.
- السنة الدراسية يمين الأسفل بصيغة "2027 — 2026": إذا كان الشهر الحالي أغسطس أو بعده فالسنة Y = السنة الحالية، وإلا Y = السنة الحالية − 1. يُكتب `${Y+1} — ${Y}`.

**الشرائح الخاصة:**
- **الغلاف** (الشريحة الأولى أو شريحة العنوان فقط):
  - خلفية 1F71DD.
  - العنوان 44pt غامق أبيض، محاذاة لليمين، عند y≈49% من الارتفاع.
  - السطر الثاني 22pt غامق أبيض بشفافية 40%.
- **فاصل القسم** (Section Header، أو شريحة فيها عنوان واحد فقط في المنتصف):
  - خلفية 000000.
  - العنوان 44–60pt غامق أبيض، محاذاة لليمين، عند y≈45%.
- **الفهرس / جدول المحتويات:**
  - العنوان "قائمة المحتوى" 22pt غامق أسود.
  - كل قسم بطاقة roundRect بقيمة adj≈8460، تعبئة F2F2F2، عند x=36 بعرض المحتوى.
  - داخل البطاقة: رقم القسم "01" بحجم 22pt غامق بلون BFBFBF على اليمين، واسم القسم 11pt غامق، والعناوين الفرعية 11pt، وأرقام الصفحات 11pt على اليسار.
  - فراغ 13pt بين البطاقات.
- **Practice Center** (نهاية الدرس، إذا كان في الملف أسئلة ختامية مع QR):
  - حاوية بعرض الصفحة، ارتفاع 68pt، بتعبئة متدرجة دائرية من F2F2F2 إلى EBE6FE.
  - العنوان "تـــــدرب وتــــفـــوق" 14pt غامق بلون 6666FF.
  - تحته "جاوب على أهم أسئلة الدرس واثبت لنا قوتك في هذا الدرس!" 11pt بلون 180230.
  - في الإنجليزي "Practice & Succeed"، وفي الفرنسي "Pratiquer & Exceller".
  - QR على اليسار عند x=36، وأيقونة `trophy` على اليمين.

## ترقيم الصفحات وأرقام الفهرس
- **بداية الترقيم:** إذا طلب المستخدم أن يبدأ الترقيم من شريحة معيّنة (مثلاً "من الشريحة الحالية")، فتلك الشريحة رقم صفحتها 1، وما بعدها بالتسلسل حتى آخر شريحة (رقم الصفحة = موضع الشريحة − موضع شريحة البداية + 1). الشرائح قبلها بلا رقم.
- الرقم يوضع في صندوق نص باسم `CustomPageNumber_{n}` في منتصف الأسفل (left≈249، top≈753، 57×13)، بحجم 11pt ولون A6A6A6 ومحاذاة وسط وإزاحات داخلية 0.
- إذا كان الصندوق موجوداً حدّث رقمه فقط، وإذا كان ناقصاً في شريحة أضفه بنفس التنسيق. لا تترك شريحة بلا رقم، ولا تكرر رقماً، ولا تقفز رقماً.
- إذا كان الماستر يضيف حقل slidenum تلقائياً، لا تعتمد عليه في الفهرس لأنه يساوي رقم الشريحة لا رقم الصفحة.

**أرقام الصفحات في قائمة المحتوى:**
1. اجمع أسماء الدروس من عناوين الشرائح (lesson عند y≈43) مع رقم الصفحة المكتوب في أسفل الشريحة التي يبدأ فيها الدرس، **وليس رقم الشريحة**.
2. طابِق أسماء الدروس في الفهرس مع أسمائها في الملف، وصحّح الفهرس إذا اختلف الاسم (مع تصحيح الأخطاء الإملائية الواضحة فقط، مثل حرف مكرر).
3. ضع رقم الصفحة في الجهة المقابلة لكل درس، سطراً بسطر، بحيث يبقى عدد أسطر عمود الأرقام = عدد أسطر الدروس (عنوان القسم يقابله سطر فارغ إن كان كذلك في القالب). إذا طال اسم الدرس، وسّع صندوق الأسماء حتى لا يلتف السطر فيختل التقابل.
4. نفّذ الترقيم أولاً، ثم الفهرس.

## الخطوة 1: الجرد والتصنيف
1. من `<initial_state>` خذ عرض الشريحة W وارتفاعها H، والماستر، والـ layouts، وقائمة الشرائح.
2. لكل شريحة:
   - نفّذ `list_slide_shapes`.
   - اقرأ النص بـ `read_slide_text` للأشكال النصية.
   - صنّف كل شكل إلى دور (role) من الجدول السابق، أو إلى: container، table، image، qr، decor (زخرفة بلا محتوى)، أو footer قديم.
3. **قواعد التصنيف:**
   - **عنوان الشريحة / title placeholder:** يصنّف lesson. إذا كان فوقه نص صغير يحمل اسم وحدة أو فصل، فهو chapter.
   - **نص قصير غامق أو أكبر من الجسم** في منتصف المحتوى: topic.
   - **نص يبدأ بـ** "س" + رقم، أو "سؤال"، أو "علل"، أو "اذكر"، أو "عرّف"، أو "قارن"، أو "ما"، أو "Q"، أو رقم + ")" أو "-"، **أو ينتهي بـ** "؟" أو "?": question. إذا كان سطراً قصيراً يقدّم مجموعة أسئلة، مثل "أجب عن الأسئلة التالية:"، فهو qhead.
   - **نص يبدأ بـ** "ج" أو "الإجابة" أو "الحل"، أو يأتي مباشرة بعد سؤال بلون مختلف: answer.
   - **"المصطلح: تعريف"** حيث المصطلح ثلاث كلمات أو أقل، أو نص يبدأ بـ "تعريف": pill + body.
   - **"ملاحظة"، "تنبيه"، "هام"، "انتبه"، "تذكّر"، "Note"، "Important":** حاوية ملاحظة مهمة.
   - **"قال تعالى"، "قال رسول الله"، "ﷺ"، نص بين أقواس اقتباس أو قوسي آية، بيت شعر، "من كتاب":** حاوية نص مقتطف.
   - **نص فيه "=" أو رموز رياضية أو "قانون" أو "معادلة":** حاوية المعادلات.
   - **"نشاط"، "Activity":** حاوية النشاط.
   - **"إثراء"، "تحدي"، "فكّر"، "سؤال ذكاء":** حاوية أينشتاين.
   - **صورة شبه مربعة أصغر من 120pt بنمط أبيض وأسود:** qr.
   - **صورة QR خارج حدود الشريحة + صندوق نص فيه رابط خارج الشريحة:** new_qr + link، وتُعالج بقاعدة "استبدال QR بنسخة جديدة مع رابطها" قبل أي تنسيق آخر للشريحة.
   - **أي شكل بلا نص وبلا صورة محتوى** (خلفية، شريط، دائرة زخرفية، خط تزييني، شعار قالب قديم، صورة خلفية تغطي الشريحة): decor، ويُحذف.
   - **ترقيم أو تذييل أو تاريخ قديم** (placeholder من نوع sldNum أو ftr أو dt): يُحذف، لأن تذييل علا يأتي من الماستر.

**تنتهي الخطوة عندما** يكون لكل شكل في كل شريحة دور محدد، ولو في ذهنك فقط. لا تعرض التصنيف على المستخدم.

## الخطوة 2: الماستر والثيم والتذييل (استدعاء واحد لـ `edit_slide_master`)
نفّذ الكود التالي كما هو، بعد ضبط `YEAR_TXT` حسب التاريخ. الكود يقوم بما يلي:
- يجعل خطوط الثيم UULA Sans.
- يجعل خلفيات الماستر والـ layouts بيضاء.
- يحذف الزخارف القديمة من الماستر والـ layouts.
- يضبط أنماط النص.
- يضيف تذييل علا على الماستر.
- يجعل كل الـ layouts تُظهر عناصر الماستر.

```javascript
const LOGO_B64 = "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";
const YEAR_TXT = "2027 — 2026"; // اضبطها حسب التاريخ الحالي
const A="http://schemas.openxmlformats.org/drawingml/2006/main", P="http://schemas.openxmlformats.org/presentationml/2006/main";
const pres = await zip.file("ppt/presentation.xml").async("string");
const [, W, H] = pres.match(/<p:sldSz cx="(\d+)" cy="(\d+)"/).map(Number);
const parse = s => new DOMParser().parseFromString(s, "text/xml");
const ser = d => new XMLSerializer().serializeToString(d);
// 1) خطوط الثيم
for (const f of Object.keys(zip.files).filter(f => /^ppt\/theme\/theme\d+\.xml$/.test(f))) {
  const d = parse(await zip.file(f).async("string"));
  for (const tag of ["a:majorFont", "a:minorFont"]) {
    const el = d.getElementsByTagName(tag)[0]; if (!el) continue;
    for (const t of ["a:latin", "a:cs"]) { const x = el.getElementsByTagName(t)[0]; if (x) { x.setAttribute("typeface", "UULA Sans"); x.removeAttribute("panose"); } }
    for (const fx of [...el.getElementsByTagName("a:font")]) if (fx.getAttribute("script") === "Arab") fx.setAttribute("typeface", "UULA Sans");
  }
  zip.file(f, ser(d));
}
// 2) الشعار + نوع المحتوى
zip.file("ppt/media/uula_logo.png", LOGO_B64, { base64: true });
let ct = await zip.file("[Content_Types].xml").async("string");
if (!/Extension="png"/i.test(ct)) ct = ct.replace("<Default ", '<Default Extension="png" ContentType="image/png"/><Default ');
zip.file("[Content_Types].xml", ct);
const whiteBg = '<p:bg xmlns:p="'+P+'" xmlns:a="'+A+'"><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>';
function cleanTree(d, keepPh) {
  const cSld = d.getElementsByTagName("p:cSld")[0];
  const old = cSld.getElementsByTagName("p:bg")[0]; if (old) cSld.removeChild(old);
  const spTree = cSld.getElementsByTagName("p:spTree")[0];
  cSld.insertBefore(d.importNode(parse(whiteBg).documentElement, true), spTree);
  for (const n of [...spTree.childNodes]) {
    if (!["p:sp","p:pic","p:grpSp","p:cxnSp","p:graphicFrame"].includes(n.nodeName)) continue;
    const ph = n.getElementsByTagName("p:ph")[0];
    const t = ph && (ph.getAttribute("type") || "body");
    if (ph && keepPh && !["dt","ftr","sldNum"].includes(t)) continue; // نحتفظ بعناوين ومحتوى الـ placeholders
    spTree.removeChild(n); // زخارف وتذييلات قديمة
  }
  return spTree;
}
// 3) الماستر
const mPath = "ppt/slideMasters/slideMaster1.xml";
const md = parse(await zip.file(mPath).async("string"));
const spTree = cleanTree(md, true);
const E = 12700, fy = H - 499863; // موقع التذييل من الأسفل كما في المرجع
const gray = '<a:solidFill><a:srgbClr val="A6A6A6"/></a:solidFill>';
const tb = (id, name, x, y, cx, cy, algn, inner, wrap) => '<p:sp xmlns:p="'+P+'" xmlns:a="'+A+'"><p:nvSpPr><p:cNvPr id="'+id+'" name="'+name+'"/><p:cNvSpPr txBox="1"/><p:nvPr userDrawn="1"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="'+x+'" y="'+y+'"/><a:ext cx="'+cx+'" cy="'+cy+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr><p:txBody><a:bodyPr wrap="'+(wrap||"none")+'" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0" anchor="ctr"><a:noAutofit/></a:bodyPr><a:lstStyle/><a:p><a:pPr algn="'+algn+'" rtl="0"><a:buNone/></a:pPr>'+inner+'</a:p></p:txBody></p:sp>';
const run = (t, sz, font, b) => '<a:r><a:rPr lang="en-US" sz="'+sz+'"'+(b?' b="1"':'')+'>'+gray+'<a:latin typeface="'+font+'"/><a:cs typeface="'+font+'"/></a:rPr><a:t>'+t+'</a:t></a:r>';
const parts = [
  '<p:pic xmlns:p="'+P+'" xmlns:a="'+A+'" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:nvPicPr><p:cNvPr id="9001" name="UULA Footer Logo"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr userDrawn="1"/></p:nvPicPr><p:blipFill><a:blip r:embed="rIdUULALogo"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="416175" y="'+fy+'"/><a:ext cx="358657" cy="358657"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>',
  tb(9002, "UULA Footer Site", 883108, fy + 50820, 1100000, 230832, "l", '<a:r><a:rPr lang="en-US" sz="900">'+gray+'<a:latin typeface="Nasalization Rg"/><a:cs typeface="UULA Sans"/></a:rPr><a:t>U U L A . C O M</a:t></a:r>'),
  tb(9003, "UULA Footer Rights", 885489, fy + 196471, 900000, 169277, "l", '<a:r><a:rPr lang="ar-KW" sz="500" b="1">'+gray+'<a:latin typeface="Avenir Next Arabic"/><a:cs typeface="Avenir Next Arabic"/></a:rPr><a:t>© جـــــمـــيـــع الـــحـــقـــوق مـــحـفـــوظـــة</a:t></a:r>'),
  tb(9004, "UULA Footer Page", Math.round(W/2) - 267650, fy + 141649, 535299, 167934, "ctr", '<a:fld id="{9F78156F-8589-4E92-879F-7C85B31E4AFB}" type="slidenum"><a:rPr lang="en-US" sz="1100">'+gray+'<a:latin typeface="UULA Sans Medium"/><a:cs typeface="UULA Sans Medium"/></a:rPr><a:t>‹#›</a:t></a:fld>'),
  tb(9005, "UULA Footer Year", W - 460381 - 900000, fy + 94811, 900000, 261610, "r", run(YEAR_TXT, 1100, "UULA Sans Medium"))
];
for (const x of parts) spTree.appendChild(md.importNode(parse(x).documentElement, true));
// أنماط النص في الماستر
const tx = md.getElementsByTagName("p:txStyles")[0];
const setDef = (styleTag, sz, b, color, algn) => { const st = tx.getElementsByTagName(styleTag)[0]; if (!st) return;
  for (const lvl of [...st.childNodes].filter(n => /^a:lvl\dpPr$/.test(n.nodeName))) {
    lvl.setAttribute("algn", algn); lvl.setAttribute("rtl", algn === "r" ? "1" : "0");
    const d = lvl.getElementsByTagName("a:defRPr")[0]; if (!d) continue;
    if (sz) d.setAttribute("sz", sz); if (b) d.setAttribute("b", "1");
    while (d.firstChild) d.removeChild(d.firstChild);
    d.appendChild(md.importNode(parse('<a:solidFill xmlns:a="'+A+'"><a:srgbClr val="'+color+'"/></a:solidFill>').documentElement, true));
    for (const t of ["a:latin","a:cs"]) { const e = md.createElementNS(A, t); e.setAttribute("typeface", "UULA Sans"); d.appendChild(e); }
  } };
setDef("p:titleStyle", "2200", true, "1F71DD", "r");
setDef("p:bodyStyle", "1100", false, "000000", "r");
setDef("p:otherStyle", null, false, "000000", "r");
zip.file(mPath, ser(md));
let mr = await zip.file("ppt/slideMasters/_rels/slideMaster1.xml.rels").async("string");
if (!mr.includes("rIdUULALogo")) mr = mr.replace("</Relationships>", '<Relationship Id="rIdUULALogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/uula_logo.png"/></Relationships>');
zip.file("ppt/slideMasters/_rels/slideMaster1.xml.rels", mr);
// 4) الـ layouts: خلفية بيضاء، حذف الزخارف، إظهار عناصر الماستر
for (const f of Object.keys(zip.files).filter(f => /^ppt\/slideLayouts\/slideLayout\d+\.xml$/.test(f))) {
  const d = parse(await zip.file(f).async("string"));
  cleanTree(d, true);
  d.documentElement.setAttribute("showMasterSp", "1");
  zip.file(f, ser(d));
}
markDirty();
return { W: W / E, H: H / E };
```
- إذا كان في الملف أكثر من ماستر (`slideMaster2.xml`…)، كرّر الجزء 3 لكل ماستر مع ملف rels الخاص به.
- إذا رفضت الأداة إضافة الصورة، أعد التنفيذ بدون الجزء الخاص بالشعار ونصه، واذكر ذلك في التقرير.

**تنتهي الخطوة عندما:**
- يظهر التذييل في أسفل أي شريحة عند فحصها بـ `getImageAsBase64`.
- تكون الخلفية بيضاء.

## الخطوة 3: إعادة تنسيق كل شريحة (`edit_slide_xml`، شريحة في كل استدعاء)
املأ `ROLE` بأرقام الأشكال وأدوارها من الخطوة 1، واملأ `DELETE` بأرقام الزخارف والتذييلات القديمة. ثم نفّذ الكود. مرّر في `autosize_shape_ids` كل الأشكال النصية التي عدّلتها.

```javascript
const ROLE = { /* "4":"lesson", "5":"body", "7":"question", "8":"answer", "9":"qhead", "12":"chapter", "15":"topic", "20":"source" */ };
const DELETE = [ /* "3","11" */ ];
const W_PT = 540; // عرض الشريحة من initial_state
const A="http://schemas.openxmlformats.org/drawingml/2006/main", P="http://schemas.openxmlformats.org/presentationml/2006/main";
const E=12700, M=36*E, CW=(W_PT-72)*E;
const STY={chapter:{sz:1100,b:1,c:"A6A6A6"},lesson:{sz:2200,b:1,c:"1F71DD"},topic:{sz:1650,b:1,c:"000000"},body:{sz:1100,c:"000000"},
 question:{sz:1100,c:"000000",q:1},qhead:{sz:1100,b:1,c:"FF0000"},answer:{sz:1100,c:"1F71DE",ind:1},givens:{sz:1100,c:"00B050"},
 formula:{sz:1100,c:"FE00FE"},otherform:{sz:1100,c:"C45A11"},source:{sz:1100,b:1,c:"000000"},pill:{sz:1100,b:1,c:"FFFFFF",ctr:1}};
const xml=await zip.file("ppt/slides/slide1.xml").async("string");
const doc=new DOMParser().parseFromString(xml,"text/xml");
const el=(t)=>doc.createElementNS(A,t);
const kill=(p,names)=>{for(const n of [...p.childNodes]) if(names.includes(n.nodeName)) p.removeChild(n);};
const fill=(c)=>{const f=el("a:solidFill"),s=el("a:srgbClr");s.setAttribute("val",c);f.appendChild(s);return f;};
function styleRun(rPr,st){
  rPr.setAttribute("sz",st.sz); if(st.b) rPr.setAttribute("b","1"); else if(!["body","answer","question"].includes(ROLE.__r)) rPr.removeAttribute("b");
  ["i","u","strike","cap","spc","baseline"].forEach(a=>{ if(a!=="baseline") rPr.removeAttribute(a); });
  const keep=[...rPr.childNodes].filter(n=>n.nodeName==="a:hlinkClick");
  while(rPr.firstChild) rPr.removeChild(rPr.firstChild);
  rPr.appendChild(fill(st.c));
  for(const t of ["a:latin","a:cs"]){const e=el(t);e.setAttribute("typeface","UULA Sans");rPr.appendChild(e);}
  keep.forEach(k=>rPr.appendChild(k));
}
function styleShape(sp,role){
  const st=STY[role]; ROLE.__r=role;
  const tb=sp.getElementsByTagName("p:txBody")[0]; if(!tb) return;
  const txt=tb.textContent; const ar=/[\u0600-\u06FF]/.test(txt);
  const bp=tb.getElementsByTagName("a:bodyPr")[0];
  ["lIns","tIns","rIns","bIns"].forEach(a=>bp.setAttribute(a,"0")); bp.setAttribute("wrap","square"); bp.setAttribute("rtlCol","0");
  if(role!=="pill"){ bp.setAttribute("anchor","t"); kill(bp,["a:normAutofit","a:noAutofit","a:spAutoFit","a:prstTxWarp"]); bp.insertBefore(el("a:spAutoFit"),bp.firstChild); }
  const ls=tb.getElementsByTagName("a:lstStyle")[0]; if(ls) while(ls.firstChild) ls.removeChild(ls.firstChild);
  for(const p of [...tb.getElementsByTagName("a:p")]){
    let pPr=p.getElementsByTagName("a:pPr")[0]; if(!pPr){pPr=el("a:pPr");p.insertBefore(pPr,p.firstChild);}
    const hadBullet=!!pPr.getElementsByTagName("a:buChar")[0]||!!pPr.getElementsByTagName("a:buAutoNum")[0];
    while(pPr.firstChild) pPr.removeChild(pPr.firstChild);
    pPr.setAttribute("algn",st.ctr?"ctr":(ar?"r":"l")); pPr.setAttribute("rtl",ar?"1":"0"); pPr.removeAttribute("lvl");
    const lnS=el("a:lnSpc"),pc=el("a:spcPct");pc.setAttribute("val","100000");lnS.appendChild(pc);pPr.appendChild(lnS);
    for(const t of ["a:spcBef","a:spcAft"]){const s=el(t),v=el("a:spcPts");v.setAttribute("val","0");s.appendChild(v);pPr.appendChild(s);}
    if(st.q){ pPr.setAttribute("marL","182880");pPr.setAttribute("indent","-182880");
      const bc=el("a:buClr");bc.appendChild(fill("FF0000").firstChild);pPr.appendChild(bc);
      const bs=el("a:buSzPct");bs.setAttribute("val","100000");pPr.appendChild(bs);
      const bf=el("a:buFont");bf.setAttribute("typeface","Avenir Next Arabic Black");pPr.appendChild(bf);
      const ch=el("a:buChar");ch.setAttribute("char","Q");pPr.appendChild(ch);
      const r0=p.getElementsByTagName("a:t")[0]; if(r0) r0.textContent=r0.textContent.replace(/^\s*(س\s*\d*\s*[:/\-)]|السؤال\s*\S*\s*:|\d+\s*[-.)]|Q\s*\d*[:.)])\s*/,"");
    } else if(hadBullet && role==="body"){ pPr.setAttribute("marL","182880");pPr.setAttribute("indent","-182880");
      const bf=el("a:buFont");bf.setAttribute("typeface","Wingdings");pPr.appendChild(bf);const ch=el("a:buChar");ch.setAttribute("char","§");pPr.appendChild(ch);
    } else { pPr.setAttribute("marL",st.ind?"182880":"0"); pPr.setAttribute("indent","0"); pPr.appendChild(el("a:buNone")); }
    for(const rPr of [...p.getElementsByTagName("a:rPr"),...p.getElementsByTagName("a:endParaRPr")]) styleRun(rPr,st);
  }
  const spPr=sp.getElementsByTagName("p:spPr")[0];
  if(spPr && role!=="pill"){
    kill(spPr,["a:solidFill","a:gradFill","a:pattFill","a:blipFill","a:noFill","a:ln","a:effectLst","a:effectDag","a:scene3d","a:sp3d"]);
    const geo=spPr.getElementsByTagName("a:prstGeom")[0]||spPr.getElementsByTagName("a:custGeom")[0];
    const nf=el("a:noFill"); const ln=el("a:ln"); ln.appendChild(el("a:noFill"));
    if(geo&&geo.nextSibling) {spPr.insertBefore(nf,geo.nextSibling); spPr.insertBefore(ln,nf.nextSibling);} else {spPr.appendChild(nf);spPr.appendChild(ln);}
    const xf=spPr.getElementsByTagName("a:xfrm")[0];
    if(xf && ["chapter","lesson","topic","body","qhead","question","answer","source"].includes(role)){
      xf.removeAttribute("rot"); const off=xf.getElementsByTagName("a:off")[0], ext=xf.getElementsByTagName("a:ext")[0];
      off.setAttribute("x",String(M)); ext.setAttribute("cx",String(CW));
    }
  }
  const style=sp.getElementsByTagName("p:style")[0]; if(style) style.parentNode.removeChild(style);
}
const byId={}; for(const n of doc.getElementsByTagName("p:cNvPr")) byId[n.getAttribute("id")]=n.parentNode.parentNode;
for(const id of DELETE){const n=byId[id]; if(n&&n.parentNode) n.parentNode.removeChild(n);}
for(const [id,role] of Object.entries(ROLE)){ if(id==="__r") continue; const n=byId[id]; if(n&&n.nodeName==="p:sp") styleShape(n,role); }
// الصور: إزالة التأثيرات وإطار 0.5pt رمادي (خارج الحاويات)
for(const pic of doc.getElementsByTagName("p:pic")){
  const spPr=pic.getElementsByTagName("p:spPr")[0]; if(!spPr) continue;
  kill(spPr,["a:ln","a:effectLst","a:effectDag","a:scene3d","a:sp3d"]);
  const ln=el("a:ln"); ln.setAttribute("w","6350"); ln.appendChild(fill("D9D9D9")); spPr.appendChild(ln);
  const st=pic.getElementsByTagName("p:style")[0]; if(st) st.parentNode.removeChild(st);
}
// خلفية الشريحة بيضاء (إلا الغلاف والفواصل)
const cSld=doc.getElementsByTagName("p:cSld")[0]; const bg=cSld.getElementsByTagName("p:bg")[0]; if(bg) cSld.removeChild(bg);
zip.file("ppt/slides/slide1.xml",new XMLSerializer().serializeToString(doc));
markDirty();
```

**بعد هذا الكود، في نفس الاستدعاء أو في استدعاء `edit_slide_xml` ثانٍ للشريحة نفسها:**
- **الحاويات:** أدرج شكل الحاوية مباشرة بعد `<p:grpSpPr>` حتى يكون في الخلف، وضع y وh مؤقتاً (تُضبط في الخطوة 4). القالب:
  `<p:sp><p:nvSpPr><p:cNvPr id="{ID}" name="UULA {Name} Container"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="0" y="{Y}"/><a:ext cx="{W_EMU}" cy="{H}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="{FILL}"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="ar-KW"/></a:p></p:txBody></p:sp>`
  - **إذا كانت الحاوية الأصلية شكلاً ملوّناً فيه النص نفسه:** اترك النص في مكانه، ونسّق الشكل كحاوية بعرض الصفحة وبإزاحات داخلية (يمين 36pt، يسار 36pt، أعلى 13.3pt، أسفل 26.6pt) بدلاً من إضافة شكل جديد.
  - **عنوان حاوية الملاحظة:** إذا لم يوجد عنوان، أضف صندوقاً نصياً "ملاحظة مهمه" بحجم 11pt غامق.
- **الكبسولة:** القالب:
  `<p:sp><p:nvSpPr><p:cNvPr id="{ID}" name="UULA Definition Pill"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="{X}" y="{Y}"/><a:ext cx="{CX}" cy="254000"/></a:xfrm><a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 50000"/></a:avLst></a:prstGeom><a:solidFill><a:srgbClr val="1F71DC"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr wrap="none" lIns="0" tIns="0" rIns="0" bIns="0" rtlCol="0" anchor="ctr"><a:noAutofit/></a:bodyPr><a:lstStyle/><a:p><a:pPr algn="ctr" rtl="1"/><a:r><a:rPr lang="ar-KW" sz="1100" b="1"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:latin typeface="UULA Sans"/><a:cs typeface="UULA Sans"/></a:rPr><a:t>{TERM}</a:t></a:r></a:p></p:txBody></p:sp>`
  - احذف "المصطلح:" من بداية النص الأصلي.
  - اجعل صندوق النص يبدأ عند x=36، وعرضه = (x الكبسولة − 8 − 36).
- **الجداول:** لكل `a:tc`:
  - استبدل `a:tcPr` بالقالب التالي، وضع fill حسب الصف (الرأس CAD0D8، والعمود الرئيسي DAE0E9، والتناوب FFFFFF/F1F1F1):
    `<a:tcPr marL="72000" marR="72000" marT="0" marB="0" anchor="ctr">` + لكل جهة من `lnL lnR lnT lnB`: `<a:lnX w="6350"><a:solidFill><a:srgbClr val="D9D9D9"/></a:solidFill></a:lnX>` + `<a:solidFill><a:srgbClr val="{FILL}"/></a:solidFill></a:tcPr>`.
  - نسّق كل `a:rPr`: الحجم 1100، اللون 000000، الخط UULA Sans، وغامق في الرأس.
  - محاذاة النص في الوسط.
  - احذف `a:tableStyleId`.
  - كل `a:tr` بارتفاع `h="254000"`.
  - اجعل مجموع عرض الأعمدة = CW، مع الحفاظ على نسبها.
  - ضع الجدول عند x=36.
  - **جدول الحل في نهاية "التمارين الموضوعية"** (جدول فيه خلية نصها "الحل" بالضبط، صف لأرقام الأسئلة وصف للإجابات): يُطبَّق عليه نفس التصميم. صف الأرقام = صف الرأس CAD0D8 غامق، وعمود "الحل" = العمود الرئيسي DAE0E9 غامق، وصف الإجابات أبيض غير غامق، وكل الصفوف 20pt، والعرض = CW عند x=36. لا يتجاوز أسفل الجدول (H − 54)؛ إذا تجاوز ارفعه حتى ينتهي عند H − 54. لا تطبّق هذا على جداول الحل التفصيلي التي تحتوي "شرط الحل" أو خطوات.
    - **حروف الإجابة في جدول الحل:** كل خلية نصها حرف واحد a–d (أو A–D) تُستبدل بالحرف داخل دائرة (a→ⓐ، b→ⓑ، c→ⓒ، d→ⓓ؛ U+24D0 + ترتيب الحرف) بلون أزرق 1F71DE، غير غامق. هذا استثناء من قاعدة "الدوائر سوداء": الدوائر داخل جدول الحل فقط زرقاء.
- **الأيقونات:** بعد حفظ الشريحة، نفّذ `search_icons` ثم `insert_icon` بلون الحاوية وبحجم حوالي 14×16pt في أعلى يمين الحاوية. الكلمات: `lightbulb`، `book`، `star`، `target`، `palette`، `trophy`. استخدم نفس النمط (filled) في كل الملف.
- **الغلاف والفاصل:**
  - اضبط الخلفية بـ `slide.background.fill.setSolidFill({color:"1F71DD"})` للغلاف، أو `"000000"` للفاصل.
  - نسّق العنوان: أبيض، غامق، 44pt، محاذاة لليمين، x=36 بعرض المحتوى، وy≈ 0.49×H للغلاف أو 0.45×H للفاصل.
  - النص الثانوي 22pt أبيض.
  - لا تطبّق إطار الصور على هذه الشرائح.

**تنتهي الخطوة عندما:**
- كل نص في الشريحة بخط UULA Sans وبالحجم واللون حسب دوره.
- كل رقم أو حرف داخل دائرة (① ⓐ …) أسود 000000.
- لا توجد زخارف قديمة.
- الجداول والصور بالشكل الموحّد.

## الخطوة 4: إعادة الترتيب على شبكة الأسطر (`execute_office_js`)
بعد التنسيق، تغيّرت ارتفاعات الصناديق بسبب spAutoFit. أعد ترتيب العناصر عمودياً بترتيب القراءة: من الأعلى إلى الأسفل، ومن اليمين إلى اليسار في العربي.

```javascript
const SLIDE_ID = "…"; const W = 540, H = 779, ROW = 13.3, LIMIT = H - 54;
// gap: عدد الأسطر قبل العنصر (1 مرتبط، 3 غير مرتبط). container: رقم شكل الحاوية التي تحتويه. with: رقم عنصر يشاركه السطر نفسه (QR، كبسولة، عمود نقاط)
const PLAN = [ /* {id:"12",gap:0}, {id:"4",gap:0}, {id:"15",gap:3}, {id:"5",gap:1}, {id:"30",gap:1,container:"40"}, {id:"31",gap:1,container:"40",with:"30"} */ ];
const slide = context.presentation.slides.getItem(await pptHelpers.resolveSlideId(context, SLIDE_ID));
const shapes = slide.shapes; shapes.load("items/id,items/top,items/left,items/height,items/width"); await context.sync();
const S = Object.fromEntries(shapes.items.map(s => [s.id, s]));
let prev = null, cur = null, cTop = 0, last = 0, overflow = null;
const close = () => { const r = S[cur]; r.left = 0; r.width = W; r.top = cTop; r.height = last + 2 * ROW - cTop; prev = r.top + r.height; cur = null; };
const FIRST = { chapter: 22.6 };
for (const it of PLAN) {
  const s = S[it.id]; if (!s) continue;
  if (cur && it.container !== cur) close();
  if (it.with) { s.top = S[it.with].top; }
  else if (it.container && it.container !== cur) { cur = it.container; cTop = prev == null ? 0 : prev + ROW; s.top = prev == null ? 2 * ROW : cTop + ROW; }
  else { s.top = prev == null ? 22.6 : (cur ? last : prev) + (it.gap ?? 1) * ROW; }
  last = Math.max(it.with ? last : 0, s.top + s.height, cur ? last : 0);
  if (!cur) prev = last;
  if (last > LIMIT && !overflow) overflow = it.id;
}
if (cur) close();
await context.sync();
return { overflow, bottom: prev };
```
- العناصر داخل الحاوية تتحرك معها، والأيقونة توضع عند (top الحاوية + 13.3 − 2).
- إذا كان لعنصر قيمة `with`، اضبط `left` ليكون بجانب العنصر المرتبط به، مثلاً: QR عند x=36 والسؤال عند x=86.5.
- **إذا أرجع الكود `overflow`:**
  1. نفّذ `duplicate_slide` للشريحة.
  2. في الأصل، احذف العناصر من `overflow` إلى آخر العناصر.
  3. في النسخة، احذف ما قبل `overflow`، واحذف اسم الوحدة واسم الدرس.
  4. أعد الخطوة 4 على الشريحتين.
  - لا تقسم سؤالاً عن إجابته.
  - لا تبدأ موضوعاً جديداً في آخر 25% من الصفحة.
  - لا تصغّر الخط لكي يتسع المحتوى.
- **الهدف:** أقل عدد صفحات. يجوز تقليل سطر واحد من فراغ 3 أسطر لتوفير صفحة.

**تنتهي الخطوة عندما:**
- كل العناصر مرتبة بالمسافات الصحيحة.
- لا يتجاوز أي عنصر LIMIT.

## الخطوة 5: التحقق والتقرير
0. **الروابط خارج الشريحة:** لا تحذف أي صندوق نص خارج حدود الشريحة نصه رابط (`http` أو `www`)؛ اتركه في مكانه. سجّل في التقرير الروابط الموجودة وهل رُبطت بالـ QR أم لا.
1. نفّذ `verify_slides` على كل الشرائح، ثم `verify_slide_visual` لكل شريحة مع `expected_changes` (مثلاً: "UULA Sans، عنوان أزرق 22pt، حاوية بيج بعرض الصفحة، تذييل علا").
2. أصلح ما يظهر في الفحص: تداخل، نص خارج الصفحة، لون خارج الجدول، إطار على صورة داخل حاوية، أو شيء تحت QR.
   - بعد 3 محاولات على نفس المشكلة، توقف عنها واذكرها في التقرير.
3. **التقرير للمستخدم:** فقرة قصيرة، فيها:
   - عدد الشرائح المحوّلة.
   - الشرائح التي قُسّمت أو أُضيفت.
   - أي شيء لم يُنفَّذ.
   - تنبيه: إذا لم يكن خط UULA Sans مثبّتاً على جهاز المستخدم، سيظهر خط بديل إلى أن يثبّته.
   - مقاس الشريحة بقي كما هو. لمطابقة مقاس المذكرة تماماً يُغيَّر من Design ← Slide Size إلى 19.05×27.5 سم عمودي.

## مثال
**المدخل:** ملف 16:9 من 6 شرائح، بخط Calibri وخلفيات ملونة. الشريحة 3 فيها:
- عنوان "الدرس الأول: الكثافة".
- فقرة.
- "ملاحظة: الكثافة لا تعتمد على الحجم".
- جدول بنمط أزرق.
- ثلاثة أسئلة "س1: … ؟" تحت كل منها "ج: …".

**الناتج للشريحة 3:**
- العنوان 22pt أزرق 1F71DD غامق، محاذاة لليمين.
- الفقرة 11pt سوداء.
- حاوية بيج FBEBD3 بعرض الصفحة، فيها أيقونة مصباح وعنوان "ملاحظة مهمه"، وتحتها نص الملاحظة.
- الجدول برأس CAD0D8 وصفوف متناوبة وحدود رمادية 0.5pt، بعرض المحتوى.
- الأسئلة برمز Q أحمر بعد حذف "س1:"، والإجابات زرقاء 1F71DE بإزاحة 14.4pt.
- كل ذلك بمسافات 13.3pt، والتذييل من الماستر.
- إذا تجاوز المحتوى أسفل الصفحة، تُنقل الأسئلة إلى شريحة جديدة.
# UULA Toolkit

كل إضافات علا للباوربوينت والوورد في إضافة واحدة: Design (UULA Restyle) وArabic Math وGraph وGeometry وDark وPPT Video Template.

- `taskpane.html` يفتح دائمًا أحدث نسخة من `index.html` (قائمة الأدوات).
- كل أداة صفحتها في `tools/<id>/app.html`، وتنفتح فقط عند اختيارها (لا بطء).
- في أعلى كل أداة شريط «كل الأدوات» للرجوع للقائمة.
- `python3 build.py` يبني صفحات الأدوات من `src/`. (Dark وPPT Video Template (مجلد cover) مصدرهما واحد: `src/dark`.)
- رموز القوائم في `src/menu-icons.js` (و`build.py` ينسخها داخل `index.html`).
- ملف التنصيب: `UULA-Toolkit.xml` يُكتب بـ `python3 build_manifest.py` من قائمة الأدوات (زر UULA Toolkit + زر لكل أداة في نافذة خاصة). الأداة الجديدة تظهر في القائمة فورًا؛ زرّها في الشريط يحتاج إعادة تنصيب.

## الأدوات تُفتح مباشرة من مستودعاتها
- كل أداة في `tools/<id>/app.html` صفحة تحميل صغيرة: تجلب أحدث `app.html` من مستودع الأداة نفسه لحظة فتحها
  (uula-restyle, uula-math, uula-graph, uula-geometry, uula-dark)، ثم تضيف عليها أجزاء Toolkit من `tk-runtime.js`
  (شريط «كل الأدوات»، والتنسيق الموحد، والتلميحات، والشعارات).
- لذلك **التعديل على أداة يكون في مستودعها هي**؛ يصل إلى Toolkit تلقائيًا بدون بناء جديد.
  (PPT Video Template = صفحة UULA Dark في وضع cover.)
- `tools/<id>/bundle.html` نسخة احتياطية تُستخدم فقط إذا تعذّر الوصول إلى المستودع.
- تعديل أجزاء Toolkit نفسها: `src/runtime.js` و`src/theme.css` و`src/tips.js` و`src/home-bar.js` و`src/menu-icons.js`، ثم `python3 build.py`.

## إضافة أداة جديدة
1. ضع صفحتها في `src/<id>/` وأضف سطرًا لها في `build.py`.
2. أضف سطرًا في قائمة `TOOLS` داخل `index.html`.
3. شغّل `python3 build.py` وارفع. تظهر عند كل الفريق تلقائيًا.

## التثبيت
- ويندوز: `windows/UULA-Toolkit-Windows.zip` (فك الضغط ثم شغّل UULA-Toolkit-Setup.exe).
- ماك: `mac/install-mac.command` (دبل كلك)، أو انسخ `UULA-Toolkit.xml` إلى
  `~/Library/Containers/com.microsoft.Powerpoint/Data/Documents/wef/` (و com.microsoft.Word للوورد).

By Zaher Alkablawi

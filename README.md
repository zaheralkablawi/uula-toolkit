# UULA Toolkit

كل إضافات علا للباوربوينت والوورد في إضافة واحدة: Restyle وArabic Math وGraph وDark وPPT Video Template.

- `taskpane.html` يفتح دائمًا أحدث نسخة من `index.html` (قائمة الأدوات).
- كل أداة صفحتها في `tools/<id>/app.html`، وتنفتح فقط عند اختيارها (لا بطء).
- في أعلى كل أداة شريط «كل الأدوات» للرجوع للقائمة.
- `python3 build.py` يبني صفحات الأدوات من `src/`. (Dark وPPT Video Template (مجلد cover) مصدرهما واحد: `src/dark`.)
- رموز القوائم في `src/menu-icons.js` (و`build.py` ينسخها داخل `index.html`).
- ملف التنصيب الوحيد: `UULA-Toolkit.xml` — لا يتغير عند إضافة أداة جديدة.

## إضافة أداة جديدة
1. ضع صفحتها في `src/<id>/` وأضف سطرًا لها في `build.py`.
2. أضف سطرًا في قائمة `TOOLS` داخل `index.html`.
3. شغّل `python3 build.py` وارفع. تظهر عند كل الفريق تلقائيًا.

## التثبيت
- ويندوز: `windows/UULA-Toolkit-Windows.zip` (فك الضغط ثم شغّل UULA-Toolkit-Setup.exe).
- ماك: `mac/install-mac.command` (دبل كلك)، أو انسخ `UULA-Toolkit.xml` إلى
  `~/Library/Containers/com.microsoft.Powerpoint/Data/Documents/wef/` (و com.microsoft.Word للوورد).

By Zaher Alkablawi

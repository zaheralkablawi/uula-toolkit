// UULA Toolkit — one tooltip for every button in every tool:
// the button's name (bold), then how and why to use it. Arabic and English.
// window.TK_TOOL tells which tool this page is (home, dark, cover, restyle, math, graph).
(function () {
  var TOOL = window.TK_TOOL || '';
  function E(ar, en, nar, nen) { return { ar: ar, en: en || '', n: nar ? { ar: nar, en: nen || nar } : null }; }

  // ---------- shared by every tool ----------
  var COMMON = [
    ['#tkBar button', E('يرجع إلى قائمة كل أدوات UULA Toolkit.', 'Goes back to the list of all UULA Toolkit tools.')],
    ['#updBtn', E('يوجد إصدار جديد من الأداة. اضغط لتحميله.', 'A new version of the tool is ready. Click to load it.')],
    ['#chkUpd', E('يفحص إن كان هناك إصدار أحدث من الأداة.', 'Checks whether a newer version of the tool is available.')],
    ['#langItem', E('يبدّل لغة الأداة بين العربية والإنجليزية.', 'Switches the tool between Arabic and English.')],
    ['#aboutBtn', E('معلومات عن الأداة وما تفعله.', 'What the tool does.')],
    ['#modalX', E('يغلق هذه النافذة.', 'Closes this window.')]
  ];

  var RULES = {
    home: [
      ['#menuBtn', E('تحرير الأدوات، والتحقق من التحديثات، وتغيير اللغة.', 'Edit tools, check for updates and change the language.')],
      ['#toolsItem', E('أظهر أو أخفِ الأدوات، واسحبها لترتيبها في القائمة.', 'Show or hide tools, and drag them to order the list.')],
      ['.mrow .sw', E('يُظهر الأداة في القائمة أو يخفيها. الإخفاء لا يحذف الأداة.', 'Shows or hides the tool in the list. Hiding does not remove it.')],
      ['.mrow', E('اسحب الأداة لأعلى أو لأسفل لتغيير مكانها في القائمة.', 'Drag the tool up or down to change its place in the list.')],
      ['.tool', function (el) { return E('اضغط لفتح الأداة. وللرجوع إلى هذه القائمة اضغط «كل الأدوات» في أعلاها.', 'Click to open the tool. To come back here, click "All tools" at its top.', el.querySelector('b').textContent); }]
    ],

    // UULA Dark and UULA Cover share one page
    dark: [
      ['#menuBtn', E('التحقق من التحديثات، وتغيير اللغة، وحول الأداة.', 'Check for updates, change the language and about.')],
      ['#suggestSep', E('تبحث الأداة عن أماكن مناسبة للتقسيم وتضع فواصل حمراء مقترحة. راجعها وحرّكها أو احذفها قبل التحويل.', 'The tool looks for good places to split and adds suggested red separators. Review, move or delete them before converting.', 'اقترح الفواصل', 'Suggest separators')],
      ['#addSep', E('يضيف فاصلًا أحمر في الشريحة الحالية. اسحبه إلى المكان الذي تبدأ منه شريحة جديدة.', 'Adds a red separator to the current slide. Drag it to where a new slide should start.', 'أضف فاصلًا', 'Add separator')],
      ['#makePart', E('حدّد العناصر التي تريدها في شريحة واحدة ثم اضغط. مفيد عندما لا يصلح التقسيم بخط أفقي.', 'Select the items that belong on one slide, then click. Useful when a straight line cannot split them.', 'جزء مستقل', 'Own part')],
      ['#clearParts', E('يلغي الأجزاء المستقلة في الشرائح المحددة لتبدأ تقسيمها من جديد.', 'Removes the own parts in the selected slides so you can split them again.', 'إلغاء الأجزاء', 'Clear parts')],
      ['label:has(#s1Done)', E('علّمها بعد الانتهاء من الفواصل. زر التحويل لا يعمل قبل إكمال الخطوتين.', 'Tick it once the separators are done. Convert works only after both steps.', 'تم تقسيم الشرائح', 'Slides split')],
      ['label:has(#s2Done)', E('علّمها بعد تغيير مقاس الشرائح إلى 16:9 من تبويب تصميم ← حجم الشريحة.', 'Tick it after changing the slide size to 16:9 (Design ← Slide Size).', 'تم تحويل المقاس', 'Size changed')],
      ['#scope [data-v="sel"]', E('يحوّل الشرائح التي حددتها فقط.', 'Converts only the slides you selected.')],
      ['#scope [data-v="all"]', E('يحوّل كل شرائح الملف.', 'Converts every slide in the file.')],
      ['#darkBtn', E('يحوّل الشرائح إلى الوضع الداكن: شريحة لكل جزء بين فاصلين، بخلفية داكنة ونص أبيض. يعمل بعد إكمال الخطوتين ١ و٢.', 'Converts the slides to dark mode: one slide per part between separators, dark background and white text. Works after steps 1 and 2.', 'تحويل', 'Convert')],
      ['#setTog', E('ألوان الخلفية والنص وخيار الصور المستخدمة في التحويل.', 'The background, text and image options used when converting.', 'الإعدادات', 'Settings')],
      ['.colorbtn[data-k="bg"]', E('لون خلفية الشرائح الداكنة.', 'Background colour of the dark slides.', 'لون الخلفية', 'Background colour')],
      ['.colorbtn[data-k="text"]', E('لون النص بعد التحويل.', 'Text colour after converting.', 'لون النص', 'Text colour')],
      ['.colorbtn[data-k="accent"]', E('اللون الذي يحل محل الأزرق في الشرائح الداكنة.', 'The colour that replaces blue on the dark slides.', 'الأزرق يصير', 'Blue becomes')],
      ['label:has(#imgChk)', E('يجعل الصور الكبيرة (الرسوم والأشكال) بيضاء لتظهر على الخلفية الداكنة.', 'Turns large pictures (drawings and shapes) white so they show on the dark background.')],
      ['#resetBtn', E('يرجع ألوان التحويل وخياراته إلى الإعدادات الأصلية.', 'Puts the colours and options back to the original settings.', 'استعادة الافتراضي', 'Reset')],
      ['#tType button', E('اختر نوع الفيديو؛ لكل نوع قالب غلاف خاص به.', 'Pick the video type; each type has its own cover template.')],
      ['#tThumbs button', E('اختر شكل الغلاف من أشكال هذا النوع.', 'Pick the cover design for this type.', 'شكل الغلاف', 'Cover design')],
      ['#tTitle', E('اكتب عنوان الفيديو كما يظهر على الغلاف.', 'Type the video title as it should appear on the cover.', 'عنوان الفيديو', 'Video title')],
      ['#tSub', E('سطر ثانٍ تحت العنوان، ويمكن تركه فارغًا.', 'A second line under the title; it can stay empty.', 'العنوان الثانوي', 'Subtitle')],
      ['#tPos [data-v="start"]', E('تُضاف شريحة الغلاف في أول الملف.', 'The cover slide goes at the start of the file.')],
      ['#tPos [data-v="before"]', E('تُضاف قبل الشريحة المحددة. حدّد شريحة أولًا.', 'Goes before the selected slide. Select a slide first.')],
      ['#tPos [data-v="after"]', E('تُضاف بعد الشريحة المحددة. حدّد شريحة أولًا.', 'Goes after the selected slide. Select a slide first.')],
      ['#iThumbs button', E('اختر نمط الشريحة الداخلية من الأنماط الثلاثة في قالب الفيديو.', 'Pick one of the three inner slide styles of the video template.', 'نمط الشريحة', 'Slide style')],
      ['label:has(#iHead)', E('تُدرج الشريحة بمكان للرأس أعلاها (عنوان قصير) فوق مكان المحتوى.', 'The slide gets a header area at the top (a short heading) above the content.', 'مع رأس', 'With a header')],
      ['#iPos [data-v="end"]', E('تُضاف الشريحة في آخر الملف.', 'The slide goes at the end of the file.')],
      ['#iPos [data-v="before"]', E('تُضاف قبل الشريحة المحددة. حدّد شريحة أولًا.', 'Goes before the selected slide. Select a slide first.')],
      ['#iPos [data-v="after"]', E('تُضاف بعد الشريحة المحددة. حدّد شريحة أولًا.', 'Goes after the selected slide. Select a slide first.')],
      ['#iInsert', E('يُدرج شريحة داخلية فارغة بالنمط المختار، فيها مكان المحتوى وتعليمات التنسيق من القالب.', 'Inserts an empty inner slide in the chosen style, with the template\'s content area and formatting notes.', 'إدراج شريحة داخلية', 'Insert inner slide')],
      ['#tInsert', E('يُدرج شريحة الغلاف بالعنوان المكتوب في المكان المختار، ولا يغيّر باقي الشرائح.', 'Inserts the cover slide with your title where you chose, without changing other slides.', 'إدراج شريحة الغلاف', 'Insert cover slide')]
    ],

    restyle: [
      ['#menuBtn', E('التحقق من التحديثات، وتغيير اللغة، وحول الأداة.', 'Check for updates, change the language and about.')],
      ['#tabs [data-tab="obj"]', E('تحويل الخط، وأنواع المربعات، وتنسيق المسافات.', 'Convert the font, box types and spacing.')],
      ['#tabs [data-tab="ins"]', E('إدراج ملف وورد مميَّز، وقوالب المذكرة الجاهزة.', 'Insert a tagged Word file, and ready booklet templates.')],
      ['#tabs [data-tab="set"]', E('إخفاء الحلول وترقيم الصفحات.', 'Hide solutions and page numbers.')],
      ['#wtabs [data-tab="wtag"]', E('حدّد المحتوى في الوورد واختر نوعه (سؤال، حل، تعريف…) ليُنقل إلى الباوربوينت.', 'Select content in Word and pick its type (question, solution, definition…) to move it to PowerPoint.')],
      ['#wtabs [data-tab="wrev"]', E('قائمة الأجزاء المميزة في الملف، وتنبيه للأجزاء غير المميزة.', 'The tagged parts of the file, and a warning about untagged parts.')],
      ['.scopeSeg [data-v="cur"]', E('تُطبَّق الأوامر على الشريحة الحالية فقط.', 'Commands apply to the current slide only.')],
      ['.scopeSeg [data-v="all"]', E('تُطبَّق الأوامر على كل شرائح الملف.', 'Commands apply to every slide in the file.')],
      ['#goBtn', E('يحوّل الشريحة إلى ستايل مذكرة علا: خط UULA Sans والأحجام والألوان، وترتيب المربعات على شبكة الصفحة. إذا طالت الشريحة يسألك قبل تقسيمها.', 'Restyles the slide to the UULA booklet: UULA Sans font, sizes, colours and boxes placed on the page grid. A slide that gets too long is split only if you agree.', 'تحويل', 'Convert')],
      ['#roles .tbtn', function (el) { var n = el.textContent.trim(); return E('حدّد مربعًا في الشريحة ثم اضغط ليأخذ ستايل «' + n + '» من المذكرة.', 'Select a box on the slide, then click to give it the "' + n + '" booklet style.', n); }],
      ['#spV', E('يضبط المسافات بين المربعات من الأعلى والأسفل حسب شبكة الصفحة، بدون تداخل أو فراغات زائدة.', 'Fixes the gaps between boxes from top to bottom on the page grid, with no overlaps or extra space.', 'رأسي', 'Vertical')],
      ['#spH', E('يحاذي المربعات أفقيًا حسب الاختيار تحته: تلقائي أو يمين أو يسار.', 'Aligns the boxes horizontally as chosen below: auto, right or left.', 'أفقي', 'Horizontal')],
      ['#hAlign [data-v="auto"]', E('تختار الأداة المحاذاة المناسبة لكل مربع.', 'The tool picks the right alignment for each box.')],
      ['#hAlign [data-v="right"]', E('تُحاذى المربعات إلى اليمين.', 'Boxes are aligned to the right.')],
      ['#hAlign [data-v="left"]', E('تُحاذى المربعات إلى اليسار.', 'Boxes are aligned to the left.')],
      ['#docxBtn', E('اختر ملف وورد ميّزت أجزاءه بالأداة في الوورد؛ كل جزء مميَّز يصبح مربعًا مستقلًا بستايل علا.', 'Pick a Word file whose parts you tagged with the tool in Word; each tagged part becomes its own UULA box.', 'إدراج ملف وورد', 'Insert a Word file')],
      ['#tpls .tbtn', function (el) { var n = el.textContent.trim(); return E('يُدرج «' + n + '» جاهزًا بستايل علا تحت آخر عنصر في الشريحة الحالية.', 'Inserts a ready "' + n + '" in UULA style under the last object on the current slide.', n); }],
      ['#solBtn', E('يخفي الحلول في الشرائح أو يظهرها، لعمل نسخة للطالب بدون إجابات.', 'Hides or shows the solutions on the slides, to make a student copy without answers.')],
      ['label:has(#numChk)', E('يضيف رقم الصفحة أسفل الشرائح بعد كل تحويل.', 'Adds the page number at the bottom of the slides after each conversion.', 'ترقيم الصفحات', 'Page numbers')],
      ['#numStart', E('رقم الشريحة التي يبدأ منها الترقيم.', 'The slide where numbering starts.', 'بداية الترقيم', 'Numbering start')],
      ['#numHere', E('يجعل الترقيم يبدأ من الشريحة المحددة الآن.', 'Makes numbering start at the slide selected now.', 'الحالية', 'Current')],
      ['#numAll', E('يعيد ترقيم كل الصفحات الآن.', 'Renumbers all pages now.', 'تحديث أرقام الصفحات', 'Update page numbers')],
      ['#wroles .tbtn', function (el) { var n = el.textContent.trim(); return E('حدّد المحتوى في الوورد أو ضع المؤشر داخله، ثم اضغط ليُميَّز «' + n + '» بإطار ملوّن.', 'Select content in Word or put the cursor in it, then click to tag it as "' + n + '" with a coloured frame.', n); }],
      ['#wAuto', E('يميّز كل المحتوى غير المميز تلقائيًا حسب كلماته وألوانه. راجع النتيجة بعده.', 'Tags all untagged content automatically by its words and colours. Review the result afterwards.', 'تمييز تلقائي', 'Auto-tag')],
      ['#wUntag', E('يزيل التمييز عن المحتوى المحدد، ويبقى النص كما هو.', 'Removes the tag from the selected content; the text stays.', 'إزالة التمييز', 'Remove tag')],
      ['#wRefresh', E('يحدّث قائمة الأجزاء المميزة.', 'Refreshes the list of tagged parts.', 'تحديث', 'Refresh')],
      ['#wMark', E('يلوّن الأجزاء غير المميزة في الوورد لتجدها بسهولة.', 'Colours the untagged parts in Word so you can find them.', 'لوّن غير المميز', 'Colour untagged')],
      ['#wUnmark', E('يزيل تلوين الأجزاء غير المميزة.', 'Removes the colouring from untagged parts.', 'إزالة التلوين', 'Remove colouring')],
      ['#wClear', E('يزيل كل التمييز من الملف، ويبقى النص.', 'Removes every tag from the file; the text stays.', 'إزالة كل التمييز', 'Remove all tags')]
    ],

    math: [
      ['#menuBtn', E('جديد، والتعليمات، والاختصارات، والتحقق من التحديثات.', '')],
      ['#editTools', E('اختر الأدوات التي تظهر في الشريط ورتّبها.', '', 'تخصيص الأدوات')],
      ['#resetTools', E('يرجع شريط الأدوات إلى وضعه الأصلي.', '', 'الافتراضي')],
      ['#editSyms', E('اختر الرموز التي تظهر في لوحة الرموز ورتّبها.', '', 'تخصيص الرموز')],
      ['#resetSyms', E('يرجع لوحة الرموز إلى وضعها الأصلي.', '', 'الافتراضي')],
      ['[data-act="new"]', E('يمسح مربع الكتابة لتبدأ معادلة جديدة.', '')],
      ['[data-act="help"]', E('طريقة كتابة الرموز والكسور والجذور بالكلمات.', '')],
      ['[data-act="keys"]', E('اختصارات لوحة المفاتيح لكتابة الرموز بسرعة.', '')],
      ['[data-act="news"]', E('آخر ما أُضيف إلى الأداة.', '')]
    ],

    graph: []
  };
  RULES.cover = RULES.dark;

  // ---------- explanations found by the button's own name (Arabic Math, UULA Graph) ----------
  var LABELS = {
    math: {
      'نسخ النص': E('ينسخ نص المعادلة المكتوب في مربع الكتابة لتلصقه في مكان آخر.'),
      'قص': E('يقص النص المحدد في مربع الكتابة.'),
      'لصق': E('يلصق نصًا منسوخًا في مربع الكتابة.'),
      'مسح الكل': E('يمسح مربع الكتابة لتبدأ معادلة جديدة.'),
      'السابقة': E('المعادلات التي كتبتها من قبل؛ اختر واحدة لإرجاعها إلى مربع الكتابة.'),
      'تراجع (⌘Z)': E('يتراجع عن آخر تعديل في الكتابة.'),
      'إعادة (⌘⇧Z)': E('يعيد التعديل الذي تراجعت عنه.'),
      'رموز ↔ نص': E('يبدّل الكتابة بين رموز الرياضيات والكتابة العادية بدون تحويل للرموز.'),
      'تعديل المعادلة المحددة': E('حدّد معادلة أدرجتها من قبل في الشريحة، ثم اضغط لتعديلها هنا.'),
      'تعديل': E('حدّد معادلة أدرجتها من قبل في الشريحة، ثم اضغط لتعديلها هنا.'),
      'قراءة معادلة من صورة': E('حدّد صورة فيها معادلة لتحويلها إلى كتابة قابلة للتعديل.'),
      'اللون': E('لون المعادلة: من ألوان المذكرة أو أي لون آخر.'),
      'التعليمات': E('يعرض طريقة كتابة الرموز والاختصارات.'),
      'إدراج': E('يُدرج المعادلة صورةً بجانب الشريحة عند آخر مربع حددته، لتسحبها إلى مكانها.'),
      'إدراج (⌘ + Enter)': E('يُدرج المعادلة صورةً بجانب الشريحة عند آخر مربع حددته، لتسحبها إلى مكانها.'),
      'نسخ الصورة (⌘⇧C)': E('ينسخ المعادلة صورةً لتلصقها في أي برنامج.'),
      'حجم الخط (pt)': E('حجم خط المعادلة بالنقاط.'),
      'مطابق للنص المحدد': E('الحجم مضبوط على حجم النص المحدد في الشريحة.'),
      'خلفية داكنة': E('يعرض المعادلة على خلفية داكنة ويجعل لونها أبيض، للشرائح الداكنة.'),
      'لون الخلفية': E('لون خلفية صورة المعادلة.'),
      'سماكة الخط': E('سماكة خطوط المعادلة (الكسر والجذر…).'),
      'يمين': E('محاذاة أسطر المعادلة إلى اليمين.'),
      'وسط': E('محاذاة أسطر المعادلة في الوسط.'),
      'يسار': E('محاذاة أسطر المعادلة إلى اليسار.'),
      'على علامة =': E('محاذاة الأسطر بحيث تقع علامات = تحت بعضها.')
    },
    graph: {
      'تحديد وتحريك': E('اسحب النقاط والأشكال لتحريكها، واضغط على شكل لتعديل خصائصه.', 'Drag points and shapes to move them; click a shape to edit it.'),
      'إدراج': E('يُدرج الرسم صورةً في الشريحة أو المستند. إذا كانت صورة الرسم محددة يحدّثها بدل إضافة صورة جديدة.', 'Inserts the graph as a picture. If the graph picture is selected, it is updated instead.'),
      'إدراج الرسم': E('يُدرج الرسم صورةً في الشريحة أو المستند. إذا كانت صورة الرسم محددة يحدّثها بدل إضافة صورة جديدة.', 'Inserts the graph as a picture. If the graph picture is selected, it is updated instead.'),
      'مربع نص': E('انقر على الرسم لإضافة مربع نص، ثم اكتب فيه.', 'Click the graph to add a text box, then type in it.'),
      'الحدود الافتراضية': E('يرجع حدود المحورين إلى ما يناسب الدوال المرسومة.', 'Sets the axis limits back to fit the graphed functions.'),
      'الشبكة': E('يُظهر خطوط الشبكة أو يخفيها.', 'Shows or hides the grid lines.'),
      'المحوران ظاهران': E('اختر المحاور الظاهرة على الرسم.', 'Choose which axes show on the graph.'),
      'تكبير': E('يكبّر الرسم (يضيّق حدود المحورين).', 'Zooms in on the graph.'),
      'تصغير': E('يصغّر الرسم (يوسّع حدود المحورين).', 'Zooms out of the graph.'),
      'اسحب لتكبير المعاينة أو تصغيرها': E('اسحب لأعلى أو لأسفل لتغيير ارتفاع المعاينة.', 'Drag up or down to change the preview height.'),
      'إضافة الدالة': E('اكتب الدالة في المربع ثم اضغط لرسمها.', 'Type a function in the box, then click to graph it.'),
      'اكتب الدالة': E('اكتب الدالة مثل x^2-4 أو f(x)=2x، أو نقطة مثل A(2,3)، ثم اضغط Enter.', 'Type a function like x^2-4 or f(x)=2x, or a point like A(2,3), then press Enter.'),
      'نص الدالة': E('عدّل نص الدالة هنا، ويتغير الرسم مباشرة.', 'Edit the function here; the graph updates at once.'),
      'إظهار الأدوات': E('يُظهر أدوات هذا العنصر: اللون والسماكة والمدى والاسم.', 'Shows this item\'s tools: colour, thickness, range and label.'),
      'إخفاء الأدوات': E('يخفي أدوات هذا العنصر.', 'Hides this item\'s tools.'),
      'إخفاء': E('يخفي العنصر من الرسم دون حذفه.', 'Hides the item without deleting it.'),
      'إظهار': E('يُظهر العنصر على الرسم.', 'Shows the item on the graph.'),
      'حذف': E('يحذف العنصر.', 'Deletes the item.'),
      'تحديد جزء للإدراج': E('اسحب مستطيلًا على الرسم لتحديد الجزء الذي تريد إدراجه فقط.', 'Drag a rectangle on the graph to insert only that part.'),
      'تصغير الاسم': E('يصغّر أسماء النقاط والأشكال على الرسم.', 'Makes the labels on the graph smaller.'),
      'تكبير الاسم': E('يكبّر أسماء النقاط والأشكال على الرسم.', 'Makes the labels on the graph bigger.'),
      'حذف كل الأشكال': E('يحذف كل الأشكال المرسومة (النقاط والقطع والدوائر…)، وتبقى الدوال.', 'Deletes every drawn shape (points, segments, circles…); functions stay.'),
      'نقطة': E('انقر على الرسم لوضع نقطة، أو على منحنى لوضع نقطة عليه.', 'Click the graph to place a point, or a curve to put a point on it.'),
      'قطعة مستقيمة': E('انقر نقطتين لرسم قطعة بينهما.', 'Click two points to draw a segment.'),
      'مستقيم': E('انقر نقطتين لرسم مستقيم يمر بهما.', 'Click two points to draw a line through them.'),
      'شعاع': E('انقر نقطة البداية ثم نقطة في اتجاه الشعاع.', 'Click the start point, then a point in the ray\'s direction.'),
      'متجه': E('انقر نقطة البداية ثم نقطة النهاية لرسم متجه بسهم.', 'Click the start, then the end, to draw a vector.'),
      'مضلع': E('انقر رؤوس المضلع بالترتيب، ثم انقر النقطة الأولى لإغلاقه.', 'Click the vertices in order, then the first one again to close it.'),
      'مضلع منتظم': E('انقر نقطتين لضلع واحد، ثم اكتب عدد الأضلاع.', 'Click two points for one side, then type the number of sides.'),
      'دائرة بمركز ونقطة': E('انقر المركز ثم نقطة على الدائرة.', 'Click the centre, then a point on the circle.'),
      'دائرة بمركز ونصف قطر': E('انقر المركز ثم اكتب طول نصف القطر.', 'Click the centre, then type the radius.'),
      'نص': E('انقر مكان النص على الرسم ثم اكتبه.', 'Click where the text goes, then type it.'),
      'زاوية': E('انقر نقطة على الضلع الأول، ثم الرأس، ثم نقطة على الضلع الثاني.', 'Click a point on the first side, the vertex, then a point on the second side.'),
      'مستقيم عمودي': E('اختر مستقيمًا أو قطعة، ثم انقر نقطة يمر بها العمود.', 'Pick a line or segment, then a point the perpendicular passes through.'),
      'مستقيم موازٍ': E('اختر مستقيمًا أو قطعة، ثم انقر نقطة يمر بها الموازي.', 'Pick a line or segment, then a point the parallel passes through.'),
      'منتصف قطعة': E('انقر نقطتين أو قطعة لوضع نقطة المنتصف.', 'Click two points or a segment to place its midpoint.'),
      'نقطة التقاطع': E('انقر شكلين (منحنيين أو مستقيمين) لوضع نقاط تقاطعهما.', 'Click two objects to mark where they meet.'),
      'منصف عمودي': E('انقر نقطتين أو قطعة لرسم المنصف العمودي.', 'Click two points or a segment to draw the perpendicular bisector.'),
      'منصف زاوية': E('انقر ثلاث نقاط (الرأس في الوسط) لرسم منصف الزاوية.', 'Click three points (vertex in the middle) to draw the angle bisector.'),
      'دائرة تمر بثلاث نقاط': E('انقر ثلاث نقاط لرسم الدائرة المارة بها.', 'Click three points to draw the circle through them.'),
      'قوس دائري': E('انقر المركز، ثم بداية القوس، ثم نهايته.', 'Click the centre, the start of the arc, then its end.'),
      'قطاع دائري': E('انقر المركز، ثم نقطتين على القوس لرسم القطاع.', 'Click the centre, then two points on the arc.'),
      'قطع ناقص': E('ارسم قطعًا ناقصًا بمركزه وطولي محوريه.', 'Draw an ellipse from its centre and axes.'),
      'فترة على خط الأعداد': E('ارسم فترة على خط الأعداد ببدايتها ونهايتها (مفتوحة أو مغلقة).', 'Draw an interval on the number line (open or closed ends).'),
      'دائرة الوحدة': E('يرسم دائرة الوحدة لشرح الدوال المثلثية.', 'Draws the unit circle for trigonometry.'),
      'معامل بمنزلق': E('معامل في معادلة الدالة يتغير بمنزلق، لتوضيح أثره على الرسم.', 'A coefficient controlled by a slider, to show its effect on the graph.'),
      'تحليل الدالة': E('يحدد على المنحنى الأصفار والقيم العظمى والصغرى ونقاط الانعطاف.', 'Marks the zeros, maximum, minimum and inflection points of the curve.'),
      'مماس': E('انقر نقطة على المنحنى لرسم المماس عندها.', 'Click a point on the curve to draw the tangent there.'),
      'المساحة تحت المنحنى': E('اختر الدالة وحدود الفترة لتظليل المساحة تحت المنحنى.', 'Pick the function and the interval to shade the area under it.'),
      'منزلق': E('يضيف منزلقًا لقيمة متغيرة تستخدمها في الأشكال أو الدوال.', 'Adds a slider for a value used in shapes or functions.'),
      'أثر النقطة': E('يترك أثرًا لمسار النقطة عند تحريكها.', 'Leaves a trace of the point\'s path as it moves.'),
      'محل هندسي': E('يرسم مسار نقطة تتحرك مع حركة نقطة أخرى.', 'Draws the path of a point that moves with another point.'),
      'إخفاء كائن': E('انقر على شكل لإخفائه من الرسم دون حذفه.', 'Click a shape to hide it without deleting it.'),
      'إظهار أو إخفاء التسمية': E('انقر على شكل لإظهار اسمه أو إخفائه.', 'Click a shape to show or hide its label.'),
      'حذف كائن': E('انقر على شكل لحذفه.', 'Click a shape to delete it.'),
      'قطعة بطول محدد': E('انقر نقطة البداية ثم اكتب الطول.', 'Click the start point, then type the length.'),
      'زاوية بقياس محدد': E('انقر نقطتين ثم اكتب قياس الزاوية.', 'Click two points, then type the angle size.'),
      'نصف دائرة': E('انقر طرفي القطر لرسم نصف الدائرة.', 'Click both ends of the diameter.'),
      'فرجار': E('انقر نقطتين لأخذ نصف القطر، ثم انقر المركز.', 'Click two points for the radius, then the centre.'),
      'قوس يمر بثلاث نقاط': E('انقر ثلاث نقاط لرسم القوس المار بها.', 'Click three points to draw the arc through them.'),
      'قطع ناقص بالبؤرتين': E('انقر البؤرتين ثم نقطة على القطع.', 'Click the two foci, then a point on the ellipse.'),
      'قطع زائد بالبؤرتين': E('انقر البؤرتين ثم نقطة على القطع.', 'Click the two foci, then a point on the hyperbola.'),
      'قطع مكافئ بالبؤرة والدليل': E('انقر البؤرة ثم اختر مستقيم الدليل.', 'Click the focus, then pick the directrix line.'),
      'المسافة أو الطول': E('انقر نقطتين أو قطعة لعرض الطول.', 'Click two points or a segment to show the length.'),
      'المساحة': E('انقر على مضلع أو دائرة لعرض مساحته.', 'Click a polygon or circle to show its area.'),
      'المحيط': E('انقر على مضلع أو دائرة لعرض محيطه.', 'Click a polygon or circle to show its perimeter.'),
      'الميل': E('انقر على مستقيم لعرض ميله.', 'Click a line to show its slope.'),
      'أفضل خط مطابق': E('اختر نقاط البيانات لرسم الخط الأنسب لها.', 'Pick the data points to draw the line of best fit.'),
      'مدرج تكراري': E('اكتب البيانات لرسم مدرج تكراري.', 'Enter data to draw a histogram.'),
      'مخطط الصندوق': E('اكتب البيانات لرسم مخطط الصندوق.', 'Enter data to draw a box plot.'),
      'بيانات وأفضل خط': E('أدخل جدول بيانات لرسم النقاط وأفضل خط مطابق لها.', 'Enter a data table to plot the points and their line of best fit.'),
      'انعكاس': E('اختر الشكل ثم محور الانعكاس (مستقيم أو نقطة).', 'Pick the shape, then the mirror line or point.'),
      'إزاحة': E('اختر الشكل ثم متجه الإزاحة.', 'Pick the shape, then the translation vector.'),
      'دوران': E('اختر الشكل ثم مركز الدوران، واكتب الزاوية.', 'Pick the shape and the centre, then type the angle.'),
      'تمدد': E('اختر الشكل ثم مركز التمدد، واكتب المعامل.', 'Pick the shape and the centre, then type the scale factor.'),
      'قفل الشكل': E('يمنع تحريك الشكل بالخطأ.', 'Stops the shape from being moved by mistake.'),
      'فتح القفل': E('يسمح بتحريك الشكل من جديد.', 'Lets the shape be moved again.'),
      'تكرار الشكل': E('ينشئ نسخة من الشكل.', 'Makes a copy of the shape.'),
      'نسخ التنسيق': E('انسخ ألوان هذا الشكل وسماكته لتطبيقها على شكل آخر.', 'Copy this shape\'s colours and thickness to apply them to another shape.'),
      'إحضار للأمام': E('يجعل الشكل فوق الأشكال الأخرى.', 'Puts the shape on top of the others.'),
      'إرسال للخلف': E('يجعل الشكل خلف الأشكال الأخرى.', 'Puts the shape behind the others.'),
      'كل الخصائص': E('يفتح كل إعدادات الشكل.', 'Opens all of the shape\'s settings.'),
      'تحريك تلقائي': E('يحرّك المنزلق تلقائيًا ليعرض التغير كحركة.', 'Moves the slider by itself to show the change as an animation.'),
      'حذف المنزلق': E('يحذف المنزلق من الرسم.', 'Deletes the slider.'),
      'أصغر قيمة': E('أصغر قيمة يصل إليها المنزلق.', 'The slider\'s smallest value.'),
      'أكبر قيمة': E('أكبر قيمة يصل إليها المنزلق.', 'The slider\'s largest value.'),
      'إخفاء المحور': E('يخفي هذا المحور من الرسم.', 'Hides this axis.'),
      'سماكة الخط': E('سماكة خط الشكل أو المنحنى.', 'Line thickness of the shape or curve.'),
      'حجم النقطة': E('حجم النقطة على الرسم.', 'Size of the point on the graph.'),
      'التعبئة': E('لون تعبئة الشكل وشفافيتها.', 'Fill colour and transparency of the shape.'),
      'لون الإطار': E('لون حدود الشكل.', 'Colour of the shape\'s outline.')
    }
  };

  // ---------- engine ----------
  var rules = COMMON.concat(RULES[TOOL] || []), labels = LABELS[TOOL] || {};
  function lang() {
    try {
      if (TOOL === 'home') return localStorage.getItem('tk-lang') === 'en' ? 'en' : 'ar';
      if (TOOL === 'graph') return (typeof LANG !== 'undefined' && LANG === 'en') ? 'en' : 'ar';
    } catch (e) {}
    return document.documentElement.lang === 'en' ? 'en' : 'ar';
  }
  function ruleFor(el) {
    for (var i = 0; i < rules.length; i++) {
      try { if (el.matches(rules[i][0])) return typeof rules[i][1] === 'function' ? rules[i][1](el) : rules[i][1]; } catch (e) {}
    }
    return null;
  }
  // the element the pointer is on: the nearest one with a rule, a title or a tip
  function find(t) {
    for (var a = t, k = 0; a && a !== document.body && k < 8; a = a.parentElement, k++) {
      if (!a.matches) continue;
      if (a.id === 'tkTip') return null;
      if (a.hasAttribute('title') || a.hasAttribute('data-tip')) return a;
      if (ruleFor(a)) return a;
      if (a.matches('button,a,label,select,input:not([type=hidden])')) return null;
    }
    return null;
  }
  var tip = null, cur = null, timer = 0;
  function make() {
    var css = document.createElement('style');
    css.textContent =
      '#tkTip{position:fixed;z-index:100000;pointer-events:none;background:#18212e;color:#fff;font:12px/1.55 "UULA Sans",-apple-system,"Segoe UI",Tahoma,sans-serif;' +
      'padding:6px 10px;border-radius:7px;max-width:250px;box-shadow:0 6px 18px rgb(0 0 0 / .22);display:grid;gap:2px}' +
      '#tkTip[hidden]{display:none}#tkTip b{font-weight:600;font-size:12.5px}#tkTip span{color:#d4dae3}#tkTip .k{color:#9fb0c6;font-family:ui-monospace,Menlo,monospace;font-size:11px}' +
      // the tools\' own tooltips step aside, so there is one look everywhere
      '.tip:not(#tkTip),#tip{display:none!important}';
    document.head.appendChild(css);
    tip = document.createElement('div'); tip.id = 'tkTip'; tip.hidden = true; tip.setAttribute('role', 'tooltip');
    document.body.appendChild(tip);
  }
  function hide() { clearTimeout(timer); if (tip) tip.hidden = true; cur = null; }
  function show(el) {
    if (!tip) make();
    var L = lang(), r = ruleFor(el);
    if (el.hasAttribute('title')) { var tt = el.getAttribute('title'); el.removeAttribute('title'); if (tt) el.dataset.tip = tt; }
    var label = el.dataset.tip || '';
    if (!r && label) r = labels[label] || null;
    var name = r && r.n ? (r.n[L] || r.n.ar) : label;
    if (!name) { var tx = (el.textContent || '').trim(); if (tx.length <= 30) name = tx; }
    if (!name) name = el.getAttribute('aria-label') || '';
    var M = TOOL === 'math' ? window.TK_MATH : null;
    if (M) { try { name = M.K(name); } catch (e) {} }
    if (TOOL === 'graph' && L === 'en' && typeof L10 === 'function') name = L10(name);
    var expl = r ? (r[L] || r.ar) : '';
    if (!name && !expl) { hide(); return; }
    tip.innerHTML = '';
    var b = document.createElement('b'); b.textContent = name; tip.appendChild(b);
    var sb = null; try { sb = M && el.dataset.ins && M.SB ? M.SB[el.dataset.ins] : null; } catch (e) {}
    if (sb) {
      var k = document.createElement('bdi'); k.className = 'k'; k.dir = 'ltr'; k.textContent = sb; tip.appendChild(k);
    }
    if (TOOL === 'math' && !expl && el.dataset.ins) expl = 'يُدرج في مكان المؤشر في مربع الكتابة.';
    if (expl) { var s = document.createElement('span'); s.textContent = expl; tip.appendChild(s); }
    var ex = null; try { ex = M ? M.TIPEX[label] : null; } catch (e) {}
    if (ex) {
      var x = document.createElement('span'); x.textContent = 'بالكتابة: ' + ex; x.style.unicodeBidi = 'plaintext'; tip.appendChild(x);
    }
    tip.dir = L === 'en' ? 'ltr' : 'rtl';
    tip.hidden = false;
    var er = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.max(6, Math.min(innerWidth - w - 6, er.left + er.width / 2 - w / 2));
    var top = er.bottom + 6; if (top + h > innerHeight - 4) top = Math.max(4, er.top - h - 6);
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  }
  document.addEventListener('pointerover', function (e) {
    if (e.pointerType === 'touch') return;
    var el = find(e.target);
    if (el === cur) return;
    hide(); if (!el) return;
    cur = el;
    if (el.hasAttribute('title')) { var tt = el.getAttribute('title'); el.removeAttribute('title'); if (tt) el.dataset.tip = tt; }  // no browser tooltip
    timer = setTimeout(function () { if (cur === el && document.contains(el)) show(el); }, 450);
  }, true);
  document.addEventListener('pointerout', function (e) { if (cur && !(e.relatedTarget && cur.contains(e.relatedTarget))) hide(); }, true);
  document.addEventListener('pointerdown', hide, true);
  document.addEventListener('keydown', hide, true);
  window.addEventListener('scroll', hide, true);
  window.addEventListener('blur', hide);
})();

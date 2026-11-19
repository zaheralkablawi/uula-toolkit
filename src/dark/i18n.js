// UULA Dark — interface texts in Arabic and English
const I18N = (() => {
  const cntAr = n => n === 1 ? 'شريحة واحدة' : n === 2 ? 'شريحتان' : n <= 10 ? n + ' شرائح' : n + ' شريحة';
  const cntEn = n => n === 1 ? '1 slide' : n + ' slides';
  const D = {
    ar: {
      dir: 'rtl', langBtn: 'EN', langName: 'English',
      update: 'تحديث جديد', menu: 'القائمة', chkUpd: 'التحقق من التحديثات', about: 'حول الأداة', close: 'إغلاق',
      tabDark: 'التحويل إلى الداكن', tabTitle: 'شريحة العنوان',
      stepsLabel: 'قبل التحويل: خطوتان تقوم بهما أنت', n1: '١', n2: '٢',
      s1Title: 'قسّم الشرائح', s1Note: 'اقترح الفواصل ثم راجعها، أو أضف فاصلًا بنفسك، أو حدّد عناصر واضغط «جزء مستقل». لا تُعتمد إلا الفواصل والأجزاء المضافة من هنا.',
      suggestSep: 'اقترح الفواصل', addSep: 'أضف فاصلًا', makePart: 'جزء مستقل', clearParts: 'إلغاء الأجزاء', s1Done: 'تم تقسيم الشرائح',
      suggesting: (k, n) => 'فحص الشريحة ' + k + ' من ' + n + '…',
      suggested: (b, sl) => '✓ أُضيف ' + (b === 1 ? 'فاصل واحد' : b === 2 ? 'فاصلان' : b + (b <= 10 ? ' فواصل' : ' فاصلًا')) + ' في ' + cntAr(sl) + '. راجعها قبل التحويل.',
      suggestedNone: 'لم أجد أماكن واضحة للفواصل. أضفها بنفسك أو استخدم «جزء مستقل».',
      suggestSkip: n => ' تُركت ' + cntAr(n) + ' فيها فواصل أو أجزاء من قبل.',
      partNeedSel: 'حدّد عناصر في شريحة واحدة أولًا.', partDone: (p, k) => '✓ جزء ' + p + ': ' + (k === 1 ? 'عنصر واحد' : k === 2 ? 'عنصران' : k + ' عناصر') + '. حدّد عناصر الجزء التالي ثم اضغط مرة أخرى.',
      partsCleared: n => '✓ أُلغيت الأجزاء في ' + cntAr(n) + '.',
      s2Title: 'حوّل مقاس الشرائح إلى 16:9', s2Note: 'من تبويب تصميم ← حجم الشريحة ← شاشة عريضة (16:9).', s2Done: 'تم تحويل المقاس',
      darkHead: 'التحويل إلى الوضع الداكن', scopeSel: 'الشرائح المحددة', scopeAll: 'كل الشرائح', convert: 'تحويل',
      lockBoth: 'أكمل الخطوتين ١ و٢ أولًا.', lockOne: k => 'أكمل الخطوة ' + (k === 1 ? '١' : '٢') + ' أولًا.',
      settings: 'الإعدادات', bgColor: 'لون الخلفية', textColor: 'لون النص', accentColor: 'الأزرق يصير',
      imgChk: 'تلوين الصور الكبيرة بالأبيض', fontNote: 'الخط: UULA Sans Medium', reset: 'استعادة الافتراضي',
      tExplain: 'الشرح', tBetter: 'الزبدة', tBank: 'بنك الأسئلة', tPractice: 'التدريبات',
      tTitlePh: 'عنوان الفيديو', tSubPh: 'العنوان الثانوي (اختياري)', style: k => 'نمط ' + k,
      posLabel: 'مكان الإدراج', posStart: 'بداية الملف', posBefore: 'قبل المحددة', posAfter: 'بعد المحددة',
      tInsert: 'إدراج شريحة العنوان', tNeedSel: 'حدّد شريحة لتفعيل «قبل» و«بعد».',
      inserting: 'جارٍ الإدراج…', inserted: '✓ تم إدراج شريحة العنوان.', insertFail: 'تعذّر الإدراج: ', tplFail: 'تعذّر تحميل القالب',
      cnt: cntAr, sep: '، ',
      converting: (k, n) => 'تحويل الشريحة ' + k + ' من ' + n + '…',
      stRead: 'قراءة الشريحة', stInsert: 'إدراج الشريحة', stLayout: 'ترتيب المحتوى', stDelete: 'حذف الأصل',
      diagOk: ' — الأصل يُدرج بنجاح، المشكلة في الملف المحوَّل', diagBad: ' — حتى الأصل لا يُدرج: ',
      resDone: (a, b) => '✓ ' + cntAr(a) + ' ← ' + cntAr(b) + ' داكنة: ', resSmall: '• صُغّر الخط: ', resOver: '• ممتلئة، قسّمها يدويًا: ',
      resGray: '• صور فقدت ألوانها: ', resSkipped: n => '• محوّلة سابقًا: ' + cntAr(n), resTitles: n => 'تُركت شرائح العنوان كما هي: ' + cntAr(n),
      resFallback: '• شريحة {n} حُوّلت بدون: ', fontNeeded: 'يلزم تثبيت خط UULA Sans Medium على الجهاز.',
      doneMsg: 'تم التحويل.', noneMsg: 'لم يتم تحويل أي شريحة.', selFirst: 'حدّد شريحة أولًا.', errPrefix: 'حدث خطأ: ',
      skip: { layout: 'الترتيب', images: 'تلوين الصور', tables: 'الجداول', shapes: 'الأشكال', text: 'النصوص' },
      dragSep: 'اسحب الفاصل إلى مكانه.', sepFail: 'تعذّرت إضافة الفاصل: ',
      brand: 'ألوان المذكرة', others: 'ألوان أخرى', moreColor: 'لون آخر…',
      cWhite: 'أبيض', cBlack: 'أسود', cBlue: 'أزرق', cMagenta: 'أرجواني', cYellow: 'أصفر',
      latest: 'لديك آخر إصدار.', noConn: 'تعذّر الاتصال.', hasUpd: 'يوجد تحديث.',
      onlyPpt: 'هذه الأداة تعمل داخل PowerPoint فقط.', needNew: 'حدّث برنامج PowerPoint لاستخدام الأداة.',
      aboutDark: '<p>تحوّل أوراق العمل إلى شرائح داكنة للعرض على الطلاب: شريحة لكل جزء بين فاصلين.</p><p>قبل التحويل: أضف الفواصل بنفسك، وحوّل مقاس الشرائح إلى 16:9.</p>',
      aboutCover: '<p>تُدرج شريحة الغلاف من قالب فيديو علا: اختر نوع الفيديو والشكل، واكتب العنوان، ثم حدد مكان الإدراج.</p>',
      aboutHtml: '<p>تحوّل أوراق العمل إلى شرائح داكنة للعرض على الطلاب: شريحة لكل جزء بين فاصلين، وتُدرج شريحة العنوان من قالب فيديو علا.</p><p>قبل التحويل: أضف الفواصل بنفسك، وحوّل مقاس الشرائح إلى 16:9.</p>'
        + '<ul><li>خلفية داكنة ونص أبيض، والأزرق يصير أصفر</li><li>خط UULA Sans Medium بحجم 36 والعناوين 48</li><li>حذف رقم الصفحة ورمز QR والبطاقات الفاتحة</li><li>تصغير الخط تلقائيًا عند الامتلاء</li></ul>'
    },
    en: {
      dir: 'ltr', langBtn: 'ع', langName: 'العربية',
      update: 'New update', menu: 'Menu', chkUpd: 'Check for updates', about: 'About', close: 'Close',
      tabDark: 'Dark conversion', tabTitle: 'Title slide',
      stepsLabel: 'Before converting: two steps you do yourself', n1: '1', n2: '2',
      s1Title: 'Split the slides', s1Note: 'Suggest separators and review them, add one yourself, or select objects and press “Own part”. Only separators and parts added here count.',
      suggestSep: 'Suggest separators', addSep: 'Add separator', makePart: 'Own part', clearParts: 'Clear parts', s1Done: 'Slides split',
      suggesting: (k, n) => 'Checking slide ' + k + ' of ' + n + '…',
      suggested: (b, sl) => '✓ Added ' + b + (b === 1 ? ' separator' : ' separators') + ' on ' + cntEn(sl) + '. Review them before converting.',
      suggestedNone: 'No clear places for separators. Add them yourself or use “Own part”.',
      suggestSkip: n => ' Skipped ' + cntEn(n) + ' that already have separators or parts.',
      partNeedSel: 'Select objects on one slide first.', partDone: (p, k) => '✓ Part ' + p + ': ' + k + (k === 1 ? ' object' : ' objects') + '. Select the next part and press again.',
      partsCleared: n => '✓ Parts cleared on ' + cntEn(n) + '.',
      s2Title: 'Change the slide size to 16:9', s2Note: 'Design tab → Slide Size → Widescreen (16:9).', s2Done: 'Slide size changed',
      darkHead: 'Convert to dark mode', scopeSel: 'Selected slides', scopeAll: 'All slides', convert: 'Convert',
      lockBoth: 'Finish steps 1 and 2 first.', lockOne: k => 'Finish step ' + k + ' first.',
      settings: 'Settings', bgColor: 'Background color', textColor: 'Text color', accentColor: 'Blue becomes',
      imgChk: 'Turn large pictures white', fontNote: 'Font: UULA Sans Medium', reset: 'Restore defaults',
      tExplain: 'Lessons', tBetter: 'Better', tBank: 'Question bank', tPractice: 'Practice',
      tTitlePh: 'Video title', tSubPh: 'Subtitle (optional)', style: k => 'Style ' + k,
      posLabel: 'Insert at', posStart: 'Start of file', posBefore: 'Before selected', posAfter: 'After selected',
      tInsert: 'Insert title slide', tNeedSel: 'Select a slide to enable “Before” and “After”.',
      inserting: 'Inserting…', inserted: '✓ Title slide inserted.', insertFail: 'Could not insert: ', tplFail: 'Could not load the template',
      cnt: cntEn, sep: ', ',
      converting: (k, n) => 'Converting slide ' + k + ' of ' + n + '…',
      stRead: 'Reading the slide', stInsert: 'Inserting the slide', stLayout: 'Arranging the content', stDelete: 'Deleting the original',
      diagOk: ' — the original inserts fine; the problem is in the converted slide', diagBad: ' — even the original does not insert: ',
      resDone: (a, b) => '✓ ' + cntEn(a) + ' → ' + cntEn(b) + ' dark: ', resSmall: '• Font reduced: ', resOver: '• Too full, split by hand: ',
      resGray: '• Pictures lost their colors: ', resSkipped: n => '• Already converted: ' + cntEn(n), resTitles: n => 'Title slides left as they are: ' + cntEn(n),
      resFallback: '• Slide {n} converted without: ', fontNeeded: 'The UULA Sans Medium font must be installed.',
      doneMsg: 'Done.', noneMsg: 'No slide was converted.', selFirst: 'Select a slide first.', errPrefix: 'Error: ',
      skip: { layout: 'layout', images: 'picture colors', tables: 'tables', shapes: 'shapes', text: 'text' },
      dragSep: 'Drag the separator into place.', sepFail: 'Could not add the separator: ',
      brand: 'Study guide colors', others: 'More colors', moreColor: 'Other color…',
      cWhite: 'White', cBlack: 'Black', cBlue: 'Blue', cMagenta: 'Magenta', cYellow: 'Yellow',
      latest: 'You have the latest version.', noConn: 'Could not connect.', hasUpd: 'An update is available.',
      onlyPpt: 'This tool works inside PowerPoint only.', needNew: 'Update PowerPoint to use this tool.',
      aboutDark: '<p>Turns worksheets into dark slides for students: one slide per part between separators.</p><p>Before converting: add the separators yourself and change the slide size to 16:9.</p>',
      aboutCover: '<p>Inserts a title slide from the UULA video template: pick the video type and design, type the title, then choose where to insert it.</p>',
      aboutHtml: '<p>Turns worksheets into dark slides for students: one slide per part between separators, and inserts a title slide from the UULA video template.</p><p>Before converting: add the separators yourself and change the slide size to 16:9.</p>'
        + '<ul><li>Dark background, white text, blue becomes yellow</li><li>UULA Sans Medium, 36 pt text and 48 pt headings</li><li>Removes page numbers, QR codes and light cards</li><li>Shrinks the font automatically when a slide is too full</li></ul>'
    }
  };
  let lang = 'ar';
  try { lang = JSON.parse(localStorage.getItem('ud-lang')) || 'ar'; } catch (e) {}
  if (!D[lang]) lang = 'ar';
  const T = (k, ...a) => { const v = D[lang][k]; return typeof v === 'function' ? v(...a) : v; };
  function apply() {
    document.documentElement.lang = lang; document.documentElement.dir = D[lang].dir;
    document.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = T(e.dataset.i18n); });
    document.querySelectorAll('[data-i18n-ph]').forEach(e => { e.placeholder = T(e.dataset.i18nPh); });
    document.querySelectorAll('[data-i18n-dir]').forEach(e => { e.dir = D[lang].dir; });
    document.querySelectorAll('[data-i18n-title]').forEach(e => { e.title = T(e.dataset.i18nTitle); e.setAttribute('aria-label', e.title); });
  }
  function set(l) { lang = l; try { localStorage.setItem('ud-lang', JSON.stringify(l)); } catch (e) {} apply(); }
  return { T, apply, set, get lang() { return lang; } };
})();
const T = I18N.T;

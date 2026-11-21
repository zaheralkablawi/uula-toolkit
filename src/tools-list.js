// UULA Toolkit — the tools list (shared by the tools list page and the side rail inside every tool).
// To add a tool: one line here, and its loader in build.py (TOOLS).
var TK_C = '<circle cx="16" cy="16" r="12.5" fill="none" stroke="#1f71de" stroke-width="2.6"/>';
// ---- the tools list: to add a new tool, add one line here and put its page in tools/<id>/app.html ----
var TK_TOOLS = [
  { id: 'restyle', name: 'Design', hosts: ['ppt', 'word'],
    desc: { ppt: 'تحويل الشرائح لستايل علا وقوالب المذكرة', word: 'تمييز أجزاء المذكرة لنقلها إلى الباوربوينت', ppt_en: 'Convert slides to UULA style and booklet templates', word_en: 'Tag booklet parts to move them to PowerPoint' },
    icon: TK_C + '<rect x="10.5" y="9" width="11" height="14" rx="1.6" fill="#1f71de"/><path d="M13 12.5h6M13 15.5h6M13 18.5h3.5" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>' },
  { id: 'math', name: 'Arabic Math', hosts: ['ppt', 'word'],
    desc: { ppt: 'كتابة المعادلات العربية وإدراجها', ppt_en: 'Write and insert Arabic math equations' },
    icon: TK_C + '<path d="M23.5 16.5l-2.4 4.6-4.2-11.1H8.5" fill="none" stroke="#1f71de" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.6 13.2c-1-.9-3-.6-3 .8 0 1.2 1.5 1.7 2.9 1.3-2.2.4-3.8 1.6-3.5 3.2.3 1.4 2 1.9 3.8 1.4" fill="none" stroke="#1f71de" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>' },
  { id: 'graph', name: 'Graph', hosts: ['ppt', 'word'],
    desc: { ppt: 'رسم الدوال وإدراجها صورةً', ppt_en: 'Graph functions and insert them as images' },
    icon: TK_C + '<path d="M9 16h14M16 9v14" stroke="#9aa3b0" stroke-width="1.4"/><path d="M10.5 9.5c2 9 9 9 11 0" fill="none" stroke="#1f71de" stroke-width="2.4" stroke-linecap="round"/>' },
  { id: 'dark', name: 'Dark', hosts: ['ppt'],
    desc: { ppt: 'تقسيم أوراق العمل وتحويلها إلى الوضع الداكن', ppt_en: 'Split worksheets and convert them to dark mode' },
    icon: TK_C + '<path d="M16 3.5a12.5 12.5 0 0 1 0 25z" fill="#1f71de"/>' },
  { id: 'cover', name: 'PPT Video Template', hosts: ['ppt'],
    desc: { ppt: 'شريحة الغلاف والشرائح الداخلية من قالب فيديو علا', ppt_en: 'Cover and inner slides from the UULA video template' },
    icon: TK_C + '<rect x="8.6" y="11" width="14.8" height="10" rx="1.6" fill="#1f71de"/><path d="M12 15h8M13.5 18h5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>' }
];

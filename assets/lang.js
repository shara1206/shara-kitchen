// Language toggle — shared across all pages
(function () {
  const STORAGE_KEY = 'shara-notes-lang';
  const titles = {
    en: document.title,
    zh: document.documentElement.dataset.zhTitle || document.title
  };

  function applyLanguage(lang) {
    document.querySelectorAll('[data-en][data-zh]').forEach(el => {
      const text = el.getAttribute('data-' + lang);
      if (text !== null) el.innerHTML = text;
    });
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    if (titles[lang]) document.title = titles[lang];
    document.querySelectorAll('.lang-toggle button').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === lang);
    });
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  }

  document.querySelectorAll('.lang-toggle button').forEach(b => {
    b.addEventListener('click', () => applyLanguage(b.dataset.lang));
  });

  let saved = 'zh';
  try { saved = localStorage.getItem(STORAGE_KEY) || 'zh'; } catch (e) {}
  applyLanguage(saved);
})();

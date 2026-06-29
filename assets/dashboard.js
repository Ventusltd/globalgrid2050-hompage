(function () {
  const CATALOG_URL = './data/catalog.json';
  const menu = document.getElementById('menu');
  const searchInput = document.getElementById('gridSearch');

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  function normalise(s) {
    return String(s || '').toLowerCase().trim();
  }

  function searchKey(parts) {
    return normalise(parts.filter(Boolean).join(' '));
  }

  function rowHtml(row, areaName) {
    const name = row.name || '';
    const url = row.url || '#';
    const note = row.note ? ` <span class="dev-status">(${esc(row.note)})</span>` : '';
    const key = searchKey([areaName, name, row.note, row.tags && row.tags.join(' '), row.repo, row.status]);
    return `<li data-name="${esc(key)}"><a href="${encodeURI(url)}">${esc(name)}</a>${note}</li>`;
  }

  function build(catalog) {
    const areas = Array.isArray(catalog.areas) ? catalog.areas : [];
    let html = '';

    for (const area of areas) {
      const areaName = area.name || '';
      const children = Array.isArray(area.children) ? area.children : [];

      if (children.length) {
        const rows = children.map(row => rowHtml(row, areaName)).join('');
        const key = searchKey([areaName, area.tags && area.tags.join(' ')]);
        html += `<details class="area" data-name="${esc(key)}">` +
                `<summary>${esc(areaName)}</summary>` +
                `<ul class="drawer">${rows}</ul></details>`;
      } else if (area.url) {
        const key = searchKey([areaName, area.tags && area.tags.join(' '), area.repo, area.status]);
        html += `<a class="toplink" data-name="${esc(key)}" href="${encodeURI(area.url)}">${esc(areaName)}</a>`;
      }
    }

    html += `<p class="noresult" id="noresult" style="display:none">No match.</p>`;
    menu.innerHTML = html;
  }

  function applySearch(raw) {
    const q = normalise(raw);
    let anyVisible = false;

    document.querySelectorAll('.toplink').forEach(el => {
      const show = !q || el.dataset.name.includes(q);
      el.style.display = show ? '' : 'none';
      if (show) anyVisible = true;
    });

    document.querySelectorAll('details.area').forEach(d => {
      const areaMatch = !!q && d.dataset.name.includes(q);
      let childMatch = false;

      d.querySelectorAll('li').forEach(li => {
        const liMatch = li.dataset.name.includes(q);
        const show = !q || areaMatch || liMatch;
        li.style.display = show ? '' : 'none';
        if (q && liMatch) childMatch = true;
      });

      const visible = !q || areaMatch || childMatch;
      d.style.display = visible ? '' : 'none';
      d.open = q ? visible : false;
      if (visible) anyVisible = true;
    });

    const noresult = document.getElementById('noresult');
    if (noresult) noresult.style.display = anyVisible ? 'none' : '';
  }

  async function init() {
    try {
      const response = await fetch(CATALOG_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const catalog = await response.json();
      build(catalog);
      searchInput.addEventListener('input', e => applySearch(e.target.value));
    } catch (err) {
      menu.innerHTML = `<p class="noresult">Menu failed to load.</p>`;
      console.error('GlobalGrid2050 dashboard catalog load failed:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

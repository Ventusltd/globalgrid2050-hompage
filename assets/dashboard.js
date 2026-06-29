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

  function flatten(catalog) {
    const areas = Array.isArray(catalog.areas) ? catalog.areas : [];
    const rows = [];

    for (const area of areas) {
      const areaName = area.name || '';
      const children = Array.isArray(area.children) ? area.children : [];

      if (children.length) {
        for (const child of children) {
          rows.push({
            name: `${areaName} - ${child.name || ''}`,
            url: child.url || '#',
            note: child.note || '',
            key: searchKey([areaName, child.name, child.note, area.tags && area.tags.join(' '), child.tags && child.tags.join(' '), child.repo, child.status])
          });
        }
      } else if (area.url) {
        rows.push({
          name: areaName,
          url: area.url,
          note: area.note || '',
          key: searchKey([areaName, area.note, area.tags && area.tags.join(' '), area.repo, area.status])
        });
      }
    }

    return rows.sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));
  }

  function build(catalog) {
    const rows = flatten(catalog);

    if (!rows.length) {
      menu.innerHTML = `<p class="noresult">No launch-ready pages added yet. Working board is below the red line.</p>`;
      return;
    }

    menu.innerHTML = rows.map(row => {
      const note = row.note ? ` <span class="dev-status">(${esc(row.note)})</span>` : '';
      return `<a class="toplink" data-name="${esc(row.key)}" href="${encodeURI(row.url)}">${esc(row.name)}</a>${note}`;
    }).join('') + `<p class="noresult" id="noresult" style="display:none">No match.</p>`;
  }

  function applySearch(raw) {
    const q = normalise(raw);
    let anyVisible = false;

    document.querySelectorAll('.toplink').forEach(el => {
      const show = !q || el.dataset.name.includes(q);
      el.style.display = show ? '' : 'none';
      const note = el.nextElementSibling && el.nextElementSibling.classList.contains('dev-status') ? el.nextElementSibling : null;
      if (note) note.style.display = show ? '' : 'none';
      if (show) anyVisible = true;
    });

    const noresult = document.getElementById('noresult');
    if (noresult) noresult.style.display = anyVisible ? 'none' : '';
  }

  function itemId(row) {
    return row && row.dataset ? row.dataset.sessionItem : '';
  }

  function initChecklist() {
    document.querySelectorAll('.task-check').forEach(box => {
      const id = box.dataset.sessionItem;
      const key = `gg2050-check-${id}`;
      box.checked = sessionStorage.getItem(key) === 'checked';
      box.addEventListener('change', () => {
        if (box.checked) {
          sessionStorage.setItem(key, 'checked');
        } else {
          sessionStorage.removeItem(key);
        }
      });
    });
  }

  function rowPriority(row) {
    const input = row.querySelector('.priority-input');
    const value = input ? parseInt(input.value, 10) : 9999;
    return Number.isFinite(value) ? value : 9999;
  }

  function sortPriorityRows() {
    const list = document.getElementById('priorityChecklist');
    if (!list) return;
    const rows = Array.from(list.querySelectorAll('.priority-row'));
    rows.sort((a, b) => rowPriority(a) - rowPriority(b) || itemId(a).localeCompare(itemId(b)));
    rows.forEach(row => list.appendChild(row));
  }

  function initPriorityRows() {
    document.querySelectorAll('.priority-row').forEach(row => {
      const id = itemId(row);
      const input = row.querySelector('.priority-input');
      if (!id || !input) return;
      const key = `gg2050-priority-${id}`;
      const saved = sessionStorage.getItem(key);
      if (saved !== null) input.value = saved;
      input.addEventListener('input', () => sessionStorage.setItem(key, input.value));
    });

    const button = document.getElementById('sortChecklist');
    if (button) button.addEventListener('click', sortPriorityRows);
    sortPriorityRows();
  }

  function initSessionNotes() {
    const box = document.getElementById('sessionNotes');
    if (!box) return;
    const key = 'gg2050-session-notes';
    const saved = sessionStorage.getItem(key);
    if (saved !== null) box.value = saved;
    box.addEventListener('input', () => sessionStorage.setItem(key, box.value));
  }

  async function init() {
    initChecklist();
    initPriorityRows();
    initSessionNotes();

    try {
      const response = await fetch(CATALOG_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const catalog = await response.json();
      build(catalog);
      searchInput.addEventListener('input', e => applySearch(e.target.value));
    } catch (err) {
      menu.innerHTML = `<p class="noresult">Launch-ready page index failed to load.</p>`;
      console.error('GlobalGrid2050 dashboard catalog load failed:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

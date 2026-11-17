import './modalTableEnhancer.css';

/** Pagination and narrow-layout labels for tables rendered inside dialogs. */
export function enhanceModalTables(root: HTMLElement): () => void {
  const pageSize = 8;
  const pages = new WeakMap<HTMLTableElement, { page: number; pager: HTMLDivElement; first: Element | null; last: Element | null; count: number }>();

  const render = (table: HTMLTableElement) => {
    const rows = Array.from(table.tBodies[0]?.rows ?? []);
    const headers = Array.from(table.tHead?.rows[0]?.cells ?? []).map((cell) => cell.textContent?.trim() || 'Détail');
    if (!rows.length || !headers.length) return;
    table.classList.add('mq-modal-table');
    const canUseCards = headers.length > 4 && rows.every((row) => row.cells.length === headers.length && Array.from(row.cells).every((cell) => cell.colSpan === 1));
    table.classList.toggle('mq-modal-cards', canUseCards);
    rows.forEach((row) => Array.from(row.cells).forEach((cell, index) => { cell.dataset.label = headers[index] ?? 'Détail'; }));

    // The SIM detail window already has a dedicated pager tied to its data filtering.
    if (table.closest('#mlist') || rows.length <= pageSize) return;
    let state = pages.get(table);
    if (!state) {
      const pager = document.createElement('div');
      pager.className = 'mq-modal-pager';
      pager.setAttribute('aria-label', 'Pagination du tableau');
      table.insertAdjacentElement('afterend', pager);
      state = { page: 0, pager, first: null, last: null, count: 0 };
      pages.set(table, state);
    }
    if (state.first !== rows[0] || state.last !== rows[rows.length - 1] || state.count !== rows.length) state.page = 0;
    state.first = rows[0];
    state.last = rows[rows.length - 1];
    state.count = rows.length;
    const currentState = state;
    const pageCount = Math.ceil(rows.length / pageSize);
    state.page = Math.min(state.page, pageCount - 1);
    rows.forEach((row, index) => { row.hidden = Math.floor(index / pageSize) !== currentState.page; });
    state.pager.replaceChildren();
    const count = document.createElement('span');
    count.textContent = `${state.page * pageSize + 1}–${Math.min(rows.length, (state.page + 1) * pageSize)} sur ${rows.length}`;
    state.pager.append(count);
    const controls = document.createElement('div');
    controls.className = 'mq-modal-pager-controls';
    const button = (label: string, page: number, disabled = false, current = false) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.textContent = label;
      el.disabled = disabled;
      el.setAttribute('aria-label', label === '‹' ? 'Page précédente' : label === '›' ? 'Page suivante' : `Page ${label}`);
      if (current) el.setAttribute('aria-current', 'page');
      el.onclick = () => { currentState.page = page; render(table); };
      controls.append(el);
    };
    button('‹', state.page - 1, state.page === 0);
    for (let index = 0; index < pageCount; index++) {
      if (pageCount > 7 && index !== 0 && index !== pageCount - 1 && Math.abs(index - state.page) > 1) continue;
      button(String(index + 1), index, false, index === state.page);
    }
    button('›', state.page + 1, state.page === pageCount - 1);
    state.pager.append(controls);
  };

  let scheduled = false;
  const scan = () => {
    scheduled = false;
    root.querySelectorAll<HTMLTableElement>(root.matches('[role="dialog"]') ? 'table' : '[role="dialog"] table').forEach(render);
  };
  const observer = new MutationObserver((mutations) => {
    if (mutations.every((mutation) => (mutation.target as Element).closest?.('.mq-modal-pager') || Array.from(mutation.addedNodes).every((node) => node instanceof Element && node.classList.contains('mq-modal-pager')))) return;
    if (!scheduled) { scheduled = true; queueMicrotask(scan); }
  });
  observer.observe(root, { childList: true, subtree: true });
  scan();
  return () => observer.disconnect();
}

/**
 * Left-side molecule library (TSK-UI-005): collapsible panel with a search bar, a category
 * dropdown and a result list. Click a molecule to place it in the sandbox, or drag it to a spot.
 */
import { categoriesOf, loadBiomolecules, searchBiomolecules, type Biomolecule } from '../chemistry/biomolecules/library';

export interface LibraryPanelCallbacks {
  onPlace(m: Biomolecule, clientX?: number, clientY?: number): void;
}

const DRAG_THRESHOLD_PX = 5;
const RENDER_LIMIT = 300;
const SUPERSCRIPT: Record<string, string> = { '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻' };

export function formulaHtml(formula: string, charge: number): string {
  const q = charge === 0 ? '' : `${Math.abs(charge) > 1 ? Math.abs(charge) : ''}${charge > 0 ? '+' : '-'}`;
  return formula.replace(/(\d+)/g, '<sub>$1</sub>') + q.replace(/./g, (c) => SUPERSCRIPT[c] ?? c);
}

export function initLibraryPanel(root: HTMLElement, cb: LibraryPanelCallbacks): void {
  root.innerHTML = `
    <div class="lib-head">
      <button type="button" class="lib-collapse" aria-expanded="true" title="Show/hide the library">
        <span class="lib-caret">▾</span> Molecule library <span class="lib-count"></span>
      </button>
    </div>
    <div class="lib-body">
      <input type="search" class="lib-search" placeholder="Search: glucose, vitamin C, C6H12O6…" aria-label="Search molecules" />
      <select class="lib-category" aria-label="Category"></select>
      <div class="lib-status">Loading library…</div>
      <ul class="lib-list" role="listbox"></ul>
    </div>`;
  const collapse = root.querySelector<HTMLButtonElement>('.lib-collapse')!;
  const search = root.querySelector<HTMLInputElement>('.lib-search')!;
  const select = root.querySelector<HTMLSelectElement>('.lib-category')!;
  const status = root.querySelector<HTMLDivElement>('.lib-status')!;
  const listEl = root.querySelector<HTMLUListElement>('.lib-list')!;
  const countEl = root.querySelector<HTMLSpanElement>('.lib-count')!;

  const setCollapsed = (c: boolean) => {
    root.classList.toggle('collapsed', c);
    collapse.setAttribute('aria-expanded', String(!c));
    try {
      localStorage.setItem('atomica-library-collapsed', c ? '1' : '0');
    } catch {
      /* storage unavailable */
    }
  };
  collapse.addEventListener('click', () => setCollapsed(!root.classList.contains('collapsed')));
  try {
    if (localStorage.getItem('atomica-library-collapsed') === '1') setCollapsed(true);
  } catch {
    /* storage unavailable */
  }

  let all: Biomolecule[] = [];
  const render = () => {
    const cat = select.value || undefined;
    const hits = searchBiomolecules(all, search.value, cat);
    status.textContent =
      hits.length === 0
        ? 'No matches — try another name, a synonym or a formula.'
        : hits.length > RENDER_LIMIT
          ? `Showing ${RENDER_LIMIT} of ${hits.length} — type to narrow down`
          : `${hits.length} molecule${hits.length > 1 ? 's' : ''}`;
    listEl.replaceChildren(
      ...hits.slice(0, RENDER_LIMIT).map((m) => {
        const li = document.createElement('li');
        li.className = 'lib-item';
        li.setAttribute('role', 'option');
        li.title = [
          m.name,
          m.synonyms.length ? `Also: ${m.synonyms.join(', ')}` : '',
          `${m.atomCount} atoms · PubChem CID ${m.cid}`,
          'Click to add · drag to place',
        ]
          .filter(Boolean)
          .join('\n');
        const name = document.createElement('div');
        name.className = 'lib-name';
        name.textContent = m.name;
        const meta = document.createElement('div');
        meta.className = 'lib-meta';
        meta.innerHTML = `<span class="lib-formula">${formulaHtml(m.formula, m.charge)}</span>${cat ? '' : `<span class="lib-cat">${escapeHtml(m.category)}</span>`}`;
        li.append(name, meta);
        li.addEventListener('pointerdown', (ev) => startDrag(ev, m, cb));
        return li;
      }),
    );
    listEl.scrollTop = 0;
  };

  search.addEventListener('input', render);
  select.addEventListener('change', render);
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const first = searchBiomolecules(all, search.value, select.value || undefined)[0];
      if (first) cb.onPlace(first);
    }
    e.stopPropagation(); // keep Delete/Backspace from deleting sandbox atoms while typing
  });

  loadBiomolecules()
    .then((list) => {
      all = list;
      countEl.textContent = `(${list.length})`;
      const counts = new Map<string, number>();
      for (const m of list) counts.set(m.category, (counts.get(m.category) ?? 0) + 1);
      select.replaceChildren(
        new Option(`All categories (${list.length})`, ''),
        ...categoriesOf(list).map((c) => new Option(`${c} (${counts.get(c)})`, c)),
      );
      render();
    })
    .catch((err) => {
      status.textContent = `Could not load the library: ${err}`;
    });
}

function startDrag(ev: PointerEvent, m: Biomolecule, cb: LibraryPanelCallbacks): void {
  if (ev.button !== 0) return;
  ev.preventDefault();
  const sx = ev.clientX;
  const sy = ev.clientY;
  let ghost: HTMLDivElement | null = null;
  const move = (e: PointerEvent) => {
    if (!ghost && Math.hypot(e.clientX - sx, e.clientY - sy) > DRAG_THRESHOLD_PX) {
      ghost = document.createElement('div');
      ghost.className = 'drag-ghost molecule-ghost';
      ghost.textContent = m.name;
      document.body.appendChild(ghost);
      document.body.style.cursor = 'grabbing';
    }
    if (ghost) {
      ghost.style.left = `${e.clientX}px`;
      ghost.style.top = `${e.clientY}px`;
    }
  };
  const end = (e: PointerEvent | null) => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', cancel);
    document.body.style.cursor = '';
    if (!e) {
      ghost?.remove();
      return;
    }
    if (ghost) {
      ghost.remove();
      cb.onPlace(m, e.clientX, e.clientY);
    } else {
      cb.onPlace(m);
    }
  };
  const up = (e: PointerEvent) => end(e);
  const cancel = () => end(null);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', cancel);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

/** ATOMICA 2D molecule sandbox entry point — Tasks TSK-UI-001, TSK-UI-004. */

import './styles.css';
import { MoleculeModel, type BuildMode } from './sandbox/MoleculeModel';
import { renderPeriodicTable, describeElement } from './ui/PeriodicTable';
import { SandboxView } from './ui/SandboxView';
import { initThemeToggle } from './ui/theme';
import { getElement } from './chemistry/elements';

const $ = <T extends Element>(sel: string) => document.querySelector(sel) as T;

function load(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function save(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

const model = new MoleculeModel();
const toastEl = $<HTMLDivElement>('#toast');
let toastTimer: number | undefined;
function notify(msg: string): void {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove('show'), 2600);
}

const view = new SandboxView($<SVGSVGElement>('#sandbox'), model, notify);
const info = $<HTMLDivElement>('#element-info');
const defaultInfo = info.textContent ?? '';

renderPeriodicTable($<HTMLElement>('#periodic-table'), {
  onDrop: (symbol, x, y) => view.dropElement(symbol, x, y),
  onClick: (symbol) => view.clickElement(symbol),
  onHover: (e) => {
    info.textContent = e ? describeElement(e) : defaultInfo;
  },
});

initThemeToggle($<HTMLButtonElement>('#theme-btn'));
$<HTMLButtonElement>('#clear-btn').addEventListener('click', () => model.clear());

// ---------- Easy / Hard ----------
const modeButtons = [...document.querySelectorAll<HTMLButtonElement>('#mode-seg button')];
function applyMode(mode: BuildMode): void {
  model.setMode(mode);
  save('atomica-mode', mode);
  for (const b of modeButtons) b.classList.toggle('active', b.dataset.mode === mode);
}
for (const b of modeButtons) b.addEventListener('click', () => applyMode(b.dataset.mode as BuildMode));
applyMode(load('atomica-mode') === 'hard' ? 'hard' : 'easy');

// ---------- Geometry grid ----------
const geoToggle = $<HTMLInputElement>('#geo-toggle');
geoToggle.checked = load('atomica-geometry') === '1';
view.setGeometry(geoToggle.checked);
geoToggle.addEventListener('change', () => {
  save('atomica-geometry', geoToggle.checked ? '1' : '0');
  view.setGeometry(geoToggle.checked);
  renderFragments();
});

// ---------- Molecules panel ----------
const SUPERSCRIPT: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻' };
const chargeText = (c: number) => (c === 0 ? '' : `${Math.abs(c) > 1 ? Math.abs(c) : ''}${c > 0 ? '+' : '-'}`.replace(/./g, (ch) => SUPERSCRIPT[ch]));

const fragmentsEl = $<HTMLUListElement>('#fragments');
function renderFragments(): void {
  const frags = model.fragments();
  if (frags.length === 0) {
    fragmentsEl.innerHTML = '<li class="empty">Empty — drag an element in.</li>';
    return;
  }
  const issues = model.mode === 'hard' ? model.bondOrderIssues() : new Set<number>();
  fragmentsEl.replaceChildren(
    ...frags.map((f) => {
      const li = document.createElement('li');
      const ids = new Set(f.atomIds);
      const charge = f.match?.charge ?? 0;
      const name =
        f.atomIds.length === 1 ? getElement(model.getAtom(f.atomIds[0]).symbol).name : f.match?.name ?? 'Unnamed structure';

      const nameEl = document.createElement('div');
      nameEl.className = 'name';
      nameEl.textContent = name + (charge ? ' ion' : '');
      const formulaEl = document.createElement('div');
      formulaEl.className = 'formula';
      formulaEl.innerHTML = f.formula.replace(/(\d+)/g, '<sub>$1</sub>') + chargeText(charge);
      li.append(nameEl, formulaEl);

      const open = f.atomIds.filter((id) => model.valenceStatus(id) === 'open').length;
      const wrong = model.getBonds().filter((b) => ids.has(b.a) && issues.has(b.id)).length;
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent =
        `${f.molecularWeight.toFixed(3)} g/mol · ${f.atomIds.length} atom${f.atomIds.length > 1 ? 's' : ''}` +
        (charge ? ' · charge from unfilled valences' : open ? ` · ${open} with open valence` : ' · valences satisfied');
      li.append(meta);
      if (wrong) {
        const w = document.createElement('div');
        w.className = 'meta red-text';
        w.textContent = `${wrong} bond${wrong > 1 ? 's' : ''} need${wrong > 1 ? '' : 's'} a different order`;
        li.append(w);
      }
      if (f.match?.isomers.length) {
        const iso = document.createElement('div');
        iso.className = 'meta isomers';
        const shown = f.match.isomers.slice(0, 4);
        iso.textContent = `Same formula: ${shown.join(', ')}${f.match.isomers.length > shown.length ? '…' : ''}`;
        li.append(iso);
      }
      if (view.geometryEnabled) {
        const shapes = f.atomIds
          .map((id) => ({ id, g: view.geometryOf(id) }))
          .filter((x) => x.g?.shape)
          .slice(0, 6);
        for (const { id, g } of shapes) {
          const s = document.createElement('div');
          s.className = 'meta shape';
          s.textContent = `${model.getAtom(id).symbol}: ${g!.shape}${g!.angleLabel ? ` (${g!.angleLabel})` : ''}${g!.lonePairs ? `, ${g!.lonePairs} lone pair${g!.lonePairs > 1 ? 's' : ''}` : ''}`;
          li.append(s);
        }
      }
      return li;
    }),
  );
}
model.subscribe(renderFragments);
renderFragments();

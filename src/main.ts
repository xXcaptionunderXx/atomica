/** ATOMICA 2D molecule sandbox entry point — Task TSK-UI-001. */

import './styles.css';
import { MoleculeModel } from './sandbox/MoleculeModel';
import { renderPeriodicTable, describeElement } from './ui/PeriodicTable';
import { SandboxView } from './ui/SandboxView';
import { initThemeToggle } from './ui/theme';

const $ = <T extends Element>(sel: string) => document.querySelector(sel) as T;

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

const fragmentsEl = $<HTMLUListElement>('#fragments');
function renderFragments(): void {
  const frags = model.fragments();
  if (frags.length === 0) {
    fragmentsEl.innerHTML = '<li class="empty">Empty — drag an element in.</li>';
    return;
  }
  fragmentsEl.replaceChildren(
    ...frags.map((f) => {
      const open = f.atomIds.filter((id) => model.valenceStatus(id) === 'open').length;
      const li = document.createElement('li');
      li.innerHTML = `<div class="formula"></div><div class="meta"></div>`;
      li.querySelector('.formula')!.innerHTML = f.formula.replace(/(\d+)/g, '<sub>$1</sub>');
      li.querySelector('.meta')!.textContent =
        `${f.molecularWeight.toFixed(3)} g/mol · ${f.atomIds.length} atom${f.atomIds.length > 1 ? 's' : ''}` +
        (open ? ` · ${open} with open valence` : ' · valences satisfied');
      return li;
    }),
  );
}
model.subscribe(renderFragments);
renderFragments();

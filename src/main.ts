/** ATOMICA sandbox entry point — Tasks TSK-UI-001, TSK-UI-004, TSK-UI-005, TSK-UI-006, TSK-UI-007 (layers). */

import './styles.css';
import { MoleculeModel, type BuildMode } from './sandbox/MoleculeModel';
import { renderPeriodicTable, describeElement } from './ui/PeriodicTable';
import { SandboxView } from './ui/SandboxView';
import { initThemeToggle } from './ui/theme';
import { getElement } from './chemistry/elements';
import { initLibraryPanel, initOrganelleLibrary } from './ui/LibraryPanel';
import { loadBiomolecules, toTemplate, type Biomolecule } from './chemistry/biomolecules/library';
import { OrganelleModel } from './organelle/OrganelleModel';
import { identify, identifyAll, indexLibrary, type LibraryIndex, type Species } from './organelle/identify';
import { OrganelleView } from './ui/OrganelleView';
import { initOrganellePanel } from './ui/OrganellePanel';
import { initLayerTabs, type Layer } from './ui/LayerTabs';
import { getClipboard } from './ui/clipboard';

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

initLibraryPanel($<HTMLElement>('#library'), {
  onPlace: (m, x, y) => view.placeMolecule(m, x, y),
});

initThemeToggle($<HTMLButtonElement>('#theme-btn'));
// Undo / Redo / Clear act on whichever layer is shown (each layer keeps its own history).
const organelle = new OrganelleModel();
let layer: Layer = 'atomic';
$<HTMLButtonElement>('#clear-btn').addEventListener('click', () => (layer === 'atomic' ? model.clear() : organelle.clear(true)));
const undoBtn = $<HTMLButtonElement>('#undo-btn');
const redoBtn = $<HTMLButtonElement>('#redo-btn');
undoBtn.addEventListener('click', () => (layer === 'atomic' ? view.undo() : organelle.undo() || notify('Nothing to undo')));
redoBtn.addEventListener('click', () => (layer === 'atomic' ? view.redo() : organelle.redo() || notify('Nothing to redo')));
const syncHistoryButtons = () => {
  const m = layer === 'atomic' ? model : organelle;
  undoBtn.disabled = !m.canUndo;
  redoBtn.disabled = !m.canRedo;
};
model.subscribe(syncHistoryButtons);
organelle.subscribe(syncHistoryButtons);
syncHistoryButtons();

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
const anglesToggle = $<HTMLInputElement>('#angles-toggle');
const anglesLabel = $<HTMLLabelElement>('#angles-label');
anglesToggle.checked = load('atomica-angles') !== '0';
view.setAngles(anglesToggle.checked);
const syncAnglesToggle = () => {
  // Angles are only drawn on the geometry grid.
  anglesToggle.disabled = !geoToggle.checked;
  anglesLabel.classList.toggle('disabled', !geoToggle.checked);
};
syncAnglesToggle();
anglesToggle.addEventListener('change', () => {
  save('atomica-angles', anglesToggle.checked ? '1' : '0');
  view.setAngles(anglesToggle.checked);
});
geoToggle.addEventListener('change', () => {
  save('atomica-geometry', geoToggle.checked ? '1' : '0');
  view.setGeometry(geoToggle.checked);
  syncAnglesToggle();
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
      const charge = f.match ? f.match.charge : f.atomIds.length === 1 ? f.impliedCharge : 0; // lone library ions keep their charge
      const name =
        f.match?.name ?? (f.atomIds.length === 1 ? getElement(model.getAtom(f.atomIds[0]).symbol).name : 'Unnamed structure');

      const nameEl = document.createElement('div');
      nameEl.className = 'name';
      nameEl.textContent = name + (charge && !/(\bion|\))$/i.test(name) ? ' ion' : '');
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
        (open ? ` · ${open} with open valence` : charge ? ' · charged' : ' · valences satisfied');
      li.append(meta);
      if (f.partOf) {
        const part = document.createElement('div');
        part.className = 'meta';
        part.textContent = `Ion/part of ${f.partOf} (PubChem draws it as separate pieces)`;
        li.append(part);
      }
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

// ---------- Organelle layer (TSK-UI-007) ----------
let libIndex: LibraryIndex | null = null;
const libReady = loadBiomolecules().then((list) => (libIndex = indexLibrary(list)));

const libSpecies = (m: Biomolecule): Species => identify({ ...toTemplate(m, 0, 0, 40), name: m.name }, libIndex!);

function whereLabel(where: string): string {
  const bp = organelle.blueprint;
  const [kind, id] = where.split(':');
  if (kind === 'membrane') return bp?.membranes.find((m) => m.id === id)?.name ?? 'membrane';
  if (kind === 'slot') return bp?.slots.find((m) => m.id === id)?.name ?? 'contents';
  return 'surroundings';
}

let clipDesc: { t: unknown; species: Species[] } | null = null;
function clipboardSpecies(): Species[] {
  const c = getClipboard();
  if (!c || !libIndex) return [];
  if (clipDesc?.t !== c.template) clipDesc = { t: c.template, species: identifyAll(c.template, libIndex) };
  return clipDesc.species;
}

const ROLE_WORD: Record<string, string> = {
  'bilayer-lipid': 'bilayer lipid',
  sterol: 'sterol',
  'neutral-lipid': 'neutral lipid',
  'single-chain-lipid': 'single-chain lipid',
  molecule: 'molecule',
};

function pasteIntoOrganelle(copies: number | 'fill'): void {
  if (!libIndex) {
    notify('Molecule library still loading…');
    return;
  }
  const list = clipboardSpecies();
  if (list.length === 0) {
    notify('Clipboard is empty — copy molecules in the Atomic layer first (Ctrl+C)');
    return;
  }
  const placed = [];
  if (copies === 'fill') {
    for (const sp of list) placed.push(...organelle.addSpecies([sp], Math.max(1, organelle.roomFor(sp.key, sp.role))));
  } else {
    placed.push(...organelle.addSpecies(list, copies));
  }
  const tally = new Map<string, number>();
  for (const p of placed) {
    const k = `${p.key.replace(/ \(.*\)$/, '')} → ${whereLabel(p.where)}`;
    tally.set(k, (tally.get(k) ?? 0) + 1);
  }
  notify([...tally].map(([k, n]) => `${n}× ${k}`).join(' · '));
}

/** Inspect: bring structures back to the atomic layer (added beside what is there). */
function inspect(keys: string[]): void {
  if (!libIndex) return;
  const templates = keys
    .map((k) => {
      const m = libIndex!.byName.get(k);
      return m ? toTemplate(m, 0, 0, 64) : organelle.customTemplate(k);
    })
    .filter((t): t is NonNullable<typeof t> => !!t);
  if (templates.length === 0) {
    notify('No atomic structure stored for that');
    return;
  }
  setLayer('atomic');
  requestAnimationFrame(() => {
    view.placeTemplates(templates);
    notify(`Inspecting ${keys.length === 1 ? keys[0] : `${keys.length} molecule species`} in the Atomic layer`);
  });
}

const organelleView = new OrganelleView($<SVGSVGElement>('#organelle-view'), organelle, {
  onInspectSpecies: (k) => inspect([k]),
  onProtein: (id) => organellePanel.showProtein(id),
  notify,
});
const organellePanel = initOrganellePanel($<HTMLElement>('#organelle-panel'), organelle, {
  paste: pasteIntoOrganelle,
  describeClipboard: () => {
    const c = getClipboard();
    if (!c) return null;
    const list = clipboardSpecies();
    if (!list.length) return `${c.template.symbols.length} atoms (library loading…)`;
    const seen = new Map<string, Species>();
    for (const sp of list) seen.set(sp.key, sp);
    return [...seen.values()].map((sp) => `${sp.key} (${ROLE_WORD[sp.role]})`).join(', ');
  },
  addLibrary: (name, copies, target) => {
    const m = libIndex?.byName.get(name);
    if (m) organelle.addSpecies([libSpecies(m)], copies, target);
  },
  inspectSpecies: (k) => inspect([k]),
  inspectOrganelle: () => {
    const keys = organelle.builtSpecies();
    if (keys.length === 0) {
      notify(organelle.blueprint ? 'Nothing built from molecules yet — paste lipids or add cofactors first' : 'No organelle to inspect');
      return;
    }
    inspect(keys.slice(0, 16));
  },
  notify,
});
initOrganelleLibrary($<HTMLElement>('#organelle-library'), {
  onBlueprint: (id) => {
    const prev = organelle.blueprint;
    if (prev?.id === id) {
      notify(`${prev.name} is already being built`);
      return;
    }
    organelle.setBlueprint(id);
    notify(prev ? `Replaced the ${prev.name.toLowerCase()} with a ${organelle.blueprint!.name.toLowerCase()} (Ctrl+Z undoes)` : `Started a ${organelle.blueprint!.name.toLowerCase()}`);
  },
  onMolecule: (m) => {
    void libReady.then(() => {
      organelle.addSpecies([libSpecies(m)], 1, 'pool');
      notify(`${m.name} added to the surroundings`);
    });
  },
});

// ---------- Layer switching ----------
const brandSub = $<HTMLSpanElement>('#brand-sub');
const setTabs = initLayerTabs($<HTMLElement>('#layer-tabs'), (l) => setLayer(l));
function setLayer(next: Layer): void {
  layer = next;
  document.body.dataset.layer = next;
  view.active = next === 'atomic';
  brandSub.textContent = next === 'atomic' ? '2D Molecule Sandbox' : 'Organelle layer';
  info.textContent = next === 'atomic' ? defaultInfo : 'One organelle at a time · paste lipids from the Atomic layer with Ctrl+V';
  if (next !== 'organelle') organellePanel.pause();
  else requestAnimationFrame(() => organelleView.fit());
  setTabs(next);
  syncHistoryButtons();
  save('atomica-layer', next);
}
setLayer(load('atomica-layer') === 'organelle' ? 'organelle' : 'atomic');

const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));
window.addEventListener('keydown', (e) => {
  if (layer !== 'organelle' || typing(e.target)) return;
  const mod = e.ctrlKey || e.metaKey;
  const key = e.key.toLowerCase();
  if (mod && key === 'z') {
    e.preventDefault();
    if (!(e.shiftKey ? organelle.redo() : organelle.undo())) notify(e.shiftKey ? 'Nothing to redo' : 'Nothing to undo');
  } else if (mod && key === 'y') {
    e.preventDefault();
    if (!organelle.redo()) notify('Nothing to redo');
  } else if (mod && key === 'v') {
    e.preventDefault();
    pasteIntoOrganelle(1);
  } else if (!mod && key === 'f') {
    organelleView.fit();
  }
});

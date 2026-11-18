/**
 * 2D SVG sandbox view: renders a MoleculeModel and handles atom drag, selection,
 * click-to-bond, bond-order cycling and deletion. Tasks TSK-UI-001, TSK-UI-004.
 *
 * Geometry mode: each molecule is laid out with VSEPR geometry (sandbox/Geometry.ts),
 * a background grid is shown, and bond angles, wedges/dashes and lone pairs are drawn.
 * Dragging any atom then moves the whole molecule rigidly.
 *
 * Navigation & editing (TSK-UI-006): atoms live in world coordinates; the view keeps a pan/zoom
 * transform (left-drag on empty space pans, wheel zooms at the cursor, only inside the sandbox).
 * Multi-selection via Shift-drag box or Ctrl-click; selections move, copy/cut/paste and delete
 * together; Ctrl+Z / Ctrl+Shift+Z undo and redo through MoleculeModel's history.
 */

import { getElement } from '../chemistry/elements';
import { MoleculeModel, type MoleculeTemplate, type SandboxAtom, type SandboxBond } from '../sandbox/MoleculeModel';
import { layoutFragment, type AtomGeometry, type BondStyle } from '../sandbox/Geometry';
import { atomFill, textColorFor } from './colors';
import { toTemplate, type Biomolecule } from '../chemistry/biomolecules/library';
import { getClipboard, setClipboard } from './clipboard';

const SVG_NS = 'http://www.w3.org/2000/svg';
const ATOM_R = 18;
const H_R = 13;
const BOND_LENGTH = 64;
const DRAG_THRESHOLD_PX = 4;

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 6;

const radiusOf = (symbol: string) => (symbol === 'H' ? H_R : ATOM_R);

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));

export class SandboxView {
  /** Selected atoms (multi-select) and/or a single selected bond. */
  private selected = new Set<number>();
  private selectedBond: number | null = null;
  /** World → screen: screen = world * k + (tx, ty). */
  private view = { tx: 0, ty: 0, k: 1 };
  private root: SVGGElement | null = null;
  private gridPattern: SVGElement | null = null;
  private marquee: SVGElement | null = null;
  private pointer: { x: number; y: number } | null = null; // last pointer, world coords
  private zoomLabel: HTMLButtonElement | null = null;
  private anglesOn = true;
  private geometryOn = false;
  private layoutVersion = -1;
  private geometry = new Map<number, AtomGeometry>();
  private bondStyles = new Map<number, BondStyle>();
  private layoutKeys = new Set<string>();
  /** False while another layer is shown: keyboard shortcuts then belong to that layer. */
  active = true;

  constructor(
    private readonly svg: SVGSVGElement,
    private readonly model: MoleculeModel,
    private readonly notify: (msg: string) => void,
  ) {
    model.subscribe(() => this.onModelChange());
    svg.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    svg.addEventListener('contextmenu', (e) => this.onContextMenu(e));
    svg.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    svg.addEventListener('pointermove', (e) => (this.pointer = this.toLocal(e.clientX, e.clientY)));
    svg.addEventListener('pointerleave', () => (this.pointer = null));
    window.addEventListener('keydown', (e) => this.onKey(e));
    this.buildViewControls();
    this.render();
  }

  /** The one selected atom (for click-to-bond / attach), or null when 0 or several are selected. */
  get selectedAtomId(): number | null {
    return this.selected.size === 1 ? [...this.selected][0] : null;
  }

  get selectedAtomIds(): number[] {
    return [...this.selected];
  }

  // ---------- view transform (pan / zoom) ----------
  private buildViewControls(): void {
    const host = this.svg.parentElement;
    if (!host) return;
    const bar = document.createElement('div');
    bar.className = 'view-controls';
    const btn = (label: string, title: string, fn: () => void) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.title = title;
      b.addEventListener('click', fn);
      bar.append(b);
      return b;
    };
    btn('\u2212', 'Zoom out', () => this.zoomAtCenter(1 / 1.25));
    this.zoomLabel = btn('100%', 'Reset zoom to 100%', () => this.setZoom(1));
    btn('+', 'Zoom in', () => this.zoomAtCenter(1.25));
    btn('Fit', 'Fit all molecules in view (F)', () => this.fitView());
    host.append(bar);
  }

  private applyView(): void {
    const { tx, ty, k } = this.view;
    const t = `translate(${tx},${ty}) scale(${k})`;
    this.root?.setAttribute('transform', t);
    this.gridPattern?.setAttribute('patternTransform', t);
    if (this.zoomLabel) this.zoomLabel.textContent = `${Math.round(k * 100)}%`;
  }

  /** Zoom by `factor` keeping the screen point (sx, sy) (relative to the sandbox) fixed. */
  private zoomAround(sx: number, sy: number, factor: number): void {
    const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, this.view.k * factor));
    const wx = (sx - this.view.tx) / this.view.k;
    const wy = (sy - this.view.ty) / this.view.k;
    this.view = { k, tx: sx - wx * k, ty: sy - wy * k };
    this.applyView();
  }

  private zoomAtCenter(factor: number): void {
    const r = this.svg.getBoundingClientRect();
    this.zoomAround(r.width / 2, r.height / 2, factor);
  }

  setZoom(k: number): void {
    this.zoomAtCenter(k / this.view.k);
  }

  get zoom(): number {
    return this.view.k;
  }

  /** Frame every atom (or reset when empty). */
  fitView(): void {
    this.frame(this.model.getAtoms());
  }

  /**
   * Make sure the given atoms are on screen: if any are outside the view, zoom out (never in)
   * and centre on them. Used after placing a library molecule, whose geometry-grid layout can be
   * far larger than the space it was dropped into.
   */
  private ensureVisible(ids: number[]): void {
    const r = this.svg.getBoundingClientRect();
    if (r.width === 0 || ids.length === 0) return;
    const atoms = ids.filter((id) => this.model.hasAtom(id)).map((id) => this.model.getAtom(id));
    const { tx, ty, k } = this.view;
    const pad = 24;
    const inView = atoms.every((a) => {
      const sx = a.x * k + tx;
      const sy = a.y * k + ty;
      return sx >= pad && sx <= r.width - pad && sy >= pad && sy <= r.height - pad;
    });
    if (!inView) this.frame(atoms, k);
  }

  private frame(atoms: SandboxAtom[], maxZoom = 1.5): void {
    const r = this.svg.getBoundingClientRect();
    if (atoms.length === 0 || r.width === 0) {
      this.view = { tx: 0, ty: 0, k: 1 };
      this.applyView();
      return;
    }
    const pad = 40;
    const xs = atoms.map((a) => a.x);
    const ys = atoms.map((a) => a.y);
    const minX = Math.min(...xs) - pad;
    const maxX = Math.max(...xs) + pad;
    const minY = Math.min(...ys) - pad;
    const maxY = Math.max(...ys) + pad;
    const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(maxZoom, r.width / (maxX - minX), r.height / (maxY - minY))));
    this.view = { k, tx: r.width / 2 - ((minX + maxX) / 2) * k, ty: r.height / 2 - ((minY + maxY) / 2) * k };
    this.applyView();
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault(); // zoom the sandbox only; never scroll the page or side panels
    const r = this.svg.getBoundingClientRect();
    const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    this.zoomAround(e.clientX - r.left, e.clientY - r.top, Math.exp(-delta * 0.0015));
  }

  // ---------- undo / redo / clipboard ----------
  undo(): void {
    if (!this.model.undo()) this.notify('Nothing to undo');
    this.clearSelection();
  }

  redo(): void {
    if (!this.model.redo()) this.notify('Nothing to redo');
    this.clearSelection();
  }

  copySelection(): boolean {
    const t = this.model.extract(this.selected);
    if (!t) return false;
    setClipboard(t);
    this.notify(`Copied ${t.symbols.length} atom${t.symbols.length > 1 ? 's' : ''}`);
    return true;
  }

  cutSelection(): void {
    if (this.copySelection()) this.deleteSelection();
  }

  /** Paste at the pointer when it is over the sandbox, otherwise offset from the original. */
  paste(): void {
    const clipboard = getClipboard();
    if (!clipboard) {
      this.notify('Clipboard is empty — select atoms and press Ctrl+C');
      return;
    }
    const t = clipboard.template;
    const cx = t.positions.reduce((s, p) => s + p.x, 0) / t.positions.length;
    const cy = t.positions.reduce((s, p) => s + p.y, 0) / t.positions.length;
    clipboard.pastes++;
    const off = 40 * clipboard.pastes;
    const target = this.pointer ?? { x: cx + off, y: cy + off };
    const ids = this.model.addMolecule({
      ...t,
      positions: t.positions.map((p) => ({ x: p.x - cx + target.x, y: p.y - cy + target.y })),
    });
    this.selected = new Set(ids);
    this.selectedBond = null;
    this.render();
  }

  deleteSelection(): void {
    if (this.selected.size) this.model.removeAtoms(this.selected);
    else if (this.selectedBond !== null) this.model.removeBond(this.selectedBond);
    this.clearSelection();
  }

  selectAll(): void {
    this.selected = new Set(this.model.getAtoms().map((a) => a.id));
    this.selectedBond = null;
    this.render();
  }

  clearSelection(): void {
    this.selected.clear();
    this.selectedBond = null;
    this.render();
  }

  /** Show or hide the bond-angle arcs and degree labels drawn in geometry mode. */
  setAngles(on: boolean): void {
    this.anglesOn = on;
    this.render();
  }

  get geometryEnabled(): boolean {
    return this.geometryOn;
  }

  /** Per-atom VSEPR results from the last geometry layout (empty when geometry mode is off). */
  geometryOf(atomId: number): AtomGeometry | undefined {
    return this.geometryOn ? this.geometry.get(atomId) : undefined;
  }

  setGeometry(on: boolean): void {
    this.geometryOn = on;
    this.layoutVersion = -1;
    this.layoutKeys.clear();
    if (on) this.relayout();
    this.render();
  }

  private onModelChange(): void {
    if (this.geometryOn && this.model.version !== this.layoutVersion) this.relayout();
    else this.render();
  }

  /** Recompute VSEPR layout for every molecule; a single model update re-renders. */
  private relayout(): void {
    this.layoutVersion = this.model.version;
    const prevGeometry = this.geometry;
    const prevStyles = this.bondStyles;
    const prevKeys = this.layoutKeys;
    this.geometry = new Map();
    this.bondStyles = new Map();
    this.layoutKeys = new Set();
    const positions = new Map<number, { x: number; y: number }>();
    const bondsByAtom = new Map<number, SandboxBond[]>();
    for (const b of this.model.getBonds()) {
      if (!bondsByAtom.has(b.a)) bondsByAtom.set(b.a, []);
      bondsByAtom.get(b.a)!.push(b);
    }
    for (const frag of this.model.fragments()) {
      const bonds = frag.atomIds.flatMap((id) => bondsByAtom.get(id) ?? []);
      // Unchanged molecules (same atoms, bonds and orders) keep their layout: big fused-ring
      // systems are expensive to relax, and re-laying them out would also undo the user's drags.
      const key = `${frag.atomIds.join(',')}|${bonds.map((b) => `${b.id}:${b.order}`).join(',')}`;
      this.layoutKeys.add(key);
      if (prevKeys.has(key)) {
        for (const id of frag.atomIds) if (prevGeometry.has(id)) this.geometry.set(id, prevGeometry.get(id)!);
        for (const b of bonds) if (prevStyles.has(b.id)) this.bondStyles.set(b.id, prevStyles.get(b.id)!);
        continue;
      }
      const atoms = frag.atomIds.map((id) => this.model.getAtom(id));
      const res = layoutFragment(atoms, bonds);
      for (const [id, p] of res.positions) positions.set(id, p);
      for (const [id, g] of res.geometry) this.geometry.set(id, g);
      for (const [id, s] of res.bondStyles) this.bondStyles.set(id, s);
    }
    this.model.setPositions(positions); // emits → render (version unchanged)
    this.model.refreshBaseline(); // automatic layout is not an undo step
  }

  /** Screen point → world (sandbox) coordinates, or null if outside the sandbox. */
  toLocal(clientX: number, clientY: number): { x: number; y: number } | null {
    const r = this.svg.getBoundingClientRect();
    if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return null;
    return this.screenToWorld(clientX - r.left, clientY - r.top);
  }

  private screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return { x: (sx - this.view.tx) / this.view.k, y: (sy - this.view.ty) / this.view.k };
  }

  /** World coordinates of the visible centre. */
  center(): { x: number; y: number } {
    const r = this.svg.getBoundingClientRect();
    return this.screenToWorld(r.width / 2, r.height / 2);
  }

  atomAt(x: number, y: number): SandboxAtom | null {
    let best: SandboxAtom | null = null;
    let bestD = Infinity;
    for (const a of this.model.getAtoms()) {
      const d = Math.hypot(a.x - x, a.y - y);
      if (d < radiusOf(a.symbol) + 8 && d < bestD) {
        best = a;
        bestD = d;
      }
    }
    return best;
  }

  /** Drop handler for periodic-table drags. */
  dropElement(symbol: string, clientX: number, clientY: number): void {
    const p = this.toLocal(clientX, clientY);
    if (!p) return;
    const target = this.atomAt(p.x, p.y);
    if (target) this.attachTo(symbol, target.id, p);
    else this.model.addAtom(symbol, p.x, p.y);
  }

  /**
   * Place a whole library molecule centred at a screen point (drag-drop), or near the sandbox
   * centre (click). Large molecules are shrunk (bond length down to 36 px) to fit the view.
   */
  placeMolecule(m: Biomolecule, clientX?: number, clientY?: number): void {
    let p = clientX !== undefined && clientY !== undefined ? this.toLocal(clientX, clientY) : null;
    if (clientX !== undefined && !p) return; // dropped outside the sandbox
    if (!p) {
      const c = this.center();
      const k = this.model.fragments().length % 6;
      p = { x: c.x + (k % 3 - 1) * 60, y: c.y + (Math.floor(k / 3) - 0.5) * 60 };
    }
    const box = this.svg.getBoundingClientRect();
    const fit = { width: box.width / this.view.k, height: box.height / this.view.k, minBondPx: 36 };
    const ids = this.model.addMolecule(toTemplate(m, p.x, p.y, BOND_LENGTH, fit));
    this.selected = new Set(ids); // freshly placed molecule is selected, ready to move/copy/delete
    this.selectedBond = null;
    this.ensureVisible(ids);
    this.render();
    if (m.atomCount > 150) this.notify(`${m.name}: ${m.atomCount} atoms placed`);
  }

  /**
   * Inspect from the organelle layer (TSK-UI-007): add the given structures in a row beside whatever
   * is already in the sandbox (never replacing it), select them and frame them.
   */
  placeTemplates(templates: MoleculeTemplate[]): void {
    if (templates.length === 0) return;
    const existing = this.model.getAtoms();
    let x = existing.length ? Math.max(...existing.map((a) => a.x)) + 160 : 0;
    const y0 = existing.length ? existing.reduce((s, a) => s + a.y, 0) / existing.length : 0;
    const ids: number[] = [];
    for (const t of templates) {
      const xs = t.positions.map((p) => p.x);
      const ys = t.positions.map((p) => p.y);
      const minX = Math.min(...xs);
      const w = Math.max(...xs) - minX;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      ids.push(...this.model.addMolecule({ ...t, positions: t.positions.map((p) => ({ x: p.x - minX + x, y: p.y - cy + y0 })) }));
      x += w + 140;
    }
    this.selected = new Set(ids);
    this.selectedBond = null;
    this.render();
    this.frame(ids.map((id) => this.model.getAtom(id)));
  }

  /** Click on a table tile: attach to the selected atom, otherwise place near the centre. */
  clickElement(symbol: string): void {
    const sel = this.selectedAtomId;
    if (sel !== null) {
      this.attachTo(symbol, sel);
      return;
    }
    this.selected.clear();
    const c = this.center();
    const jitter = () => (Math.random() - 0.5) * 80;
    this.model.addAtom(symbol, c.x + jitter(), c.y + jitter());
  }

  /** Add a new atom next to `targetId` and bond them if the valence rule allows it. */
  private attachTo(symbol: string, targetId: number, hint?: { x: number; y: number }): void {
    const target = this.model.getAtom(targetId);
    const angle = this.freeAngle(target, hint);
    const pos = { x: target.x + BOND_LENGTH * Math.cos(angle), y: target.y + BOND_LENGTH * Math.sin(angle) };
    const atom = this.model.addAtom(symbol, pos.x, pos.y);
    const res = this.model.bond(targetId, atom.id);
    if (!res.ok) this.notify(`Placed unbonded — ${res.reason}`);
  }

  /** Direction from `atom` that is furthest from its existing bonds (or towards `hint`). */
  private freeAngle(atom: SandboxAtom, hint?: { x: number; y: number }): number {
    const neighbourAngles = this.model.bondsOf(atom.id).map((b) => {
      const other = this.model.getAtom(b.a === atom.id ? b.b : b.a);
      return Math.atan2(other.y - atom.y, other.x - atom.x);
    });
    if (neighbourAngles.length === 0) {
      if (hint && Math.hypot(hint.x - atom.x, hint.y - atom.y) > 3) return Math.atan2(hint.y - atom.y, hint.x - atom.x);
      return 0;
    }
    let best = 0;
    let bestScore = -1;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const score = Math.min(...neighbourAngles.map((n) => Math.abs(Math.atan2(Math.sin(a - n), Math.cos(a - n)))));
      if (score > bestScore + 1e-9) {
        best = a;
        bestScore = score;
      }
    }
    return best;
  }

  // ---------- interaction ----------
  private onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    const p = this.toLocal(e.clientX, e.clientY)!;
    const additive = e.ctrlKey || e.metaKey;

    if (e.shiftKey) {
      this.startMarquee(e);
      return;
    }

    const bondEl = (e.target as Element).closest('[data-bond]');
    if (bondEl && !additive) {
      const id = Number(bondEl.getAttribute('data-bond'));
      const res = this.model.cycleBondOrder(id);
      if (!res.ok) this.notify(res.reason!);
      this.selected.clear();
      this.selectedBond = id;
      this.render();
      return;
    }

    const atom = this.atomAt(p.x, p.y);
    if (!atom) {
      this.startPan(e);
      return;
    }
    if (additive) {
      // Ctrl/Cmd-click toggles the atom in the multi-selection.
      if (this.selected.has(atom.id)) this.selected.delete(atom.id);
      else this.selected.add(atom.id);
      this.selectedBond = null;
      this.render();
      return;
    }

    // Drag moves the selection if the atom is part of a multi-selection, else the atom
    // (or, in geometry mode, its whole rigid molecule).
    let group: number[] = this.selected.size > 1 && this.selected.has(atom.id) ? [...this.selected] : [atom.id];
    if (this.geometryOn) {
      const ids = new Set(group);
      for (const f of this.model.fragments()) if (f.atomIds.some((id) => ids.has(id))) f.atomIds.forEach((id) => ids.add(id));
      group = [...ids];
    }
    const origin = new Map(group.map((id) => {
      const a = this.model.getAtom(id);
      return [id, { x: a.x, y: a.y }];
    }));
    const start = { x: e.clientX, y: e.clientY };
    let dragging = false;
    this.svg.setPointerCapture(e.pointerId);

    const move = (m: PointerEvent) => {
      if (!dragging && Math.hypot(m.clientX - start.x, m.clientY - start.y) > DRAG_THRESHOLD_PX) dragging = true;
      if (!dragging) return;
      const dx = (m.clientX - start.x) / this.view.k;
      const dy = (m.clientY - start.y) / this.view.k;
      const next = new Map<number, { x: number; y: number }>();
      for (const [id, o] of origin) next.set(id, { x: o.x + dx, y: o.y + dy });
      this.model.setPositions(next);
    };
    const up = () => {
      this.svg.removeEventListener('pointermove', move);
      this.svg.removeEventListener('pointerup', up);
      this.svg.removeEventListener('pointercancel', up);
      if (dragging) this.model.commit(); // a finished drag is one undo step
      else this.clickAtom(atom.id);
    };
    this.svg.addEventListener('pointermove', move);
    this.svg.addEventListener('pointerup', up);
    this.svg.addEventListener('pointercancel', up);
  }

  /** Left-drag on empty space pans the view; a click without movement clears the selection. */
  private startPan(e: PointerEvent): void {
    const start = { x: e.clientX, y: e.clientY, tx: this.view.tx, ty: this.view.ty };
    let panning = false;
    this.svg.setPointerCapture(e.pointerId);
    const move = (m: PointerEvent) => {
      if (!panning && Math.hypot(m.clientX - start.x, m.clientY - start.y) > DRAG_THRESHOLD_PX) {
        panning = true;
        this.svg.classList.add('panning');
      }
      if (!panning) return;
      this.view.tx = start.tx + (m.clientX - start.x);
      this.view.ty = start.ty + (m.clientY - start.y);
      this.applyView();
    };
    const up = () => {
      this.svg.removeEventListener('pointermove', move);
      this.svg.removeEventListener('pointerup', up);
      this.svg.removeEventListener('pointercancel', up);
      this.svg.classList.remove('panning');
      if (!panning) this.clearSelection();
    };
    this.svg.addEventListener('pointermove', move);
    this.svg.addEventListener('pointerup', up);
    this.svg.addEventListener('pointercancel', up);
  }

  /** Shift-drag draws a selection box; atoms inside are added to the selection. */
  private startMarquee(e: PointerEvent): void {
    const r = this.svg.getBoundingClientRect();
    const sx = e.clientX - r.left;
    const sy = e.clientY - r.top;
    let box = { x: sx, y: sy, w: 0, h: 0 };
    let dragged = false;
    this.svg.setPointerCapture(e.pointerId);
    const move = (m: PointerEvent) => {
      const cx = Math.min(Math.max(m.clientX - r.left, 0), r.width);
      const cy = Math.min(Math.max(m.clientY - r.top, 0), r.height);
      if (!dragged && Math.hypot(cx - sx, cy - sy) <= DRAG_THRESHOLD_PX) return;
      dragged = true;
      box = { x: Math.min(sx, cx), y: Math.min(sy, cy), w: Math.abs(cx - sx), h: Math.abs(cy - sy) };
      if (!this.marquee) {
        this.marquee = el('rect', { class: 'marquee' });
        this.svg.append(this.marquee);
      }
      for (const [k, v] of Object.entries({ x: box.x, y: box.y, width: box.w, height: box.h })) this.marquee.setAttribute(k, String(v));
    };
    const up = () => {
      this.svg.removeEventListener('pointermove', move);
      this.svg.removeEventListener('pointerup', up);
      this.svg.removeEventListener('pointercancel', up);
      this.marquee?.remove();
      this.marquee = null;
      if (dragged) {
        const a = this.screenToWorld(box.x, box.y);
        const b = this.screenToWorld(box.x + box.w, box.y + box.h);
        for (const atom of this.model.getAtoms()) {
          if (atom.x >= a.x && atom.x <= b.x && atom.y >= a.y && atom.y <= b.y) this.selected.add(atom.id);
        }
        this.selectedBond = null;
      } else {
        // Shift-click on an atom toggles it, like Ctrl-click.
        const p = this.screenToWorld(sx, sy);
        const atom = this.atomAt(p.x, p.y);
        if (atom) {
          if (this.selected.has(atom.id)) this.selected.delete(atom.id);
          else this.selected.add(atom.id);
        }
      }
      this.render();
    };
    this.svg.addEventListener('pointermove', move);
    this.svg.addEventListener('pointerup', up);
    this.svg.addEventListener('pointercancel', up);
  }

  private clickAtom(id: number): void {
    const sel = this.selectedAtomId;
    if (sel !== null && sel !== id) {
      const res = this.model.bond(sel, id);
      if (!res.ok) this.notify(res.reason!);
      this.selected.clear();
    } else if (sel === id) {
      this.selected.clear();
    } else {
      this.selected = new Set([id]);
    }
    this.selectedBond = null;
    this.render();
  }

  private onContextMenu(e: MouseEvent): void {
    e.preventDefault();
    const bondEl = (e.target as Element).closest('[data-bond]');
    if (bondEl) {
      this.model.removeBond(Number(bondEl.getAttribute('data-bond')));
    } else {
      const p = this.toLocal(e.clientX, e.clientY);
      const atom = p && this.atomAt(p.x, p.y);
      // Right-clicking any atom of a multi-selection deletes the whole selection.
      if (atom && this.selected.size > 1 && this.selected.has(atom.id)) this.model.removeAtoms(this.selected);
      else if (atom) this.model.removeAtom(atom.id);
    }
    this.clearSelection();
  }

  private onKey(e: KeyboardEvent): void {
    if (!this.active || isTyping(e.target)) return; // search box etc. keep their own shortcuts
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();
    if (mod && key === 'z') {
      e.preventDefault();
      if (e.shiftKey) this.redo();
      else this.undo();
    } else if (mod && key === 'y') {
      e.preventDefault();
      this.redo();
    } else if (mod && key === 'c') {
      if (this.copySelection()) e.preventDefault();
    } else if (mod && key === 'x') {
      e.preventDefault();
      this.cutSelection();
    } else if (mod && key === 'v') {
      e.preventDefault();
      this.paste();
    } else if (mod && key === 'a') {
      e.preventDefault();
      this.selectAll();
    } else if (!mod && key === 'f') {
      this.fitView();
    } else if (e.key === 'Escape') {
      this.clearSelection();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (this.selected.size || this.selectedBond !== null) {
        e.preventDefault();
        this.deleteSelection();
      }
    }
  }

  // ---------- rendering ----------
  render(): void {
    for (const id of [...this.selected]) if (!this.model.hasAtom(id)) this.selected.delete(id);
    if (this.selectedBond !== null && !this.model.getBonds().some((b) => b.id === this.selectedBond)) this.selectedBond = null;

    this.svg.replaceChildren();
    this.gridPattern = null;
    if (this.geometryOn) {
      const defs = el('defs');
      const pattern = el('pattern', { id: 'grid', width: 24, height: 24, patternUnits: 'userSpaceOnUse' });
      pattern.append(el('path', { d: 'M 24 0 L 0 0 0 24', class: 'grid-line' }));
      defs.append(pattern);
      this.gridPattern = pattern;
      this.svg.append(defs, el('rect', { width: '100%', height: '100%', fill: 'url(#grid)' }));
    }
    this.root = el('g', { class: 'world' }) as SVGGElement;
    const bondLayer = el('g');
    const decoLayer = el('g');
    const atomLayer = el('g');
    this.root.append(bondLayer, decoLayer, atomLayer);
    this.svg.append(this.root);
    if (this.marquee) this.svg.append(this.marquee);
    this.applyView();

    const issues = this.model.mode === 'hard' ? this.model.bondOrderIssues() : new Set<number>();

    for (const bond of this.model.getBonds()) {
      const a = this.model.getAtom(bond.a);
      const b = this.model.getAtom(bond.b);
      const g = el('g', { class: 'bond-group', 'data-bond': String(bond.id) });
      if (this.selectedBond === bond.id) g.classList.add('selected');
      if (issues.has(bond.id)) g.classList.add('wrong');
      const style = this.geometryOn ? this.bondStyles.get(bond.id) : undefined;
      if (style && style.depth !== 0) {
        const [p, q] = style.from === bond.a ? [a, b] : [b, a];
        g.append(style.depth === 1 ? wedge(p, q) : dashes(p, q));
      } else {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const spacing = 5;
        const offsets = bond.order === 1 ? [0] : bond.order === 2 ? [-spacing / 2, spacing / 2] : [-spacing, 0, spacing];
        for (const o of offsets) {
          g.append(el('line', { class: 'bond-line', x1: a.x + nx * o, y1: a.y + ny * o, x2: b.x + nx * o, y2: b.y + ny * o }));
        }
      }
      g.append(el('line', { class: 'bond-hit', x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
      bondLayer.append(g);
    }

    for (const atom of this.model.getAtoms()) {
      const r = radiusOf(atom.symbol);
      const geo = this.geometryOf(atom.id);
      if (geo) this.drawGeometry(decoLayer, atom, geo, r);

      const g = el('g', { class: 'atom', transform: `translate(${atom.x},${atom.y})` });
      const info = getElement(atom.symbol);
      g.append(el('title', {}, `${info.name} — ${this.model.usedValence(atom.id)} bond order used of max ${Math.max(0, ...info.valences)}`));
      const status = this.model.valenceStatus(atom.id);
      if (status === 'open') g.append(el('circle', { class: 'open-ring', r: r + 5 }));
      if (this.selected.has(atom.id)) g.append(el('circle', { class: 'select-ring', r: r + 4 }));
      g.append(el('circle', { class: 'body', r, fill: atomFill(atom.symbol) }));
      g.append(el('text', { fill: textColorFor(atom.symbol), 'font-size': atom.symbol.length > 1 ? 13 : r < ATOM_R ? 12 : 15 }, atom.symbol));
      if (atom.charge) {
        const q = atom.charge;
        const label = `${Math.abs(q) > 1 ? Math.abs(q) : ''}${q > 0 ? '+' : '−'}`;
        g.append(el('circle', { class: 'charge-badge', cx: -r + 1, cy: -r + 1, r: 7.5 }));
        g.append(el('text', { class: 'charge-text', x: -r + 1, y: -r + 1 }, label));
      }
      const free = this.model.freeValence(atom.id);
      if (status === 'open' && free > 0) {
        g.append(el('circle', { class: 'badge', cx: r - 2, cy: -r + 2, r: 7 }));
        g.append(el('text', { class: 'badge-text', x: r - 2, y: -r + 2 }, String(free)));
      }
      atomLayer.append(g);
    }
  }

  private drawGeometry(layer: SVGElement, atom: SandboxAtom, geo: AtomGeometry, r: number): void {
    // Lone pairs: two dots just outside the atom.
    for (const ang of geo.lonePairAngles) {
      const cx = atom.x + (r + 8) * Math.cos(ang);
      const cy = atom.y + (r + 8) * Math.sin(ang);
      const px = -Math.sin(ang) * 3.5;
      const py = Math.cos(ang) * 3.5;
      layer.append(el('circle', { class: 'lone-pair', cx: cx + px, cy: cy + py, r: 2.2 }));
      layer.append(el('circle', { class: 'lone-pair', cx: cx - px, cy: cy - py, r: 2.2 }));
    }
    if (!this.anglesOn || !geo.arc || !geo.angleLabel) return;
    const [a1, a2] = geo.arc;
    let delta = Math.atan2(Math.sin(a2 - a1), Math.cos(a2 - a1));
    if (Math.abs(Math.abs(delta) - Math.PI) < 1e-6) delta = Math.PI;
    const R = r + 14;
    const p1 = { x: atom.x + R * Math.cos(a1), y: atom.y + R * Math.sin(a1) };
    const p2 = { x: atom.x + R * Math.cos(a1 + delta), y: atom.y + R * Math.sin(a1 + delta) };
    layer.append(el('path', { class: 'angle-arc', d: `M ${p1.x} ${p1.y} A ${R} ${R} 0 0 ${delta > 0 ? 1 : 0} ${p2.x} ${p2.y}` }));
    const mid = a1 + delta / 2;
    layer.append(el('text', { class: 'angle-label', x: atom.x + (R + 16) * Math.cos(mid), y: atom.y + (R + 16) * Math.sin(mid) }, geo.angleLabel));
  }
}

function wedge(p: { x: number; y: number }, q: { x: number; y: number }): SVGElement {
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * 5;
  const ny = (dx / len) * 5;
  return el('polygon', { class: 'bond-wedge', points: `${p.x},${p.y} ${q.x + nx},${q.y + ny} ${q.x - nx},${q.y - ny}` });
}

function dashes(p: { x: number; y: number }, q: { x: number; y: number }): SVGElement {
  const g = el('g');
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const n = 7;
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    const w = 1 + 4.5 * t;
    const cx = p.x + dx * t;
    const cy = p.y + dy * t;
    g.append(el('line', { class: 'bond-dash', x1: cx + nx * w, y1: cy + ny * w, x2: cx - nx * w, y2: cy - ny * w }));
  }
  return g;
}

function el(tag: string, attrs: Record<string, string | number> = {}, text?: string): SVGElement {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  if (text !== undefined) node.textContent = text;
  return node;
}

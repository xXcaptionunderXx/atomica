/**
 * 2D SVG sandbox view: renders a MoleculeModel and handles atom drag, selection,
 * click-to-bond, bond-order cycling and deletion. Tasks TSK-UI-001, TSK-UI-004.
 *
 * Geometry mode: each molecule is laid out with VSEPR geometry (sandbox/Geometry.ts),
 * a background grid is shown, and bond angles, wedges/dashes and lone pairs are drawn.
 * Dragging any atom then moves the whole molecule rigidly.
 */

import { getElement } from '../chemistry/elements';
import { MoleculeModel, type SandboxAtom } from '../sandbox/MoleculeModel';
import { layoutFragment, type AtomGeometry, type BondStyle } from '../sandbox/Geometry';
import { atomFill, textColorFor } from './colors';

const SVG_NS = 'http://www.w3.org/2000/svg';
const ATOM_R = 18;
const H_R = 13;
const BOND_LENGTH = 64;
const DRAG_THRESHOLD_PX = 4;

type Selection = { kind: 'atom'; id: number } | { kind: 'bond'; id: number } | null;

const radiusOf = (symbol: string) => (symbol === 'H' ? H_R : ATOM_R);

export class SandboxView {
  private selection: Selection = null;
  private geometryOn = false;
  private layoutVersion = -1;
  private geometry = new Map<number, AtomGeometry>();
  private bondStyles = new Map<number, BondStyle>();

  constructor(
    private readonly svg: SVGSVGElement,
    private readonly model: MoleculeModel,
    private readonly notify: (msg: string) => void,
  ) {
    model.subscribe(() => this.onModelChange());
    svg.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    svg.addEventListener('contextmenu', (e) => this.onContextMenu(e));
    window.addEventListener('keydown', (e) => this.onKey(e));
    this.render();
  }

  get selectedAtomId(): number | null {
    return this.selection?.kind === 'atom' ? this.selection.id : null;
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
    this.geometry.clear();
    this.bondStyles.clear();
    const positions = new Map<number, { x: number; y: number }>();
    for (const frag of this.model.fragments()) {
      const ids = new Set(frag.atomIds);
      const atoms = frag.atomIds.map((id) => this.model.getAtom(id));
      const bonds = this.model.getBonds().filter((b) => ids.has(b.a));
      const res = layoutFragment(atoms, bonds);
      for (const [id, p] of res.positions) positions.set(id, p);
      for (const [id, g] of res.geometry) this.geometry.set(id, g);
      for (const [id, s] of res.bondStyles) this.bondStyles.set(id, s);
    }
    this.model.setPositions(positions); // emits → render (version unchanged)
  }

  /** Screen point → sandbox coordinates, or null if outside the sandbox. */
  toLocal(clientX: number, clientY: number): { x: number; y: number } | null {
    const r = this.svg.getBoundingClientRect();
    if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return null;
    return { x: clientX - r.left, y: clientY - r.top };
  }

  center(): { x: number; y: number } {
    const r = this.svg.getBoundingClientRect();
    return { x: r.width / 2, y: r.height / 2 };
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

  /** Click on a table tile: attach to the selected atom, otherwise place near the centre. */
  clickElement(symbol: string): void {
    const sel = this.selectedAtomId;
    if (sel !== null) {
      this.attachTo(symbol, sel);
      return;
    }
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
    const bondEl = (e.target as Element).closest('[data-bond]');
    if (bondEl) {
      const id = Number(bondEl.getAttribute('data-bond'));
      const res = this.model.cycleBondOrder(id);
      if (!res.ok) this.notify(res.reason!);
      this.selection = { kind: 'bond', id };
      this.render();
      return;
    }
    const atom = this.atomAt(p.x, p.y);
    if (!atom) {
      this.selection = null;
      this.render();
      return;
    }

    // In geometry mode the molecule is rigid: drag moves every atom of the fragment.
    const group = this.geometryOn
      ? this.model.fragments().find((f) => f.atomIds.includes(atom.id))!.atomIds
      : [atom.id];
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
      const dx = m.clientX - start.x;
      const dy = m.clientY - start.y;
      const next = new Map<number, { x: number; y: number }>();
      for (const [id, o] of origin) next.set(id, { x: o.x + dx, y: o.y + dy });
      this.model.setPositions(next);
    };
    const up = () => {
      this.svg.removeEventListener('pointermove', move);
      this.svg.removeEventListener('pointerup', up);
      this.svg.removeEventListener('pointercancel', up);
      if (!dragging) this.clickAtom(atom.id);
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
      this.selection = null;
    } else if (sel === id) {
      this.selection = null;
    } else {
      this.selection = { kind: 'atom', id };
    }
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
      if (atom) this.model.removeAtom(atom.id);
    }
    this.selection = null;
    this.render();
  }

  private onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.selection = null;
      this.render();
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && this.selection) {
      if (this.selection.kind === 'atom') this.model.removeAtom(this.selection.id);
      else this.model.removeBond(this.selection.id);
      this.selection = null;
      this.render();
    }
  }

  // ---------- rendering ----------
  render(): void {
    if (this.selection?.kind === 'atom' && !this.model.getAtoms().some((a) => a.id === this.selection!.id)) this.selection = null;
    if (this.selection?.kind === 'bond' && !this.model.getBonds().some((b) => b.id === this.selection!.id)) this.selection = null;

    this.svg.replaceChildren();
    if (this.geometryOn) {
      const defs = el('defs');
      const pattern = el('pattern', { id: 'grid', width: 24, height: 24, patternUnits: 'userSpaceOnUse' });
      pattern.append(el('path', { d: 'M 24 0 L 0 0 0 24', class: 'grid-line' }));
      defs.append(pattern);
      this.svg.append(defs, el('rect', { width: '100%', height: '100%', fill: 'url(#grid)' }));
    }
    const bondLayer = el('g');
    const decoLayer = el('g');
    const atomLayer = el('g');
    this.svg.append(bondLayer, decoLayer, atomLayer);

    const issues = this.model.mode === 'hard' ? this.model.bondOrderIssues() : new Set<number>();

    for (const bond of this.model.getBonds()) {
      const a = this.model.getAtom(bond.a);
      const b = this.model.getAtom(bond.b);
      const g = el('g', { class: 'bond-group', 'data-bond': String(bond.id) });
      if (this.selection?.kind === 'bond' && this.selection.id === bond.id) g.classList.add('selected');
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
      if (this.selectedAtomId === atom.id) g.append(el('circle', { class: 'select-ring', r: r + 4 }));
      g.append(el('circle', { class: 'body', r, fill: atomFill(atom.symbol) }));
      g.append(el('text', { fill: textColorFor(atom.symbol), 'font-size': atom.symbol.length > 1 ? 13 : r < ATOM_R ? 12 : 15 }, atom.symbol));
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
    if (!geo.arc || !geo.angleLabel) return;
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

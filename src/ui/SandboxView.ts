/**
 * 2D SVG sandbox view: renders a MoleculeModel and handles atom drag, selection,
 * click-to-bond, bond-order cycling and deletion. Task TSK-UI-001.
 */

import { getElement } from '../chemistry/elements';
import { MoleculeModel, type SandboxAtom } from '../sandbox/MoleculeModel';
import { atomFill, textColorFor } from './colors';

const SVG_NS = 'http://www.w3.org/2000/svg';
const ATOM_R = 18;
const BOND_LENGTH = 64;
const DRAG_THRESHOLD_PX = 4;

type Selection = { kind: 'atom'; id: number } | { kind: 'bond'; id: number } | null;

export class SandboxView {
  private selection: Selection = null;

  constructor(
    private readonly svg: SVGSVGElement,
    private readonly model: MoleculeModel,
    private readonly notify: (msg: string) => void,
  ) {
    model.subscribe(() => this.render());
    svg.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    svg.addEventListener('contextmenu', (e) => this.onContextMenu(e));
    window.addEventListener('keydown', (e) => this.onKey(e));
    this.render();
  }

  get selectedAtomId(): number | null {
    return this.selection?.kind === 'atom' ? this.selection.id : null;
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
    let bestD = ATOM_R + 8;
    for (const a of this.model.getAtoms()) {
      const d = Math.hypot(a.x - x, a.y - y);
      if (d < bestD) {
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
    const target = e.target as Element;
    const bondEl = target.closest('[data-bond]');
    if (bondEl) {
      const id = Number(bondEl.getAttribute('data-bond'));
      this.model.cycleBondOrder(id);
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

    const start = { x: e.clientX, y: e.clientY };
    const offset = { x: atom.x - p.x, y: atom.y - p.y };
    let dragging = false;
    this.svg.setPointerCapture(e.pointerId);

    const move = (m: PointerEvent) => {
      if (!dragging && Math.hypot(m.clientX - start.x, m.clientY - start.y) > DRAG_THRESHOLD_PX) dragging = true;
      if (dragging) {
        const r = this.svg.getBoundingClientRect();
        const x = Math.min(Math.max(m.clientX - r.left + offset.x, ATOM_R), r.width - ATOM_R);
        const y = Math.min(Math.max(m.clientY - r.top + offset.y, ATOM_R), r.height - ATOM_R);
        this.model.moveAtom(atom.id, x, y);
      }
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
    // Drop a stale selection (e.g. after Clear).
    if (this.selection?.kind === 'atom' && !this.model.getAtoms().some((a) => a.id === this.selection!.id)) this.selection = null;
    if (this.selection?.kind === 'bond' && !this.model.getBonds().some((b) => b.id === this.selection!.id)) this.selection = null;

    this.svg.replaceChildren();
    const bondLayer = el('g');
    const atomLayer = el('g');
    this.svg.append(bondLayer, atomLayer);

    for (const bond of this.model.getBonds()) {
      const a = this.model.getAtom(bond.a);
      const b = this.model.getAtom(bond.b);
      const g = el('g', { class: 'bond-group', 'data-bond': String(bond.id) });
      if (this.selection?.kind === 'bond' && this.selection.id === bond.id) g.classList.add('selected');
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
      g.append(el('line', { class: 'bond-hit', x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
      bondLayer.append(g);
    }

    for (const atom of this.model.getAtoms()) {
      const g = el('g', { class: 'atom', transform: `translate(${atom.x},${atom.y})` });
      const info = getElement(atom.symbol);
      g.append(el('title', {}, `${info.name} — ${this.model.usedValence(atom.id)} bond order used of max ${Math.max(0, ...info.valences)}`));
      const status = this.model.valenceStatus(atom.id);
      if (status === 'open') g.append(el('circle', { class: 'open-ring', r: ATOM_R + 5 }));
      if (this.selectedAtomId === atom.id) g.append(el('circle', { class: 'select-ring', r: ATOM_R + 4 }));
      g.append(el('circle', { class: 'body', r: ATOM_R, fill: atomFill(atom.symbol) }));
      g.append(el('text', { fill: textColorFor(atom.symbol), 'font-size': atom.symbol.length > 1 ? 13 : 15 }, atom.symbol));
      const free = this.model.freeValence(atom.id);
      if (status === 'open' && free > 0) {
        g.append(el('circle', { class: 'badge', cx: ATOM_R - 2, cy: -ATOM_R + 2, r: 7 }));
        g.append(el('text', { class: 'badge-text', x: ATOM_R - 2, y: -ATOM_R + 2 }, String(free)));
      }
      atomLayer.append(g);
    }
  }
}

function el(tag: string, attrs: Record<string, string | number> = {}, text?: string): SVGElement {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  if (text !== undefined) node.textContent = text;
  return node;
}

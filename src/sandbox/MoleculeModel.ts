/**
 * ATOMICA 2D Sandbox Molecule Model — Tasks TSK-UI-001, TSK-UI-004.
 * Pure data model (no DOM): atoms with 2D positions, bonds with order 1–3, valence-limited
 * bonding, connected-fragment detection, Hill-notation formulas, molecular weights and names.
 *
 * Modes:
 *  - 'easy': the user only draws connectivity; bond orders are assigned automatically by
 *    BondOrderSolver after every structural change.
 *  - 'hard': the user sets bond orders; `bondOrderIssues()` reports bonds whose order differs
 *    from the best valence-satisfying assignment (shown red in the UI).
 *
 * Bonding rule is the labelled valence APPROXIMATION documented in chemistry/elements.ts.
 * Atoms placed from the biomolecule library (TSK-UI-005) carry their PubChem formal charge, which
 * shifts the allowed valences (O- -> 1, N+ -> 4, ...) so real ions and zwitterions read as complete.
 */

import { getElement, maxValence } from '../chemistry/elements';
import { lookupCompound, type CompoundMatch } from '../chemistry/compoundNames';
import { solveBondOrders } from './BondOrderSolver';

export interface SandboxAtom {
  id: number;
  symbol: string;
  x: number;
  y: number;
  /** Formal charge (library molecules only; hand-built atoms are neutral). */
  charge?: number;
  /** Library placement this atom came from (see MoleculeModel.addMolecule). */
  origin?: number;
}

/** A complete structure to place in one step (coordinates in sandbox pixels). */
export interface MoleculeTemplate {
  /** Library name for the whole template ('' = hand-built atoms, no name tracking). */
  name: string;
  symbols: string[];
  positions: { x: number; y: number }[];
  /** [atomIndexA, atomIndexB, order] */
  bonds: [number, number, number][];
  charges?: number[];
  /** Copy/paste: per-atom index into `originGroups` (-1 = none), overriding `name`. */
  originIndex?: number[];
  originGroups?: Origin[];
}

export interface Origin {
  name: string;
  size: number;
  formula: string;
}

/** Serialized model state used by undo/redo (TSK-UI-006). */
interface Snapshot {
  atoms: SandboxAtom[];
  bonds: SandboxBond[];
  origins: [number, Origin][];
  nextAtomId: number;
  nextBondId: number;
  nextOrigin: number;
}

const HISTORY_LIMIT = 200;

export interface SandboxBond {
  id: number;
  a: number;
  b: number;
  order: 1 | 2 | 3;
}

export type ValenceStatus = 'complete' | 'open' | 'inert';
export type BuildMode = 'easy' | 'hard';

export interface Fragment {
  atomIds: number[];
  formula: string;
  molecularWeight: number;
  /** Charge implied by unfilled valences on electronegative atoms (e.g. sulfate −2). */
  impliedCharge: number;
  match: CompoundMatch | null;
  /** Library compound this fragment is one ion/piece of (e.g. "Calcium carbonate"). */
  partOf?: string;
}

export interface BondResult {
  ok: boolean;
  bond?: SandboxBond;
  reason?: string;
}

export const MAX_BOND_ORDER = 3;

/** Atoms whose unfilled valence is read as a negative charge when naming ions. */
const ANION_FORMERS = new Set(['N', 'O', 'S', 'Se', 'F', 'Cl', 'Br', 'I', 'P']);

export class MoleculeModel {
  private atoms = new Map<number, SandboxAtom>();
  private bonds = new Map<number, SandboxBond>();
  private nextAtomId = 1;
  private nextBondId = 1;
  private listeners = new Set<() => void>();
  private _mode: BuildMode = 'hard';
  /** Incremented on every structural change (atoms/bonds/orders), not on moves. */
  private _version = 0;
  private issuesCache: { version: number; ids: Set<number> } | null = null;
  private origins = new Map<number, Origin>();
  private nextOrigin = 1;
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private baseline = this.serialize();

  // ---------- queries ----------
  get mode(): BuildMode {
    return this._mode;
  }

  get version(): number {
    return this._version;
  }

  getAtoms(): SandboxAtom[] {
    return [...this.atoms.values()];
  }

  getBonds(): SandboxBond[] {
    return [...this.bonds.values()];
  }

  hasAtom(id: number): boolean {
    return this.atoms.has(id);
  }

  getAtom(id: number): SandboxAtom {
    const a = this.atoms.get(id);
    if (!a) throw new Error(`Atom ${id} not found`);
    return a;
  }

  getBond(id: number): SandboxBond {
    const b = this.bonds.get(id);
    if (!b) throw new Error(`Bond ${id} not found`);
    return b;
  }

  findBond(a: number, b: number): SandboxBond | undefined {
    for (const bond of this.bonds.values()) {
      if ((bond.a === a && bond.b === b) || (bond.a === b && bond.b === a)) return bond;
    }
    return undefined;
  }

  bondsOf(atomId: number): SandboxBond[] {
    return this.getBonds().filter((b) => b.a === atomId || b.b === atomId);
  }

  /** Sum of bond orders on an atom. */
  usedValence(atomId: number): number {
    return this.bondsOf(atomId).reduce((s, b) => s + b.order, 0);
  }

  /**
   * Allowed valences, shifted by formal charge: an isoelectronic shift (N+ ~ C -> 4, O- -> 1) or
   * loss of a bonding pair (C-/C+ -> 3). A charged atom may also stand alone as a simple ion (0 bonds).
   */
  valencesOf(atomId: number): number[] {
    const atom = this.getAtom(atomId);
    const base = getElement(atom.symbol).valences;
    const q = atom.charge ?? 0;
    if (!q) return base;
    const out = new Set<number>([0]);
    for (const v of base) {
      if (v + q >= 0) out.add(v + q);
      if (v - Math.abs(q) >= 0) out.add(v - Math.abs(q));
    }
    return [...out].sort((a, b) => a - b);
  }

  private maxValenceOf(atomId: number): number {
    const a = this.getAtom(atomId);
    return a.charge ? Math.max(0, ...this.valencesOf(atomId)) : maxValence(a.symbol);
  }

  freeValence(atomId: number): number {
    return this.maxValenceOf(atomId) - this.usedValence(atomId);
  }

  valenceStatus(atomId: number): ValenceStatus {
    const valences = this.valencesOf(atomId);
    if (valences.length === 0) return 'inert';
    return valences.includes(this.usedValence(atomId)) ? 'complete' : 'open';
  }

  /** Units of valence still open before the atom reaches its next allowed valence. */
  openValence(atomId: number): number {
    const used = this.usedValence(atomId);
    const next = this.valencesOf(atomId).filter((v) => v >= used);
    return next.length ? Math.min(...next) - used : 0;
  }

  // ---------- mutations ----------
  setMode(mode: BuildMode): void {
    if (mode === this._mode) return;
    this._mode = mode;
    if (mode === 'easy') this.autoAssignOrders();
    this._version++;
    this.refreshBaseline(); // a settings change, not an undoable edit
    this.emit();
  }

  addAtom(symbol: string, x: number, y: number): SandboxAtom {
    getElement(symbol); // validates symbol
    const atom: SandboxAtom = { id: this.nextAtomId++, symbol, x, y };
    this.atoms.set(atom.id, atom);
    this.changed();
    return atom;
  }

  /** Place a whole structure (e.g. from the biomolecule library) as one change. Returns atom ids. */
  addMolecule(t: MoleculeTemplate): number[] {
    t.symbols.forEach((s) => getElement(s)); // validate before mutating anything
    let originOf: (i: number) => number | undefined;
    if (t.originGroups && t.originIndex) {
      const keys = t.originGroups.map((g) => {
        const k = this.nextOrigin++;
        this.origins.set(k, { ...g });
        return k;
      });
      originOf = (i) => (t.originIndex![i] >= 0 ? keys[t.originIndex![i]] : undefined);
    } else if (t.name) {
      const k = this.nextOrigin++;
      this.origins.set(k, { name: t.name, size: t.symbols.length, formula: hillFormula(t.symbols) });
      originOf = () => k;
    } else {
      originOf = () => undefined;
    }
    const ids = t.symbols.map((symbol, i) => {
      const atom: SandboxAtom = { id: this.nextAtomId++, symbol, x: t.positions[i].x, y: t.positions[i].y };
      const origin = originOf(i);
      if (origin !== undefined) atom.origin = origin;
      if (t.charges?.[i]) atom.charge = t.charges[i];
      this.atoms.set(atom.id, atom);
      return atom.id;
    });
    for (const [i, j, order] of t.bonds) {
      const o = Math.min(3, Math.max(1, order)) as 1 | 2 | 3;
      const bond: SandboxBond = { id: this.nextBondId++, a: ids[i], b: ids[j], order: o };
      this.bonds.set(bond.id, bond);
    }
    this.changed();
    return ids;
  }

  moveAtom(id: number, x: number, y: number): void {
    const a = this.getAtom(id);
    a.x = x;
    a.y = y;
    this.emit();
  }

  /** Move many atoms at once with a single change notification. */
  setPositions(positions: Map<number, { x: number; y: number }>): void {
    for (const [id, p] of positions) {
      const a = this.atoms.get(id);
      if (a) {
        a.x = p.x;
        a.y = p.y;
      }
    }
    this.emit();
  }

  /** Why two atoms cannot be (further) bonded, or null if they can. */
  bondBlocker(a: number, b: number): string | null {
    if (a === b) return 'An atom cannot bond to itself';
    const atomA = this.getAtom(a);
    const atomB = this.getAtom(b);
    const existing = this.findBond(a, b);
    if (existing && this._mode === 'easy') {
      return 'Already bonded — in Easy mode double/triple bonds are chosen automatically';
    }
    if (existing && existing.order >= MAX_BOND_ORDER) return 'Bond is already triple (maximum order)';
    for (const atom of [atomA, atomB]) {
      if (this.maxValenceOf(atom.id) === 0) return `${getElement(atom.symbol).name} has no established bonding chemistry`;
      // Easy mode only needs room for one more single bond; orders are re-solved afterwards.
      const used = this._mode === 'easy' ? this.bondsOf(atom.id).length : this.usedValence(atom.id);
      if (this.maxValenceOf(atom.id) - used < 1) return `${atom.symbol} has no free valence left`;
    }
    return null;
  }

  /** Create a single bond, or (hard mode) raise an existing bond's order by one. */
  bond(a: number, b: number): BondResult {
    const blocker = this.bondBlocker(a, b);
    if (blocker) return { ok: false, reason: blocker };
    let bond = this.findBond(a, b);
    if (bond) {
      bond.order = (bond.order + 1) as 1 | 2 | 3;
    } else {
      bond = { id: this.nextBondId++, a, b, order: 1 };
      this.bonds.set(bond.id, bond);
    }
    if (this._mode === 'easy') this.autoAssignOrders();
    this.changed();
    return { ok: true, bond };
  }

  /** Hard mode: cycle 1 → 2 → 3 → 1, skipping orders that would exceed either atom's valence. */
  cycleBondOrder(bondId: number): BondResult {
    const bond = this.getBond(bondId);
    if (this._mode === 'easy') {
      return { ok: false, bond, reason: 'Bond orders are automatic in Easy mode — switch to Hard mode to set them' };
    }
    if (bond.order < MAX_BOND_ORDER && this.freeValence(bond.a) >= 1 && this.freeValence(bond.b) >= 1) {
      bond.order = (bond.order + 1) as 1 | 2 | 3;
    } else {
      bond.order = 1;
    }
    this.changed();
    return { ok: true, bond };
  }

  removeBond(id: number): void {
    this.bonds.delete(id);
    if (this._mode === 'easy') this.autoAssignOrders();
    this.changed();
  }

  removeAtom(id: number): void {
    this.removeAtoms([id]);
  }

  /** Delete many atoms (and their bonds) as one change / one undo step. */
  removeAtoms(ids: Iterable<number>): void {
    const gone = new Set(ids);
    if (gone.size === 0) return;
    for (const b of [...this.bonds.values()]) if (gone.has(b.a) || gone.has(b.b)) this.bonds.delete(b.id);
    for (const id of gone) this.atoms.delete(id);
    if (this._mode === 'easy') this.autoAssignOrders();
    this.changed();
  }

  /**
   * Copy a set of atoms (with the bonds between them, charges and library-name tracking) as a
   * template that `addMolecule` can paste. Positions are kept, so callers offset them.
   */
  extract(ids: Iterable<number>): MoleculeTemplate | null {
    const list = [...new Set(ids)].filter((id) => this.atoms.has(id)).sort((a, b) => a - b);
    if (list.length === 0) return null;
    const index = new Map(list.map((id, i) => [id, i]));
    const groupIndex = new Map<number, number>();
    const originGroups: Origin[] = [];
    const atoms = list.map((id) => this.getAtom(id));
    const originIndex = atoms.map((a) => {
      if (a.origin === undefined || !this.origins.has(a.origin)) return -1;
      if (!groupIndex.has(a.origin)) {
        groupIndex.set(a.origin, originGroups.length);
        originGroups.push({ ...this.origins.get(a.origin)! });
      }
      return groupIndex.get(a.origin)!;
    });
    const bonds: [number, number, number][] = [];
    for (const b of this.bonds.values()) {
      if (index.has(b.a) && index.has(b.b)) bonds.push([index.get(b.a)!, index.get(b.b)!, b.order]);
    }
    return {
      name: '',
      symbols: atoms.map((a) => a.symbol),
      positions: atoms.map((a) => ({ x: a.x, y: a.y })),
      bonds,
      charges: atoms.map((a) => a.charge ?? 0),
      originIndex,
      originGroups,
    };
  }

  clear(): void {
    if (this.atoms.size === 0) return;
    this.atoms.clear();
    this.bonds.clear();
    this.origins.clear();
    this.changed();
  }

  // ---------- undo / redo (TSK-UI-006) ----------
  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Record the current state as one undo step if it differs from the last recorded state.
   * Structural edits commit automatically; the view calls this after a drag (moves only emit).
   */
  commit(): void {
    const snap = this.serialize();
    if (snap === this.baseline) return;
    this.undoStack.push(this.baseline);
    if (this.undoStack.length > HISTORY_LIMIT) this.undoStack.shift();
    this.redoStack = [];
    this.baseline = snap;
  }

  /** Accept the current state as the baseline without an undo step (e.g. automatic re-layout). */
  refreshBaseline(): void {
    this.baseline = this.serialize();
  }

  undo(): boolean {
    this.commit(); // keep any un-recorded move as its own step
    const prev = this.undoStack.pop();
    if (prev === undefined) return false;
    this.redoStack.push(this.baseline);
    this.restore(prev);
    return true;
  }

  redo(): boolean {
    const next = this.redoStack.pop();
    if (next === undefined) return false;
    this.undoStack.push(this.serialize());
    this.restore(next);
    return true;
  }

  private serialize(): string {
    const snap: Snapshot = {
      atoms: [...this.atoms.values()],
      bonds: [...this.bonds.values()],
      origins: [...this.origins.entries()],
      nextAtomId: this.nextAtomId,
      nextBondId: this.nextBondId,
      nextOrigin: this.nextOrigin,
    };
    return JSON.stringify(snap);
  }

  private restore(json: string): void {
    const snap = JSON.parse(json) as Snapshot;
    this.atoms = new Map(snap.atoms.map((a) => [a.id, a]));
    this.bonds = new Map(snap.bonds.map((b) => [b.id, b]));
    this.origins = new Map(snap.origins);
    this.nextAtomId = snap.nextAtomId;
    this.nextBondId = snap.nextBondId;
    this.nextOrigin = snap.nextOrigin;
    this.baseline = json;
    this._version++;
    this.emit();
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private changed(): void {
    this._version++;
    this.commit();
    this.emit();
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  // ---------- bond-order solving ----------
  private solveFragment(atomIds: number[]) {
    const ids = new Set(atomIds);
    const atoms = atomIds.map((id) => ({ id, valences: this.valencesOf(id) }));
    const bonds = this.getBonds().filter((b) => ids.has(b.a));
    return { bonds, solution: solveBondOrders(atoms, bonds) };
  }

  /** Easy mode: set every bond order to the best valence-satisfying assignment. */
  autoAssignOrders(): void {
    for (const frag of this.components()) {
      const { solution } = this.solveFragment(frag);
      for (const [id, order] of solution.orders) this.getBond(id).order = order as 1 | 2 | 3;
    }
  }

  /** Hard mode: ids of bonds whose order should change to satisfy more valences. */
  bondOrderIssues(): Set<number> {
    if (this.issuesCache?.version === this._version) return this.issuesCache.ids;
    const ids = new Set<number>();
    for (const frag of this.components()) {
      const { bonds, solution } = this.solveFragment(frag);
      if (!solution.exhaustive) continue; // never flag on an incomplete search
      for (const b of bonds) if (solution.orders.get(b.id) !== b.order) ids.add(b.id);
    }
    this.issuesCache = { version: this._version, ids };
    return ids;
  }

  // ---------- chemistry summaries ----------
  private components(): number[][] {
    const seen = new Set<number>();
    const adj = new Map<number, number[]>();
    for (const id of this.atoms.keys()) adj.set(id, []);
    for (const b of this.bonds.values()) {
      adj.get(b.a)!.push(b.b);
      adj.get(b.b)!.push(b.a);
    }
    const out: number[][] = [];
    for (const start of [...this.atoms.keys()].sort((x, y) => x - y)) {
      if (seen.has(start)) continue;
      const ids: number[] = [];
      const stack = [start];
      seen.add(start);
      while (stack.length) {
        const cur = stack.pop()!;
        ids.push(cur);
        for (const n of adj.get(cur)!) {
          if (!seen.has(n)) {
            seen.add(n);
            stack.push(n);
          }
        }
      }
      out.push(ids.sort((x, y) => x - y));
    }
    return out;
  }

  /** Connected components with formula, weight, implied ionic charge and library name. */
  fragments(): Fragment[] {
    const originCounts = new Map<number, number>();
    const originParts = new Map<number, number>();
    const comps = this.components();
    for (const a of this.atoms.values()) if (a.origin) originCounts.set(a.origin, (originCounts.get(a.origin) ?? 0) + 1);
    for (const ids of comps) {
      const o = this.getAtom(ids[0]).origin;
      if (o) originParts.set(o, (originParts.get(o) ?? 0) + 1);
    }
    return comps.map((ids) => {
      const atoms = ids.map((i) => this.getAtom(i));
      const symbols = atoms.map((a) => a.symbol);
      const formula = hillFormula(symbols);
      const formal = atoms.reduce((s, a) => s + (a.charge ?? 0), 0);
      const impliedCharge =
        formal -
        atoms
          .filter((a) => !a.charge && ANION_FORMERS.has(a.symbol) && this.bondsOf(a.id).length > 0)
          .reduce((s, a) => s + this.openValence(a.id), 0);
      // An untouched library placement keeps its exact name; edited ones fall back to formula lookup.
      // Records PubChem draws as separate ions (salts, B12's Co/CN⁻) arrive as several fragments:
      // known ions keep their own names, an otherwise-unnamed piece takes "<name> (part)".
      const o = atoms[0].origin ?? -1;
      const origin = this.origins.get(o);
      const pure = !!origin && atoms.every((a) => a.origin === o) && originCounts.get(o) === origin.size;
      const split = pure && (originParts.get(o) ?? 1) > 1;
      const lookup = lookupCompound(formula, impliedCharge);
      let match: CompoundMatch | null = ids.length > 1 ? lookup : null;
      if (pure && origin && !split && origin.formula === formula) {
        const others = lookup ? [lookup.name, ...lookup.isomers].filter((n) => n.toLowerCase() !== origin.name.toLowerCase()) : [];
        match = { name: origin.name, charge: impliedCharge, isomers: others };
      } else if (split && origin && !match && ids.length > 1) {
        match = { name: `${origin.name} (part)`, charge: impliedCharge, isomers: [] };
      }
      return {
        atomIds: ids,
        formula,
        molecularWeight: molecularWeight(symbols),
        impliedCharge,
        match,
        ...(split && origin ? { partOf: origin.name } : {}),
      };
    });
  }
}

/** Hill notation: C first, then H, then the rest alphabetically; without carbon, all alphabetical. */
export function hillFormula(symbols: string[]): string {
  const counts = new Map<string, number>();
  for (const s of symbols) counts.set(s, (counts.get(s) ?? 0) + 1);
  return hillFromCounts(counts);
}

export function hillFromCounts(counts: Map<string, number>): string {
  const keys = [...counts.keys()];
  let order: string[];
  if (counts.has('C')) {
    order = ['C', ...(counts.has('H') ? ['H'] : []), ...keys.filter((k) => k !== 'C' && k !== 'H').sort()];
  } else {
    order = keys.sort();
  }
  return order.map((k) => (counts.get(k)! > 1 ? `${k}${counts.get(k)}` : k)).join('');
}

/** Sum of standard atomic weights (g/mol). */
export function molecularWeight(symbols: string[]): number {
  return symbols.reduce((s, sym) => s + getElement(sym).mass, 0);
}

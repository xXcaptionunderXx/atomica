/**
 * ATOMICA 2D Sandbox Molecule Model — Task TSK-UI-001.
 * Pure data model (no DOM): atoms with 2D positions, bonds with order 1–3, valence-limited
 * bonding, connected-fragment detection, Hill-notation formulas and molecular weights.
 *
 * Bonding rule is the labelled valence APPROXIMATION documented in chemistry/elements.ts.
 */

import { getElement, maxValence } from '../chemistry/elements';

export interface SandboxAtom {
  id: number;
  symbol: string;
  x: number;
  y: number;
}

export interface SandboxBond {
  id: number;
  a: number;
  b: number;
  order: 1 | 2 | 3;
}

export type ValenceStatus = 'complete' | 'open' | 'inert';

export interface Fragment {
  atomIds: number[];
  formula: string;
  molecularWeight: number;
}

export interface BondResult {
  ok: boolean;
  bond?: SandboxBond;
  reason?: string;
}

export const MAX_BOND_ORDER = 3;

export class MoleculeModel {
  private atoms = new Map<number, SandboxAtom>();
  private bonds = new Map<number, SandboxBond>();
  private nextAtomId = 1;
  private nextBondId = 1;
  private listeners = new Set<() => void>();

  // ---------- queries ----------
  getAtoms(): SandboxAtom[] {
    return [...this.atoms.values()];
  }

  getBonds(): SandboxBond[] {
    return [...this.bonds.values()];
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

  freeValence(atomId: number): number {
    return maxValence(this.getAtom(atomId).symbol) - this.usedValence(atomId);
  }

  valenceStatus(atomId: number): ValenceStatus {
    const valences = getElement(this.getAtom(atomId).symbol).valences;
    if (valences.length === 0) return 'inert';
    return valences.includes(this.usedValence(atomId)) ? 'complete' : 'open';
  }

  // ---------- mutations ----------
  addAtom(symbol: string, x: number, y: number): SandboxAtom {
    getElement(symbol); // validates symbol
    const atom: SandboxAtom = { id: this.nextAtomId++, symbol, x, y };
    this.atoms.set(atom.id, atom);
    this.emit();
    return atom;
  }

  moveAtom(id: number, x: number, y: number): void {
    const a = this.getAtom(id);
    a.x = x;
    a.y = y;
    this.emit();
  }

  /** Why two atoms cannot gain one more bond order, or null if they can. */
  bondBlocker(a: number, b: number): string | null {
    if (a === b) return 'An atom cannot bond to itself';
    const atomA = this.getAtom(a);
    const atomB = this.getAtom(b);
    const existing = this.findBond(a, b);
    if (existing && existing.order >= MAX_BOND_ORDER) return 'Bond is already triple (maximum order)';
    for (const atom of [atomA, atomB]) {
      if (maxValence(atom.symbol) === 0) return `${getElement(atom.symbol).name} has no established bonding chemistry`;
      if (this.freeValence(atom.id) < 1) return `${atom.symbol} has no free valence left`;
    }
    return null;
  }

  /** Create a single bond, or raise an existing bond's order by one. */
  bond(a: number, b: number): BondResult {
    const blocker = this.bondBlocker(a, b);
    if (blocker) return { ok: false, reason: blocker };
    const existing = this.findBond(a, b);
    if (existing) {
      existing.order = (existing.order + 1) as 1 | 2 | 3;
      this.emit();
      return { ok: true, bond: existing };
    }
    const bond: SandboxBond = { id: this.nextBondId++, a, b, order: 1 };
    this.bonds.set(bond.id, bond);
    this.emit();
    return { ok: true, bond };
  }

  /** Cycle a bond 1 → 2 → 3 → 1, skipping orders that would exceed either atom's valence. */
  cycleBondOrder(bondId: number): SandboxBond {
    const bond = this.getBond(bondId);
    if (bond.order < MAX_BOND_ORDER && this.freeValence(bond.a) >= 1 && this.freeValence(bond.b) >= 1) {
      bond.order = (bond.order + 1) as 1 | 2 | 3;
    } else {
      bond.order = 1;
    }
    this.emit();
    return bond;
  }

  removeBond(id: number): void {
    this.bonds.delete(id);
    this.emit();
  }

  removeAtom(id: number): void {
    for (const b of this.bondsOf(id)) this.bonds.delete(b.id);
    this.atoms.delete(id);
    this.emit();
  }

  clear(): void {
    this.atoms.clear();
    this.bonds.clear();
    this.emit();
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  // ---------- chemistry summaries ----------
  /** Connected components, each with its Hill formula and molecular weight. */
  fragments(): Fragment[] {
    const seen = new Set<number>();
    const adj = new Map<number, number[]>();
    for (const id of this.atoms.keys()) adj.set(id, []);
    for (const b of this.bonds.values()) {
      adj.get(b.a)!.push(b.b);
      adj.get(b.b)!.push(b.a);
    }
    const out: Fragment[] = [];
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
      const symbols = ids.map((i) => this.getAtom(i).symbol);
      out.push({ atomIds: ids.sort((x, y) => x - y), formula: hillFormula(symbols), molecularWeight: molecularWeight(symbols) });
    }
    return out;
  }
}

/** Hill notation: C first, then H, then the rest alphabetically; without carbon, all alphabetical. */
export function hillFormula(symbols: string[]): string {
  const counts = new Map<string, number>();
  for (const s of symbols) counts.set(s, (counts.get(s) ?? 0) + 1);
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

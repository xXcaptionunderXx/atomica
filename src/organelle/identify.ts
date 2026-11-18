/**
 * Turns atomic-layer structures into organelle-layer "species" (TSK-UI-007).
 *
 * A copied selection is split into its connected molecules; each is named from its library origin
 * (when pasted intact) or by matching formula + charge against the biomolecule library, and is
 * classified structurally (classify.ts) so a hand-built lipid is recognised as a lipid.
 * LIMITATION: name matching of hand-built molecules is by formula, not full structure (isomers
 * share a name); the structural role, which decides membrane membership, is from the real graph.
 */
import { hillFormula, type MoleculeTemplate } from '../sandbox/MoleculeModel';
import type { Biomolecule } from '../chemistry/biomolecules/library';
import { classifyTemplate, type MoleculeRole } from './classify';

export interface Species {
  /** Pool / membrane key: library name, or "Unnamed <formula>" for unknown structures. */
  key: string;
  /** Library name when identified. */
  name: string | null;
  formula: string;
  charge: number;
  role: MoleculeRole;
  /** The structure itself (kept so Inspect can return it to the atomic layer). */
  template: MoleculeTemplate;
}

export interface LibraryIndex {
  byName: Map<string, Biomolecule>;
  byFormula: Map<string, Biomolecule[]>;
}

export function indexLibrary(list: Biomolecule[]): LibraryIndex {
  const byName = new Map<string, Biomolecule>();
  const byFormula = new Map<string, Biomolecule[]>();
  for (const m of list) {
    byName.set(m.name, m);
    const k = `${m.formula}|${m.charge}`;
    const arr = byFormula.get(k) ?? [];
    arr.push(m);
    byFormula.set(k, arr);
  }
  return { byName, byFormula };
}

/** Split a template into its connected molecules (each re-indexed from 0). */
export function splitTemplate(t: MoleculeTemplate): MoleculeTemplate[] {
  const n = t.symbols.length;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (const [a, b] of t.bonds) parent[find(a)] = find(b);
  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const r = find(i);
    const g = groups.get(r) ?? [];
    g.push(i);
    groups.set(r, g);
  }
  const out: MoleculeTemplate[] = [];
  for (const idx of groups.values()) {
    const map = new Map(idx.map((old, i) => [old, i]));
    const originIndex = t.originIndex ? idx.map((i) => t.originIndex![i]) : undefined;
    out.push({
      name: t.name,
      symbols: idx.map((i) => t.symbols[i]),
      positions: idx.map((i) => ({ ...t.positions[i] })),
      bonds: t.bonds.filter(([a]) => map.has(a)).map(([a, b, o]) => [map.get(a)!, map.get(b)!, o] as [number, number, number]),
      ...(t.charges ? { charges: idx.map((i) => t.charges![i] ?? 0) } : {}),
      ...(originIndex ? { originIndex, originGroups: t.originGroups } : {}),
    });
  }
  return out;
}

/** Identify one connected molecule. */
export function identify(t: MoleculeTemplate, lib: LibraryIndex): Species {
  const formula = hillFormula(t.symbols);
  const charge = (t.charges ?? []).reduce((s, c) => s + (c ?? 0), 0);
  let name: string | null = null;

  // 1. An intact library placement keeps its exact name.
  if (t.originIndex && t.originGroups) {
    const g = t.originIndex[0];
    const group = g >= 0 ? t.originGroups[g] : undefined;
    if (group && t.originIndex.every((x) => x === g) && group.size === t.symbols.length && lib.byName.has(group.name)) name = group.name;
  } else if (t.name && lib.byName.get(t.name)?.formula === formula) {
    name = t.name;
  }
  // 2. Otherwise match formula + charge (then formula alone: hand-built atoms carry no charges).
  if (!name) {
    const hits = lib.byFormula.get(`${formula}|${charge}`) ?? lib.byFormula.get(`${formula}|0`);
    if (hits?.length) name = hits[0].name;
  }
  const libCharge = name ? (lib.byName.get(name)?.charge ?? charge) : charge;
  return {
    key: name ?? `Unnamed ${formula}`,
    name,
    formula,
    charge: libCharge,
    role: classifyTemplate(t).role,
    template: t,
  };
}

/** Identify every molecule in a (possibly multi-molecule) clipboard template. */
export function identifyAll(t: MoleculeTemplate, lib: LibraryIndex): Species[] {
  return splitTemplate(t).map((part) => identify(part, lib));
}

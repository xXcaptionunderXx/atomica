/**
 * Biomolecule library (TSK-UI-005): 1000+ real structures (PubChem 2D records, explicit hydrogens,
 * kekulized bond orders, formal charges) bundled offline in library.json, built from names.txt by
 * scripts/build-biomolecule-library.mjs. Loaded lazily so app start-up stays fast.
 */
import type { MoleculeTemplate } from '../../sandbox/MoleculeModel';
import { registerCompounds } from '../compoundNames';

/** Compact on-disk record (see the build script). */
export interface RawBiomolecule {
  id: number; // PubChem CID
  n: string; // display name
  c: string; // category
  f: string; // Hill formula (all atoms)
  q: number; // net formal charge
  y?: string[]; // synonyms
  a: string; // space-separated element symbols
  p: number[]; // x0,y0,x1,y1,... (PubChem 2D units x100, y up)
  b: number[]; // a0,b0,order0,... (0-based atom indices)
  z?: number[]; // atomIndex,charge,... (non-zero formal charges)
}

export interface Biomolecule {
  cid: number;
  name: string;
  category: string;
  formula: string;
  charge: number;
  synonyms: string[];
  atomCount: number;
  /** Lower-cased text searched by the library panel. */
  haystack: string;
  raw: RawBiomolecule;
}

let cache: Promise<Biomolecule[]> | null = null;

export function decode(raw: RawBiomolecule): Biomolecule {
  const synonyms = raw.y ?? [];
  return {
    cid: raw.id,
    name: raw.n,
    category: raw.c,
    formula: raw.f,
    charge: raw.q,
    synonyms,
    atomCount: raw.a.split(' ').length,
    haystack: [raw.n, raw.f, ...synonyms].join(' | ').toLowerCase(),
    raw,
  };
}

/** Loads (once) and decodes the bundled library, registering every name for formula lookup. */
export function loadBiomolecules(): Promise<Biomolecule[]> {
  cache ??= import('./library.json').then((mod) => {
    const data = (mod.default ?? mod) as unknown as { molecules: RawBiomolecule[] };
    const list = data.molecules.map(decode);
    registerCompounds(list.map((m) => ({ formula: m.formula, name: m.name, charge: m.charge })));
    return list;
  });
  return cache;
}

/** Categories in the order they appear in names.txt. */
export function categoriesOf(list: Biomolecule[]): string[] {
  return [...new Set(list.map((m) => m.category))];
}

/**
 * Ranked search: exact name > name prefix > word prefix > substring (name, synonyms, formula).
 * An empty query returns everything (optionally filtered by category) in library order.
 */
export function searchBiomolecules(list: Biomolecule[], query: string, category?: string): Biomolecule[] {
  const pool = category ? list.filter((m) => m.category === category) : list;
  const q = query.trim().toLowerCase();
  if (!q) return pool;
  const scored: { m: Biomolecule; s: number }[] = [];
  for (const m of pool) {
    const name = m.name.toLowerCase();
    let s = -1;
    if (name === q || m.formula.toLowerCase() === q) s = 0;
    else if (name.startsWith(q)) s = 1;
    else if (new RegExp(`(^|[\\s(,-])${escapeRe(q)}`).test(name)) s = 2;
    else if (m.synonyms.some((y) => y.toLowerCase().startsWith(q))) s = 3;
    else if (m.haystack.includes(q)) s = 4;
    if (s >= 0) scored.push({ m, s });
  }
  return scored.sort((a, b) => a.s - b.s || a.m.name.length - b.m.name.length).map((x) => x.m);
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sandbox template centred on (cx, cy). PubChem 2D bonds are ~1 unit long; `bondPx` sets the
 * on-screen bond length, shrunk (down to `minBondPx`) so big molecules fit `fit` when given.
 */
export function toTemplate(
  m: Biomolecule,
  cx: number,
  cy: number,
  bondPx: number,
  fit?: { width: number; height: number; minBondPx: number },
): MoleculeTemplate {
  const r = m.raw;
  const symbols = r.a.split(' ');
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < symbols.length; i++) {
    xs.push(r.p[2 * i] / 100);
    ys.push(-r.p[2 * i + 1] / 100); // SDF y points up, screen y points down
  }
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  let scale = bondPx;
  if (fit && symbols.length > 1) {
    const w = Math.max(maxX - minX, 1e-6);
    const h = Math.max(maxY - minY, 1e-6);
    scale = Math.max(fit.minBondPx, Math.min(bondPx, (fit.width * 0.9) / w, (fit.height * 0.9) / h));
  }
  const mx = (minX + maxX) / 2;
  const my = (minY + maxY) / 2;
  const positions = xs.map((x, i) => ({ x: cx + (x - mx) * scale, y: cy + (ys[i] - my) * scale }));
  const bonds: [number, number, number][] = [];
  for (let i = 0; i + 2 < r.b.length; i += 3) bonds.push([r.b[i], r.b[i + 1], r.b[i + 2]]);
  const charges = new Array<number>(symbols.length).fill(0);
  for (let i = 0; r.z && i + 1 < r.z.length; i += 2) charges[r.z[i]] = r.z[i + 1];
  return { name: m.name, symbols, positions, bonds, charges };
}

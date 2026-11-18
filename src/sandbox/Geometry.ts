/**
 * VSEPR molecular geometry for the 2D sandbox "geometry grid" — Task TSK-UI-004.
 *
 * Science (labelled approximations, Section 20):
 *  - Shape from VSEPR: steric number = σ-bonded neighbours + lone pairs, where
 *    lone pairs = floor((valence electrons − Σ bond orders) / 2) for main-group atoms.
 *    Transition metals / f-block are treated as having no stereochemically active lone pairs.
 *  - Angles shown are idealised VSEPR values; real molecules deviate (e.g. H2S is 92°, not ≈104.5°).
 *  - 3D shapes are drawn as a standard 2D projection: in-plane bonds, wedges (towards viewer)
 *    and dashes (away). Labels state the true 3D angle even where the projection cannot.
 *  - Bond lengths: sum of single-bond covalent radii (Cordero et al., Dalton Trans. 2008),
 *    scaled ×0.87 for double and ×0.78 for triple bonds (C–C 1.54 → C=C 1.34 → C≡C 1.20 Å ratios).
 *  - Isolated rings are drawn as regular planar polygons; fused ring systems fall back to a
 *    spring relaxation.
 */

import { getElement } from '../chemistry/elements';

export interface GeoAtom {
  id: number;
  symbol: string;
  x: number;
  y: number;
}

export interface GeoBond {
  id: number;
  a: number;
  b: number;
  order: number;
}

export interface AtomGeometry {
  atomId: number;
  neighbors: number;
  lonePairs: number;
  stericNumber: number;
  shape: string | null;
  angleLabel: string | null;
  /** Absolute screen angles (radians) where lone pairs are drawn. */
  lonePairAngles: number[];
  /** Two absolute bond directions (radians) spanning the labelled angle, or null. */
  arc: [number, number] | null;
}

export interface BondStyle {
  bondId: number;
  /** Narrow end of the wedge/dash. */
  from: number;
  depth: 0 | 1 | -1;
}

export interface LayoutResult {
  positions: Map<number, { x: number; y: number }>;
  bondStyles: Map<number, BondStyle>;
  geometry: Map<number, AtomGeometry>;
}

export const PX_PER_ANGSTROM = 60;

/** Single-bond covalent radii, Å (Cordero et al. 2008; C = sp3 value). */
const COVALENT_RADII: Record<string, number> = {
  H: 0.31, He: 0.28, Li: 1.28, Be: 0.96, B: 0.84, C: 0.76, N: 0.71, O: 0.66, F: 0.57, Ne: 0.58,
  Na: 1.66, Mg: 1.41, Al: 1.21, Si: 1.11, P: 1.07, S: 1.05, Cl: 1.02, Ar: 1.06,
  K: 2.03, Ca: 1.76, Sc: 1.7, Ti: 1.6, V: 1.53, Cr: 1.39, Mn: 1.39, Fe: 1.32, Co: 1.26, Ni: 1.24,
  Cu: 1.32, Zn: 1.22, Ga: 1.22, Ge: 1.2, As: 1.19, Se: 1.2, Br: 1.2, Kr: 1.16,
  Rb: 2.2, Sr: 1.95, Y: 1.9, Zr: 1.75, Nb: 1.64, Mo: 1.54, Tc: 1.47, Ru: 1.46, Rh: 1.42, Pd: 1.39,
  Ag: 1.45, Cd: 1.44, In: 1.42, Sn: 1.39, Sb: 1.39, Te: 1.38, I: 1.39, Xe: 1.4,
  Cs: 2.44, Ba: 2.15, La: 2.07, Hf: 1.75, Ta: 1.7, W: 1.62, Re: 1.51, Os: 1.44, Ir: 1.41, Pt: 1.36,
  Au: 1.36, Hg: 1.32, Tl: 1.45, Pb: 1.46, Bi: 1.48, Po: 1.4, At: 1.5, Rn: 1.5, U: 1.96,
};
const DEFAULT_RADIUS = 1.5;
const ORDER_FACTOR = [1, 1, 0.87, 0.78];

export function bondLengthAngstrom(a: string, b: string, order: number): number {
  const r = (s: string) => COVALENT_RADII[s] ?? DEFAULT_RADIUS;
  return (r(a) + r(b)) * ORDER_FACTOR[Math.min(Math.max(order, 1), 3)];
}

/** Valence electrons for main-group elements; null for d/f-block. */
export function valenceElectrons(symbol: string): number | null {
  const e = getElement(symbol);
  if (e.symbol === 'He') return 2;
  if (e.group === null) return null;
  if (e.group <= 2) return e.group;
  if (e.group >= 13) return e.group - 10;
  return null;
}

const SHAPES: Record<string, [string, string]> = {
  '2:0': ['linear', '180°'],
  '3:0': ['trigonal planar', '120°'],
  '2:1': ['bent', '<120°'],
  '4:0': ['tetrahedral', '109.5°'],
  '3:1': ['trigonal pyramidal', '≈107°'],
  '2:2': ['bent', '≈104.5°'],
  '5:0': ['trigonal bipyramidal', '90°/120°'],
  '4:1': ['seesaw', '<90°/<120°'],
  '3:2': ['T-shaped', '≈90°'],
  '2:3': ['linear', '180°'],
  '6:0': ['octahedral', '90°'],
  '5:1': ['square pyramidal', '≈90°'],
  '4:2': ['square planar', '90°'],
  '7:0': ['pentagonal bipyramidal', '72°/90°'],
};

export function vseprShape(neighbors: number, lonePairs: number): { shape: string; angle: string } | null {
  const s = SHAPES[`${neighbors}:${lonePairs}`];
  return s ? { shape: s[0], angle: s[1] } : null;
}

interface Template {
  /** [angle in degrees relative to the parent bond, depth]; index 0 is the in-plane parent slot. */
  bonds: [number, 0 | 1 | -1][];
  lps: number[];
  arc: [number, number] | null;
}

const T: Record<string, Template> = {
  '2:0': { bonds: [[0, 0], [180, 0]], lps: [], arc: [0, 1] },
  '3:0': { bonds: [[0, 0], [120, 0], [240, 0]], lps: [], arc: [0, 1] },
  '2:1': { bonds: [[0, 0], [117, 0]], lps: [238.5], arc: [0, 1] },
  '4:0': { bonds: [[0, 0], [109.5, 0], [199.75, 1], [269.75, -1]], lps: [], arc: [0, 1] },
  '3:1': { bonds: [[0, 0], [120, 1], [240, -1]], lps: [180], arc: [0, 1] },
  '2:2': { bonds: [[0, 0], [104.5, 0]], lps: [202.25, 262.25], arc: [0, 1] },
  '5:0': { bonds: [[0, 0], [180, 0], [90, 0], [240, 1], [300, -1]], lps: [], arc: [0, 2] },
  '4:1': { bonds: [[0, 0], [180, 0], [240, 1], [300, -1]], lps: [90], arc: [0, 2] },
  '3:2': { bonds: [[0, 0], [180, 0], [90, 0]], lps: [240, 300], arc: [0, 2] },
  '2:3': { bonds: [[0, 0], [180, 0]], lps: [90, 225, 315], arc: [0, 1] },
  '6:0': { bonds: [[0, 0], [180, 0], [90, 0], [270, 0], [135, 1], [315, -1]], lps: [], arc: [0, 2] },
  '5:1': { bonds: [[0, 0], [180, 0], [90, 0], [270, 0], [135, 1]], lps: [315], arc: [0, 2] },
  '4:2': { bonds: [[0, 0], [90, 0], [180, 0], [270, 0]], lps: [45, 225], arc: [0, 1] },
};

function template(n: number, L: number): Template {
  const t = T[`${n}:${L}`];
  if (t) return t;
  if (n <= 1) {
    const lps = L === 1 ? [180] : L === 2 ? [150, 210] : L >= 3 ? [120, 180, 240] : [];
    return { bonds: n === 1 ? [[0, 0]] : [], lps: n === 0 ? [0, 90, 180, 270].slice(0, L) : lps, arc: null };
  }
  return { bonds: Array.from({ length: n }, (_, i) => [(360 * i) / n, 0] as [number, 0]), lps: [], arc: null };
}

const rad = (deg: number) => (deg * Math.PI) / 180;
const angleOf = (from: { x: number; y: number }, to: { x: number; y: number }) => Math.atan2(to.y - from.y, to.x - from.x);

/** Lay out one connected fragment. Positions are re-centred on the fragment's current centroid. */
export function layoutFragment(atoms: GeoAtom[], bonds: GeoBond[]): LayoutResult {
  const byId = new Map(atoms.map((a) => [a.id, a]));
  const adj = new Map<number, { other: number; bond: GeoBond }[]>(atoms.map((a) => [a.id, []]));
  for (const b of bonds) {
    adj.get(b.a)!.push({ other: b.b, bond: b });
    adj.get(b.b)!.push({ other: b.a, bond: b });
  }

  // Lone pairs per atom.
  const lonePairs = new Map<number, number>();
  for (const a of atoms) {
    const v = valenceElectrons(a.symbol);
    const used = adj.get(a.id)!.reduce((s, e) => s + e.bond.order, 0);
    lonePairs.set(a.id, v === null ? 0 : Math.max(0, Math.floor((v - used) / 2)));
  }

  const rings = findIsolatedRings(atoms, adj);
  const ringOf = new Map<number, number[]>();
  for (const r of rings ?? []) for (const id of r) ringOf.set(id, r);

  const pos = new Map<number, { x: number; y: number }>();
  const parent = new Map<number, number>();
  const flip = new Map<number, number>();
  const bondStyles = new Map<number, BondStyle>();
  const ringCenter = new Map<number, { x: number; y: number }>();
  const lpAngles = new Map<number, number[]>();
  const arcs = new Map<number, [number, number] | null>();

  const len = (a: number, b: number, order: number) =>
    bondLengthAngstrom(byId.get(a)!.symbol, byId.get(b)!.symbol, order) * PX_PER_ANGSTROM;

  const root = [...atoms].sort((p, q) => adj.get(q.id)!.length - adj.get(p.id)!.length || p.id - q.id)[0];
  pos.set(root.id, { x: 0, y: 0 });
  flip.set(root.id, 1);
  const queue = [root.id];

  const placeRing = (ring: number[], x: number) => {
    const k = ring.length;
    const bondLen =
      ring.reduce((s, id, i) => {
        const nxt = ring[(i + 1) % k];
        const bond = adj.get(id)!.find((e) => e.other === nxt)!.bond;
        return s + len(id, nxt, bond.order);
      }, 0) / k;
    const R = bondLen / (2 * Math.sin(Math.PI / k));
    const px = pos.get(x)!;
    const p = parent.get(x);
    const away = p !== undefined ? angleOf(pos.get(p)!, px) : rad(90);
    const c = { x: px.x + R * Math.cos(away), y: px.y + R * Math.sin(away) };
    const start = angleOf(c, px);
    const j = ring.indexOf(x);
    for (let m = 0; m < k; m++) {
      const id = ring[(j + m) % k];
      ringCenter.set(id, c);
      if (m === 0) continue;
      const ang = start + (2 * Math.PI * m) / k;
      pos.set(id, { x: c.x + R * Math.cos(ang), y: c.y + R * Math.sin(ang) });
      parent.set(id, x);
      flip.set(id, 1);
      queue.push(id);
    }
  };

  while (queue.length) {
    const x = queue.shift()!;
    const ring = ringOf.get(x);
    if (ring && !ringCenter.has(x)) placeRing(ring, x);

    const px = pos.get(x)!;
    const nbrs = adj.get(x)!;
    const children = nbrs
      .filter((e) => !pos.has(e.other))
      .sort((p, q) => adj.get(q.other)!.length - adj.get(p.other)!.length || p.other - q.other);
    const L = lonePairs.get(x)!;
    const dirs: { angle: number; depth: 0 | 1 | -1 }[] = [];

    if (ringCenter.has(x)) {
      const out = angleOf(ringCenter.get(x)!, px);
      const n = children.length;
      if (n === 1) dirs.push({ angle: out, depth: 0 });
      else if (n === 2) dirs.push({ angle: out - rad(35), depth: 1 }, { angle: out + rad(35), depth: -1 });
      else for (let i = 0; i < n; i++) dirs.push({ angle: out + rad(40) * (i - (n - 1) / 2), depth: 0 });
      lpAngles.set(x, Array.from({ length: L }, (_, i) => out + rad(30) * (i - (L - 1) / 2)));
      arcs.set(x, null);
    } else {
      const t = template(nbrs.length, L);
      const s = flip.get(x)!;
      const p = parent.get(x);
      let base: number;
      let slots: number[];
      if (p !== undefined) {
        base = angleOf(px, pos.get(p)!);
        slots = t.bonds.map((_, i) => i).slice(1);
      } else {
        base = t.bonds.length >= 2 ? rad(90 - (t.bonds[0][0] + t.bonds[1][0]) / 2) : 0;
        slots = t.bonds.map((_, i) => i);
      }
      const abs = (deg: number) => base + s * rad(deg);
      slots.sort((i, j) => Math.abs(t.bonds[i][1]) - Math.abs(t.bonds[j][1]) || t.bonds[j][1] - t.bonds[i][1]);
      // Mirroring within the page plane (zig-zag chains) does not change wedge/dash depth.
      for (const i of slots) dirs.push({ angle: abs(t.bonds[i][0]), depth: t.bonds[i][1] });
      lpAngles.set(x, t.lps.map(abs));
      arcs.set(x, t.arc && nbrs.length >= 2 ? [abs(t.bonds[t.arc[0]][0]), abs(t.bonds[t.arc[1]][0])] : null);
    }

    children.forEach((c, i) => {
      const d = dirs[i] ?? { angle: rad(37 * i), depth: 0 as const };
      const l = len(x, c.other, c.bond.order);
      pos.set(c.other, { x: px.x + l * Math.cos(d.angle), y: px.y + l * Math.sin(d.angle) });
      parent.set(c.other, x);
      flip.set(c.other, -(flip.get(x) ?? 1));
      if (d.depth !== 0 && c.bond.order === 1) bondStyles.set(c.bond.id, { bondId: c.bond.id, from: x, depth: d.depth });
      queue.push(c.other);
    });
  }

  // Fused / bridged rings were not placed as polygons: relax bond lengths.
  if (rings === null) relax(atoms, bonds, pos, len);

  // Re-centre on the fragment's current centroid so the molecule stays where the user put it.
  const cx = atoms.reduce((s, a) => s + a.x, 0) / atoms.length;
  const cy = atoms.reduce((s, a) => s + a.y, 0) / atoms.length;
  const nx = [...pos.values()].reduce((s, p) => s + p.x, 0) / atoms.length;
  const ny = [...pos.values()].reduce((s, p) => s + p.y, 0) / atoms.length;
  for (const p of pos.values()) {
    p.x += cx - nx;
    p.y += cy - ny;
  }

  const geometry = new Map<number, AtomGeometry>();
  for (const a of atoms) {
    const n = adj.get(a.id)!.length;
    const L = lonePairs.get(a.id)!;
    const shape = n >= 2 ? vseprShape(n, L) : null;
    geometry.set(a.id, {
      atomId: a.id,
      neighbors: n,
      lonePairs: L,
      stericNumber: n + L,
      shape: shape?.shape ?? null,
      angleLabel: shape && !ringCenter.has(a.id) ? shape.angle : null,
      lonePairAngles: lpAngles.get(a.id) ?? [],
      arc: arcs.get(a.id) ?? null,
    });
  }
  return { positions: pos, bondStyles, geometry };
}

/**
 * Simple rings (each atom in at most one cycle) → list of cycles in ring order.
 * Returns null for fused/bridged systems; [] when acyclic.
 */
function findIsolatedRings(atoms: GeoAtom[], adj: Map<number, { other: number }[]>): number[][] | null {
  const parent = new Map<number, number | null>();
  const depth = new Map<number, number>();
  const cycles: number[][] = [];
  const stack: [number, number | null][] = [[atoms[0].id, null]];
  const visitedEdges = new Set<string>();
  // Iterative DFS building a spanning tree; every non-tree edge closes exactly one cycle.
  const order: number[] = [];
  while (stack.length) {
    const [x, p] = stack.pop()!;
    if (parent.has(x)) continue;
    parent.set(x, p);
    depth.set(x, p === null ? 0 : depth.get(p)! + 1);
    order.push(x);
    for (const e of adj.get(x)!) if (!parent.has(e.other)) stack.push([e.other, x]);
  }
  for (const x of order) {
    for (const e of adj.get(x)!) {
      const y = e.other;
      const key = x < y ? `${x}-${y}` : `${y}-${x}`;
      if (visitedEdges.has(key)) continue;
      visitedEdges.add(key);
      if (parent.get(x) === y || parent.get(y) === x) continue;
      // Non-tree edge x–y: walk both up to their common ancestor.
      const left: number[] = [];
      const right: number[] = [];
      let u: number = x;
      let v: number = y;
      while (u !== v) {
        if (depth.get(u)! >= depth.get(v)!) {
          left.push(u);
          u = parent.get(u)!;
        } else {
          right.push(v);
          v = parent.get(v)!;
        }
      }
      cycles.push([...left, u, ...right.reverse()]);
    }
  }
  const count = new Map<number, number>();
  for (const c of cycles) for (const id of c) count.set(id, (count.get(id) ?? 0) + 1);
  if ([...count.values()].some((v) => v > 1)) return null;
  return cycles;
}

function relax(
  atoms: GeoAtom[],
  bonds: GeoBond[],
  pos: Map<number, { x: number; y: number }>,
  len: (a: number, b: number, order: number) => number,
): void {
  // Same spring model as before, on typed arrays (large fused systems such as B12 or steroids
  // have hundreds of atoms, and the pairwise repulsion is O(n^2) per iteration).
  const n = atoms.length;
  const index = new Map(atoms.map((a, i) => [a.id, i]));
  const x = new Float64Array(n);
  const y = new Float64Array(n);
  atoms.forEach((a, i) => {
    const p = pos.get(a.id)!;
    x[i] = p.x;
    y[i] = p.y;
  });
  const bonded = new Uint8Array(n * n);
  const bi = bonds.map((b) => index.get(b.a)!);
  const bj = bonds.map((b) => index.get(b.b)!);
  const rest = bonds.map((b) => len(b.a, b.b, b.order));
  for (let k = 0; k < bonds.length; k++) {
    bonded[bi[k] * n + bj[k]] = 1;
    bonded[bj[k] * n + bi[k]] = 1;
  }
  const fx = new Float64Array(n);
  const fy = new Float64Array(n);
  for (let iter = 0; iter < 400; iter++) {
    fx.fill(0);
    fy.fill(0);
    for (let k = 0; k < bonds.length; k++) {
      const a = bi[k];
      const b = bj[k];
      const dx = x[b] - x[a];
      const dy = y[b] - y[a];
      const d = Math.hypot(dx, dy) || 0.01;
      const f = (0.2 * (d - rest[k])) / d;
      fx[a] += f * dx;
      fy[a] += f * dy;
      fx[b] -= f * dx;
      fy[b] -= f * dy;
    }
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = x[j] - x[i];
        if (dx > 110 || dx < -110) continue;
        const dy = y[j] - y[i];
        if (dy > 110 || dy < -110 || bonded[i * n + j]) continue;
        const d = Math.hypot(dx, dy) || 0.01;
        if (d > 110) continue;
        const f = (0.15 * (110 - d)) / d;
        fx[i] -= f * dx;
        fy[i] -= f * dy;
        fx[j] += f * dx;
        fy[j] += f * dy;
      }
    }
    for (let i = 0; i < n; i++) {
      x[i] += fx[i];
      y[i] += fy[i];
    }
  }
  atoms.forEach((a, i) => pos.set(a.id, { x: x[i], y: y[i] }));
}

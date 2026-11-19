/**
 * Organelle-layer view (TSK-UI-007, art rehaul TSK-UI-010): a textbook-style diagram of the ONE
 * organelle being built.
 *
 * - Membranes are drawn as real bilayers (two leaflets of head groups around a hydrophobic core;
 *   lipid droplets get a monolayer). Each clickable membrane patch is one coarse-grained lipid unit
 *   of the model, coloured by its lipid class; the beads inside a patch are drawing density, not a
 *   molecule count. Missing units are drawn as a dashed gap.
 * - Compartments are shaded (matrix, intermembrane space, stroma, thylakoid lumen, nucleoplasm...).
 * - Proteins are recognisable glyphs at their real location and orientation (ATP synthase F1 head
 *   in the matrix, complex I's peripheral arm, porins as barrels, nuclear pores spanning both
 *   membranes...), with H⁺ arrows on the pumps showing which way protons move.
 * - Context that the model does not simulate (mtDNA, mitoribosomes, starch, nucleolus, chromatin,
 *   ER ribosomes, Golgi vesicles...) is drawn as non-interactive illustration so the picture reads
 *   like a real diagram; it never changes the simulation.
 *
 * Shapes are schematic, not to scale: topology (cristae folds, grana stacks, cisternae, the
 * double nuclear envelope) is right; measured geometry is not.
 */
import { COMPONENTS, type Blueprint, type Shape } from '../organelle/blueprints';
import type { OrganelleModel } from '../organelle/OrganelleModel';

const SVG_NS = 'http://www.w3.org/2000/svg';
type Pt = { x: number; y: number };
interface Loop {
  membrane: string;
  pts: Pt[];
}
interface Anchor {
  p: Pt;
  nx: number;
  ny: number;
}
interface Spot {
  p: Pt;
  rot?: number;
}
interface Callout {
  text: string;
  at: Pt;
  side: 'l' | 'r';
}
interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OrganelleViewCallbacks {
  onInspectSpecies(key: string): void;
  onProtein(componentId: string): void;
  notify(msg: string): void;
}

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

function titled<T extends SVGElement>(e: T, text: string): T {
  const t = el('title');
  t.textContent = text;
  e.append(t);
  return e;
}

/* ------------------------------------------------------------------ colours */

/** Lipid / cofactor classes get fixed textbook colours; anything else a stable hashed hue. */
const CLASS_COLORS: [RegExp, string][] = [
  [/cholesteryl/i, '#e8a85c'],
  [/cholesterol|sterol/i, '#e9cf4f'],
  [/cardiolipin/i, '#e39a2b'],
  [/sphingomyelin|ceramide/i, '#7bb662'],
  [/digalactosyl|DGDG/i, '#3f9b62'],
  [/monogalactosyl|MGDG/i, '#9ccc65'],
  [/phosphatidylcholine|POPC|DOPC|DPPC|lecithin/i, '#3aa6b9'],
  [/POPE|ethanolamine/i, '#5b7fd1'],
  [/POPS|phosphatidylserine/i, '#e0745a'],
  [/POPG|phosphatidylglycerol/i, '#b07fd6'],
  [/triolein|triacylglycerol|triglyceride/i, '#f2c14e'],
  [/chlorophyll b/i, '#79c25a'],
  [/chlorophyll/i, '#2e8b57'],
  [/carotene|carotenoid/i, '#f08a24'],
  [/quinone|Q10|ubiquinol/i, '#d9822b'],
  [/FAD|flavin/i, '#e7c23a'],
];

/** Stable colour per species name (also used by the side panel's chips). */
export function speciesColor(key: string): string {
  for (const [re, c] of CLASS_COLORS) if (re.test(key)) return c;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 55% 55%)`;
}

/** Lighten (f > 0) or darken (f < 0) a #rrggbb colour. */
function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(f >= 0 ? c + (255 - c) * f : c * (1 + f)));
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = [16, 8, 0].map((s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t));
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** Radial gradients for compartments: [id, centre colour, edge colour]. */
const GRADIENTS: [string, string, string][] = [
  ['mito-matrix', '#fcd9b6', '#f0a36c'],
  ['mito-ims', '#fdeedd', '#f8d3b2'],
  ['chl-ims', '#eef7e6', '#d5ecc4'],
  ['chl-stroma', '#d9efc8', '#a5d48b'],
  ['chl-lumen', '#86c97c', '#4c9a4f'],
  ['nuc-pns', '#f3ecfa', '#e2d3f2'],
  ['nuc-plasm', '#ebe0f6', '#c8b0e5'],
  ['nucleolus', '#a585cc', '#6f4f9a'],
  ['er', '#dbe9f8', '#a7c7ec'],
  ['golgi', '#fde0ea', '#f0a9c2'],
  ['perox', '#edf6da', '#c4df96'],
  ['ld', '#fff4c4', '#f2c443'],
  ['ves', '#e6f2fc', '#b9d9f2'],
  ['cbx', '#e3f5e6', '#acdcb4'],
  ['lsu', '#c4dbf5', '#7da6de'],
  ['ssu', '#fde8b4', '#efc15c'],
  ['starch', '#ffffff', '#e7e2d3'],
];
const url = (id: string) => `url(#og-${id})`;

/* ------------------------------------------------------------------ geometry */

const ring = (n: number, f: (t: number) => Pt): Pt[] => Array.from({ length: n }, (_, i) => f((i / n) * Math.PI * 2));
const ellipse =
  (a: number, b: number, cx = 0, cy = 0) =>
  (t: number): Pt => ({ x: cx + a * Math.cos(t), y: cy + b * Math.sin(t) });
const pathOf = (pts: Pt[], close = true) => `M${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L')}${close ? 'Z' : ''}`;
const A = (x: number, y: number, nx: number, ny: number): Anchor => ({ p: { x, y }, nx, ny });

/**
 * A curved, flattened sac (ER sheet / Golgi cisterna) along an arc; `half` may vary along the arc
 * (u = 0..1) to give dilated rims. Traversed so that the outward normal points out of the sac.
 */
function arcSac(cx: number, cy: number, r: number, from: number, to: number, half: number | ((u: number) => number)): Pt[] {
  const hf = typeof half === 'number' ? () => half : half;
  const n = 48;
  const outer: Pt[] = [];
  const inner: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const t = from + (to - from) * u;
    const hh = hf(u);
    outer.push({ x: cx + (r + hh) * Math.cos(t), y: cy + (r + hh) * Math.sin(t) });
    inner.push({ x: cx + (r - hh) * Math.cos(t), y: cy + (r - hh) * Math.sin(t) });
  }
  const cap = (t: number, sign: number, hh: number): Pt[] => {
    const c = { x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) };
    const rad = { x: Math.cos(t), y: Math.sin(t) };
    const tan = { x: -Math.sin(t), y: Math.cos(t) };
    const pts: Pt[] = [];
    for (let i = 1; i < 10; i++) {
      const u = (i / 10) * Math.PI;
      pts.push({
        x: c.x + hh * (sign * Math.cos(u) * rad.x + sign * Math.sin(u) * tan.x),
        y: c.y + hh * (sign * Math.cos(u) * rad.y + sign * Math.sin(u) * tan.y),
      });
    }
    return pts;
  };
  return [...outer, ...cap(to, 1, hf(1)), ...inner.reverse(), ...cap(from, -1, hf(0))];
}

/** Flattened disc (thylakoid) traversed clockwise on screen, so normals point out of the disc. */
function roundedRect(cx: number, cy: number, w: number, h: number): Pt[] {
  const r = h / 2;
  const pts: Pt[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = -Math.PI / 2 + (i / 12) * Math.PI;
    pts.push({ x: cx + w / 2 - r + r * Math.cos(t), y: cy + r * Math.sin(t) });
  }
  for (let i = 0; i <= 12; i++) {
    const t = Math.PI / 2 + (i / 12) * Math.PI;
    pts.push({ x: cx - w / 2 + r + r * Math.cos(t), y: cy + r * Math.sin(t) });
  }
  return pts;
}

/**
 * Inner mitochondrial membrane: an ellipse with lamellar cristae folding in alternately from the
 * top and bottom. Same winding as `ellipse`, so the outward normal points into the intermembrane
 * space / crista lumen everywhere.
 */
function cristaeLoop(a: number, b: number, folds: { x: number; top: boolean; tip: number }[], w: number): Pt[] {
  const pts: Pt[] = [];
  const E = (t: number): Pt => ({ x: a * Math.cos(t), y: b * Math.sin(t) });
  const N = 360;
  const windows = folds.map((f) => {
    // Bottom half (t in 0..π) runs right→left; top half (π..2π) runs left→right.
    const t1 = f.top ? 2 * Math.PI - Math.acos((f.x - w / 2) / a) : Math.acos((f.x + w / 2) / a);
    const t2 = f.top ? 2 * Math.PI - Math.acos((f.x + w / 2) / a) : Math.acos((f.x - w / 2) / a);
    return { f, t1, t2 };
  });
  windows.sort((p, q) => p.t1 - q.t1);
  let wi = 0;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const win = windows[wi];
    if (win && t >= win.t1) {
      const { f, t1, t2 } = win;
      const A1 = E(t1);
      const B1 = E(t2);
      const r = w / 2;
      const dir = f.top ? 1 : -1; // fold grows downward from the top, upward from the bottom
      const cy = f.tip - dir * r; // centre of the rounded tip
      pts.push(A1);
      for (let k = 1; k <= 6; k++) pts.push({ x: A1.x, y: A1.y + ((cy - A1.y) * k) / 6 });
      for (let k = 1; k < 14; k++) {
        const th = f.top ? Math.PI - (k / 14) * Math.PI : -(k / 14) * Math.PI;
        pts.push({ x: f.x + r * Math.cos(th), y: cy + r * Math.sin(th) });
      }
      for (let k = 0; k <= 6; k++) pts.push({ x: B1.x, y: cy + ((B1.y - cy) * k) / 6 });
      while (i < N && (i / N) * Math.PI * 2 <= t2) i++;
      i--;
      wi++;
      continue;
    }
    pts.push(E(t));
  }
  return pts;
}

/** Evenly spaced positions (with outward normals) along all loops of one membrane. */
function along(loops: Loop[], n: number, phase = 0.5): Anchor[] {
  if (n <= 0 || loops.length === 0) return [];
  const segs: { a: Pt; b: Pt; len: number }[] = [];
  for (const l of loops)
    for (let i = 0; i < l.pts.length; i++) {
      const a = l.pts[i];
      const b = l.pts[(i + 1) % l.pts.length];
      segs.push({ a, b, len: Math.hypot(b.x - a.x, b.y - a.y) });
    }
  const total = segs.reduce((s, g) => s + g.len, 0);
  const out: Anchor[] = [];
  let si = 0;
  let acc = 0;
  for (let k = 0; k < n; k++) {
    const target = ((k + phase) / n) * total;
    while (si < segs.length - 1 && acc + segs[si].len < target) acc += segs[si++].len;
    const g = segs[si];
    const u = g.len ? (target - acc) / g.len : 0;
    const dx = (g.b.x - g.a.x) / (g.len || 1);
    const dy = (g.b.y - g.a.y) / (g.len || 1);
    out.push({ p: { x: g.a.x + (g.b.x - g.a.x) * u, y: g.a.y + (g.b.y - g.a.y) * u }, nx: dy, ny: -dx });
  }
  return out;
}

/** Uniformly resample a closed polyline. */
function resample(pts: Pt[], step: number): Pt[] {
  const out: Pt[] = [];
  let carry = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    let d = carry;
    while (d < len) {
      const u = d / len;
      out.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
      d += step;
    }
    carry = d - len;
  }
  return out;
}

/** Uniformly resample an open polyline (includes the first point). */
function resampleOpen(pts: Pt[], step: number): Pt[] {
  const out: Pt[] = [];
  let carry = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    let d = carry;
    while (d < len) {
      out.push({ x: a.x + ((b.x - a.x) * d) / len, y: a.y + ((b.y - a.y) * d) / len });
      d += step;
    }
    carry = d - len;
  }
  return out;
}

/** Smoothed outward vertex normals of a closed, uniformly sampled polyline. */
function normals(pts: Pt[]): Pt[] {
  const n = pts.length;
  return pts.map((_, i) => {
    const a = pts[(i - 2 + n) % n];
    const b = pts[(i + 2) % n];
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const l = Math.hypot(tx, ty) || 1;
    return { x: ty / l, y: -tx / l };
  });
}

interface Run {
  pts: Pt[];
  nrm: Pt[];
}

/** Split all loops of a membrane into `units` equal-length patches (one per lipid unit). */
function patches(loops: Loop[], units: number, step = 2.4): Run[][] {
  const out: Run[][] = Array.from({ length: units }, () => []);
  if (units <= 0) return out;
  const rs = loops.map((l) => {
    const p = resample(l.pts, step);
    return { p, n: normals(p) };
  });
  const total = rs.reduce((s, r) => s + r.p.length, 0);
  const per = total / units;
  let idx = 0;
  for (const r of rs) {
    let run: Run | null = null;
    let cur = -1;
    for (let i = 0; i <= r.p.length; i++) {
      const j = i % r.p.length;
      const u = Math.min(units - 1, Math.floor((idx + Math.min(i, r.p.length - 1)) / per));
      if (u !== cur) {
        if (run) {
          run.pts.push(r.p[j]);
          run.nrm.push(r.n[j]);
        }
        run = { pts: [], nrm: [] };
        out[u].push(run);
        cur = u;
      }
      run!.pts.push(r.p[j]);
      run!.nrm.push(r.n[j]);
    }
    idx += r.p.length;
  }
  return out;
}

const offsetD = (runs: Run[], d: number) => runs.map((r) => pathOf(r.pts.map((p, i) => ({ x: p.x + r.nrm[i].x * d, y: p.y + r.nrm[i].y * d })), false)).join('');

/** Leaflet head-group offset from the membrane midplane (world units). */
const HEAD = 6.6;

/* ------------------------------------------------------------------ protein glyphs */

interface GlyphOut {
  top: number;
  bottom: number;
  half: number;
}
type Draw = (g: SVGGElement, c: string) => GlyphOut;

function circ(g: SVGGElement, x: number, y: number, r: number, fill: string): void {
  g.append(el('circle', { cx: x, cy: y, r, fill, stroke: shade(fill, -0.35), 'stroke-width': 0.8, class: 'pg' }));
}
function rrect(g: SVGGElement, x: number, y: number, w: number, h: number, rx: number, fill: string, extra: Record<string, string | number> = {}): void {
  g.append(el('rect', { x, y, width: w, height: h, rx, fill, stroke: shade(fill, -0.35), 'stroke-width': 0.8, class: 'pg', ...extra }));
}
function helixBundle(g: SVGGElement, n: number, c: string, h = 24): number {
  const w = 6;
  const gap = 1.2;
  const total = n * w + (n - 1) * gap;
  for (let i = 0; i < n; i++) rrect(g, -total / 2 + i * (w + gap), -h / 2, w, h, w / 2, i % 2 ? shade(c, 0.18) : c);
  return total / 2;
}

const atp: Draw = (g, c) => {
  const dark = shade(c, -0.3);
  g.append(el('path', { d: 'M14,8 C18,-8 19,-24 13,-38', fill: 'none', stroke: dark, 'stroke-width': 3, 'stroke-linecap': 'round', class: 'pg' }));
  rrect(g, -2.6, -32, 5.2, 24, 2, shade(c, -0.2));
  rrect(g, -13, -11, 26, 22, 6, shade(c, -0.12));
  for (const x of [-7, -2.3, 2.3, 7]) g.append(el('line', { x1: x, y1: -9, x2: x, y2: 9, stroke: shade(c, -0.4), 'stroke-width': 0.7, opacity: 0.6, class: 'pg-line' }));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    circ(g, Math.cos(a) * 8.5, -45 + Math.sin(a) * 6.5, 7, i % 2 ? shade(c, 0.3) : c);
  }
  circ(g, 0, -45, 4, shade(c, -0.15));
  return { top: -54, bottom: 11, half: 16 };
};

const complexI: Draw = (g, c) => {
  rrect(g, -5, -58, 17, 52, 8, shade(c, 0.15), { transform: 'rotate(14 3 -8)' });
  rrect(g, -34, -10, 46, 20, 7, c);
  for (const x of [-26, -18, -10, -2, 6]) g.append(el('line', { x1: x, y1: -7, x2: x, y2: 7, stroke: shade(c, -0.4), 'stroke-width': 0.7, opacity: 0.5, class: 'pg-line' }));
  return { top: -58, bottom: 10, half: 34 };
};

const lobed =
  (tmW: number, up: [number, number, number][], down: [number, number, number][], tmH = 22): Draw =>
  (g, c) => {
    for (const [x, y, r] of up) circ(g, x, y, r, shade(c, 0.22));
    for (const [x, y, r] of down) circ(g, x, y, r, shade(c, 0.1));
    rrect(g, -tmW / 2, -tmH / 2, tmW, tmH, 7, c);
    const ys = [...up, ...down].map(([, y, r]) => [y - r, y + r]).flat();
    const xs = [...up, ...down].map(([x, , r]) => Math.abs(x) + r);
    return { top: Math.min(-tmH / 2, ...ys), bottom: Math.max(tmH / 2, ...ys), half: Math.max(tmW / 2, ...xs) };
  };

const helices =
  (n: number, up: [number, number, number][] = [], down: [number, number, number][] = []): Draw =>
  (g, c) => {
    for (const [x, y, r] of up) circ(g, x, y, r, shade(c, 0.2));
    for (const [x, y, r] of down) circ(g, x, y, r, shade(c, 0.1));
    const half = helixBundle(g, n, c);
    const ys = [...up, ...down].map(([, y, r]) => [y - r, y + r]).flat();
    const xs = [...up, ...down].map(([x, , r]) => Math.abs(x) + r);
    return { top: Math.min(-12, ...ys), bottom: Math.max(12, ...ys), half: Math.max(half, ...xs) };
  };

const barrel =
  (arms = false): Draw =>
  (g, c) => {
    if (arms) {
      for (const s of [-1, 1]) {
        g.append(el('line', { x1: s * 6, y1: -10, x2: s * 13, y2: -21, stroke: shade(c, -0.3), 'stroke-width': 2, class: 'pg' }));
        circ(g, s * 14, -24, 5, shade(c, 0.25));
      }
    }
    rrect(g, -11, -12, 22, 24, 6, c);
    rrect(g, -5, -10, 10, 20, 4, shade(c, 0.35));
    for (const x of [-8, 8]) g.append(el('line', { x1: x, y1: -9, x2: x, y2: 9, stroke: shade(c, -0.35), 'stroke-width': 0.7, class: 'pg-line' }));
    return { top: arms ? -29 : -12, bottom: 12, half: arms ? 19 : 11 };
  };

const sec61: Draw = (g, c) => {
  // Translocon with a docked ribosome on the cytosolic face and the nascent chain threading into the lumen.
  g.append(el('path', { d: 'M0,-14 C4,-4 -4,4 2,12 C6,18 -3,22 1,26', fill: 'none', stroke: '#d6457a', 'stroke-width': 1.6, class: 'pg-line' }));
  rrect(g, -13, -12, 10, 24, 4, c);
  rrect(g, 3, -12, 10, 24, 4, shade(c, 0.15));
  g.append(el('ellipse', { cx: 0, cy: -19, rx: 13, ry: 6, fill: '#c9b8e8', stroke: '#7a62ad', 'stroke-width': 0.8, class: 'pg' }));
  circ(g, 0, -33, 11, '#9c84cf');
  return { top: -44, bottom: 26, half: 14 };
};

const lamp: Draw = (g, c) => {
  // Single-pass protein with a heavily glycosylated luminal domain (the lysosomal glycocalyx).
  const glycan = '#b88bd6';
  for (const [x, y, a] of [
    [-14, 26, -30],
    [14, 26, 30],
    [-10, 38, -10],
    [10, 38, 10],
    [0, 42, 0],
  ] as const) {
    const g2 = el('g', { transform: `translate(${x},${y}) rotate(${a})`, class: 'pg-line' });
    g2.append(el('path', { d: 'M0,0 L0,7 M0,4 L-3,8 M0,4 L3,8', stroke: glycan, 'stroke-width': 1.2, fill: 'none' }));
    g.append(g2);
  }
  circ(g, 0, 24, 12, shade(c, 0.15));
  rrect(g, -3, -12, 6, 26, 3, c);
  return { top: -12, bottom: 50, half: 18 };
};

const npc: Draw = (g, c) => {
  // Spans both nuclear membranes (outer at y=0, inner at y=+30): cytoplasmic filaments above, basket below.
  const dark = shade(c, -0.35);
  for (const s of [-1, 1]) {
    g.append(el('path', { d: `M${s * 14},-8 C${s * 18},-20 ${s * 28},-22 ${s * 26},-32`, fill: 'none', stroke: dark, 'stroke-width': 1.6, class: 'pg' }));
    g.append(el('path', { d: `M${s * 14},38 C${s * 12},50 ${s * 6},56 ${s * 3},60`, fill: 'none', stroke: dark, 'stroke-width': 1.4, class: 'pg' }));
  }
  g.append(el('circle', { cx: 0, cy: 61, r: 4, fill: 'none', stroke: dark, 'stroke-width': 1.4, class: 'pg' }));
  rrect(g, -8, -6, 16, 42, 3, shade(c, 0.55), { opacity: 0.85 });
  for (const y of [2, 10, 18, 26]) g.append(el('line', { x1: -7, y1: y, x2: 7, y2: y + 3, stroke: dark, 'stroke-width': 0.5, opacity: 0.6, class: 'pg-line' }));
  rrect(g, -21, -9, 13, 48, 5, c);
  rrect(g, 8, -9, 13, 48, 5, c);
  return { top: -34, bottom: 64, half: 28 };
};

const gm130: Draw = (g, c) => {
  g.append(el('path', { d: 'M0,-8 C5,-16 -5,-24 0,-32 C5,-40 -5,-46 0,-54', fill: 'none', stroke: shade(c, -0.2), 'stroke-width': 3.2, 'stroke-linecap': 'round', class: 'pg' }));
  circ(g, 0, -57, 4.5, shade(c, 0.2));
  circ(g, 0, -6, 6, c);
  return { top: -62, bottom: 0, half: 8 };
};

const surface =
  (rx: number, ry: number, y: number): Draw =>
  (g, c) => {
    g.append(el('ellipse', { cx: 0, cy: y, rx, ry, fill: c, stroke: shade(c, -0.35), 'stroke-width': 0.8, class: 'pg' }));
    g.append(el('ellipse', { cx: -rx * 0.3, cy: y - ry * 0.3, rx: rx * 0.35, ry: ry * 0.35, fill: shade(c, 0.4), opacity: 0.7, class: 'pg-line' }));
    return { top: y - ry, bottom: y + ry, half: rx };
  };

const pex5: Draw = (g, c) => {
  rrect(g, -3, -12, 6, 24, 3, shade(c, -0.15));
  circ(g, 2, -20, 9, c);
  circ(g, 12, -27, 4.5, '#b78ad9');
  return { top: -32, bottom: 12, half: 17 };
};

// Soluble proteins (centred on 0,0).
const blob =
  (parts: [number, number, number][], dot?: string): Draw =>
  (g, c) => {
    parts.forEach(([x, y, r], i) => circ(g, x, y, r, i % 2 ? shade(c, 0.2) : c));
    if (dot) g.append(el('rect', { x: -2.2, y: -2.2, width: 4.4, height: 4.4, fill: dot, class: 'pg-line', transform: 'rotate(45)' }));
    const ys = parts.map(([, y, r]) => [y - r, y + r]).flat();
    return { top: Math.min(...ys), bottom: Math.max(...ys), half: Math.max(...parts.map(([x, , r]) => Math.abs(x) + r)) };
  };

const rubisco: Draw = (g, c) => {
  // L8S8 hexadecamer: two rings of large subunits capped by small subunits.
  for (const x of [-9, -3, 3, 9]) circ(g, x, -12, 3.2, shade(c, 0.4));
  for (const x of [-9, -3, 3, 9]) circ(g, x, 12, 3.2, shade(c, 0.4));
  for (let i = 0; i < 4; i++) {
    circ(g, -10.5 + i * 7, -4, 4.6, i % 2 ? shade(c, 0.15) : c);
    circ(g, -10.5 + i * 7, 4, 4.6, i % 2 ? c : shade(c, 0.15));
  }
  return { top: -15, bottom: 15, half: 15 };
};

const pdh: Draw = (g, c) => {
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    circ(g, Math.cos(a) * 17, Math.sin(a) * 17, 5, i % 3 === 0 ? shade(c, 0.35) : shade(c, 0.15));
  }
  circ(g, 0, 0, 14, c);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.append(el('circle', { cx: Math.cos(a) * 7, cy: Math.sin(a) * 7, r: 1.6, fill: shade(c, -0.3), class: 'pg-line' }));
  }
  return { top: -22, bottom: 22, half: 22 };
};

const nucleosome: Draw = (g, c) => {
  g.append(el('ellipse', { cx: 0, cy: 0, rx: 10, ry: 8.5, fill: c, stroke: shade(c, -0.35), 'stroke-width': 0.8, class: 'pg' }));
  g.append(el('path', { d: 'M-15,4 C-15,-10 -6,-12 0,-12 C9,-12 14,-6 13,2 C12,10 4,12 -4,11 C-10,10 -13,7 -13,4', fill: 'none', stroke: '#4c5fd0', 'stroke-width': 2.4, 'stroke-linecap': 'round', class: 'pg-line' }));
  return { top: -12, bottom: 12, half: 15 };
};

const polII: Draw = (g, c) => {
  g.append(el('path', { d: 'M-18,-2 C-20,-16 -6,-20 4,-16 C14,-12 18,-4 12,2 L2,-2 L10,8 C6,16 -10,18 -16,10 C-19,6 -18,3 -18,-2Z', fill: c, stroke: shade(c, -0.35), 'stroke-width': 0.8, class: 'pg' }));
  g.append(el('path', { d: 'M-26,0 C-10,-2 6,0 26,-1', fill: 'none', stroke: '#4c5fd0', 'stroke-width': 2.2, class: 'pg-line' }));
  g.append(el('path', { d: 'M2,-2 C8,-12 16,-18 24,-24', fill: 'none', stroke: '#d6457a', 'stroke-width': 1.5, class: 'pg-line' }));
  return { top: -24, bottom: 17, half: 26 };
};

const shellTile: Draw = (g, c) => {
  const hex = Array.from({ length: 6 }, (_, i) => ({ x: 13 * Math.cos((i * Math.PI) / 3), y: 13 * Math.sin((i * Math.PI) / 3) }));
  g.append(el('path', { d: pathOf(hex), fill: c, stroke: shade(c, -0.35), 'stroke-width': 1, class: 'pg' }));
  g.append(el('circle', { cx: 0, cy: 0, r: 3, fill: shade(c, 0.5), class: 'pg-line' }));
  return { top: -13, bottom: 13, half: 13 };
};

interface GlyphDef {
  color: string;
  draw: Draw;
  /** Proton movement in the glyph frame (up = towards the peripheral side). */
  hplus?: 'up' | 'down';
  short?: string;
  /** Too numerous / self-evident to label individually (a callout covers them). */
  quiet?: boolean;
}

const GLYPHS: Record<string, GlyphDef> = {
  // Mitochondrion (peripheral side of the inner membrane = matrix).
  'atp-synthase': { color: '#f0a64a', draw: atp, hplus: 'up', short: 'ATP synthase' },
  'complex-i': { color: '#5c84e6', draw: complexI, hplus: 'down', short: 'I' },
  'complex-ii': { color: '#3fae9f', draw: lobed(16, [[-3, -21, 10], [8, -34, 8]], []), short: 'II' },
  'complex-iii': { color: '#9b6bd6', draw: lobed(38, [[-10, -18, 9], [10, -18, 9]], [[-9, 15, 6], [9, 15, 6]]), hplus: 'down', short: 'III' },
  'complex-iv': { color: '#e06666', draw: lobed(28, [[0, -16, 7]], [[-7, 15, 7], [8, 14, 5]]), hplus: 'down', short: 'IV' },
  'cytochrome-c': { color: '#d94848', draw: blob([[0, 0, 6.5]], '#7a1d1d'), short: 'cyt c' },
  vdac: { color: '#b98351', draw: barrel(), short: 'VDAC' },
  tom: { color: '#c99a5b', draw: barrel(true), short: 'TOM' },
  mpc: { color: '#58b5d9', draw: helices(2), short: 'MPC' },
  ant: { color: '#7cb35b', draw: helices(3), short: 'ANT' },
  pdh: { color: '#8d7bc9', draw: pdh, short: 'PDH' },
  'citrate-synthase': { color: '#5aa0c8', draw: blob([[-7, 0, 9], [7, 0, 9]]), short: 'CS' },
  // Chloroplast (peripheral side of the thylakoid = stroma).
  lhcii: { color: '#7ac74f', draw: lobed(40, [], [], 18), short: 'LHCII' },
  psii: { color: '#2f8f4e', draw: lobed(46, [[0, -15, 6]], [[-12, 16, 8], [10, 16, 7]]), hplus: 'down', short: 'PSII' },
  b6f: { color: '#c46ad6', draw: lobed(32, [[0, -14, 5]], [[-8, 15, 6], [8, 15, 6]]), hplus: 'down', short: 'b6f' },
  psi: { color: '#1f7a8c', draw: lobed(44, [[0, -17, 8]], [[-12, 14, 5]]), short: 'PSI' },
  'cf-atp-synthase': { color: '#f0a64a', draw: atp, hplus: 'up', short: 'ATP synthase' },
  plastocyanin: { color: '#3a7bd5', draw: blob([[0, 0, 5]], '#0e3d80'), short: 'PC' },
  fnr: { color: '#e5b33a', draw: blob([[-5, 0, 7], [6, 1, 6]]), short: 'FNR' },
  rubisco: { color: '#3e9e6b', draw: rubisco, short: 'RuBisCO' },
  // Nucleus.
  npc: { color: '#9b8bb5', draw: npc, short: 'NPC' },
  nucleosome: { color: '#eab3cc', draw: nucleosome, quiet: true },
  rnap2: { color: '#e0904f', draw: polII, short: 'Pol II' },
  // ER / Golgi.
  sec61: { color: '#4f8fd6', draw: sec61, short: 'Sec61' },
  serca: { color: '#e37b5f', draw: helices(3, [[-8, -21, 8], [8, -24, 9], [0, -37, 7.5]]), short: 'SERCA' },
  bip: { color: '#58b88d', draw: blob([[-5, 0, 7], [7, 0, 5]]), short: 'BiP' },
  gm130: { color: '#d46aa3', draw: gm130, short: 'GM130' },
  sgms1: { color: '#7d9ee8', draw: helices(3), short: 'SMS1' },
  // Lysosome (peripheral side = cytosol).
  'v-atpase': { color: '#e39b3c', draw: atp, hplus: 'down', short: 'V-ATPase' },
  lamp1: { color: '#7a87d6', draw: lamp, short: 'LAMP1' },
  'cathepsin-b': { color: '#d6635f', draw: blob([[-5, -2, 7], [6, 2, 6]]), short: 'CTSB' },
  gaa: { color: '#4fae9f', draw: blob([[-6, 0, 7], [6, -2, 6], [1, 7, 5]]), short: 'GAA' },
  lal: { color: '#e6b84a', draw: blob([[-4, 0, 7.5], [7, 2, 5]]), short: 'LAL' },
  // Peroxisome.
  pex5: { color: '#6aa0e0', draw: pex5, short: 'PEX5' },
  daao: { color: '#b78ad9', draw: blob([[-7, 0, 8], [7, 0, 8]]), short: 'DAAO' },
  catalase: { color: '#d65c5c', draw: blob([[-6, -6, 6.5], [6, -6, 6.5], [-6, 6, 6.5], [6, 6, 6.5]]), short: 'CAT' },
  // Lipid droplet (amphipathic surface proteins sit in the monolayer).
  plin1: { color: '#e08a5a', draw: surface(18, 6, -5), short: 'PLIN1' },
  atgl: { color: '#5aa0c8', draw: surface(11, 9, -6), short: 'ATGL' },
  // Carboxysome.
  csos1a: { color: '#4f9a62', draw: shellTile, quiet: true },
  csosca: { color: '#d6a24a', draw: blob([[-5, 0, 6], [5, 0, 6]]), short: 'CA' },
  'cso-rubisco': { color: '#3e9e6b', draw: rubisco, short: 'RuBisCO' },
  // Ribosome scene.
  eef1a: { color: '#e6a23c', draw: blob([[-7, 0, 8], [6, -6, 6], [6, 7, 6]]), short: 'eEF1A' },
  eef2: { color: '#7f74d8', draw: blob([[-12, 0, 6], [-2, -3, 7], [9, 0, 6], [16, 6, 5]]), short: 'eEF2' },
};

function glyphFor(component: string, spans: boolean): GlyphDef {
  const known = GLYPHS[component];
  if (known) return known;
  return { color: speciesColor(component).startsWith('#') ? speciesColor(component) : '#8b7fd0', draw: spans ? helices(3) : blob([[-5, 0, 7], [6, 2, 6]]) };
}

/* ------------------------------------------------------------------ layouts */

interface Layout {
  loops: Loop[];
  /** Compartment fills, painted bottom-up behind the membranes (class org-lumen). */
  fills: { d: string; fill: string; outer?: boolean }[];
  /** Which side of each membrane its proteins' peripheral domains face: +1 = outward normal. */
  side: Record<string, 1 | -1>;
  /** Explicit positions for membrane proteins (by component); others are spread evenly. */
  anchors?: Record<string, Anchor[]>;
  spot(component: string, k: number, i: number): Spot;
  /** Cofactor/core slot positions; `membrane` = drawn at the midplane of that membrane. */
  slot?(slotIdx: number, k: number): { p: Pt; membrane?: boolean };
  slotMembrane?: string;
  decorBack?(g: SVGGElement): void;
  decorFront?(g: SVGGElement): void;
  callouts: Callout[];
  /** Organelle bounds (world units), before labels. */
  box: Box;
}

function boxOf(pts: Pt[], pad = 0): Box {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return { x0: Math.min(...xs) - pad, y0: Math.min(...ys) - pad, x1: Math.max(...xs) + pad, y1: Math.max(...ys) + pad };
}

const spiral = (r: number, flat = 1, cx = 0, cy = 0) => (i: number, n: number): Pt => {
  const a = i * 2.39996;
  const rr = r * Math.sqrt((i + 0.5) / Math.max(1, n));
  return { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr * flat };
};

/** Small decorative bilayer vesicle (no data, not clickable). */
function vesicle(g: SVGGElement, cx: number, cy: number, r: number, lumen: string, head = '#3aa6b9'): void {
  const d = `M${cx - r},${cy}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`;
  g.append(el('circle', { cx, cy, r: r - 4, fill: lumen, class: 'org-decor' }));
  g.append(el('path', { d, class: 'org-decor mem-core', fill: 'none', 'stroke-width': 2 * HEAD - 2 }));
  for (const rr of [r + HEAD - 1, r - HEAD + 1]) {
    const dd = `M${cx - rr},${cy}a${rr},${rr} 0 1,0 ${2 * rr},0a${rr},${rr} 0 1,0 ${-2 * rr},0`;
    g.append(el('path', { d: dd, class: 'org-decor mem-heads', stroke: head, fill: 'none', 'stroke-width': 4.4, 'stroke-dasharray': '0 6.2', 'stroke-linecap': 'round' }));
  }
}

function freeRibosome(g: SVGGElement, x: number, y: number, rot = 0): void {
  const r = el('g', { class: 'org-decor', transform: `translate(${x},${y}) rotate(${rot})` });
  r.append(el('circle', { cx: 0, cy: -2.2, r: 4.4, fill: '#8d74c4' }), el('ellipse', { cx: 0, cy: 3.4, rx: 3.6, ry: 2.4, fill: '#b9a6e3' }));
  g.append(r);
}

function squiggle(pts: Pt[], amp: number, waves: number): string {
  // Smooth wobbly path through `pts` (decorative DNA / chromatin fibres).
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / len;
    const ny = (b.x - a.x) / len;
    for (let k = 0; k < 20; k++) {
      const u = k / 20;
      const w = Math.sin((i + u) * waves * Math.PI) * amp;
      out.push({ x: a.x + (b.x - a.x) * u + nx * w, y: a.y + (b.y - a.y) * u + ny * w });
    }
  }
  out.push(pts[pts.length - 1]);
  return pathOf(out, false);
}

function layoutFor(shape: Shape): Layout {
  switch (shape) {
    case 'mitochondrion': {
      const ia = 326;
      const ib = 156;
      const folds = [
        { x: -212, top: true, tip: 40 },
        { x: -106, top: false, tip: -40 },
        { x: 0, top: true, tip: 40 },
        { x: 106, top: false, tip: -40 },
        { x: 212, top: true, tip: 40 },
      ];
      const W = 46;
      const outer = ring(240, ellipse(360, 190));
      const inner = cristaeLoop(ia, ib, folds, W);
      const rimY = (x: number, top: boolean) => (top ? -1 : 1) * ib * Math.sqrt(Math.max(0, 1 - (x / ia) ** 2));
      const rimA = (x: number, top: boolean): Anchor => {
        const y = rimY(x, top);
        const nx = x / ia ** 2;
        const ny = y / ib ** 2;
        const l = Math.hypot(nx, ny);
        return A(x, y, nx / l, ny / l);
      };
      const ims = [{ x: 0, y: -62 }, { x: 0, y: -18 }, { x: -212, y: -40 }, { x: -106, y: 54 }];
      const matrix = [{ x: -282, y: 0 }, { x: 284, y: 38 }, { x: -53, y: 20 }, { x: 53, y: 20 }, { x: -159, y: 0 }, { x: 159, y: 0 }];
      let m = 0;
      return {
        loops: [{ membrane: 'outer', pts: outer }, { membrane: 'inner', pts: inner }],
        fills: [
          { d: pathOf(outer), fill: url('mito-ims'), outer: true },
          { d: pathOf(inner), fill: url('mito-matrix') },
        ],
        side: { outer: 1, inner: -1 },
        anchors: {
          // ATP synthase dimers sit at the crista ridges; the respiratory chain lines the crista walls (I → III → IV
          // on one wall, II opposite); carriers in the inner boundary membrane.
          'atp-synthase': [A(-106, -40, 0, 1), A(106, -40, 0, 1)],
          'complex-i': [A(-W / 2, -112, 1, 0)],
          'complex-iii': [A(-W / 2, -62, 1, 0)],
          'complex-iv': [A(-W / 2, -18, 1, 0)],
          'complex-ii': [A(W / 2, -128, -1, 0)],
          ant: [rimA(0, false)],
          mpc: [rimA(-250, false)],
          vdac: [rimA(-130, true), rimA(260, false)].map((a) => ({ ...a, p: { x: (a.p.x * 360) / ia, y: (a.p.y * 190) / ib } })),
          tom: [rimA(120, true)].map((a) => ({ ...a, p: { x: (a.p.x * 360) / ia, y: (a.p.y * 190) / ib } })),
        },
        spot: (component) => ({ p: component === 'cytochrome-c' ? ims.shift() ?? { x: 0, y: -40 } : matrix[m++ % matrix.length] }),
        slotMembrane: 'inner',
        slot: (_s, k) => ({ p: [{ x: -W / 2, y: -88 }, { x: -W / 2, y: -38 }, { x: W / 2, y: -60 }, { x: W / 2, y: -20 }][k % 4], membrane: true }),
        decorBack: (g) => {
          // mtDNA nucleoid, mitoribosomes and matrix granules.
          g.append(el('path', { d: squiggle([{ x: 262, y: -58 }, { x: 302, y: -48 }, { x: 298, y: -14 }, { x: 264, y: -20 }, { x: 262, y: -58 }], 3, 3), class: 'org-decor dna' }));
          for (const [x, y, r] of [[-159, -95, 20], [159, 95, 0], [53, 100, 40], [-282, 50, 10], [-159, 92, 70]] as const) freeRibosome(g, x, y, r);
          for (const [x, y] of [[-285, -45], [159, -60], [-53, 70]] as const) g.append(el('circle', { cx: x, cy: y, r: 3.4, class: 'org-decor granule' }));
        },
        callouts: [
          { text: 'Outer membrane', at: { x: -250, y: -137 }, side: 'l' },
          { text: 'Intermembrane space', at: { x: -305, y: -71 }, side: 'l' },
          { text: 'Inner membrane', at: { x: -326, y: 0 }, side: 'l' },
          { text: 'Mitoribosome', at: { x: -159, y: 92 }, side: 'l' },
          { text: 'Crista', at: { x: 212, y: -60 }, side: 'r' },
          { text: 'mtDNA nucleoid', at: { x: 282, y: -36 }, side: 'r' },
          { text: 'Matrix', at: { x: 159, y: 0 }, side: 'r' },
          { text: 'Crista lumen (= IMS)', at: { x: 106, y: 80 }, side: 'r' },
        ],
        box: { x0: -360, y0: -190, x1: 360, y1: 190 },
      };
    }
    case 'chloroplast': {
      const outer = ring(240, ellipse(390, 205));
      const inner = ring(240, ellipse(360, 175));
      const stacks = [
        { x: -230, n: 3 },
        { x: -115, n: 4 },
        { x: 0, n: 5 },
        { x: 115, n: 4 },
        { x: 230, n: 3 },
      ];
      const DW = 84;
      const DH = 30;
      const SP = 50;
      const discs: Pt[][] = [];
      for (const s of stacks) for (let k = 0; k < s.n; k++) discs.push(roundedRect(s.x, (k - (s.n - 1) / 2) * SP, DW, DH));
      const face = (sx: number, top: boolean) => {
        const n = stacks.find((s) => s.x === sx)!.n;
        return ((top ? -1 : 1) * ((n - 1) * SP + DH)) / 2;
      };
      const stroma = [{ x: -230, y: 100 }, { x: 0, y: 147 }, { x: -230, y: -100 }];
      let si = 0;
      return {
        loops: [{ membrane: 'outer', pts: outer }, { membrane: 'inner', pts: inner }, ...discs.map((pts) => ({ membrane: 'thylakoid', pts }))],
        fills: [
          { d: pathOf(outer), fill: url('chl-ims'), outer: true },
          { d: pathOf(inner), fill: url('chl-stroma') },
          ...discs.map((pts) => ({ d: pathOf(pts), fill: url('chl-lumen') })),
        ],
        side: { outer: 1, inner: 1, thylakoid: 1 },
        anchors: {
          // PSII + LHCII in the grana, PSI and the ATP synthase on stroma-exposed faces (lateral heterogeneity).
          lhcii: [A(-137, face(-115, true), 0, -1), A(-93, face(-115, true), 0, -1)],
          psii: [A(0, face(0, true), 0, -1)],
          b6f: [A(115, face(115, true), 0, -1)],
          psi: [A(230, face(230, false), 0, 1)],
          'cf-atp-synthase': [A(-115, face(-115, false), 0, 1)],
        },
        spot: (component) =>
          component === 'plastocyanin' ? { p: { x: 140, y: -75 } } : component === 'fnr' ? { p: { x: 272, y: 96 } } : { p: stroma[si++ % stroma.length] },
        slotMembrane: 'thylakoid',
        decorBack: (g) => {
          // Stroma lamellae joining the grana (thylakoid network).
          for (let i = 0; i < stacks.length - 1; i++) {
            const y = i % 2 ? 25 : -25;
            const x0 = stacks[i].x + DW / 2 - 14;
            const x1 = stacks[i + 1].x - DW / 2 + 14;
            g.append(el('path', { d: pathOf(roundedRect((x0 + x1) / 2, y, x1 - x0, 14)), class: 'org-decor lamella' }));
          }
          // Starch grain, plastoglobuli, plastid DNA, 70S ribosomes.
          g.append(el('ellipse', { cx: -318, cy: 0, rx: 24, ry: 42, fill: url('starch'), class: 'org-decor starch' }));
          for (const r of [14, 8]) g.append(el('ellipse', { cx: -318, cy: 0, rx: r * 0.55, ry: r, class: 'org-decor starch-ring' }));
          for (const [x, y, r] of [[318, -30, 8], [330, 6, 6], [308, 22, 7]] as const) g.append(el('circle', { cx: x, cy: y, r, class: 'org-decor plastoglobule' }));
          g.append(el('path', { d: squiggle([{ x: -60, y: 145 }, { x: -30, y: 158 }, { x: -50, y: 135 }, { x: -75, y: 150 }], 2.5, 3), class: 'org-decor dna' }));
          for (const [x, y] of [[-172, 120], [172, 125], [-172, -122], [60, -150], [-60, -150], [172, -120]] as const) freeRibosome(g, x, y);
        },
        callouts: [
          { text: 'Outer envelope', at: { x: -300, y: -147 }, side: 'l' },
          { text: 'Inner envelope', at: { x: -340, y: -60 }, side: 'l' },
          { text: 'Starch grain', at: { x: -318, y: 20 }, side: 'l' },
          { text: 'Stroma', at: { x: -172, y: 140 }, side: 'l' },
          { text: 'Granum (thylakoid stack)', at: { x: 0, y: -100 }, side: 'r' },
          { text: 'Thylakoid lumen', at: { x: 100, y: -75 }, side: 'r' },
          { text: 'Stroma lamella', at: { x: 172, y: 25 }, side: 'r' },
          { text: 'Plastoglobuli', at: { x: 330, y: 6 }, side: 'r' },
        ],
        box: { x0: -390, y0: -205, x1: 390, y1: 205 },
      };
    }
    case 'nucleus': {
      const outer = ring(240, ellipse(250, 225));
      const inner = ring(240, ellipse(220, 195));
      const fiber = [{ x: -150, y: 30 }, { x: -110, y: 95 }, { x: -40, y: 70 }, { x: 0, y: 130 }, { x: 70, y: 100 }, { x: 120, y: 40 }, { x: 150, y: 95 }];
      const fiberPath = squiggle(fiber, 6, 2);
      const fiberAt = (u: number): Pt => {
        const seg = u * (fiber.length - 1);
        const i = Math.min(fiber.length - 2, Math.floor(seg));
        const f = seg - i;
        return { x: fiber[i].x + (fiber[i + 1].x - fiber[i].x) * f, y: fiber[i].y + (fiber[i + 1].y - fiber[i].y) * f };
      };
      let nuc = 0;
      const npcAt = along([{ membrane: 'outer', pts: outer }], 4, 0.3)[0].p;
      return {
        loops: [{ membrane: 'outer', pts: outer }, { membrane: 'inner', pts: inner }],
        fills: [
          { d: pathOf(outer), fill: url('nuc-pns'), outer: true },
          { d: pathOf(inner), fill: url('nuc-plasm') },
        ],
        side: { outer: 1, inner: 1 },
        spot: (component) => (component === 'rnap2' ? { p: fiberAt(0.9) } : { p: fiberAt(0.12 + 0.19 * nuc++) }),
        decorBack: (g) => {
          // Nuclear lamina, heterochromatin at the periphery, nucleolus, euchromatin fibre.
          g.append(el('path', { d: pathOf(ring(200, ellipse(207, 182))), class: 'org-decor lamina' }));
          for (const a of [0.1, 1.6, 2.9, 4.4, 5.6]) {
            const p = { x: 186 * Math.cos(a), y: 162 * Math.sin(a) };
            const blobPts = ring(18, (t) => ({ x: p.x + (24 + 6 * Math.sin(3 * t + a)) * Math.cos(t), y: p.y + (16 + 5 * Math.cos(2 * t)) * Math.sin(t) }));
            g.append(el('path', { d: pathOf(blobPts), class: 'org-decor heterochromatin' }));
          }
          const nucleolus = ring(40, (t) => ({ x: 55 + (52 + 6 * Math.sin(5 * t)) * Math.cos(t), y: -45 + (44 + 5 * Math.cos(4 * t)) * Math.sin(t) }));
          g.append(el('path', { d: pathOf(nucleolus), fill: url('nucleolus'), class: 'org-decor nucleolus' }));
          for (const [x, y] of [[40, -55], [72, -30], [62, -68]] as const) g.append(el('circle', { cx: x, cy: y, r: 7, class: 'org-decor fibrillar' }));
          for (const d of [squiggle([{ x: -170, y: -60 }, { x: -110, y: -110 }, { x: -50, y: -60 }, { x: -20, y: -130 }], 5, 2), squiggle([{ x: -60, y: -10 }, { x: 0, y: 20 }, { x: 60, y: 10 }, { x: 160, y: -20 }], 5, 2)])
            g.append(el('path', { d, class: 'org-decor chromatin' }));
          g.append(el('path', { d: fiberPath, class: 'org-decor dna' }));
        },
        callouts: [
          { text: 'Outer membrane', at: { x: -177, y: -159 }, side: 'l' },
          { text: 'Perinuclear space', at: { x: -235, y: -60 }, side: 'l' },
          { text: 'Inner membrane + lamina', at: { x: -218, y: 25 }, side: 'l' },
          { text: 'Heterochromatin', at: { x: -186, y: 130 }, side: 'l' },
          { text: 'Nuclear pore complex', at: npcAt, side: 'r' },
          { text: 'Nucleolus', at: { x: 55, y: -45 }, side: 'r' },
          { text: 'Euchromatin', at: { x: 90, y: 90 }, side: 'r' },
          { text: 'Nucleoplasm', at: { x: 150, y: 10 }, side: 'r' },
        ],
        box: { x0: -250, y0: -225, x1: 250, y1: 225 },
      };
    }
    case 'er': {
      const cx = -300;
      const radii = [170, 260, 350, 440];
      const sacs = radii.map((r) => {
        const s = Math.min(0.8, 210 / r);
        return { r, s, pts: arcSac(cx, 0, r, -s, s, 18) };
      });
      const face = (i: number, t: number): Anchor => {
        const rr = radii[i] + 18;
        return A(cx + rr * Math.cos(t), rr * Math.sin(t), Math.cos(t), Math.sin(t));
      };
      const bipSpots: Spot[] = [
        { p: { x: cx + 260 * Math.cos(0.3), y: 260 * Math.sin(0.3) }, rot: (0.3 * 180) / Math.PI + 90 },
        { p: { x: cx + 350 * Math.cos(-0.25), y: 350 * Math.sin(-0.25) }, rot: (-0.25 * 180) / Math.PI + 90 },
      ];
      let b = 0;
      const box = boxOf(sacs.flatMap((s) => s.pts), 30);
      return {
        loops: sacs.map((s) => ({ membrane: 'er', pts: s.pts })),
        fills: sacs.map((s) => ({ d: pathOf(s.pts), fill: url('er') })),
        side: { er: 1 },
        anchors: { sec61: [face(1, -0.2), face(2, 0.15)], serca: [face(0, 0.1), face(3, -0.12)] },
        spot: () => bipSpots[b++ % bipSpots.length],
        decorFront: (g) => {
          // Rough ER: ribosomes stud the cytosolic face.
          const busy = [face(1, -0.2), face(2, 0.15), face(0, 0.1), face(3, -0.12)].map((a) => a.p);
          sacs.forEach((s) =>
            along([{ membrane: 'er', pts: s.pts }], Math.floor(s.r * s.s * 2 / 26), 0.3).forEach((a, i) => {
              if (busy.some((p) => Math.hypot(p.x - a.p.x, p.y - a.p.y) < 34) || i % 5 === 3) return;
              freeRibosome(g, a.p.x + a.nx * 14, a.p.y + a.ny * 14, (Math.atan2(a.ny, a.nx) * 180) / Math.PI + 90);
            }),
          );
        },
        callouts: [
          { text: 'ER membrane', at: { x: cx + 188 * Math.cos(-0.6), y: 188 * Math.sin(-0.6) }, side: 'l' },
          { text: 'ER lumen', at: { x: cx + 170 * Math.cos(0.5), y: 170 * Math.sin(0.5) }, side: 'l' },
          { text: 'Ribosomes (rough ER)', at: { x: cx + 472 * Math.cos(-0.3), y: 472 * Math.sin(-0.3) }, side: 'r' },
          { text: 'Cytosol', at: { x: cx + 305 * Math.cos(-0.45), y: 305 * Math.sin(-0.45) }, side: 'r' },
        ],
        box,
      };
    }
    case 'golgi': {
      const cy = 544;
      const rs = [420, 482, 544, 606, 668];
      const rim = (u: number) => 13 + 7 * Math.max(0, Math.abs(u - 0.5) * 2 - 0.6) / 0.4;
      const cis = rs.map((r) => {
        const s = 200 / r;
        return { r, s, pts: arcSac(0, cy, r, -Math.PI / 2 - s, -Math.PI / 2 + s, rim) };
      });
      const onArc = (i: number, dt: number, outerFace: boolean): Anchor => {
        const t = -Math.PI / 2 + dt;
        const rr = rs[i] + (outerFace ? 13 : -13);
        const sgn = outerFace ? 1 : -1;
        return A(rr * Math.cos(t), cy + rr * Math.sin(t), sgn * Math.cos(t), sgn * Math.sin(t));
      };
      const box = boxOf(cis.flatMap((c) => c.pts), 40);
      return {
        loops: cis.map((c) => ({ membrane: 'golgi', pts: c.pts })),
        fills: cis.map((c) => ({ d: pathOf(c.pts), fill: url('golgi') })),
        side: { golgi: 1 },
        anchors: { gm130: [onArc(4, -0.1, true), onArc(4, 0.12, true)], sgms1: [onArc(0, -0.14, false), onArc(0, 0.16, false)] },
        spot: (_c, k) => ({ p: { x: -60 + k * 40, y: 0 } }),
        decorFront: (g) => {
          // Vesicles budding from the rims, arriving at cis (COPII-derived) and leaving trans.
          cis.forEach((c, i) => {
            if (i % 2) return;
            for (const sgn of [-1, 1]) {
              const t = -Math.PI / 2 + sgn * (c.s + 0.07);
              vesicle(g, c.r * Math.cos(t), cy + c.r * Math.sin(t), 15, '#f6c3d5', '#d46aa3');
            }
          });
          for (const [x, y] of [[-110, 168], [-10, 182], [95, 170], [40, 222], [-60, 215]] as const) vesicle(g, x, y, 16, '#f6c3d5', '#d46aa3');
          for (const [x, y] of [[-80, -175], [30, -186], [120, -168]] as const) vesicle(g, x, y, 15, '#d4e5f6', '#3aa6b9');
        },
        callouts: [
          { text: 'Vesicles from the ER', at: { x: -80, y: -175 }, side: 'l' },
          { text: 'cis face', at: { x: -150, y: -107 }, side: 'l' },
          { text: 'Cisterna (lumen)', at: { x: -150, y: 21 }, side: 'l' },
          { text: 'trans face', at: { x: -150, y: 152 }, side: 'l' },
          { text: 'Budding vesicle', at: { x: 229, y: 51 }, side: 'r' },
          { text: 'Secretory vesicles', at: { x: 95, y: 170 }, side: 'r' },
        ],
        box,
      };
    }
    case 'lysosome': {
      const mem = ring(220, ellipse(170, 162));
      return {
        loops: [{ membrane: 'membrane', pts: mem }],
        fills: [{ d: pathOf(mem), fill: url('lys'), outer: true }],
        side: { membrane: 1 },
        spot: (_c, _k, i) => ({ p: [{ x: -60, y: -30 }, { x: 55, y: 15 }, { x: -20, y: 60 }, { x: 40, y: -70 }][i % 4] }),
        decorBack: (g) => {
          vesicle(g, 70, 70, 22, '#efe3f8', '#b07fd6');
          vesicle(g, -75, 40, 16, '#efe3f8', '#b07fd6');
          for (const [x, y, r] of [[10, -10, 9], [-30, 100, 6], [95, -20, 7], [-95, -60, 5]] as const) g.append(el('circle', { cx: x, cy: y, r, class: 'org-decor debris' }));
        },
        callouts: [
          { text: 'Lysosomal membrane', at: { x: -120, y: -114 }, side: 'l' },
          { text: 'Glycocalyx (LAMP glycans)', at: { x: -150, y: 30 }, side: 'l' },
          { text: 'Acidic lumen (hydrolases)', at: { x: 0, y: 20 }, side: 'r' },
          { text: 'Intraluminal vesicle', at: { x: 70, y: 70 }, side: 'r' },
        ],
        box: { x0: -170, y0: -162, x1: 170, y1: 162 },
      };
    }
    case 'peroxisome': {
      const mem = ring(200, ellipse(155, 150));
      return {
        loops: [{ membrane: 'membrane', pts: mem }],
        fills: [{ d: pathOf(mem), fill: url('perox'), outer: true }],
        side: { membrane: 1 },
        spot: (c, k) => ({ p: c === 'daao' ? { x: -40, y: 30 } : [{ x: 45, y: -35 }, { x: 40, y: 60 }][k % 2] }),
        slot: () => ({ p: { x: -40, y: 52 } }),
        decorBack: (g) => {
          for (let i = 0; i < 40; i++) {
            const p = spiral(120)(i, 40);
            g.append(el('circle', { cx: p.x, cy: p.y, r: 1.6, class: 'org-decor matrix-dot' }));
          }
        },
        callouts: [
          { text: 'Peroxisomal membrane', at: { x: -110, y: -106 }, side: 'l' },
          { text: 'Matrix', at: { x: 80, y: 10 }, side: 'r' },
        ],
        box: { x0: -155, y0: -150, x1: 155, y1: 150 },
      };
    }
    case 'lipid-droplet': {
      const mem = ring(200, ellipse(150, 146));
      return {
        loops: [{ membrane: 'monolayer', pts: mem }],
        fills: [{ d: pathOf(mem), fill: url('ld'), outer: true }],
        side: { monolayer: 1 },
        spot: (_c, k) => ({ p: { x: k * 30, y: 0 } }),
        slot: (_s, k) => ({ p: spiral(95)(k, 8) }),
        callouts: [
          { text: 'Phospholipid monolayer', at: { x: -106, y: -103 }, side: 'l' },
          { text: 'Neutral-lipid core', at: { x: 40, y: 30 }, side: 'r' },
        ],
        box: { x0: -150, y0: -146, x1: 150, y1: 146 },
      };
    }
    case 'vesicle': {
      const mem = ring(200, ellipse(140, 140));
      return {
        loops: [{ membrane: 'membrane', pts: mem }],
        fills: [{ d: pathOf(mem), fill: url('ves'), outer: true }],
        side: { membrane: 1 },
        spot: (_c, _k, i) => ({ p: spiral(80)(i, 6) }),
        callouts: [
          { text: 'Lipid bilayer', at: { x: -99, y: -99 }, side: 'l' },
          { text: 'Aqueous lumen', at: { x: 30, y: 10 }, side: 'r' },
        ],
        box: { x0: -140, y0: -140, x1: 140, y1: 140 },
      };
    }
    case 'carboxysome':
      return {
        loops: [],
        fills: [],
        side: {},
        spot: () => ({ p: { x: 0, y: 0 } }),
        callouts: [
          { text: 'Shell (CsoS1 hexamers)', at: { x: -130, y: -75 }, side: 'l' },
          { text: 'Vertex pentamer', at: { x: -150, y: 0 }, side: 'l' },
          { text: 'RuBisCO, packed', at: { x: 40, y: 40 }, side: 'r' },
          { text: 'Carbonic anhydrase', at: { x: 0, y: -100 }, side: 'r' },
        ],
        box: { x0: -165, y0: -150, x1: 165, y1: 150 },
      };
    case 'ribosome':
      return {
        loops: [],
        fills: [],
        side: {},
        spot: () => ({ p: { x: 0, y: 0 } }),
        callouts: [
          { text: 'Large subunit (60S)', at: { x: -95, y: -80 }, side: 'l' },
          { text: "mRNA 5′ → 3′", at: { x: -190, y: 36 }, side: 'l' },
          { text: 'Small subunit (40S)', at: { x: -80, y: 75 }, side: 'l' },
          { text: 'Nascent polypeptide', at: { x: 70, y: -165 }, side: 'r' },
          { text: 'Exit tunnel', at: { x: 34, y: -95 }, side: 'r' },
          { text: 'tRNAs in E · P · A sites', at: { x: 46, y: -10 }, side: 'r' },
        ],
        box: { x0: -240, y0: -190, x1: 240, y1: 100 },
      };
  }
}

const SHORT_FALLBACK = (id: string) => COMPONENTS[id]?.name.split(/[ (]/)[0].slice(0, 10) ?? id.toUpperCase();

/* ------------------------------------------------------------------ view */

export class OrganelleView {
  private view = { tx: 0, ty: 0, k: 1 };
  private root: SVGGElement | null = null;
  private labels: SVGGElement | null = null;
  private zoomLabel: HTMLButtonElement | null = null;
  private fittedFor: string | null = null;
  private layout: Layout | null = null;
  private showLabels = true;

  constructor(
    private readonly svg: SVGSVGElement,
    private readonly model: OrganelleModel,
    private readonly cb: OrganelleViewCallbacks,
  ) {
    try {
      this.showLabels = localStorage.getItem('atomica-organelle-labels') !== 'off';
    } catch {
      /* storage unavailable */
    }
    model.subscribe(() => this.render());
    svg.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    svg.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    this.buildControls();
    this.render();
  }

  private buildControls(): void {
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
    const lab = btn('Labels', 'Show or hide the diagram labels', () => {
      this.showLabels = !this.showLabels;
      lab.classList.toggle('active', this.showLabels);
      try {
        localStorage.setItem('atomica-organelle-labels', this.showLabels ? 'on' : 'off');
      } catch {
        /* storage unavailable */
      }
      this.svg.classList.toggle('no-labels', !this.showLabels);
      this.drawCallouts();
    });
    lab.classList.toggle('active', this.showLabels);
    this.svg.classList.toggle('no-labels', !this.showLabels);
    btn('−', 'Zoom out', () => this.zoomAtCenter(1 / 1.25));
    this.zoomLabel = btn('100%', 'Reset zoom', () => this.zoomAtCenter(1 / this.view.k));
    btn('+', 'Zoom in', () => this.zoomAtCenter(1.25));
    btn('Fit', 'Fit the organelle in view', () => this.fit());
    host.append(bar);
  }

  /** Is this screen point over the sandbox at all / over the organelle itself? (drag & drop) */
  isOverSandbox(clientX: number, clientY: number): boolean {
    const r = this.svg.getBoundingClientRect();
    return r.width > 0 && clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  }

  isOverOrganelle(clientX: number, clientY: number): boolean {
    if (!this.isOverSandbox(clientX, clientY)) return false;
    const hit = document.elementFromPoint(clientX, clientY);
    return !!hit?.closest('.org-lumen, .lipid, .protein, .org-slot, .org-membrane-guide, .ribo-subunit, .trna');
  }

  /** Centre the organelle, leaving room for the labels (call after the view becomes visible). */
  fit(): void {
    const r = this.svg.getBoundingClientRect();
    if (r.width === 0) return;
    const b = this.layout?.box ?? { x0: -200, y0: -200, x1: 200, y1: 200 };
    const longest = Math.max(0, ...(this.layout?.callouts ?? []).map((c) => c.text.length));
    const side = this.showLabels && longest ? Math.min(r.width * 0.3, 40 + longest * 6.3) : 30;
    const w = b.x1 - b.x0 + 60;
    const h = b.y1 - b.y0 + 80;
    const k = Math.max(0.15, Math.min(2, Math.min((r.width - 2 * side) / w, (r.height - 40) / h)));
    this.view = { k, tx: r.width / 2 - ((b.x0 + b.x1) / 2) * k, ty: r.height / 2 - ((b.y0 + b.y1) / 2) * k };
    this.applyView();
  }

  private applyView(): void {
    this.root?.setAttribute('transform', `translate(${this.view.tx},${this.view.ty}) scale(${this.view.k})`);
    if (this.zoomLabel) this.zoomLabel.textContent = `${Math.round(this.view.k * 100)}%`;
    this.svg.classList.toggle('lod-far', this.view.k < 0.5);
    this.drawCallouts();
  }

  private zoomAround(sx: number, sy: number, f: number): void {
    const k = Math.min(6, Math.max(0.15, this.view.k * f));
    const wx = (sx - this.view.tx) / this.view.k;
    const wy = (sy - this.view.ty) / this.view.k;
    this.view = { k, tx: sx - wx * k, ty: sy - wy * k };
    this.applyView();
  }

  private zoomAtCenter(f: number): void {
    const r = this.svg.getBoundingClientRect();
    this.zoomAround(r.width / 2, r.height / 2, f);
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const r = this.svg.getBoundingClientRect();
    const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    this.zoomAround(e.clientX - r.left, e.clientY - r.top, Math.exp(-d * 0.0015));
  }

  private onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    const target = (e.target as Element).closest('[data-species],[data-protein]');
    if (target) {
      const sp = target.getAttribute('data-species');
      const pr = target.getAttribute('data-protein');
      if (sp) this.cb.onInspectSpecies(sp);
      else if (pr) this.cb.onProtein(pr);
      return;
    }
    const sx = e.clientX;
    const sy = e.clientY;
    const { tx, ty } = this.view;
    this.svg.classList.add('panning');
    this.svg.setPointerCapture(e.pointerId);
    const move = (m: PointerEvent) => {
      this.view = { ...this.view, tx: tx + m.clientX - sx, ty: ty + m.clientY - sy };
      this.applyView();
    };
    const up = () => {
      this.svg.classList.remove('panning');
      this.svg.removeEventListener('pointermove', move);
      this.svg.removeEventListener('pointerup', up);
      this.svg.removeEventListener('pointercancel', up);
    };
    this.svg.addEventListener('pointermove', move);
    this.svg.addEventListener('pointerup', up);
    this.svg.addEventListener('pointercancel', up);
  }

  render(): void {
    this.svg.replaceChildren();
    this.svg.append(this.defs());
    this.root = el('g', { class: 'world' });
    this.labels = el('g', { class: 'org-callouts' });
    this.svg.append(this.root, this.labels);
    const bp = this.model.blueprint;
    if (!bp) {
      this.layout = null;
      const t = el('text', { class: 'org-empty', x: 0, y: -10, 'text-anchor': 'middle' });
      t.textContent = 'No organelle yet';
      const t2 = el('text', { class: 'org-empty-sub', x: 0, y: 18, 'text-anchor': 'middle' });
      t2.textContent = 'Drag one in from the left, or copy lipids in the Atomic layer and press Ctrl+V here';
      this.root.append(t, t2);
      this.drawPools({ x0: -200, y0: -120, x1: 200, y1: 120 });
    } else {
      this.layout = layoutFor(bp.shape);
      this.drawOrganelle(bp, this.layout);
    }
    if (this.fittedFor !== (bp?.id ?? '')) {
      this.fittedFor = bp?.id ?? '';
      requestAnimationFrame(() => this.fit());
    }
    this.applyView();
  }

  private defs(): SVGDefsElement {
    const defs = el('defs');
    const ph = this.model.state.ph;
    const bp = this.model.blueprint;
    // Lysosome lumen deepens towards magenta as the V-ATPase acidifies it.
    const acid = bp?.ph && ph !== null ? Math.max(0, Math.min(1, (bp.ph.start - ph) / (bp.ph.start - bp.ph.min))) : 0;
    const all: [string, string, string][] = [...GRADIENTS, ['lys', mix('#efe6f8', '#e6b3e8', acid), mix('#d5c0ec', '#b154b8', acid)]];
    for (const [id, a, b] of all) {
      const g = el('radialGradient', { id: `og-${id}`, cx: '42%', cy: '36%', r: '75%' });
      g.append(el('stop', { offset: '0%', 'stop-color': a }), el('stop', { offset: '100%', 'stop-color': b }));
      defs.append(g);
    }
    return defs;
  }

  private drawOrganelle(bp: Blueprint, L: Layout): void {
    const st = this.model.status();
    const g = this.root!;

    for (const f of L.fills) g.append(el('path', { d: f.d, fill: f.fill, class: `org-lumen${f.outer ? ' outer' : ''}` }));
    const back = el('g', { class: 'org-decor-layer' });
    g.append(back);
    L.decorBack?.(back);
    if (bp.shape === 'carboxysome') this.drawCarboxysome(bp);
    if (bp.shape === 'ribosome') this.drawRibosome();

    // Membranes: one clickable patch per lipid unit.
    for (const ms of st.membranes) {
      const mine = L.loops.filter((l) => l.membrane === ms.spec.id);
      this.drawMembrane(mine, ms.spec.units, ms.members, ms.spec.kind);
    }

    const front = el('g', { class: 'org-decor-layer' });
    g.append(front);
    L.decorFront?.(front);

    // Cofactor / core slots.
    st.slots.forEach((sl, si) => {
      const inMem = L.slotMembrane ? along(L.loops.filter((l) => l.membrane === L.slotMembrane), st.slots.reduce((s, x) => s + x.spec.count, 0), 0.15) : [];
      const offset = st.slots.slice(0, si).reduce((s, x) => s + x.spec.count, 0);
      for (let i = 0; i < sl.spec.count; i++) {
        const pos = L.slot ? L.slot(si, offset + i) : inMem.length ? { p: inMem[offset + i].p, membrane: true } : { p: spiral(60)(offset + i, 8) };
        const key = sl.members[i];
        g.append(this.slotGlyph(pos.p, key, `${sl.spec.name}`, sl.spec.why, bp.shape === 'lipid-droplet'));
      }
    });

    // Proteins.
    const byWhere = new Map<string, { component: string; have: number; need: number }[]>();
    for (const p of st.parts) {
      const arr = byWhere.get(p.where) ?? [];
      arr.push(p);
      byWhere.set(p.where, arr);
    }
    let li = 0;
    for (const [where, parts] of byWhere) {
      const instances: { component: string; present: boolean; k: number }[] = [];
      for (const p of parts) for (let i = 0; i < Math.max(p.need, p.have); i++) instances.push({ component: p.component, present: i < p.have, k: i });
      if (where === 'lumen') {
        if (bp.shape === 'carboxysome' || bp.shape === 'ribosome') continue;
        for (const inst of instances) {
          const s = L.spot(inst.component, inst.k, li++);
          g.append(this.protein(inst.component, inst.present, s.p, s.rot ?? 0, false));
        }
      } else {
        const mine = L.loops.filter((l) => l.membrane === where);
        const sideSign = L.side[where] ?? 1;
        const free = instances.filter((x) => !L.anchors?.[x.component]?.[x.k]);
        const spread = along(mine, free.length, 0.3);
        let fi = 0;
        for (const inst of instances) {
          const a = L.anchors?.[inst.component]?.[inst.k] ?? spread[fi++];
          if (!a) continue;
          const ang = (Math.atan2(sideSign * a.ny, sideSign * a.nx) * 180) / Math.PI + 90;
          g.append(this.protein(inst.component, inst.present, a.p, ang, true));
        }
      }
    }
    this.drawPools(L.box);
  }

  /** Bilayer (or monolayer) patches; each patch is one lipid unit of the model. */
  private drawMembrane(loops: Loop[], units: number, members: string[], kind: 'bilayer' | 'monolayer'): void {
    const g = this.root!;
    patches(loops, units).forEach((runs, u) => {
      if (!runs.length) return;
      const key = members[u];
      const grp = el('g', { class: key ? 'lipid' : 'lipid missing' });
      if (!key) {
        grp.append(el('path', { d: offsetD(runs, 0), class: 'org-membrane-guide' }));
        grp.append(el('path', { d: offsetD(runs, HEAD) + offsetD(runs, -HEAD), class: 'mem-heads ghost', 'stroke-width': 3, 'stroke-dasharray': '0 6.4', 'stroke-linecap': 'round' }));
        g.append(titled(grp, 'Empty membrane position: paste a lipid from the Atomic layer'));
        return;
      }
      grp.setAttribute('data-species', key);
      const color = speciesColor(key);
      const sterol = this.model.roleOf(key) === 'sterol';
      if (kind === 'monolayer') {
        grp.append(el('path', { d: offsetD(runs, -3), class: 'mem-tails', 'stroke-width': 9, 'stroke-dasharray': '0.9 1.4 0.9 3.2' }));
        grp.append(el('path', { d: offsetD(runs, 3), class: 'mem-heads', stroke: color, 'stroke-width': sterol ? 3.6 : 5, 'stroke-dasharray': '0 6.4', 'stroke-linecap': 'round' }));
      } else {
        const mid = offsetD(runs, 0);
        grp.append(el('path', { d: mid, class: 'mem-core', 'stroke-width': 2 * HEAD }));
        if (sterol) grp.append(el('path', { d: mid, class: 'mem-sterol', stroke: shade(color, -0.1), 'stroke-width': 7, 'stroke-dasharray': '2.6 3.8' }));
        else grp.append(el('path', { d: mid, class: 'mem-tails', 'stroke-width': 8, 'stroke-dasharray': '0.9 1.4 0.9 3.2' }));
        grp.append(el('path', { d: offsetD(runs, HEAD) + offsetD(runs, -HEAD), class: 'mem-heads', stroke: color, 'stroke-width': sterol ? 3.6 : 5, 'stroke-dasharray': '0 6.4', 'stroke-linecap': 'round' }));
      }
      g.append(titled(grp, `${key}${sterol ? ' (sterol)' : ''} — click to inspect its atoms`));
    });
  }

  private slotGlyph(p: Pt, key: string | undefined, name: string, why: string, oil: boolean): SVGElement {
    if (!key) {
      const c = el('circle', { cx: p.x, cy: p.y, r: oil ? 10 : 5, class: 'org-slot' });
      return titled(c, `Empty: ${name} — ${why}`);
    }
    const color = speciesColor(key);
    const g = el('g', { class: 'org-slot filled', 'data-species': key });
    if (oil) {
      g.append(el('circle', { cx: p.x, cy: p.y, r: 11, fill: color, stroke: shade(color, -0.3), 'stroke-width': 0.8 }));
      g.append(el('circle', { cx: p.x - 3.5, cy: p.y - 3.5, r: 3, fill: '#fff', opacity: 0.55 }));
    } else {
      const hex = Array.from({ length: 6 }, (_, i) => ({ x: p.x + 4.6 * Math.cos((i * Math.PI) / 3), y: p.y + 4.6 * Math.sin((i * Math.PI) / 3) }));
      g.append(el('path', { d: pathOf(hex), fill: color, stroke: shade(color, -0.4), 'stroke-width': 0.8 }));
    }
    return titled(g, `${key} — ${name} (click to inspect atoms)`);
  }

  private protein(component: string, present: boolean, p: Pt, angle: number, spans: boolean): SVGGElement {
    const c = COMPONENTS[component];
    const def = glyphFor(component, spans);
    const g = el('g', { class: present ? 'protein' : 'protein missing', 'data-protein': component, transform: `translate(${p.x.toFixed(1)},${p.y.toFixed(1)}) rotate(${angle.toFixed(1)})` });
    const out = def.draw(g, def.color);
    if (present && def.hplus) {
      const x = out.half + 7;
      const [y1, y2] = def.hplus === 'up' ? [16, -16] : [-16, 16];
      const arrow = el('g', { class: 'hplus' });
      arrow.append(el('line', { x1: x, y1, x2: x, y2: y2 - Math.sign(y2 - y1) * 4 }));
      const s = Math.sign(y2 - y1);
      arrow.append(el('path', { d: `M${x - 3.5},${y2 - s * 5} L${x},${y2} L${x + 3.5},${y2 - s * 5}Z` }));
      const t = el('text', { x: x + 4, y: y1 + 1, class: 'hplus-label', transform: `rotate(${-angle} ${x + 4} ${y1 + 1})` });
      t.textContent = 'H⁺';
      arrow.append(t);
      g.append(arrow);
    }
    if (!def.quiet) {
      const ly = (spans ? out.top : out.bottom) + (spans ? -7 : 11);
      const t = el('text', { x: 0, y: ly, 'text-anchor': 'middle', class: 'org-plabel', transform: `rotate(${-angle} 0 ${ly})` });
      t.textContent = def.short ?? SHORT_FALLBACK(component);
      g.append(t);
    }
    return titled(g, c ? `${c.name} — ${c.ref.db} ${c.ref.id} (${c.source})${present ? '' : ' — MISSING'}\n${c.role}` : component);
  }

  private drawCarboxysome(bp: Blueprint): void {
    const g = this.root!;
    const shell = bp.parts.find((p) => p.component === 'csos1a')!;
    const have = this.model.state.proteins.csos1a ?? 0;
    const R = 150;
    const hex = Array.from({ length: 6 }, (_, i) => ({ x: R * Math.cos((i * Math.PI) / 3 + Math.PI / 6), y: R * Math.sin((i * Math.PI) / 3 + Math.PI / 6) }));
    g.append(el('path', { d: pathOf(hex), fill: url('cbx'), class: `org-lumen outer${have >= shell.count ? '' : ' open'}` }));
    along([{ membrane: 'shell', pts: hex }], shell.count).forEach((s, i) => {
      const ang = (Math.atan2(s.ny, s.nx) * 180) / Math.PI + 90;
      g.append(this.protein('csos1a', i < have, s.p, ang, true));
    });
    for (const v of hex) {
      const pent = Array.from({ length: 5 }, (_, i) => ({ x: v.x + 9 * Math.cos((i * 2 * Math.PI) / 5 - Math.PI / 2), y: v.y + 9 * Math.sin((i * 2 * Math.PI) / 5 - Math.PI / 2) }));
      g.append(el('path', { d: pathOf(pent), class: 'org-decor pentamer' }));
    }
    const lattice = [{ x: -42, y: -38 }, { x: 42, y: -38 }, { x: -42, y: 42 }, { x: 42, y: 42 }, { x: 0, y: 2 }, { x: -84, y: 2 }, { x: 84, y: 2 }];
    let i = 0;
    for (const id of ['cso-rubisco', 'csosca']) {
      const need = bp.parts.find((p) => p.component === id)!.count;
      const h = this.model.state.proteins[id] ?? 0;
      for (let k = 0; k < Math.max(need, h); k++) {
        const p = id === 'csosca' ? { x: 0, y: -100 + k * 18 } : lattice[i++ % lattice.length];
        g.append(this.protein(id, k < h, p, 0, false));
      }
    }
  }

  private drawRibosome(): void {
    const g = this.root!;
    const s = this.model.state;
    const have = (id: string) => (s.proteins[id] ?? 0) > 0;
    const ok = have('ribosome-80s');
    const lsu = el('path', {
      d: 'M-130,-6 C-150,-56 -118,-118 -66,-116 C-52,-150 -14,-158 6,-134 C26,-160 70,-152 76,-118 C124,-124 148,-68 130,-18 C124,2 86,10 0,8 C-84,10 -124,8 -130,-6Z',
      fill: ok ? url('lsu') : 'none',
      class: `ribo-subunit${ok ? '' : ' missing'}`,
      'data-protein': 'ribosome-80s',
    });
    const ssu = el('path', {
      d: 'M-112,54 C-124,30 -94,14 -42,18 C0,12 52,14 92,20 C122,26 124,62 98,80 C72,98 30,92 10,86 C-22,98 -74,98 -96,82 C-108,74 -104,64 -112,54Z',
      fill: ok ? url('ssu') : 'none',
      class: `ribo-subunit small${ok ? '' : ' missing'}`,
      'data-protein': 'ribosome-80s',
    });
    g.append(titled(lsu, '60S large subunit (part of the 80S ribosome, PDB 4V6X)'), titled(ssu, '40S small subunit (part of the 80S ribosome, PDB 4V6X)'));
    // Exit tunnel through the large subunit.
    const tunnel = [{ x: 14, y: -22 }, { x: 26, y: -60 }, { x: 34, y: -100 }, { x: 46, y: -140 }];
    g.append(el('path', { d: pathOf(tunnel, false), class: 'org-decor tunnel' }));

    // mRNA threaded through the small subunit; the codon in the A site is highlighted.
    const mrna = s.mrna;
    const start = s.cursor >= 0 ? s.cursor : Math.max(0, mrna.indexOf('AUG'));
    const codonW = 46;
    g.append(el('path', { d: 'M-235,36 L235,36', class: 'mrna-line' }));
    for (let x = -230; x <= 230; x += 7.67) g.append(el('line', { x1: x, y1: 36, x2: x, y2: 42, class: 'mrna-tick' }));
    for (let c = -4; c <= 3; c++) {
      const idx = start + c * 3;
      if (idx < 0 || idx >= mrna.length) continue;
      const x = (c + 1) * codonW;
      if (c === 0 && !s.done) g.append(el('rect', { x: x - 19, y: 44, width: 38, height: 18, rx: 5, class: 'codon-box' }));
      const txt = el('text', { x, y: 57, 'text-anchor': 'middle', class: `codon${c === 0 && !s.done ? ' current' : ''}` });
      txt.textContent = mrna.slice(idx, idx + 3);
      g.append(txt);
    }
    // tRNAs (inverted L) in the E, P and A sites; the chain hangs off the P-site tRNA.
    ['E', 'P', 'A'].forEach((site, i) => {
      const x = (i - 1) * codonW;
      const present = (s.proteins.trna ?? 0) > i;
      const t = el('path', { d: `M${x - 4},30 L${x - 4},-10 L${x + 14},-18`, class: `trna${present ? '' : ' missing'}${site === 'E' ? ' leaving' : ''}`, 'data-protein': 'trna' });
      g.append(titled(t, `${site}-site tRNA (PDB 1EHZ)`));
      const lab = el('text', { x: x - 4, y: -28, 'text-anchor': 'middle', class: 'site-label' });
      lab.textContent = site;
      g.append(lab);
    });
    // Nascent chain: from the P-site tRNA up the tunnel and out of the ribosome.
    const pep = s.peptide;
    const route = [{ x: 14, y: -22 }, ...tunnel.slice(1), { x: 70, y: -165 }, { x: 110, y: -172 }, { x: 150, y: -160 }, { x: 180, y: -136 }, { x: 196, y: -104 }];
    const pts = resampleOpen(route, 15);
    for (let i = 0; i < Math.min(pep.length, pts.length); i++) {
      const p = pts[i];
      g.append(el('circle', { cx: p.x, cy: p.y, r: 7.5, class: 'aa-bead' }));
      const t = el('text', { x: p.x, y: p.y + 3.2, 'text-anchor': 'middle', class: 'aa-label' });
      t.textContent = pep[pep.length - 1 - i];
      g.append(t);
    }
    g.append(this.protein('eef1a', have('eef1a'), { x: 160, y: -10 }, 0, false), this.protein('eef2', have('eef2'), { x: -175, y: -60 }, 0, false));
  }

  /** Free molecules in the surroundings, a few dots per species. */
  private drawPools(b: Box): void {
    const entries = Object.entries(this.model.state.pools).filter(([, n]) => n > 0);
    const rx = (b.x1 - b.x0) / 2 + 45;
    const ry = (b.y1 - b.y0) / 2 + 40;
    const cx = (b.x0 + b.x1) / 2;
    const cy = (b.y0 + b.y1) / 2;
    let i = 0;
    for (const [key, n] of entries) {
      const dots = Math.min(n, 6);
      for (let d = 0; d < dots && i < 120; d++, i++) {
        const a = i * 2.39996;
        const extra = (i * 37) % 70;
        const c = el('circle', { cx: cx + Math.cos(a) * (rx + extra), cy: cy + Math.sin(a) * (ry + extra * 0.6), r: 4.5, class: 'pool-dot', fill: speciesColor(key), 'data-species': key });
        this.root!.append(titled(c, `${key} ×${n} (free in the surroundings) — click to inspect its atoms`));
      }
    }
  }

  /** Leader-line labels, drawn in screen space so they stay readable at any zoom. */
  private drawCallouts(): void {
    const host = this.labels;
    if (!host) return;
    host.replaceChildren();
    const L = this.layout;
    if (!L || !this.showLabels) return;
    const { k, tx, ty } = this.view;
    const sx = (x: number) => tx + x * k;
    const sy = (y: number) => ty + y * k;
    const r = this.svg.getBoundingClientRect();
    for (const sideKey of ['l', 'r'] as const) {
      const items = L.callouts.filter((c) => c.side === sideKey).sort((a, b) => a.at.y - b.at.y);
      const x = sideKey === 'l' ? sx(L.box.x0) - 28 : sx(L.box.x1) + 28;
      // Spread label rows evenly over the organelle's height, keeping them in order.
      const top = sy(L.box.y0) + 8;
      const bottom = sy(L.box.y1) - 8;
      items.forEach((c, i) => {
        const yRow = items.length === 1 ? sy(c.at.y) : top + ((bottom - top) * i) / (items.length - 1);
        const y = Math.max(14, Math.min(r.height - 10, yRow));
        const ax = sx(c.at.x);
        const ay = sy(c.at.y);
        const ex = sideKey === 'l' ? x + 6 : x - 6;
        host.append(el('path', { d: `M${ax.toFixed(1)},${ay.toFixed(1)} L${(ex + (sideKey === 'l' ? 14 : -14)).toFixed(1)},${y.toFixed(1)} L${ex.toFixed(1)},${y.toFixed(1)}`, class: 'callout-line' }));
        host.append(el('circle', { cx: ax, cy: ay, r: 2.6, class: 'callout-dot' }));
        const t = el('text', { x, y: y + 4, 'text-anchor': sideKey === 'l' ? 'end' : 'start', class: 'callout-text' });
        t.textContent = c.text;
        host.append(t);
      });
    }
  }
}

/**
 * Organelle-layer view (TSK-UI-007): a schematic, to-topology drawing of the ONE organelle being
 * built. Membranes are drawn as their coarse-grained lipid units (filled = pasted lipid, dashed =
 * still missing), proteins as labelled blocks at their real location (membrane or lumen), cofactor
 * slots inside, and free molecules as dots in the surroundings. No individual atoms are drawn here:
 * Inspect (click a lipid / molecule, or the panel button) returns to the atomic structure.
 *
 * Shapes are schematic (not to scale): e.g. cristae folds, grana stacks and Golgi cisternae show the
 * real topology of each membrane, not measured geometry.
 */
import { COMPONENTS, type Blueprint, type Shape } from '../organelle/blueprints';
import type { OrganelleModel } from '../organelle/OrganelleModel';

const SVG_NS = 'http://www.w3.org/2000/svg';
type Pt = { x: number; y: number };
interface Loop {
  membrane: string;
  pts: Pt[];
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

/** Stable colour per species name. */
export function speciesColor(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 62% 52%)`;
}

const ring = (n: number, f: (t: number) => Pt): Pt[] => Array.from({ length: n }, (_, i) => f((i / n) * Math.PI * 2));
const ellipse = (a: number, b: number, cx = 0, cy = 0) => (t: number): Pt => ({ x: cx + a * Math.cos(t), y: cy + b * Math.sin(t) });

/** A curved, flattened sac (ER sheet / Golgi cisterna) along an arc. */
function arcSac(cx: number, cy: number, r: number, from: number, to: number, half: number): Pt[] {
  const n = 40;
  const outer: Pt[] = [];
  const inner: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = from + ((to - from) * i) / n;
    outer.push({ x: cx + (r + half) * Math.cos(t), y: cy + (r + half) * Math.sin(t) });
    inner.push({ x: cx + (r - half) * Math.cos(t), y: cy + (r - half) * Math.sin(t) });
  }
  // Semicircular caps: around the end of the centre line, bulging along (to) / against (from) the arc.
  const cap = (t: number, sign: number): Pt[] => {
    const c = { x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) };
    const rad = { x: Math.cos(t), y: Math.sin(t) };
    const tan = { x: -Math.sin(t), y: Math.cos(t) };
    const pts: Pt[] = [];
    for (let i = 1; i < 8; i++) {
      const u = (i / 8) * Math.PI;
      pts.push({
        x: c.x + half * (sign * Math.cos(u) * rad.x + sign * Math.sin(u) * tan.x),
        y: c.y + half * (sign * Math.cos(u) * rad.y + sign * Math.sin(u) * tan.y),
      });
    }
    return pts;
  };
  const capA = cap(to, 1);
  const capB = cap(from, -1);
  return [...outer, ...capA, ...inner.reverse(), ...capB];
}

function roundedRect(cx: number, cy: number, w: number, h: number): Pt[] {
  const r = h / 2;
  const pts: Pt[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = -Math.PI / 2 + (i / 10) * Math.PI;
    pts.push({ x: cx + w / 2 - r + r * Math.cos(t), y: cy + r * Math.sin(t) });
  }
  for (let i = 0; i <= 10; i++) {
    const t = Math.PI / 2 + (i / 10) * Math.PI;
    pts.push({ x: cx - w / 2 + r + r * Math.cos(t), y: cy + r * Math.sin(t) });
  }
  return pts;
}

/** Membrane outlines per shape (world units, organelle centred on 0,0). */
function loopsFor(shape: Shape): { loops: Loop[]; radius: number } {
  switch (shape) {
    case 'mitochondrion': {
      const inner = (t: number): Pt => {
        const bump = Math.max(0, Math.cos(9 * t)) ** 10;
        const s = 1 - 0.5 * bump;
        return { x: 268 * Math.cos(t) * s, y: 130 * Math.sin(t) * (1 - 0.62 * bump) };
      };
      return { loops: [{ membrane: 'outer', pts: ring(200, ellipse(300, 160)) }, { membrane: 'inner', pts: ring(400, inner) }], radius: 320 };
    }
    case 'chloroplast': {
      const loops: Loop[] = [
        { membrane: 'outer', pts: ring(200, ellipse(330, 175)) },
        { membrane: 'inner', pts: ring(200, ellipse(310, 157)) },
      ];
      for (const gx of [-190, -95, 0, 95, 190]) {
        const off = Math.abs(gx) === 95 ? 22 : -10;
        for (let k = 0; k < 3; k++) loops.push({ membrane: 'thylakoid', pts: roundedRect(gx, off + (k - 1) * 22, 74, 14) });
      }
      return { loops, radius: 350 };
    }
    case 'nucleus':
      return { loops: [{ membrane: 'outer', pts: ring(220, ellipse(214, 214)) }, { membrane: 'inner', pts: ring(220, ellipse(194, 194)) }], radius: 230 };
    case 'er': {
      const loops: Loop[] = [];
      for (const [i, r] of [150, 195, 240, 285].entries()) loops.push({ membrane: 'er', pts: arcSac(-230, 0, r, -0.85 + i * 0.05, 0.85 - i * 0.05, 14) });
      return { loops, radius: 120 };
    }
    case 'golgi': {
      const loops: Loop[] = [];
      for (let i = 0; i < 5; i++) {
        const spread = 0.62 - i * 0.07;
        loops.push({ membrane: 'golgi', pts: arcSac(0, 300, 230 + i * 36, -Math.PI / 2 - spread, -Math.PI / 2 + spread, 13) });
      }
      return { loops, radius: 220 };
    }
    case 'lipid-droplet':
      return { loops: [{ membrane: 'monolayer', pts: ring(160, ellipse(140, 140)) }], radius: 150 };
    case 'peroxisome':
      return { loops: [{ membrane: 'membrane', pts: ring(160, ellipse(150, 150)) }], radius: 160 };
    case 'lysosome':
      return { loops: [{ membrane: 'membrane', pts: ring(160, ellipse(160, 160)) }], radius: 170 };
    case 'vesicle':
      return { loops: [{ membrane: 'membrane', pts: ring(160, ellipse(140, 140)) }], radius: 150 };
    case 'carboxysome':
    case 'ribosome':
      return { loops: [], radius: 170 };
  }
}

/** Evenly spaced positions (with outward normals) along all loops of one membrane. */
function along(loops: Loop[], n: number): { p: Pt; nx: number; ny: number }[] {
  if (n <= 0 || loops.length === 0) return [];
  const segs: { a: Pt; b: Pt; len: number }[] = [];
  for (const l of loops) for (let i = 0; i < l.pts.length; i++) {
    const a = l.pts[i];
    const b = l.pts[(i + 1) % l.pts.length];
    segs.push({ a, b, len: Math.hypot(b.x - a.x, b.y - a.y) });
  }
  const total = segs.reduce((s, g) => s + g.len, 0);
  const out: { p: Pt; nx: number; ny: number }[] = [];
  let si = 0;
  let acc = 0;
  for (let k = 0; k < n; k++) {
    const target = ((k + 0.5) / n) * total;
    while (si < segs.length - 1 && acc + segs[si].len < target) acc += segs[si++].len;
    const g = segs[si];
    const u = g.len ? (target - acc) / g.len : 0;
    const dx = (g.b.x - g.a.x) / (g.len || 1);
    const dy = (g.b.y - g.a.y) / (g.len || 1);
    out.push({ p: { x: g.a.x + (g.b.x - g.a.x) * u, y: g.a.y + (g.b.y - g.a.y) * u }, nx: dy, ny: -dx });
  }
  return out;
}

const pathOf = (pts: Pt[]) => `M${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L')}Z`;

const SHORT: Record<string, string> = {
  'complex-i': 'I',
  'complex-ii': 'II',
  'complex-iii': 'III',
  'complex-iv': 'IV',
  'atp-synthase': 'ATP syn',
  'cytochrome-c': 'cyt c',
  'citrate-synthase': 'CS',
  'cf-atp-synthase': 'CF ATP',
  'cso-rubisco': 'RuBisCO',
  'v-atpase': 'V-ATPase',
  'cathepsin-b': 'CTSB',
  plastocyanin: 'PC',
  nucleosome: 'nuc',
  csos1a: 'S1A',
  csosca: 'CA',
  rubisco: 'RuBisCO',
  lhcii: 'LHCII',
  'ribosome-80s': '80S',
  trna: 'tRNA',
  eef1a: 'eEF1A',
  eef2: 'eEF2',
  serca: 'SERCA',
  sec61: 'Sec61',
  rnap2: 'Pol II',
  catalase: 'CAT',
};
const shortName = (id: string) => SHORT[id] ?? id.toUpperCase().replace(/-/g, '').slice(0, 6);

export class OrganelleView {
  private view = { tx: 0, ty: 0, k: 1 };
  private root: SVGGElement | null = null;
  private zoomLabel: HTMLButtonElement | null = null;
  private fittedFor: string | null = null;

  constructor(
    private readonly svg: SVGSVGElement,
    private readonly model: OrganelleModel,
    private readonly cb: OrganelleViewCallbacks,
  ) {
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
    btn('−', 'Zoom out', () => this.zoomAtCenter(1 / 1.25));
    this.zoomLabel = btn('100%', 'Reset zoom', () => this.zoomAtCenter(1 / this.view.k));
    btn('+', 'Zoom in', () => this.zoomAtCenter(1.25));
    btn('Fit', 'Fit the organelle in view', () => this.fit());
    host.append(bar);
  }

  /** Centre the organelle (call after the view becomes visible). */
  fit(): void {
    const r = this.svg.getBoundingClientRect();
    if (r.width === 0) return;
    const bp = this.model.blueprint;
    const radius = (bp ? loopsFor(bp.shape).radius : 200) + 120;
    const k = Math.max(0.2, Math.min(2, Math.min(r.width, r.height) / (2 * radius)));
    this.view = { k, tx: r.width / 2, ty: r.height / 2 };
    this.applyView();
  }

  private applyView(): void {
    this.root?.setAttribute('transform', `translate(${this.view.tx},${this.view.ty}) scale(${this.view.k})`);
    if (this.zoomLabel) this.zoomLabel.textContent = `${Math.round(this.view.k * 100)}%`;
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
    this.root = el('g', { class: 'world' });
    this.svg.append(this.root);
    const bp = this.model.blueprint;
    if (!bp) {
      const t = el('text', { class: 'org-empty', x: 0, y: -10, 'text-anchor': 'middle' });
      t.textContent = 'No organelle yet';
      const t2 = el('text', { class: 'org-empty-sub', x: 0, y: 18, 'text-anchor': 'middle' });
      t2.textContent = 'Pick one on the left, or copy lipids in the Atomic layer and press Ctrl+V here';
      this.root.append(t, t2);
      this.drawPools(170);
    } else {
      this.drawOrganelle(bp);
    }
    if (this.fittedFor !== (bp?.id ?? '')) {
      this.fittedFor = bp?.id ?? '';
      requestAnimationFrame(() => this.fit());
    }
    this.applyView();
  }

  private drawOrganelle(bp: Blueprint): void {
    const st = this.model.status();
    const { loops, radius } = loopsFor(bp.shape);
    const g = this.root!;
    const lumenTint = bp.ph && this.model.state.ph !== null ? Math.max(0, Math.min(1, (bp.ph.start - this.model.state.ph) / (bp.ph.start - bp.ph.min))) : 0;

    // Lumen fill behind the membranes.
    for (const l of loops) {
      const first = loops.findIndex((x) => x.membrane === l.membrane);
      const isOuter = l.membrane === loops[0].membrane && loops.indexOf(l) === first;
      g.append(el('path', { d: pathOf(l.pts), class: `org-lumen${isOuter ? ' outer' : ''}`, style: lumenTint ? `fill-opacity:${0.08 + lumenTint * 0.3}` : '' }));
    }
    if (bp.shape === 'carboxysome') this.drawCarboxysome(bp);
    if (bp.shape === 'ribosome') this.drawRibosome();

    // Membranes: guide line + lipid units.
    for (const ms of st.membranes) {
      const mine = loops.filter((l) => l.membrane === ms.spec.id);
      for (const l of mine) g.append(el('path', { d: pathOf(l.pts), class: `org-membrane-guide${ms.closed ? ' closed' : ''}` }));
      const spots = along(mine, ms.spec.units);
      spots.forEach((s, i) => {
        const key = ms.members[i];
        g.append(this.lipidGlyph(s, key, ms.spec.kind, this.model.roleOf(key ?? '') === 'sterol'));
      });
    }

    // Slots (cofactors / droplet core) inside.
    const inside = Math.min(radius * 0.55, 120);
    st.slots.forEach((sl, si) => {
      for (let i = 0; i < sl.spec.count; i++) {
        const a = (i / sl.spec.count) * Math.PI * 2 + si * 0.7;
        const rr = bp.shape === 'lipid-droplet' ? 40 + (i % 3) * 25 : inside * (0.35 + 0.15 * si);
        const p = { x: Math.cos(a) * rr, y: Math.sin(a) * rr * (bp.shape === 'mitochondrion' || bp.shape === 'chloroplast' ? 0.45 : 1) };
        const key = sl.members[i];
        const c = el('circle', { cx: p.x, cy: p.y, r: 7, class: key ? 'org-slot filled' : 'org-slot', ...(key ? { fill: speciesColor(key), 'data-species': key } : {}) });
        g.append(titled(c, key ? `${key} — ${sl.spec.name} (click to inspect atoms)` : `Empty: ${sl.spec.name} — ${sl.spec.why}`));
      }
    });

    // Proteins.
    const byWhere = new Map<string, { component: string; have: number; need: number }[]>();
    for (const p of st.parts) {
      const arr = byWhere.get(p.where) ?? [];
      arr.push(p);
      byWhere.set(p.where, arr);
    }
    for (const [where, parts] of byWhere) {
      const instances: { component: string; present: boolean }[] = [];
      for (const p of parts) for (let i = 0; i < Math.max(p.need, p.have); i++) instances.push({ component: p.component, present: i < p.have });
      if (where === 'lumen') {
        if (bp.shape === 'carboxysome' || bp.shape === 'ribosome') continue;
        instances.forEach((inst, i) => {
          const a = i * 2.39996; // golden angle spiral
          const rr = inside * Math.sqrt((i + 0.5) / instances.length) * 1.05;
          const flat = bp.shape === 'mitochondrion' || bp.shape === 'chloroplast' ? 0.4 : bp.shape === 'golgi' || bp.shape === 'er' ? 0.3 : 0.8;
          const p =
            bp.shape === 'chloroplast' // stroma enzymes sit below the grana
              ? { x: -170 + (340 * i) / Math.max(1, instances.length - 1), y: 100 + (i % 2) * 18 }
              : { x: Math.cos(a) * rr * (bp.shape === 'golgi' ? 1.4 : 1), y: Math.sin(a) * rr * flat + (bp.shape === 'golgi' ? 120 : 0) };
          g.append(this.proteinBlock(inst.component, inst.present, p, 0, false));
        });
      } else {
        const mine = loops.filter((l) => l.membrane === where);
        along(mine, instances.length).forEach((s, i) => {
          const ang = (Math.atan2(s.ny, s.nx) * 180) / Math.PI;
          g.append(this.proteinBlock(instances[i].component, instances[i].present, s.p, ang, true));
        });
      }
    }
    this.drawPools(radius + 40);
  }

  private lipidGlyph(s: { p: Pt; nx: number; ny: number }, key: string | undefined, kind: 'bilayer' | 'monolayer', sterol: boolean): SVGGElement {
    const g = el('g', { class: key ? 'lipid' : 'lipid missing' });
    const { p, nx, ny } = s;
    const color = key ? speciesColor(key) : '';
    if (key) g.setAttribute('data-species', key);
    const head = (d: number) => el('circle', { cx: p.x + nx * d, cy: p.y + ny * d, r: 4.2, class: 'lipid-head', ...(key ? { fill: color } : {}) });
    const tail = (from: number, to: number, side: number) =>
      el('line', {
        x1: p.x + nx * from - ny * side,
        y1: p.y + ny * from + nx * side,
        x2: p.x + nx * to - ny * side,
        y2: p.y + ny * to + nx * side,
        class: 'lipid-tail',
      });
    if (sterol && key) {
      g.append(el('rect', { x: p.x - 3.5, y: p.y - 3.5, width: 7, height: 7, class: 'lipid-sterol', fill: color, transform: `rotate(45 ${p.x} ${p.y})` }));
    } else if (kind === 'monolayer') {
      g.append(tail(-2, -14, -1.6), tail(-2, -14, 1.6), head(0));
    } else {
      g.append(tail(5, 0.6, -1.6), tail(5, 0.6, 1.6), tail(-5, -0.6, -1.6), tail(-5, -0.6, 1.6), head(8.5), head(-8.5));
    }
    return titled(g, key ? `${key}${sterol ? ' (sterol)' : ''} — click to inspect its atoms` : 'Empty membrane position: paste a lipid from the Atomic layer');
  }

  private proteinBlock(component: string, present: boolean, p: Pt, angle: number, spans: boolean): SVGGElement {
    const c = COMPONENTS[component];
    const g = el('g', { class: present ? 'protein' : 'protein missing', 'data-protein': component, transform: `translate(${p.x},${p.y}) rotate(${spans ? angle + 90 : 0})` });
    const w = spans ? 34 : 30;
    const h = spans ? 30 : 20;
    g.append(el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 7, class: 'protein-body' }));
    const t = el('text', { x: 0, y: 3.5, 'text-anchor': 'middle', class: 'protein-label', transform: spans ? `rotate(${-(angle + 90)})` : '' });
    t.textContent = shortName(component);
    g.append(t);
    return titled(g, `${c.name} — ${c.ref.db} ${c.ref.id} (${c.source})${present ? '' : ' — MISSING'}\n${c.role}`);
  }

  private drawCarboxysome(bp: Blueprint): void {
    const g = this.root!;
    const shell = bp.parts.find((p) => p.component === 'csos1a')!;
    const have = this.model.state.proteins.csos1a ?? 0;
    const R = 130;
    const hex = Array.from({ length: 6 }, (_, i) => ({ x: R * Math.cos((i * Math.PI) / 3 + Math.PI / 6), y: R * Math.sin((i * Math.PI) / 3 + Math.PI / 6) }));
    g.append(el('path', { d: pathOf(hex), class: `org-lumen outer${have >= shell.count ? '' : ' open'}` }));
    along([{ membrane: 'shell', pts: hex }], shell.count).forEach((s, i) => {
      const ang = (Math.atan2(s.ny, s.nx) * 180) / Math.PI;
      g.append(this.proteinBlock('csos1a', i < have, s.p, ang, true));
    });
    const inner = ['cso-rubisco', 'csosca'];
    let i = 0;
    for (const id of inner) {
      const need = bp.parts.find((p) => p.component === id)!.count;
      const h = this.model.state.proteins[id] ?? 0;
      for (let k = 0; k < Math.max(need, h); k++, i++) {
        const a = i * 2.39996;
        const rr = 70 * Math.sqrt((i + 0.5) / 5);
        g.append(this.proteinBlock(id, k < h, { x: Math.cos(a) * rr, y: Math.sin(a) * rr }, 0, false));
      }
    }
  }

  private drawRibosome(): void {
    const g = this.root!;
    const s = this.model.state;
    const have = (id: string) => (s.proteins[id] ?? 0) > 0;
    const big = el('ellipse', { cx: 0, cy: -46, rx: 120, ry: 74, class: `ribo-subunit${have('ribosome-80s') ? '' : ' missing'}`, 'data-protein': 'ribosome-80s' });
    const small = el('ellipse', { cx: 0, cy: 52, rx: 100, ry: 40, class: `ribo-subunit small${have('ribosome-80s') ? '' : ' missing'}`, 'data-protein': 'ribosome-80s' });
    g.append(titled(big, '60S large subunit (part of 80S ribosome, PDB 4V6X)'), titled(small, '40S small subunit (part of 80S ribosome, PDB 4V6X)'));
    // mRNA threaded between the subunits, codons labelled; the decoding position is highlighted.
    const mrna = s.mrna;
    const start = s.cursor >= 0 ? s.cursor : Math.max(0, mrna.indexOf('AUG'));
    const codonW = 46;
    for (let c = -3; c <= 3; c++) {
      const idx = start + c * 3;
      if (idx < 0 || idx >= mrna.length) continue;
      const x = (c + 1) * codonW; // current codon sits in the A site
      const txt = el('text', { x, y: 30, 'text-anchor': 'middle', class: `codon${c === 0 && !s.done ? ' current' : ''}` });
      txt.textContent = mrna.slice(idx, idx + 3);
      g.append(txt);
    }
    g.append(el('line', { x1: -190, y1: 36, x2: 190, y2: 36, class: 'mrna-line' }));
    // tRNAs at E / P / A sites, then the growing chain leaving through the exit tunnel.
    ['E', 'P', 'A'].forEach((site, i) => {
      const x = (i - 1) * codonW;
      const ok = (s.proteins.trna ?? 0) > i;
      const t = el('path', { d: `M${x - 10},20 L${x - 10},-30 L${x + 10},-30 L${x + 10},20`, class: `trna${ok ? '' : ' missing'}`, 'data-protein': 'trna' });
      g.append(titled(t, `${site} site tRNA (PDB 1EHZ)`));
    });
    const pep = s.peptide;
    for (let i = 0; i < pep.length; i++) {
      const cx = -4 - i * 6;
      const cy = -70 - i * 16;
      const b = el('circle', { cx, cy, r: 9, class: 'aa-bead' });
      const t = el('text', { x: cx, y: cy + 3.5, 'text-anchor': 'middle', class: 'aa-label' });
      t.textContent = pep[pep.length - 1 - i];
      g.append(b, t);
    }
    (['eef1a', 'eef2'] as const).forEach((id, i) => g.append(this.proteinBlock(id, have(id), { x: 160 * (i ? 1 : -1), y: -110 }, 0, false)));
  }

  /** Free molecules around the organelle, a few dots per species. */
  private drawPools(radius: number): void {
    const entries = Object.entries(this.model.state.pools).filter(([, n]) => n > 0);
    let i = 0;
    for (const [key, n] of entries) {
      const dots = Math.min(n, 6);
      for (let d = 0; d < dots && i < 120; d++, i++) {
        const a = i * 2.39996;
        const rr = radius + 30 + ((i * 37) % 90);
        const c = el('circle', { cx: Math.cos(a) * rr * 1.35, cy: Math.sin(a) * rr * 0.85, r: 5, class: 'pool-dot', fill: speciesColor(key), 'data-species': key });
        this.root!.append(titled(c, `${key} ×${n} (free in the surroundings) — click to inspect its atoms`));
      }
    }
  }
}

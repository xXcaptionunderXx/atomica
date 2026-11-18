/**
 * Organelle-layer state (TSK-UI-007): exactly ONE organelle (complete or incomplete) plus the free
 * molecules around it. Membranes are filled with real lipids pasted from the atomic layer, protein
 * machinery is added as referenced parts, and reactions run per tick only when the machinery,
 * cofactors, closed compartments and substrates they need are all present.
 */
import type { MoleculeTemplate } from '../sandbox/MoleculeModel';
import {
  AMINO_ACIDS,
  BLUEPRINT_BY_ID,
  COMPONENTS,
  DEFAULT_ROLES,
  GENETIC_CODE,
  NTPS,
  apportion,
  type Blueprint,
  type Composition,
  type MembraneSpec,
  type Reaction,
  type SlotSpec,
} from './blueprints';
import type { MoleculeRole } from './classify';
import type { Species } from './identify';

export interface CustomSpecies {
  formula: string;
  role: MoleculeRole;
  template: MoleculeTemplate;
}

export interface OrganelleState {
  blueprint: string | null;
  membranes: Record<string, string[]>;
  slots: Record<string, string[]>;
  proteins: Record<string, number>;
  /** Free molecules in the surroundings (counts by species key). */
  pools: Record<string, number>;
  /** Interior stores (ER calcium, carboxysome CO2). */
  lumen: Record<string, number>;
  ph: number | null;
  light: boolean;
  /** Ribosome input, transcription template (coding strand) and progress. */
  mrna: string;
  dna: string;
  cursor: number;
  peptide: string;
  transcript: string;
  done: boolean;
  /** Finished products (polypeptides, mRNAs). */
  outputs: string[];
  turnovers: Record<string, number>;
  /** Roles of every species seen, and structures of unnamed ones (for Inspect). */
  roles: Record<string, MoleculeRole>;
  custom: Record<string, CustomSpecies>;
}

export interface Placement {
  key: string;
  where: string; // "membrane:<id>", "slot:<id>", "pool"
}

export interface MembraneStatus {
  spec: MembraneSpec;
  members: string[];
  filled: number;
  unmet: { species: string; have: number; min: number; why: string }[];
  closed: boolean;
}

export interface ReactionStatus {
  reaction: Reaction;
  ready: boolean;
  /** Why it cannot run (empty when ready). Substrate shortages are listed separately. */
  blockers: string[];
  short: string[];
}

export interface OrganelleStatus {
  blueprint: Blueprint | null;
  membranes: MembraneStatus[];
  slots: { spec: SlotSpec; members: string[]; full: boolean }[];
  parts: { component: string; have: number; need: number; where: string }[];
  reactions: ReactionStatus[];
  complete: boolean;
  progress: number; // 0..1
}

const HISTORY_LIMIT = 150;
export const DEFAULT_MRNA = 'AUGGCUUCAGGCUAA';
export const DEFAULT_DNA = 'ATGGCTTCAGGCTAA';

function emptyState(): OrganelleState {
  return {
    blueprint: null,
    membranes: {},
    slots: {},
    proteins: {},
    pools: {},
    lumen: {},
    ph: null,
    light: true,
    mrna: DEFAULT_MRNA,
    dna: DEFAULT_DNA,
    cursor: -1,
    peptide: '',
    transcript: '',
    done: false,
    outputs: [],
    turnovers: {},
    roles: {},
    custom: {},
  };
}

export class OrganelleModel {
  private s: OrganelleState = emptyState();
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private listeners = new Set<() => void>();
  version = 0;

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    this.version++;
    for (const fn of this.listeners) fn();
  }

  /** Run a user action as one undo step. */
  private act(fn: () => boolean | void): boolean {
    const before = JSON.stringify(this.s);
    const ok = fn() !== false;
    if (!ok || JSON.stringify(this.s) === before) return false;
    this.undoStack.push(before);
    if (this.undoStack.length > HISTORY_LIMIT) this.undoStack.shift();
    this.redoStack = [];
    this.emit();
    return true;
  }

  get state(): Readonly<OrganelleState> {
    return this.s;
  }
  get blueprint(): Blueprint | null {
    return this.s.blueprint ? BLUEPRINT_BY_ID[this.s.blueprint] : null;
  }
  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }
  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }
  get isEmpty(): boolean {
    return !this.s.blueprint && Object.keys(this.s.pools).length === 0;
  }

  undo(): boolean {
    const prev = this.undoStack.pop();
    if (!prev) return false;
    this.redoStack.push(JSON.stringify(this.s));
    this.s = JSON.parse(prev);
    this.emit();
    return true;
  }

  redo(): boolean {
    const next = this.redoStack.pop();
    if (!next) return false;
    this.undoStack.push(JSON.stringify(this.s));
    this.s = JSON.parse(next);
    this.emit();
    return true;
  }

  /** Clear the organelle (surroundings are kept unless `everything`). */
  clear(everything = true): boolean {
    return this.act(() => {
      const keep = everything ? {} : this.s.pools;
      this.s = { ...emptyState(), pools: { ...keep } };
    });
  }

  // ---------- building ----------
  /**
   * Start (or replace) the single organelle. Surrounding molecules stay.
   * 'built' places it complete — real lipid composition, every protein and cofactor — and stocks the
   * substrates its reactions use; 'empty' gives the bare blueprint to build yourself.
   */
  setBlueprint(id: string | null, mode: 'built' | 'empty' = 'empty'): boolean {
    if (id && !BLUEPRINT_BY_ID[id]) return false;
    return this.act(() => {
      this.applyBlueprint(id);
      if (id && mode === 'built') {
        this.fillMissing();
        this.stockFeed();
      }
    });
  }

  /** Fill everything still missing (lipids by real composition, proteins, cofactors). Keeps what you built. */
  completeOrganelle(): boolean {
    if (!this.blueprint) return false;
    return this.act(() => this.fillMissing());
  }

  private fillMissing(): void {
    const bp = this.blueprint;
    if (!bp) return;
    for (const m of bp.membranes) this.completeMembrane(m);
    for (const sl of bp.slots) {
      const comp: Composition = sl.fill ?? (sl.species ? [[sl.species[0], 1]] : []);
      this.completeList(this.s.slots[sl.id], comp, sl.count);
      for (const [k] of comp) this.s.roles[k] ??= DEFAULT_ROLES[k] ?? sl.role ?? 'molecule';
    }
    for (const p of bp.parts) this.s.proteins[p.component] = Math.max(this.s.proteins[p.component] ?? 0, p.count);
  }

  private completeMembrane(spec: MembraneSpec): void {
    const members = this.s.membranes[spec.id];
    const count = (k: string) => members.filter((x) => x === k).length;
    // Required lipids first (replacing non-required filler if the membrane is already full).
    const required = new Set((spec.requires ?? []).map((r) => r.species));
    for (const r of spec.requires ?? []) {
      while (count(r.species) < r.min) {
        if (members.length < spec.units) members.push(r.species);
        else {
          const idx = members.findIndex((k) => !required.has(k));
          if (idx < 0) break;
          this.toPool(members[idx]);
          members[idx] = r.species;
        }
      }
    }
    this.completeList(members, spec.composition, spec.units);
    for (const [k] of spec.composition) this.s.roles[k] ??= DEFAULT_ROLES[k] ?? 'bilayer-lipid';
  }

  /** Append to `list` up to `n` entries following `comp`, interleaving species evenly around the membrane. */
  private completeList(list: string[], comp: Composition, n: number): void {
    if (!comp.length) return;
    const target = apportion(comp, n);
    const have = new Map<string, number>();
    for (const k of list) have.set(k, (have.get(k) ?? 0) + 1);
    while (list.length < n) {
      const k = list.length + 1;
      let best = comp[0][0];
      let bestScore = -Infinity;
      for (const [sp] of comp) {
        const score = ((target.get(sp) ?? 0) * k) / n - (have.get(sp) ?? 0);
        if (score > bestScore) {
          bestScore = score;
          best = sp;
        }
      }
      list.push(best);
      have.set(best, (have.get(best) ?? 0) + 1);
    }
  }

  private stockFeed(): void {
    const bp = this.blueprint;
    if (!bp) return;
    for (const [k, n] of Object.entries(bp.feed)) {
      this.s.pools[k] = (this.s.pools[k] ?? 0) + n;
      this.s.roles[k] ??= 'molecule';
    }
  }

  private applyBlueprint(id: string | null): void {
    const bp = id ? BLUEPRINT_BY_ID[id] : null;
    const keep = { pools: this.s.pools, roles: this.s.roles, custom: this.s.custom, mrna: this.s.mrna, dna: this.s.dna, light: this.s.light };
    this.s = { ...emptyState(), ...keep, blueprint: id };
    if (!bp) return;
    for (const m of bp.membranes) this.s.membranes[m.id] = [];
    for (const sl of bp.slots) this.s.slots[sl.id] = [];
    for (const p of bp.parts) this.s.proteins[p.component] = 0;
    this.s.ph = bp.ph ? bp.ph.start : null;
  }

  private remember(sp: Species): void {
    this.s.roles[sp.key] = sp.role;
    if (!sp.name && !this.s.custom[sp.key]) this.s.custom[sp.key] = { formula: sp.formula, role: sp.role, template: sp.template };
  }

  roleOf(key: string): MoleculeRole | undefined {
    return this.s.roles[key];
  }

  /**
   * Add molecules (from a paste or the molecule list). `target` 'auto' puts each copy where it
   * belongs structurally — membrane, then cofactor slot — and the rest in the surroundings.
   */
  addSpecies(list: Species[], copies = 1, target: 'auto' | 'pool' = 'auto'): Placement[] {
    const placed: Placement[] = [];
    this.act(() => {
      for (const sp of list) {
        this.remember(sp);
        for (let i = 0; i < copies; i++) placed.push({ key: sp.key, where: this.place(sp.key, sp.role, target) });
      }
    });
    return placed;
  }

  /** How many copies of `sp` the current organelle still has room for (membranes + slots). */
  roomFor(key: string, role: MoleculeRole): number {
    const bp = this.blueprint;
    if (!bp) return role === 'bilayer-lipid' || role === 'sterol' ? BLUEPRINT_BY_ID.vesicle.membranes[0].units : 0;
    let room = 0;
    for (const m of bp.membranes) {
      if (!m.accepts.includes(role)) continue;
      const members = this.s.membranes[m.id];
      const req = m.requires?.find((r) => r.species === key);
      const freeSlots = m.units - members.length;
      // A required species may also replace non-required filler in a full membrane.
      const replaceable = req ? Math.max(0, req.min - members.filter((k) => k === key).length) : 0;
      room += Math.max(freeSlots, 0) + (freeSlots <= 0 ? replaceable : 0);
    }
    for (const sl of bp.slots) if (this.slotAccepts(sl, key, role)) room += Math.max(0, sl.count - this.s.slots[sl.id].length);
    return room;
  }

  private slotAccepts(sl: SlotSpec, key: string, role: MoleculeRole): boolean {
    return (sl.species?.includes(key) ?? false) || (sl.role !== undefined && sl.role === role);
  }

  private place(key: string, role: MoleculeRole, target: 'auto' | 'pool'): string {
    if (target === 'auto') {
      if (!this.s.blueprint && (role === 'bilayer-lipid' || role === 'sterol')) this.applyBlueprint('vesicle');
      const bp = this.blueprint;
      if (bp) {
        const accepting = bp.membranes.filter((m) => m.accepts.includes(role));
        // Membranes that specifically need this species first, then the first one with room.
        const needs = accepting.find((m) => {
          const r = m.requires?.find((q) => q.species === key);
          return r && this.s.membranes[m.id].filter((k) => k === key).length < r.min;
        });
        const target = needs ?? accepting.find((m) => this.s.membranes[m.id].length < m.units);
        if (target) {
          const members = this.s.membranes[target.id];
          if (members.length < target.units) members.push(key);
          else {
            // Full but missing a required lipid: swap out a filler lipid that is not required.
            const required = new Set((target.requires ?? []).map((r) => r.species));
            const idx = members.findIndex((k) => !required.has(k));
            if (idx < 0) return this.toPool(key);
            this.toPool(members[idx]);
            members[idx] = key;
          }
          return `membrane:${target.id}`;
        }
        const slot = bp.slots.find((sl) => this.slotAccepts(sl, key, role) && this.s.slots[sl.id].length < sl.count);
        if (slot) {
          this.s.slots[slot.id].push(key);
          return `slot:${slot.id}`;
        }
      }
    }
    return this.toPool(key);
  }

  private toPool(key: string): string {
    this.s.pools[key] = (this.s.pools[key] ?? 0) + 1;
    return 'pool';
  }

  /** Change a surroundings count (library molecules or known species). */
  adjustPool(key: string, delta: number, role?: MoleculeRole): boolean {
    return this.act(() => {
      if (role) this.s.roles[key] ??= role;
      const v = Math.max(0, (this.s.pools[key] ?? 0) + delta);
      if (v === 0) delete this.s.pools[key];
      else this.s.pools[key] = v;
    });
  }

  /** Move free molecules from the surroundings into the organelle where they fit. */
  incorporate(key: string, max = Infinity): number {
    let moved = 0;
    this.act(() => {
      const role = this.s.roles[key];
      if (!role) return false;
      while (moved < max && (this.s.pools[key] ?? 0) > 0 && this.roomFor(key, role) > 0) {
        this.s.pools[key]--;
        if (this.s.pools[key] === 0) delete this.s.pools[key];
        const where = this.place(key, role, 'auto');
        if (where === 'pool') break;
        moved++;
      }
      return moved > 0;
    });
    return moved;
  }

  /** Remove one copy of a species from a membrane or slot (it returns to the surroundings). */
  removeMember(where: 'membrane' | 'slot', id: string, key: string): boolean {
    return this.act(() => {
      const list = where === 'membrane' ? this.s.membranes[id] : this.s.slots[id];
      const i = list ? list.lastIndexOf(key) : -1;
      if (i < 0) return false;
      list.splice(i, 1);
      this.toPool(key);
    });
  }

  setProtein(component: string, count: number): boolean {
    if (!COMPONENTS[component] || !(component in this.s.proteins)) return false;
    return this.act(() => {
      this.s.proteins[component] = Math.max(0, Math.min(99, Math.round(count)));
    });
  }

  /** Add every missing protein part (proteins cannot be built atom-by-atom). */
  addAllProteins(): boolean {
    const bp = this.blueprint;
    if (!bp) return false;
    return this.act(() => {
      for (const p of bp.parts) this.s.proteins[p.component] = Math.max(this.s.proteins[p.component] ?? 0, p.count);
    });
  }

  /** Add the blueprint's demonstration substrates to the surroundings. */
  stockSurroundings(): boolean {
    if (!this.blueprint) return false;
    return this.act(() => this.stockFeed());
  }

  setLight(on: boolean): boolean {
    return this.act(() => {
      this.s.light = on;
    });
  }

  setSequence(kind: 'mrna' | 'dna', text: string): boolean {
    const clean = text.toUpperCase().replace(kind === 'mrna' ? /T/g : /U/g, kind === 'mrna' ? 'U' : 'T').replace(kind === 'mrna' ? /[^ACGU]/g : /[^ACGT]/g, '');
    return this.act(() => {
      this.s[kind] = clean;
      this.s.cursor = -1;
      this.s.done = false;
      if (kind === 'mrna') this.s.peptide = '';
      else this.s.transcript = '';
    });
  }

  /** Hand the finished transcript to the ribosome input. */
  useTranscriptAsMrna(): boolean {
    const t = this.s.outputs.filter((o) => o.startsWith('mRNA ')).pop();
    if (!t) return false;
    return this.setSequence('mrna', t.slice(5));
  }

  // ---------- status ----------
  status(): OrganelleStatus {
    const bp = this.blueprint;
    if (!bp) return { blueprint: null, membranes: [], slots: [], parts: [], reactions: [], complete: false, progress: 0 };
    const membranes = bp.membranes.map((spec) => {
      const members = this.s.membranes[spec.id] ?? [];
      const unmet = (spec.requires ?? [])
        .map((r) => ({ species: r.species, have: members.filter((k) => k === r.species).length, min: r.min, why: r.why }))
        .filter((r) => r.have < r.min);
      return { spec, members, filled: members.length, unmet, closed: members.length >= spec.units && unmet.length === 0 };
    });
    const slots = bp.slots.map((spec) => {
      const members = this.s.slots[spec.id] ?? [];
      return { spec, members, full: members.length >= spec.count };
    });
    const parts = bp.parts.map((p) => ({ component: p.component, have: this.s.proteins[p.component] ?? 0, need: p.count, where: p.where }));
    const reactions = bp.reactions.map((r) => this.reactionStatus(r, membranes, slots));
    let need = 0;
    let have = 0;
    for (const m of membranes) {
      need += m.spec.units;
      // Required lipids still missing count against progress even when the unit count is reached.
      have += Math.max(0, Math.min(m.filled, m.spec.units) - m.unmet.reduce((s, u) => s + (u.min - u.have), 0));
    }
    for (const sl of slots) {
      need += sl.spec.count;
      have += Math.min(sl.members.length, sl.spec.count);
    }
    for (const p of parts) {
      need += p.need;
      have += Math.min(p.have, p.need);
    }
    const complete = membranes.every((m) => m.closed) && slots.every((s) => s.full) && parts.every((p) => p.have >= p.need);
    return { blueprint: bp, membranes, slots, parts, reactions, complete, progress: need ? Math.min(1, have / need) : 1 };
  }

  private reactionStatus(r: Reaction, membranes: MembraneStatus[], slots: { spec: SlotSpec; full: boolean }[]): ReactionStatus {
    const blockers: string[] = [];
    for (const e of r.enzymes) if (!(this.s.proteins[e] > 0)) blockers.push(`needs ${COMPONENTS[e].name}`);
    for (const id of r.slots ?? []) {
      const sl = slots.find((s) => s.spec.id === id);
      if (sl && !sl.full) blockers.push(`needs ${sl.spec.name} (${sl.spec.count})`);
    }
    for (const id of r.membranes ?? []) {
      const m = membranes.find((x) => x.spec.id === id);
      if (m && !m.closed) blockers.push(`${m.spec.name} must be closed`);
    }
    if (r.light && !this.s.light) blockers.push('needs light');
    if (r.maxPh !== undefined && (this.s.ph ?? 7.2) > r.maxPh) blockers.push(`lumen pH must be ≤ ${r.maxPh}`);
    const short: string[] = [];
    if (r.kind === 'stoich' || r.kind === 'translation') {
      for (const [sp, n] of r.reactants) if (this.amount(sp) < n) short.push(sp.replace(/^lumen:/, 'lumen '));
    }
    if (r.kind === 'translation') {
      const next = this.nextCodon();
      if (!this.s.mrna.includes('AUG')) blockers.push('mRNA has no AUG start codon');
      else if (this.s.done) blockers.push('translation finished — edit the mRNA to run again');
      else if (next && GENETIC_CODE[next] && GENETIC_CODE[next] !== '*' && this.amount(AMINO_ACIDS[GENETIC_CODE[next]]) < 1)
        short.push(AMINO_ACIDS[GENETIC_CODE[next]]);
    }
    if (r.kind === 'transcription') {
      if (!this.s.dna) blockers.push('enter a DNA coding strand');
      else if (this.s.done) blockers.push('transcription finished — edit the DNA to run again');
      else {
        const base = this.s.dna[Math.max(0, this.s.cursor)]?.replace('T', 'U');
        if (base && this.amount(NTPS[base]) < 1) short.push(NTPS[base]);
      }
    }
    return { reaction: r, ready: blockers.length === 0 && short.length === 0, blockers, short };
  }

  private amount(sp: string): number {
    return sp.startsWith('lumen:') ? (this.s.lumen[sp.slice(6)] ?? 0) : (this.s.pools[sp] ?? 0);
  }

  private take(sp: string, n: number): void {
    const store = sp.startsWith('lumen:') ? this.s.lumen : this.s.pools;
    const k = sp.replace(/^lumen:/, '');
    store[k] = (store[k] ?? 0) - n;
    if (store[k] <= 0) delete store[k];
  }

  private give(sp: string, n: number): void {
    const store = sp.startsWith('lumen:') ? this.s.lumen : this.s.pools;
    const k = sp.replace(/^lumen:/, '');
    store[k] = (store[k] ?? 0) + n;
    this.s.roles[k] ??= 'molecule';
  }

  private nextCodon(): string | null {
    const start = this.s.cursor >= 0 ? this.s.cursor : this.s.mrna.indexOf('AUG');
    if (start < 0) return null;
    const c = this.s.mrna.slice(start, start + 3);
    return c.length === 3 ? c : null;
  }

  // ---------- simulation ----------
  /** Advance one tick. Not an undo step (like the atomic layer's automatic relayout). Returns events. */
  tick(): string[] {
    const st = this.status();
    if (!st.blueprint) return [];
    const events: string[] = [];
    for (const rs of st.reactions) {
      const r = rs.reaction;
      if (rs.blockers.length) continue;
      for (let i = 0; i < r.rate; i++) {
        if (r.kind === 'stoich') {
          if (!r.reactants.every(([sp, n]) => this.amount(sp) >= n)) break;
          for (const [sp, n] of r.reactants) this.take(sp, n);
          for (const [sp, n] of r.products) this.give(sp, n);
          if (r.phShift && this.s.ph !== null) this.s.ph = Math.max(st.blueprint.ph?.min ?? 0, this.s.ph + r.phShift);
        } else if (r.kind === 'translation') {
          const ev = this.translateStep(r);
          if (ev === null) break;
          if (ev) events.push(ev);
        } else if (r.kind === 'transcription') {
          const ev = this.transcribeStep(r);
          if (ev === null) break;
          if (ev) events.push(ev);
        }
        this.s.turnovers[r.id] = (this.s.turnovers[r.id] ?? 0) + 1;
      }
    }
    // Proton leak: the gradient decays toward cytosolic pH, and collapses if the membrane opens.
    const ph = st.blueprint.ph;
    if (ph && this.s.ph !== null) {
      const closed = st.membranes.every((m) => m.closed);
      this.s.ph = closed ? Math.min(ph.start, this.s.ph + ph.leak) : ph.start;
      this.s.ph = Math.round(this.s.ph * 100) / 100;
    }
    this.emit();
    return events;
  }

  /** One codon. Returns null when nothing could happen, '' for a normal step, or an event. */
  private translateStep(r: Reaction): string | null {
    if (this.s.done) return null;
    if (this.s.cursor < 0) {
      const start = this.s.mrna.indexOf('AUG');
      if (start < 0) return null;
      this.s.cursor = start;
    }
    const codon = this.s.mrna.slice(this.s.cursor, this.s.cursor + 3);
    const aa = codon.length === 3 ? GENETIC_CODE[codon] : undefined;
    if (!aa || aa === '*') {
      this.s.done = true;
      const pep = this.s.peptide;
      if (pep) this.s.outputs.push(`Polypeptide ${pep}`);
      return pep ? `Polypeptide released: ${pep} (${pep.length} aa)${aa ? '' : ' — no stop codon, ran off the mRNA'}` : null;
    }
    const aaName = AMINO_ACIDS[aa];
    if (this.amount(aaName) < 1 || !r.reactants.every(([sp, n]) => this.amount(sp) >= n)) return null;
    this.take(aaName, 1);
    for (const [sp, n] of r.reactants) this.take(sp, n);
    for (const [sp, n] of r.products) this.give(sp, n);
    this.s.peptide += aa;
    this.s.cursor += 3;
    return '';
  }

  private transcribeStep(r: Reaction): string | null {
    if (this.s.done || !this.s.dna) return null;
    if (this.s.cursor < 0) this.s.cursor = 0;
    const base = this.s.dna[this.s.cursor];
    if (!base) {
      this.s.done = true;
      this.s.outputs.push(`mRNA ${this.s.transcript}`);
      return `mRNA complete: ${this.s.transcript.length} nt — ready to export through the nuclear pores`;
    }
    const rna = base === 'T' ? 'U' : base;
    if (this.amount(NTPS[rna]) < 1) return null;
    this.take(NTPS[rna], 1);
    for (const [sp, n] of r.products) this.give(sp, n);
    this.s.transcript += rna;
    this.s.cursor++;
    return '';
  }

  /** Every distinct molecule species built into the organelle (membranes + slots). */
  builtSpecies(): string[] {
    const keys = new Set<string>();
    for (const list of Object.values(this.s.membranes)) for (const k of list) keys.add(k);
    for (const list of Object.values(this.s.slots)) for (const k of list) keys.add(k);
    return [...keys];
  }

  customTemplate(key: string): MoleculeTemplate | null {
    return this.s.custom[key]?.template ?? null;
  }
}

import { describe, expect, it } from 'vitest';
import data from '../../src/chemistry/biomolecules/library.json';
import { decode, searchBiomolecules, toTemplate, categoriesOf, type RawBiomolecule } from '../../src/chemistry/biomolecules/library';
import { ELEMENTS } from '../../src/chemistry/elements';
import { MoleculeModel, hillFormula } from '../../src/sandbox/MoleculeModel';

const raw = (data as unknown as { molecules: RawBiomolecule[] }).molecules;
const list = raw.map(decode);
const SYMBOLS = new Set(ELEMENTS.map((e) => e.symbol));
const byName = (n: string) => {
  const m = list.find((x) => x.name.toLowerCase() === n.toLowerCase());
  if (!m) throw new Error(`${n} missing from library`);
  return m;
};
const place = (name: string, mode: 'easy' | 'hard' = 'hard') => {
  const model = new MoleculeModel();
  model.setMode(mode);
  model.addMolecule(toTemplate(byName(name), 0, 0, 64));
  return model;
};

describe('Biomolecule library data (TSK-UI-005)', () => {
  it('holds at least 1000 distinct molecules', () => {
    expect(list.length).toBeGreaterThanOrEqual(1000);
    expect(new Set(list.map((m) => m.cid)).size).toBe(list.length);
  });

  it('covers the requested categories', () => {
    const cats = categoriesOf(list);
    for (const c of ['Amino acids', 'Sugars', 'Vitamins', 'Minerals & absorbable mineral forms', 'Fatty acids', 'Nucleobases, nucleosides & nucleotides']) {
      expect(cats).toContain(c);
    }
    expect(list.filter((m) => m.category === 'Vitamins').length).toBeGreaterThanOrEqual(50);
    expect(list.filter((m) => m.category.startsWith('Minerals')).length).toBeGreaterThanOrEqual(80);
  });

  it('has internally consistent records', () => {
    for (const r of raw) {
      const symbols = r.a.split(' ');
      expect(symbols.every((s) => SYMBOLS.has(s)), r.n).toBe(true);
      expect(r.p.length, r.n).toBe(symbols.length * 2);
      expect(r.b.length % 3, r.n).toBe(0);
      for (let i = 0; i < r.b.length; i += 3) {
        expect(r.b[i] < symbols.length && r.b[i + 1] < symbols.length, r.n).toBe(true);
        expect([1, 2, 3]).toContain(r.b[i + 2]);
      }
      expect(hillFormula(symbols), r.n).toBe(r.f);
    }
  });

  it.each([
    ['Creatine', 'C4H9N3O2', 0],
    ['D-Glucose', 'C6H12O6', 0],
    ['Sulfate ion', 'O4S', -2],
    ['Oxalic acid', 'C2H2O4', 0],
    ['Vitamin C (ascorbic acid)', 'C6H8O6', 0],
    ['Adenosine triphosphate', 'C10H16N5O13P3', 0],
    ['Cholesterol', 'C27H46O', 0],
    ['Calcium ion', 'Ca', 2],
  ])('%s has formula %s, charge %i (PubChem)', (name, formula, charge) => {
    const m = byName(name);
    expect(m.formula).toBe(formula);
    expect(m.charge).toBe(charge);
  });
});

describe('Library search', () => {
  it('finds by name, synonym and formula', () => {
    expect(searchBiomolecules(list, 'creatine')[0].name).toBe('Creatine');
    expect(searchBiomolecules(list, 'C6H12O6').map((m) => m.name)).toContain('D-Glucose');
    expect(searchBiomolecules(list, 'vitamin c')[0].name).toBe('Vitamin C (ascorbic acid)');
    expect(searchBiomolecules(list, 'oxalate').length).toBeGreaterThan(0);
  });

  it('filters by category', () => {
    const vit = searchBiomolecules(list, '', 'Vitamins');
    expect(vit.every((m) => m.category === 'Vitamins')).toBe(true);
    expect(searchBiomolecules(list, 'retinol', 'Vitamins')[0].name).toBe('Vitamin A (retinol)');
  });
});

describe('Placing library molecules in the sandbox', () => {
  it('places glucose as one named, valence-complete molecule', () => {
    const model = place('D-Glucose');
    const [frag] = model.fragments();
    expect(model.fragments()).toHaveLength(1);
    expect(frag.formula).toBe('C6H12O6');
    expect(frag.match?.name).toBe('D-Glucose');
    expect(frag.atomIds.every((id) => model.valenceStatus(id) === 'complete')).toBe(true);
    expect(model.bondOrderIssues().size).toBe(0); // hard mode: PubChem orders are correct
  });

  it('keeps PubChem charges so sulfate reads as a complete −2 ion', () => {
    const model = place('Sulfate ion');
    const [frag] = model.fragments();
    expect(frag.impliedCharge).toBe(-2);
    expect(frag.atomIds.every((id) => model.valenceStatus(id) === 'complete')).toBe(true);
  });

  it('does not re-solve bond orders on placement in easy mode', () => {
    const model = place('Creatine', 'easy');
    expect(model.fragments()[0].atomIds.every((id) => model.valenceStatus(id) === 'complete')).toBe(true);
    expect(model.getBonds().filter((b) => b.order === 2)).toHaveLength(2); // C=N and C=O
  });

  it('falls back to formula naming once a placed molecule is edited', () => {
    const model = place('Methanol');
    const h = model.getAtoms().find((a) => a.symbol === 'H')!;
    model.removeAtom(h.id);
    expect(model.fragments()[0].match?.name).not.toBe('Methanol');
  });

  it('ionic compounds arrive as separate ions', () => {
    const model = place('Calcium carbonate');
    const names = model.fragments().map((f) => f.formula).sort();
    expect(names).toEqual(['CO3', 'Ca']);
  });

  it('nearly every uncharged CHNOPS molecule is valence-complete as placed', () => {
    const organic = list.filter((m) => !m.raw.z && /^[CHNOPS\d]+$/.test(m.formula) && m.atomCount > 1);
    const bad = organic.filter((m) => {
      const model = new MoleculeModel();
      model.addMolecule(toTemplate(m, 0, 0, 64));
      return model.getAtoms().some((a) => model.valenceStatus(a.id) !== 'complete');
    });
    expect(organic.length).toBeGreaterThan(600);
    expect(bad.length / organic.length).toBeLessThan(0.01);
  });
});

describe('Multi-piece library records', () => {
  it('names a salt by its ions and links them to the compound', () => {
    const model = place('Calcium carbonate');
    const frags = model.fragments();
    expect(frags.every((f) => f.partOf === 'Calcium carbonate')).toBe(true);
    expect(frags.find((f) => f.formula === 'Ca')!.impliedCharge).toBe(2);
  });

  it('gives the unnamed main piece of a split record the compound name', () => {
    const model = place('Vitamin B12 (cyanocobalamin)');
    const names = model.fragments().map((f) => f.match?.name);
    expect(names).toContain('Vitamin B12 (cyanocobalamin) (part)');
  });
});

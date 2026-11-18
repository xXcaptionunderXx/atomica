import { describe, it, expect } from 'vitest';
import { MoleculeModel, hillFormula, molecularWeight } from '../../src/sandbox/MoleculeModel';

function build(symbols: string[]): { m: MoleculeModel; ids: number[] } {
  const m = new MoleculeModel();
  const ids = symbols.map((s, i) => m.addAtom(s, i * 10, 0).id);
  return { m, ids };
}

describe('MoleculeModel (TSK-UI-001)', () => {
  it('builds water: O with two H is valence-complete, H2O, 18.015 g/mol', () => {
    const { m, ids: [o, h1, h2] } = build(['O', 'H', 'H']);
    expect(m.bond(o, h1).ok).toBe(true);
    expect(m.bond(o, h2).ok).toBe(true);
    expect(m.valenceStatus(o)).toBe('complete');
    const [frag] = m.fragments();
    expect(frag.formula).toBe('H2O');
    expect(frag.molecularWeight).toBeCloseTo(18.015, 3);
  });

  it('refuses a bond that exceeds valence (third H on oxygen)', () => {
    const { m, ids: [o, h1, h2, h3] } = build(['O', 'H', 'H', 'H']);
    m.bond(o, h1);
    m.bond(o, h2);
    const r = m.bond(o, h3);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/O has no free valence/);
    expect(m.getBonds()).toHaveLength(2);
  });

  it('builds CO2 with double bonds by bonding the same pair twice', () => {
    const { m, ids: [c, o1, o2] } = build(['C', 'O', 'O']);
    m.bond(c, o1);
    m.bond(c, o1);
    m.bond(c, o2);
    m.bond(c, o2);
    expect(m.findBond(c, o1)!.order).toBe(2);
    expect(m.valenceStatus(c)).toBe('complete');
    expect(m.fragments()[0].formula).toBe('CO2');
    expect(m.fragments()[0].molecularWeight).toBeCloseTo(44.009, 3);
  });

  it('builds N2 with a triple bond and caps bond order at 3', () => {
    const { m, ids: [n1, n2] } = build(['N', 'N']);
    m.bond(n1, n2);
    m.bond(n1, n2);
    m.bond(n1, n2);
    expect(m.findBond(n1, n2)!.order).toBe(3);
    expect(m.bond(n1, n2).ok).toBe(false);
  });

  it('cycles bond order within valence limits', () => {
    const { m, ids: [c, o, h] } = build(['C', 'O', 'H']);
    const bond = m.bond(c, o).bond!;
    m.bond(c, h);
    expect(m.cycleBondOrder(bond.id).bond!.order).toBe(2); // O can take 2
    expect(m.cycleBondOrder(bond.id).bond!.order).toBe(1); // O full → wraps to 1
  });

  it('noble gases with no chemistry cannot bond; self-bonds are refused', () => {
    const { m, ids: [ne, h] } = build(['Ne', 'H']);
    expect(m.valenceStatus(ne)).toBe('inert');
    expect(m.bond(ne, h).reason).toMatch(/no established bonding/);
    expect(m.bond(h, h).reason).toMatch(/itself/);
  });

  it('reports separate fragments and removes bonds with their atom', () => {
    const { m, ids: [c, h, na, cl] } = build(['C', 'H', 'Na', 'Cl']);
    m.bond(c, h);
    m.bond(na, cl);
    expect(m.fragments().map((f) => f.formula)).toEqual(['CH', 'ClNa']);
    m.removeAtom(c);
    expect(m.getBonds()).toHaveLength(1);
    expect(m.fragments().map((f) => f.formula)).toEqual(['H', 'ClNa']);
  });

  it('notifies subscribers on change', () => {
    const m = new MoleculeModel();
    let n = 0;
    const off = m.subscribe(() => n++);
    m.addAtom('C', 0, 0);
    off();
    m.addAtom('C', 0, 0);
    expect(n).toBe(1);
  });
});

describe('Hill formula and molecular weight', () => {
  it('orders C, H, then alphabetical; alphabetical without carbon', () => {
    expect(hillFormula(['O', 'H', 'C', 'H', 'C', 'H', 'H', 'H', 'H'])).toBe('C2H6O'); // ethanol
    expect(hillFormula(['H', 'S', 'O', 'O', 'O', 'O', 'H'])).toBe('H2O4S'); // sulfuric acid
    expect(hillFormula(['Cl', 'C', 'Cl', 'Cl', 'Cl'])).toBe('CCl4');
  });

  it('computes glucose C6H12O6 ≈ 180.156 g/mol', () => {
    const glucose = [...Array(6).fill('C'), ...Array(12).fill('H'), ...Array(6).fill('O')];
    expect(molecularWeight(glucose)).toBeCloseTo(180.156, 2);
  });
});

describe('Formal charges and whole-molecule placement (TSK-UI-005)', () => {
  it('shifts allowed valences by formal charge', () => {
    const m = new MoleculeModel();
    const ids = m.addMolecule({
      name: 'test',
      symbols: ['N', 'O', 'C'],
      positions: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
      bonds: [],
      charges: [1, -1, 0],
    });
    expect(m.valencesOf(ids[0])).toContain(4); // ammonium-like N+
    expect(m.valencesOf(ids[1])).toContain(1); // alkoxide O-
    expect(m.valencesOf(ids[2])).toEqual([4]);
  });

  it('adds a whole molecule as a single change', () => {
    const m = new MoleculeModel();
    let calls = 0;
    m.subscribe(() => calls++);
    m.addMolecule({
      name: 'Water',
      symbols: ['O', 'H', 'H'],
      positions: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 0 }],
      bonds: [[0, 1, 1], [0, 2, 1]],
    });
    expect(calls).toBe(1);
    expect(m.fragments()[0].match?.name).toBe('Water');
  });
});

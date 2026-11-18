import { describe, it, expect } from 'vitest';
import { solveBondOrders } from '../../src/sandbox/BondOrderSolver';
import { MoleculeModel } from '../../src/sandbox/MoleculeModel';
import { getElement } from '../../src/chemistry/elements';

function model(mode: 'easy' | 'hard', symbols: string[], edges: [number, number][]) {
  const m = new MoleculeModel();
  m.setMode(mode);
  const ids = symbols.map((s, i) => m.addAtom(s, i * 10, 0).id);
  for (const [a, b] of edges) {
    const r = m.bond(ids[a], ids[b]);
    if (!r.ok) throw new Error(r.reason);
  }
  return { m, ids };
}
const orderOf = (m: MoleculeModel, a: number, b: number) => m.findBond(a, b)!.order;

describe('Bond-order solver (TSK-UI-004)', () => {
  it('finds C=O double bonds in CO2', () => {
    const { m, ids } = model('easy', ['C', 'O', 'O'], [[0, 1], [0, 2]]);
    expect(orderOf(m, ids[0], ids[1])).toBe(2);
    expect(orderOf(m, ids[0], ids[2])).toBe(2);
  });

  it('finds the N≡N triple bond and HC≡N', () => {
    const n2 = model('easy', ['N', 'N'], [[0, 1]]);
    expect(orderOf(n2.m, n2.ids[0], n2.ids[1])).toBe(3);
    const hcn = model('easy', ['H', 'C', 'N'], [[0, 1], [1, 2]]);
    expect(orderOf(hcn.m, hcn.ids[1], hcn.ids[2])).toBe(3);
  });

  it('gives benzene alternating double bonds (every atom satisfied)', () => {
    const symbols = [...Array(6).fill('C'), ...Array(6).fill('H')];
    const edges: [number, number][] = [];
    for (let i = 0; i < 6; i++) edges.push([i, (i + 1) % 6], [i, 6 + i]);
    const { m, ids } = model('easy', symbols, edges);
    const ringOrders = [0, 1, 2, 3, 4, 5].map((i) => orderOf(m, ids[i], ids[(i + 1) % 6]));
    expect(ringOrders.filter((o) => o === 2)).toHaveLength(3);
    for (const id of ids) expect(m.valenceStatus(id)).toBe('complete');
  });

  it('keeps ethane single and makes ethylene double', () => {
    const ethane = model('easy', ['C', 'C', 'H', 'H', 'H', 'H', 'H', 'H'], [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [1, 6], [1, 7]]);
    expect(orderOf(ethane.m, ethane.ids[0], ethane.ids[1])).toBe(1);
    const ethylene = model('easy', ['C', 'C', 'H', 'H', 'H', 'H'], [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5]]);
    expect(orderOf(ethylene.m, ethylene.ids[0], ethylene.ids[1])).toBe(2);
  });

  it('sulfate: S takes two S=O so that S reaches valence 6; two O stay open (2− charge)', () => {
    const { m, ids } = model('easy', ['S', 'O', 'O', 'O', 'O'], [[0, 1], [0, 2], [0, 3], [0, 4]]);
    expect(m.usedValence(ids[0])).toBe(6);
    const frag = m.fragments()[0];
    expect(frag.impliedCharge).toBe(-2);
    expect(frag.match!.name).toBe('Sulfate');
  });

  it('re-solves when atoms are added (C=O becomes C–O when O gains an H)', () => {
    const { m, ids } = model('easy', ['C', 'O'], [[0, 1]]);
    expect(orderOf(m, ids[0], ids[1])).toBe(2);
    const h = m.addAtom('H', 0, 0).id;
    m.bond(ids[1], h);
    expect(orderOf(m, ids[0], ids[1])).toBe(1);
  });

  it('easy mode refuses manual order changes', () => {
    const { m, ids } = model('easy', ['C', 'O'], [[0, 1]]);
    expect(m.bond(ids[0], ids[1]).ok).toBe(false);
    expect(m.cycleBondOrder(m.findBond(ids[0], ids[1])!.id).ok).toBe(false);
  });

  it('hard mode flags wrong orders until the user fixes them', () => {
    const { m, ids } = model('hard', ['C', 'O', 'O'], [[0, 1], [0, 2]]);
    expect(m.bondOrderIssues().size).toBe(2);
    m.bond(ids[0], ids[1]); // → double
    expect(m.bondOrderIssues().size).toBe(1);
    m.bond(ids[0], ids[2]);
    expect(m.bondOrderIssues().size).toBe(0);
  });

  it('hard mode accepts either Kekulé structure of benzene', () => {
    const symbols = [...Array(6).fill('C'), ...Array(6).fill('H')];
    const edges: [number, number][] = [];
    for (let i = 0; i < 6; i++) edges.push([i, (i + 1) % 6], [i, 6 + i]);
    for (const offset of [0, 1]) {
      const { m, ids } = model('hard', symbols, edges);
      for (let i = offset; i < 6; i += 2) m.bond(ids[i], ids[(i + 1) % 6]);
      expect(m.bondOrderIssues().size).toBe(0);
    }
  });

  it('does not flag an incomplete skeleton that no order change can improve', () => {
    const { m } = model('hard', ['C', 'C'], [[0, 1]]);
    expect(m.bondOrderIssues().size).toBe(0);
  });

  it('reports a non-exhaustive search instead of hanging on large inputs', () => {
    const n = 40;
    const atoms = Array.from({ length: n }, (_, i) => ({ id: i, valences: getElement('C').valences }));
    const bonds = Array.from({ length: n - 1 }, (_, i) => ({ id: i, a: i, b: i + 1, order: 1 }));
    const r = solveBondOrders(atoms, bonds, 1000);
    expect(r.exhaustive).toBe(false);
    expect(r.orders.size).toBe(n - 1);
  });
});

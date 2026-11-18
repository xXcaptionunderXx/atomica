import { describe, it, expect } from 'vitest';
import { MoleculeModel } from '../../src/sandbox/MoleculeModel';

function water(m: MoleculeModel, name = 'Water', x = 0) {
  return m.addMolecule({
    name,
    symbols: ['O', 'H', 'H'],
    positions: [{ x, y: 0 }, { x: x + 50, y: 0 }, { x: x - 50, y: 0 }],
    bonds: [[0, 1, 1], [0, 2, 1]],
  });
}

describe('Undo / redo (TSK-UI-006)', () => {
  it('undoes and redoes structural edits step by step', () => {
    const m = new MoleculeModel();
    const c = m.addAtom('C', 0, 0);
    const o = m.addAtom('O', 60, 0);
    m.bond(c.id, o.id);
    expect(m.getBonds()).toHaveLength(1);
    expect(m.undo()).toBe(true);
    expect(m.getBonds()).toHaveLength(0);
    expect(m.undo()).toBe(true);
    expect(m.getAtoms()).toHaveLength(1);
    expect(m.redo()).toBe(true);
    expect(m.redo()).toBe(true);
    expect(m.getBonds()).toHaveLength(1);
    expect(m.redo()).toBe(false);
  });

  it('a new edit clears the redo stack', () => {
    const m = new MoleculeModel();
    m.addAtom('C', 0, 0);
    m.undo();
    expect(m.canRedo).toBe(true);
    m.addAtom('N', 0, 0);
    expect(m.canRedo).toBe(false);
  });

  it('records committed moves', () => {
    const m = new MoleculeModel();
    const a = m.addAtom('C', 0, 0);
    m.moveAtom(a.id, 100, 40);
    m.commit();
    m.undo();
    expect(m.getAtom(a.id)).toMatchObject({ x: 0, y: 0 });
    m.redo();
    expect(m.getAtom(a.id)).toMatchObject({ x: 100, y: 40 });
  });

  it('a whole placed molecule and a group delete are single steps', () => {
    const m = new MoleculeModel();
    const ids = water(m);
    m.removeAtoms(ids);
    expect(m.getAtoms()).toHaveLength(0);
    m.undo();
    expect(m.getAtoms()).toHaveLength(3);
    expect(m.fragments()[0].match?.name).toBe('Water');
    m.undo();
    expect(m.getAtoms()).toHaveLength(0);
  });

  it('undoes Clear', () => {
    const m = new MoleculeModel();
    water(m);
    m.clear();
    m.undo();
    expect(m.getAtoms()).toHaveLength(3);
  });

  it('switching Easy/Hard is not an undo step', () => {
    const m = new MoleculeModel();
    m.addAtom('C', 0, 0);
    m.setMode('easy');
    m.undo();
    expect(m.getAtoms()).toHaveLength(0);
    expect(m.mode).toBe('easy');
  });
});

describe('Copy / paste (TSK-UI-006)', () => {
  it('copies atoms with the bonds between them and keeps library names', () => {
    const m = new MoleculeModel();
    const ids = water(m, 'Dihydrogen monoxide');
    const clip = m.extract(ids)!;
    clip.positions = clip.positions.map((p) => ({ x: p.x + 200, y: p.y }));
    const pasted = m.addMolecule(clip);
    expect(pasted).toHaveLength(3);
    expect(m.getBonds()).toHaveLength(4);
    const names = m.fragments().map((f) => f.match?.name);
    expect(names).toEqual(['Dihydrogen monoxide', 'Dihydrogen monoxide']);
  });

  it('a partial copy loses the exact library name', () => {
    const m = new MoleculeModel();
    const ids = water(m, 'Dihydrogen monoxide');
    m.addMolecule(m.extract(ids.slice(0, 2))!); // O-H only
    const pasted = m.fragments().find((f) => f.atomIds.length === 2)!;
    expect(pasted.match?.name).not.toBe('Dihydrogen monoxide');
  });

  it('copies hand-built atoms without inventing names, and charges survive', () => {
    const m = new MoleculeModel();
    const a = m.addAtom('Na', 0, 0);
    expect(m.extract([a.id])!.originIndex).toEqual([-1]);
    const ion = m.addMolecule({ name: 'Chloride ion', symbols: ['Cl'], positions: [{ x: 0, y: 0 }], bonds: [], charges: [-1] });
    m.addMolecule(m.extract(ion)!);
    expect(m.getAtoms().filter((x) => x.charge === -1)).toHaveLength(2);
  });
});

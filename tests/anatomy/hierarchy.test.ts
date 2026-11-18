import { describe, it, expect } from 'vitest';
import {
  HierarchyTree,
  HierarchyError,
  SCALE_LEVELS,
  buildCardiacEnergeticsHierarchy,
} from '../../src/anatomy/HierarchyTree';
import { NavigationState, type NavigationEvent } from '../../src/anatomy/NavigationState';
import type { PubChemCompound } from '../../src/chemistry/PubChemClient';

/** Minimal water record (CID 962) for atom expansion tests — no network. */
const WATER: PubChemCompound = {
  cid: 962,
  name: 'Water',
  formula: 'H2O',
  molecularWeight: 18.015,
  charge: 0,
  origin: 'deposited',
  atoms: [
    { aid: 1, element: 'O', atomicNumber: 8, x: 0, y: 0, z: 0 },
    { aid: 2, element: 'H', atomicNumber: 1, x: 0.2774, y: 0.8929, z: 0.2544 },
    { aid: 3, element: 'H', atomicNumber: 1, x: 0.6068, y: -0.2383, z: -0.7169 },
  ],
  bonds: [
    { sourceAid: 1, targetAid: 2, order: 1 },
    { sourceAid: 1, targetAid: 3, order: 1 },
  ],
};

describe('HierarchyTree (TSK-ENG-002)', () => {
  it('builds the Human → Heart → Cardiomyocyte → Mitochondrion → ATP synthase → ATP path', () => {
    const tree = buildCardiacEnergeticsHierarchy();
    expect(tree.validate()).toEqual([]);
    expect(tree.getPath('atp').map((n) => n.id)).toEqual([
      'human',
      'heart',
      'myocardium',
      'cardiomyocyte',
      'mitochondrion',
      'atp-synthase',
      'atp',
    ]);
    expect(tree.getPath('atp').map((n) => n.level)).toEqual(SCALE_LEVELS.slice(0, 7));
  });

  it('anchors every seeded node to an ontology or database identifier', () => {
    const tree = buildCardiacEnergeticsHierarchy();
    for (const node of [tree.getRoot()!, ...tree.getDescendants('human')]) {
      expect(node.refs.length).toBeGreaterThan(0);
    }
    expect(tree.getNode('heart').refs[0]).toEqual({ source: 'UBERON', id: 'UBERON:0000948' });
    expect(tree.getNode('atp').structure).toEqual({ kind: 'pubchem', cid: 5957 });
  });

  it('discloses the homolog approximation on the ATP synthase structure', () => {
    const synthase = buildCardiacEnergeticsHierarchy().getNode('atp-synthase');
    expect(synthase.structure).toEqual({ kind: 'pdb', pdbId: '1BMF' });
    expect(synthase.approximation).toMatch(/bovine/i);
  });

  it('length scale decreases monotonically from organism to molecule (~9 orders of magnitude)', () => {
    const path = buildCardiacEnergeticsHierarchy().getPath('atp');
    for (let i = 1; i < path.length; i++) {
      expect(path[i].characteristicLengthM).toBeLessThan(path[i - 1].characteristicLengthM);
    }
    const span = Math.log10(path[0].characteristicLengthM / path[path.length - 1].characteristicLengthM);
    expect(span).toBeGreaterThan(8);
    expect(span).toBeLessThan(10);
  });

  it('expands a molecule into atom nodes from a PubChem record', () => {
    const tree = new HierarchyTree();
    tree.addNode({ id: 'cell', name: 'Cell', level: 'cell', parentId: null, characteristicLengthM: 1e-5, refs: [] });
    tree.addNode({ id: 'h2o', name: 'Water', level: 'molecule', parentId: 'cell', characteristicLengthM: 3e-10, refs: [] });
    const atoms = tree.attachAtomsFromCompound('h2o', WATER);
    expect(atoms.map((a) => a.element)).toEqual(['O', 'H', 'H']);
    expect(atoms.every((a) => a.level === 'atom' && a.parentId === 'h2o')).toBe(true);
    expect(tree.getPath('h2o/atom-2').map((n) => n.id)).toEqual(['cell', 'h2o', 'h2o/atom-2']);
    expect(tree.validate()).toEqual([]);
  });

  it('rejects atom expansion on non-molecule nodes and double expansion', () => {
    const tree = buildCardiacEnergeticsHierarchy();
    expect(() => tree.attachAtomsFromCompound('mitochondrion', WATER)).toThrow(HierarchyError);
    tree.attachAtomsFromCompound('atp', WATER);
    expect(() => tree.attachAtomsFromCompound('atp', WATER)).toThrow(/already has children/);
  });

  it('enforces scale ordering, size ordering, unique ids, single root and existing parents', () => {
    const tree = new HierarchyTree();
    tree.addNode({ id: 'org', name: 'Org', level: 'organism', parentId: null, characteristicLengthM: 1, refs: [] });
    const base = { name: 'x', refs: [] };
    expect(() => tree.addNode({ ...base, id: 'org', level: 'organ', parentId: 'org', characteristicLengthM: 0.1 })).toThrow(/Duplicate/);
    expect(() => tree.addNode({ ...base, id: 'r2', level: 'organism', parentId: null, characteristicLengthM: 1 })).toThrow(/root/);
    expect(() => tree.addNode({ ...base, id: 'o2', level: 'organism', parentId: 'org', characteristicLengthM: 0.5 })).toThrow(/finer/);
    expect(() => tree.addNode({ ...base, id: 'big', level: 'organ', parentId: 'org', characteristicLengthM: 2 })).toThrow(/larger/);
    expect(() => tree.addNode({ ...base, id: 'orph', level: 'organ', parentId: 'nope', characteristicLengthM: 0.1 })).toThrow(/not found/);
    expect(() => tree.addNode({ ...base, id: 'neg', level: 'organ', parentId: 'org', characteristicLengthM: 0 })).toThrow(/positive/);
    expect(() => tree.addNode({ ...base, id: 'a', level: 'atom', parentId: 'org', characteristicLengthM: 1e-10 })).toThrow(/element/);
    // Skipping levels is allowed (organism → organelle).
    expect(tree.addNode({ ...base, id: 'skip', level: 'organelle', parentId: 'org', characteristicLengthM: 1e-6 }).level).toBe('organelle');
  });

  it('answers ancestry queries', () => {
    const tree = buildCardiacEnergeticsHierarchy();
    tree.addNode({ id: 'nucleus', name: 'Nucleus', level: 'organelle', parentId: 'cardiomyocyte', characteristicLengthM: 5e-6, refs: [{ source: 'GO', id: 'GO:0005634' }] });
    expect(tree.isAncestor('heart', 'atp')).toBe(true);
    expect(tree.isAncestor('atp', 'heart')).toBe(false);
    expect(tree.lowestCommonAncestor('nucleus', 'atp').id).toBe('cardiomyocyte');
    expect(tree.findByLevel('organelle').map((n) => n.id).sort()).toEqual(['mitochondrion', 'nucleus']);
  });
});

describe('NavigationState (TSK-ENG-002)', () => {
  it('starts at the root and zooms down to an individual atom', () => {
    const tree = buildCardiacEnergeticsHierarchy();
    tree.attachAtomsFromCompound('atp', WATER);
    const nav = new NavigationState(tree);
    expect(nav.current.id).toBe('human');
    expect(nav.canZoomOut()).toBe(false);
    for (let i = 0; i < 6; i++) nav.zoomIn();
    expect(nav.current.id).toBe('atp');
    expect(() => nav.zoomIn()).toThrow(/exactly one child/);
    nav.zoomIn('atp/atom-1');
    expect(nav.current.level).toBe('atom');
    expect(nav.current.element).toBe('O');
    expect(nav.breadcrumbs()).toHaveLength(8);
  });

  it('reports magnification for camera transitions', () => {
    const nav = new NavigationState(buildCardiacEnergeticsHierarchy());
    const zin = nav.zoomIn('heart');
    expect(zin.kind).toBe('zoom_in');
    expect(zin.magnification).toBeCloseTo(1.7 / 0.12, 10);
    const zout = nav.zoomOut();
    expect(zout.magnification).toBeCloseTo(0.12 / 1.7, 10);
    const jump = nav.jumpTo('mitochondrion');
    expect(jump.magnification).toBeCloseTo(1.7 / 1e-6, 3);
  });

  it('rejects zooming into a non-child and zooming out of the root', () => {
    const nav = new NavigationState(buildCardiacEnergeticsHierarchy());
    expect(() => nav.zoomIn('mitochondrion')).toThrow(/not a direct child/);
    expect(() => nav.zoomOut()).toThrow(/root/);
    expect(() => nav.jumpTo('ghost')).toThrow(/not found/);
  });

  it('supports browser-style back/forward history', () => {
    const nav = new NavigationState(buildCardiacEnergeticsHierarchy());
    nav.zoomIn('heart');
    nav.jumpTo('atp');
    expect(nav.back().to.id).toBe('heart');
    expect(nav.back().to.id).toBe('human');
    expect(nav.canGoBack()).toBe(false);
    expect(nav.forward().to.id).toBe('heart');
    // A new navigation clears forward history.
    nav.zoomIn('myocardium');
    expect(nav.canGoForward()).toBe(false);
    expect(() => nav.forward()).toThrow(/forward/);
  });

  it('notifies subscribers and supports unsubscribe', () => {
    const nav = new NavigationState(buildCardiacEnergeticsHierarchy(), 'cardiomyocyte');
    const events: NavigationEvent[] = [];
    const unsub = nav.subscribe((e) => events.push(e));
    nav.zoomIn();
    nav.zoomOut();
    unsub();
    nav.zoomIn();
    expect(events.map((e) => `${e.kind}:${e.to.id}`)).toEqual(['zoom_in:mitochondrion', 'zoom_out:cardiomyocyte']);
  });
});

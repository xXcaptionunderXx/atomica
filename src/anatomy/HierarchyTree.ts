/**
 * ATOMICA Organism-to-Atom Hierarchy Tree
 * Multi-scale containment graph: Organism → Organ → Tissue → Cell → Organelle → Complex → Molecule → Atom.
 * Governed by Section 23 (core product vision) and Task TSK-ENG-002.
 *
 * Pure data structure — no rendering, no DOM (ADR-003). The viewport and UI consume it.
 */

import type { PubChemCompound } from '../chemistry/PubChemClient';

/** Biological / physical scale levels, ordered coarse → fine. */
export const SCALE_LEVELS = [
  'organism',
  'organ',
  'tissue',
  'cell',
  'organelle',
  'complex',
  'molecule',
  'atom',
] as const;

export type ScaleLevel = (typeof SCALE_LEVELS)[number];

/** Numeric rank of a level; higher = finer scale. */
export function scaleRank(level: ScaleLevel): number {
  return SCALE_LEVELS.indexOf(level);
}

/** External identifier anchoring a node to a curated ontology or structural database. */
export interface OntologyRef {
  /** e.g. 'NCBITaxon', 'UBERON', 'CL', 'GO', 'PDB', 'PubChem' */
  source: 'NCBITaxon' | 'UBERON' | 'CL' | 'GO' | 'PDB' | 'PubChem';
  id: string;
}

/** Pointer to loadable structural data the visualization layer can fetch. */
export type StructureRef =
  | { kind: 'pdb'; pdbId: string }
  | { kind: 'pubchem'; cid: number };

export interface HierarchyNode {
  id: string;
  name: string;
  level: ScaleLevel;
  parentId: string | null;
  childIds: string[];
  /**
   * Characteristic linear size in metres. Order-of-magnitude value used for
   * camera zoom transitions — NOT a measured dimension of a specific specimen.
   */
  characteristicLengthM: number;
  refs: OntologyRef[];
  structure?: StructureRef;
  /** Element symbol, only for level === 'atom'. */
  element?: string;
  /** Explicit disclosure of any approximation (Section 20: no hidden fake science). */
  approximation?: string;
}

export type NewHierarchyNode = Omit<HierarchyNode, 'childIds'>;

export class HierarchyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HierarchyError';
  }
}

export class HierarchyTree {
  private nodes = new Map<string, HierarchyNode>();
  private rootId: string | null = null;

  /**
   * Insert a node. Parents must exist before children, which makes cycles impossible.
   * A child must be strictly finer in scale than its parent (levels may be skipped,
   * e.g. organelle → molecule) and not larger in characteristic length.
   */
  addNode(input: NewHierarchyNode): HierarchyNode {
    if (!input.id) throw new HierarchyError('Node id must be non-empty');
    if (this.nodes.has(input.id)) throw new HierarchyError(`Duplicate node id: ${input.id}`);
    if (!(input.characteristicLengthM > 0) || !Number.isFinite(input.characteristicLengthM)) {
      throw new HierarchyError(`Node ${input.id}: characteristicLengthM must be a positive finite number`);
    }
    if (input.level === 'atom' && !input.element) {
      throw new HierarchyError(`Atom node ${input.id} requires an element symbol`);
    }

    if (input.parentId === null) {
      if (this.rootId !== null) {
        throw new HierarchyError(`Tree already has root ${this.rootId}; cannot add second root ${input.id}`);
      }
    } else {
      const parent = this.nodes.get(input.parentId);
      if (!parent) throw new HierarchyError(`Parent ${input.parentId} not found for node ${input.id}`);
      if (scaleRank(input.level) <= scaleRank(parent.level)) {
        throw new HierarchyError(
          `Node ${input.id} (${input.level}) must be finer than parent ${parent.id} (${parent.level})`,
        );
      }
      if (input.characteristicLengthM > parent.characteristicLengthM) {
        throw new HierarchyError(
          `Node ${input.id} (${input.characteristicLengthM} m) is larger than parent ${parent.id} (${parent.characteristicLengthM} m)`,
        );
      }
    }

    const node: HierarchyNode = { ...input, refs: [...input.refs], childIds: [] };
    this.nodes.set(node.id, node);
    if (node.parentId === null) {
      this.rootId = node.id;
    } else {
      this.nodes.get(node.parentId)!.childIds.push(node.id);
    }
    return node;
  }

  get size(): number {
    return this.nodes.size;
  }

  getRoot(): HierarchyNode | null {
    return this.rootId ? this.nodes.get(this.rootId)! : null;
  }

  has(id: string): boolean {
    return this.nodes.has(id);
  }

  getNode(id: string): HierarchyNode {
    const node = this.nodes.get(id);
    if (!node) throw new HierarchyError(`Node not found: ${id}`);
    return node;
  }

  getParent(id: string): HierarchyNode | null {
    const node = this.getNode(id);
    return node.parentId ? this.getNode(node.parentId) : null;
  }

  getChildren(id: string): HierarchyNode[] {
    return this.getNode(id).childIds.map((c) => this.getNode(c));
  }

  /** Root → node inclusive. */
  getPath(id: string): HierarchyNode[] {
    const path: HierarchyNode[] = [];
    let cur: HierarchyNode | null = this.getNode(id);
    while (cur) {
      path.push(cur);
      cur = cur.parentId ? this.getNode(cur.parentId) : null;
    }
    return path.reverse();
  }

  /** Depth-first descendants (excluding the node itself). */
  getDescendants(id: string): HierarchyNode[] {
    const out: HierarchyNode[] = [];
    const stack = [...this.getNode(id).childIds].reverse();
    while (stack.length) {
      const n = this.getNode(stack.pop()!);
      out.push(n);
      for (let i = n.childIds.length - 1; i >= 0; i--) stack.push(n.childIds[i]);
    }
    return out;
  }

  findByLevel(level: ScaleLevel): HierarchyNode[] {
    return [...this.nodes.values()].filter((n) => n.level === level);
  }

  isAncestor(ancestorId: string, id: string): boolean {
    let cur = this.getNode(id).parentId;
    while (cur) {
      if (cur === ancestorId) return true;
      cur = this.getNode(cur).parentId;
    }
    return false;
  }

  lowestCommonAncestor(a: string, b: string): HierarchyNode {
    const pathA = new Set(this.getPath(a).map((n) => n.id));
    let cur: HierarchyNode | null = this.getNode(b);
    while (cur) {
      if (pathA.has(cur.id)) return cur;
      cur = cur.parentId ? this.getNode(cur.parentId) : null;
    }
    throw new HierarchyError(`Nodes ${a} and ${b} share no ancestor`);
  }

  /**
   * Expand a molecule node into atom children from a PubChem compound record.
   * Atom ids are `${moleculeId}/atom-${aid}`.
   */
  attachAtomsFromCompound(moleculeId: string, compound: PubChemCompound): HierarchyNode[] {
    const molecule = this.getNode(moleculeId);
    if (molecule.level !== 'molecule') {
      throw new HierarchyError(`Atoms can only be attached to a molecule node; ${moleculeId} is ${molecule.level}`);
    }
    if (molecule.childIds.length > 0) {
      throw new HierarchyError(`Molecule ${moleculeId} already has children`);
    }
    return compound.atoms.map((atom) =>
      this.addNode({
        id: `${moleculeId}/atom-${atom.aid}`,
        name: `${atom.element}${atom.aid}`,
        level: 'atom',
        parentId: moleculeId,
        // ~1 Å: order of magnitude of covalent radii; per-element radii live in AtomRecord.metadata.
        characteristicLengthM: 1e-10,
        refs: [{ source: 'PubChem', id: `CID${compound.cid}:aid${atom.aid}` }],
        element: atom.element,
      }),
    );
  }

  /** Structural invariant check; returns a list of violations (empty = valid). */
  validate(): string[] {
    const errors: string[] = [];
    if (this.nodes.size > 0 && this.rootId === null) errors.push('Non-empty tree has no root');
    for (const node of this.nodes.values()) {
      for (const cid of node.childIds) {
        const child = this.nodes.get(cid);
        if (!child) errors.push(`${node.id} references missing child ${cid}`);
        else if (child.parentId !== node.id) errors.push(`${cid} parent mismatch (expected ${node.id})`);
      }
      if (node.parentId && !this.nodes.has(node.parentId)) {
        errors.push(`${node.id} references missing parent ${node.parentId}`);
      }
    }
    return errors;
  }
}

/**
 * Reference hierarchy for the TSK-ENG-002 navigation path:
 * Human → Heart → Cardiac muscle tissue → Cardiomyocyte → Mitochondrion → ATP synthase → ATP.
 *
 * Lengths are order-of-magnitude characteristic sizes for camera zoom, not specimen measurements.
 * Atoms are attached at runtime via `attachAtomsFromCompound` (PubChem CID 5957).
 */
export function buildCardiacEnergeticsHierarchy(): HierarchyTree {
  const t = new HierarchyTree();
  t.addNode({
    id: 'human',
    name: 'Homo sapiens',
    level: 'organism',
    parentId: null,
    characteristicLengthM: 1.7, // adult stature
    refs: [{ source: 'NCBITaxon', id: '9606' }],
  });
  t.addNode({
    id: 'heart',
    name: 'Heart',
    level: 'organ',
    parentId: 'human',
    characteristicLengthM: 0.12, // adult heart length ~12 cm
    refs: [{ source: 'UBERON', id: 'UBERON:0000948' }],
  });
  t.addNode({
    id: 'myocardium',
    name: 'Cardiac muscle tissue',
    level: 'tissue',
    parentId: 'heart',
    characteristicLengthM: 1e-2, // left-ventricular wall thickness ~1 cm
    refs: [{ source: 'UBERON', id: 'UBERON:0001133' }],
  });
  t.addNode({
    id: 'cardiomyocyte',
    name: 'Cardiomyocyte',
    level: 'cell',
    parentId: 'myocardium',
    characteristicLengthM: 1e-4, // ~100 µm long axis
    refs: [{ source: 'CL', id: 'CL:0000746' }],
  });
  t.addNode({
    id: 'mitochondrion',
    name: 'Mitochondrion',
    level: 'organelle',
    parentId: 'cardiomyocyte',
    characteristicLengthM: 1e-6, // ~1 µm
    refs: [{ source: 'GO', id: 'GO:0005739' }],
  });
  t.addNode({
    id: 'atp-synthase',
    name: 'ATP synthase (Complex V)',
    level: 'complex',
    parentId: 'mitochondrion',
    characteristicLengthM: 2e-8, // ~20 nm assembled F1Fo complex
    refs: [{ source: 'GO', id: 'GO:0005753' }],
    structure: { kind: 'pdb', pdbId: '1BMF' },
    approximation: 'Structure 1BMF is bovine mitochondrial F1-ATPase (catalytic head only), used as a homolog of human Complex V.',
  });
  t.addNode({
    id: 'atp',
    name: 'Adenosine triphosphate',
    level: 'molecule',
    parentId: 'atp-synthase',
    characteristicLengthM: 1.5e-9, // ~1–2 nm
    refs: [{ source: 'PubChem', id: '5957' }],
    structure: { kind: 'pubchem', cid: 5957 },
  });
  return t;
}

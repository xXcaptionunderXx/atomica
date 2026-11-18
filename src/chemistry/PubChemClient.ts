/**
 * ATOMICA PubChem REST Client
 * Integrates real-world chemical structures and properties from NCBI PubChem (PUG-REST).
 * Governed by Section 23.1 and Task TSK-ENG-001.
 */

export interface PubChemCompound {
  cid: number;
  name: string;
  formula: string;
  molecularWeight: number;
  iupacName?: string;
  smiles?: string;
  inchi?: string;
  inchiKey?: string;
  exactMass?: number;
  charge: number;
  xlogp?: number;
  tpsa?: number;
  hBondDonorCount?: number;
  hBondAcceptorCount?: number;
  rotatableBondCount?: number;
  atoms: Array<{
    aid: number;
    element: string;
    atomicNumber: number;
    x: number;
    y: number;
    z?: number;
  }>;
  bonds: Array<{
    sourceAid: number;
    targetAid: number;
    order: number;
  }>;
  origin: 'experimental' | 'deposited' | 'computed';
}

/** Pre-bundled offline fallback records for core scientific molecules */
export const CORE_MOLECULE_CACHE: Record<string, PubChemCompound> = {
  creatine: {
    cid: 586,
    name: 'Creatine',
    formula: 'C4H9N3O2',
    molecularWeight: 131.13,
    iupacName: '2-(1-methylguanidino)acetic acid',
    smiles: 'CN(CC(=O)O)C(=N)N',
    inchi: 'InChI=1S/C4H9N3O2/c1-7(4(5)6)2-3(8)9/h2H2,1H3,(H3,5,6)(H,8,9)',
    inchiKey: 'CVSVTCORWBXHQV-UHFFFAOYSA-N',
    charge: 0,
    origin: 'deposited',
    atoms: [
      { aid: 1, element: 'C', atomicNumber: 6, x: 0.0, y: 0.0, z: 0.0 },
      { aid: 2, element: 'N', atomicNumber: 7, x: 1.45, y: 0.0, z: 0.0 },
      { aid: 3, element: 'C', atomicNumber: 6, x: 2.18, y: 1.26, z: 0.0 },
      { aid: 4, element: 'C', atomicNumber: 6, x: 2.18, y: -1.26, z: 0.0 },
      { aid: 5, element: 'O', atomicNumber: 8, x: 3.52, y: -1.26, z: 0.0 },
      { aid: 6, element: 'O', atomicNumber: 8, x: 1.45, y: -2.35, z: 0.0 },
      { aid: 7, element: 'N', atomicNumber: 7, x: 3.52, y: 1.26, z: 0.0 },
      { aid: 8, element: 'N', atomicNumber: 7, x: 1.45, y: 2.35, z: 0.0 }
    ],
    bonds: [
      { sourceAid: 1, targetAid: 2, order: 1 },
      { sourceAid: 2, targetAid: 3, order: 1 },
      { sourceAid: 2, targetAid: 4, order: 1 },
      { sourceAid: 4, targetAid: 5, order: 1 },
      { sourceAid: 4, targetAid: 6, order: 2 },
      { sourceAid: 3, targetAid: 7, order: 2 },
      { sourceAid: 3, targetAid: 8, order: 1 }
    ]
  },
  water: {
    cid: 962,
    name: 'Water',
    formula: 'H2O',
    molecularWeight: 18.015,
    iupacName: 'oxidane',
    smiles: 'O',
    inchiKey: 'XLYOFNOQVPJJNP-UHFFFAOYSA-N',
    charge: 0,
    origin: 'experimental',
    atoms: [
      { aid: 1, element: 'O', atomicNumber: 8, x: 0.0, y: 0.0, z: 0.0 },
      { aid: 2, element: 'H', atomicNumber: 1, x: 0.757, y: 0.586, z: 0.0 },
      { aid: 3, element: 'H', atomicNumber: 1, x: -0.757, y: 0.586, z: 0.0 }
    ],
    bonds: [
      { sourceAid: 1, targetAid: 2, order: 1 },
      { sourceAid: 1, targetAid: 3, order: 1 }
    ]
  },
  glucose: {
    cid: 5793,
    name: 'D-Glucose',
    formula: 'C6H12O6',
    molecularWeight: 180.16,
    iupacName: '(2R,3S,4R,5R)-2,3,4,5,6-pentahydroxyhexanal',
    smiles: 'C(C1C(C(C(C(O1)O)O)O)O)O',
    charge: 0,
    origin: 'deposited',
    atoms: [
      { aid: 1, element: 'C', atomicNumber: 6, x: 0.0, y: 0.0, z: 0.0 },
      { aid: 2, element: 'C', atomicNumber: 6, x: 1.4, y: 0.5, z: 0.0 },
      { aid: 3, element: 'C', atomicNumber: 6, x: 2.4, y: -0.5, z: 0.0 },
      { aid: 4, element: 'C', atomicNumber: 6, x: 3.8, y: 0.0, z: 0.0 },
      { aid: 5, element: 'C', atomicNumber: 6, x: 4.8, y: -1.0, z: 0.0 },
      { aid: 6, element: 'O', atomicNumber: 8, x: 2.0, y: 1.8, z: 0.0 }
    ],
    bonds: [
      { sourceAid: 1, targetAid: 2, order: 1 },
      { sourceAid: 2, targetAid: 3, order: 1 },
      { sourceAid: 3, targetAid: 4, order: 1 },
      { sourceAid: 4, targetAid: 5, order: 1 },
      { sourceAid: 2, targetAid: 6, order: 1 }
    ]
  }
};

export class PubChemClient {
  private cache: Map<string, PubChemCompound> = new Map();

  constructor() {
    // Prime in-memory cache with core offline reference molecules
    for (const [key, val] of Object.entries(CORE_MOLECULE_CACHE)) {
      this.cache.set(key.toLowerCase(), val);
    }
  }

  /**
   * Search and retrieve compound data by common name or formula.
   */
  async getCompoundByName(name: string): Promise<PubChemCompound | null> {
    const key = name.trim().toLowerCase();
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    try {
      const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/JSON`;
      const res = await fetch(url);
      if (!res.ok) {
        return null;
      }
      const data = await res.json();
      const compound = this.parsePubChemJSON(data, name);
      if (compound) {
        this.cache.set(key, compound);
      }
      return compound;
    } catch {
      // Fallback to offline cache if network is unavailable
      return this.cache.get(key) || null;
    }
  }

  private parsePubChemJSON(data: any, originalName: string): PubChemCompound | null {
    try {
      const comp = data.PC_Compounds?.[0];
      if (!comp) return null;

      const cid = comp.id?.id?.cid || 0;
      let formula = '';
      let weight = 0;
      let iupac = '';
      let smiles = '';

      for (const prop of comp.props || []) {
        const label = prop.urn?.label;
        const name = prop.urn?.name;
        if (label === 'Molecular Formula') formula = prop.value?.sval || '';
        if (label === 'Molecular Weight') weight = parseFloat(prop.value?.sval || prop.value?.fval || '0');
        if (label === 'IUPAC Name' && name === 'Preferred') iupac = prop.value?.sval || '';
        if (label === 'SMILES' && name === 'Canonical') smiles = prop.value?.sval || '';
      }

      const atoms: PubChemCompound['atoms'] = [];
      const elementNumbers: number[] = comp.atoms?.element || [];
      const xCoords: number[] = comp.coords?.[0]?.conformers?.[0]?.x || [];
      const yCoords: number[] = comp.coords?.[0]?.conformers?.[0]?.y || [];
      const zCoords: number[] = comp.coords?.[0]?.conformers?.[0]?.z || [];

      for (let i = 0; i < elementNumbers.length; i++) {
        atoms.push({
          aid: i + 1,
          atomicNumber: elementNumbers[i],
          element: this.atomicNumberToSymbol(elementNumbers[i]),
          x: xCoords[i] ?? 0,
          y: yCoords[i] ?? 0,
          z: zCoords[i]
        });
      }

      const bonds: PubChemCompound['bonds'] = [];
      const aid1: number[] = comp.bonds?.aid1 || [];
      const aid2: number[] = comp.bonds?.aid2 || [];
      const order: number[] = comp.bonds?.order || [];

      for (let i = 0; i < aid1.length; i++) {
        bonds.push({
          sourceAid: aid1[i],
          targetAid: aid2[i],
          order: order[i] ?? 1
        });
      }

      return {
        cid,
        name: originalName,
        formula,
        molecularWeight: weight,
        iupacName: iupac,
        smiles,
        charge: comp.charge || 0,
        atoms,
        bonds,
        origin: zCoords.length > 0 ? 'experimental' : 'deposited'
      };
    } catch {
      return null;
    }
  }

  private atomicNumberToSymbol(z: number): string {
    const table: Record<number, string> = {
      1: 'H', 6: 'C', 7: 'N', 8: 'O', 9: 'F', 11: 'Na',
      12: 'Mg', 15: 'P', 16: 'S', 17: 'Cl', 19: 'K', 20: 'Ca', 26: 'Fe'
    };
    return table[z] || `E${z}`;
  }
}

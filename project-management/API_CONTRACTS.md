# ATOMICA: Shared Interface & API Contracts

> **Standardized schemas, data contracts, and communication protocols connecting all simulation subsystems.**
> **Contract Version:** `1.0.0-draft`

---

## 1. Atomic Entity Contract (`AtomRecord`)

The canonical representation of an individual atom within both chemical and biological contexts:

```typescript
export interface AtomRecord {
  id: string;                      // Unique UUID within the workspace
  atomicNumber: number;            // 1 through 118
  symbol: string;                  // e.g. "H", "C", "O", "Fe"
  isotope: {
    massNumber: number;            // Total protons + neutrons
    neutrons: number;
    halfLifeSeconds: number | null;// null indicates stable isotope
    decayMode?: 'alpha' | 'beta_minus' | 'beta_plus' | 'gamma' | 'stable';
  };
  electronicState: {
    totalElectrons: number;
    formalCharge: number;          // e.g. -1, 0, +1, +2
    oxidationState: number;
    valenceElectrons: number;
    electronConfiguration: string; // e.g. "[He] 2s2 2p4"
    lonePairs: number;
  };
  spatial: {
    position: [number, number, number]; // [x, y, z] in Angstroms (1 Å = 10^-10 m)
    velocity: [number, number, number]; // [vx, vy, vz] in Å/ps
    force: [number, number, number];    // Instantaneous net force vector
    fixed: boolean;                     // User-pinned in workspace
  };
  metadata: {
    elementCategory: ElementCategory;
    electronegativityPauling: number | null;
    covalentRadiusPm: number;
    vanDerWaalsRadiusPm: number;
    colorHex: string;                  // Standard CPK coloring
  };
}

export type ElementCategory =
  | 'alkali_metal'
  | 'alkaline_earth'
  | 'transition_metal'
  | 'post_transition_metal'
  | 'metalloid'
  | 'reactive_nonmetal'
  | 'noble_gas'
  | 'lanthanide'
  | 'actinide'
  | 'unknown';
```

---

## 2. Chemical Bond Contract (`BondRecord`)

```typescript
export type BondType =
  | 'covalent_single'
  | 'covalent_double'
  | 'covalent_triple'
  | 'covalent_quadruple'
  | 'aromatic'
  | 'ionic'
  | 'metallic'
  | 'coordinate'
  | 'hydrogen_bond';

export interface BondRecord {
  id: string;
  sourceAtomId: string;
  targetAtomId: string;
  bondType: BondType;
  bondOrder: number;              // 1.0, 1.5 (aromatic), 2.0, 3.0
  equilibriumLengthAngstrom: number;
  currentLengthAngstrom: number;
  bondDissociationEnergyKcalMol: number;
  polarityDipoleDebye: number;
  geometryContext?: {
    stericNumber: number;
    idealBondAngleDegrees: number;
    vseprGeometry: string;        // e.g. "bent", "trigonal_planar", "tetrahedral"
  };
}
```

---

## 3. Molecular Entity Contract (`MolecularGraph`)

```typescript
export interface MolecularGraph {
  id: string;
  commonName?: string;
  iupacName?: string;
  formula: string;               // e.g. "H2O", "C6H12O6"
  molecularWeightGPerMol: number;
  smiles?: string;
  inchi?: string;
  inchiKey?: string;
  casNumber?: string;
  atoms: AtomRecord[];
  bonds: BondRecord[];
  netFormalCharge: number;
  isStable: boolean;
  thermodynamics: {
    gibbsFreeEnergyFormationKjMol?: number;
    enthalpyFormationKjMol?: number;
    entropyJKMol?: number;
    pKa?: number[];
  };
  physicalProperties: {
    meltingPointK?: number;
    boilingPointK?: number;
    densityGPerCm3?: number;
    solubilityWaterGPerL?: number;
    physicalStateAtSTP: 'solid' | 'liquid' | 'gas';
  };
}
```

---

## 4. Reaction Event Contract (`ReactionRecord`)

```typescript
export interface ReactionRecord {
  id: string;
  name: string;
  reactants: Array<{ molecule: MolecularGraph; stoichiometry: number }>;
  products: Array<{ molecule: MolecularGraph; stoichiometry: number }>;
  kinetics: {
    activationEnergyKjMol: number;
    rateConstantForward: number;
    rateConstantReverse: number;
    equilibriumConstantKeq: number;
    reactionOrder: number;
    isExothermic: boolean;
    deltaH_KjMol: number;
    catalystId?: string;           // Enzyme or metallic surface ID
  };
  environmentalConditions: {
    temperatureKelvin: number;
    pressureAtm: number;
    pH: number;
  };
}
```

---

## 5. Biomolecular & Protein Contract (`PolypeptideChain`)

```typescript
export interface PolypeptideChain {
  id: string;
  sequenceAminoAcids: string[];   // 1-letter or 3-letter codes
  secondaryStructures: Array<{
    type: 'alpha_helix' | 'beta_sheet' | 'loop' | 'turn';
    startResidue: number;
    endResidue: number;
  }>;
  disulfideBonds: Array<[number, number]>; // Pairs of Cysteine residue indices
  foldedPdbCoordinates?: string;           // PDB or mmCIF coordinate block
  currentEnergyScore: number;
}
```

---

## 6. Cellular Compartment & Organelle Contract (`CellularEntity`)

```typescript
export interface CellularEntity {
  id: string;
  type: 'prokaryotic' | 'eukaryotic';
  organelles: Array<{
    id: string;
    type: 'nucleus' | 'mitochondria' | 'ribosome' | 'er' | 'golgi' | 'chloroplast';
    metabolicFluxes: Record<string, number>; // e.g. { "ATP_production_rate": 450.2 }
  }>;
  membrane: {
    lipidComposition: Record<string, number>; // Percentage phosphatidylcholine, etc.
    membranePotentialMilliVolts: number;      // e.g. -70 mV
    ionChannels: Array<{ type: string; open: boolean }>;
  };
}
```

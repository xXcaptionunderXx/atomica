---
title: Atomic Engine Specification
type: technical-specification
domain: architecture
status: verified
created: 2026-11-18
updated: 2026-11-18
sources:
  - "[[Atomic Structure and Electron Shells]]"
related:
  - "[[Chemical Graph and Bond Validation]]"
  - "[[Reference Benchmark Cases and Tolerances]]"
tags:
  - architecture
  - science/physics
---

# Atomic Engine Specification

## Overview
The Atomic Engine (`@atomica/core-chem/atomic`) is the foundational subsystem of ATOMICA. It models individual atoms, tracks nuclear composition (protons, neutrons), computes electronic state (Aufbau configurations, valence electrons, oxidation states), and enforces isotopic stability constraints.

## Detailed Explanation

### 1. Module Boundaries and Interface Contract

```typescript
export interface IAtomicEngine {
  /** Retrieves immutable element data for Z in [1, 118] */
  getElementByZ(atomicNumber: number): ElementData;
  
  /** Constructs a new atom instance with default ground-state isotope */
  createAtom(atomicNumber: number, initialPosition: [number, number, number]): AtomInstance;
  
  /** Updates the neutron count and returns stability / decay mode */
  setIsotope(atomId: string, neutronCount: number): IsotopeEvaluation;
  
  /** Adds or removes electrons, updating formal charge and valence state */
  modifyElectronCount(atomId: string, deltaElectrons: number): ElectronicState;
  
  /** Validates all constraints on an atom instance */
  validateAtom(atom: AtomInstance): ValidationResult;
}
```

### 2. State Invariants
1. $1 \le Z \le 118$ (Atomic number must be within the IUPAC recognized periodic table).
2. $N \ge 0$ (Neutron count cannot be negative).
3. Electron count $e \ge 0$.
4. Formal charge $q = Z - e$.
5. Mass number $A = Z + N$.

### 3. Nuclear Stability Evaluation
When a user alters the neutron count of an atom, the engine evaluates the liquid-drop binding energy and compares against the authoritative isotopic table. If the isotope is unstable:
- Half-life $t_{1/2}$ is retrieved or calculated.
- Decay channel ($\alpha, \beta^-, \beta^+, \text{fission}$) is identified.
- The visual workstation displays a warning badge indicating radioactive decay mode.

## Implementation Relevance
- Directly instantiated by the Periodic Table drag-and-drop palette.
- Powers the 2D Atomic Nucleus / Shell inspector modal where users inspect electron orbitals.

## Limitations and Uncertainties
- Elements beyond Oganesson ($Z > 118$) are disallowed until officially recognized by IUPAC.

## References
1. IUPAC Periodic Table of the Elements (2022). [https://iupac.org/what-we-do/periodic-table-of-elements/](https://iupac.org/what-we-do/periodic-table-of-elements/)
2. Audi, G., et al. (2017). *The NUBASE2016 evaluation of nuclear properties*. *Chinese Physics C*, 41(3), 030001.

## Related Notes
- [[Atomic Structure and Electron Shells]]
- [[Chemical Graph and Bond Validation]]
- [[Reference Benchmark Cases and Tolerances]]

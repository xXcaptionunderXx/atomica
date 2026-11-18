---
title: Chemical Graph and Bond Validation
type: technical-specification
domain: architecture
status: verified
created: 2026-11-18
updated: 2026-11-18
sources:
  - "[[VSEPR Theory and Molecular Geometry]]"
related:
  - "[[Atomic Engine Specification]]"
  - "[[Reference Benchmark Cases and Tolerances]]"
tags:
  - architecture
  - science/chemistry
---

# Chemical Graph and Bond Validation

## Overview
The Molecular Engine (`@atomica/core-chem/molecular`) represents molecules as annotated, attributed chemical graphs. It verifies valence constraints, calculates formal charges, perceives aromaticity, and prevents chemically impossible structures from being displayed as valid.

## Detailed Explanation

### 1. Graph Data Model
- **Graph Definition:** $G = (V, E)$ where vertices $V = \{a_1, a_2, \dots, a_n\}$ are `AtomRecord` objects, and edges $E = \{b_1, b_2, \dots, b_m\}$ are `BondRecord` objects.
- **Edge Attributes:**
  - `bondOrder`: $1.0$ (single), $1.5$ (aromatic), $2.0$ (double), $3.0$ (triple), $4.0$ (quadruple, e.g. $\text{Re}_2\text{Cl}_8^{2-}$).
  - `bondType`: Covalent, ionic, coordinate (dative), hydrogen bond.
  - `equilibriumLength`: Theoretical bond length derived from covalent radii sum minus electronegativity correction (Schomaker-Stevenson rule).

### 2. Validation Rules & Scientific Gates
1. **Octet / Duet Rule:**
   - Hydrogen ($Z=1$) and Helium ($Z=2$): maximum valence electron count $\le 2$.
   - Period 2 elements ($\text{C, N, O, F}$): strictly $\le 8$ valence electrons. Pentavalent carbon ($\text{CH}_5$ without carbocation context) is rejected as physically invalid.
   - Period 3+ elements ($\text{P, S, Cl, Br, I}$): hypervalence permitted up to 10 or 12 electrons ($\text{PCl}_5, \text{SF}_6$).
2. **Formal Charge Conservation:**
   - The net charge of the molecular graph must equal the algebraic sum of the formal charges:
     $$Q_{\text{net}} = \sum_{i \in V} q_f(i)$$
3. **Valence Check:**
   - For every atom $i$, bonding valence $v_i = \sum_{j \in \text{neighbors}(i)} \text{bondOrder}(i, j)$.
   - If $v_i > v_{\max}(Z_i)$, mark bond as strained or invalid.

## Important Equations or Principles
- **Schomaker-Stevenson Bond Length Equation:**
  $$r_{AB} = r_A + r_B - c |\chi_A - \chi_B|$$
  where $r_A, r_B$ are covalent radii, $\chi_A, \chi_B$ are Pauling electronegativities, and $c \approx 0.09\text{ Å}$.

## Implementation Relevance
- Executes immediately when a user attempts to draw a bond line between two atoms in the 2D workspace. If a bond violates physical valence, the connection turns red and displays a scientific explanation (e.g., "Nitrogen cannot form 5 covalent bonds due to absence of accessible d-orbitals").

## Limitations and Uncertainties
- Aromaticity perception uses the Ullmann subgraph isomorphism and Hückel $4n+2$ $\pi$-electron rule for monocyclic rings, falling back to experimental database records for complex polycyclic aromatic hydrocarbons.

## References
1. Schomaker, V., & Stevenson, D. P. (1941). *Some additions to the covalent radii of atoms*. *J. Am. Chem. Soc.*, 63(1), 37–40.
2. Weininger, D. (1988). *SMILES, a chemical language and information system*. *J. Chem. Inf. Comput. Sci.*, 28(1), 31–36.

## Related Notes
- [[VSEPR Theory and Molecular Geometry]]
- [[Atomic Engine Specification]]
- [[Reference Benchmark Cases and Tolerances]]

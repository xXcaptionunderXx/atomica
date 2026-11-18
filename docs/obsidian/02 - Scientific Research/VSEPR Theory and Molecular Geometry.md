---
title: VSEPR Theory and Molecular Geometry
type: scientific-reference
domain: chemistry
status: verified
created: 2026-11-18
updated: 2026-11-18
sources:
  - "[[Canonical Scientific Textbooks and Standards]]"
related:
  - "[[Atomic Structure and Electron Shells]]"
  - "[[Chemical Graph and Bond Validation]]"
tags:
  - science/chemistry
---

# VSEPR Theory and Molecular Geometry

## Overview
Valence Shell Electron Pair Repulsion (VSEPR) theory provides the fundamental model for predicting three-dimensional molecular geometries from 2D Lewis dot structures. In ATOMICA, the VSEPR engine calculates the equilibrium spatial coordinates of atoms in newly constructed molecules, translating user-drawn chemical bonds into realistic spatial shapes.

## Detailed Explanation

### 1. Steric Number and Repulsive Hierarchy
Electron domains (bonding pairs and non-bonding lone pairs) orient themselves around a central atom to minimize electrostatic repulsion. The **Steric Number ($SN$)** is calculated as:
$$SN = \text{number of bonded atoms} + \text{number of lone pairs}$$

Repulsive strength follows the strict hierarchy:
$$\text{Lone Pair -- Lone Pair} > \text{Lone Pair -- Bonding Pair} > \text{Bonding Pair -- Bonding Pair}$$
Because lone pairs are held closer to the central atomic nucleus, they exert greater lateral repulsion on adjacent bonding pairs, compressing ideal bond angles.

### 2. Analytical Geometry Classification

| Steric No. | Lone Pairs | Formula Type | Electron Domain Geometry | Molecular Shape | Ideal Angle | Real Angle Example |
| :---: | :---: | :---: | :--- | :--- | :---: | :--- |
| **2** | 0 | $AX_2$ | Linear | Linear | $180^\circ$ | $\text{CO}_2$ ($180.0^\circ$) |
| **3** | 0 | $AX_3$ | Trigonal Planar | Trigonal Planar | $120^\circ$ | $\text{BF}_3$ ($120.0^\circ$) |
| **3** | 1 | $AX_2E$ | Trigonal Planar | Bent | $<120^\circ$ | $\text{SO}_2$ ($119.5^\circ$) |
| **4** | 0 | $AX_4$ | Tetrahedral | Tetrahedral | $109.5^\circ$ | $\text{CH}_4$ ($109.5^\circ$) |
| **4** | 1 | $AX_3E$ | Tetrahedral | Trigonal Pyramidal | $<109.5^\circ$ | $\text{NH}_3$ ($107.5^\circ$) |
| **4** | 2 | $AX_2E_2$| Tetrahedral | Bent | $\ll 109.5^\circ$ | $\text{H}_2\text{O}$ ($104.5^\circ$) |
| **5** | 0 | $AX_5$ | Trigonal Bipyramidal| Trigonal Bipyramidal| $90^\circ, 120^\circ$ | $\text{PCl}_5$ ($90^\circ, 120^\circ$) |
| **5** | 1 | $AX_4E$ | Trigonal Bipyramidal| Seesaw | $<90^\circ, <120^\circ$| $\text{SF}_4$ ($102^\circ, 173^\circ$) |
| **5** | 2 | $AX_3E_2$| Trigonal Bipyramidal| T-shaped | $<90^\circ$ | $\text{ClF}_3$ ($87.5^\circ$) |
| **5** | 3 | $AX_2E_3$| Trigonal Bipyramidal| Linear | $180^\circ$ | $\text{XeF}_2$ ($180.0^\circ$) |
| **6** | 0 | $AX_6$ | Octahedral | Octahedral | $90^\circ$ | $\text{SF}_6$ ($90.0^\circ$) |
| **6** | 1 | $AX_5E$ | Octahedral | Square Pyramidal | $<90^\circ$ | $\text{BrF}_5$ ($84.8^\circ$) |
| **6** | 2 | $AX_4E_2$| Octahedral | Square Planar | $90^\circ$ | $\text{XeF}_4$ ($90.0^\circ$) |

## Important Equations or Principles
- **Electronegativity Correction to Bond Angles:**
  $$\theta \approx \theta_0 - k_L \cdot N_L + k_\chi \cdot (\chi_A - \chi_X)$$
  where $N_L$ is lone pair count, and $\chi_A - \chi_X$ accounts for electron density withdrawal toward peripheral atoms.

## Implementation Relevance
- **Molecular Engine (`@atomica/core-chem`):** The VSEPR module runs immediately after any atom or bond is placed on canvas. It calculates 3D Cartesian coordinates using standard rotation matrices and projects them cleanly onto the 2D workstation view with stereochemical wedges and dashes.
- **Validation Engine:** Automatically tests whether user-connected atoms violate geometric packing constraints.

## Limitations and Uncertainties
- VSEPR assumes localized electron pairs; it cannot predict Jahn-Teller distortions in transition metal complexes or fluxional Berry pseudorotation without empirical parameter overrides.
- Heavy post-transition metal compounds with inert pair effects deviate from standard VSEPR angles.

## References
1. Gillespie, R. J. (1972). *Molecular Geometry*. Van Nostrand Reinhold.
2. Miessler, G. L., Fischer, P. J., & Tarr, D. A. (2014). *Inorganic Chemistry* (5th ed.). Pearson.

## Related Notes
- [[Atomic Structure and Electron Shells]]
- [[Chemical Graph and Bond Validation]]
- [[Reference Benchmark Cases and Tolerances]]

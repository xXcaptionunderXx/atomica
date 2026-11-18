---
title: Reference Benchmark Cases and Tolerances
type: scientific-reference
domain: validation
status: verified
created: 2026-11-18
updated: 2026-11-18
sources:
  - "[[Canonical Scientific Textbooks and Standards]]"
related:
  - "[[Test-Driven Development Framework]]"
  - "[[Atomic Structure and Electron Shells]]"
  - "[[VSEPR Theory and Molecular Geometry]]"
tags:
  - validation
  - testing
  - research
---

# Reference Benchmark Cases and Tolerances

## Overview
This document specifies the authoritative "Golden Reference Cases" and numerical tolerances mandated by **Section 20.8 of the ATOMICA Charter**. All automated unit and integration tests must validate calculations directly against these peer-reviewed datasets.

---

## 1. Atomic Physics Reference Cases

| Test Case ID | Target Entity | Quantity Measured | Expected Value (NIST / IUPAC) | Tolerance | Source |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `REF-ATOM-01`| Hydrogen ($^1\text{H}$) | Standard Atomic Weight | $1.0080\text{ u}$ | $\pm 0.0002\text{ u}$ | IUPAC (2021) |
| `REF-ATOM-02`| Carbon ($^{12}\text{C}$) | Standard Atomic Weight | $12.011\text{ u}$ | $\pm 0.001\text{ u}$ | IUPAC (2021) |
| `REF-ATOM-03`| Iron ($^{56}\text{Fe}$) | First Ionization Energy | $7.9024\text{ eV}$ ($762.5\text{ kJ/mol}$) | $\pm 0.05\text{ eV}$ | NIST ASD |
| `REF-ATOM-04`| Copper ($Z=29$) | Ground Electron Configuration | $[Ar] 4s^1 3d^{10}$ | Exact | NIST ASD |
| `REF-ATOM-05`| Chromium ($Z=24$)| Ground Electron Configuration | $[Ar] 4s^1 3d^5$ | Exact | NIST ASD |
| `REF-ATOM-06`| Uranium ($^{238}\text{U}$) | Half-Life ($t_{1/2}$) | $4.468 \times 10^9\text{ years}$ | $\pm 0.5\%$ | NUBASE2016 |

---

## 2. Molecular Geometry & Bond Length Reference Cases

| Test Case ID | Molecule | Formula | Bond / Angle Evaluated | Expected Value | Tolerance | Source |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| `REF-MOL-01` | Methane | $\text{CH}_4$ | $\text{H-C-H}$ angle | $109.47^\circ$ (Tetrahedral) | $\pm 0.5^\circ$ | NIST WebBook |
| `REF-MOL-02` | Ammonia | $\text{NH}_3$ | $\text{H-N-H}$ angle | $107.5^\circ$ (Trigonal Pyramidal) | $\pm 0.5^\circ$ | CRC Handbook |
| `REF-MOL-03` | Water | $\text{H}_2\text{O}$ | $\text{H-O-H}$ angle | $104.5^\circ$ (Bent) | $\pm 0.5^\circ$ | NIST WebBook |
| `REF-MOL-04` | Carbon Dioxide | $\text{CO}_2$ | $\text{O-C-O}$ angle | $180.0^\circ$ (Linear) | $\pm 0.1^\circ$ | NIST WebBook |
| `REF-MOL-05` | Sulfur Hexafluoride | $\text{SF}_6$ | $\text{F-S-F}$ angles | $90.0^\circ, 180.0^\circ$ (Octahedral)| $\pm 0.1^\circ$ | CRC Handbook |
| `REF-MOL-06` | Benzene | $\text{C}_6\text{H}_6$ | $\text{C-C}$ bond length | $1.397\text{ Å}$ (Aromatic) | $\pm 0.01\text{ Å}$| Allen et al. |
| `REF-MOL-07` | Ethane | $\text{C}_2\text{H}_6$ | $\text{C-C}$ single bond length | $1.536\text{ Å}$ | $\pm 0.01\text{ Å}$| Allen et al. |
| `REF-MOL-08` | Ethylene | $\text{C}_2\text{H}_4$ | $\text{C=C}$ double bond length | $1.337\text{ Å}$ | $\pm 0.01\text{ Å}$| Allen et al. |
| `REF-MOL-09` | Acetylene | $\text{C}_2\text{H}_2$ | $\text{C}\equiv\text{C}$ triple bond length | $1.203\text{ Å}$ | $\pm 0.01\text{ Å}$| Allen et al. |

---

## 3. Chemical Reaction & Thermodynamic Conservation Cases

| Test Case ID | Reaction | Law Validated | Expected Balance | Assertion Criteria |
| :--- | :--- | :--- | :--- | :--- |
| `REF-RXN-01` | $\text{CH}_4 + 2\text{O}_2 \to \text{CO}_2 + 2\text{H}_2\text{O}$ | Mass Conservation | Mass In = Mass Out | Exact ($\Delta m = 0.0000$) |
| `REF-RXN-02` | $\text{Fe}^{3+} + \text{e}^- \to \text{Fe}^{2+}$ | Charge Conservation | Net charge $+2 = +2$ | Exact ($\Delta q = 0.0000$) |
| `REF-RXN-03` | $\text{H}_2\text{O} \rightleftharpoons \text{H}^+ + \text{OH}^-$ | Self-Ionization ($25^\circ\text{C}$)| $K_w = 1.0 \times 10^{-14}$ | $\pm 1.0\%$ |
| `REF-RXN-04` | $\text{N}_2 + 3\text{H}_2 \rightleftharpoons 2\text{NH}_3$ | Le Chatelier Pressure Shift | $V \downarrow \implies \text{NH}_3 \uparrow$ | Monotonic direction verified |

---

## 4. Biomolecular & Protein Structure Reference Cases

| Test Case ID | Target | Quantity Measured | Expected Value | Tolerance | Source |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `REF-BIO-01` | Alanine Dipeptide | $\alpha$-helical $(\phi, \psi)$ | $\phi = -57^\circ, \psi = -47^\circ$ | $\pm 5^\circ$ | Ramachandran (1963) |
| `REF-BIO-02` | Crambin (PDB: `1CRN`) | Disulfide Bridges | 3 bridges (Cys3-Cys40, Cys4-Cys32, Cys16-Cys26) | 100% correct matching | RCSB PDB |
| `REF-BIO-03` | B-DNA Double Helix | Helical pitch & base pairs/turn | $34.0\text{ Å}$ pitch, $10.5\text{ bp/turn}$ | $\pm 0.5\text{ bp}$ | Watson & Crick |
| `REF-BIO-04` | Myoglobin (PDB: `1MBO`) | Heme coordination | $\text{Fe}^{2+}$ coordinated to His-F8 | Exact coordinate | RCSB PDB |

---

## 5. Cellular & Physiological Reference Cases

| Test Case ID | Target System | Quantity Measured | Expected Value | Tolerance | Source |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `REF-CELL-01`| Giant Squid Axon | Resting Membrane Potential | $-70.0\text{ mV}$ | $\pm 3.0\text{ mV}$ | Hodgkin & Huxley (1952) |
| `REF-CELL-02`| Red Blood Cell | Osmotic hemolysis threshold | $\sim 0.45\%\text{ NaCl}$ ($154\text{ mOsm/L}$) | $\pm 10\text{ mOsm}$ | Guyton & Hall |
| `REF-CELL-03`| Glycolysis Pathway | Net ATP yield per Glucose | $2\text{ ATP} + 2\text{ NADH}$ | Exact | Lehninger |

---

## Related Notes
- [[Test-Driven Development Framework]]
- [[Atomic Structure and Electron Shells]]
- [[VSEPR Theory and Molecular Geometry]]

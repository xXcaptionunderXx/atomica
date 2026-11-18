---
title: Covalent and Ionic Bonding
type: scientific-reference
domain: chemistry
status: verified
created: 2026-11-18
updated: 2026-11-18
sources:
  - "Pauling, L. (1960). The Nature of the Chemical Bond (3rd ed.). Cornell University Press."
  - "Lewis, G. N. (1916). The Atom and the Molecule. Journal of the American Chemical Society, 38(4), 762–785."
  - "IUPAC. Compendium of Chemical Terminology, 2nd ed. (the 'Gold Book')."
related:
  - "[[Atomic Structure and Electron Shells]]"
  - "[[VSEPR Theory and Molecular Geometry]]"
  - "[[Electrostatic Interactions]]"
  - "[[Chemical Graph and Bond Validation]]"
tags:
  - science/chemistry
  - bonding
  - valence
  - octet
---

# Covalent and Ionic Bonding

## 1. Concise Explanation
Chemical bonds are attractive forces holding atoms together to form molecules and crystal lattices. **Covalent bonds** arise from the sharing of valence electron pairs through overlapping atomic orbitals between elements of comparable electronegativity. **Ionic bonds** occur when electron transfer creates discrete oppositely charged ions ($M^+$ and $X^-$) stabilized by long-range Coulombic lattice attraction.

---

## 2. Established Scientific Findings
- **Octet and Duet Rules:** Main-group atoms gain, lose, or share electrons until they achieve a stable closed-shell configuration ($ns^2 np^6$ for period 2 elements; $1s^2$ for H, He, Li, Be).
- **Pauling Electronegativity Criterion ($\Delta\chi$):**
  - $\Delta\chi < 0.4$: Non-polar covalent (e.g., $\text{C}-\text{H}$, $\text{C}-\text{C}$).
  - $0.4 \le \Delta\chi < 1.7$: Polar covalent with partial charges $\delta^+, \delta^-$ (e.g., $\text{H}-\text{O}$, $\text{C}=\text{O}$).
  - $\Delta\chi \ge 1.7$: Predominantly ionic lattice (e.g., $\text{Na}^+\text{Cl}^-$).
- **Strict Valence Caps (Period 2):** Carbon (max 4 bonds), Nitrogen (max 4 bonds with $+1$ formal charge, normally 3), Oxygen (max 3 bonds with $+1$ formal charge, normally 2), Fluorine (max 1 bond). The maximum coordination number is strictly 4 due to the availability of only one $2s$ and three $2p$ valence orbitals.
- **Hypervalence / Expanded Octets (Period 3+):** Elements like Phosphorus ($\text{PCl}_5$) and Sulfur ($\text{SF}_6$) accommodate 10 or 12 valence electrons via multi-center bonding (three-center four-electron bonds) and low-lying $d$-orbital participation.

---

## 3. Relevant Equations and Assumptions

### Formal Charge Calculation
For each atom in a chemical graph, the formal charge ($\text{FC}$) must be conserved:
$$\text{FC} = V - N_{\text{lone}} - \frac{1}{2} B_{\text{shared}}$$
Where:
- $V$ is the neutral atom's valence electron count (e.g., 4 for C, 5 for N, 6 for O).
- $N_{\text{lone}}$ is the number of non-bonding lone pair electrons.
- $B_{\text{shared}}$ is the total number of shared bonding electrons (2 per single bond, 4 per double, 6 per triple).

### Covalent Bond Energy (Morse Potential)
$$\mathcal{V}_{\text{Morse}}(r) = D_e \left[ 1 - e^{-a (r - r_0)} \right]^2$$
Near equilibrium ($r \approx r_0$), this reduces to the classical harmonic spring:
$$\mathcal{V}_{\text{harmonic}}(r) \approx \frac{1}{2} k_b (r - r_0)^2, \quad \text{where } k_b = 2 D_e a^2$$

### Lattice Energy (Born-Landé Equation for Ionic Salts)
$$U_{\text{lattice}} = -\frac{N_A M |z_1 z_2| e^2}{4\pi \varepsilon_0 r_0} \left( 1 - \frac{1}{n} \right)$$
Where $M$ is the Madelung constant of the crystal geometry, $z_1, z_2$ are ionic charges, and $n$ is the Born exponent ($5 \le n \le 12$).

---

## 4. Primary Sources
1. **Pauling, L. (1960).** *The Nature of the Chemical Bond* (3rd ed.). Cornell University Press. ISBN: 0801403332.
2. **Lewis, G. N. (1916).** *The Atom and the Molecule*. Journal of the American Chemical Society, 38(4), 762–785. [DOI: 10.1021/ja02261a002](https://doi.org/10.1021/ja02261a002)
3. **IUPAC Gold Book:** *Standard Bond Order, Electronegativity, and Covalency Definitions*. [https://goldbook.iupac.org/](https://goldbook.iupac.org/)

---

## 5. Confidence and Limitations
- **High Confidence:** Ground-state organic molecules, neutral gas-phase species, simple binary salts ($\text{NaCl}$, $\text{MgO}$).
- **Limitations:**
  - Simple static graphs do not capture quantum resonance delocalization (e.g., benzene $\pi$-electron ring, resonance hybrids in carboxylate groups) without representing multiple canonical forms or bond order averages (1.5).
  - Transition metal coordination complexes (e.g., heme iron in hemoglobin) exhibit variable oxidation states and Jahn-Teller distortions outside simple Lewis octet theory.

---

## 6. Related Obsidian Links
- [[Atomic Structure and Electron Shells]] — Aufbau filling, electron configurations, and valence orbitals.
- [[VSEPR Theory and Molecular Geometry]] — Valence shell electron pair repulsion geometry.
- [[Chemical Graph and Bond Validation]] — Domain contract for graph invariants and valence validation.
- [[Electrostatic Interactions]] — Long-range ionic and polar dipole attractions.

---

## 7. Relevant ATOMICA Implementation Paths
- `src/chemistry/elements.ts` — Element periodic data table containing atomic weights, electronegativities, and maximum valence limits ($1 \le Z \le 118$).
- `src/chemistry/ChemicalGraph.ts` — Graph validator checking $\sum \text{bonds} \le \text{valenceLimit}$ and formal charges on every node addition.
- `src/sandbox/BondEdge.ts` — Interactive 2D drag-to-bond mechanic enforcing maximum allowed bond orders (single, double, triple).
- `tests/chemistry/elements.test.ts` — Unit tests verifying valence limits for Period 1 through 7 elements.

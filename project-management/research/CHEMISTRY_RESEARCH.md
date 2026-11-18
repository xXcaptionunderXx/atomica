# ATOMICA: Chemistry & Atomic Modeling Research

> **Theoretical Foundations, Mathematical Formulations, and Algorithmic Rules**
> **Deliverable:** `research/CHEMISTRY_RESEARCH.md` | **Lead Researcher:** `agent/gemini`

---

## 1. Atomic Structure & Quantum Foundations

### 1.1 Quantum Numbers & Orbital Filling
Electrons are configured across primary shells $n \in \{1, 2, 3, 4, 5, 6, 7\}$, subshells $\ell \in \{0, 1, 2, 3\}$ ($s, p, d, f$), magnetic quantum numbers $m_\ell \in [-\ell, \ell]$, and spin $m_s \in \{+\frac{1}{2}, -\frac{1}{2}\}$.

- **Aufbau Principle:** Orbitals fill in order of increasing $n + \ell$:
  $$1s \to 2s \to 2p \to 3s \to 3p \to 4s \to 3d \to 4p \to 5s \to 4d \to 5p \to 6s \to 4f \to 5d \to 6p \to 7s \to 5f \to 6d \to 7p$$
- **Hund's Rule of Maximum Multiplicity:** Orbitals of equal energy are each occupied by one electron before any orbital is doubly occupied.
- **Pauli Exclusion Principle:** No two electrons in an atom can have the identical set of four quantum numbers.

### 1.2 Elements 1 to 118 Database Schema
Each element maintains static physical constants curated from NIST and IUPAC:
- **Nuclear Parameters:** Atomic number $Z$, standard atomic weight $A_r$, protons $p = Z$, neutrons $n = \text{round}(A_r) - Z$, stable isotopes and decay channels.
- **Electronic Parameters:** Ground state electron configuration, Pauling electronegativity $\chi$, first through third ionization energies $E_{i1}, E_{i2}, E_{i3}$ (kJ/mol), electron affinity $E_{ea}$ (kJ/mol), and covalent radius $r_{\text{cov}}$ (pm).
- **Bulk Physical Properties:** Melting point $T_m$ (K), boiling point $T_b$ (K), density $\rho$ (g/cm$^3$), phase at 298.15 K and 1 atm.

---

## 2. Chemical Bonding & Molecular Graph Theory

### 2.1 Bond Types & Criteria
- **Covalent Bonding:** Characterized by electron pair sharing. Electronegativity difference $\Delta\chi < 1.7$.
  - **Nonpolar Covalent:** $\Delta\chi < 0.4$.
  - **Polar Covalent:** $0.4 \le \Delta\chi < 1.7$.
- **Ionic Bonding:** Electron transfer leading to electrostatic lattice interaction: $\Delta\chi \ge 1.7$.
- **Metallic Bonding:** Delocalized electron sea model across transition and post-transition metals.
- **Coordinate (Dative) Covalent:** Both shared electrons originate from a single atom's lone pair (e.g. $\text{NH}_4^+$, $\text{H}_3\text{O}^+$, transition metal coordination complexes).

### 2.2 Formal Charge & Valence Rules
For atom $i$ in a molecular graph:
$$q_f(i) = V_i - L_i - \frac{1}{2}B_i$$
where:
- $V_i$ is the number of valence electrons of the neutral free atom.
- $L_i$ is the number of non-bonding valence electrons (lone pair electrons).
- $B_i$ is the number of bonding electrons (2 per single bond, 4 per double bond, etc.).

**Octet / Duet Rule Validation:**
- Period 1 elements ($H, He$): obey the duet rule ($\le 2$ valence electrons).
- Period 2 elements ($C, N, O, F$): strictly obey the octet rule ($\le 8$ valence electrons, no hypervalence).
- Period 3+ elements ($P, S, Cl$, etc.): capable of hypervalence (expanded octets up to 12 electrons due to accessible $d$-orbitals, e.g. $\text{SF}_6$, $\text{PCl}_5$, $\text{SO}_4^{2-}$).

---

## 3. VSEPR (Valence Shell Electron Pair Repulsion) Geometry

The steric number $SN = \text{number of bonded atoms} + \text{number of lone pairs}$ determines the baseline electron geometry:

| Steric No. | Lone Pairs | Electron Geometry | Molecular Shape | Ideal Angle | Example |
| :---: | :---: | :--- | :--- | :---: | :--- |
| **2** | 0 | Linear | Linear | $180^\circ$ | $\text{CO}_2, \text{BeCl}_2$ |
| **3** | 0 | Trigonal Planar | Trigonal Planar | $120^\circ$ | $\text{BF}_3, \text{SO}_3$ |
| **3** | 1 | Trigonal Planar | Bent | $\sim 117.5^\circ$ | $\text{SO}_2, \text{NO}_2^-$ |
| **4** | 0 | Tetrahedral | Tetrahedral | $109.5^\circ$ | $\text{CH}_4, \text{CCl}_4$ |
| **4** | 1 | Tetrahedral | Trigonal Pyramidal | $\sim 107.5^\circ$ | $\text{NH}_3, \text{PCl}_3$ |
| **4** | 2 | Tetrahedral | Bent | $\sim 104.5^\circ$ | $\text{H}_2\text{O}, \text{H}_2\text{S}$ |
| **5** | 0 | Trigonal Bipyramidal| Trigonal Bipyramidal| $90^\circ, 120^\circ$ | $\text{PCl}_5$ |
| **5** | 1 | Trigonal Bipyramidal| Seesaw | $<90^\circ, <120^\circ$| $\text{SF}_4$ |
| **5** | 2 | Trigonal Bipyramidal| T-shaped | $<90^\circ$ | $\text{ClF}_3$ |
| **5** | 3 | Trigonal Bipyramidal| Linear | $180^\circ$ | $\text{XeF}_2$ |
| **6** | 0 | Octahedral | Octahedral | $90^\circ$ | $\text{SF}_6$ |
| **6** | 1 | Octahedral | Square Pyramidal | $\sim 84.8^\circ$ | $\text{BrF}_5$ |
| **6** | 2 | Octahedral | Square Planar | $90^\circ$ | $\text{XeF}_4$ |

---

## 4. Algorithmic Roadmap for Phase 1 Engine
1. **Chemical Graph Structure:** Node-edge graph with adjacency matrices supporting kekulization, ring perception (SSSR - Smallest Set of Smallest Rings), and aromaticity detection.
2. **2D Coordinate Generator:** Clean planar graph layout using distance geometry and spring embedder algorithms (similar to ChemAxon / RDKit algorithms).
3. **Validation Filter:** Rejects chemically impossible entities (e.g. pentavalent carbon, unauthorized transition metal geometries) before rendering.

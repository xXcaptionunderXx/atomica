# ATOMICA: Molecular Modeling & Graph Theory Research

> **Representation, Conformation Search, Force Fields, and Stereochemistry**
> **Deliverable:** `research/MOLECULAR_MODELING_RESEARCH.md` | **Lead Researcher:** `agent/gemini`

---

## 1. Molecular Representation Standards

ATOMICA must seamlessly parse, manipulate, and export industry-standard cheminformatics representations:
1. **SMILES (Simplified Molecular Input Line Entry System):** Canonical strings representing 2D graph topology (e.g., `CCO` for ethanol, `c1ccccc1` for benzene).
2. **SMARTS (SMILES Arbitrary Target Specification):** Pattern-matching syntax for functional group recognition (e.g. `[CX3](=O)[OX2H1]` for carboxylic acids).
3. **InChI & InChIKey:** Standard IUPAC non-proprietary identifier providing unique hashing for duplicate detection in molecular search.
4. **Molfile / SDF (V2000 & V3000):** Connection table format specifying atomic Cartesian coordinates ($x, y, z$), bond lists, and stereochemical flags.

---

## 2. 3D Conformation Generation & Force Fields

To generate visually accurate 3D structures from 2D graphs, a two-stage pipeline is required:

### Stage 1: Distance Geometry (DG) & VSEPR Embedding
- Compute lower and upper distance bounds between all pairs of atoms based on covalent bond lengths, van der Waals radii, and torsional constraints.
- Solve for Cartesian coordinates via Metric Matrix Embedding (eigenvalue decomposition).

### Stage 2: Empirical Force Field Minimization
Refine the initial coordinates using an established classical force field (such as Universal Force Field - UFF, or MMFF94):
$$E_{\text{total}} = E_{\text{stretch}} + E_{\text{bend}} + E_{\text{torsion}} + E_{\text{oop}} + E_{\text{vdW}} + E_{\text{electrostatic}}$$

Where:
- **Bond Stretch (Harmonic):** $E_{\text{stretch}} = \sum \frac{1}{2} k_b (r - r_0)^2$
- **Angle Bending (Harmonic):** $E_{\text{bend}} = \sum \frac{1}{2} k_\theta (\theta - \theta_0)^2$
- **Dihedral Torsion:** $E_{\text{torsion}} = \sum \frac{1}{2} V_n [1 + \cos(n\phi - \gamma)]$
- **Non-bonded van der Waals:** Lennard-Jones 6-12 potential.
- **Electrostatic:** Coulomb's Law $E_{\text{elec}} = \sum \frac{q_i q_j}{4\pi\varepsilon_0 \varepsilon_r r_{ij}}$.

---

## 3. Real-Time Performance & Simplifications for the Browser
1. **Lightweight Force Field (LW-FF):** For interactive canvas manipulations (dragging an atom to bend bonds), execute a simplified analytical spring-mass network directly in WebAssembly/Web Workers.
2. **Pre-computed Conformer Cache:** For standard searched molecules (from PubChem), download experimental crystal coordinates or 3D conformers directly rather than recalculating from scratch.

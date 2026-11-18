# ATOMICA: Scientific Validation Standards & Tolerance Specs

> **Acceptance Criteria, Numerical Precision, Reference Baselines, and Fallback Tiers**
> **Deliverable:** `research/SCIENTIFIC_VALIDATION_STANDARDS.md` | **Lead Researcher:** `agent/gemini`

---

## 1. Hierarchy of Scientific Grounding

To guarantee absolute scientific integrity across all modules, every data point and simulation output in ATOMICA must be classified into one of four distinct tiers:

1. **Tier 1: Experimentally Verified Data (Gold Standard)**
   - Curated from NIST WebBook, IUPAC, CRC Handbook, or RCSB PDB crystal structures ($<2.0\text{ Å}$ resolution).
   - Displayed to users with standard uncertainty bounds ($\pm \sigma$) where available.
2. **Tier 2: Theoretical & Quantum Calculations**
   - Derived from validated computational chemistry (e.g. CCSD(T)/def2-TZVP or B3LYP/6-311G** DFT calculations from PubChem3D).
   - Explicitly tagged as *Computed Property*.
3. **Tier 3: Approximate Physical & Biological Simulations**
   - Real-time models (e.g. VSEPR spring relaxations, coarse-grained protein contact maps, Langevin diffusion).
   - Explicitly tagged as *Real-time Simulation Model*.
4. **Tier 4: Simplified Educational Abstractions**
   - Qualitative models (e.g. simplified immune antigen recognition, conceptual cell-division steps).
   - Clearly annotated with educational disclaimers to prevent misunderstanding.

---

## 2. Numerical Tolerances for Automated Testing

All automated scientific unit tests in CI must assert results within defined empirical tolerances:

| Physical Quantity | Standard Reference | Permissible Tolerance | Test Scenario Example |
| :--- | :--- | :---: | :--- |
| **Atomic Masses** | IUPAC Standard Atomic Weights (2021) | $\pm 0.0001\text{ u}$ | All 118 elements verified |
| **Covalent Bond Lengths** | Allen et al. (Cambridge Structural Database) | $\pm 0.03\text{ Å}$ | $\text{C-C}$ ($1.54\text{ Å}$), $\text{C=C}$ ($1.34\text{ Å}$), $\text{C}\equiv\text{C}$ ($1.20\text{ Å}$) |
| **VSEPR Bond Angles** | CRC Handbook / Experimental Gas Phase | $\pm 1.5^\circ$ | $\text{CH}_4$ ($109.5^\circ$), $\text{NH}_3$ ($107.5^\circ$), $\text{H}_2\text{O}$ ($104.5^\circ$) |
| **Conservation of Mass** | Stoichiometric Balanced Equations | $0.0000\%$ (Exact) | Total mass before = total mass after |
| **Conservation of Charge** | Net System Electrical Charge | $0.0000$ (Exact) | Sum of formal charges conserved in reactions |
| **Thermodynamic $K_{eq}$** | $\Delta G^\circ = -RT \ln K_{eq}$ | $\pm 2.0\%$ | Dissociation of acetic acid in water ($298\text{ K}$) |
| **Henderson-Hasselbalch pH**| $\text{pH} = \text{p}K_a + \log\frac{[\text{A}^-]}{[\text{HA}]}$ | $\pm 0.02\text{ pH units}$ | Phosphate & bicarbonate buffer systems |

---

## 3. Disallowed Anti-Patterns

- **Hallucinated Constants:** Fabricating melting points, reaction energies, or enzyme $K_m$ values without verified source citations.
- **Silent Overflow/Underflow:** Unchecked floating-point instability during numerical ODE integration.
- **Visual Camouflage:** Rendering animations that imply chemical bonding when valence rules are violated.

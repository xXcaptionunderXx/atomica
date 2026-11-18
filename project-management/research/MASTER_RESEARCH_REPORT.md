# ATOMICA: Master Pre-Development Research Report

> **Comprehensive Scientific, Mathematical & Architectural Feasibility Synthesis**
> **Phase:** 0 (Pre-Development Discovery) | **Status:** Active Research Synthesis

---

## 1. Executive Summary & Problem Formulation

Building an interactive, scientifically grounded 2D & 3D simulation sandbox spanning atomic construction to complex organisms presents one of the most demanding computational challenges in educational and scientific software. 

The central architectural challenge is **multi-scale coupling**:
- **Spatial scales** range across 8 orders of magnitude: from atomic radii ($\sim 10^{-10}\text{ m}$) to proteins ($\sim 10^{-8}\text{ m}$), organelles ($\sim 10^{-6}\text{ m}$), and organs ($\sim 10^{-2}\text{ m}$).
- **Temporal scales** range across 15 orders of magnitude: from subatomic electron transitions and bond vibrations ($\sim 10^{-15}\text{ s}$) to molecular diffusion ($\sim 10^{-9}\text{ s}$), enzymatic catalysis ($\sim 10^{-3}\text{ s}$), and cellular mitosis ($\sim 10^4\text{ s}$).

Simulating all levels with a single brute-force physical engine (such as all-atom molecular dynamics) is mathematically impossible in real-time on consumer hardware. Therefore, ATOMICA adopts a **hybrid hierarchy of scientifically valid abstractions and multi-scale domain models**:

1. **Subatomic / Atomic Scale:** Discrete quantum numbers, Aufbau filling rules, isotopic binding energy curves, and electronegativity gradients.
2. **Molecular Scale:** Chemical graph theory, VSEPR 3D geometry solvers, formal charge distribution, and harmonic spring bond potentials.
3. **Macromolecular Scale:** Coarse-grained contact maps, Ramachandran dihedral potentials, secondary structure propensities, and lattice-based energy minimization.
4. **Cellular / Physiological Scale:** Stiff ordinary differential equation (ODE) networks (Michaelis-Menten kinetics, Hodgkin-Huxley nerve potentials, Goldbeter cell-cycle oscillations), compartmental Fickian diffusion, and osmotic pressure gradients.
5. **Immunological Scale:** Agent-based spatial automata coupled with affinity-maturation probability distributions and binding free-energy estimations.

---

## 2. Synthesis of Scientific Domains

### 2.1 Chemistry & Molecular Modeling
- **Chemical Graph Representation:** Molecules are modeled as undirected multi-graphs $G = (V, E)$, where $V$ are atoms annotated with atomic number $Z$, formal charge $q_f$, and hybridization state, and $E$ are bonds with order $b \in \{1, 1.5, 2, 3\}$.
- **Valence Shell Electron Pair Repulsion (VSEPR):** Bond angles are computed analytically via Steric Number $SN = \text{bonded atoms} + \text{lone pairs}$:
  - $SN = 2 \implies 180^\circ$ (Linear)
  - $SN = 3 \implies 120^\circ$ (Trigonal Planar) / $<120^\circ$ (Bent)
  - $SN = 4 \implies 109.5^\circ$ (Tetrahedral) / $107.5^\circ$ (Trigonal Pyramidal) / $104.5^\circ$ (Bent)
  - $SN = 5 \implies 90^\circ, 120^\circ$ (Trigonal Bipyramidal)
  - $SN = 6 \implies 90^\circ$ (Octahedral)

### 2.2 Physical Simulation & Particle Dynamics
- **Lennard-Jones 12-6 Potential:** Intermolecular non-bonded interactions are governed by:
  $$V_{LJ}(r) = 4\epsilon \left[ \left(\frac{\sigma}{r}\right)^{12} - \left(\frac{\sigma}{r}\right)^6 \right]$$
  computed using spatial binning / Verlet neighbor lists to achieve $\mathcal{O}(N)$ rather than $\mathcal{O}(N^2)$ complexity.
- **Velocity Verlet Numerical Integration:** Ensures symplectic energy conservation over thousands of simulation steps:
  $$\vec{r}(t + \Delta t) = \vec{r}(t) + \vec{v}(t)\Delta t + \frac{1}{2}\vec{a}(t)\Delta t^2$$
  $$\vec{v}(t + \Delta t) = \vec{v}(t) + \frac{1}{2}[\vec{a}(t) + \vec{a}(t + \Delta t)]\Delta t$$

### 2.3 Biomolecular Structures
- **Peptide Synthesis:** Condensation reaction: $\text{R}_1\text{-COOH} + \text{R}_2\text{-NH}_2 \to \text{R}_1\text{-CONH-R}_2 + \text{H}_2\text{O}$ with rigid planar trans-peptide bond ($\omega = 180^\circ$).
- **Folding Approximations:** Combined hydrophobic-polar (HP) lattice scoring and secondary structure dihedral constraints derived from DSSP standards.

### 2.4 Cellular & Systems Biology
- **Enzyme Kinetics (Michaelis-Menten):**
  $$v = \frac{V_{\max}[S]}{K_m + [S]}$$
- **Membrane Transport:** Combining Fick's first law of diffusion ($J = -D \frac{d\phi}{dx}$) and the Goldman-Hodgkin-Katz voltage equation for resting membrane potentials:
  $$V_m = \frac{RT}{F} \ln \left( \frac{P_{\text{K}}[\text{K}^+]_o + P_{\text{Na}}[\text{Na}^+]_o + P_{\text{Cl}}[\text{Cl}^-]_i}{P_{\text{K}}[\text{K}^+]_i + P_{\text{Na}}[\text{Na}^+]_i + P_{\text{Cl}}[\text{Cl}^-]_o} \right)$$

---

## 3. Technology & Architecture Strategy

- **Runtime:** TypeScript / Modern Web Platform executing compiled Rust / C++ WebAssembly kernels in multi-threaded Web Workers (`SharedArrayBuffer`).
- **Rendering Pipeline:** Hybrid Dual-Engine:
  - **2D Canvas:** PixiJS (WebGL2 / WebGPU sprite batching for massive 2D molecular scenes and graph navigation).
  - **3D Inspector:** Three.js / React Three Fiber with custom GLSL shaders for space-filling van der Waals spheres and orbital electron density clouds.
- **Data Ingestion:** Asynchronous REST client with IndexedDB caching for PubChem, RCSB PDB, and UniProt.

---

## 4. Phase 0 Verification & Sign-off Criteria

To transition to Phase 1 (Implementation), all subsidiary research documents (2 through 18) must achieve full technical specification, and minimum viability benchmarks must be validated on target devices.

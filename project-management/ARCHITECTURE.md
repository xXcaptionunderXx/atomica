# ATOMICA: Architecture & System Boundaries

> **Document Status: Approved for Phase 0 Research**

---

## 1. High-Level Modular Decomposition

ATOMICA is designed as a decoupled, multi-tier scientific engine. Computationally intensive physics, graph evaluation, and ODE numerical integration are isolated from visualization layers.

```
+-----------------------------------------------------------------------------------+
|                                 USER INTERFACE                                    |
|   +---------------------+  +-------------------------+  +---------------------+   |
|   | 2D Workstation Canvas|  | 3D Molecular / Spatial  |  | Lab Controls & Deck |   |
|   | (PixiJS / Canvas2D) |  | (Three.js / WebGPU)     |  | (React / Tailwind)  |   |
|   +---------------------+  +-------------------------+  +---------------------+   |
+------------------------------------------^----------------------------------------+
                                           | Reactive State / Render Buffers
+------------------------------------------v----------------------------------------+
|                                SIMULATION HOST LAYER                              |
|   +---------------------------------------------------------------------------+   |
|   |                      Event Bus & Scenario Coordinator                     |   |
|   +---------------------------------------------------------------------------+   |
|       |                     |                     |                     |         |
|   +---v------------+   +----v------------+   +----v------------+   +----v-----+   |
|   | Atomic & Chem  |   | Reaction & ODE  |   | Biomolecular    |   | Cellular |   |
|   | Graph Engine   |   | Kinetic Engine  |   | Folding Engine  |   | Systems  |   |
|   +----------------+   +-----------------+   +-----------------+   +----------+   |
+------------------------------------------^----------------------------------------+
                                           | Interop / WebAssembly / Workers
+------------------------------------------v----------------------------------------+
|                                SCIENTIFIC COMPUTATION                             |
|   +-------------------------+  +--------------------------+  +----------------+   |
|   | Cheminformatics Kernels |  | Particle & Spatial MD    |  | SBML / Bio ODE |   |
|   | (RDKit WebAssembly)     |  | (Verlet / Barnes-Hut)    |  | Solver Engine  |   |
|   +-------------------------+  +--------------------------+  +----------------+   |
+------------------------------------------^----------------------------------------+
                                           | REST / In-Memory Index
+------------------------------------------v----------------------------------------+
|                         SCIENTIFIC DATA & INGESTION LAYER                         |
|   +----------------------+  +-------------------------+  +--------------------+   |
|   | PubChem & PDB Client |  | Periodic Table Database |  | Local Experiment DB|   |
|   | (REST & Cache)       |  | (Static JSON Registry)  |  | (IndexedDB/Storage)|   |
|   +----------------------+  +-------------------------+  +--------------------+   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Subsystem Definitions & Boundaries

### 2.1 Subsystem A: Atomic & Molecular Core (`@atomica/core-chem`)
- **Responsibilities:**
  - Maintains the authoritative Element Registry (atomic mass, valence, electron configs, electronegativity).
  - Chemical Graph representation: Atoms as nodes with formal charge, isotope, coordinates; Bonds as edges with order (single, double, triple, aromatic, coordinate) and stereochemistry.
  - VSEPR Geometry Solver: Computes 3D target coordinates and 2D projections based on steric numbers (AX2 through AX6).
  - Validation Engine: Verifies octet/duet rules, valence limits, hypervalence (d-orbital participation), and formal charge conservation.

### 2.2 Subsystem B: Reaction & Physical Kinetics (`@atomica/physics-kinetics`)
- **Responsibilities:**
  - Particle Dynamics: Spatial grid / Verlet integrator for Brownian motion, thermal velocity distribution (Maxwell-Boltzmann), and boundary containment.
  - Reaction Matching: Evaluates collisions based on activation energy ($E_a$), orientation factor, and reaction cross-sections.
  - ODE Reaction Solver: Stiff ODE integration (Runge-Kutta 4th order / implicit solver) for mass-action kinetics, reversible equilibrium, and enzyme catalysis.

### 2.3 Subsystem C: Macromolecules & Biomolecular Systems (`@atomica/biomolecules`)
- **Responsibilities:**
  - Standard amino acid and nucleotide polymerizers.
  - Ramachandran angle constraint evaluation ($\phi$, $\psi$, $\omega$).
  - Protein folding simulation: Lattice model / contact map approximation simulating hydrophobic core collapse and secondary structure emergence ($\alpha$-helices, $\beta$-sheets).
  - Nucleic acid sequence transcription, translation, and Watson-Crick base pairing.

### 2.4 Subsystem D: Cellular & Systems Biology (`@atomica/cellular`)
- **Responsibilities:**
  - Compartmentalized fluid simulations: Extracellular fluid, lipid bilayer boundaries, cytoplasm, and organelle interiors.
  - Transport mechanics: Fickian diffusion, osmotic pressure gradients, voltage-gated ion channels, and ATP-dependent pumps.
  - Metabolic flux balance: Glycolysis, ATP yield, and respiration equations.

### 2.5 Subsystem E: Immunology & Vaccine Workbench (`@atomica/immunology`)
- **Responsibilities:**
  - Epitope-paratope complementary shape and charge matching.
  - Immune cell lifecycle: Naive state, activation by antigen-presenting cells (APCs), clonal expansion, cytokine emission, and memory differentiation.
  - Vaccine interaction testing: Model primary vs secondary challenge curves.

### 2.6 Subsystem F: Scientific Data & Persistence (`@atomica/data`)
- **Responsibilities:**
  - PubChem REST API connector with client-side caching.
  - IndexedDB storage for laboratory notebooks, experiment snapshots, and custom molecule libraries.
  - Serialization formats: JSON schema conforming to `ATOMICA-Molecule-v1` and standard CML/PDB/SMILES export.

---

## 3. Technology Stack Recommendation (Target for Phase 0 Evaluation)

- **Frontend Application Shell:** Next.js / TypeScript (strict mode) with Tailwind CSS for clean workstation aesthetic.
- **2D Simulation Rendering:** PixiJS (WebGL2 / WebGPU-accelerated 2D sprites and vector graphics).
- **3D Molecular Lookdev:** Three.js / React Three Fiber with custom GLSL shaders for electron probability orbitals and SASA surfaces.
- **Compute Kernels:** WebAssembly (compiled from Rust or C++ RDKit minimal subset) run inside dedicated Web Workers.
- **Testing & Verification:** Vitest for unit testing, Playwright for e2e validation, and Jest-extended for numerical floating-point tolerances.

# ATOMICA: Centralized Task Board (Fallen Leaf System)

> **All task assignments and file scopes must be claimed via `python scripts/coordinator.py claim`.**

---

## Active Task Queue

> **User directive (2026-11-18): 2D first.** All 3D work (Three.js, Mol*, 3D viewport) is **PAUSED** until the 2D molecule sandbox (TSK-UI-001) is complete and user-tested. No other feature work until then.

| Task ID | Priority | Subsystem | Assigned Agent | Status | Exclusive Reserved Files | Deliverable & Acceptance Criteria |
| :--- | :---: | :--- | :---: | :---: | :--- | :--- |
| **TSK-UI-005** | `P0` | Biomolecule Library (1718 molecules) | `agent/claude` | `REVIEW` | `src/chemistry/biomolecules/`, `src/ui/LibraryPanel.ts`, `scripts/build-biomolecule-library.mjs`, `src/sandbox/`, `src/ui/SandboxView.ts`, `src/main.ts`, `index.html`, `src/styles.css` | Left-side searchable library (category dropdown + search) of 1000+ biomolecules — amino acids, sugars, nucleotides, lipids, vitamins, absorbable mineral forms, metabolites. Real 2D structures from PubChem, bundled offline; drag/click into the sandbox. Precursor to full biomolecule support. |
| **TSK-UI-004** | `P0` | Easy/Hard modes, compound names, VSEPR geometry | `agent/claude` | `COMPLETE` | `src/sandbox/`, `src/ui/`, `src/chemistry/compoundNames.ts`, `index.html`, `src/main.ts`, `src/styles.css` | Auto bond orders (easy) / red wrong bonds (hard); 500+ compound names; geometry grid with VSEPR angles. |
| **TSK-UI-002** | `P0` | Windows Desktop App (Electron) | `agent/claude` | `COMPLETE` | `electron/`, `package.json`, `vite.config.ts` | Portable .exe wrapping the 2D sandbox (`npm run app:build`). |
| **TSK-UI-001** | `P0` | 2D Molecule Builder Sandbox | `agent/claude` | `COMPLETE` | `index.html`, `src/main.ts`, `src/styles.css`<br>`src/ui/`, `src/sandbox/`, `src/chemistry/elements.ts`<br>`tests/sandbox/`, `tests/chemistry/elements.test.ts` | Periodic table (all 118 elements) at top of screen; drag elements into a 2D sandbox; bond atoms within valence limits; light/dark theme. |
| **TSK-ENG-001** | `P0` | Real-World Data Ingestion | `agent/gemini` | `READY` | `src/chemistry/PubChemClient.ts`<br>`src/proteins/PdbClient.ts`<br>`tests/chemistry/pubchem.test.ts` | Retrieve real molecules (Creatine, Glucose) and PDB structures (SARS-CoV-2 spike, ACE2). |
| **TSK-ENG-002** | `P0` | Organism-to-Atom Hierarchy | `agent/claude` | `COMPLETE` | `src/anatomy/HierarchyTree.ts`<br>`src/anatomy/NavigationState.ts`<br>`tests/anatomy/hierarchy.test.ts` | Multi-scale navigation: Organism → Organ → Tissue → Cell → Organelle → Complex → Molecule → Atom. |
| **TSK-ENG-003** | `P1` | Chemical Graph & VSEPR | `agent/gemini` | `READY` | `src/chemistry/ChemicalGraph.ts`<br>`src/chemistry/VseprSolver.ts`<br>`tests/chemistry/graph.test.ts` | Graph invariants, bond orders, formal charges, and VSEPR bond angles validated against NIST. |
| **TSK-ENG-004** | `P1` | 3D Viewport & Mol* Adapter | `agent/claude` | `PAUSED` | `src/visualization/Viewport3D.ts`<br>`src/visualization/MolstarAdapter.ts`<br>`tests/visualization/viewport.test.ts` | Three.js scene manager with Mol* integration shell for atomic and macromolecular rendering. |
| **TSK-ENG-005** | `P1` | Stochastic Kinetics Engine | `agent/gemini` | `READY` | `src/simulation/GillespieSimulator.ts`<br>`tests/simulation/gillespie.test.ts` | Gillespie SSA (Stochastic Simulation Algorithm) for discrete molecular reaction bursts. |
| **TSK-ENG-006** | `P2` | Sandbox Physics Adapter | `agent/claude` | `READY` | `src/simulation/RapierPhysicsAdapter.ts`<br>`tests/simulation/rapier.test.ts` | Rapier 2D/3D physics adapter for macroscopic sandbox apparatus, vessels, and boundaries. |
| **TSK-ENG-007** | `P2` | Mesoscale Biological Assembly | `agent/gemini` | `READY` | `src/mesoscale/CellPackAssembler.ts`<br>`tests/mesoscale/cellpack.test.ts` | cellPACK / MesoCraft recipe packing algorithm assembling virions and multi-protein complexes. |

---

## Status Key
- `READY`: Open for assignment; no file conflicts.
- `CLAIMED`: Agent has acquired locks through coordinator.
- `IN_PROGRESS`: Active implementation on agent's feature branch.
- `WAITING_FOR_LOCK`: Blocked by another agent's active file reservation.
- `REVIEW`: Code complete; awaiting independent review.
- `PAUSED`: Deliberately on hold by user directive; do not claim.
- `COMPLETE`: Tested, verified against reference cases, and merged into `main`.

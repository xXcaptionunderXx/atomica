# ATOMICA: Centralized Task Board (Fallen Leaf System)

> **All task assignments and file scopes must be claimed via `python scripts/coordinator.py claim`.**

---

## Active Task Queue

| Task ID | Priority | Subsystem | Assigned Agent | Status | Exclusive Reserved Files | Deliverable & Acceptance Criteria |
| :--- | :---: | :--- | :---: | :---: | :--- | :--- |
| **TSK-ENG-001** | `P0` | Real-World Data Ingestion | `agent/gemini` | `READY` | `src/chemistry/PubChemClient.ts`<br>`src/proteins/PdbClient.ts`<br>`tests/chemistry/pubchem.test.ts` | Retrieve real molecules (Creatine, Glucose) and PDB structures (SARS-CoV-2 spike, ACE2). |
| **TSK-ENG-002** | `P0` | Organism-to-Atom Hierarchy | `agent/claude` | `READY` | `src/anatomy/HierarchyTree.ts`<br>`src/anatomy/NavigationState.ts`<br>`tests/anatomy/hierarchy.test.ts` | Multi-scale navigation: Organism → Organ → Tissue → Cell → Organelle → Complex → Molecule → Atom. |
| **TSK-ENG-003** | `P1` | Chemical Graph & VSEPR | `agent/gemini` | `READY` | `src/chemistry/ChemicalGraph.ts`<br>`src/chemistry/VseprSolver.ts`<br>`tests/chemistry/graph.test.ts` | Graph invariants, bond orders, formal charges, and VSEPR bond angles validated against NIST. |
| **TSK-ENG-004** | `P1` | 3D Viewport & Mol* Adapter | `agent/claude` | `READY` | `src/visualization/Viewport3D.ts`<br>`src/visualization/MolstarAdapter.ts`<br>`tests/visualization/viewport.test.ts` | Three.js scene manager with Mol* integration shell for atomic and macromolecular rendering. |
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
- `COMPLETE`: Tested, verified against reference cases, and merged into `main`.

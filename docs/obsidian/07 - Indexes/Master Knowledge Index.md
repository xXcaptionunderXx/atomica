---
title: Master Knowledge Index
type: index
domain: index
status: verified
created: 2026-11-18
updated: 2026-11-18
tags:
  - index
  - master-index
  - navigation
---

# Master Knowledge Index

> **Comprehensive cross-referenced index connecting scientific research notes, architectural specifications, development guides, validation benchmarks, and source files.**

---

## 1. Directory Structure Navigation

```
docs/obsidian/
├── 00 - Project Dashboard/
├── 01 - Architecture/
├── 02 - Scientific Research/
├── 03 - Development/
├── 04 - Agent Coordination/
├── 05 - Validation/
├── 06 - Libraries and Resources/
└── 07 - Indexes/
```

---

## 2. Directory & Topic Cross-Reference

### `00 - Project Dashboard`
| Note | Description | Key Topics / Tags |
| :--- | :--- | :--- |
| [[Project Dashboard]] | Central project state, active priorities, task matrix, and multi-scale hierarchy overview. | `dashboard`, `tasks`, `concurrency` |
| [[Current Development Status]] | Phase status, subsystem implementation matrix, active milestone checklist. | `status`, `milestones`, `blockers` |
| [[Recently Updated]] | Chronological changelog of vault notes and modifications across sessions. | `changelog`, `updates` |

---

### `01 - Architecture`
| Note | Subsystem / Subject | Implementation Mapping |
| :--- | :--- | :--- |
| [[System Architecture]] | Multi-scale zoom, subsystem boundaries, data flow pipelines. | `src/anatomy/HierarchyTree.ts` |
| [[Atomic Engine Specification]] | Elements, isotopes, electron configuration contracts. | `src/chemistry/elements.ts` |
| [[Chemical Graph and Bond Validation]] | Graph invariants, valence checking, formal charge conservation. | `src/chemistry/ChemicalGraph.ts` |
| [[Decoupled Simulation and Rendering Pipeline]] | Web Workers compute thread separated from UI/render threads. | `src/sandbox/`, `src/simulation/` |
| [[ADR-001 - Phase 0 Pre-Development Research Gate]] | Mandatory literature review prior to implementation. | Governance |
| [[ADR-002 - GitHub as Single Source of Truth]] | Repository as single authoritative memory system. | Governance |
| [[ADR-003 - Decoupled Compute and Render Architecture]] | Web Workers / SharedArrayBuffer architecture. | System Design |
| [[ADR-004 - 2D Interactive Sandbox First Strategy]] | User directive prioritizing 2D sandbox before 3D viewport. | Strategy |

---

### `02 - Scientific Research` (Atomic Notes)
| Note | Scientific Domain | Relevant Equations / Models | Implementation Code |
| :--- | :--- | :--- | :--- |
| [[Atomic Structure and Electron Shells]] | Physics / Atomic | Aufbau sequence, quantum numbers $(n, l, m_l, m_s)$ | `src/chemistry/elements.ts` |
| [[Covalent and Ionic Bonding]] | Chemistry / Bonding | Formal charge $\text{FC} = V - N - B/2$, Morse, Born-Landé | `src/chemistry/ChemicalGraph.ts` |
| [[VSEPR Theory and Molecular Geometry]] | Chemistry / Geometry | Steric numbers, electron pair repulsion order | `src/chemistry/VseprSolver.ts` |
| [[Electrostatic Interactions]] | Physics / Electrostatics | Coulomb, Debye-Hückel screened potential $\kappa$, H-bonds | `src/simulation/Electrostatics.ts` |
| [[Molecular Dynamics and Force Fields]] | Physics / Simulation | Lennard-Jones 12-6, Lorentz-Berthelot combining rules | `src/simulation/` |
| [[Langevin Dynamics and Brownian Motion]] | Physics / Statistical | Fluctuation-dissipation, Langevin Stokes drag, BAOAB | `src/simulation/` |
| [[Protein Structure Prediction]] | Biochemistry / Structural | AlphaFold2, RMSD, TM-score, static fold limitations | `src/proteins/PdbClient.ts` |
| [[Molecular Docking]] | Biochemistry / Binding | $K_D = k_{\text{off}} / k_{\text{on}}$, $\Delta G^\circ = RT \ln K_D$, AutoDock Vina | `src/simulation/BindingKinetics.ts` |
| [[Amino Acids and Protein Hierarchical Folding]] | Biochemistry / Proteins | Ramachandran $(\phi, \psi)$ angles, peptide planarity | `src/proteins/` |
| [[Enzyme Kinetics]] | Biochemistry / Enzymes | Michaelis-Menten $v_0 = \frac{V_{\max}[S]}{K_m + [S]}$, Lineweaver-Burk | `src/simulation/EnzymeKinetics.ts` |
| [[Cellular Respiration]] | Biochemistry / Metabolism | Glycolysis, Krebs cycle, Proton Motive Force $\Delta p$ | `src/simulation/CellularRespiration.ts` |
| [[Cell Membrane Transport and Osmosis]] | Cell Biology / Transport | Fick's law, GHK equation, Van 't Hoff osmotic $\Pi = iCRT$ | `src/simulation/` |
| [[Stochastic Biology and Gillespie Kinetics]] | Biophysics / Kinetics | Chemical Master Equation, Gillespie Direct SSA | `src/simulation/GillespieSimulator.ts` |
| [[Adaptive Immunity and Affinity Maturation]] | Immunology / Affinity | Somatic hypermutation, B-cell clonal affinity selection | `src/simulation/` |
| [[Mesoscale Modeling and Biological Assembly]] | Mesoscale / Crowding | Fractional volume $\Phi_{\text{crowd}}$, cellPACK, MesoCraft | `src/mesoscale/CellPackAssembler.ts` |
| [[Stiff ODE Integration for Biochemical Kinetics]] | Mathematics / Numerical | Stiff solvers, Radau IIA, Jacobian conditioning | `src/simulation/` |

---

### `03 - Development`
| Note | Purpose / Protocol | Implementation Scope |
| :--- | :--- | :--- |
| [[Fallen Leaf Multi-Agent Concurrency Protocol]] | Centralized task coordinator and atomic file locking CLI. | `scripts/coordinator.py`, `locks.json` |
| [[Test-Driven Development Framework]] | Unit test discipline, failure reproduction, definition of done. | `tests/` |
| [[Real-World Scientific Ingestion Architecture]] | PubChem PUG-REST and RCSB PDB ingestion pipeline. | `src/chemistry/PubChemClient.ts`, `src/proteins/PdbClient.ts` |
| [[2D Molecule Builder Architecture]] | 118-element periodic toolbar, 2D canvas, spring bonds. | `src/sandbox/`, `src/ui/` |

---

### `04 - Agent Coordination`
| Note | Subject | Agents Involved |
| :--- | :--- | :--- |
| [[Multi-Agent Operating Charter]] | Operational rules, memory via Obsidian, git conventions. | `agent/claude`, `agent/gemini` |
| [[Handoff - Session 001]] | Initial architecture and vault establishment. | Session 001 |
| [[Handoff - Session 002 - 2D Sandbox and Real Data Ingestion]] | Session 002 handoff, TSK-UI-001, TSK-ENG-001, locks. | Session 002 |

---

### `05 - Validation`
| Note | Focus Area | Standards & Benchmarks |
| :--- | :--- | :--- |
| [[Software Verification vs Scientific Validation]] | ASME V&V principles: software tests vs physical benchmarks. | Unit tests vs golden reference cases |
| [[Reference Benchmark Cases and Tolerances]] | Empirical benchmark datasets from NIST, IUPAC, and PDB. | Golden test tolerances |

---

### `06 - Libraries and Resources`
| Note | Coverage | Key Libraries |
| :--- | :--- | :--- |
| [[Open-Source Scientific Software and Data Stack]] | Data sources, licenses, APIs, and rendering engines. | PubChem, RCSB PDB, Mol*, Three.js, Rapier, cellPACK, MesoCraft |
| [[Canonical Scientific Textbooks and Standards]] | Peer-reviewed textbooks across 10 scientific disciplines. | Lehninger, Pauling, Alberts, Halliday & Resnick |

---

### `07 - Indexes`
| Note | Purpose | Structure |
| :--- | :--- | :--- |
| [[Master Knowledge Index]] | Authoritative cross-referenced directory lookup. | Tabular mapping across all notes |
| [[Knowledge Map]] | Conceptual and dependency graph of vault topics. | Visual Mermaid network |

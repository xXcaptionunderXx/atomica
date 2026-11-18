---
title: Project Dashboard
type: dashboard
domain: project-management
status: verified
created: 2026-11-18
updated: 2026-11-18
tags:
  - architecture
  - research
  - dashboard
  - coordination
---

# ATOMICA — Project Dashboard

> **Central institutional memory, operational status, and navigational hub for ATOMICA.**  
> *Obsidian stores persistent human-readable knowledge; GitHub tracks versioned implementation.*

---

## 1. Project Phase & Strategic Priority

- **Active Strategic Directive:** **2D Sandbox First.**
  - *Per user directive (2026-11-18):* All 3D rendering (Three.js, Mol*, 3D camera zoom) is **PAUSED** until the interactive 2D Molecule Builder Sandbox (`TSK-UI-001`) is fully implemented, responsive, and verified.
- **Active Phase:** `PHASE 1: 2D MOLECULE BUILDER & REAL-WORLD DATA INGESTION`
- **Multi-Agent Protocol:** [[Fallen Leaf Multi-Agent Concurrency Protocol]] strictly enforced via `scripts/coordinator.py`. Claude and Gemini **never** edit the same files concurrently.
- **Engineering Standard:** [[Test-Driven Development Framework]] (Scientific Verification $\ge$ Implementation).

---

## 2. Active Agent Task Matrix (Fallen Leaf System)

| Task ID | Owner | Subsystem | Status | Scope / Reserved Files | Target Deliverable |
| :--- | :---: | :--- | :---: | :--- | :--- |
| **TSK-UI-001** | `agent/claude` | 2D Molecule Builder Sandbox | `IN_PROGRESS` | `index.html`, `src/main.ts`, `src/styles.css`, `src/ui/`, `src/sandbox/`, `src/chemistry/elements.ts` | Complete 118-element periodic table palette, drag-and-drop atom placement, valence bond formation, light/dark theme. |
| **TSK-ENG-001** | `agent/gemini` | Real-World Data Ingestion | `REVIEW` | `src/chemistry/PubChemClient.ts`, `src/proteins/PdbClient.ts`, `tests/chemistry/pubchem.test.ts` | PUG-REST & RCSB PDB coordinate ingestion (Creatine CID 586, Crambin 1CRN, Spike/ACE2). |
| **TSK-ENG-002** | `agent/claude` | Organism-to-Atom Hierarchy | `REVIEW` | `src/anatomy/HierarchyTree.ts`, `src/anatomy/NavigationState.ts`, `tests/anatomy/hierarchy.test.ts` | 8-level multi-scale hierarchical state model: Organism $\to$ Organ System $\to$ Organ $\to$ Tissue $\to$ Cell $\to$ Organelle $\to$ Complex $\to$ Molecule $\to$ Atom. |
| **TSK-DOC-002** | `agent/gemini` | Obsidian Knowledge Management | `IN_PROGRESS` | `docs/obsidian/` | Comprehensive, atomic, cross-linked research notes, architecture specs, and multi-agent coordination memory. |
| **TSK-ENG-003** | `agent/gemini` | Chemical Graph & VSEPR | `READY` | `src/chemistry/ChemicalGraph.ts`, `src/chemistry/VseprSolver.ts`, `tests/chemistry/graph.test.ts` | Valence/octet rule validator, graph formal charges, and VSEPR 2D/3D bond angle solver. |
| **TSK-ENG-004** | `agent/claude` | 3D Viewport & Mol* Adapter | `PAUSED` | `src/visualization/Viewport3D.ts`, `src/visualization/MolstarAdapter.ts` | Paused per user directive until 2D sandbox validation completes. |
| **TSK-ENG-005** | `agent/gemini` | Stochastic Kinetics Engine | `READY` | `src/simulation/GillespieSimulator.ts`, `tests/simulation/gillespie.test.ts` | Gillespie Direct Method (SSA) for discrete stochastic reaction bursts and molecular noise. |

---

## 3. Core Vault Navigation

- **Central Directory Map:**
  - `00 - Project Dashboard`: High-level status, active tasks, blockers, and recent changes ([[Current Development Status]], [[Recently Updated]]).
  - `01 - Architecture`: System design, module contracts, ADRs ([[System Architecture]], [[ADR-004 - 2D Interactive Sandbox First Strategy]]).
  - `02 - Scientific Research`: Verified scientific models, equations, and literature citations ([[Protein Structure Prediction]], [[Covalent and Ionic Bonding]], [[Stochastic Biology and Gillespie Kinetics]]).
  - `03 - Development`: Practical engineering notes, implementation patterns, and workflows ([[Fallen Leaf Multi-Agent Concurrency Protocol]], [[2D Molecule Builder Architecture]]).
  - `04 - Agent Coordination`: Agent assignments, handoffs, and memory continuity ([[Multi-Agent Operating Charter]], [[Handoff - Session 002 - 2D Sandbox and Real Data Ingestion]]).
  - `05 - Validation`: Scientific benchmarks, tolerances, and verification frameworks ([[Reference Benchmark Cases and Tolerances]], [[Software Verification vs Scientific Validation]]).
  - `06 - Libraries and Resources`: Open-source tool evaluations, APIs, and data sources ([[Open-Source Scientific Software and Data Stack]], [[Canonical Scientific Textbooks and Standards]]).
  - `07 - Indexes`: Searchable indices linking research to code ([[Master Knowledge Index]], [[Knowledge Map]]).

---

## 4. Grounded Scientific Assumptions & Boundaries

1. **Static Structure $\neq$ Emergent Function:**
   - AlphaFold and PDB yield 3D equilibrium coordinates, not dynamical functional pathways.
   - High-level simulation mode operates on curated biochemical rules ("Spike binds ACE2 with $K_D \approx 15\text{ nM}$") rather than attempting ab initio de novo molecular dynamics from scratch.
2. **Biology is Intrinsic Stochasticity:**
   - Cellular reactions are not deterministic continuous flows. Low-copy-number species exhibit discrete bursts governed by the Chemical Master Equation and Gillespie SSA ([[Stochastic Biology and Gillespie Kinetics]]).
3. **Multi-Scale Transition Boundaries:**
   - Continuous transition from macroscopic anatomy (Z-Anatomy polygons) $\to$ mesoscale macromolecular packing (cellPACK / MesoCraft) $\to$ atomistic coordinate representations (PubChem / RCSB PDB).

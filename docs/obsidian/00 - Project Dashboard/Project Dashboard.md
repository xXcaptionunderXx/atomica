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
---

# ATOMICA — Project Dashboard

> **Central institutional memory and navigational hub for ATOMICA.**  
> *Obsidian stores persistent knowledge; GitHub tracks implementation.*

---

## 1. Project Phase & Immediate Priority
- **Active Phase:** `PHASE 1: FOUNDATION CODEBASE & REAL-DATA INGESTION`
- **Immediate Sprint Goal:** Connect real-world PDB/PubChem ingestion to the Organism-to-Atom 3D viewport.
- **Concurrency Governance:** [[Fallen Leaf Task System]] enforced via `scripts/coordinator.py`.
- **Engineering Standard:** [[Test-Driven Development Framework]] (Scientific Correctness > Visuals).

---

## 2. Active Agent Assignments (Fallen Leaf System)

| Task ID | Owner | Subsystem | Status | Primary Files |
| :--- | :---: | :--- | :---: | :--- |
| **TSK-ENG-001** | `agent/gemini` | Real-World Data Ingestion | `REVIEW` | `src/chemistry/PubChemClient.ts`, `src/proteins/PdbClient.ts` |
| **TSK-ENG-002** | `agent/claude` | Organism-to-Atom Hierarchy | `READY` | `src/anatomy/HierarchyTree.ts`, `src/anatomy/NavigationState.ts` |
| **TSK-ENG-003** | `agent/gemini` | Chemical Graph & VSEPR | `READY` | `src/chemistry/ChemicalGraph.ts`, `src/chemistry/VseprSolver.ts` |
| **TSK-ENG-004** | `agent/claude` | 3D Viewport & Mol* Adapter | `READY` | `src/visualization/Viewport3D.ts`, `src/visualization/MolstarAdapter.ts` |

---

## 3. Vault Knowledge Navigation

- [[Master Knowledge Index]] — Searchable index linking research, code, and tests.
- [[Knowledge Map]] — Visual Mermaid dependency and conceptual graph.
- [[System Architecture]] — Subsystem boundaries and multi-scale hierarchy.
- [[Open-Source Scientific Software and Data Stack]] — Evaluated libraries (PDB, PubChem, Mol*, Rapier, cellPACK).
- [[Reference Benchmark Cases and Tolerances]] — Experimental golden datasets from NIST, IUPAC, and PDB.

---

## 4. Key Limitations & Assumptions
1. **Structure $\neq$ Function:** AlphaFold predicts static folded shape, not emergent behavior. Simulation mode relies on curated interaction rules (e.g., Spike binds ACE2).
2. **Biological Randomness:** Real molecular biology is stochastic. Modeled via [[Stochastic Biology and Gillespie Kinetics]] rather than pure deterministic clockwork.
3. **Decoupled Architecture:** Heavy physics/kinetics runs in Web Workers; UI/rendering runs at 60 FPS ([[Decoupled Simulation and Rendering Pipeline]]).

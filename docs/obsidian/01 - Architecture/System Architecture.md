---
title: System Architecture
type: architecture-spec
domain: architecture
status: verified
created: 2026-11-18
updated: 2026-11-18
sources:
  - "[[ADR-003 - Decoupled Compute and Render Architecture]]"
  - "[[Open-Source Scientific Software and Data Stack]]"
related:
  - "[[Atomic Engine Specification]]"
  - "[[Chemical Graph and Bond Validation]]"
  - "[[Decoupled Simulation and Rendering Pipeline]]"
tags:
  - architecture
---

# ATOMICA System Architecture

## 1. High-Level Modular Boundaries

ATOMICA is organized into decoupled layers to ensure that heavy scientific calculation, stochastic kinetics, and multi-scale data ingestion never block 60 FPS user interaction.

```
+-----------------------------------------------------------------------------------+
|                        USER INTERFACE & VISUALIZATION LAYER                       |
|   +---------------------+      +---------------------+      +-----------------+   |
|   | React 19 UI Shell   |      | Three.js Viewport   |      | Mol* Molecule   |   |
|   | Hierarchy Navigator |      | (Organism -> Cell)  |      | Renderer        |   |
|   +----------+----------+      +----------^----------+      +--------^--------+   |
|              |                            |                          |            |
+--------------|----------------------------|--------------------------|------------+
               | User Events                | Read-Only Render Buffers |
+--------------v----------------------------|--------------------------|------------+
|                        SIMULATION & KINETICS COMPUTE LAYER                        |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                   WebAssembly / Web Worker Simulation Host                |   |
|   +---------------------------------------------------------------------------+   |
|       |                     |                     |                     |         |
|   +---v------------+   +----v------------+   +----v------------+   +----v-----+   |
|   | Langevin MD /  |   | Gillespie SSA   |   | Chemical Graph  |   | Rapier   |   |
|   | Verlet Physics |   | Stiff Kinetics  |   | VSEPR Solver    |   | Physics  |   |
|   +----------------+   +-----------------+   +-----------------+   +----------+   |
+------------------------------------------^----------------------------------------+
                                           | Typed Data Adapters
+------------------------------------------v----------------------------------------+
|                          REAL-WORLD SCIENTIFIC DATA LAYER                         |
|   +-----------------------+  +------------------------+  +--------------------+   |
|   | PubChem PUG-REST      |  | RCSB PDB Client        |  | Z-Anatomy &        |   |
|   | (Real Small Molecules)|  | (Real Protein/mmCIF)   |  | cellPACK Recipes   |   |
|   +-----------------------+  +------------------------+  +--------------------+   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Organism-to-Atom Hierarchical Zoom

ATOMICA's core novelty is the continuous, interactive traversal across 8 spatial orders of magnitude:

1. **Organism Level ($\sim 1\text{ to }2\text{ m}$):** Anatomical models from [[Open-Source Scientific Software and Data Stack|Z-Anatomy / BodyParts3D]].
2. **Organ System ($\sim 0.1\text{ to }0.5\text{ m}$):** Cardiovascular, respiratory, nervous, and renal networks.
3. **Organ ($\sim 0.05\text{ to }0.1\text{ m}$):** Heart, lungs, liver, brain, kidneys.
4. **Tissue ($\sim 10^{-4}\text{ to }10^{-3}\text{ m}$):** Muscle fibers, epithelial sheets, extracellular matrix.
5. **Cellular ($\sim 10^{-6}\text{ to }10^{-5}\text{ m}$):** Cardiomyocytes, neurons, leukocytes, fluid membranes.
6. **Organelle ($\sim 10^{-7}\text{ to }10^{-6}\text{ m}$):** Mitochondria, nucleus, ribosomes, vesicles.
7. **Macromolecular Complex ($\sim 10^{-8}\text{ to }10^{-7}\text{ m}$):** Real 3D structures from RCSB PDB packed via cellPACK/MesoCraft (e.g., SARS-CoV-2 spike, ATP synthase).
8. **Small Molecule & Atom ($\sim 10^{-10}\text{ to }10^{-9}\text{ m}$):** Real chemical graphs from PubChem (Creatine, Glucose, Water) with VSEPR bond angles and electron configurations.

---

## 3. Core Architectural Decisions

- [[ADR-001 - Phase 0 Pre-Development Research Gate]] — Research-first discipline.
- [[ADR-002 - GitHub as Single Source of Truth]] — Version control as authoritative memory.
- [[ADR-003 - Decoupled Compute and Render Architecture]] — Worker threads for simulation.
- [[Fallen Leaf Multi-Agent Concurrency Protocol]] — Exclusive task claiming and file locking.

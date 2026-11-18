# ATOMICA — A Complete Chemistry & Biological Simulation Sandbox

> **A fully interactive, scientifically grounded simulation sandbox spanning subatomic particles, molecular synthesis, macromolecular biochemistry, cellular biology, organ systems, and computational immunology.**

[![Phase](https://img.shields.io/badge/Phase-0%3A%20Pre--Development%20Research-blue.svg)](#current-status)
[![Multi-Agent Protocol](https://img.shields.io/badge/Multi--Agent-Claude%20%26%20Gemini-green.svg)](project-management/AGENT_ROLES.md)
[![Scientific Standard](https://img.shields.io/badge/Scientific%20Standard-Rigorous%20%26%20Grounded-orange.svg)](project-management/research/SCIENTIFIC_VALIDATION_STANDARDS.md)

---

## Overview

**ATOMICA** is a unified scientific workstation and sandbox environment designed to empower researchers, students, and educators to construct matter from the ground up: starting with individual protons, neutrons, and electrons, developing molecules and biomolecules, assembling living cellular machinery, connecting tissues and organ systems, and experimenting within simulated laboratory environments.

The platform bridges educational accessibility with genuine scientific accuracy, avoiding superficial animation in favor of mathematical models, quantum approximations, thermodynamic equations, and biological reaction networks.

---

## Core Capabilities & Subsystems

1. **Core Workstation Interface**
   - Professional laboratory workstation UI (flat, dark-mode, non-gamified).
   - Infinite 2D simulation canvas with seamless pan/zoom, coordinate grids, and element inspection.
   - Collapsible palettes for periodic table elements, compounds, organelles, and lab apparatus.
   - Simulation control deck with time-dilation, step-by-step integration, and reproducible seed controls.

2. **Periodic Table & Atomic Construction**
   - All 118 IUPAC recognized elements with comprehensive physical, electronic, and isotopic data.
   - Nucleus builder: adjust isotopes, calculate binding energy, radioactive decay modes, and half-lives.
   - Electron configuration viewer with orbital shell visualizations (Aufbau principle, Hund's rule, Pauli exclusion).

3. **Molecular Construction & Chemical Graph Engine**
   - Interactive bonding engine supporting covalent, ionic, metallic, coordinate, single, double, and triple bonds.
   - Real-time VSEPR (Valence Shell Electron Pair Repulsion) geometry solver and formal charge tracker.
   - Resonance structures, molecular polarity vectors, electronegativity gradients, and stability validation.

4. **Integrated Chemical Search & PubChem Ingestion**
   - Instant search across millions of compounds via common names, IUPAC names, formulas, and CAS numbers.
   - Auto-builder ("BUILD THIS MOLECULE") to lay out complex structures directly in the workspace.
   - Retrieval of thermodynamic constants, synthesis pathways, safety profiles, and biological roles.

5. **Multi-Modal Molecular Visualization**
   - **2D Structural Diagrams:** ChemDraw-grade Lewis representations with bond angles, lone pairs, and charges.
   - **3D Molecular Models:** Ball-and-stick, Space-filling (van der Waals), and CPK coloring with interactive rotation.
   - **Realistic Spatial Rendering:** Solvent-accessible surface area (SASA), electrostatic potential maps, and orbital densities.

6. **Chemical Characteristics & Reaction Sandbox**
   - Conservation of mass, charge, and energy with stoichiometric balancing.
   - Arrhenius kinetics, activation energies, catalysts/enzymes, and Le Chatelier equilibrium shifts.
   - Precipitation, acid-base titrations, oxidation-reduction (redox) cascades, and combustion thermodynamics.

7. **Biomolecule Synthesis & Protein Folding**
   - Polymerization engine for amino acids, nucleotides (DNA/RNA), lipids, and polysaccharides.
   - Protein hierarchical representation: primary sequence, secondary helices/sheets, tertiary folding, and quaternary multimerization.
   - Contact energy approximations (hydrophobic collapse, hydrogen bonding networks, disulfide bridges).

8. **Cellular Construction & Metabolic Simulation**
   - Fluid mosaic membrane construction with phospholipid bilayers, cholesterol, and integral transport proteins.
   - Eukaryotic and prokaryotic organelle placement (nucleus, mitochondria, ribosomes, endoplasmic reticulum, Golgi).
   - Functional biological processes: glycolysis, Krebs cycle, oxidative phosphorylation, transcription, and translation.

9. **Tissues, Organs & Whole Organism Physiology**
   - Multicellular assembly: connecting myocytes into cardiac tissue, neurons into firing networks, nephrons into renal filtration systems.
   - Inter-organ transport: cardiovascular blood flow, oxygenation cycles, hormonal feedback loops, and homeostasis.

10. **Immunology & Vaccine Discovery Laboratory**
    - Pathogen modeling: antigen epitopes, viral capsid proteins, bacterial cell walls.
    - Immune cell dynamics: macrophage phagocytosis, dendritic cell antigen presentation via MHC-I/II, helper/cytotoxic T-cell activation, B-cell affinity maturation, and neutralizing antibody synthesis.
    - Vaccine formulation workbench with adjuvant selection, dosage kinetics, and memory response tracking.

---

## Multi-Agent Development System (Claude & Gemini)

ATOMICA is actively built and maintained by independent AI coding agents operating as an integrated engineering team.

- **Lead Architect & Integration Coordinator:** **Claude**
- **Independent Development & Research Specialist:** **Gemini**

All communication, task assignments, architectural decisions, and integration verification are recorded transparently in the repository.

### Shared Project Memory

The [`/project-management/`](project-management/) directory is the authoritative source of truth:

| Document | Purpose |
| :--- | :--- |
| [`PROJECT_OVERVIEW.md`](project-management/PROJECT_OVERVIEW.md) | Comprehensive specification, scope, and target milestones |
| [`ARCHITECTURE.md`](project-management/ARCHITECTURE.md) | System boundaries, engine breakdown, and component dataflows |
| [`AGENT_ROLES.md`](project-management/AGENT_ROLES.md) | Agent permissions, responsibilities, and protocols |
| [`TASK_BOARD.md`](project-management/TASK_BOARD.md) | Live task tracker with strict state transitions |
| [`DEVELOPMENT_LOG.md`](project-management/DEVELOPMENT_LOG.md) | Chronological development journal across all agents |
| [`DECISIONS.md`](project-management/DECISIONS.md) | Architectural Decision Records (ADRs) |
| [`INTEGRATION_STATUS.md`](project-management/INTEGRATION_STATUS.md) | Subsystem compatibility matrix and health status |
| [`API_CONTRACTS.md`](project-management/API_CONTRACTS.md) | Interface schemas between modules |
| [`NEXT_STEPS.md`](project-management/NEXT_STEPS.md) | Current sprint priorities and blocking dependencies |

---

## Persistent Obsidian Knowledge Base (`/docs/obsidian/`)

Per **Section 19**, ATOMICA maintains a canonical, anti-slop **Obsidian Knowledge Base** directly inside the repository under [`/docs/obsidian/`](docs/obsidian/):
- **Entry Point:** [`00 - Home/Project Dashboard.md`](docs/obsidian/00%20-%20Home/Project%20Dashboard.md)
- **Knowledge Map:** [`00 - Home/Knowledge Map.md`](docs/obsidian/00%20-%20Home/Knowledge%20Map.md)
- **Scientific Reference Library:** Peer-reviewed grounding across physics, chemistry, biology, physiology, and immunology.
- **Architectural Decision Records (ADRs):** Recorded permanently in [`06 - Development/Engineering Decisions/`](docs/obsidian/06%20-%20Development/Engineering%20Decisions/).
- **Quality Standard:** Strict prohibition of AI slop, empty summaries, duplicate notes, or unverified claims. Every note is connected to technical specifications and test cases via bi-directional links (`[[...]]`).

---

## Engineering Philosophy: Test-First & Functionality-First

Per **Section 20**, ATOMICA follows a strict development philosophy:
> **RESEARCH → EXPERIMENT → TEST → IMPLEMENT → VERIFY → INTEGRATE → VALIDATE → VISUALIZE → POLISH**

1. **Correctness over Aesthetics:** Scientific, functional, and mathematical accuracy precede graphics, visual effects, and UI polish.
2. **Software Verification vs. Scientific Validation:** Passing unit tests alone does not constitute scientific validity; models must reproduce established reference cases within empirical tolerances.
3. **Reference Benchmarks:** Formalized in [`Reference Benchmark Cases and Tolerances`](docs/obsidian/09%20-%20Experiments%20and%20Validation/Scientific%20Validation/Reference%20Benchmark%20Cases%20and%20Tolerances.md) with gold-standard experimental datasets from NIST, IUPAC, CRC Handbook, and RCSB PDB.
4. **No Fake Science:** Hardcoded approximations or mock animations masquerading as real physics are strictly prohibited.

---

## Current Status: Phase 0 (Pre-Development Research & Discovery)

Per project mandate (**Section 18**), **no production implementation code may be written until Phase 0 technical discovery is complete, verified, and approved.**

All 18 research deliverables are established in [`/project-management/research/`](project-management/research/):
1. `MASTER_RESEARCH_REPORT.md`
2. `CHEMISTRY_RESEARCH.md`
3. `MOLECULAR_MODELING_RESEARCH.md`
4. `PHYSICS_SIMULATION_RESEARCH.md`
5. `BIOMOLECULAR_RESEARCH.md`
6. `CELLULAR_BIOLOGY_RESEARCH.md`
7. `PHYSIOLOGY_RESEARCH.md`
8. `IMMUNOLOGY_RESEARCH.md`
9. `TECH_STACK_EVALUATION.md`
10. `SCIENTIFIC_SOFTWARE_COMPARISON.md`
11. `DATABASE_AND_API_RESEARCH.md`
12. `RENDERING_AND_PERFORMANCE_RESEARCH.md`
13. `MULTI_AGENT_WORKFLOW_RESEARCH.md`
14. `SCIENTIFIC_VALIDATION_STANDARDS.md`
15. `SECURITY_AND_DATA_INTEGRITY.md`
16. `IMPLEMENTATION_ROADMAP.md`
17. `RESEARCH_BIBLIOGRAPHY.md`
18. `UNRESOLVED_QUESTIONS.md`

---

## Repository Management & GitHub Desktop

This repository is configured for direct integration with **GitHub Desktop**:
- **Clone / Open:** Open GitHub Desktop and select `File` > `Add Local Repository...` (or use CLI: `github open .`)
- **Remote:** Linked to `https://github.com/xXcaptionunderXx/atomica`
- **Default Branch:** `main`
- **Feature Branches:** `agent/<agent-name>/<feature-name>`

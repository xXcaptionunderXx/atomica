---
title: Knowledge Map
type: index
domain: architecture
status: verified
created: 2026-11-18
updated: 2026-11-18
tags:
  - architecture
  - research
---

# ATOMICA — Knowledge Map

```mermaid
flowchart TD
    subgraph S0["00 - Home"]
        Dashboard["Project Dashboard"]
        DevStatus["Current Development Status"]
    end

    subgraph S1["01 - Scientific Foundations"]
        Atoms["Atomic Structure and Electron Shells"]
        VSEPR["VSEPR Theory and Molecular Geometry"]
        Langevin["Langevin Dynamics and Brownian Motion"]
        Proteins["Amino Acids and Protein Hierarchical Folding"]
        Membranes["Cell Membrane Transport and Osmosis"]
        Immune["Adaptive Immunity and Affinity Maturation"]
    end

    subgraph S2["02 - Mathematical Foundations"]
        ODE["Stiff ODE Integration for Biochemical Kinetics"]
    end

    subgraph S3["03 - Simulation Research"]
        LJ["Force Fields and Lennard-Jones Potentials"]
    end

    subgraph S4["04 - Software and Technology"]
        Decoupled["Decoupled Simulation and Rendering Pipeline"]
    end

    subgraph S5["05 - System Architecture"]
        AtomEngine["Atomic Engine Specification"]
        MolEngine["Chemical Graph and Bond Validation"]
    end

    subgraph S6["06 - Development & QA"]
        TDD["Test-Driven Development and Validation Framework"]
        ADR["Engineering Decisions (ADRs)"]
    end

    subgraph S9["09 - Validation"]
        Benchmarks["Reference Benchmark Cases and Tolerances"]
    end

    Dashboard --> Atoms
    Dashboard --> VSEPR
    Dashboard --> Proteins
    Atoms --> VSEPR
    VSEPR --> MolEngine
    Atoms --> AtomEngine
    Langevin --> LJ
    LJ --> Decoupled
    Proteins --> Membranes
    Membranes --> ODE
    Immune --> Benchmarks
    TDD --> Benchmarks
    AtomEngine --> MolEngine
```

---

## Topical Navigation

### 1. Physics & Chemistry Foundations
- [[Atomic Structure and Electron Shells]] — Quantum numbers, Aufbau, Hund's rules, isotopes, and element constants.
- [[VSEPR Theory and Molecular Geometry]] — Steric numbers, electron domain geometries, and bond angles.
- [[Langevin Dynamics and Brownian Motion]] — Solvent friction, thermal noise, and symplectic Verlet integration.

### 2. Biological Systems
- [[Amino Acids and Protein Hierarchical Folding]] — Peptide bond planar constraints, Ramachandran plots, and hydrophobic collapse.
- [[Cell Membrane Transport and Osmosis]] — Lipid bilayer permeability, Fickian diffusion, and GHK resting potentials.
- [[Adaptive Immunity and Affinity Maturation]] — Clonal selection, somatic hypermutation, and antibody binding affinity.

### 3. Computation & Engineering
- [[Stiff ODE Integration for Biochemical Kinetics]] — Stiff numerical solvers (RK45 / Radau) for enzyme cascades.
- [[Force Fields and Lennard-Jones Potentials]] — 12-6 LJ potentials and harmonic spring models.
- [[Decoupled Simulation and Rendering Pipeline]] — WebAssembly workers vs. WebGPU / PixiJS render loops.
- [[Atomic Engine Specification]] — Core data contracts and validation limits.
- [[Chemical Graph and Bond Validation]] — Graph topology, kekulization, and formal charge conservation.

### 4. Standards, Testing & Governance
- [[Test-Driven Development and Validation Framework]] — TDD workflow and software verification vs. scientific validation.
- [[Reference Benchmark Cases and Tolerances]] — Ground-truth experimental datasets from NIST, IUPAC, and PDB.
- [[ADR-001 - Phase 0 Pre-Development Research Gate]]
- [[ADR-002 - GitHub as Single Source of Truth]]
- [[ADR-003 - Decoupled Compute and Render Architecture]]

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
  - graph
  - navigation
---

# ATOMICA — Interconnected Knowledge Map

```mermaid
flowchart TD
    subgraph D0["00 - Project Dashboard"]
        Dash["Project Dashboard"]
        DevStat["Current Development Status"]
        Recent["Recently Updated"]
    end

    subgraph D1["01 - Architecture"]
        SysArch["System Architecture"]
        AtomSpec["Atomic Engine Specification"]
        ChemGraph["Chemical Graph and Bond Validation"]
        Decoupled["Decoupled Simulation Pipeline"]
        ADR1["ADR-001 Research Gate"]
        ADR2["ADR-002 GitHub Single Truth"]
        ADR3["ADR-003 Decoupled Compute/Render"]
        ADR4["ADR-004 2D Sandbox First"]
    end

    subgraph D2["02 - Scientific Research (Atomic Notes)"]
        direction TB
        Atoms["Atomic Structure & Shells"]
        Bonds["Covalent & Ionic Bonding"]
        VSEPR["VSEPR Molecular Geometry"]
        Electro["Electrostatic Interactions"]
        MD["Molecular Dynamics & Force Fields"]
        Langevin["Langevin & Brownian Motion"]
        Proteins["Amino Acids & Folding"]
        Predict["Protein Structure Prediction"]
        Dock["Molecular Docking"]
        Enzymes["Enzyme Kinetics"]
        Resp["Cellular Respiration"]
        Membranes["Membrane Transport & Osmosis"]
        Stochastic["Stochastic Biology & Gillespie"]
        Immune["Adaptive Immunity"]
        Mesoscale["Mesoscale Biological Assembly"]
        ODE["Stiff ODE Integration"]
    end

    subgraph D3["03 - Development"]
        FL["Fallen Leaf Concurrency Protocol"]
        TDD["Test-Driven Development Framework"]
        Ingest["Real-World Scientific Ingestion"]
        UI2D["2D Molecule Builder Architecture"]
    end

    subgraph D4["04 - Agent Coordination"]
        Charter["Multi-Agent Operating Charter"]
        Hand1["Handoff Session 001"]
        Hand2["Handoff Session 002"]
    end

    subgraph D5["05 - Validation"]
        VV["Verification vs Validation"]
        Bench["Reference Benchmarks & Tolerances"]
    end

    subgraph D6["06 - Libraries and Resources"]
        Stack["Open-Source Scientific Stack"]
        Texts["Canonical Scientific Textbooks"]
    end

    subgraph D7["07 - Indexes"]
        MasterIdx["Master Knowledge Index"]
    end

    %% High-level connections
    Dash --> DevStat
    Dash --> MasterIdx
    MasterIdx --> SysArch
    MasterIdx --> Atoms

    %% Scientific Hierarchy Flow
    Atoms --> Bonds
    Bonds --> VSEPR
    Bonds --> Electro
    VSEPR --> MD
    Electro --> MD
    Langevin --> MD
    Bonds --> Proteins
    Proteins --> Predict
    Predict --> Dock
    Dock --> Enzymes
    Enzymes --> Resp
    Resp --> Membranes
    Enzymes --> Stochastic
    Stochastic --> Immune
    Predict --> Mesoscale
    Membranes --> Mesoscale
    Resp --> ODE

    %% Development & Architecture Connections
    SysArch --> ADR4
    ADR4 --> UI2D
    Bonds --> ChemGraph
    ChemGraph --> UI2D
    Atoms --> AtomSpec
    Predict --> Ingest
    Mesoscale --> Ingest
    FL --> Charter
    Charter --> Hand2
    TDD --> VV
    VV --> Bench
    Ingest --> Stack
```

---

## Topical Knowledge Clusters

### 1. Atomic to Molecular Geometry
- [[Atomic Structure and Electron Shells]] $\to$ [[Covalent and Ionic Bonding]] $\to$ [[VSEPR Theory and Molecular Geometry]]
- Implemented in: `src/chemistry/elements.ts`, `src/chemistry/ChemicalGraph.ts`, `src/chemistry/VseprSolver.ts`.

### 2. Classical Molecular Physics & Kinetics
- [[Electrostatic Interactions]] + [[Molecular Dynamics and Force Fields]] + [[Langevin Dynamics and Brownian Motion]]
- Implemented in: `src/simulation/Electrostatics.ts`, `src/simulation/`.

### 3. Structural Biology & Mesoscale Assembly
- [[Protein Structure Prediction]] $\to$ [[Amino Acids and Protein Hierarchical Folding]] $\to$ [[Molecular Docking]] $\to$ [[Mesoscale Modeling and Biological Assembly]]
- Ingested via: `src/proteins/PdbClient.ts`, packed via `src/mesoscale/CellPackAssembler.ts`.

### 4. Biochemical Kinetics & Cellular Physiology
- [[Enzyme Kinetics]] $\to$ [[Cellular Respiration]] $\to$ [[Cell Membrane Transport and Osmosis]] $\to$ [[Stochastic Biology and Gillespie Kinetics]]
- Modeled via: `src/simulation/GillespieSimulator.ts`, `src/simulation/CellularRespiration.ts`.

### 5. Multi-Agent Governance & Concurrency
- [[Fallen Leaf Multi-Agent Concurrency Protocol]] $\to$ [[Multi-Agent Operating Charter]] $\to$ [[Project Dashboard]]
- Enforced via: `scripts/coordinator.py`, `project-management/task-system/locks.json`.

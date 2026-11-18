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

> **Central entry point and institutional memory index for the ATOMICA scientific simulation sandbox.**

---

## 1. Project Phase & Health

- **Current Phase:** `PHASE 0: PRE-DEVELOPMENT RESEARCH & DISCOVERY`
- **Development Philosophy:** `TEST-FIRST & FUNCTIONALITY-FIRST` (Mandatory Section 20)
- **Active Sprint Focus:** Scientific Literature Synthesis & Tolerance Specifications
- **Vault Status:** Synchronized with GitHub repository (`main` branch)
- **Last Meaningful Update:** 2026-11-18 (Session 001)

---

## 2. Research & Discovery Status

| Domain | Canonical Obsidian Note | Status | Lead Agent |
| :--- | :--- | :---: | :---: |
| **Atomic Physics** | [[Atomic Structure and Electron Shells]] | `verified` | Gemini |
| **VSEPR & Geometry** | [[VSEPR Theory and Molecular Geometry]] | `verified` | Gemini |
| **Langevin Dynamics** | [[Langevin Dynamics and Brownian Motion]] | `verified` | Claude |
| **Biomolecular Folding** | [[Amino Acids and Protein Hierarchical Folding]] | `verified` | Gemini |
| **Cellular Transport** | [[Cell Membrane Transport and Osmosis]] | `verified` | Claude |
| **Adaptive Immunology** | [[Adaptive Immunity and Affinity Maturation]] | `verified` | Gemini |
| **Kinetics & ODEs** | [[Stiff ODE Integration for Biochemical Kinetics]] | `verified` | Claude |

---

## 3. Major Architectural Decisions (ADRs)

- [[ADR-001 - Phase 0 Pre-Development Research Gate]]: Strict freeze on production implementation until research is verified and approved.
- [[ADR-002 - GitHub as Single Source of Truth]]: Git repository holds all authoritative memory; chat logs are ephemeral.
- [[ADR-003 - Decoupled Compute and Render Architecture]]: Scientific logic and numerical solvers are decoupled from UI and WebGL rendering.

---

## 4. Key Scientific Reference Cases & Tolerances

- [[Reference Benchmark Cases and Tolerances]]: Pre-defined NIST, IUPAC, and PDB reference cases for automated validation (Section 20.8).
- [[Test-Driven Development and Validation Framework]]: Software verification vs. scientific validation standards (Section 20.7).

---

## 5. Critical Constraints & Known Limitations

1. **Ab Initio Quantum Limit:** True Hartree-Fock / DFT cannot execute client-side at 60 FPS; semi-empirical and empirical force fields required.
2. **Multi-Scale Time Discrepancy:** Femtosecond atomic vibrations decoupled from millisecond enzymatic fluxes via temporal magnification hierarchy.
3. **No Fake Functionality Rule:** Every metric, bond angle, and energy term must be calculated from physical equations or labeled as an approximation (Section 20.10).

---

## 6. Vault Quick Links

- [[Knowledge Map]] — Conceptual graph and structural navigation.
- [[Current Development Status]] — Real-time subsystem health.
- [[Recently Updated]] — Log of recent vault additions.

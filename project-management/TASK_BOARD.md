# ATOMICA: Centralized Task Board

> **Authoritative task tracking across all development agents.**
> **Workflow States:** `BACKLOG` → `READY` → `IN_PROGRESS` → `REVIEW` → `INTEGRATING` → `TESTING` → `COMPLETE`
> **Exception States:** `BLOCKED` | `NEEDS_REVISION` | `CANCELLED`

---

## Active Phase: PHASE 0 — Pre-Development Research & Discovery

| Task ID | Title / Scope | Assigned Agent | Reviewer | Dependencies | Status | Deliverable File |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TSK-P0-001** | Repository Initialization & Architecture Setup | Gemini | Claude | None | `COMPLETE` | Repository Structure & Project Management Docs |
| **TSK-P0-002** | Master Research Synthesis & Scope Framework | Claude | Gemini | TSK-P0-001 | `IN_PROGRESS` | `research/MASTER_RESEARCH_REPORT.md` |
| **TSK-P0-003** | Atomic Physics & Quantum Chemistry Grounding | Gemini | Claude | TSK-P0-001 | `IN_PROGRESS` | `research/CHEMISTRY_RESEARCH.md` |
| **TSK-P0-004** | Molecular Graph Theory & VSEPR Feasibility | Gemini | Claude | TSK-P0-003 | `READY` | `research/MOLECULAR_MODELING_RESEARCH.md` |
| **TSK-P0-005** | Classical Dynamics, Diffusion & ODE Solvers | Claude | Gemini | TSK-P0-001 | `READY` | `research/PHYSICS_SIMULATION_RESEARCH.md` |
| **TSK-P0-006** | Macromolecules, Folding & PDB Integration | Gemini | Claude | TSK-P0-004 | `READY` | `research/BIOMOLECULAR_RESEARCH.md` |
| **TSK-P0-007** | Cellular Compartments, Metabolism & SBML | Claude | Gemini | TSK-P0-005 | `READY` | `research/CELLULAR_BIOLOGY_RESEARCH.md` |
| **TSK-P0-008** | Systems Physiology & Organ Interfacing | Gemini | Claude | TSK-P0-007 | `READY` | `research/PHYSIOLOGY_RESEARCH.md` |
| **TSK-P0-009** | Computational Immunology & Vaccine Dynamics | Gemini | Claude | TSK-P0-006 | `READY` | `research/IMMUNOLOGY_RESEARCH.md` |
| **TSK-P0-010** | Technology Stack & Runtime Benchmark Analysis | Claude | Gemini | TSK-P0-001 | `READY` | `research/TECH_STACK_EVALUATION.md` |
| **TSK-P0-011** | Scientific Software Evaluation (RDKit, OpenMM) | Gemini | Claude | TSK-P0-010 | `READY` | `research/SCIENTIFIC_SOFTWARE_COMPARISON.md` |
| **TSK-P0-012** | Database Ingestion (PubChem, ChEBI, PDB APIs) | Gemini | Claude | TSK-P0-010 | `READY` | `research/DATABASE_AND_API_RESEARCH.md` |
| **TSK-P0-013** | High-Performance Canvas & WebGPU Lookdev | Claude | Gemini | TSK-P0-010 | `READY` | `research/RENDERING_AND_PERFORMANCE_RESEARCH.md` |
| **TSK-P0-014** | Multi-Agent Synchronization & GitHub Protocol | Claude | Gemini | TSK-P0-001 | `READY` | `research/MULTI_AGENT_WORKFLOW_RESEARCH.md` |
| **TSK-P0-015** | Scientific Validation Standards & Tolerance Specs | Gemini | Claude | TSK-P0-003 | `READY` | `research/SCIENTIFIC_VALIDATION_STANDARDS.md` |
| **TSK-P0-016** | Security, Data Integrity & Offline Ingestion | Claude | Gemini | TSK-P0-012 | `READY` | `research/SECURITY_AND_DATA_INTEGRITY.md` |
| **TSK-P0-017** | Phased Milestone Roadmap & PoC Definitions | Claude & Gemini | All | All Research | `BACKLOG` | `research/IMPLEMENTATION_ROADMAP.md` |
| **TSK-P0-018** | Peer-Reviewed Bibliography & Citations | Gemini | Claude | All Research | `IN_PROGRESS` | `research/RESEARCH_BIBLIOGRAPHY.md` |
| **TSK-P0-019** | Unresolved Technical Questions & Risks | Claude & Gemini | All | All Research | `IN_PROGRESS` | `research/UNRESOLVED_QUESTIONS.md` |
| **TSK-P0-020** | Phase 0 Formal Research Gate & Joint Sign-off | Claude & Gemini | Human Lead | All Above | `BACKLOG` | `research/RESEARCH_APPROVAL.md` |

---

## Phase 1 Readiness Checklist (Gated by Section 18.12)

- [ ] All 18 Research Documents Completed & Peer-Reviewed
- [ ] No Open Unresolved High-Risk Blockers
- [ ] Proof of Concept (PoC) for Molecular Graph & Canvas Performance Validated
- [ ] Shared API Contracts Formalized in `API_CONTRACTS.md`
- [ ] Final Approval Signed in `RESEARCH_APPROVAL.md`

# ATOMICA: Next Steps & Immediate Priorities

> **Prioritized development items for the active Phase 0 research cycle.**

---

## Immediate Next Steps (Phase 0: Pre-Development Research)

1. **Sprint Goal: Complete Fundamental Scientific Research Documents**
   - **TSK-P0-002 (`research/MASTER_RESEARCH_REPORT.md`):** Complete executive synthesis of computational chemistry, biophysics, and mathematical boundaries across all 10 project domains.
   - **TSK-P0-003 (`research/CHEMISTRY_RESEARCH.md`):** Formalize exact mathematical rules for electron configuration, VSEPR angles, formal charge calculations, and isotopic stability.
   - **TSK-P0-005 (`research/PHYSICS_SIMULATION_RESEARCH.md`):** Benchmark velocity Verlet, Langevin dynamics, and stiff ODE solvers (RK45) for real-time browser execution.
   - **TSK-P0-010 (`research/TECH_STACK_EVALUATION.md`):** Document technical trade-offs between PixiJS vs. WebGPU Canvas, WebAssembly (Rust vs. C++ RDKit), and Web Workers.

2. **Cross-Agent Review Cycle**
   - Claude to review Gemini's chemistry research (`CHEMISTRY_RESEARCH.md`) and database ingestion strategy (`DATABASE_AND_API_RESEARCH.md`).
   - Gemini to review Claude's physics dynamics equations (`PHYSICS_SIMULATION_RESEARCH.md`) and rendering architecture (`RENDERING_AND_PERFORMANCE_RESEARCH.md`).

3. **Proof-of-Concept (PoC) Gate Definitions**
   - Define minimal headless test to verify whether 1,000 interacting atoms with Lennard-Jones potentials and harmonic bond springs can be simulated within a 16.6ms frame budget (60 FPS).
   - Verify PubChem REST API latency and CORS policy for client-side queries.

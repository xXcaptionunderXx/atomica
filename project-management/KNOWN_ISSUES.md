# ATOMICA: Known Issues, Technical Debt & Limitations

> **Persistent tracking of known limitations, bugs, performance bottlenecks, and open technical hurdles.**

---

## 1. Active Scientific Limitations & Approximations Under Evaluation

1. **ISSUE-001: Computational Scale for True Quantum Chemistry**
   - **Severity:** High (Theoretical Limit)
   - **Description:** Direct ab initio solving of the Schrödinger equation (Hartree-Fock, DFT) for systems with more than ~50 electrons cannot run in real time within a client browser.
   - **Mitigation Strategy Under Research:** Use semi-empirical methods (PM6 / GFN-xTB precalculated matrices) or machine-learned potential approximations (ANI-2x) alongside classical force fields (MMFF94 / UFF) for interactive manipulation.

2. **ISSUE-002: Real-time Ab Initio Protein Folding**
   - **Severity:** High (Complexity Limit)
   - **Description:** True all-atom molecular dynamics folding for proteins takes weeks on supercomputing clusters.
   - **Mitigation Strategy Under Research:** Implement coarse-grained lattice models (HP model / UNRES) combined with pre-computed AlphaFold2 / ESMFold structure lookups for native conformations, simulating intermediate folding pathways via energy-landscape minimizations.

3. **ISSUE-003: Multi-Scale Time Step Discrepancies**
   - **Severity:** Medium (Simulation Architecture)
   - **Description:** Molecular vibrations occur at femtosecond ($10^{-15}$ s) scales, Brownian diffusion at nanoseconds ($10^{-9}$ s), enzyme turnover at milliseconds ($10^{-3}$ s), and cellular reproduction at hours ($10^{4}$ s). Simulating all scales simultaneously with a single integrator is impossible.
   - **Mitigation Strategy Under Research:** Multi-scale time-dilation hierarchy. Subatomic engines run at discrete micro-steps; cellular networks operate via quasi-steady-state stochastic Gillespie or ODE solvers.

---

## 2. Technical Debt & Tooling Limitations

1. **DEBT-001: WebAssembly Cold Start & Payload Size**
   - Full RDKit WebAssembly builds can exceed 30MB, hindering browser startup latency. A tailored, pruned compilation containing only graph algorithms and VSEPR coordinate generators must be evaluated in Phase 0.

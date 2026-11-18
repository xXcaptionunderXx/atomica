# ATOMICA: Architecture Decision Records (ADRs)

> **Permanent, immutable log of architectural and technical decisions made across development agents.**

---

## ADR-001: Strict Enforcement of Phase 0 Pre-Development Research Gate
- **Date:** 2026-11-18
- **Status:** `ACCEPTED`
- **Authors:** Claude & Gemini
- **Context:**
  Large scientific simulation platforms frequently fail due to premature coding based on naive assumptions (e.g. attempting to simulate quantum mechanics with classical Newtonian engines, or naive 2D graph layout for 3D chiral molecules). Section 18 establishes a mandatory pre-development research phase.
- **Decision:**
  All production application coding is blocked until all 18 research deliverables in `/project-management/research/` are completed, peer-reviewed by both Claude and Gemini, and formally signed off via `RESEARCH_APPROVAL.md`.
- **Consequences:**
  - Prevents rework and architectural dead-ends.
  - Requires all early commits to focus on scientific literature review, mathematical modeling, and interface schemas.

---

## ADR-002: GitHub Repository as Single Source of Truth for Multi-Agent Collaboration
- **Date:** 2026-11-18
- **Status:** `ACCEPTED`
- **Authors:** Claude & Gemini
- **Context:**
  Independent AI agents do not share live context windows, active memory, or ephemeral chat histories.
- **Decision:**
  All project knowledge, task ownership, API schemas, and architectural modifications must be persisted directly into committed markdown artifacts within `/project-management/`.
- **Consequences:**
  - Any agent resuming work must inspect the git log and `/project-management/` directory before taking action.
  - No undocumented verbal agreements or conversational assumptions are recognized.

---

## ADR-003: Decoupled Simulation Host vs. Rendering Layer Architecture
- **Date:** 2026-11-18
- **Status:** `ACCEPTED`
- **Authors:** Claude & Gemini
- **Context:**
  The project requires rendering tens of thousands of particles while executing stiff ODE kinetic integrations and molecular graph evaluations.
- **Decision:**
  Decouple the simulation kernel (physics, chemistry graph, kinetics) from the visualization pipeline (PixiJS 2D canvas, Three.js 3D WebGPU). Compute engines must run inside Web Workers or WebAssembly modules and communicate via binary typed arrays (ArrayBuffers / SharedArrayBuffers) to avoid main-thread UI jank.
- **Consequences:**
  - Clean separation of concerns.
  - High frame rates (60 FPS) sustained regardless of simulation complexity.

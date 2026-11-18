# ATOMICA: Multi-Agent Roles & Operating Charter

> **Mandatory protocol for AI agents collaborating on the ATOMICA repository.**

---

## 1. Primary Agent Designations

### 1.1 Claude — Lead Architect & Integration Coordinator
- **Handle:** `agent/claude`
- **Core Responsibilities:**
  - Overall system architecture, design patterns, and cross-subsystem boundaries.
  - Definition and maintenance of shared API contracts (`/project-management/API_CONTRACTS.md`).
  - Pull request review and branch integration into `main`.
  - Resolution of architectural trade-offs and multi-agent merge conflicts.
  - Global performance budgets, regression testing, and CI/CD maintenance.
- **Operating Boundary:**
  - Will not unilaterally rewrite modules assigned to and active under Gemini without documented review and justification in `DECISIONS.md`.

### 1.2 Gemini — Independent Development & Scientific Research Agent
- **Handle:** `agent/gemini`
- **Core Responsibilities:**
  - In-depth scientific research and mathematical modeling (quantum chemistry, reaction kinetics, cellular systems).
  - Identification and integration of authoritative scientific databases (PubChem, PDB, UniProt).
  - Implementation of core simulation kernels (VSEPR, chemical graph solvers, ODE kinetics).
  - Critical technical counter-review of Claude's architectural proposals.
  - Authoring comprehensive unit, property-based, and scientific validation tests.
- **Operating Boundary:**
  - Independently challenges unsound technical decisions or inaccurate approximations. Scientific validity takes precedence over seniority.

---

## 2. Additional & Future Agent Roles

Future tasks may be allocated to specialized subagent personas:
- `agent/physics-specialist`: Numerical integration, Brownian motion, collision optimizations.
- `agent/lookdev-specialist`: WebGL2 / WebGPU shaders, orbital isosurfaces, UI design system.
- `agent/bio-specialist`: Metabolic network modeling, cellular respiration, immunology kinetics.
- `agent/qa-auditor`: Automated test coverage, memory leak profiling, floating point accuracy verification.

---

## 3. Communication & Synchronization Protocol

1. **GitHub Artifacts as Persistent Memory:**
   - Conversation context is strictly transient. No decision is valid until documented in `/project-management/DECISIONS.md`.
2. **Branching Model:**
   - Main branch (`main`) is protected.
   - Feature branches must follow the standard: `agent/<agent-name>/<feature-topic>`.
   - Never force-push (`git push --force`) to shared branches.
3. **Session Startup Routine:**
   Before initiating any work, each agent must:
   - Identify its assigned role.
   - Review `/project-management/TASK_BOARD.md` and `/project-management/NEXT_STEPS.md`.
   - Check open PRs and issues for blocking dependencies.
   - Verify that its active task is in `IN_PROGRESS` state.
4. **Session Handoff Routine:**
   Upon concluding a development slice, each agent must:
   - Ensure all code compiles and unit tests pass.
   - Update `/project-management/DEVELOPMENT_LOG.md` with a detailed handoff entry.
   - Update task status on `/project-management/TASK_BOARD.md`.
   - Create or update the corresponding Pull Request with the standardized Handoff Checklist.

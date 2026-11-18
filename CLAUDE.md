# CLAUDE PROJECT BRIEFING & ONBOARDING DIRECTIVE

> **Project:** ATOMICA — A Complete Chemistry & Biological Simulation Sandbox  
> **Role:** Lead Architect & Integration Coordinator (`agent/claude`)  
> **Partner Agent:** Gemini (`agent/gemini` — Independent Development & Research Specialist)  
> **Repository Location:** `C:\Users\Avery Mageors\.gemini\antigravity\scratch\atomica`  
> **Remote GitHub:** `https://github.com/xXcaptionunderXx/atomica.git`  
> **Default Branch:** `main`  

---

## 1. Operating Context & Agent Role

You are **Claude**, serving as the **Lead Architect and Integration Coordinator** for project **ATOMICA**. You are operating in a local session on the user's workstation alongside **Gemini** (who operates as the Independent Development & Research Agent).

### Your Core Responsibilities:
1. **Architectural Governance:** Maintain modular boundaries, define global patterns, and safeguard performance budgets.
2. **Shared API Contracts:** Maintain `/project-management/API_CONTRACTS.md` ensuring clean data flow from subatomic particles to organ systems.
3. **Integration & Peer Review:** Review Gemini's implementations and research, resolve cross-system conflicts, and integrate branches into `main`.
4. **Scientific Rigor:** Ensure all systems adhere to Section 20 (Test-First & Functionality-First Development) with zero tolerated placeholder science.

---

## 2. Shared Project Memory & Where to Look First

ATOMICA treats the repository as the **single source of truth** (ADR-002). Conversation history across different agents is ephemeral; only committed repository state is authoritative.

Before taking any action, always inspect:
- [`/project-management/PROJECT_OVERVIEW.md`](project-management/PROJECT_OVERVIEW.md) — Complete vision and 16 core subsystems.
- [`/project-management/ARCHITECTURE.md`](project-management/ARCHITECTURE.md) — Modular engine decomposition and compute/render decoupling.
- [`/project-management/AGENT_ROLES.md`](project-management/AGENT_ROLES.md) — Operating charter and boundaries for Claude and Gemini.
- [`/project-management/TASK_BOARD.md`](project-management/TASK_BOARD.md) — Live task states (`BACKLOG` through `COMPLETE`).
- [`/project-management/DEVELOPMENT_LOG.md`](project-management/DEVELOPMENT_LOG.md) — Chronological history of sessions and decisions.
- [`/project-management/API_CONTRACTS.md`](project-management/API_CONTRACTS.md) — Standardized TypeScript data schemas.
- [`/project-management/NEXT_STEPS.md`](project-management/NEXT_STEPS.md) — Immediate sprint priorities.

---

## 3. Current Phase: Phase 0 (Pre-Development Research & Discovery)

Per **Section 18 & ADR-001**, **no production application implementation code may be written until Phase 0 is formally signed off in `RESEARCH_APPROVAL.md`**.

Gemini has already established the foundation and drafted initial scientific research. Your active tasks for Phase 0:
1. Review Gemini's initial research in [`/project-management/research/`](project-management/research/) and [`/docs/obsidian/`](docs/obsidian/).
2. Complete and refine Claude-assigned research deliverables:
   - `project-management/research/MASTER_RESEARCH_REPORT.md` (Synthesis)
   - `project-management/research/PHYSICS_SIMULATION_RESEARCH.md` (Langevin / Verlet)
   - `project-management/research/CELLULAR_BIOLOGY_RESEARCH.md` (Membranes & Metabolism)
   - `project-management/research/TECH_STACK_EVALUATION.md` (PixiJS vs WebGPU, Rust WASM)
   - `project-management/research/RENDERING_AND_PERFORMANCE_RESEARCH.md` (LOD & Shaders)
   - `project-management/research/MULTI_AGENT_WORKFLOW_RESEARCH.md` (Git protocols)
   - `project-management/research/SECURITY_AND_DATA_INTEGRITY.md` (API & Storage)
3. Audit and contribute to [`docs/obsidian/09 - Experiments and Validation/Scientific Validation/Reference Benchmark Cases and Tolerances.md`](docs/obsidian/09%20-%20Experiments%20and%20Validation/Scientific%20Validation/Reference%20Benchmark%20Cases%20and%20Tolerances.md).

---

## 4. The Obsidian Knowledge Management System (`/docs/obsidian/`)

Per **Section 19**, ATOMICA maintains a single canonical Obsidian vault at `docs/obsidian/`.
- **Direct Markdown Editing:** Edit and create standard `.md` files directly in `docs/obsidian/`. No proprietary plugins required.
- **Entry Point:** Start at `docs/obsidian/00 - Home/Project Dashboard.md`.
- **Anti-Slop Rules:**
  - Rule 1: No documentation for the sake of documentation.
  - Rule 2: No duplicate notes (one canonical note per subject).
  - Rule 3: No empty intellectual content or generic platitudes.
  - Rule 4: No fabricated scientific claims.
  - Rule 5: No meaningless summaries (explain methods, discoveries, equations, and software relevance).
  - Rule 6: No excessive fragmentation.
  - Rule 7: Quality over quantity.
- **Frontmatter Standard:** Every substantive note must include YAML metadata (`title`, `type`, `domain`, `status`, `created`, `updated`, `sources`, `related`, `tags`).
- **Linking:** Establish purposeful bi-directional links (`[[Concept Note Name]]`).
- **ADRs:** Record architectural decisions in `docs/obsidian/06 - Development/Engineering Decisions/ADR-XXX - Title.md`.

---

## 5. Engineering Philosophy: Test-First & Functionality-First (Section 20)

> **RESEARCH → EXPERIMENT → TEST → IMPLEMENT → VERIFY → INTEGRATE → VALIDATE → VISUALIZE → POLISH**

1. **Priority Order:** Scientific correctness > Functional correctness > Mathematical correctness > Architecture > Integration > Performance > Basic UI > 3D Lookdev > Visual Polish.
2. **Software Verification vs. Scientific Validation:** Passing unit tests is insufficient. Models must reproduce established experimental measurements from NIST, IUPAC, and PDB within defined empirical tolerances.
3. **No Fake Science:** Hardcoded approximations or mock animations masquerading as real physics are strictly barred. If an approximation is used, label it explicitly.
4. **Decouple Compute from Render (ADR-003):** Never embed heavy scientific calculations in UI components or `requestAnimationFrame`. Computation belongs in WebAssembly Web Workers.

---

## 6. Fallen Leaf Task Coordinator & Exclusive File Locking (Section 22)

> **MANDATORY CONCURRENCY RULE: Claude and Gemini must NEVER work on the same code or modify the same files simultaneously.**

All task claiming and file reservations are enforced programmatically through `scripts/coordinator.py`:

```bash
# Check coordinator status and active locks:
python scripts/coordinator.py status

# Claim a task and exclusively lock its files before editing:
python scripts/coordinator.py claim --agent claude --task TSK-ENG-002 --files src/anatomy/HierarchyTree.ts src/anatomy/NavigationState.ts tests/anatomy/hierarchy.test.ts

# Check if a specific file is free:
python scripts/coordinator.py check --file src/chemistry/PubChemClient.ts

# Release task locks upon completion and review submission:
python scripts/coordinator.py release --agent claude --task TSK-ENG-002 --status REVIEW --summary "Implemented Organism-to-Atom hierarchy tree with tests"
```

---

## 7. Open-Source Scientific Stack & Core Product Vision (Section 23)

### The Vision:
Nobody has built a unified, seamless zoom from a full **Organism down to individual Atoms** integrated with real 3D macromolecular libraries and interactive simulation mechanics. This is ATOMICA's breakthrough.

### Key Scientific Principles:
1. **Don't Re-invent Existing Libraries:**
   - Real molecules come directly from **PubChem** (PUG-REST: Creatine, Glucose, ATP).
   - Real macromolecular structures come directly from **RCSB PDB** (`rcsb.org`: SARS-CoV-2 spike, ACE2, Hemoglobin).
   - Mesoscale viral and cellular packing builds on methods from **cellPACK** and **MesoCraft**.
   - Anatomical hierarchies draw from **Z-Anatomy** and **BodyParts3D**.
   - Molecular visualization leverages **Mol\*** and **Three.js**.
   - Sandbox physics uses **Rapier**; atomistic dynamics references **OpenMM**; systems biology references **COPASI** and **SBML**.
2. **Structure $\neq$ Emergent Function:**
   - AlphaFold predicts static geometry, not biological dynamics. Simulation mode for known interactions relies on **curated, hand-written biochemical rules** (e.g. "Spike glycoprotein binds ACE2 receptor active site").
3. **Biological Randomness:**
   - Real biology is intrinsically stochastic (Brownian diffusion, transcriptional bursting). Fixed deterministic rules are pedagogical approximations, complemented by **Gillespie stochastic simulation (SSA)**.

---

## 8. How to Edit, Test, Commit, and Push Changes

Since you are running locally on the user's workstation:

### Step 1: Navigate to the Repository
```bash
cd "C:\Users\Avery Mageors\.gemini\antigravity\scratch\atomica"
```

### Step 2: Ensure You Have Latest Changes
```bash
git fetch origin
git pull origin main
```

### Step 3: Create a Scoped Feature Branch
Never commit directly to `main`. Use the standardized naming convention:
```bash
git checkout -b agent/claude/<feature-or-task-topic>
```
*(Example: `git checkout -b agent/claude/physics-research-refinement`)*

### Step 4: Perform Work & Run Tests
- Update or create files in `/docs/obsidian/`, `/project-management/`, or `/src/`.
- Ensure Markdown links and LaTeX equations are valid.

### Step 5: Update Multi-Agent Tracking Files
Before committing:
1. Append your session notes to `project-management/DEVELOPMENT_LOG.md`.
2. Update task statuses in `project-management/TASK_BOARD.md`.
3. If new decisions were made, add ADRs to `docs/obsidian/06 - Development/Engineering Decisions/` and `/project-management/DECISIONS.md`.

### Step 6: Commit and Push
Use the standardized multi-agent commit format identifying your agent handle:
```bash
git add .
git commit -m "[agent/claude] <type>: <clear description of changes> (<task-id>)"
git push -u origin agent/claude/<feature-or-task-topic>
```

Git credentials (via GitHub CLI / Windows Credential Manager) are already configured for account `xXcaptionunderXx` on this machine.

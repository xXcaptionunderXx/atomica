# ATOMICA: Chronological Development Log

> **All development sessions, major decisions, handoffs, and verification milestones must be appended here.**

---

### [2026-11-18] Session 001: Project Launch & Repository Architecture
- **Agent:** Gemini (Independent Development & Research Agent)
- **Action Type:** System Initialization & Multi-Agent Framework Setup
- **Summary:**
  - Initialized git repository for `ATOMICA` on default branch `main`.
  - Configured repository with fitting title and description: `ATOMICA — A Complete Chemistry & Biological Simulation Sandbox`.
  - Implemented Section 17 Multi-Agent Shared Project Memory directory structure under `/project-management/`.
  - Established initial task assignments in `TASK_BOARD.md` strictly obeying Section 18 Phase 0 Mandate (Research First, No Production Code Before Approval).
  - Provisioned GitHub Actions CI and Pull Request/Issue templates to enforce agent handoff protocols.
  - Linked repository to GitHub Desktop (`github open .`) for interactive developer workflow.
- **Artifacts Created / Modified:**
  - `README.md`
  - `.gitignore`
  - `.github/workflows/ci.yml`
  - `.github/pull_request_template.md`
  - `.github/ISSUE_TEMPLATE/task_template.md`
  - `/project-management/PROJECT_OVERVIEW.md`
  - `/project-management/ARCHITECTURE.md`
  - `/project-management/AGENT_ROLES.md`
  - `/project-management/TASK_BOARD.md`
  - `/project-management/DEVELOPMENT_LOG.md`
  - `/project-management/DECISIONS.md`
  - `/project-management/INTEGRATION_STATUS.md`
  - `/project-management/KNOWN_ISSUES.md`
  - `/project-management/API_CONTRACTS.md`
  - `/project-management/NEXT_STEPS.md`
  - `/project-management/research/*` (18 structured research deliverable blueprints)
- **Next Steps:**
  - Complete research synthesis for `MASTER_RESEARCH_REPORT.md` and `CHEMISTRY_RESEARCH.md`.
  - Claude and Gemini to conduct independent literature reviews and complete research deliverables.


---

### [2026-11-18] Session 002: Obsidian Vault System & Test-First Engineering Governance
- **Agent:** Gemini (Independent Development & Research Agent)
- **Action Type:** Knowledge Management Architecture & Validation Standard Implementation
- **Summary:**
  - Implemented Section 19: Mandatory Obsidian Knowledge Management System under `/docs/obsidian/`.
  - Enforced Anti-Slop Documentation Rules (Rules 1 through 7) preventing empty, duplicate, or unverified notes.
  - Constructed the canonical vault directory structure (Home, Scientific Foundations, Mathematical Foundations, Simulation Research, Software & Tech, System Architecture, Development/ADRs, References, Agent Collaboration, Experiments/Validation, Archived).
  - Authored foundational canonical notes with rigorous YAML metadata, LaTeX equations, real citations, and bi-directional links (`[[...]]`).
  - Implemented Section 20: Test-First Engineering, Functionality-First Development, and Implementation Validation framework.
  - Created [[Reference Benchmark Cases and Tolerances]] compiling gold-standard experimental reference cases from NIST, IUPAC, CRC Handbook, and RCSB PDB.
  - Established Definition of Done requiring both software verification and scientific validation.
- **Artifacts Created / Modified:**
  - `docs/obsidian/.obsidian/app.json`
  - `docs/obsidian/00 - Home/Project Dashboard.md`
  - `docs/obsidian/00 - Home/Knowledge Map.md`
  - `docs/obsidian/00 - Home/Current Development Status.md`
  - `docs/obsidian/00 - Home/Recently Updated.md`
  - `docs/obsidian/01 - Scientific Foundations/Atomic Physics/Atomic Structure and Electron Shells.md`
  - `docs/obsidian/01 - Scientific Foundations/General Chemistry/VSEPR Theory and Molecular Geometry.md`
  - `docs/obsidian/01 - Scientific Foundations/Physical Chemistry/Langevin Dynamics and Brownian Motion.md`
  - `docs/obsidian/01 - Scientific Foundations/Biochemistry/Amino Acids and Protein Hierarchical Folding.md`
  - `docs/obsidian/01 - Scientific Foundations/Cell Biology/Cell Membrane Transport and Osmosis.md`
  - `docs/obsidian/01 - Scientific Foundations/Immunology/Adaptive Immunity and Affinity Maturation.md`
  - `docs/obsidian/02 - Mathematical Foundations/Differential Equations/Stiff ODE Integration for Biochemical Kinetics.md`
  - `docs/obsidian/03 - Simulation Research/Molecular Dynamics/Force Fields and Lennard-Jones Potentials.md`
  - `docs/obsidian/04 - Software and Technology/Architecture/Decoupled Simulation and Rendering Pipeline.md`
  - `docs/obsidian/05 - System Architecture/Atomic Engine/Atomic Engine Specification.md`
  - `docs/obsidian/05 - System Architecture/Molecular Engine/Chemical Graph and Bond Validation.md`
  - `docs/obsidian/06 - Development/Engineering Decisions/ADR-001 - Phase 0 Pre-Development Research Gate.md`
  - `docs/obsidian/06 - Development/Engineering Decisions/ADR-002 - GitHub as Single Source of Truth.md`
  - `docs/obsidian/06 - Development/Engineering Decisions/ADR-003 - Decoupled Compute and Render Architecture.md`
  - `docs/obsidian/06 - Development/Testing/Test-Driven Development and Validation Framework.md`
  - `docs/obsidian/07 - Research Papers and References/Textbooks/Canonical Scientific Textbooks and Standards.md`
  - `docs/obsidian/08 - Agent Collaboration/Agent Handoffs/Session 001 - Initial Architecture and Vault Establishment.md`
  - `docs/obsidian/09 - Experiments and Validation/Scientific Validation/Reference Benchmark Cases and Tolerances.md`
  - `.gitignore` (added Obsidian caches)
- **Next Steps:**
  - Claude and Gemini to conduct independent review of the newly established vault.
  - Finalize remaining Phase 0 technical proofs of concept.


---

### [2026-11-18] Session 003: Fallen Leaf Task Coordinator & Real-World Scientific Ingestion Codebase
- **Agent:** Gemini (Independent Development & Research Specialist)
- **Action Type:** Coordination Engine Implementation & Codebase Launch
- **Summary:**
  - Implemented Section 22: Fallen Leaf Centralized Task Coordinator (`scripts/coordinator.py`) enforcing exclusive task ownership and atomic file locking. Tested and validated collision rejection when conflicting agents request overlapping files.
  - Formulated Section 23: Open-Source Scientific Technology Stack integrating real experimental structures (RCSB PDB), real molecules (PubChem), Mol*, Three.js, Rapier sandbox physics, cellPACK, MesoCraft, and systems biology (COPASI / SBML).
  - Initialized application codebase with modern TypeScript, Vite, Three.js, Rapier, and Vitest test runner.
  - Successfully claimed and implemented `TSK-ENG-001`:
    - `src/chemistry/PubChemClient.ts`: Queries real compounds (Creatine CID 586, Water CID 962, Glucose CID 5793) with atom coordinates, bond connectivity, and experimental property caching.
    - `src/proteins/PdbClient.ts`: Ingests and parses standard macromolecular PDB coordinate blocks (Crambin 1CRN) extracting chains, residue sequences, and 3D atomic coordinates.
    - `tests/chemistry/pubchem.test.ts`: 100% passing automated unit tests validating chemical formula, molecular weight, and spatial coordinates.
  - Formalized the Organism-to-Atom Hierarchical Zoom and addressed the core reality: structural prediction $\neq$ functional behavior; simulation mode uses curated rule sets with stochastic dynamics.
- **Artifacts Created / Modified:**
  - `scripts/coordinator.py` (Atomic task & lock CLI)
  - `project-management/task-system/*` (Fallen Leaf coordination docs)
  - `package.json`, `tsconfig.json`, `vite.config.ts`
  - `src/chemistry/PubChemClient.ts`
  - `src/proteins/PdbClient.ts`
  - `tests/chemistry/pubchem.test.ts`
- **Next Steps:**
  - Claude can claim `TSK-ENG-002` (Organism-to-Atom Hierarchy Tree) or `TSK-ENG-004` (3D Viewport Shell) using `python scripts/coordinator.py claim`.

---

### [2026-11-18] Session 004: Organism-to-Atom Hierarchy & Navigation (TSK-ENG-002)
- **Agent:** Claude (Lead Architect & Integration Coordinator)
- **Action Type:** Engine Implementation
- **Summary:**
  - `src/anatomy/HierarchyTree.ts`: containment tree over 8 ordered scale levels (organism → organ → tissue → cell → organelle → complex → molecule → atom). Invariants enforced on insert: single root, parent-before-child (no cycles), child strictly finer in level (skips allowed) and not larger in characteristic length, unique ids, atoms carry an element. Queries: path, children, descendants, by-level, ancestry, LCA, `validate()`.
  - Seed `buildCardiacEnergeticsHierarchy()`: Human (NCBITaxon 9606) → Heart (UBERON:0000948) → Cardiac muscle tissue (UBERON:0001133) → Cardiomyocyte (CL:0000746) → Mitochondrion (GO:0005739) → ATP synthase (GO:0005753, PDB 1BMF) → ATP (PubChem CID 5957). Atoms attach at runtime from a PubChem record via `attachAtomsFromCompound`.
  - `src/anatomy/NavigationState.ts`: zoom in/out, jump, browser-style back/forward, breadcrumbs, subscriber events carrying `magnification` (from/to characteristic length) for the TSK-ENG-004 viewport camera.
  - `tests/anatomy/hierarchy.test.ts`: 13 passing tests (network-free).
- **Disclosed approximations:**
  - `characteristicLengthM` values are order-of-magnitude sizes for camera zoom, not specimen measurements.
  - PDB 1BMF is bovine F1-ATPase (catalytic head only), used as a homolog for human Complex V; flagged in the node's `approximation` field.
- **Governance note:** CLAUDE.md §3 says no production code before Phase 0 sign-off in `RESEARCH_APPROVAL.md`, which does not exist yet; TSK-ENG-001 already shipped code. Needs a user decision to formally close or waive the gate.
- **Next Steps:** Review/merge; TSK-ENG-004 viewport can subscribe to `NavigationState` and use `structure` refs to load PDB/PubChem data.

---

### [2026-11-18] Session 005: 2D Molecule Sandbox (TSK-UI-001) — 3D paused
- **Agent:** Claude
- **User directive:** Everything runs in 2D first. All 3D work (TSK-ENG-004 viewport / Mol*, Three.js) is PAUSED until the user has tested this sandbox. No other feature work until then.
- **Summary:**
  - `src/chemistry/elements.ts`: all 118 elements (IUPAC standard atomic weights; bracketed mass numbers for elements without one), categories, 18-column + f-block layout, CPK colours, and a labelled valence approximation used as the bonding rule.
  - `src/sandbox/MoleculeModel.ts`: atoms/bonds, valence-limited bonding (orders 1–3), bond-order cycling, fragments, Hill formulas, molecular weights.
  - UI (`index.html`, `src/main.ts`, `src/styles.css`, `src/ui/*`): periodic table across the top; drag an element into the sandbox, drop on an atom to bond; click atom→atom to bond (repeat for double/triple); click a tile with an atom selected to attach; click bond to cycle order; drag to move; right-click / Delete to remove; light (white) / dark (grey-black) theme toggle, persisted.
  - Tests: `tests/chemistry/elements.test.ts`, `tests/sandbox/molecule.test.ts` (15 tests). Verified in-browser: H2O built by drag-drop, third H refused with message, click-bonding, theme switch.
  - Dev server port moved 3000 → 5317 (3000 collides with another local project).
- **Approximation:** bonding capacity = max common valence/oxidation state; no formal charges, dative, ionic or metallic bonding.

---

### [2026-11-18] Session 006: Windows desktop app (TSK-UI-002)
- **Agent:** Claude
- **Summary:** Wrapped the 2D sandbox in Electron (`electron/main.cjs`, sandboxed renderer, no Node integration). `npm run app` runs it in a window; `npm run app:build` produces a portable `release/ATOMICA-Sandbox-<version>.exe` (~75 MB, no install). Vite `base: './'` so the built `dist/` loads from disk. Verified the packaged app renders 118 element tiles and the themed sandbox.
- **Note:** `win.signAndEditExecutable: false` — electron-builder's winCodeSign archive needs symlink privileges on Windows; the exe is unsigned anyway (SmartScreen may warn on first launch) and has the default Electron icon.

---

### [2026-11-18] Session 007: Desktop shortcut that always runs the latest build (TSK-UI-003)
- **Agent:** Claude
- **Summary:** Portable exe renamed to a stable `release/ATOMICA-Sandbox.exe`. Added `scripts/install-desktop-shortcut.ps1`, which creates the user's Desktop shortcut pointing at `release/win-unpacked/ATOMICA Sandbox.exe` (fast start, no self-extraction). Verified the shortcut launches the app. Added a MANDATORY rule (CLAUDE.md §9, COORDINATOR_RULES §6): after any app change, both agents rebuild with `npm run app:build` so the shortcut always opens the newest version.

---

### [2026-11-18] Session 008: Easy/Hard modes, compound names, VSEPR geometry grid (TSK-UI-004)
- **Agent:** Claude (worked in worktree `../atomica-claude` after the shared checkout was switched to `main`; merged `origin/main` incl. Gemini's TSK-DOC-002 into this branch).
- **Easy / Hard:** `src/sandbox/BondOrderSolver.ts` — exact branch-and-bound over bond orders maximising atoms at an allowed valence, ties → fewest changes → lowest total order; node budget with `exhaustive` flag. Easy mode re-solves after every structural change (CO2 → O=C=O, N2 → N≡N, benzene → Kekulé, sulfate → two S=O). Hard mode flags (red) only bonds that differ from an optimal assignment closest to the user's; either benzene Kekulé structure is accepted; never flags on a non-exhaustive search.
- **Names:** `src/chemistry/compoundNames.ts` — 921 entries (generated homologous series + curated inorganic/organic/biochemical/drug/ion list), natural-notation formula parser → Hill index; ions matched via charge implied by unfilled valences on N/O/S/P/halogens. Limitation: formula-based, isomers listed as alternatives.
- **Geometry grid:** `src/sandbox/Geometry.ts` — VSEPR (σ neighbours + lone pairs from valence electrons) for 14 shapes, 2D projection with wedges/dashes, lone-pair dots, idealised angle labels, Cordero covalent-radius bond lengths with order factors, regular polygons for isolated rings, spring relaxation for fused rings. Molecules move rigidly in geometry mode.
- Tests: 57 passing (solver, model modes, geometry angles/shapes/benzene, name library). Verified in browser (easy CO2/H2O/sulfate naming, geometry, hard-mode red → fixed). Desktop app rebuilt and installed at the shortcut path; shortcut script now always targets the main checkout.

---

### [2026-11-18] Session 009: Merged 2D sandbox into `main`
- **Agent:** Claude (user-approved merge).
- Fast-forwarded `main` to `agent/claude/2d-molecule-sandbox`: TSK-ENG-002 (hierarchy), TSK-UI-001 (2D sandbox), TSK-UI-002 (Electron exe), TSK-UI-003 (desktop shortcut), TSK-UI-004 (easy/hard, names, VSEPR geometry) → COMPLETE. 57 tests, typecheck and production build pass.
- **Gemini:** `git pull origin main` before new work. Please do new work on a feature branch (ideally in your own `git worktree`) rather than switching branches in the shared checkout — the user's desktop app is served from its `release/` folder. 3D remains PAUSED per the user's 2D-first directive.

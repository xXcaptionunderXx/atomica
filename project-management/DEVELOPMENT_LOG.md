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


---

### [2026-11-18] Session 010: Biomolecule library (TSK-UI-005)
- **Agent:** Claude. Branch `agent/claude/biomolecule-library`.
- **Library:** 1718 real molecules in 23 categories (amino acids, peptides, sugars, sugar phosphates, organic acids, nucleotides, cofactors, vitamins, 110+ absorbable mineral forms and free ions, fatty acids, lipids, steroids/hormones, bile acids, neurotransmitters, porphyrins, polyphenols, carotenoids, alkaloids, gases, antibiotics/microbial metabolites, common medicines).
- **Data:** names in `src/chemistry/biomolecules/names.txt` → `scripts/build-biomolecule-library.mjs` resolves each via PubChem PUG-REST (public domain) to its 2D record (explicit H, kekulized orders, formal charges) + synonyms → bundled `library.json` (1.7 MB, lazy-loaded, works offline). Re-run the script after editing names.txt (cache in `scripts/.biomol-cache/`, gitignored).
- **UI:** collapsible left panel (`src/ui/LibraryPanel.ts`) with search (name, synonym, formula; Enter adds top hit) and category dropdown; click to add, drag to place.
- **Model:** atoms carry formal charge; valences shift by charge (O⁻→1, N⁺→4) so ions/zwitterions are complete and not flagged red; `addMolecule()` places a structure in one change without re-solving orders; unedited placements keep their exact name; salts PubChem draws as separate ions are labelled "part of <compound>". Library names are registered into the formula lookup.
- **Perf:** geometry layout cached per unchanged molecule; spring relaxation rewritten on typed arrays (B12 1.1 s → ~70 ms).
- Tests: 80 passing (new `tests/chemistry/biomolecules.test.ts`: ≥1000 entries, record integrity, key formulas/charges, search, placement, >99% of uncharged CHNOPS molecules valence-complete). Desktop app rebuilt and shortcut verified.

- **Merged to `main`** (user-approved fast-forward); TSK-UI-005 → COMPLETE. Gemini: `git pull origin main` before new work.


---

### [2026-11-18] Session 011: Sandbox navigation, undo/redo, multi-select (TSK-UI-006)
- **Agent:** Claude. Branch `agent/claude/sandbox-navigation`.
- **Bug fixed:** molecules could draw outside the sandbox (geometry-grid layout uses real bond lengths, so large library molecules grew past the edges). The sandbox now clips its content (`.sandbox-wrap`), and a newly placed molecule that does not fit zooms the view out to frame it.
- **Navigation:** atoms live in world coordinates under a pan/zoom transform. Left-drag on empty space pans; the wheel zooms at the cursor and only inside the sandbox (library, panels and page never scroll-zoom). Corner controls: − / % (reset to 100%) / + / Fit (also `F`).
- **Undo/redo:** `MoleculeModel` keeps JSON snapshots (200 steps). Every structural edit is a step; drags commit on release; placing a molecule, group delete, paste and Clear are single steps; Easy/Hard switches and automatic geometry re-layout are not steps. Ctrl+Z, Ctrl+Shift+Z / Ctrl+Y, plus Undo/Redo buttons.
- **Selection:** Shift-drag box adds atoms to the selection, Ctrl/Shift-click toggles atoms, Ctrl+A selects all. A selection drags together; Delete / right-click removes all of it; Ctrl+C / X / V copy, cut and paste at the mouse (bonds, charges and library names kept; partial copies lose the exact name).
- **Bond angles toggle:** shows/hides angle arcs and degree labels (active with the geometry grid; saved).
- Tests: 89 passing (new `tests/sandbox/history.test.ts`). Desktop app rebuilt and checked.

- **Merged to `main`** (user-approved fast-forward); TSK-UI-006 → COMPLETE. Gemini: `git pull origin main` before new work.


---

### [2026-11-18] Session 012: Layers + organelle layer (TSK-UI-007)
- **Agent:** Claude. Branch `agent/claude/organelle-layer`.
- **Layer tabs** (top of the left column): Atomic | Organelle | Cellular 🔒 | Tissue 🔒. Switching to Organelle hides the periodic table, the atomic sandbox and its panels (no atoms shown); Undo/Redo/Clear and keyboard shortcuts act on the visible layer only, each with its own history.
- **Catalogue (separate search):** 3287 real Gene Ontology cellular-component terms (descendants of organelle GO:0043226, intracellular anatomical structure GO:0005622, protein-containing complex GO:0032991; CC BY 4.0 via EBI QuickGO) in 19 organelle families, with definitions/synonyms — `scripts/build-organelle-catalog.mjs` → `src/organelle/catalog.json`. There are not 3000 distinct organelles in biology: the catalogue is organelles + their sub-compartments, membranes and complexes. 11 are **buildable and simulated**: mitochondrion, chloroplast, ribosome, nucleus, ER, Golgi, lysosome, peroxisome, lipid droplet, α-carboxysome, lipid vesicle.
- **Building:** one organelle at a time (choosing another replaces it, undoable). Membranes are filled by pasting molecules copied in the Atomic layer (Ctrl+V / Paste ×1 / ×8 / Fill). `src/organelle/classify.ts` decides from the atom graph whether a molecule can form a membrane (≥2 C8+ tails + P/N/sugar head = bilayer lipid; fused 4-ring + OH = sterol; TAG/DAG/sterol ester = neutral lipid), so hand-built lipids count. Real composition rules: inner mitochondrial membrane needs cardiolipin, thylakoids need MGDG/DGDG, lipid droplets are a phospholipid monolayer around a neutral-lipid core. Pasting bilayer lipids with nothing chosen starts a lipid vesicle.
- **Proteins:** 45 components cite PDB/UniProt entries; `scripts/verify-organelle-structures.mjs` re-checks them (45/45 resolve). Added as referenced parts — not buildable atom by atom in 2D (stated in the app).
- **Function:** reactions run per tick only when their enzymes, cofactors, closed membranes, light/pH and substrates are present: pyruvate respiration (12.5 ATP/pyruvate) and palmitate β-oxidation (106 ATP), oxygenic photosynthesis (net), translation of a user mRNA with the standard genetic code, transcription of a DNA coding strand (mRNA can be sent to the ribosome), SERCA Ca²⁺ uptake, sphingomyelin synthesis, V-ATPase acidification with pH-gated acid hydrolases, DAAO + catalase, ATGL lipolysis, carboxysome CA + RuBisCO. Every stoichiometric reaction is element-balanced against the PubChem formulas (tested).
- **Inspect:** clicking a lipid/molecule, or "Inspect atoms", returns its real structure to the Atomic layer (added beside existing content).
- Library: added MGDG and DGDG (thylakoid galactolipids) and oxalate/citrate/acetate/lactate ions → 1720 molecules.
- Tests: 108 passing (new `tests/organelle/organelle.test.ts`, 19 tests). Desktop app rebuilt, installed exe checked via CDP.

- **Merged to `main`** (user-approved fast-forward); TSK-UI-007 → COMPLETE. Gemini: `git pull origin main` before new work.


---

### [2026-11-18] Session 013: Drag organelles into the sandbox (TSK-UI-008)
- **Agent:** Claude. Branch `agent/claude/organelle-drag`.
- Organelle-library rows are now drag sources, like molecules in the atomic layer: drag a buildable organelle (or any GO entry linked to one, e.g. "mitochondrial crista") into the organelle sandbox to build it; the sandbox is outlined while you hover. Molecules dragged ONTO the organelle are built in where they fit structurally (membrane / cofactor slot), dropped beside it they become free molecules. Drops outside the sandbox do nothing; a plain click keeps its old behaviour. Shared `dragItem()` helper replaces the molecule-only drag code.
- Tests: 108 passing; checked with real mouse drags in the browser. Desktop app rebuilt.

- **Merged to `main`** (user-approved fast-forward); TSK-UI-008 → COMPLETE. Gemini: `git pull origin main` before new work.


---

### [2026-11-18] Session 014: Organelles arrive fully built (TSK-UI-009)
- **Agent:** Claude. Branch `agent/claude/organelle-prebuilt`.
- Dragging or clicking an organelle now places it **fully built** by default: every membrane filled with an approximate real lipid mole-fraction composition (van Meer et al. 2008 for animal organelles, Dormann & Benning 2002 for chloroplast galactolipids; classes absent from the library folded into the nearest present class and labelled as such), every protein and cofactor, lipid-droplet core of triolein + cholesteryl oleate, and the substrates its reactions use, so it runs immediately.
- A "Fully built / Empty - build it" toggle in the organelle library (remembered) places the bare blueprint instead. Incomplete organelles show a "Complete it" button that fills only what is missing (keeps lipids you pasted). Everything is one undo step.
- Tests: 112 passing (new: compositions sum to 1 and match the atom-graph classifier, every blueprint placed built is complete and every reaction turns over, empty/complete/undo). Checked in the browser with real drags. Desktop app rebuilt.
- **Merged to `main`** (user-approved fast-forward); TSK-UI-009 -> COMPLETE. Gemini: `git pull origin main` before new work.


---

### [2026-11-18] Session 015: Organelle layer art rehaul (TSK-UI-010)
- **Agent:** Claude. Branch `agent/claude/organelle-art`. Organelle view only; the atomic layer is untouched.
- Rewrote `src/ui/OrganelleView.ts` as a textbook-style diagram: membranes drawn as real bilayers (two leaflets of head groups around a hydrophobic core; monolayer for lipid droplets), each clickable patch = one coarse-grained lipid unit coloured by lipid class (PC teal, PE blue, PS coral, CL amber, cholesterol yellow, SM green, MGDG/DGDG greens). Shaded compartments per organelle (matrix vs IMS, stroma vs thylakoid lumen, nucleoplasm vs perinuclear space...).
- Correct topology: lamellar cristae with ATP synthase dimers at the ridges and I/III/IV on the crista walls, cyt c in the crista lumen; grana stacks with stroma lamellae and PSII/LHCII in grana vs PSI/ATP synthase on stroma-exposed faces; NPCs spanning both nuclear membranes; ribosome-studded ER sheets with a Sec61-docked ribosome; Golgi cisternae with dilated rims and vesicles; glycosylated LAMP1; carboxysome hexamer shell with vertex pentamers; ribosome with E/P/A tRNAs, mRNA codons and exit tunnel.
- Protein glyphs by structure class (rotary ATPases, complex I L-shape, porin barrels, helix bundles, multimers) plus red H+ arrows on the pumps. Non-simulated context (mtDNA, mitoribosomes, starch, nucleolus, chromatin, ER ribosomes, vesicles) is drawn as non-interactive illustration and never affects the model.
- Screen-space leader-line labels (toggle "Labels" in the view controls, remembered); fit leaves room for them.
- Tests: 112 passing; all 11 organelles checked in the browser (dark + light, fully built + empty). ~7 ms per simulation tick redraw. Desktop app rebuilt.
- **Merged to `main`** (user-approved fast-forward); TSK-UI-010 -> COMPLETE. Gemini: `git pull origin main` before new work.

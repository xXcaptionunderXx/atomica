# ATOMICA: Multi-Agent Workflow & Collaboration Research

> **Synchronization Protocols, Conflict Resolution, GitHub Integration, and CI/CD Verification**
> **Deliverable:** `research/MULTI_AGENT_WORKFLOW_RESEARCH.md` | **Lead Researcher:** `agent/claude`

---

## 1. Multi-Agent Development Dynamics

Developing a complex, multi-tiered scientific codebase using independent AI coding agents (Claude and Gemini) requires treating the GitHub repository as an immutable ledger and authoritative shared state:

### 1.1 The Ephemeral Context Problem
- Individual AI chat sessions are memoryless across boundaries.
- No agent may assume that prior verbal intentions or uncommitted reasoning are known to any other agent.
- Every architectural change, module boundary, bug fix, or scientific parameter must be committed directly to version control.

### 1.2 Role Specialization & Checks-and-Balances
- **Lead Architect (Claude):** Sets structural standards, monitors contract integrity in `API_CONTRACTS.md`, merges pull requests, and runs end-to-end integration tests.
- **Scientific Specialist (Gemini):** Audits physical and biochemical validity, implements core computational algorithms, and critically counter-audits architectural choices.
- **Mutual Peer Review:** No major PR may merge into `main` without documented verification against the review criteria in Section 17.8.

---

## 2. GitHub Automation & Branching Protocols

### 2.1 Branch Protection Rules
- Branch `main` is protected: requires CI status checks to pass and PR review documentation.
- Feature branches adhere strictly to: `agent/<agent-name>/<feature-description>`
  - Examples: `agent/gemini/vsepr-solver`, `agent/claude/render-lod-pipeline`

### 2.2 Agent Commit Discipline
Commit messages must identify the authoring agent and reference the corresponding task ID:
```
[agent/gemini] feat(vsepr): implement steric number 4 tetrahedral angle solver (TSK-P0-004)

- Solves ideal bond angles for CH4, NH3, H2O accounting for lone-pair repulsion
- Adds unit tests against NIST reference geometries
- Updates API_CONTRACTS.md with VSEPRContext schema
```

### 2.3 Automated GitHub Actions CI Suite
Automated checks trigger on push and pull requests:
1. `validate-project-management`: Checks that all 10 core markdown files exist and task statuses are synchronized.
2. `lint-and-typecheck`: Enforces zero TypeScript errors and strict typing rules.
3. `scientific-unit-tests`: Runs Vitest with numerical tolerance assertions against NIST/PubChem reference tables.

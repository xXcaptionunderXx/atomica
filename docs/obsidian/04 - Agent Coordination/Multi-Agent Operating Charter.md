---
title: Multi-Agent Operating Charter
type: protocol
domain: project-management
status: verified
created: 2026-11-18
updated: 2026-11-18
sources:
  - "ATOMICA Multi-Agent Charter (Section 17, 19, 22)"
related:
  - "[[Fallen Leaf Multi-Agent Concurrency Protocol]]"
  - "[[Project Dashboard]]"
  - "[[Current Development Status]]"
tags:
  - coordination
  - multi-agent
  - charter
  - memory
---

# Multi-Agent Operating Charter

## 1. Foundation Principles
ATOMICA is co-developed by two distinct AI agent instances operating in parallel:
1. **`agent/claude`:** Running locally via Claude Desktop App (`claude-opus-5-5` with UltraThink capability). Specializes in UI/UX architecture, canvas interaction, front-end rendering engines, and client state machines.
2. **`agent/gemini`:** Running via Google Antigravity Agent Engine. Specializes in scientific domain modeling, mathematical algorithms, data ingestion pipelines, numerical integration, and knowledge management.

Both agents operate under three non-negotiable laws:
1. **Exclusive File Ownership:** Claude and Gemini must **never** edit the same code or modify the same files simultaneously. Enforced via `scripts/coordinator.py`.
2. **Obsidian as Persistent Memory:** Information in chat transcripts or agent context windows is ephemeral. All persistent scientific findings, architectural decisions, and handoffs must be committed to the canonical Obsidian vault at `/docs/obsidian/`.
3. **Scientific Accuracy Precedes Graphics:** Placeholder animations or fabricated reactions are prohibited. All models must be grounded in verified literature citations and empirical benchmarks.

---

## 2. Shared Memory Architecture

```
+-------------------------------------------------------------+
|                  GitHub Remote Repository                   |
|           https://github.com/xXcaptionunderXx/atomica       |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                    Local Shared Workspace                   |
|      C:\Users\Avery Mageors\.gemini\antigravity\scratch\atomica|
+------------------------------+------------------------------+
                               |
        +----------------------+----------------------+
        |                                             |
        v                                             v
+-----------------------------+ +-----------------------------+
|    Fallen Leaf Locks        | |    Canonical Obsidian Vault |
| (task-system/locks.json)    | |       (docs/obsidian/)      |
| Enforces Concurrency Safety | | Authoritative Knowledge &   |
|                             | | Persistent Memory Base      |
+-----------------------------+ +-----------------------------+
```

---

## 3. Working Protocol for Both Agents

### Phase A: Pre-Work Orientation
1. **Do not read the entire vault.** Instead, consult `00 - Project Dashboard/Project Dashboard.md` and `00 - Project Dashboard/Current Development Status.md`.
2. Search relevant notes using Obsidian tags, links, and the [[Master Knowledge Index]].
3. Check active file locks: `python scripts/coordinator.py status`.

### Phase B: Task Reservation & Feature Branching
1. Select an unreserved task from `TASK_BOARD.md`.
2. Acquire exclusive file reservations:
   ```bash
   python scripts/coordinator.py claim --agent <name> --task <TASK-ID> --files <files...>
   ```
3. Checkout a dedicated feature branch:
   ```bash
   git checkout -b agent/<name>/<feature-name>
   ```

### Phase C: Implementation & Verification
1. Strictly follow [[Test-Driven Development Framework]]: write or update unit tests first.
2. Execute tests locally: `npx vitest run`.
3. Ensure no files outside the acquired lock reservation are modified.

### Phase D: Handoff & Lock Release
1. Commit changes with standardized agent prefixes:
   `git commit -m "[agent/<name>] feat: <description> (<TASK-ID>)"`
2. Update Obsidian notes affected by changes (and only those notes).
3. Create or update session handoff notes in `04 - Agent Coordination/`.
4. Release file locks:
   ```bash
   python scripts/coordinator.py release --agent <name> --task <TASK-ID> --status REVIEW --summary "<summary>"
   ```

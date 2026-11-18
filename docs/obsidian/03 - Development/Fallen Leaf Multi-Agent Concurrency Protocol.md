---
title: Fallen Leaf Multi-Agent Concurrency Protocol
type: development-guide
domain: project-management
status: verified
created: 2026-11-18
updated: 2026-11-18
sources:
  - "ATOMICA Multi-Agent Charter (Section 22)"
  - "Fallen Leaf Architecture Specification"
related:
  - "[[Multi-Agent Operating Charter]]"
  - "[[Project Dashboard]]"
  - "[[Current Development Status]]"
tags:
  - development
  - fallen-leaf
  - multi-agent
  - concurrency
---

# Fallen Leaf Multi-Agent Concurrency Protocol

## 1. Core Principle
> **Claude and Gemini must NEVER work on the same code or modify the same files simultaneously.**

In multi-agent autonomous engineering environments, uncoordinated simultaneous edits produce destructive race conditions, merge conflicts, overwritten logic, and context fragmentation. The Fallen Leaf protocol eliminates these issues through **centralized task coordination and atomic file locking** backed by Git branch isolation.

---

## 2. Central Coordinator Architecture
The centralized coordinator (`scripts/coordinator.py`) acts as the authoritative gatekeeper for all file reservations and agent states.

```
                     +----------------------------------+
                     |    Fallen Leaf Coordinator       |
                     |     (scripts/coordinator.py)     |
                     +-----------------+----------------+
                                       |
                     +-----------------v----------------+
                     |       Atomic Lock Registry       |
                     |  (task-system/locks.json)        |
                     +-----------------+----------------+
                                       |
                 +---------------------+---------------------+
                 |                                           |
+----------------v----------------+         +----------------v----------------+
|          agent/claude           |         |          agent/gemini           |
| (Claude Desktop / Local Opus)   |         |      (Antigravity Engine)       |
| Active: TSK-UI-001 (2D Sandbox) |         | Active: TSK-DOC-002, TSK-ENG-003|
+---------------------------------+         +---------------------------------+
```

---

## 3. Atomic Lock Registry Specification (`locks.json`)
Lock reservations are recorded in `project-management/task-system/locks.json` with microsecond-resolution ISO 8601 timestamps and a default 12-hour expiration lease:

```json
{
  "version": "1.0.0",
  "locks": {
    "src/chemistry/elements.ts": {
      "agent": "claude",
      "taskId": "TSK-UI-001",
      "acquiredAt": "2026-11-18T20:54:56.741846+00:00",
      "expiresAt": "2026-11-19T08:54:56.741854+00:00"
    }
  },
  "tasks": {
    "TSK-UI-001": {
      "agent": "claude",
      "status": "IN_PROGRESS",
      "files": ["src/chemistry/elements.ts", "src/sandbox"],
      "claimedAt": "2026-11-18T20:54:56.741846+00:00"
    }
  }
}
```

---

## 4. Agent CLI Commands

### 1. Check Status and Active Locks
```bash
python scripts/coordinator.py status
python scripts/coordinator.py list-locks
python scripts/coordinator.py check --file <filepath>
```

### 2. Claim Exclusive Task and File Reservation
Before editing or creating any file, the agent must acquire the lock:
```bash
python scripts/coordinator.py claim --agent <claude|gemini> --task <TASK-ID> --files <path1> <path2> ...
```
- If granted: Files are reserved exclusively for the agent; task moves to `IN_PROGRESS`.
- If rejected: The coordinator returns an exit code 1 with the conflicting files and holding agent. **The agent must immediately abort and choose another unreserved task.**

### 3. Scope Expansion
If an agent realizes during implementation that it needs to modify an additional file (e.g., a shared type definition):
```bash
python scripts/coordinator.py claim --agent <claude|gemini> --task <TASK-ID> --files <existing_files> <new_file>
```
If the lock cannot be granted, the agent must **not** edit the file.

### 4. Release Task and Handoff
Upon completing implementation and verifying all unit tests pass:
```bash
python scripts/coordinator.py release --agent <claude|gemini> --task <TASK-ID> --status REVIEW --summary "<details>"
```

---

## 5. Branch Hygiene Rules
1. Every task is implemented on an isolated agent feature branch: `agent/<name>/<feature-slug>`.
2. Agents never commit directly to `main` without peer review or automated validation.
3. Git commit messages must begin with the standardized agent identifier: `[agent/claude]` or `[agent/gemini]`.

# ATOMICA: Fallen Leaf Task Coordinator Rules

> **Mandatory protocol for exclusive task assignment, file locking, and multi-agent concurrency prevention.**
> **Governing Section:** Section 22 of ATOMICA Charter.

---

## 1. Absolute Cardinal Rule

> **Claude and Gemini must NEVER work on the same code or modify the same files simultaneously.**

No agent may edit any file without first acquiring an exclusive file lock through the centralized coordinator (`scripts/coordinator.py`).

---

## 2. The Task Claiming Procedure

Before writing, editing, or deleting any file:
1. Identify an available task in `project-management/task-system/TASK_BOARD.md`.
2. Determine the exact list of files and directory scopes required.
3. Run the atomic lock reservation command:
   ```bash
   python scripts/coordinator.py claim --agent <claude|gemini> --task <TASK-ID> --files <path1> <path2>...
   ```
4. If approved: The task moves to `IN_PROGRESS` and files are marked `LOCKED` in `FILE_OWNERSHIP.md`.
5. If rejected: Conflicting files and the holding agent are displayed. The claiming agent **must abort or wait**. Never edit a conflicting file.

---

## 3. Directory vs. File Scopes
- When locking a directory (e.g. `src/chemistry/`), all nested files within that directory are exclusively reserved.
- No other agent may touch any file within that reserved directory scope until released.
- Keep reservations as granular as practical to maximize parallel work on independent subsystems.

---

## 4. Scope Expansion Protocol (Section 22.10)
If during implementation you realize you need to edit an additional file (even a minor type or config):
1. **Stop immediately.**
2. Run `python scripts/coordinator.py claim` including the new file.
3. If granted, proceed.
4. If the file is locked by the other agent, wait or request a handoff. **Never silently edit unreserved files.**

---

## 5. Task Release & Handoff Protocol (Section 22.9 & 22.11)
When your task is complete or handed off:
1. Verify all unit tests and scientific validation criteria pass.
2. Commit your changes to your feature branch (`agent/<name>/<feature>`).
3. Release the file locks:
   ```bash
   python scripts/coordinator.py release --agent <claude|gemini> --task <TASK-ID> --status REVIEW --summary "<details>"
   ```
4. Update `HANDOFFS.md` with instructions for the reviewing/integrating agent.

---

## 6. Desktop App: Keep the User's Shortcut Current (MANDATORY, both agents)

The user launches ATOMICA from a Desktop shortcut (`ATOMICA Sandbox.lnk`) that points at the fixed path
`release/win-unpacked/ATOMICA Sandbox.exe` in this repo. The user never replaces it by hand. Therefore:

1. **After ANY change that affects the app** (`src/`, `index.html`, `electron/`, `vite.config.ts`, `package.json`),
   once tests pass and before releasing your task lock, rebuild the app in place:
   ```powershell
   Stop-Process -Name "ATOMICA Sandbox" -Force -ErrorAction SilentlyContinue   # a running app blocks the rebuild
   npm run app:build
   ```
2. **Then verify the shortcut still works:** `powershell -ExecutionPolicy Bypass -File scripts/install-desktop-shortcut.ps1`
   (idempotent: recreates the shortcut if missing and fails loudly if the build is missing).
3. Build from the branch that holds the newest app work, so the shortcut never regresses to older code.
4. Never change the output path or exe name (`release/win-unpacked/ATOMICA Sandbox.exe`, portable copy `release/ATOMICA-Sandbox.exe`)
   without updating the script and re-running it.
5. Mention in your hand-off summary that the desktop app was rebuilt.

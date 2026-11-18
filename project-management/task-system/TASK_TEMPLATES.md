# ATOMICA: Standardized Task Templates

When proposing or registering a new engineering task, use the following structure:

```markdown
### Task Specification: [TASK-ID] — [Descriptive Title]

1. **Metadata:**
   - **Assigned Agent:** `agent/claude` | `agent/gemini`
   - **Priority:** `P0` (Critical) | `P1` (High) | `P2` (Normal)
   - **Target Subsystem:** (e.g. `@atomica/chemistry`, `@atomica/anatomy`)
   - **Dependencies:** (List preceding task IDs or "None")

2. **Exclusive File Reservations:**
   - `src/exact/file/path1.ts`
   - `src/exact/file/path2.ts`
   - `tests/exact/test/path.test.ts`

3. **Scientific & Functional Acceptance Criteria:**
   - [ ] Concrete functional deliverable 1
   - [ ] Concrete mathematical or data criterion 2
   - [ ] Unit tests pass with 100% assertions
   - [ ] Validated against reference benchmark cases

4. **Limitations & Approximations:**
   - [Explicitly declare any assumptions or modeling limitations]
```

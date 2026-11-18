# ATOMICA: Task Dependency Graph

```mermaid
flowchart TD
    TSK001["TSK-ENG-001 (Gemini)<br>PubChem & PDB Ingestion"]
    TSK002["TSK-ENG-002 (Claude)<br>Organism-to-Atom Hierarchy"]
    TSK003["TSK-ENG-003 (Gemini)<br>Chemical Graph & VSEPR"]
    TSK004["TSK-ENG-004 (Claude)<br>3D Viewport & Mol* Adapter"]
    TSK005["TSK-ENG-005 (Gemini)<br>Stochastic Gillespie Kinetics"]
    TSK006["TSK-ENG-006 (Claude)<br>Rapier Sandbox Physics"]
    TSK007["TSK-ENG-007 (Gemini)<br>cellPACK Mesoscale Assembler"]

    TSK001 --> TSK003
    TSK001 --> TSK007
    TSK002 --> TSK004
    TSK004 --> TSK007
    TSK003 --> TSK005
    TSK006 --> TSK005
```

---

## Parallel Execution Plan
1. **Track A (Gemini):**
   - Owns `src/chemistry/` and `src/proteins/` (`TSK-ENG-001`).
   - Fetches and parses real molecular datasets (Creatine, Glucose, Spike protein).
2. **Track B (Claude):**
   - Owns `src/anatomy/` and `src/visualization/` (`TSK-ENG-002`, `TSK-ENG-004`).
   - Builds the zoom navigation tree and Three.js / Mol* viewport.
3. **Zero Concurrency Overlap:**
   - Neither agent touches the other's directories or files.
   - Integration occurs through documented schemas in `project-management/API_CONTRACTS.md`.

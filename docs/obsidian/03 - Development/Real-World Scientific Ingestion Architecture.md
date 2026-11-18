---
title: Real-World Scientific Ingestion Architecture
type: development-guide
domain: architecture/engineering
status: verified
created: 2026-11-18
updated: 2026-11-18
sources:
  - "NCBI PubChem PUG-REST Specification"
  - "RCSB Protein Data Bank File Format Specification"
related:
  - "[[Protein Structure Prediction]]"
  - "[[Covalent and Ionic Bonding]]"
  - "[[Open-Source Scientific Software and Data Stack]]"
tags:
  - development
  - pubchem
  - pdb
  - data-ingestion
---

# Real-World Scientific Ingestion Architecture

## 1. Architectural Mandate
In accordance with Section 23 of the ATOMICA Charter and user guidance, ATOMICA does **not** hand-code or synthesize artificial molecular structures from scratch. Instead, the engine dynamically ingests verified, empirically determined 2D/3D atomic coordinates from authoritative open scientific repositories:
- **PubChem (NIH / NLM):** For small molecules, metabolites, ions, and compounds.
- **Protein Data Bank (RCSB PDB):** For proteins, nucleic acids, viral capsids, and macromolecular complexes.

---

## 2. Ingestion Pipeline Overview

```
+------------------------+                     +------------------------+
|   PubChem PUG-REST     |                     |    RCSB PDB Server     |
| (Small Molecules/CIDs) |                     | (Macromolecular / PDB) |
+-----------+------------+                     +-----------+------------+
            | HTTP GET                                     | HTTP GET
            v                                              v
+------------------------+                     +------------------------+
|  src/chemistry/        |                     |  src/proteins/         |
|  PubChemClient.ts      |                     |  PdbClient.ts          |
+-----------+------------+                     +-----------+------------+
            | Normalized Graph                             | Typed 3D Coordinates
            +---------------------+  +---------------------+
                                  |  |
                                  v  v
                      +---------------------------+
                      | ATOMICA Unified Domain    |
                      | Molecule & Complex Models |
                      +-------------+-------------+
                                    |
            +-----------------------+-----------------------+
            |                                               |
            v                                               v
+-----------------------+                       +-----------------------+
|  2D Molecule Sandbox  |                       |  3D Viewport (Mol*)   |
|   (src/sandbox/)      |                       |  (src/visualization/) |
+-----------------------+                       +-----------------------+
```

---

## 3. Client Specifications

### 1. PubChem PUG-REST Client (`src/chemistry/PubChemClient.ts`)
- **Endpoint:** `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/JSON`
- **Normalized Data Extracted:**
  - `atoms`: Element symbols from atomic numbers $Z$, formal charges ($q$).
  - `coordinates`: 2D/3D $(x, y, z)$ spatial vectors in Ångströms.
  - `bonds`: Atom index pairs $(i, j)$ and standard bond orders ($1, 2, 3$).
- **Canonical Golden Molecules Verified:**
  - Water ($\text{H}_2\text{O}$): CID 962 (3 atoms, 2 single bonds).
  - Creatine ($\text{C}_4\text{H}_9\text{N}_3\text{O}_2$): CID 586 (18 atoms, 17 bonds).
  - D-Glucose ($\text{C}_6\text{H}_{12}\text{O}_6$): CID 5793 (24 atoms, 24 bonds).

### 2. Protein Data Bank Client (`src/proteins/PdbClient.ts`)
- **Endpoint:** `https://files.rcsb.org/download/{id}.pdb`
- **Record Parsing (`PdbParser.ts`):**
  - Parses standard 80-column fixed-width text records (`ATOM`, `HETATM`, `TER`, `END`).
  - Columns parsed: Atom serial number (cols 7-11), atom name (cols 13-16), residue name (cols 18-20), chain ID (col 22), residue sequence number (cols 23-26), orthogonal coordinates $(x, y, z)$ in Ångströms (cols 31-54), occupancy (cols 55-60), and temperature B-factor (cols 61-66).
- **Canonical Structures Verified:**
  - Crambin: PDB ID `1CRN` (46 residues, 327 heavy atoms, plant seed thionin).
  - SARS-CoV-2 Spike RBD / Human ACE2 Complex: PDB ID `6M0J`.

---

## 4. Error Handling and Rate Limiting
- **PubChem Rate Limits:** NCBI PUG-REST limits requests to no more than 5 requests per second and 400 requests per minute. The client uses an exponential backoff retry mechanism with a local memory cache to prevent duplicate requests.
- **Network Resilience:** Offline fallback fixtures (`fixtures/creatine.json`, `fixtures/1crn.pdb`) ensure all automated CI pipelines and offline development environments execute with 100% determinism.

---

## 5. Verification Suite
All ingestion logic is verified through Vitest integration tests:
- `tests/chemistry/pubchem.test.ts`
- Tests run via: `npx vitest run tests/chemistry/pubchem.test.ts`

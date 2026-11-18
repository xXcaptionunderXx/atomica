---
title: Open-Source Scientific Software and Data Stack
type: resource-guide
domain: technology/libraries
status: verified
created: 2026-11-18
updated: 2026-11-18
sources:
  - "NCBI PubChem API Documentation"
  - "RCSB Protein Data Bank API Specifications"
  - "Mol* / Three.js / Rapier Documentation"
  - "Z-Anatomy Open Project (CC-BY-SA)"
related:
  - "[[Real-World Scientific Ingestion Architecture]]"
  - "[[Mesoscale Modeling and Biological Assembly]]"
  - "[[Protein Structure Prediction]]"
tags:
  - resources
  - libraries
  - open-source
  - apis
---

# Open-Source Scientific Software and Data Stack

## 1. Architectural Strategy
ATOMICA maximizes scientific fidelity, performance, and engineering velocity by building upon battle-tested, peer-reviewed open-source scientific software, public databases, and rendering libraries.

---

## 2. Scientific Data Ingestion Stack

| Library / Source | Primary Domain | License | Role in ATOMICA | Integration Status |
| :--- | :--- | :---: | :--- | :---: |
| **PubChem PUG-REST** | Small molecules & chemistry | Public Domain (US Govt) | Source of 2D/3D atomic coordinates, bond orders, formal charges, and CIDs for over 100M chemical structures. | `INTEGRATED` (`PubChemClient.ts`) |
| **RCSB PDB** | Macromolecular crystallography | CC0 1.0 Public Domain | Source of high-resolution experimental structures for proteins, nucleic acids, and viruses (PDB / mmCIF). | `INTEGRATED` (`PdbClient.ts`) |
| **Z-Anatomy** | Macroscopic human anatomy | CC-BY-SA 4.0 | Atlas of open 3D anatomical meshes (bones, muscles, organs, vascular networks) for organ/system hierarchy. | `EVALUATED` (LOD 1-3) |
| **cellPACK** (Scripps) | Mesoscale crowding & packing | GPL / BSD-compatible | Recipe-driven macromolecular packing into crowded organelles and cellular envelopes. | `EVALUATED` (LOD 5-6) |
| **MesoCraft** (KAUST) | Nanoscale biological assembly | Open Academic | High-level viral particle and cellular landscape modeling templates (HIV, SARS-CoV-2). | `EVALUATED` (LOD 5-6) |

---

## 3. Core Engine & Rendering Stack

| Library | Domain | License | ATOMICA Architecture Role |
| :--- | :--- | :---: | :--- |
| **HTML5 Canvas 2D** | Interactive 2D UI | W3C Standard | Primary presentation layer for the interactive 2D Molecule Builder Sandbox (`TSK-UI-001`). Ultra-fast, lightweight, zero WebGL initialization overhead. |
| **Mol\*** (`molstar`) | Macromolecular 3D View | MIT | Comprehensive WebGL molecular viewer powering secondary structure cartoons, ribbon models, surface solvent accessibility, and atomic ball-and-stick representations. (*Paused until 2D sandbox completes*). |
| **Three.js** | 3D Scene Management | MIT | Underlying 3D scene graph, camera controls, lighting look-dev, and macro-anatomical mesh rendering. (*Paused*). |
| **Rapier Physics** (`@dimforge/rapier2d` / `3d`) | Rigid Body Simulation | Apache-2.0 / MIT | WebAssembly-accelerated physics engine for macroscopic laboratory apparatus, fluid containers, and bounding vessel collisions. |
| **Vitest** | Testing & Validation | MIT | High-speed unit test runner verifying chemical invariants, numerical convergence, and parser fidelity. |

---

## 4. API Endpoints & Transport Details

### PubChem PUG-REST
- **Base URL:** `https://pubchem.ncbi.nlm.nih.gov/rest/pug`
- **Compound JSON:** `/compound/cid/{cid}/JSON`
- **3D SDF Coordinates:** `/compound/cid/{cid}/SDF?record_type=3d`
- **Rate Limit Policy:** Max 5 requests/sec, 400 requests/min. Local in-memory caching implemented.

### RCSB PDB Direct Downloads
- **Base URL:** `https://files.rcsb.org/download`
- **PDB Text Format:** `/{id}.pdb` (e.g., `https://files.rcsb.org/download/1CRN.pdb`)
- **mmCIF Modern Format:** `/{id}.cif`
- **CORS Support:** Native HTTP GET with permissive `Access-Control-Allow-Origin: *`.

---

## 5. Multi-Scale Representation Mapping

$$\begin{array}{c|c|c}
\textbf{Scale / Level} & \textbf{Data Sourcing} & \textbf{Visual Representation} \\
\hline
\text{Organism / Organ} & \text{Z-Anatomy Open Mesh} & \text{3D Surface Polygons (Three.js)} \\
\text{Tissue / Cell} & \text{Histology / Cryo-ET} & \text{Volumetric / Sliced Microscopy} \\
\text{Organelle / Virion} & \text{cellPACK / MesoCraft} & \text{Packed Macromolecular Ensembles} \\
\text{Macromolecule} & \text{RCSB PDB / AlphaFold} & \text{Mol* Cartoon, Ribbons, Coarse Surface} \\
\text{Small Molecule} & \text{PubChem PUG-REST} & \text{2D Canvas / Ball-and-Stick Bonds} \\
\text{Atom / Subatomic} & \text{NIST Atomic Spectra} & \text{Electron Shell Orbitals / Nucleus}
\end{array}$$

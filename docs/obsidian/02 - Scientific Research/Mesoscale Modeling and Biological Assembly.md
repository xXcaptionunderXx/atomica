---
title: Mesoscale Modeling and Biological Assembly
type: scientific-reference
domain: biophysics/structural-biology
status: verified
created: 2026-11-18
updated: 2026-11-18
sources:
  - "Johnson, G. T. et al. (2015). cellPACK: a virtual mesoscope to model and visualize structural systems biology. Nature Methods, 12(1), 85–91."
  - "KAUST Nanovisualization Group. MesoCraft: Interactive Mesoscale Modeling. mesocraft.kaust.edu.sa."
  - "Goodsell, D. S. (1991). Inside a living cell. Trends in Biochemical Sciences, 16(6), 203–206."
related:
  - "[[Protein Structure Prediction]]"
  - "[[Molecular Dynamics and Force Fields]]"
  - "[[Cell Membrane Transport and Osmosis]]"
  - "[[Open-Source Scientific Software and Data Stack]]"
tags:
  - science/mesoscale
  - cellpack
  - mesocraft
  - crowding
  - assembly
---

# Mesoscale Modeling and Biological Assembly

## 1. Concise Explanation
Mesoscale modeling bridges the spatial gap between atomistic molecular structures ($0.1\text{ to }10\text{ nm}$) and macroscopic cellular anatomy ($100\text{ nm to }10\text{ }\mu\text{m}$). It reconstructs crowded intracellular environments, multi-protein complexes, and entire viral particles (e.g., HIV, SARS-CoV-2) by stochastically packing thousands of real macromolecular structures into lipid membrane boundaries based on empirical biochemical recipes.

---

## 2. Established Scientific Findings
- **Dense Macromolecular Crowding:** Living cytoplasm is not a dilute aqueous solution. Solute macromolecules occupy $20\%\text{ to }40\%$ of total intracellular volume. This creates severe excluded-volume effects, dramatically increases effective local chemical activity, restricts Brownian diffusion, and stabilizes compact folded states.
- **cellPACK (Scripps Research Institute):** An established computational packing engine that populates complex 3D cellular geometries with high-resolution PDB protein structures using stochastic collision grids, bounding sphere trees, and gradient-driven surface orientation.
- **MesoCraft (KAUST):** A state-of-the-art interactive modeling tool designed specifically to assemble complete nanoscale biological structures (such as intact virions with lipid envelopes, membrane proteins, matrix layers, and RNA cores) using modular, real-world structural components.
- **ATOMICA Multi-Scale Zoom Continuum:** Rather than stopping at the cellular membrane (like anatomy apps such as BioDigital Human) or starting at isolated individual proteins (like PyMOL or ChimeraX), ATOMICA connects the entire ladder:
  $$\text{Organism} \longrightarrow \text{Organ} \longrightarrow \text{Tissue} \longrightarrow \text{Cell} \longrightarrow \text{Organelle} \longrightarrow \text{Complex (MesoCraft/cellPACK)} \longrightarrow \text{Molecule (PDB)} \longrightarrow \text{Atom}$$

---

## 3. Relevant Equations and Assumptions

### Fractional Volume Occupancy ($\Phi_{\text{crowd}}$)
$$\Phi_{\text{crowd}} = \sum_{k=1}^K \frac{N_k V_k}{V_{\text{compartment}}} \approx 0.20\text{ to }0.40$$
Where $N_k$ is the integer copy number of macromolecule type $k$, and $V_k$ is its hydrated van der Waals volume.

### Hindered Brownian Diffusion Under Crowding
Macromolecular crowding reduces the effective translational diffusion coefficient $D_{\text{eff}}$ according to Doolittle's free-volume formulation:
$$\frac{D_{\text{eff}}}{D_0} \approx \exp\left( -\alpha \Phi_{\text{crowd}}^\beta \right)$$
Where $D_0 = \frac{k_B T}{6\pi \eta r_H}$ is the Stokes-Einstein dilute diffusion limit, and $\alpha, \beta$ are crowding fit exponents.

### Collision Detection via Hierarchical Sphere Trees
To prevent steric overlap during recipe packing, each protein $A$ at position $\mathbf{r}_A$ with orientation matrix $\mathbf{R}_A$ and bounding sphere radius $R_A$ must satisfy:
$$\|\mathbf{r}_A - \mathbf{r}_B\| \ge R_A + R_B + d_{\text{buffer}} \quad \forall B \ne A$$
Sub-sphere hierarchies are queried recursively when bounding envelopes overlap.

---

## 4. Primary Sources
1. **cellPACK Virtual Mesoscope:** Johnson, G. T. et al. (2015). *cellPACK: a virtual mesoscope to model and visualize structural systems biology*. Nature Methods, 12(1), 85–91. [DOI: 10.1038/nmeth.3204](https://doi.org/10.1038/nmeth.3204)
2. **MesoCraft Platform:** KAUST Nanovisualization Research Group. *MesoCraft: Constructing Multiscale Biological Models*. [https://mesocraft.kaust.edu.sa](https://mesocraft.kaust.edu.sa)
3. **Macromolecular Crowding Principles:** Goodsell, D. S. (1991). *Inside a living cell*. Trends in Biochemical Sciences, 16(6), 203–206. [DOI: 10.1016/0968-0004(91)90083-8](https://doi.org/10.1016/0968-0004(91)90083-8)

---

## 5. Confidence and Limitations
- **High Confidence:** Equilibrium geometric packing, static envelope structures, and stoichiometry of intact viral particles (SARS-CoV-2, HIV, T4 bacteriophage).
- **Limitations:**
  - Dynamic envelope deformation, membrane fusion, and viral budding cannot be simulated in real-time at atomic resolution; they are represented via coarse-grained state transitions.
  - Recipe concentrations vary widely across cell types and developmental states; default recipes use consensus mammalian lymphocyte datasets.

---

## 6. Related Obsidian Links
- [[Protein Structure Prediction]] — Atomic coordinate sourcing from RCSB PDB for packing units.
- [[Molecular Dynamics and Force Fields]] — Classical atomic-scale force evaluations.
- [[Cell Membrane Transport and Osmosis]] — Lipid bilayer boundary constraints for mesoscale compartments.
- [[Open-Source Scientific Software and Data Stack]] — Integration specifications for cellPACK, MesoCraft, and Mol*.

---

## 7. Relevant ATOMICA Implementation Paths
- `src/mesoscale/CellPackAssembler.ts` — Recipe parser and collision-free grid packing engine (`TSK-ENG-007`).
- `src/anatomy/HierarchyTree.ts` — Connects the Organelle level directly to packed multi-protein Complexes.
- `src/visualization/MolstarAdapter.ts` — Instanced macromolecular rendering of packed complexes.

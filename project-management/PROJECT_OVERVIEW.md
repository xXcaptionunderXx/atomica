# ATOMICA: Project Overview & Vision Specification

> **Authoritative Specification Document for Multi-Agent Collaboration**

---

## 1. Executive Summary

**ATOMICA** is a full-scale, interactive scientific simulation workstation designed to model physical reality across biological and chemical scales. The system enables users to begin at the subatomic scale—manipulating quarks, protons, neutrons, and electrons to form atoms—and progressively scale upward to synthesize molecules, fold proteins, build living cells, connect organ systems, and model complex organismal immunology.

The design philosophy prioritizes **strict scientific rigor over superficial visual animations**. Every reaction, bond angle, folding step, and cellular flux must be governed by mathematical equations, verified thermodynamic constants, or established computational approximations.

---

## 2. Core Pillars

### Pillar I: Subatomic & Chemical Construction
- **Scope:** 118 Elements, isotopic abundances, half-lives, binding energies, Aufbau electron filling, VSEPR 3D geometries, formal charges, covalent/ionic/metallic bonds, resonance structures, and thermodynamic stability.
- **Verification Authority:** NIST WebBook, PubChem, CRC Handbook of Chemistry & Physics.

### Pillar II: Reaction Sandbox & Kinetics
- **Scope:** Mass & charge conservation, stoichiometric balancing, activation energies, Arrhenius rate equations, reversible equilibria ($K_{eq}$), enzyme catalysis (Michaelis-Menten kinetics), and redox potentials.
- **Verification Authority:** IUPAC Gold Book, ChEBI, KEGG Pathways.

### Pillar III: Macromolecular & Biomolecular Engineering
- **Scope:** Amino acid condensation, Ramachandran dihedral constraints, secondary structure propensity, tertiary contact maps (hydrophobic, electrostatic, disulfide), nucleic acid base-pairing, and lipid bilayer self-assembly.
- **Verification Authority:** RCSB Protein Data Bank (PDB), UniProt, Nucleic Acid Database (NDB).

### Pillar IV: Cellular & Systems Physiology
- **Scope:** Organelle compartmentalization, membrane transport (passive diffusion, active ion antiporters), metabolic networks (Glycolysis, TCA, ATP Synthase chemiosmosis), cell division, and tissue architecture.
- **Verification Authority:** BioModels Database, CellML, SBML repository.

### Pillar V: Computational Immunology & Vaccine Discovery
- **Scope:** Antigen processing, MHC-I/II presentation, TCR/BCR somatic hypermutation and affinity maturation, neutralizing antibody binding affinity, cytokine signaling cascades, and memory cell persistence.
- **Verification Authority:** ImmPort, IEDB (Immune Epitope Database), NCBI Immunology.

---

## 3. User Experience & Interface Paradigm

- **Stationery Aesthetic:** Dark, modern, flat 2D scientific workstation reminiscent of PyMOL/Cytoscape/MATLAB, devoid of distracting gamified tropes.
- **Infinite Workstation Canvas:** Vector-based canvas with continuous LOD (Level of Detail), spatial partitioning (Quadtree / Spatial Hashing) supporting >50,000 active particles at 60 FPS.
- **Bi-Directional Search & Construction:** PubChem-backed query system with a single-click "BUILD THIS MOLECULE" feature that instantiates molecular graphs directly in the canvas.
- **Multi-Modal Viewing:** Simultaneous toggle between 2D skeletal formulas, 3D ball-and-stick/space-filling, and realistic solvent-accessible electron density isosurfaces.
- **Scientific Notebook:** Savable, versioned experiments recording initial conditions, reagents, temperature, pressure, reaction trajectories, and analytical charts.

---

## 4. Multi-Agent Development Mandate

Development is carried out jointly by independent AI coding agents communicating via GitHub:
1. **GitHub is the Single Source of Truth:** Conversation logs are ephemeral; only committed repository state is recognized.
2. **Phase 0 Research Gate:** No implementation code may be introduced prior to complete technical discovery, evaluation of scientific libraries, and interface contract specification.
3. **Continuous Verification:** Every commit and PR must be validated by independent code review and automated integration tests.

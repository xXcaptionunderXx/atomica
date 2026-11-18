---
title: Protein Structure Prediction
type: scientific-reference
domain: biochemistry
status: verified
created: 2026-11-18
updated: 2026-11-18
sources:
  - "Jumper, J. et al. (2021). Highly accurate protein structure prediction with AlphaFold. Nature, 596(7873), 583–589."
  - "Berman, H. M. et al. (2000). The Protein Data Bank. Nucleic Acids Research, 28(1), 235–242."
  - "Anfinsen, C. B. (1973). Principles that govern the folding of protein chains. Science, 181(4096), 223–230."
related:
  - "[[Amino Acids and Protein Hierarchical Folding]]"
  - "[[Molecular Docking]]"
  - "[[Molecular Dynamics and Force Fields]]"
  - "[[Open-Source Scientific Software and Data Stack]]"
tags:
  - science/biochemistry
  - proteins
  - alphafold
  - pdb
---

# Protein Structure Prediction

## 1. Concise Explanation
Protein structure prediction determines the 3D atomic coordinates of a protein from its linear sequence of amino acids. While experimental determination (cryo-EM, X-ray crystallography, NMR) stored in the Protein Data Bank (RCSB PDB) provides empirical coordinates, modern deep learning architectures (AlphaFold2, ESMFold) infer folded structures directly from evolutionary co-variance across homologous sequences.

---

## 2. Established Scientific Findings
- **Anfinsen's Thermodynamic Dogma:** Under physiological conditions, the native structure of a small globular protein represents the global minimum of Gibbs free energy ($\Delta G_{\text{folding}} < 0$).
- **Levinthal’s Paradox:** An unbiased, random conformational search would require $10^{52}$ years; proteins fold within milliseconds via localized energy funnels guided by secondary structure nucleation and hydrophobic collapse.
- **Deep Learning Breakthrough:** AlphaFold2 utilizes Evoformer blocks (paired attention on Multiple Sequence Alignments and residue pair representations) and invariant coordinate refinement to achieve atomic accuracy ($\text{RMSD} \le 1.5\text{ \AA}$) comparable to experimental crystallography.
- **Critical Limitation (Structure $\neq$ Function):** AlphaFold predicts a *static native conformation*. It does **not** model dynamic transitions, allosteric shifts, intrinsically disordered regions (IDRs), or emergent biochemical pathways without explicit kinetic parameters.

---

## 3. Relevant Equations and Assumptions

### Root-Mean-Square Deviation (RMSD)
Spatial divergence between predicted coordinates $\mathbf{x}_i$ and experimental target coordinates $\mathbf{y}_i$ across $N$ alpha-carbon ($C_\alpha$) atoms after rigid-body rotational alignment:
$$\text{RMSD} = \sqrt{\frac{1}{N} \sum_{i=1}^N \|\mathbf{x}_i - \mathbf{y}_i\|^2}$$

### Template Modeling Score (TM-score)
Length-independent measure of structural similarity between 0 and 1:
$$\text{TM-score} = \max \left[ \frac{1}{L_{\text{target}}} \sum_{i=1}^{L_{\text{common}}} \frac{1}{1 + \left(\frac{d_i}{d_0(L_{\text{target}})}\right)^2} \right]$$
Where $d_0(L) = 1.24 \sqrt[3]{L - 15} - 1.8$, and $\text{TM-score} > 0.5$ signifies identical fold topology.

### Core Assumptions
1. Single ground-state equilibrium assumption: Co-evolutionary data captures the lowest-energy crystallized state.
2. Solvent is modeled implicitly as physiological saline at $T \approx 300\text{ K}$, $\text{pH} \approx 7.4$.
3. Post-translational modifications (glycosylation, phosphorylation) and cofactor binding are typically absent unless explicitly co-modeled.

---

## 4. Primary Sources
1. **AlphaFold2:** Jumper, J. et al. (2021). *Highly accurate protein structure prediction with AlphaFold*. Nature, 596(7873), 583–589. [DOI: 10.1038/s41586-021-03819-2](https://doi.org/10.1038/s41586-021-03819-2)
2. **Protein Data Bank:** Berman, H. M. et al. (2000). *The Protein Data Bank*. Nucleic Acids Research, 28(1), 235–242. [DOI: 10.1093/nar/28.1.235](https://doi.org/10.1093/nar/28.1.235)
3. **Anfinsen Hypothesis:** Anfinsen, C. B. (1973). *Principles that govern the folding of protein chains*. Science, 181(4096), 223–230.

---

## 5. Confidence and Limitations
- **High Confidence ($\text{pLDDT} \ge 90$):** Well-conserved enzymatic cores, rigid globular folds, alpha-helices, and beta-sheets.
- **Low Confidence ($\text{pLDDT} < 50$):** Flexible loops, terminal tails, intrinsically disordered proteins, and uncharacterized orphan sequences lacking homologous MSA depth.
- **Simulation Mode Rule:** ATOMICA does **not** attempt ab initio protein folding during interactive simulation. Instead, pre-folded structures are ingested from the Protein Data Bank (RCSB PDB), and macromolecular interactions use curated binding rules (e.g., Spike binds ACE2 receptor with $K_D \approx 15\text{ nM}$).

---

## 6. Related Obsidian Links
- [[Amino Acids and Protein Hierarchical Folding]] — Secondary/tertiary backbone dihedrals ($\phi, \psi$).
- [[Molecular Docking]] — Receptor-ligand interface scoring and hand-curated rule bindings.
- [[Molecular Dynamics and Force Fields]] — Classical atomic trajectory integration.
- [[Real-World Scientific Ingestion Architecture]] — Client ingestion pipeline for RCSB PDB records.

---

## 7. Relevant ATOMICA Implementation Paths
- `src/proteins/PdbClient.ts` — Ingestion of real `.pdb` files directly from `https://files.rcsb.org/download/{id}.pdb`.
- `src/proteins/PdbParser.ts` — Coordinate extraction for `ATOM` and `HETATM` records into typed structural models.
- `src/visualization/MolstarAdapter.ts` — High-performance secondary structure cartoon and ribbon visualizer.
- `tests/chemistry/pubchem.test.ts` — Integration test suite verifying structural ingestion of 1CRN (Crambin).

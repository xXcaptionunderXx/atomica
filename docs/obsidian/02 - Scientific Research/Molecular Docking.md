---
title: Molecular Docking
type: scientific-reference
domain: biochemistry
status: verified
created: 2026-11-18
updated: 2026-11-18
sources:
  - "Trott, O., & Olson, A. J. (2010). AutoDock Vina: improving the speed and accuracy of docking. Journal of Computational Chemistry, 31(2), 455–461."
  - "Koshland, D. E. (1958). Application of a Theory of Enzyme Specificity to Protein Synthesis. PNAS, 44(2), 98–104."
  - "Lan, J. et al. (2020). Structure of the SARS-CoV-2 spike receptor-binding domain bound to the ACE2 receptor. Nature, 581(7807), 215–220."
related:
  - "[[Protein Structure Prediction]]"
  - "[[Enzyme Kinetics]]"
  - "[[Adaptive Immunity and Affinity Maturation]]"
  - "[[Real-World Scientific Ingestion Architecture]]"
tags:
  - science/biochemistry
  - docking
  - kinetics
  - receptors
---

# Molecular Docking

## 1. Concise Explanation
Molecular docking models the non-covalent binding of a small molecule (ligand) or protein subunit to a target macromolecular receptor (protein or nucleic acid). It predicts both the optimal 3D spatial orientation (binding pose) and the thermodynamic binding affinity ($\Delta G_{\text{bind}}$).

---

## 2. Established Scientific Findings
- **Evolution of Docking Models:**
  - *Lock-and-Key (Fischer, 1894):* Rigid steric complementarity.
  - *Induced Fit (Koshland, 1958):* Mutual conformational adjustments upon binding.
  - *Conformational Selection (Monod-Wyman-Changeux):* Ligand stabilizes a pre-existing high-affinity conformational state from an ensemble.
- **Empirical Scoring Functions:** Tools like AutoDock Vina approximate free energy through steric terms, hydrophobic contact surfaces, hydrogen bonds, and entropic penalties for frozen rotatable bonds.
- **ATOMICA Simulation Philosophy:** Full real-time ab initio docking across millions of degrees of freedom is computationally impossible in an interactive browser runtime (requiring minutes of Monte Carlo sampling per ligand). Therefore, ATOMICA adopts a **hybrid model**:
  1. Structural geometry is sourced directly from verified co-crystallized complexes in the Protein Data Bank (e.g., SARS-CoV-2 Spike RBD bound to Human ACE2, PDB ID `6M0J`).
  2. Dynamic binding and unbinding kinetics are driven by curated, literature-validated kinetic rate constants ($k_{\text{on}}, k_{\text{off}}$) and thermodynamic dissociation constants ($K_D$).

---

## 3. Relevant Equations and Assumptions

### Thermodynamic Dissociation Constant ($K_D$)
$$R + L \underset{k_{\text{off}}}{\overset{k_{\text{on}}}{\rightleftharpoons}} RL$$
$$K_D = \frac{[R][L]}{[RL]} = \frac{k_{\text{off}}}{k_{\text{on}}}$$
The standard binding free energy relates directly to $K_D$:
$$\Delta G^\circ = R T \ln K_D$$
At $T = 310.15\text{ K}$ ($37^\circ\text{C}$), a 10-fold change in affinity corresponds to $\Delta\Delta G^\circ \approx 5.9\text{ kJ/mol}$ ($1.4\text{ kcal/mol}$).

### Fractional Receptor Occupancy ($Y$)
$$Y = \frac{[L]}{[L] + K_D}$$
When $[L] = K_D$, exactly 50% of receptor sites are occupied at equilibrium.

### AutoDock Vina Empirical Scoring Approximation
$$\Delta G_{\text{score}} = w_{\text{gauss1}} f_{\text{gauss1}}(d) + w_{\text{gauss2}} f_{\text{gauss2}}(d) + w_{\text{rep}} f_{\text{rep}}(d) + w_{\text{hbond}} f_{\text{hbond}}(d) + w_{\text{hydro}} f_{\text{hydro}}(d) + \Delta G_{\text{rot}} N_{\text{rot}}$$

---

## 4. Primary Sources
1. **AutoDock Vina:** Trott, O., & Olson, A. J. (2010). *AutoDock Vina: improving the speed and accuracy of docking with a new scoring function, efficient optimization, and multithreading*. Journal of Computational Chemistry, 31(2), 455–461. [DOI: 10.1002/jcc.21334](https://doi.org/10.1002/jcc.21334)
2. **Induced Fit Model:** Koshland, D. E. (1958). *Application of a Theory of Enzyme Specificity to Protein Synthesis*. PNAS, 44(2), 98–104. [DOI: 10.1073/pnas.44.2.98](https://doi.org/10.1073/pnas.44.2.98)
3. **Spike-ACE2 Complex:** Lan, J. et al. (2020). *Structure of the SARS-CoV-2 spike receptor-binding domain bound to the ACE2 receptor*. Nature, 581(7807), 215–220. [DOI: 10.1038/s41586-020-2180-5](https://doi.org/10.1038/s41586-020-2180-5)

---

## 5. Confidence and Limitations
- **High Confidence:** Experimentally resolved co-crystal structures from RCSB PDB with crystallographic resolution $d < 2.5\text{ \AA}$.
- **Limitations:**
  - Blind virtual screening against unknown targets carries high false-positive rates due to neglected desolvation free energy and water displacement entropy.
  - Interactive gameplay relies on curated biochemical interaction databases rather than runtime physics-based scoring.

---

## 6. Related Obsidian Links
- [[Protein Structure Prediction]] — Structural representations from AlphaFold and PDB.
- [[Enzyme Kinetics]] — Transition-state binding and substrate turnover rates.
- [[Adaptive Immunity and Affinity Maturation]] — Antibody-antigen paratope-epitope docking.
- [[Real-World Scientific Ingestion Architecture]] — Pipeline for ingesting 3D co-crystal coordinates.

---

## 7. Relevant ATOMICA Implementation Paths
- `src/simulation/BindingKinetics.ts` — Evaluates discrete stochastic binding/unbinding events using Gillespie SSA based on experimental $k_{\text{on}}$ and $k_{\text{off}}$.
- `src/proteins/PdbClient.ts` — Ingestion of multi-chain complexes (e.g., Spike/ACE2 PDB `6M0J`).
- `src/anatomy/NavigationState.ts` — Dynamic state tracking for bound vs. unbound complexes at the macromolecular hierarchy level.

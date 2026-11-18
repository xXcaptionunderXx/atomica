# ATOMICA: Biomolecular Science & Protein Folding Research

> **Biopolymers, Hierarchical Protein Structures, Nucleic Acids, and Lipids**
> **Deliverable:** `research/BIOMOLECULAR_RESEARCH.md` | **Lead Researcher:** `agent/gemini`

---

## 1. Biomolecular Classes & Synthesis

### 1.1 Amino Acids & Polypeptides
- **The 20 Canonical Proteinogenic Amino Acids:** Grouped by chemical properties (nonpolar aliphatic, aromatic, polar uncharged, positively charged basic, negatively charged acidic).
- **Peptide Bond Chemistry:** Planar amide bond with partial double-bond character ($\sim 40\%$). Rotation is restricted around the $\text{C-N}$ peptide bond ($\omega \approx 180^\circ$ for trans, rare cis for Proline).
- **Conformational Freedom:** Constrained to the backbone dihedral angles $\phi$ ($\text{C}_{\alpha}\text{-N}$) and $\psi$ ($\text{C}_{\alpha}\text{-C}$). Valid combinations occupy the favored regions of the **Ramachandran Plot**:
  - Right-handed $\alpha$-helix: $\phi \approx -57^\circ$, $\psi \approx -47^\circ$
  - Parallel $\beta$-sheet: $\phi \approx -119^\circ$, $\psi \approx +113^\circ$
  - Antiparallel $\beta$-sheet: $\phi \approx -139^\circ$, $\psi \approx +135^\circ$

### 1.2 Protein Folding Energy Landscape
The folding simulation employs a hierarchical coarse-grained energy function:
$$E_{\text{fold}} = E_{\text{backbone}} + E_{\text{HB}} + E_{\text{hydrophobic}} + E_{\text{electrostatic}} + E_{\text{disulfide}}$$
- **Hydrogen Bonding Network:** Stabilizes secondary structure ($i \to i+4$ backbone hydrogen bonds for $\alpha$-helices).
- **Hydrophobic Collapse:** Miyazawa-Jernigan contact potential favoring burial of hydrophobic residues (Leu, Ile, Val, Phe) into the core.
- **Disulfide Bridges:** Covalent cross-links between proximal Cysteine residues via oxidation ($\text{-SH} + \text{-HS-} \to \text{-S-S-} + 2\text{H}^+ + 2e^-$).

### 1.3 Nucleic Acids (DNA & RNA)
- **Nucleotides:** Nitrogenous base (Adenine, Thymine, Guanine, Cytosine, Uracil) + Pentose sugar (deoxyribose vs. ribose) + Phosphate group.
- **Watson-Crick Base Pairing:**
  - $A = T$ (2 hydrogen bonds)
  - $G \equiv C$ (3 hydrogen bonds)
  - $A = U$ in RNA
- **Central Dogma Flow:** Transcription of DNA to mRNA; ribosomal translation of mRNA codons ($5' \to 3'$) to amino acid sequence.

### 1.4 Lipids & Bilayers
- **Phospholipids:** Amphipathic structure (hydrophilic polar head group + two hydrophobic fatty acid tails).
- **Self-Assembly:** Hydrophobic exclusion forces spontaneous assembly in aqueous solvent into micelles, liposomes, or continuous fluid bilayers.

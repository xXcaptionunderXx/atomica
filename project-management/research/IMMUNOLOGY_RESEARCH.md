# ATOMICA: Immunology & Vaccine Discovery Research

> **Cellular Immune Networks, Antigen Recognition, Affinity Maturation, and Vaccine Simulation**
> **Deliverable:** `research/IMMUNOLOGY_RESEARCH.md` | **Lead Researcher:** `agent/gemini`

---

## 1. Immune System Architecture

The immune simulation bridges molecular recognition and agent-based cellular population dynamics:

### 1.1 Innate Immunity
- **Pathogen Recognition:** Pattern Recognition Receptors (PRRs, e.g. Toll-Like Receptors / TLRs) recognizing Pathogen-Associated Molecular Patterns (PAMPs, e.g. LPS, viral dsRNA, flagellin).
- **Phagocytic Cascades:** Macrophages and Dendritic Cells (DCs) engulf pathogens, release pro-inflammatory cytokines (IL-1, IL-6, TNF-$\alpha$), and migrate to lymph nodes.
- **Complement System:** Alternative, classical, and lectin activation pathways converging on C3 convertase, leading to opsonization (C3b) and membrane attack complex (MAC / C5b-9) lysis.

### 1.2 Adaptive Immunity & Antigen Presentation
- **MHC Class I:** Presents endogenous peptide fragments ($\sim 8\text{--}11$ amino acids) to CD8$^+$ Cytotoxic T-cells.
- **MHC Class II:** Presents exogenous peptide fragments ($\sim 13\text{--}25$ amino acids) on APCs to CD4$^+$ Helper T-cells.
- **Clonal Selection & Expansion:** Antigen binding to specific T-cell receptor (TCR) or B-cell receptor (BCR) with co-stimulation (CD28/B7) triggers exponential proliferation.

---

## 2. Computational Modeling of Vaccine Responses

### 2.1 Affinity Maturation & Somatic Hypermutation
Within the germinal center, activated B-cells undergo iterative cycles of proliferation, AID-mediated somatic hypermutation in immunoglobulin variable regions, and antigen competition on follicular dendritic cells.
- **Affinity Scoring:** Modeled as free energy of binding $\Delta G_{\text{bind}} = \Delta H - T\Delta S$.
- Dissociation constant: $K_d = \exp\left( \frac{\Delta G_{\text{bind}}}{RT} \right)$. Lower $K_d$ confers competitive survival signals.

### 2.2 Primary vs. Secondary Vaccine Dynamics
ODE population model tracking naive cells ($B_N$), activated plasmablasts ($B_A$), long-lived plasma cells ($B_P$), memory B-cells ($B_M$), and circulating antibodies ($Ab$):
$$\frac{d[Ab]}{dt} = k_{\text{prod}} [B_P] + k_{\text{short}} [B_A] - \gamma_{\text{decay}} [Ab] - k_{\text{bind}} [Ab][Ag]$$
- **Primary Response:** Characterized by lag phase ($5\text{--}7$ days), initial low-affinity IgM followed by class-switched IgG.
- **Secondary (Booster) Response:** Rapid memory cell reactivation ($1\text{--}2$ days), high-affinity IgG titer orders of magnitude higher.

### 2.3 Educational Disclaimer & Ethics
As mandated by Section 13: **The vaccine simulator explicitly distinguishes educational and theoretical exploratory models from clinically validated efficacy.** Simulated outcomes must never be interpreted as clinical safety or human efficacy predictions.

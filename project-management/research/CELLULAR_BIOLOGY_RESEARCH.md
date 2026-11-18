# ATOMICA: Cellular Biology & Metabolism Research

> **Organelle Functional Architecture, Membrane Potentials, and Metabolic Networks**
> **Deliverable:** `research/CELLULAR_BIOLOGY_RESEARCH.md` | **Lead Researcher:** `agent/claude`

---

## 1. Cellular Architecture & Compartmentalization

ATOMICA models cells as bounded, multi-compartment biochemical reactors with distinct biochemical micro-environments:
- **Plasma Membrane:** Selective permeability barrier maintaining resting potential ($\approx -70\text{ mV}$ in animal cells) via $\text{Na}^+/\text{K}^+$-ATPase pumps ($3\text{Na}^+$ out for $2\text{K}^+$ in per ATP consumed).
- **Cytosol:** Aqueous matrix supporting glycolysis, protein translation, and signal transduction cascades.
- **Nucleus:** Enclosed by a double membrane with nuclear pores; houses genomic chromatin and mediates transcription.
- **Mitochondria:** Chemiosmotic ATP synthesis via inner-membrane electron transport chain (ETC) and proton gradient driven ATP synthase.
- **Endoplasmic Reticulum & Golgi:** Protein folding, post-translational glycosylation, and vesicle trafficking.

---

## 2. Core Metabolic Pathways & Stoichiometry

The simulation couples discrete chemical reactions into continuous flux-balanced networks:

### 2.1 Glycolysis (Cytosol)
$$\text{Glucose} + 2\text{NAD}^+ + 2\text{ADP} + 2\text{P}_i \to 2\text{Pyruvate} + 2\text{NADH} + 2\text{H}^+ + 2\text{ATP} + 2\text{H}_2\text{O}$$

### 2.2 Citric Acid (Krebs) Cycle & Oxidative Phosphorylation (Mitochondria)
$$2\text{Pyruvate} + 8\text{NAD}^+ + 2\text{FAD} + 2\text{GDP} + 2\text{P}_i + 6\text{H}_2\text{O} \to 6\text{CO}_2 + 8\text{NADH} + 2\text{FADH}_2 + 2\text{GTP}$$
Proton motive force across the inner mitochondrial membrane drives ATP synthase:
$$\Delta p = \Delta\psi - \frac{2.3 RT}{F} \Delta\text{pH} \approx 180\text{ to }220\text{ mV}$$
Net theoretical yield: $\sim 30\text{ to }32\text{ ATP}$ per molecule of Glucose oxidized.

---

## 3. Membrane Transport Dynamics
- **Passive Diffusion:** Governed by Fick's Law: $J = -P (C_{\text{out}} - C_{\text{in}})$.
- **Facilitated & Active Transport:** Modeled via carrier kinetics with saturation:
  $$J = J_{\max} \frac{C}{K_T + C}$$
- **Osmotic Pressure & Cell Volume Regulation:**
  $$\Pi = i M R T$$
  Water flux across aquaporins drives cell swelling (hypotonic) or crenation (hypertonic).

---
title: Cell Membrane Transport and Osmosis
type: scientific-reference
domain: biology
status: verified
created: 2026-11-18
updated: 2026-11-18
sources:
  - "[[Canonical Scientific Textbooks and Standards]]"
related:
  - "[[Amino Acids and Protein Hierarchical Folding]]"
  - "[[Stiff ODE Integration for Biochemical Kinetics]]"
tags:
  - science/biology
  - simulation
---

# Cell Membrane Transport and Osmosis

## Overview
Biological cells depend on semi-permeable phospholipid bilayers to compartmentalize metabolic reactions and generate transmembrane electrochemical gradients. In ATOMICA's Cellular Construction System and Biological Sandbox Room, users can build fluid membranes, insert transport proteins, and observe passive diffusion, active ion pumping, and osmotic swelling.

## Detailed Explanation

### 1. Fluid Mosaic Membrane Architecture
The lipid bilayer consists of amphipathic phospholipids with hydrophilic phosphate heads exposed to the aqueous cytosol/extracellular matrix and hydrophobic hydrocarbon tails sequestered in the interior.
- **Permeability Hierarchy:**
  - Hydrophobic, small nonpolar gases ($\text{O}_2, \text{CO}_2, \text{N}_2$): High permeability ($P > 10^{-2}\text{ cm/s}$).
  - Small uncharged polar molecules ($\text{H}_2\text{O}$, urea, glycerol): Moderate permeability ($P \approx 10^{-4}\text{ cm/s}$).
  - Large uncharged polar molecules (glucose, sucrose): Low permeability ($P \approx 10^{-7}\text{ cm/s}$).
  - Charged ions ($\text{Na}^+, \text{K}^+, \text{Cl}^-, \text{Ca}^{2+}$): Impermeable ($P < 10^{-12}\text{ cm/s}$), requiring transmembrane channel or carrier proteins.

### 2. Transport Mechanics
1. **Passive Fickian Diffusion:** Driven strictly by chemical concentration gradients ($J = -D \frac{dC}{dx}$).
2. **Facilitated Diffusion:** Channel and carrier mediated (e.g. GLUT1 glucose uniporter) following Michaelis-Menten saturable kinetics.
3. **Primary Active Transport:** Hydrolyzes ATP directly to pump ions against steep electrochemical gradients (e.g. $\text{Na}^+/\text{K}^+$-ATPase: expels $3\text{Na}^+$ and imports $2\text{K}^+$ per ATP).
4. **Secondary Active Transport:** Couples the dissipation of an established ion gradient to the uphill transport of another substrate (e.g. SGLT1 $\text{Na}^+/\text{Glucose}$ symport).

### 3. Transmembrane Resting Potential
The difference in electrical potential across the plasma membrane at steady state is determined by the **Goldman-Hodgkin-Katz (GHK) Equation**:
$$V_m = \frac{RT}{F} \ln \left( \frac{P_{\text{K}}[\text{K}^+]_o + P_{\text{Na}}[\text{Na}^+]_o + P_{\text{Cl}}[\text{Cl}^-]_i}{P_{\text{K}}[\text{K}^+]_i + P_{\text{Na}}[\text{Na}^+]_i + P_{\text{Cl}}[\text{Cl}^-]_o} \right)$$
In typical animal cells: $[\text{K}^+]_i \approx 140\text{ mM}, [\text{K}^+]_o \approx 4\text{ mM}, [\text{Na}^+]_i \approx 12\text{ mM}, [\text{Na}^+]_o \approx 145\text{ mM}$, yielding $V_m \approx -70\text{ mV}$.

### 4. Osmotic Pressure and Cell Volume
Water flux across the membrane follows osmotic pressure gradients ($\Delta \Pi = i R T \Delta M$):
$$\frac{dV_{\text{cell}}}{dt} = L_p A (\Delta P - \sigma \Delta \Pi)$$
- **Hypotonic Environment:** Water rushes in; animal cells lyse, plant cells maintain turgor pressure.
- **Hypertonic Environment:** Water rushes out; cells shrink (crenation).

## Important Equations or Principles
- **Van 't Hoff Equation for Osmotic Pressure:**
  $$\Pi = i C R T$$
  where $i$ is the van 't Hoff factor, $C$ is molar concentration, $R$ is the gas constant, and $T$ is absolute temperature.

## Implementation Relevance
- **Cellular Engine (`@atomica/cellular`):** Cell membrane boundaries are simulated as closed 2D spline curves. Fluid particles inside and outside update concentrations per compartment. Osmotic flux adjusts cell radius dynamically.

## Limitations and Uncertainties
- Membrane curvature elasticity is modeled using a simplified Helfrich bending Hamiltonian rather than all-atom lipid bilayer dynamics.

## References
1. Hille, B. (2001). *Ion Channels of Excitable Membranes* (3rd ed.). Sinauer Associates.
2. Alberts, B., et al. (2022). *Molecular Biology of the Cell* (7th ed.). W. W. Norton & Co.

## Related Notes
- [[Amino Acids and Protein Hierarchical Folding]]
- [[Stiff ODE Integration for Biochemical Kinetics]]
- [[Reference Benchmark Cases and Tolerances]]

---
title: Force Fields and Lennard-Jones Potentials
type: scientific-reference
domain: physics
status: verified
created: 2026-11-18
updated: 2026-11-18
sources:
  - "[[Canonical Scientific Textbooks and Standards]]"
related:
  - "[[Langevin Dynamics and Brownian Motion]]"
  - "[[Amino Acids and Protein Hierarchical Folding]]"
tags:
  - science/physics
  - simulation
---

# Force Fields and Lennard-Jones Potentials

## Overview
Molecular dynamics calculates the time-evolution of atomic coordinates by taking the negative gradient of an empirical potential energy function (a "force field"). In ATOMICA, the molecular sandbox evaluates non-bonded van der Waals repulsion and dispersion attraction between non-bonded atoms alongside harmonic covalent bonds, allowing molecules to collide, rebound, and pack realistically.

## Detailed Explanation

### 1. Classical Potential Energy Function
The total potential energy $V_{\text{total}}$ of a molecular configuration is decomposed into bonded and non-bonded terms:
$$V_{\text{total}} = V_{\text{bond}} + V_{\text{angle}} + V_{\text{dihedral}} + V_{\text{non-bonded}}$$

1. **Bonded Harmonic Stretching:**
   $$V_{\text{bond}} = \sum_{\text{bonds}} \frac{1}{2} k_r (r - r_0)^2$$
2. **Bond Angle Harmonic Bending:**
   $$V_{\text{angle}} = \sum_{\text{angles}} \frac{1}{2} k_\theta (\theta - \theta_0)^2$$
3. **Dihedral Torsional Rotation:**
   $$V_{\text{dihedral}} = \sum_{\text{dihedrals}} \frac{V_n}{2} [1 + \cos(n\phi - \gamma)]$$

### 2. Lennard-Jones 12-6 Potential
Non-bonded steric repulsion and London dispersion attraction between neutral atoms $i$ and $j$ separated by distance $r_{ij}$ are modeled via the standard Lennard-Jones potential:
$$V_{LJ}(r_{ij}) = 4\epsilon_{ij} \left[ \left(\frac{\sigma_{ij}}{r_{ij}}\right)^{12} - \left(\frac{\sigma_{ij}}{r_{ij}}\right)^6 \right]$$
Where:
- $\epsilon_{ij}$ is the potential well depth (interaction energy).
- $\sigma_{ij}$ is the distance at which the inter-particle potential is zero (collision diameter).
- The $r^{-12}$ term represents steep Pauli repulsion between overlapping electron clouds.
- The $r^{-6}$ term represents instantaneous dipole-induced dipole van der Waals attraction.

### 3. Lorentz-Berthelot Combining Rules
For heterogeneous atomic pairs ($A$ and $B$), parameters are combined via:
$$\sigma_{AB} = \frac{\sigma_A + \sigma_B}{2} \quad (\text{arithmetic mean})$$
$$\epsilon_{AB} = \sqrt{\epsilon_A \cdot \epsilon_B} \quad (\text{geometric mean})$$

### 4. Force Derivation and Truncation
The instantaneous force $\vec{F}_{ij}$ acting on atom $i$ due to atom $j$ is:
$$\vec{F}_{ij} = -\nabla_i V_{LJ}(r_{ij}) = \frac{24\epsilon_{ij}}{r_{ij}^2} \left[ 2\left(\frac{\sigma_{ij}}{r_{ij}}\right)^{12} - \left(\frac{\sigma_{ij}}{r_{ij}}\right)^6 \right] \vec{r}_{ij}$$

To achieve $\mathcal{O}(N)$ performance for 50,000 atoms:
- Potential is truncated at cutoff radius $r_{\text{cut}} = 2.5\sigma$.
- A cubic smoothing polynomial or force-shifted potential eliminates discontinuities at $r_{\text{cut}}$:
  $$V_{\text{shifted}}(r) = V_{LJ}(r) - V_{LJ}(r_{\text{cut}}) - (r - r_{\text{cut}}) \left.\frac{dV_{LJ}}{dr}\right|_{r_{\text{cut}}}$$

## Important Equations or Principles
- **Equilibrium Minimum Separation:**
  $$r_{\min} = 2^{1/6}\sigma \approx 1.12246\sigma$$
  At this distance, attractive and repulsive forces balance ($\vec{F} = \vec{0}$), and the potential energy reaches $-\epsilon$.

## Implementation Relevance
- **Spatial Hash Grid:** The 2D sandbox allocates atoms into grid buckets of width $w = r_{\text{cut}}$. Only particles in the same bucket and immediate neighboring buckets are evaluated, avoiding the $\mathcal{O}(N^2)$ all-pairs bottleneck.
- **WebAssembly Compute Loop:** Inner force calculation is vectorized with SIMD (Single Instruction Multiple Data) in WebAssembly.

## Limitations and Uncertainties
- Polarizable charge transfer and chemical bond breaking cannot be represented by fixed-parameter Lennard-Jones functions; bond formation/breakage events are handled by the chemical reaction engine.

## References
1. Lennard-Jones, J. E. (1924). *On the determination of molecular fields*. *Proc. R. Soc. Lond. A*, 106(738), 463–477.
2. Frenkel, D., & Smit, B. (2002). *Understanding Molecular Simulation: From Algorithms to Applications* (2nd ed.). Academic Press.

## Related Notes
- [[Langevin Dynamics and Brownian Motion]]
- [[Amino Acids and Protein Hierarchical Folding]]
- [[Decoupled Simulation and Rendering Pipeline]]

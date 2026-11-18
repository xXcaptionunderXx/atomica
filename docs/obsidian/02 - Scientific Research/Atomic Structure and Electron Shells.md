---
title: Atomic Structure and Electron Shells
type: scientific-reference
domain: physics
status: verified
created: 2026-11-18
updated: 2026-11-18
sources:
  - "[[Canonical Scientific Textbooks and Standards]]"
related:
  - "[[VSEPR Theory and Molecular Geometry]]"
  - "[[Atomic Engine Specification]]"
tags:
  - science/physics
  - science/chemistry
---

# Atomic Structure and Electron Shells

## Overview
Every chemical element is defined by its nuclear composition (protons $Z$ and neutrons $N$) and the spatial probability distribution of its surrounding electrons. In ATOMICA, the atomic construction system allows users to manipulate subatomic particles and configure isotopes. To avoid cartoonish approximations, electronic configurations are governed by established quantum mechanics rules.

## Detailed Explanation

### 1. Quantum Numbers
The electronic state of an electron in an isolated atom is defined by four quantum numbers:
1. **Principal Quantum Number ($n$):** $n \in \{1, 2, 3, \dots, 7\}$, determining the primary energy shell and distance from the nucleus.
2. **Azimuthal / Orbital Angular Momentum Quantum Number ($\ell$):** $\ell \in \{0, 1, \dots, n-1\}$, representing subshells:
   - $\ell = 0 \to s$ (spherical, 1 orbital, max 2 electrons)
   - $\ell = 1 \to p$ (dumbbell, 3 orbitals, max 6 electrons)
   - $\ell = 2 \to d$ (cloverleaf, 5 orbitals, max 10 electrons)
   - $\ell = 3 \to f$ (complex, 7 orbitals, max 14 electrons)
3. **Magnetic Quantum Number ($m_\ell$):** $m_\ell \in [-\ell, +\ell]$, defining spatial orientation.
4. **Spin Magnetic Quantum Number ($m_s$):** $m_s \in \{+\frac{1}{2}, -\frac{1}{2}\}$.

### 2. Governing Principles
- **Aufbau Principle:** Electrons fill lowest available energy orbitals first. Energy increases with $n + \ell$. For equal $n + \ell$, lower $n$ fills first:
  $$1s < 2s < 2p < 3s < 3p < 4s < 3d < 4p < 5s < 4d < 5p < 6s < 4f < 5d < 6p < 7s < 5f < 6d < 7p$$
- **Hund's Rule:** Degenerate orbitals are each occupied singly with parallel spins ($m_s = +1/2$) before any orbital is doubly occupied.
- **Pauli Exclusion Principle:** No two electrons in an atom can share the identical four quantum numbers $(n, \ell, m_\ell, m_s)$.

### 3. Nuclear Stability & Isotopes
The strong nuclear force balances electromagnetic proton-proton repulsion. Nuclear stability depends on the neutron-to-proton ratio ($N/Z$). For light elements ($Z \le 20$), $N/Z \approx 1$. For heavy elements ($Z \approx 80$), $N/Z \approx 1.5$. Unstable isotopes decay via:
- **$\alpha$ decay:** Emission of $^4_2\text{He}$ nucleus ($A \to A-4, Z \to Z-2$).
- **$\beta^-$ decay:** Neutron converts to proton + electron + antineutrino ($n \to p + e^- + \bar{\nu}_e, Z \to Z+1$).
- **$\beta^+$ decay:** Proton converts to neutron + positron + neutrino ($p \to n + e^+ + \nu_e, Z \to Z-1$).

## Important Equations or Principles
- **Madelung Energy Ordering:**
  $$E(n, \ell) \propto n + \ell$$
- **Semi-Empirical Mass Formula (Weizsäcker / Bethe):**
  $$B(A, Z) = a_v A - a_s A^{2/3} - a_c \frac{Z(Z-1)}{A^{1/3}} - a_a \frac{(A - 2Z)^2}{A} + \delta(A, Z)$$
  Used in ATOMICA to compute nuclear binding energy and predict isotope half-lives.

## Implementation Relevance
- **Atomic Engine (`@atomica/core-chem`):** Implements an analytical solver calculating ground-state electron configurations, identifying valence electrons, unpaired spins (paramagnetism), and oxidation states.
- **Electron Shell Visualizer:** Renders concentric Bohr/Sommerfeld shells in 2D with active electron count rings, dynamically updating when users add/remove electrons or alter charge.

## Limitations and Uncertainties
- Transition metal exceptions (e.g. $\text{Cr}: [Ar] 4s^1 3d^5$ and $\text{Cu}: [Ar] 4s^1 3d^{10}$) are explicitly programmed via NIST reference tables rather than pure $n+\ell$ rules.
- Relativistic electron contraction effects in superheavy elements ($Z > 100$) are treated through static tabulated values from literature.

## References
1. NIST Atomic Spectra Database. National Institute of Standards and Technology. [https://physics.nist.gov/PhysRefData/ASD/levels_form.html](https://physics.nist.gov/PhysRefData/ASD/levels_form.html)
2. Atkins, P. & Friedman, R. (2011). *Molecular Quantum Mechanics* (5th ed.). Oxford University Press.

## Related Notes
- [[VSEPR Theory and Molecular Geometry]]
- [[Atomic Engine Specification]]
- [[Reference Benchmark Cases and Tolerances]]

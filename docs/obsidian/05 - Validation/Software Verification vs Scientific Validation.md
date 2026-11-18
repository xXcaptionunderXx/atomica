---
title: Software Verification vs Scientific Validation
type: validation-guide
domain: engineering/validation
status: verified
created: 2026-11-18
updated: 2026-11-18
sources:
  - "ATOMICA Engineering Charter (Section 20)"
  - "ASME V&V 10 / 20 Standards for Computational Modeling"
related:
  - "[[Test-Driven Development Framework]]"
  - "[[Reference Benchmark Cases and Tolerances]]"
tags:
  - validation
  - verification
  - quality-assurance
  - benchmarks
---

# Software Verification vs. Scientific Validation

## 1. Cardinal Engineering Distinction
In computational science and engineering simulation, **Verification** and **Validation** (V&V) are distinct disciplines that must never be conflated:

> - **Verification:** *"Did we build the system right?"*  
>   Verifies that the software implementation accurately models the underlying mathematical equations and software specifications. (Governed by unit tests, numerical integration convergence tests, floating-point tolerance checks, and invariance assertions).
>
> - **Validation:** *"Did we build the right system?"*  
>   Determines the degree to which the computational model accurately represents the physical reality of the natural world. (Governed by comparing simulation predictions against empirical laboratory datasets from NIST, IUPAC, and RCSB PDB).

---

## 2. The Multi-Tier Testing Pyramid

```
                       / \
                      /   \
                     /     \
                    /  L4   \    Scientific Benchmark Validation
                   /---------\   (NIST bond energies, PDB crystal coordinates,
                  /    L3     \   experimental Michaelis-Menten kinetics)
                 /-------------\
                /      L2       \  Subsystem & Multi-Scale Integration Tests
               /-----------------\ (PubChem -> Canvas, Hierarchy tree state)
              /        L1         \
             /---------------------\ Deterministic Unit & Invariance Tests
            /_______________________\ (Valence limits, formal charge sum, mass conservation)
```

---

## 3. Tier 1 & 2: Verification Criteria (Software Correctness)

1. **Conservation Invariants:**
   - **Mass / Atom Conservation:** In any closed-system chemical transformation or reaction, $\sum_{\text{reactants}} Z_i = \sum_{\text{products}} Z_i$.
   - **Charge Conservation:** Net formal charge must equal net ionic charge before and after bond reorganization: $\sum \text{FC}_{\text{initial}} = \sum \text{FC}_{\text{final}}$.
   - **Valence Invariance:** No atom may exceed its physically permissible coordination number:
     $$\text{degree}(v_i) \le \text{valenceLimit}(Z_i)$$
2. **Numerical Convergence:**
   - Symplectic integrators (Verlet / BAOAB) must conserve total energy $E = T + V$ over $10^5$ integration steps with drift $\frac{\Delta E}{E_0} < 10^{-4}$.
   - Stiff chemical ODE solvers must satisfy relative tolerance $\text{rtol} \le 10^{-5}$ and absolute tolerance $\text{atol} \le 10^{-8}$.

---

## 4. Tier 3 & 4: Validation Criteria (Scientific Fidelity)

Validation requires comparing simulated outputs directly against physical reality. ATOMICA mandates the following tolerance thresholds:

| Physical Observable | Benchmark Source | Tolerated Deviation | Test Mechanism |
| :--- | :--- | :---: | :--- |
| **Bond Lengths ($r_0$)** | NIST CCCBDB Experimental Data | $\pm 0.02\text{ \AA}$ | Automated comparison against NIST ground-state microwave/X-ray structures. |
| **Bond Angles ($\theta_0$)** | IUPAC / VSEPR Reference Geometries | $\pm 1.5^\circ$ | Equilibrium angle comparison (e.g., $\text{H}_2\text{O} = 104.5^\circ$, $\text{CH}_4 = 109.5^\circ$). |
| **PDB Backbone RMSD** | RCSB PDB Experimental Crystals | $\text{RMSD} < 0.1\text{ \AA}$ | Coordinate deviation check on ingested heavy atom records ($C_\alpha, N, C, O$). |
| **Dissociation ($K_D$)** | Published Surface Plasmon Resonance (SPR) | Within $0.5\log_{10}$ units | Stochastic binding affinity convergence at equilibrium. |
| **Osmotic Pressure ($\Pi$)** | Van 't Hoff experimental osmometry | $\pm 5\%$ | Compartmental semipermeable membrane pressure checks. |

---

## 5. Non-Negotiable Quality Gates
- **Zero Placeholder Science:** Code that simulates fake reaction outcomes, hallucinates impossible molecules (e.g., 5-bonded Carbon with neutral charge), or produces ungrounded biological graphics without literature grounding will fail validation.
- **Fail-Fast Policy:** If an experimental condition enters an unvalidated regime (e.g., relativistic core electron velocities, extreme temperatures $T > 5000\text{ K}$), the engine must gracefully report physical invalidity rather than continuing with meaningless numbers.

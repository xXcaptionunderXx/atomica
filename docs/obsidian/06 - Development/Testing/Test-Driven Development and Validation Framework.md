---
title: Test-Driven Development and Validation Framework
type: technical-specification
domain: testing
status: verified
created: 2026-11-18
updated: 2026-11-18
sources:
  - "[[Canonical Scientific Textbooks and Standards]]"
related:
  - "[[Reference Benchmark Cases and Tolerances]]"
  - "[[Atomic Engine Specification]]"
  - "[[Chemical Graph and Bond Validation]]"
tags:
  - testing
  - validation
  - architecture
---

# Test-Driven Development and Validation Framework

## Overview
This document formalizes the mandatory engineering philosophy established in **Section 20 of the ATOMICA Charter**:
> **"The priority is to build a scientifically accurate, functional, tested application before investing significant time in UI polish, animations, visual effects, or graphics."**

A visually stunning interface with incorrect chemical math or fake physics is an unacceptable failure. A clean, minimal interface powered by rigorous, verified scientific engines is a true foundation.

---

## 1. Absolute Development Priority Order

All engineering decisions and implementation sprints across Claude, Gemini, and human contributors must obey this strict sequence:

1. **Scientific correctness** (physical validity, conservation laws, real constants)
2. **Functional correctness** (interfaces return expected data types and states)
3. **Mathematical correctness** (numerical stability, tolerances, dimensional units)
4. **Architectural reliability** (clean boundaries, decoupled subsystems)
5. **Integration between subsystems** (data flows cleanly from atoms to organisms)
6. **Performance and computational efficiency** ($\mathcal{O}(N)$ algorithms, WebAssembly)
7. **Basic functional user interface** (working buttons, inputs, readouts)
8. **Advanced visualizations and graphics** (WebGL2/WebGPU shaders, molecular lookdev)
9. **UI polish, animations, and aesthetic improvements** (transitions, sound, typography)

Under no circumstances may an agent reverse this order to build an impressive visual demo over unvalidated calculations.

---

## 2. The 9-Stage Milestone Lifecycle

Every major subsystem must pass sequentially through these stages:

```
[ Stage A: Research ]
         │
         ▼
[ Stage B: Proof of Concept ]
         │
         ▼
[ Stage C: Functional Implementation ]
         │
         ▼
[ Stage D: Automated Testing ] (Unit, Integration, Scientific Validation)
         │
         ▼
[ Stage E: Basic UI Integration ]
         │
         ▼
[ Stage F: Advanced Visualization ] (2D / 3D Lookdev)
         │
         ▼
[ Stage G: Visual Polish ]
```

No subsystem may advance to a higher stage while critical defects remain unresolved in an earlier stage.

---

## 3. Software Verification vs. Scientific Validation

ATOMICA enforces two distinct quality gates:

### Gate A: Software Verification
- Does the code execute without runtime exceptions?
- Are data structures properly typed and memory-safe?
- Are edge cases (null inputs, disconnected graphs, zero values) handled gracefully?
- Are memory leaks or heap allocations under control?

### Gate B: Scientific Validation
- Does the model reproduce established experimental measurements?
- Are equations, approximations, and assumptions scientifically appropriate?
- Are outputs within empirical tolerances established in [[Reference Benchmark Cases and Tolerances]]?
- Does the model behave realistically across diverse experimental conditions (e.g., varying temperature, pressure, pH)?

An engine that passes all software tests using an unphysical approximation is **not** scientifically validated.

---

## 4. Test-Driven Development (TDD) Workflow

For every new feature:
1. **Define Expected Behavior:** Document mathematical requirements and reference cases.
2. **Write Failing Tests:** Create tests in `vitest` asserting expected scientific outcomes against NIST/PDB values.
3. **Confirm Failure:** Run tests and verify they fail for the intended reason (not import or syntax errors).
4. **Implement Minimal Solution:** Write the smallest functional code that satisfies the test.
5. **Re-run Tests & Refactor:** Verify green status, add edge-case assertions, and profile performance.
6. **Integrate:** Validate cross-subsystem contracts.

---

## 5. Prohibited Anti-Patterns (Section 20.10)

The following practices are strictly prohibited:
- Hardcoded outputs masquerading as calculated physical results.
- Random number generation presented as molecular dynamics or chemical reactivity.
- Fake animations that appear like chemical reactions without stoichiometry or mass conservation.
- Arbitrary geometric coordinates presented as real VSEPR or crystal structures.
- UI buttons that appear functional but perform no underlying scientific calculation.
- Mock data presented as retrieved PubChem or PDB database records.

---

## 6. Definition of Done (DoD)

A feature may only be marked `COMPLETE` on the task board when all 12 criteria are satisfied:
1. Requirements documented in `/docs/obsidian/` and `/project-management/`.
2. Scientific assumptions, equations, and literature citations documented.
3. Functional implementation complete and decoupled from UI.
4. Unit tests pass with 100% assertion coverage.
5. Integration tests pass across shared subsystem interfaces.
6. Edge cases and failure conditions investigated.
7. Scientific validation completed against [[Reference Benchmark Cases and Tolerances]].
8. Physical limitations and approximations explicitly noted.
9. Interfaces match schemas in `/project-management/API_CONTRACTS.md`.
10. Obsidian vault updated with canonical notes and cross-links.
11. Independent peer review completed by the partner agent.
12. GitHub Actions CI passes completely.

If scientific validation is ongoing, the task status must be marked `FUNCTIONALLY_COMPLETE_UNVALIDATED`.

---

## References
1. Beck, K. (2002). *Test-Driven Development: By Example*. Addison-Wesley.
2. Oberkampf, W. L., & Roy, C. J. (2010). *Verification and Validation in Scientific Computing*. Cambridge University Press.

## Related Notes
- [[Reference Benchmark Cases and Tolerances]]
- [[Atomic Engine Specification]]
- [[Chemical Graph and Bond Validation]]

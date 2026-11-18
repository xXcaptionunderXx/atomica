---
title: ADR-004 - 2D Interactive Sandbox First Strategy
type: adr
domain: architecture
status: accepted
created: 2026-11-18
updated: 2026-11-18
tags:
  - adr
  - architecture
  - ui
  - 2d-sandbox
---

# ADR-004: 2D Interactive Sandbox First Strategy

## Status
**Accepted** (Enforced by User Directive on 2026-11-18)

---

## Context
ATOMICA's grand vision encompasses a multi-scale 3D viewport zooming continuously from whole organism down to individual subatomic particles, utilizing Three.js and Mol*. However, jumping directly into heavy 3D WebGL/WebGPU camera rigs, spatial LOD systems, and macromolecular surface rendering creates significant overhead, obscures fundamental interaction bugs, and delays immediate hands-on playability.

The core gameplay thesis of ATOMICA requires an intuitive, tactile experience of chemical construction: choosing elements from the periodic table, dragging them onto a canvas, forming covalent and ionic bonds within valence limits, and observing stability and reaction outcomes.

On 2026-11-18, the user explicitly mandated:
> **"2D first. All 3D work (Three.js, Mol*, 3D viewport) is PAUSED until the 2D molecule sandbox (TSK-UI-001) is complete and user-tested. No other feature work until then."**

---

## Decision
1. **Prioritize 2D Molecule Builder Sandbox (`TSK-UI-001`):**
   - Implement an interactive canvas/SVG-based 2D builder.
   - Display a full periodic table of all 118 elements categorized by series (alkali metals, halogens, noble gases, etc.).
   - Support dragging elements into the workspace, forming single/double/triple bonds up to valence limits, moving atoms with spring/repulsion physics, and switching between light and dark themes.
2. **Pause 3D Rendering Subsystems (`TSK-ENG-004`):**
   - Three.js scene graphs, Mol* molecular viewers, and 3D camera controls are placed in `PAUSED` status.
   - 3D assets and shaders will not be introduced until the 2D sandbox is validated and approved.
3. **Decouple Validation Logic:**
   - Chemical graph algorithms, valence rules, octet checks, and stoichiometry must remain pure TypeScript business logic (`src/chemistry/`), completely agnostic of whether the presentation layer is 2D HTML Canvas or 3D WebGPU.

---

## Consequences
- **Positive:**
  - Fast feedback loop: Immediate, lightweight playability directly in the browser with sub-second reload times.
  - Clear separation of concerns: Chemical graph data structures and valence solvers can be thoroughly tested via unit tests independent of 3D graphics drivers.
  - Lower initial cognitive and rendering overhead for multi-agent development.
- **Negative:**
  - 3D spatial conformation (VSEPR 3D dihedral angles, macromolecular tertiary folding) is temporarily projected into 2D planar graph representations.
  - 3D integration will require an adapter layer to translate 2D graph states into 3D spatial coordinates once unpaused.

---

## Related Notes
- [[System Architecture]]
- [[2D Molecule Builder Architecture]]
- [[Chemical Graph and Bond Validation]]
- [[Project Dashboard]]

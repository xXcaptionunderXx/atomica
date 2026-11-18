---
title: 2D Molecule Builder Architecture
type: development-guide
domain: ui/sandbox
status: verified
created: 2026-11-18
updated: 2026-11-18
sources:
  - "ATOMICA User Directive (2026-11-18)"
  - "TSK-UI-001 Specification"
related:
  - "[[ADR-004 - 2D Interactive Sandbox First Strategy]]"
  - "[[Covalent and Ionic Bonding]]"
  - "[[Chemical Graph and Bond Validation]]"
tags:
  - development
  - ui
  - 2d-sandbox
  - canvas
---

# 2D Molecule Builder Architecture

## 1. System Purpose
The 2D Molecule Builder Sandbox (`TSK-UI-001`) provides an immediate, tactile, interactive environment for building, assembling, and experimenting with molecules in the browser before complex 3D viewports are activated.

---

## 2. Component Hierarchy

```
+-------------------------------------------------------------------------+
|                              ATOMICA UI                                 |
+-------------------------------------------------------------------------+
| [ Periodic Table Toolbar (118 Elements, Series Filtering, Tooltips) ]   |
+-------------------------------------------------------------------------+
|                                    |                                    |
|       Sandbox Viewport (2D Canvas) | Sidebar Controls                   |
|       - Atom Nodes (Draggable)     | - Valence & Octet Inspector        |
|       - Spring Bond Edges          | - Net Molecular Formula / Mass     |
|       - Real-time Physics Relax    | - Clear / Export / Library Buttons |
|                                    | - Theme Toggle (Dark / Light)      |
|                                    |                                    |
+-------------------------------------------------------------------------+
| Status Bar: Concurrency Locks, FPS, Active Element Count, Energy Delta  |
+-------------------------------------------------------------------------+
```

---

## 3. Core Modules & Responsibilities

### 1. Periodic Table Toolbar (`src/ui/PeriodicTableToolbar.ts`)
- Renders all 118 elements arranged into canonical IUPAC 18-column periods or a compact responsive palette.
- Color-coded by elemental series:
  - Alkali Metals, Alkaline Earth Metals, Transition Metals, Post-Transition Metals, Metalloids, Polyatomic Nonmetals, Diatomic Nonmetals, Noble Gases, Lanthanides, Actinides.
- Interactive dragging: Dragging an element tile off the toolbar and releasing onto the canvas instantiates a new atom node.

### 2. Sandbox Canvas (`src/sandbox/SandboxCanvas.ts`)
- High-performance 2D HTML5 Canvas rendering loop with double-buffering.
- Supports pan (middle-click or drag background) and smooth zoom (mouse wheel).
- Maintains active spatial collections of atoms and bonds.

### 3. Atom Nodes (`src/sandbox/AtomNode.ts`)
- Represents an individual atom in 2D coordinate space $(x, y)$.
- Visual properties:
  - CPK coloring standard (e.g., Hydrogen = White, Carbon = Dark Grey, Oxygen = Red, Nitrogen = Blue, Sulfur = Yellow).
  - Radius proportional to empirical covalent radius.
  - Remaining valence capacity ring: Radial ticks showing available bonding slots (e.g., Carbon starts with 4 ticks; forming 2 bonds leaves 2 ticks).

### 4. Bond Edges (`src/sandbox/BondEdge.ts`)
- Connects two atom nodes $(i, j)$ with single, double, or triple covalent lines.
- Enforces physical equilibrium bond length using a damped Hookean spring:
  $$F_{\text{spring}} = -k_s (d_{ij} - d_0) - \gamma_{\text{damp}} (v_i - v_j)$$
- Clicking and dragging from an atom node to another atom node initiates bond creation; if both atoms have available valence slots, the bond order increments.

### 5. Chemical Graph Validator (`src/chemistry/ChemicalGraph.ts`)
- Pure business logic decoupled from canvas rendering.
- Evaluates total bonded order for each atom against `valenceLimit` from `src/chemistry/elements.ts`.
- Computes formal charge $\text{FC} = V - N_{\text{lone}} - B / 2$ and flags hypervalent violations with an amber warning halo.

---

## 4. Interaction Flow & State Machine
1. **Element Drag:** User grabs element (e.g., Carbon) $\to$ cursor ghost follows $\to$ dropped onto canvas at $(x, y) \to$ `AtomNode` spawned.
2. **Bond Creation:** User drags from Carbon to Oxygen $\to$ dashed connection line drawn $\to$ mouse released over Oxygen $\to$ validator checks `val(C) < 4` and `val(O) < 2` $\to$ single bond established $\to$ second drag upgrades to double bond $\text{C}=\text{O}$.
3. **Equilibrium Relaxation:** Simple 2D Verlet / Euler numerical integrator gently repels overlapping atoms via soft Lennard-Jones repulsion and stabilizes bond angles toward planar VSEPR projections.

---

## 5. Verification and Quality Gates
- **Valence Limits:** Unit tests in `tests/chemistry/elements.test.ts` verify all 118 elements have verified maximum valences.
- **Canvas Physics & Interaction:** Unit tests in `tests/sandbox/` verify node placement, bond addition, bond order capping, and deletion events.

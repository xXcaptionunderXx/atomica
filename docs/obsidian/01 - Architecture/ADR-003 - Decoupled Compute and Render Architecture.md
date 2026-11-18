---
title: ADR-003 - Decoupled Compute and Render Architecture
type: adr
domain: architecture
status: verified
created: 2026-11-18
updated: 2026-11-18
tags:
  - decision
  - architecture
  - performance
---

# ADR-003: Decoupled Compute and Render Architecture

## Status
`ACCEPTED`

## Date
2026-11-18

## Context
ATOMICA simulates complex physical mechanics (Brownian motion, Lennard-Jones potentials, stiff ODE metabolic networks) while rendering tens of thousands of particles in an interactive, zoomable 2D workstation canvas and 3D molecular inspector.

## Problem Statement
Running intensive numerical calculations on the browser's main JavaScript thread causes severe UI stutter, input lag, and frame drops whenever particle counts exceed 1,000 or stiff ODE solvers encounter high gradients.

## Decision
1. Decouple simulation computation completely from rendering.
2. Scientific calculations (Langevin dynamics, collision resolution, VSEPR relaxations, stiff ODEs) execute in dedicated Web Workers compiled to WebAssembly (Rust).
3. The main UI thread runs PixiJS v8 and React 19, asynchronously consuming coordinate buffers via `SharedArrayBuffer` (or zero-copy transferred `ArrayBuffer`) and performing Hermite position interpolation between physics steps.

## Consequences
- The workstation UI maintains a steady 60–120 FPS regardless of simulation complexity.
- Time dilation, pausing, and single-step debugging can be applied to the simulation worker without freezing UI responsiveness.

## Related Modules
- `[[Decoupled Simulation and Rendering Pipeline]]`
- `[[Molecular Dynamics and Force Fields]]`
- `[[Langevin Dynamics and Brownian Motion]]`

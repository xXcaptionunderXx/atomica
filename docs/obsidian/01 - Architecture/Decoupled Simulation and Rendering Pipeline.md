---
title: Decoupled Simulation and Rendering Pipeline
type: technical-specification
domain: architecture
status: verified
created: 2026-11-18
updated: 2026-11-18
sources:
  - "[[ADR-003 - Decoupled Compute and Render Architecture]]"
related:
  - "[[Langevin Dynamics and Brownian Motion]]"
  - "[[Molecular Dynamics and Force Fields]]"
tags:
  - architecture
  - performance
---

# Decoupled Simulation and Rendering Pipeline

## Overview
A critical pitfall in browser-based scientific simulations is coupling numerical computation directly into the browser's UI render loop (`requestAnimationFrame`). When atomic collision checks or stiff ODE calculations exceed 16.6 milliseconds, the UI drops frames, freezes user inputs, and triggers GC (Garbage Collection) pauses. ATOMICA enforces a **strict decoupling between the physics/chemistry compute thread and the visualization render thread**.

## Detailed Explanation

### 1. Architectural Topology

```
+-----------------------------------------------------------------------------------+
|                        MAIN THREAD (User Interface & Render)                      |
|                                                                                   |
|   +---------------------+      +---------------------+      +-----------------+   |
|   | React 19 UI Shell   |      | PixiJS v8 2D Canvas |      | Three.js 3D View|   |
|   | Controls & Panels   |      | (WebGPU / WebGL2)   |      | (Space-Filling) |   |
|   +----------+----------+      +----------^----------+      +--------^--------+   |
|              |                            |                          |            |
|              | User Actions (Add/Drag)    | Read-Only Interpolation  |            |
+--------------|----------------------------|--------------------------|------------+
               |                            |                          |
               | PostMessage                | SharedArrayBuffer / Zero-Copy Transfers
               | (Event Queue)              | (Positions, Radii, Colors)
+--------------v----------------------------|---------------------------------------+
|                                           |                                       |
|                    WEB WORKER (Rust WebAssembly Compute Kernel)                   |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                    Simulation Tick Loop (Fixed Step dt = 1 fs)            |   |
|   +---------------------------------------------------------------------------+   |
|       |                     |                     |                     |         |
|   +---v------------+   +----v------------+   +----v------------+   +----v-----+   |
|   | Spatial Hash   |   | BAOAB Langevin  |   | LJ & Coulomb    |   | Stiff ODE|   |
|   | Grid (O(N))    |   | Integrator      |   | Force Field     |   | Kinetics |   |
|   +----------------+   +-----------------+   +-----------------+   +----------+   |
+-----------------------------------------------------------------------------------+
```

### 2. Synchronization Mechanisms
1. **Zero-Copy Memory Sharing (`SharedArrayBuffer` & `Atomics`):**
   - The Web Worker writes Cartesian positions $[x_0, y_0, x_1, y_1, \dots, x_N, y_N]$ directly into a pre-allocated `Float32Array` buffer.
   - When supported, the main render thread reads this buffer without memory copies, ensuring minimal overhead.
2. **Fixed-Step Physics with Visual Hermite Interpolation:**
   - The simulation loop runs at a deterministic, constant physics rate: $\Delta t_{\text{phys}} = 1.0\text{ ms}$ (or $1.0\text{ fs}$ sub-steps).
   - The rendering loop runs asynchronously at the display's native refresh rate ($60\text{ Hz}, 120\text{ Hz}$, or $144\text{ Hz}$).
   - The renderer interpolates between the previous and current physics state:
     $$\vec{r}_{\text{render}} = (1 - \alpha) \vec{r}_{t - \Delta t} + \alpha \vec{r}_t \quad \text{where } \alpha = \frac{t_{\text{render}} - t_{\text{last}}}{\Delta t_{\text{phys}}}$$
   - This prevents visual jitter when simulation speed is adjusted or when the physics worker takes a heavy tick.

## Important Equations or Principles
- **Frame Budget Allocation (60 FPS = 16.66 ms):**
  - Event Handling & React reconciliation: $\le 2.0\text{ ms}$
  - PixiJS sprite batch draw calls: $\le 4.0\text{ ms}$
  - Three.js 3D inspection render: $\le 6.0\text{ ms}$
  - Headroom buffer: $\ge 4.66\text{ ms}$

## Implementation Relevance
- **Compliance with ADR-003:** Eliminates main-thread blocking. The simulation can be paused, stepped forward, accelerated $100\times$, or run backwards in time while the UI controls, sliders, and menus remain instantly responsive.

## Limitations and Uncertainties
- Safari and older mobile browsers have security restrictions regarding `SharedArrayBuffer` requiring specific COOP (`Cross-Origin-Opener-Policy: same-origin`) and COEP (`Cross-Origin-Embedder-Policy: require-corp`) HTTP headers. Fallback uses transferred `ArrayBuffer` objects via Web Worker `postMessage`.

## References
1. Leimkuhler, B., & Matthews, C. (2015). *Molecular Dynamics*. Springer.
2. W3C Web Workers Specification. [https://www.w3.org/TR/workers/](https://www.w3.org/TR/workers/)

## Related Notes
- [[ADR-003 - Decoupled Compute and Render Architecture]]
- [[Molecular Dynamics and Force Fields]]
- [[Langevin Dynamics and Brownian Motion]]

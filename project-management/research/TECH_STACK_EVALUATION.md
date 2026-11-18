# ATOMICA: Technology Stack & Architectural Evaluation

> **Evaluation of Frontend, Compute, WebAssembly, and Visualization Runtimes**
> **Deliverable:** `research/TECH_STACK_EVALUATION.md` | **Lead Researcher:** `agent/claude`

---

## 1. Candidate Architecture Comparison

| Layer | Candidate Technologies | Evaluation Criteria | Recommended Selection | Justification |
| :--- | :--- | :--- | :--- | :--- |
| **Application Shell** | Next.js 15, Vite + React, SvelteKit | UI responsiveness, bundle control, tooling | **Vite + React (TypeScript Strict)** | Pure client-side SPA architecture minimizes SSR overhead for heavy real-time simulation; instant HMR. |
| **2D Canvas Engine** | PixiJS v8, Canvas2D, Konva, WebGPU raw | 50,000+ particle rendering at 60 FPS, sprite batching | **PixiJS v8 (WebGPU / WebGL2 backend)** | Auto-batching draws 50,000+ circles/bonds in 1–2 draw calls; smooth pan/zoom camera matrix. |
| **3D Molecular Engine** | Three.js, Babylon.js, WebGPU raw | PDB parsing, CPK shaders, SASA surface generation | **Three.js + React Three Fiber** | Vast ecosystem of molecular loaders (PDBLoader, Mol2), instanced meshes, and custom GLSL shader support. |
| **Cheminformatics Kernel** | RDKit WebAssembly, Open Babel WASM, Custom Rust/TS | Graph validation, SMILES/InChI, VSEPR 2D layout | **Custom Rust WASM Core + Tailored RDKit Minimal** | Full RDKit is ~35MB; custom Rust kernel provides 100x smaller footprint for core Lewis/VSEPR logic, delegating rare CAS lookups to REST APIs. |
| **Kinetics ODE Solver** | numeric.js, odepack WASM, Custom C/Rust RK4 | Stiff biological network stability, performance | **Rust WASM (Runge-Kutta-Fehlberg RK45 / Radau5)** | High precision numerical integration without garbage collection pauses. |
| **State Management** | Zustand, Redux Toolkit, Jotai | Low overhead, granular subscriptions, undo/redo | **Zustand + Temporal Middleware** | Zero boilerplate, microsecond state dispatches, built-in undo/redo stack for experiment history. |
| **Local Persistence** | IndexedDB (Dexie.js), LocalStorage, SQLite WASM | Saving complex experiments with thousands of atoms | **Dexie.js (IndexedDB)** | Structured async blob and object storage with versioned schema migrations. |

---

## 2. Multi-Threading & Worker Architecture

Main UI thread must NEVER perform particle physics or chemical graph searches.
- **Worker 1 (`simulation-worker`):** Owns Langevin dynamics, spatial hash grid, and collision detection. Shares coordinate buffers with the render thread via `SharedArrayBuffer` where supported, or transferred `Float32Array` buffers.
- **Worker 2 (`kinetics-worker`):** Solves stiff ODE systems for cellular metabolism and reaction equilibria at fixed simulation steps.
- **Worker 3 (`search-worker`):** Queries PubChem and parses large PDB / SDF structures asynchronously.

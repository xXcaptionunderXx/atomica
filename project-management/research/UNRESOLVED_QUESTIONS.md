# ATOMICA: Unresolved Questions & Technical Risks

> **Active Inquiries, Technical Trade-offs, and Open Architectural Investigations**
> **Deliverable:** `research/UNRESOLVED_QUESTIONS.md` | **Lead Authors:** `agent/claude` & `agent/gemini`

---

## 1. Active Inquiries & Technical Debates

### Question 1: Client-Side WebAssembly vs. Serverless Computation for Cheminformatics
- **Debate:** Should chemical graph layouts (clean 2D coordinate generation from SMILES) and force field minimizations run strictly client-side via a stripped Rust WebAssembly binary, or should heavier tasks fall back to a containerized Python/RDKit microservice?
- **Current Consensus:** Primary goal is full standalone local execution. Build a stripped, highly optimized Rust WebAssembly module (`@atomica/wasm-chem`) containing VSEPR coordinates, graph validation, and basic force fields. If the user requests complex global minimum conformer search, provide optional cloud delegation.

### Question 2: Multi-Scale Real-Time Time Stepping
- **Debate:** How can the user smoothly transition from observing individual femtosecond atomic vibrations to observing minutes-long enzymatic reaction cascades and hours-long cellular growth on the same canvas?
- **Current Consensus:** Implement a "Temporal Microscope" (time dilation factor). In the atomic workbench, $\Delta t$ corresponds to picoseconds. When zooming out to the cellular compartment, atomic positions are frozen into rigid bodies or averaged out, and time advances in seconds or minutes using ODE flux approximations.

### Question 3: Representation of Complex Organelles in 2D Space
- **Debate:** Biological cells are intrinsically 3D structures with convoluted internal membranes (e.g. endoplasmic reticulum cisternae, mitochondrial cristae). How can these be represented authentically in a flat 2D laboratory workstation?
- **Current Consensus:** Implement cross-sectional 2D topological slices with multi-layer depth indicators (similar to transmission electron microscopy / TEM imaging), complemented by a dedicated "3D Organelle Inspector" modal.

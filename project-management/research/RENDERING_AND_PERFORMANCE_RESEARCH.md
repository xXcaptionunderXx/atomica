# ATOMICA: Rendering & Performance Engineering Research

> **GPU Acceleration, Spatial Partitioning, Level-of-Detail (LOD), and Shaders**
> **Deliverable:** `research/RENDERING_AND_PERFORMANCE_RESEARCH.md` | **Lead Researcher:** `agent/claude`

---

## 1. 2D Workstation Canvas Pipeline

The central workspace must support interactive panning, continuous zooming, and real-time visualization of molecular collections containing tens of thousands of entities.

### 1.1 WebGPU / WebGL2 Instanced Batching
- **Atom Rendering:** Single instanced circle geometry with per-instance dynamic buffer attributes:
  - `vec2 aPosition`: World space coordinates $[x, y]$.
  - `float aRadius`: Van der Waals or covalent radius scaled by zoom factor.
  - `vec4 aColor`: CPK element color with alpha channel for ionic states.
  - `vec2 aVelocity`: Direction vector for motion trail / thermal vibration indicators.
- **Bond Rendering:** Single instanced quad geometry scaled, rotated, and positioned between bonded atom endpoints. Single, double, and triple bonds rendered as parallel line segments with configurable offsets.

### 1.2 Continuous Level-of-Detail (LOD) Strategy
- **LOD 0 (Extreme Zoom Out, >5,000 entities):** Render atoms as single anti-aliased colored points (Point Primitives), bonds omitted or blended into density heatmaps.
- **LOD 1 (Medium Zoom, 500–5,000 entities):** Render CPK spheres and single bond lines; omit atom labels and lone pairs.
- **LOD 2 (Close Inspection, <500 entities):** Full chemical representation: element symbols, valence shells, lone electron pair dots, formal charge badges, bond angle arcs with live degree readouts, and dipoles.

---

## 2. 3D Molecular Inspector Pipeline

For individual molecules or biomolecules opened in the 3D inspection modal:

### 2.1 Visualization Modes
1. **Ball-and-Stick:** Instanced spheres for atoms ($r = 0.3 \times r_{\text{vdW}}$) and instanced cylinders for covalent bonds.
2. **Space-Filling (CPK / Calotte):** Full van der Waals overlapping spheres ($r = r_{\text{vdW}}$), displaying accurate steric volume and packing.
3. **Solvent-Accessible Surface Area (SASA) & Electrostatic Potential:**
   - Sharafeddin-approximate marching cubes or GPU ray-marched signed distance field (SDF) isosurfaces.
   - Vertices colored dynamically by electrostatic potential: red (electronegative / negative partial charge, $\delta^-$) to blue (electropositive, $\delta^+$).

### 2.2 Quantum Electron Density Orbitals
- Pre-computed spherical harmonic basis function representations for atomic $s, p_x, p_y, p_z, d$ orbitals.
- Volumetric ray-marching shader displaying probability density $|\psi(\vec{r})|^2$ isosurfaces with phase-colored lobes.

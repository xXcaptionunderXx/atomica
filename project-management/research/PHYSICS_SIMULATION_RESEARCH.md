# ATOMICA: Physics Simulation & Kinetics Research

> **Classical Mechanics, Brownian Dynamics, Collision Models, and Numerical Integration**
> **Deliverable:** `research/PHYSICS_SIMULATION_RESEARCH.md` | **Lead Researcher:** `agent/claude`

---

## 1. Classical Particle Dynamics in the Sandbox

Within the 2D simulation workspace, free atoms and molecules move subject to thermal agitation, collisions, and external boundary constraints.

### 1.1 Langevin Dynamics & Brownian Motion
To simulate a liquid or gaseous solvent environment without rendering trillions of explicit water molecules, we employ the Langevin equation:
$$m \frac{d\vec{v}}{dt} = -\gamma \vec{v} + \vec{F}_{\text{ext}} + \vec{\xi}(t)$$
Where:
- $-\gamma \vec{v}$ represents viscous drag (friction), with $\gamma = 6\pi\eta r$ (Stokes' law).
- $\vec{F}_{\text{ext}}$ is the conservative force from inter-particle potentials (Lennard-Jones, electrostatic, spring bonds).
- $\vec{\xi}(t)$ is a stochastic Gaussian random force modeling thermal solvent bombardment, satisfying the Fluctuation-Dissipation theorem:
  $$\langle \vec{\xi}(t) \cdot \vec{\xi}(t') \rangle = 2\gamma k_B T \, \delta(t - t')$$

### 1.2 Symplectic Integration
We implement the **Velocity Verlet** scheme for conservative dynamics and the **BAOAB** Langevin integrator for thermostatted runs. Time steps $\Delta t$ are dynamically adjusted based on the highest vibrational frequency in the system to ensure numerical stability and prevent particle explosion.

---

## 2. Chemical Reaction Kinetics Engine

Chemical reactions between colliding molecules are resolved through a combination of collision theory and transition-state approximations:

### 2.1 Collision Frequency & Probability
For two reactant species $A$ and $B$, collision rate $Z_{AB}$ per unit area/volume is:
$$Z_{AB} = n_A n_B \sigma_{AB} \sqrt{\frac{8 k_B T}{\pi \mu_{AB}}}$$
Where $\mu_{AB} = \frac{m_A m_B}{m_A + m_B}$ is the reduced mass, and $\sigma_{AB} = \pi (r_A + r_B)^2$ is the collision cross section.

### 2.2 Arrhenius Activation Energy & Reaction Firing
Upon collision, reaction occurs with probability:
$$P_{\text{rxn}} = p \cdot \exp\left( -\frac{E_a}{k_B T} \right)$$
where $p$ is the steric orientation factor (validating that the active sites collided at the proper relative angle), and $E_a$ is the activation energy barrier.

---

## 3. Spatial Partitioning & Scalability ($\mathcal{O}(N)$)

To simulate up to 50,000 active atoms at 60 FPS:
- **Spatial Hashing / Uniform Grid:** The 2D sandbox canvas is divided into a spatial hash grid with cell size equal to the maximum interaction cutoff radius $r_{\text{cut}} = 2.5\sigma$.
- Neighbor searches query only the 9 adjacent cells (in 2D), cutting collision checks from $\mathcal{O}(N^2)$ to $\mathcal{O}(N)$.

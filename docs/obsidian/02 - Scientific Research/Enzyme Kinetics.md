---
title: Enzyme Kinetics
type: scientific-reference
domain: biochemistry
status: verified
created: 2026-11-18
updated: 2026-11-18
sources:
  - "Michaelis, L., & Menten, M. L. (1913). Die Kinetik der Invertinwirkung. Biochemische Zeitschrift, 49, 333–369."
  - "Briggs, G. E., & Haldane, J. B. S. (1925). A Note on the Kinetics of Enzyme Action. Biochemical Journal, 19(2), 338–339."
  - "Berg, J. M., Tymoczko, J. L., & Stryer, L. (2019). Biochemistry (9th ed.). W. H. Freeman."
related:
  - "[[Cellular Respiration]]"
  - "[[Stochastic Biology and Gillespie Kinetics]]"
  - "[[Stiff ODE Integration for Biochemical Kinetics]]"
  - "[[Molecular Docking]]"
tags:
  - science/biochemistry
  - enzymes
  - kinetics
  - michaelis-menten
---

# Enzyme Kinetics

## 1. Concise Explanation
Enzyme kinetics investigates the rates of enzyme-catalyzed chemical transformations and the molecular mechanisms underlying substrate binding, transition-state stabilization, and product release. Enzymes accelerate chemical reactions by reducing activation energy ($\Delta G^\ddagger$) by orders of magnitude ($10^6\text{ to }10^{14}$-fold) without altering overall thermodynamic equilibrium ($\Delta G^\circ$).

---

## 2. Established Scientific Findings
- **Transition State Stabilization:** Catalytic proficiency stems from selective complementary binding to the high-energy reaction transition state rather than the unreacted ground-state substrate.
- **Steady-State Approximation (Briggs-Haldane):** Following an initial transient phase (sub-millisecond), the intermediate enzyme-substrate complex $[ES]$ maintains a quasi-steady state:
  $$\frac{d[ES]}{dt} \approx 0$$
- **Catalytic Parameters:**
  - $V_{\max}$: Asymptotic maximal reaction velocity when all enzyme active sites are fully saturated ($[ES] \to [E]_T$).
  - $K_m$ (Michaelis Constant): The substrate concentration at which velocity is half-maximal ($v_0 = \frac{1}{2} V_{\max}$). Reflects substrate affinity when $k_{-1} \gg k_{\text{cat}}$.
  - $k_{\text{cat}}$ (Turnover Number): The number of substrate molecules converted to product per active site per unit time ($V_{\max} = k_{\text{cat}} [E]_T$).
  - $k_{\text{cat}} / K_m$ (Specificity Constant): Catalytic efficiency for low substrate concentrations ($[S] \ll K_m$). The physical diffusion limit sets an upper bound of $10^8\text{ to }10^9\text{ M}^{-1}\text{s}^{-1}$ ("catalytic perfection", e.g., catalase, triosephosphate isomerase).
- **Inhibition Mechanisms:**
  - *Competitive:* Inhibitor binds active site. $K_m$ increases, $V_{\max}$ is unchanged.
  - *Non-competitive (Allosteric):* Inhibitor binds distinct allosteric site. $V_{\max}$ decreases, $K_m$ is unchanged.
  - *Uncompetitive:* Inhibitor binds only to the $[ES]$ complex. Both $K_m$ and $V_{\max}$ decrease proportionally.

---

## 3. Relevant Equations and Assumptions

### Classic Reaction Scheme
$$E + S \underset{k_{-1}}{\overset{k_1}{\rightleftharpoons}} ES \xrightarrow{k_{\text{cat}}} E + P$$

### Michaelis-Menten Rate Equation
$$v_0 = \frac{V_{\max} [S]}{K_m + [S]} = \frac{k_{\text{cat}} [E]_T [S]}{K_m + [S]}$$
Where:
$$K_m = \frac{k_{-1} + k_{\text{cat}}}{k_1}$$

### Lineweaver-Burk Double Reciprocal Linearization
$$\frac{1}{v_0} = \left(\frac{K_m}{V_{\max}}\right) \frac{1}{[S]} + \frac{1}{V_{\max}}$$

### Reversible Competitive Inhibition
$$v_0 = \frac{V_{\max} [S]}{\alpha K_m + [S]}, \quad \alpha = 1 + \frac{[I]}{K_i}, \quad K_i = \frac{[E][I]}{[EI]}$$

### Key Assumptions
1. Free substrate is in massive molar excess over total enzyme: $[S] \gg [E]_T$.
2. Reverse product reaction is negligible ($[P] \approx 0$, initial rate regime).
3. Homogeneous dilute solution with unhindered Brownian diffusion.

---

## 4. Primary Sources
1. **Michaelis & Menten (1913):** Michaelis, L., & Menten, M. L. *Die Kinetik der Invertinwirkung*. Biochemische Zeitschrift, 49, 333–369.
2. **Briggs & Haldane (1925):** Briggs, G. E., & Haldane, J. B. S. *A Note on the Kinetics of Enzyme Action*. Biochemical Journal, 19(2), 338–339. [DOI: 10.1042/bj0190338](https://doi.org/10.1042/bj0190338)
3. **Berg, Tymoczko, Stryer (2019):** *Biochemistry* (9th ed.). W. H. Freeman. ISBN: 978-1319114671.

---

## 5. Confidence and Limitations
- **High Confidence:** Well-characterized in vitro metabolic enzymes operating in non-cooperative, single-substrate modes.
- **Limitations:**
  - Multi-subunit cooperative enzymes (e.g., hemoglobin, phosphofructokinase) deviate significantly from hyperbolic kinetics, exhibiting sigmoidal behavior described by the Hill equation or MWC model.
  - In low-copy-number cellular compartments ($< 100$ enzyme molecules), continuous deterministic ODEs fail; discrete Gillespie SSA must be used.

---

## 6. Related Obsidian Links
- [[Cellular Respiration]] — Glycolytic and Krebs cycle multi-enzyme cascades.
- [[Stochastic Biology and Gillespie Kinetics]] — Discrete stochastic simulation of enzyme events.
- [[Stiff ODE Integration for Biochemical Kinetics]] — Stiff numerical solvers for coupled enzymatic networks.
- [[Molecular Docking]] — Substrate-enzyme active site binding.

---

## 7. Relevant ATOMICA Implementation Paths
- `src/simulation/EnzymeKinetics.ts` — Continuous Michaelis-Menten rate evaluation for high-concentration metabolic species.
- `src/simulation/GillespieSimulator.ts` — Discrete stochastic reaction channel firing for low-abundance enzymes.
- `tests/simulation/kinetics.test.ts` — Unit test validating rate trajectories against analytical integrated solutions.

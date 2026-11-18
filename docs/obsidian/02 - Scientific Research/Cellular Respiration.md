---
title: Cellular Respiration
type: scientific-reference
domain: biochemistry/physiology
status: verified
created: 2026-11-18
updated: 2026-11-18
sources:
  - "Mitchell, P. (1961). Coupling of phosphorylation to electron and hydrogen transfer by a chemi-osmotic type of mechanism. Nature, 191(4784), 144–148."
  - "Lehninger, A. L., Nelson, D. L., & Cox, M. M. (2021). Lehninger Principles of Biochemistry (8th ed.). Macmillan Learning."
  - "Hinkle, P. C. (2005). P/O ratios of mitochondrial oxidative phosphorylation. Biochimica et Biophysica Acta (BBA) - Bioenergetics, 1706(1–2), 1–11."
related:
  - "[[Enzyme Kinetics]]"
  - "[[Cell Membrane Transport and Osmosis]]"
  - "[[Stiff ODE Integration for Biochemical Kinetics]]"
  - "[[Stochastic Biology and Gillespie Kinetics]]"
tags:
  - science/biochemistry
  - metabolism
  - atp
  - mitochondria
---

# Cellular Respiration

## 1. Concise Explanation
Cellular respiration is the catabolic pathway by which eukaryotic cells oxidize biochemical fuel molecules (primarily glucose) to yield chemical energy stored as adenosine triphosphate (ATP), with carbon dioxide and water produced as byproducts. It couples exergonic substrate oxidation to an electrochemical proton gradient across the inner mitochondrial membrane that drives ATP synthesis via rotational catalysis.

---

## 2. Established Scientific Findings
- **Four Integrated Metabolic Stages:**
  1. *Glycolysis (Cytoplasm):* Glucose ($6\text{C}$) is broken down into 2 Pyruvate ($3\text{C}$), yielding a net of $2\text{ ATP}$ (substrate-level phosphorylation) and $2\text{ NADH}$.
  2. *Pyruvate Dehydrogenase Complex (Mitochondrial Matrix):* Pyruvate undergoes oxidative decarboxylation to Acetyl-CoA ($2\text{C}$), yielding $1\text{ NADH}$ and $1\text{ CO}_2$ per pyruvate.
  3. *Citric Acid / Krebs Cycle (Mitochondrial Matrix):* Acetyl-CoA is fully oxidized; per turn ($2\times$ per glucose), produces $3\text{ NADH}$, $1\text{ FADH}_2$, $1\text{ GTP/ATP}$, and $2\text{ CO}_2$.
  4. *Oxidative Phosphorylation (Inner Mitochondrial Membrane):* Complexes I, III, and IV pump protons from the matrix into the intermembrane space, generating the Proton Motive Force ($\Delta p$). Protons flow back through the $F_0 F_1$ ATP synthase rotary molecular motor.
- **Chemiosmotic Coupling (Peter Mitchell):** ATP synthesis is not driven by high-energy chemical intermediates, but by the physical translocation of protons establishing a transmembrane electrical potential ($\Delta\Psi$) and chemical pH gradient ($\Delta\text{pH}$).
- **Modern Realistic P/O Stoichiometry:** Rather than older theoretical textbook approximations ($36\text{ or }38\text{ ATP}$), experimental P/O ratios yield $2.5\text{ ATP per NADH}$ and $1.5\text{ ATP per FADH}_2$, resulting in an empirical net yield of **$30\text{ to }32\text{ ATP per glucose}$**.

---

## 3. Relevant Equations and Assumptions

### Overall Stoichiometric Mass Balance
$$\text{C}_6\text{H}_{12}\text{O}_6 + 6\text{O}_2 + 30\text{ to }32 (\text{ADP} + \text{P}_i) \longrightarrow 6\text{CO}_2 + 6\text{H}_2\text{O} + 30\text{ to }32\text{ ATP}$$
$$\Delta G^{\circ\prime} = -2870\text{ kJ/mol} \quad (-686\text{ kcal/mol})$$

### Proton Motive Force ($\Delta p$)
The electrochemical potential difference across the inner mitochondrial membrane:
$$\Delta p = \Delta\Psi - \frac{2.303 R T}{F} \Delta\text{pH}$$
At $T = 310.15\text{ K}$ ($37^\circ\text{C}$):
$$\Delta p = \Delta\Psi - (61.5\text{ mV}) \cdot (\text{pH}_{\text{matrix}} - \text{pH}_{\text{intermembrane}})$$
Typical physiological operating values: $\Delta\Psi \approx 160\text{ to }180\text{ mV}$ (matrix negative), $\Delta\text{pH} \approx 0.8\text{ to }1.0$ unit (matrix alkaline), yielding a total driving force:
$$\Delta p \approx 200\text{ to }220\text{ mV}$$

### ATP Synthase Rotary Coupling Ratio
Translocation of approximately $4\text{ H}^+$ is required per synthesized ATP molecule:
- $3\text{ H}^+$ drive the $120^\circ$ rotation of the $c$-ring and catalytic $\gamma$-subunit.
- $1\text{ H}^+$ is consumed by the electro-neutral $\text{H}_2\text{PO}_4^- / \text{H}^+$ symporter importing inorganic phosphate into the matrix.

---

## 4. Primary Sources
1. **Chemiosmotic Hypothesis:** Mitchell, P. (1961). *Coupling of phosphorylation to electron and hydrogen transfer by a chemi-osmotic type of mechanism*. Nature, 191(4784), 144–148. [DOI: 10.1038/191144a0](https://doi.org/10.1038/191144a0)
2. **Lehninger Principles:** Lehninger, A. L., Nelson, D. L., & Cox, M. M. (2021). *Lehninger Principles of Biochemistry* (8th ed.). Macmillan Learning. ISBN: 978-1319228002.
3. **P/O Ratio Quantitation:** Hinkle, P. C. (2005). *P/O ratios of mitochondrial oxidative phosphorylation*. BBA - Bioenergetics, 1706(1–2), 1–11. [DOI: 10.1016/j.bbabio.2004.09.004](https://doi.org/10.1016/j.bbabio.2004.09.004)

---

## 5. Confidence and Limitations
- **High Confidence:** Enzyme kinetics of individual steps, structural resolution of $F_0 F_1$ ATP synthase, and stoichiometric consumption of $\text{O}_2$.
- **Limitations:**
  - Non-specific proton leak across the inner mitochondrial membrane and active uncoupling proteins (UCP1 / thermogenin in brown fat) dissipate the proton gradient as heat, varying net yield between 26 and 32 ATP depending on physiological state.
  - Compartmental transport shuttles (Malate-Aspartate shuttle vs. Glycerol-3-Phosphate shuttle) alter the ATP yield of cytosolic NADH.

---

## 6. Related Obsidian Links
- [[Enzyme Kinetics]] — Catalytic regulation of PFK-1, Isocitrate Dehydrogenase, and ATP synthase.
- [[Cell Membrane Transport and Osmosis]] — Membrane potential and proton translocation.
- [[Stiff ODE Integration for Biochemical Kinetics]] — Stiff numerical simulation of coupled metabolite concentrations.
- [[Stochastic Biology and Gillespie Kinetics]] — Fluctuations in low-copy-number mitochondrial regulatory factors.

---

## 7. Relevant ATOMICA Implementation Paths
- `src/simulation/CellularRespiration.ts` — Stoichiometric flux balance and kinetic differential equations for glycolysis, Krebs cycle, and oxidative phosphorylation.
- `src/anatomy/HierarchyTree.ts` — Structural organelle mapping for Mitochondria (outer membrane, intermembrane space, cristae, matrix).
- `tests/simulation/respiration.test.ts` — Unit test suite verifying mass balance and ATP production per consumed glucose molecule.

---
title: "Adaptive Systems — Panel D: Biological Roots"
department: adaptive-systems
panel: D
status: proposed
concept_tags: [receptor-kinetics, net-shift, weber-fechner, tachyphylaxis, markov-blanket, free-energy, active-inference, variational-inference]
language_registers: [Python, Unison, Lisp]
cross_panel_links: [A-behavioural-roots, B-control-theoretic-roots, C-physical-systems-roots]
primary_citations:
  - "Weber, E. H. (1834). De Pulsu, Resorptione, Auditu et Tactu. Leipzig: Koehler."
  - "Lanzara, R. G. (2023). Origins of Life's Sensoria. Appendix III; Ch. 7. ISBN 978-1-7335981-1-8."
  - "Friston, K. (2010). The free-energy principle: a unified brain theory? Nature Reviews Neuroscience 11(2):127–138."
  - "Friston, K., Schwartenbeck, P., FitzGerald, T., Moutoussis, M., Behrens, T., & Dolan, R. J. (2013). The anatomy of choice: active inference and agency. Frontiers in Human Neuroscience 7:598."
  - "Kirchhoff, M., Parr, T., Palacios, E., Friston, K., & Kiverstein, J. (2018). The Markov blankets of life: autonomy, active inference and the free energy principle. J. R. Soc. Interface 15:20170792."
  - "Zhang, X., et al. (2026). arXiv:2604.14585v1."
---

# Panel D — Biological Roots

## 1. Historical Framing

The biological roots of adaptive systems theory reach back to the earliest quantitative studies of sensory response — the observation that biological receptors do not report stimulus magnitude directly but respond to relative change. This logarithmic compression is not an accident of biological history; Lanzara (2023) derives it as the necessary consequence of two-state receptor kinetics. The derivation connects nineteenth-century psychophysics (Weber 1834) to twentieth-century pharmacology (receptor occupancy models) to twenty-first century computational neuroscience (Friston 2010; Kirchhoff et al. 2018).

**Weber's law (Weber 1834).** Ernst Heinrich Weber's experiments on weight discrimination, tactile pressure, and auditory pitch established the empirical regularity: the just-noticeable difference (JND) in a stimulus is proportional to the baseline stimulus magnitude. If a subject can detect a change of 1 gram added to a 100-gram weight, they require 10 grams added to a 1000-gram weight to detect the same difference. The JND / baseline ratio is approximately constant. Fechner (1860) integrated this to obtain the logarithmic law: perceived magnitude Ψ = k · log(S / S_0), where S is the physical stimulus intensity and S_0 is the detection threshold. This is the Weber-Fechner law.

For a century, Weber-Fechner was a phenomenological fit — a convenient description with no mechanistic derivation. Lanzara (2023) changed this.

## 2. Net-Shift Receptor Kinetics (Lanzara 2023)

**Two-state receptor model.** Lanzara (2023, Appendix III) models a receptor population as having two states: a high-affinity state H (binding constant K_H) and a low-affinity state L (binding constant K_L, where K_H > K_L). A ligand L at concentration [L] binds to both states. The fraction of receptors occupied in each state follows the Hill equation for simple 1:1 binding:

```
R_H([L]) = K_H · [L] / (1 + K_H · [L])
R_L([L]) = K_L · [L] / (1 + K_L · [L])
```

The total fractional occupancy and the net shift (the difference between high- and low-affinity occupancy, weighted by total receptor number R_T) are:

```
ΔR_H = R_T · K_H · [L] / (1 + K_H·[L]) − R_T · K_L · [L] / (1 + K_L·[L])
      = R_T · [L] · (K_H − K_L) / ((1 + K_H·[L]) · (1 + K_L·[L]))
```

**Recovery of Weber-Fechner.** In the mid-concentration range where K_L·[L] << 1 << K_H·[L], the net-shift equation approximates:

```
ΔR_H ≈ R_T · (K_H − K_L) / (K_H · [L])
```

which is a 1/[L] function of ligand concentration — equivalently, ΔR_H is proportional to log([L]) over a range. This is the Weber-Fechner law recovered as a mechanistic consequence of two-state receptor kinetics, rather than as a phenomenological curve fit.

The net-shift signal ΔR_H is the differential signal the receptor sends to the cell: not "how much ligand is bound" (total occupancy) but "how much more is bound to the high-affinity state than the low-affinity state." Biological sensory systems transmit this differential signal rather than absolute occupancy, which is why they are selective for changes rather than sustained levels.

**Tachyphylaxis — biological adaptive parameter drift.** Under sustained ligand exposure, the receptor population undergoes conformational change: K_H shifts toward K_L (high-affinity state desensitises). The net-shift ΔR_H decreases even though [L] is unchanged. This is tachyphylaxis: tolerance. It is a biological form of the adaptive parameter drift that Panel B's robustness theorems guard against: the plant parameters (K_H, K_L) have drifted, and the net-shift signal has consequently changed in ways not attributable to the stimulus. The self-tuning regulator in Panel B is the engineering solution; tachyphylaxis is the biological instantiation of the problem.

## 3. Markov Blanket Formalism (Kirchhoff et al. 2018)

**Definition.** Kirchhoff, Parr, Palacios, Friston & Kiverstein (2018) formalised the Markov blanket partition for biological systems. A Markov blanket of a set of nodes I in a Bayesian network is the set of nodes that renders I conditionally independent of all other nodes. For a biological system, the partition is:

```
{E, S, A, I}
```

where:
- **I** = internal states (intracellular signalling, metabolism, gene expression)
- **E** = external states (ligand concentration, temperature, predator position)
- **S** = sensory states (receptor occupancy — the boundary that "reads" E and transmits to I)
- **A** = active states (motor output, secretion, migration — the boundary through which I acts on E)

The key theorem (Kirchhoff et al. 2018, §2): **persistence implies blanket**. Any system that maintains a characteristic distribution over its internal states over time necessarily possesses a Markov blanket. The blanket is not a design choice imposed by a designer; it is a structural consequence of persistence. A cell has a blanket because it is a cell; a skill-activation system has a blanket because it is a persistent system that maintains a characteristic behaviour distribution.

The Markov blanket formalism gives a formal vocabulary for the intuition in Panel B's MRAS framework: the "plant" and "reference model" are on opposite sides of a blanket. The tracking error e(t) = x(t) − x_m(t) is the information that crosses the sensory surface of the blanket.

## 4. Variational Free Energy (Friston 2010)

**Free energy decomposition.** Friston (2010) proposed that biological neural systems minimise a quantity called variational free energy F. Given:
- An internal model q(I) maintained by the biological system over its internal states
- A generative model p(I, S) of the joint distribution of internal and sensory states
- Sensory data S

The variational free energy is:

```
F = D_KL[q(I) || p(I|S)] − log p(S)
```

where D_KL is the Kullback-Leibler divergence. Since D_KL ≥ 0, we have F ≥ −log p(S): minimising F upper-bounds the surprise −log p(S) (the negative log probability of the sensory data under the generative model). A system that minimises F is, in an upper-bound sense, minimising surprise about its sensory inputs.

**Decomposition into accuracy and complexity.** Equivalently:

```
F = E_q[−log p(S|I)] + D_KL[q(I) || p(I)]
```

The first term is the **accuracy** term: how well does the internal model predict the sensory data? The second term is the **complexity** term: how much does the posterior q(I) differ from the prior p(I)? A system that minimises F trades off accuracy (good prediction of current sensory data) against complexity (staying close to the prior). This is structurally identical to the regularised loss in machine learning: task loss (accuracy) + regularisation penalty (complexity / KL from prior).

**Connection to receptor kinetics.** The net-shift signal ΔR_H from §2 is the sensory state S in the Friston decomposition: it is the differential signal that crosses the blanket from external (ligand concentration E) to internal (receptor-mediated cellular signalling I). Tachyphylaxis updates the receptor parameters K_H and K_L — updating the generative model p(S|I) — in response to sustained sensory input. The cell is performing approximate Bayesian inference: updating its internal model to minimise the free energy of its current sensory situation.

## 5. Active Inference (Friston et al. 2013)

**Active states minimise expected free energy.** Friston, Schwartenbeck, FitzGerald et al. (2013) extended the free-energy framework to action. In the Markov blanket formalism, active states A are the outputs through which the internal system I acts on the external world E. Active inference chooses A to minimise the expected future free energy:

```
G(π) = E_π[F(τ)]  summed over future time τ under policy π
```

where π is a policy (a mapping from beliefs to actions). Minimising G decomposes into:
- **Pragmatic value:** choose A to move the system toward states where the generative model predicts high reward (equivalently, high probability under p(I)).
- **Epistemic value:** choose A to reduce uncertainty about the external states E (information-seeking behaviour, analogous to exploration in Panel A's actor-critic).

The active-inference framework unifies perception (minimising F: updating q(I) to match sensory data S) and action (minimising G: choosing A to make S match the internal model's predictions) under a single optimisation objective. This is the biological analogue of the MRAS system in Panel B: the reference model is p(I|S) (what the system expects to experience); the plant output is S (what it actually experiences); the tracking error drives both internal-model update (perception) and plant input selection (action).

## 6. Connection to Shipped ME-1, ME-5, and ME-4 Components

**ME-1 (tractability classifier).** ME-1 implements a tractability classifier that determines whether a given computation is within the system's processing budget. The connection to Panel D: Zhang et al. (2026, arXiv:2604.14585v1) finds that the RLHF-compression bottleneck is a tractability constraint — the system cannot represent arbitrarily complex reward functions. ME-1's tractability classifier is the engineering instantiation of the biological attention mechanism that prioritises computationally tractable components of the free-energy sum for update.

**ME-5 (output structure).** ME-5's `output_structure` frontmatter field operationalises the "can-but-doesn't" pattern: a skill that is tractable (passes ME-1's gate) but which the system has learned not to activate in the current context. This is the adaptive critic's contribution: a value function that has learned when suppression is correct. Panel D's active-inference framework explains why suppression is rational — minimising G may require withholding an action whose pragmatic value is high but whose epistemic cost (uncertainty introduced into the blanket) is higher.

**ME-4 (coin-flip warnings).** ME-4's coin-flip warnings flag outputs where the system's confidence is near chance level. Panel D's free-energy framework explains the interpretive structure: a coin-flip output maximises epistemic free energy (the system is maximally uncertain about which belief best matches the data). ME-4's warnings are the engineering-layer signal that the internal model q(I) is a poor fit to the current sensory data S — the system is experiencing high surprise, and the free-energy term is dominated by accuracy penalty rather than complexity penalty.

## 7. Cross-Panel Connections

**→ Panel A (Behavioural Roots).** The actor in Barto 1983 (Panel A) maps to the A-states in Kirchhoff's partition: the actor selects actions. The critic in Barto 1983 maps to the free-energy objective in Panel D: the critic's value function V(s) is a proxy for the negative expected free energy −G(s) under the internal model. The TD error δ in Panel A is the sensory prediction error in Panel D: both measure the discrepancy between predicted and actual state.

**→ Panel B (Control-Theoretic Roots).** The MRAS tracking error e(t) = x(t) − x_m(t) in Panel B is the prediction error that the free-energy framework in Panel D minimises. The reference model x_m in Panel B corresponds to the prior p(I) in Panel D. The MRAS Lyapunov function V(e, θ̃) corresponds to the variational free energy F: both are scalar functions that the adaptive system drives toward zero through parameter update.

**→ Panel C (Physical-Systems Roots).** The Gibbs energy E(θ) in Panel C and the variational free energy F in Panel D are the same mathematical structure: a scalar function of a probability distribution that the system drives toward a minimum. The noise-as-temperature framework (Panel C) explains why biological systems that minimise free energy are not trapped in local minima: thermal noise from molecular-scale fluctuations provides the exploration that allows the receptor-kinetics system to sample multiple binding configurations and find the one that minimises free energy.

## 8. Primary Sources

1. Weber, E. H. (1834). *De Pulsu, Resorptione, Auditu et Tactu.* Leipzig: Koehler. — Original just-noticeable-difference law; log-linear psychophysical response.
2. Lanzara, R. G. (2023). *Origins of Life's Sensoria: Endless Discoveries Most Fascinating — Emergence, Receptors, Perception and Consciousness.* ISBN 978-1-7335981-1-8. Appendix III (net-shift derivation); Ch. 7 (Quintessence five-axis frame). — Two-state receptor kinetics; Weber-Fechner mechanistic derivation; tachyphylaxis.
3. Friston, K. (2010). The free-energy principle: a unified brain theory? *Nature Reviews Neuroscience* 11(2):127–138. DOI: 10.1038/nrn2787. — F = D_KL − E_q decomposition; {E, S, A, I} blanket partition; Fig. 1 accuracy/complexity split.
4. Friston, K., Schwartenbeck, P., FitzGerald, T., Moutoussis, M., Behrens, T., & Dolan, R. J. (2013). The anatomy of choice: active inference and agency. *Frontiers in Human Neuroscience* 7:598. DOI: 10.3389/fnhum.2013.00598. — G(π) expected future free energy; pragmatic vs. epistemic value; action as inference.
5. Kirchhoff, M., Parr, T., Palacios, E., Friston, K., & Kiverstein, J. (2018). The Markov blankets of life: autonomy, active inference and the free energy principle. *J. R. Soc. Interface* 15:20170792. DOI: 10.1098/rsif.2017.0792. §2–3: partition; persistence-implies-blanket proof.
6. Zhang, X., et al. (2026). arXiv:2604.14585v1. — RLHF-compression tractability connection; ME-1 primary citation.
7. Shipped ME-1, ME-5, ME-4 proposals — engineering instantiation of Panel D theory in gsd-skill-creator Living Sensoria stack.

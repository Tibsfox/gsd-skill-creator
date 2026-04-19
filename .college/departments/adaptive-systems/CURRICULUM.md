# Adaptive Systems Department — Curriculum

**Domain:** adaptive-systems  
**Status:** Proposed  
**Entry requirement:** None formal. Arc B (control) benefits from Mathematics Department Calculus wing. Arc D (biological) benefits from Psychology Department Behavior & Mental Health wing.

## Overview

The four panels of the Adaptive Systems department are self-contained treatments of four distinct theoretical lineages. Each panel can be studied independently, but the panels are designed to be read as a sequence: the behavioural roots (Panel A) motivate the engineering formalisation (Panel B), the physical-systems roots (Panel C) explain why neural implementations of adaptive control behave the way they do, and the biological roots (Panel D) ground the whole enterprise in mechanistic receptor biology and variational inference.

The curriculum offers three arcs depending on entry background.

---

## Arc A — Engineering Track

For learners with control-systems or machine-learning backgrounds who want the formal machinery first and the biological motivation second.

**Sequence:** Panel B → Panel A → Panel C → Panel D

1. **Panel B (Control-Theoretic Roots)** — Start with Lyapunov stability and MRAS. Establishes the formal vocabulary: Lyapunov function V(x), model-reference error e(t), update law dθ/dt, exponential stability.
2. **Panel A (Behavioural Roots)** — Read Barto 1983 as the RL instantiation of the Panel B update-law pattern. ASE = actor (plant-side parameter update); ACE = critic (reference-signal generator). Shows that the RL actor-critic is an MRAS with stochastic policy and function-approximated value.
3. **Panel C (Physical-Systems Roots)** — NTK explains what happens in the infinite-width / large-batch limit: the actor-critic reduces to a kernel method. Noise-as-temperature explains why small-batch training with moderate learning rate is superior to both extremes.
4. **Panel D (Biological Roots)** — Friston's free energy is the variational form of the Panel B tracking error: minimising F is minimising the KL divergence between the internal model and the sensory data, which is structurally identical to MRAS error minimisation. Kirchhoff's blanket formalism provides the partition that Panel B's reference model / plant separation assumes.

**Arc A co-requisite:** Mathematics Department — Calculus wing (exponential growth/decay), Complex Analysis wing (Euler's formula for spectral decomposition).

---

## Arc B — Behavioural Science Track

For learners from psychology, behavioural economics, or biology who want the empirical foundations first and the engineering formalisation as the payoff.

**Sequence:** Panel A → Panel D → Panel B → Panel C

1. **Panel A (Behavioural Roots)** — Start with Pavlov and Skinner. Establishes the empirical phenomena: conditioned stimulus, operant contingency, schedules of reinforcement. Then reads Barto 1983 as the mathematical bridge: the ASE weight vector is the operant contingency table formalised; the ACE is the expectation of future reward (Skinner's discriminative stimulus, formalised as a value function).
2. **Panel D (Biological Roots)** — Weber-Fechner (1834) and Lanzara (2023) extend the Panel A learning story into receptor biology. The net-shift equation shows that biological adaptation (tachyphylaxis) is the same parameter-update pattern as RL, implemented in receptor kinetics. Friston's free energy unifies perception and action under a single optimisation.
3. **Panel B (Control-Theoretic Roots)** — MRAS and Lyapunov stability are the engineering proofs that the Panel A and Panel D update rules converge. If the update law is derived from a Lyapunov function, the system is provably stable — the behavioural learning will not diverge.
4. **Panel C (Physical-Systems Roots)** — NTK and mean-field show what happens when the adaptive system is a neural network. The finite-width regime is where genuine feature learning occurs; the infinite-width / NTK regime is where the system collapses to a similarity machine.

**Arc B cross-links:** Psychology Department (Behavior & Mental Health wing: `psych-learning-theory`, `psych-behavior-reinforcement`); Mind-Body Department (Relaxation wing: homeostasis, interoception).

---

## Arc C — Physical Systems Track

For learners from statistical physics, thermodynamics, or information theory who want to understand neural-network training as a physical process.

**Sequence:** Panel C → Panel B → Panel A → Panel D

1. **Panel C (Physical-Systems Roots)** — Start with mean-field theory as the physical parent of NTK. Establish the infinite-width limit (NTK regime, fixed kernel) vs. finite-width regime (representation learning). Noise-as-temperature: training noise is a thermodynamic quantity; the learning rate schedule is a cooling schedule; simulated annealing (Kirkpatrick et al. 1983) is the original engineering instantiation.
2. **Panel B (Control-Theoretic Roots)** — Lyapunov stability is the control-theoretic analogue of the physical stability condition. The Lyapunov function V(x) is the energy of the system; the Lyapunov stability condition dV/dt ≤ 0 is the condition that energy is non-increasing. MRAS gives constructive update laws that satisfy this condition.
3. **Panel A (Behavioural Roots)** — Barto 1983 as the RL instantiation: actor-critic is a two-timescale update (fast critic, slow actor) that satisfies the Lyapunov stability conditions under appropriate step-size schedules. The temporal-difference error δ is the gradient of the implicit Lyapunov function.
4. **Panel D (Biological Roots)** — Free energy (Friston 2010) is the variational Bayesian version of the Panel C energy function. Variational free energy F = D_KL[q(I) || p(I|S)] − E_q[log p(S|I)] decomposes into complexity (KL term, analogous to regularisation in neural training) and accuracy (likelihood term, analogous to task loss). Biological systems minimise F; neural networks minimise a sum of task loss and regularisation.

**Arc C cross-links:** Culinary-Arts Department (Thermodynamics wing: `cook-specific-heat-capacity`, noise-as-temperature analogy).

---

## Concepts by Panel

### Panel A — Behavioural Roots

| Concept ID | Description |
|-----------|-------------|
| adapt-classical-conditioning | Pavlov 1927: stimulus-response pairing as parameter update |
| adapt-instrumental-conditioning | Skinner 1938: reward-contingent response selection |
| adapt-eligibility-traces | Klopf 1972; Sutton 1988: credit assignment over time |
| adapt-actor-critic-genesis | Barto et al. 1983 ASE/ACE: the actor-critic architecture |
| adapt-temporal-difference | TD error δ = r + γV(s') − V(s): the update signal |

### Panel B — Control-Theoretic Roots

| Concept ID | Description |
|-----------|-------------|
| adapt-lyapunov-stability | Lyapunov 1892: V(x) ≥ 0, dV/dt ≤ 0 stability certificate |
| adapt-kalman-filtering | Recursive Bayesian state estimation under Gaussian noise |
| adapt-mras | Sastry & Bodson 1989 Ch. 3: model-reference adaptive systems |
| adapt-self-tuning-regulator | Sastry & Bodson 1989 Ch. 5: online plant identification + control |
| adapt-exponential-stability | Robustness under bounded disturbances (Sastry & Bodson 1989 Ch. 6) |

### Panel C — Physical-Systems Roots

| Concept ID | Description |
|-----------|-------------|
| adapt-mean-field | Statistical mechanics: particles see averaged field, not explicit neighbours |
| adapt-ntk | Jacot et al. 2018: infinite-width linearisation; kernel fixed at initialisation |
| adapt-similarity-machine | CompuFlair 2026: NTK limit as feature-retrieval rather than feature-learning |
| adapt-noise-as-temperature | Welling & Teh 2011 SGLD; Kirkpatrick et al. 1983: training noise is thermal |
| adapt-cooling-schedule | Simulated annealing cooling as learning-rate schedule |

### Panel D — Biological Roots

| Concept ID | Description |
|-----------|-------------|
| adapt-net-shift | Lanzara 2023 App. III: two-state receptor kinetics, net-shift derivation |
| adapt-weber-fechner | Weber 1834: log-linear psychophysical response law |
| adapt-markov-blanket | Kirchhoff et al. 2018: {E, S, A, I} partition; persistence implies blanket |
| adapt-free-energy | Friston 2010: F = D_KL − E_q; minimisation bounds surprise |
| adapt-active-inference | Friston et al. 2013: action chosen to minimise expected future free energy |

## Primary Texts

- Barto, A. G., Sutton, R. S., & Anderson, C. W. (1983). *IEEE Trans. SMC* 13(5):834–846.
- Sastry, S., & Bodson, M. (1989). *Adaptive Control: Stability, Convergence, and Robustness.* Prentice-Hall.
- Friston, K. (2010). *Nature Reviews Neuroscience* 11(2):127–138.
- Kirchhoff, M. et al. (2018). *J. R. Soc. Interface* 15:20170792.
- Lanzara, R. G. (2023). *Origins of Life's Sensoria.* Appendix III; Ch. 7.
- Jacot, A., Gabriel, F., & Hongler, C. (2018). *NeurIPS 2018.* arXiv:1806.07572.
- Kirkpatrick, S., Gelatt, C. D., & Vecchi, M. P. (1983). *Science* 220:671–680.
- Weber, E. H. (1834). *De Pulsu, Resorptione, Auditu et Tactu.* Leipzig: Koehler.
- Pavlov, I. P. (1927). *Conditioned Reflexes.* Oxford.
- Skinner, B. F. (1938). *The Behavior of Organisms.* Appleton-Century.

---
title: "Adaptive Systems — Panel C: Physical-Systems Roots"
department: adaptive-systems
panel: C
status: proposed
concept_tags: [mean-field, neural-tangent-kernel, ntk, noise-as-temperature, simulated-annealing, sgld, infinite-width, representation-learning]
language_registers: [Python, C++, Unison]
cross_panel_links: [B-control-theoretic-roots, D-biological-roots]
primary_citations:
  - "Kirkpatrick, S., Gelatt, C. D., & Vecchi, M. P. (1983). Optimization by simulated annealing. Science 220:671–680."
  - "Jacot, A., Gabriel, F., & Hongler, C. (2018). Neural tangent kernel: convergence and generalization in neural networks. NeurIPS 2018. arXiv:1806.07572."
  - "Lee, J., Xiao, L., Schoenholz, S. S., et al. (2019). Wide neural networks of any depth evolve as linear models under gradient descent. NeurIPS 2019."
  - "Welling, M., & Teh, Y. W. (2011). Bayesian learning via stochastic gradient Langevin dynamics. ICML 2011."
  - "CompuFlair / Borzou, A. (2026). The Bizarre Paradox of Neural Nets Explained by Physics. YouTube."
---

# Panel C — Physical-Systems Roots

## 1. Historical Framing

Statistical physics provides the third theoretical root for adaptive systems. Where Panel A works at the level of behaviour and reward, and Panel B at the level of control engineering and stability proofs, Panel C works at the level of energy landscapes — treating a neural network's training dynamics as a physical process governed by thermodynamic principles. The central insight is that the concepts of temperature, phase transition, and equilibrium from statistical mechanics apply directly to gradient-based optimisation.

**The Gibbs distribution.** A physical system in thermal equilibrium at temperature T occupies each state s with probability proportional to the Boltzmann factor:

```
p(s) ∝ exp(−E(s) / kT)
```

where E(s) is the energy of state s and k is Boltzmann's constant. At low temperature (T → 0), probability concentrates on the lowest-energy state: the system is trapped in its global minimum. At high temperature (T → ∞), probability is uniform: all states are equally likely. Temperature controls the width of exploration around the current minimum.

Neural network training is governed by the same structure. The loss function L(θ) plays the role of energy; the parameter vector θ plays the role of the system state. At each step, gradient descent moves θ toward lower L, but stochastic gradient noise — arising from mini-batch sampling — perturbs the trajectory randomly. This noise is thermal: it introduces a temperature-like parameter into the optimisation.

## 2. Mean-Field Theory

Mean-field theory is a statistical-mechanics approximation that replaces explicit particle-particle interactions with interactions against an averaged field. In a ferromagnet, each spin interacts with all other spins; mean-field replaces the sum over neighbours with a single effective field equal to the average magnetisation. The approximation is exact in the infinite-population limit (all-to-all coupling) and provides tractable equations for large-but-finite systems.

The relevance to neural networks: an infinite-width neural network has infinite all-to-all coupling among neurons within each layer. In this limit, the mean-field approximation is exact. Each neuron in a given layer sees an effective field equal to the average activation of all neurons, independent of which specific neurons are active. The result is a set of equations describing the network's training dynamics without tracking individual neurons — only their statistics.

Mean-field theory for neural networks establishes two important results:
1. In the infinite-width limit, the distribution over network outputs is Gaussian at initialisation (central limit theorem over the contribution of each neuron).
2. The training dynamics linearise around this Gaussian — which is the foundation for the Neural Tangent Kernel result below.

## 3. Neural Tangent Kernel

Jacot, Gabriel & Hongler (2018) proved that in the infinite-width limit, a neural network's training dynamics under gradient descent are governed by a fixed kernel — the Neural Tangent Kernel (NTK).

**Definition.** Let f(x; θ) be the network output on input x with parameters θ. The NTK is:

```
K(x, x') = ⟨∇_θ f(x; θ), ∇_θ f(x'; θ)⟩
```

the inner product of the gradient vectors of the network output with respect to all parameters. At initialisation θ_0, this is a fixed function of the inputs x and x' — it does not depend on θ (in the infinite-width limit).

**Consequence.** Under gradient descent on the mean squared error loss:

```
dθ/dt = −∇_θ L(θ)
```

the network output evolves as:

```
df/dt = −K · (f − y*)
```

where y* is the target. This is a linear ODE in function space — it has the closed-form solution:

```
f(t) = y* + (I − exp(−K·t)) · (f(0) − y*)
```

The network converges to the kernel regression solution at a rate determined by the eigenvalues of K. The feature representation (what the network uses to map inputs to outputs) does not change during training — only the output coefficients change. The network is reweighting a fixed library of features defined by its random initialisation.

**The similarity-machine framing (CompuFlair 2026, §08:29–11:58).** The NTK result means that an overparameterised neural network in the infinite-width (NTK) regime is not learning a representation of the data — it is performing kernel regression with a fixed kernel defined by the network architecture and initialisation. CompuFlair terms this a "similarity machine": the network answers the question "how similar is the test input to the training inputs under the initialisation-defined metric?" rather than "what abstract features are useful for this task?"

Lee et al. (2019) extended the NTK result to wide-but-finite networks and gradient descent variants, showing that the linearisation holds approximately for a large class of practical architectures.

## 4. Noise-as-Temperature

**Stochastic gradient Langevin dynamics (Welling & Teh 2011).** The stochastic gradient descent update with step size η is:

```
θ(t+1) = θ(t) − η · ∇L̃(θ(t)) + ε(t),   ε(t) ~ N(0, η²·σ²)
```

where ∇L̃ is the mini-batch gradient estimate and ε(t) is the gradient noise from mini-batch sampling. Welling & Teh (2011) showed that this is a discretisation of the Langevin stochastic differential equation:

```
dθ = −∇L(θ) dt + √(2T) dW
```

where T = η·σ²/2 is an effective temperature and W is a Wiener process. In this formulation, the mini-batch noise is thermal fluctuation; the step size and batch size jointly determine the effective temperature of the optimiser.

**Simulated annealing (Kirkpatrick et al. 1983).** Before the stochastic gradient Langevin connection was formalised, Kirkpatrick, Gelatt & Vecchi (1983) introduced simulated annealing as an optimisation algorithm for combinatorial problems. The algorithm:

1. Start at high temperature T_0: accept any move with probability exp(−ΔE / T_0), including uphill moves.
2. Slowly reduce temperature according to a cooling schedule T(t).
3. At low T: only downhill moves accepted; system settles in a local minimum near the global minimum.

The connection to neural network training: gradient descent with decaying learning rate is stochastic annealing in the loss landscape. The learning rate η plays the role of temperature. A large initial learning rate (high temperature) allows the optimiser to escape shallow local minima; reducing the learning rate (cooling) causes the optimiser to settle into the basin it currently occupies.

**CompuFlair 2026 (§13:25) noise-as-temperature synthesis.** The CompuFlair video synthesises the NTK and noise-as-temperature results into a unified picture:

- In the NTK regime (infinite width, infinitesimally small learning rate), the network has zero effective temperature: it descends the loss surface exactly and converges to the kernel regression solution. No basin-hopping occurs.
- In the finite-width regime with nonzero learning rate, the network has nonzero temperature: it can escape shallow minima and discover basin structures that the zero-temperature trajectory would miss.
- The tradeoff: too high a temperature (too large a learning rate, too small a batch) and the gradient signal is drowned in noise — the optimiser random-walks rather than descends. Too low a temperature and the optimiser is trapped in the first basin it finds.

The practical optimum is a cooling schedule that starts at moderate temperature and reduces it as training progresses — exactly the learning-rate warmup-and-decay schedules used in modern transformer training.

## 5. Phase Transitions and the Culinary Analogy

The noise-as-temperature framework makes the culinary analogy in the Culinary Arts Department cross-reference precise rather than metaphorical.

The Maillard reaction (browning) has an onset temperature of approximately 140°C. Below this temperature, the reaction rate is negligible; above it, the reaction proceeds rapidly. This is a phase transition: the system shifts from one qualitative regime (raw food surface) to another (browned crust) at a critical temperature.

Neural network training exhibits analogous phase transitions:
- Below a critical learning rate / noise level: the network remains in the NTK regime — kernel regression, no feature learning.
- Above a critical learning rate: the network enters the finite-width / representation-learning regime — genuine feature reshaping occurs.

Both transitions are thermodynamic in structure: a control parameter (temperature; learning rate) crosses a threshold and the system's qualitative behaviour changes. The Culinary Arts Thermodynamics wing — `cook-specific-heat-capacity` and `cook-newtons-cooling` — provides the pedagogically accessible version of this physics.

## 6. Connection to Shipped MD-1, MD-3, MD-4 Components

The Living Sensoria second-wave proposals in Bundle D address physical-systems topics directly:

- **MD-1 (embeddings):** The embedding layer of gsd-skill-creator operates in the NTK or finite-width regime depending on the model scale and fine-tuning procedure. MD-1's treatment of embedding retrieval vs. embedding learning is the operational version of the NTK vs. finite-width distinction.
- **MD-3 (Langevin dynamics):** MD-3 implements stochastic gradient Langevin dynamics as a training temperature schedule for the adaptive learning components. The Welling & Teh (2011) update rule from §4 above is the theoretical foundation.
- **MD-4 (temperature schedule):** MD-4 defines the cooling schedule for MD-3's Langevin dynamics — the annealing curve that takes the system from exploration (high temperature) to exploitation (low temperature). Kirkpatrick et al. (1983) is the primary citation for the schedule design principles.

## 7. Cross-Panel Connections

**→ Panel B (Control-Theoretic Roots).** The Lyapunov function V from Panel B is the control-theoretic analogue of the energy function E from Panel C. The condition dV/dt ≤ 0 (Panel B stability) is the deterministic zero-temperature version of the simulated annealing convergence guarantee (Panel C): both assert that the system's "energy" decreases monotonically along the trajectory.

**→ Panel D (Biological Roots).** The free energy F in Friston's framework (Panel D) is the variational Bayesian version of the Gibbs energy. The KL divergence D_KL[q||p] in the free-energy decomposition is the information-theoretic energy function; minimising F is minimising this energy. The biological systems in Panel D operate in the same thermodynamic framework as the neural optimisers in Panel C.

## 8. Primary Sources

1. Kirkpatrick, S., Gelatt, C. D., & Vecchi, M. P. (1983). Optimization by simulated annealing. *Science* 220(4598):671–680. DOI: 10.1126/science.220.4598.671. — Temperature schedule; Boltzmann acceptance criterion; cooling to global minimum.
2. Jacot, A., Gabriel, F., & Hongler, C. (2018). Neural tangent kernel: convergence and generalization in neural networks. *NeurIPS 2018.* arXiv:1806.07572. — NTK definition; infinite-width linearisation; kernel regression convergence.
3. Lee, J., Xiao, L., Schoenholz, S. S., et al. (2019). Wide neural networks of any depth evolve as linear models under gradient descent. *NeurIPS 2019.* — NTK extension to finite-but-wide networks; practical validity range.
4. Welling, M., & Teh, Y. W. (2011). Bayesian learning via stochastic gradient Langevin dynamics. *ICML 2011.* — SGLD; noise-as-temperature formalisation; Langevin SDE connection.
5. CompuFlair / Borzou, A. (2026). *The Bizarre Paradox of Neural Nets Explained by Physics.* YouTube. §08:29 NTK; §11:58 Mean-field; §13:25 Noise as training temperature; §19:52 Different types of infinite limits. — Synthesis and similarity-machine framing.
6. Shipped MD-1, MD-3, MD-4 proposals — engineering instantiation of Panel C theory in gsd-skill-creator Living Sensoria second-wave stack.

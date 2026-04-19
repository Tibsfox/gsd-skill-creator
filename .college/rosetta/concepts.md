---
title: "Living Sensoria — Canonical Concept Definitions"
concept_axes: [gradient_descent, equilibrium_homeostasis, noise_as_exploration, feedback_loop, specialised_composition, boundary_condition]
status: proposed
authors: [TC-rosetta-translations Phase 673 EXEC-R-19]
dates: [2026-04-19]
---

# Living Sensoria — Canonical Concept Definitions

Six central concepts used throughout the Rosetta translation table (`translations.md`). Each entry provides the canonical definition, the primary source, and the cluster where the concept has its primary home in the gsd-skill-creator research catalog.

---

## 1. Gradient Descent

**Primary cluster:** AI / SST (Cluster 12)

**Canonical definition.** Gradient descent is a first-order iterative optimisation procedure in which a parameter vector θ is updated by stepping in the direction opposite to the gradient of a scalar loss function L(θ): θ ← θ − η ∇L(θ), where η > 0 is the step size (learning rate). The procedure is guaranteed to reduce L locally at each step and, under convexity, converges to the global minimum. In stochastic variants (SGD, mini-batch) the true gradient ∇L is replaced by a noisy estimate computed over a subset of data; the noise term is equivalent to a temperature parameter in the Langevin / simulated-annealing formulation (Kirkpatrick 1983). In reinforcement learning the analogous update is the temporal-difference weight step: w ← w + α δ ∇V(s), where δ = r + γV(s′) − V(s) is the TD error (Barto, Sutton & Anderson 1983, §III).

**Primary source:** Barto, A. G., Sutton, R. S., & Anderson, C. W. (1983). "Neuronlike Adaptive Elements That Can Solve Difficult Learning Control Problems." *IEEE Transactions on Systems, Man, and Cybernetics* SMC-13(5):834–846. §III defines the ASE weight-update rule as gradient following on a reinforcement signal.

**Secondary sources:** Kirkpatrick, S., Gelatt, C. D., & Vecchi, M. P. (1983). "Optimization by Simulated Annealing." *Science* 220:671–680 (gradient-descent-as-cooling analogy). CompuFlair / Borzou, A. (2026). "The Bizarre Paradox of Neural Nets Explained by Physics." YouTube §13:25 (noise-as-temperature framing).

---

## 2. Equilibrium / Homeostasis

**Primary cluster:** Science / BHK (Cluster 9)

**Canonical definition.** Equilibrium (in the control-theoretic and thermodynamic sense) is a state x* such that the system's dynamics produce no net change: ẋ = f(x*) = 0 (continuous time) or x_{t+1} = x* (discrete time). Homeostasis is the biological instantiation: a living system actively maintains its characteristic internal-state distribution against environmental perturbation. The Markov blanket formalism (Kirchhoff et al. 2018, §2) makes this precise: a system that persists in time necessarily has a {E, S, A, I} partition where internal states I and external states E are conditionally independent given blanket states {S, A}; the system's active states A are selected to restore and maintain this partition — that is, to enforce homeostasis. Lyapunov stability (Sastry & Bodson 1989, Ch. 2) provides the mathematical certificate: a system is stable at x* if there exists V(x) ≥ 0 with V(x*) = 0 and dV/dt ≤ 0 along trajectories; x* is the homeostatic setpoint. The Lanzara net-shift equation (Lanzara 2023, Appendix III) gives the receptor-kinetics derivation of equilibrium occupancy in the two-state receptor model.

**Primary source:** Kirchhoff, M., Parr, T., Palacios, E., Friston, K., & Kiverstein, J. (2018). "The Markov blankets of life: autonomy, active inference and the free energy principle." *Journal of the Royal Society Interface* 15:20170792. DOI: 10.1098/rsif.2017.0792. §§2–3 define the blanket partition and prove persistence-implies-blanket.

**Secondary sources:** Sastry, S., & Bodson, M. (1989). *Adaptive Control: Stability, Convergence, and Robustness.* Prentice-Hall. Ch. 2 (Lyapunov stability theory). Lanzara, R. G. (2023). *Origins of Life's Sensoria.* Appendix III (net-shift derivation; Weber-Fechner recovery from receptor kinetics).

---

## 3. Noise as Exploration

**Primary cluster:** Energy / THE (Cluster 4)

**Canonical definition.** In stochastic optimisation, noise is not merely interference to be filtered out — it is a mechanism for escaping local minima and exploring the loss landscape. When gradient-descent dynamics are augmented by a Gaussian noise term (Langevin dynamics: θ̇ = −∇L(θ) + √(2T) η(t)), the stationary distribution of θ is a Boltzmann distribution exp(−L(θ)/T), where T is the noise magnitude interpreted as temperature (CompuFlair 2026, §13:25). High T → broad exploration of the state space; low T → exploitation of the current basin. Simulated annealing (Kirkpatrick 1983) exploits this by scheduling T from high to low, finding near-global optima. In reinforcement learning, ε-greedy action selection and softmax temperature τ are discrete implementations of the same principle — noise in action selection maintains exploration of the reward landscape (Barto 1983, ASE stochastic action selection). Stochastic gradient Langevin dynamics (SGLD) applies the analogy directly to Bayesian posterior approximation.

**Primary source:** Kirkpatrick, S., Gelatt, C. D., & Vecchi, M. P. (1983). "Optimization by Simulated Annealing." *Science* 220:671–680. Establishes the temperature-noise analogy and the cooling-schedule protocol.

**Secondary sources:** CompuFlair / Borzou, A. (2026). "The Bizarre Paradox of Neural Nets Explained by Physics." YouTube §13:25 (noise-as-temperature in neural network training). Barto, A. G., Sutton, R. S., & Anderson, C. W. (1983). §II (stochastic action selection in ASE as exploration mechanism).

---

## 4. Feedback Loop

**Primary cluster:** Music / WAL (Cluster 10)

**Canonical definition.** A feedback loop is a causal circuit in which the output of a system is measured, compared to a reference, and the error is fed back as input to drive the system toward the reference. In continuous-time control theory, the closed-loop transfer function under negative feedback is C(s)P(s) / (1 + C(s)P(s)), where C is the controller and P is the plant; negative feedback reduces steady-state error and increases disturbance rejection (Bode 1945). In model-reference adaptive systems (MRAS), there are two feedback loops: an inner loop that regulates plant output toward the reference model, and an outer loop that updates the controller parameters using the error signal and a Lyapunov-derived update law (Sastry & Bodson 1989, Ch. 3). In actor-critic reinforcement learning, the critic's TD error δ is fed back to the actor — two coupled feedback loops operating on different timescales (Barto 1983). In multi-agent systems, each agent's action changes the shared environment, creating a coupled feedback structure where all agents simultaneously drive and are driven by the shared signal.

**Primary source:** Sastry, S., & Bodson, M. (1989). *Adaptive Control: Stability, Convergence, and Robustness.* Prentice-Hall. Ch. 3 (MRAS dual-loop feedback structure; Lyapunov-derived update laws).

**Secondary sources:** Barto, A. G., Sutton, R. S., & Anderson, C. W. (1983). §IV (actor-critic feedback loops; ACE error signal driving ASE weight update). Friston, K. (2010). "The free-energy principle." *Nature Reviews Neuroscience* 11(2):127–138. Fig. 1 (perception-action loop as free-energy feedback).

---

## 5. Specialised Composition

**Primary cluster:** AI / SST (Cluster 12)

**Canonical definition.** Specialised composition is an architectural principle in which a complex task is decomposed into subtasks and assigned to purpose-built components, each optimised for a narrow concern, with a composition layer that integrates their outputs. The Amiga chipset is the canonical hardware precedent: the Copper (raster-synchronised DMA controller), Blitter (block-transfer arithmetic unit), and Agnus (DMA bus arbiter) are specialised co-processors whose composition eliminates the CPU bottleneck by offloading graphical work to dedicated silicon (Commodore-Amiga 1985). In software, microservice architectures and agentic pipelines apply the same principle: each service or agent specialises on one concern (planning, execution, verification), and the orchestrator composes their outputs. The efficiency argument is the same in both registers: a general-purpose unit operating across all concerns is slower and less reliable than a set of specialists composed by a thin integration layer. In ecology, niche partitioning is the evolutionary outcome of the same pressure: species evolve to specialise on non-overlapping resource axes, reducing competition and increasing total ecosystem throughput.

**Primary source:** Commodore-Amiga, Inc. (1985). Original Amiga hardware reference manual. Cited via: `docs/foundations/theoretical-audit.md` §7 (Amiga Principle: specialised-chip composition as architectural precedent for M6/M7/M8 partitioning in the Living Sensoria stack).

**Secondary sources:** Barto, A. G., Sutton, R. S., & Anderson, C. W. (1983). (ASE + ACE as specialised composed elements — the actor-critic architecture as a two-component specialised system.) gsd-skill-creator architecture (planner + executor + verifier agent decomposition as agentic instantiation of the Amiga Principle).

---

## 6. Boundary Condition

**Primary cluster:** Science / BHK (Cluster 9)

**Canonical definition.** A boundary condition is the constraint that defines the interface between a system's internal states and its external environment — what crosses the interface, what is blocked, and at what rate. The Markov blanket (Kirchhoff et al. 2018, §2–3) is the information-theoretic boundary condition: in the {E, S, A, I} partition, internal states I and external states E are conditionally independent given sensory states S and active states A; the blanket {S, A} is the minimal sufficient boundary. Foxglove (2026, Preface pp. xxv–xxxii) frames this as the "boundary condition of being" — the cognitive surface at which an adaptive agent's internal generative model meets environmental evidence. In physics, boundary conditions for partial differential equations constrain the solution to the domain boundary (Dirichlet conditions fix values; Neumann conditions fix derivatives); the solution inside the domain is entirely determined by these constraints plus the PDE. In control theory, the Markov blanket maps to the sensor-actuator interface: sensory states are the input boundary (what the controller observes) and active states are the output boundary (what the controller does); states outside this interface are external and inaccessible.

**Primary source:** Kirchhoff, M., Parr, T., Palacios, E., Friston, K., & Kiverstein, J. (2018). "The Markov blankets of life: autonomy, active inference and the free energy principle." *Journal of the Royal Society Interface* 15:20170792. DOI: 10.1098/rsif.2017.0792. §§2–3 define the blanket as the boundary condition and prove the conditional independence theorem.

**Secondary sources:** Foxglove, M. T. (2026). *The Space Between: The Autodidact's Guide to the Galaxy.* tibsfox.com. Preface pp. xxv–xxxii ("boundary condition of being"; symbiosis register). Friston, K. (2010). "The free-energy principle." *Nature Reviews Neuroscience* 11(2):127–138 ({E, S, A, I} partition; active states chosen to minimise expected free energy at the boundary).

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

---

## 7. Intent Routing

**Primary cluster:** AI / SST (Cluster 12)

**Canonical definition.** Intent routing is the act of classifying an input by its information-need before selecting a retrieval or reasoning strategy. It converts retrieval, dispatch, or composition from a *fixed function* into a *policy*: different query intents (lookup vs. multi-hop vs. global summarisation vs. verification vs. deep reasoning) demand categorically different retrievers, context budgets, and refinement passes, and a single one-size strategy is dominated on every axis by the conditional strategy. The architectural shift is "route → strategy → act", and the substantive empirical claim is that LLMs possess *latent* routing ability that can be elicited via a structured prompt without additional training (Chen et al. 2026, §3) — the routing decision can be encapsulated as a reusable skill and externalised from the answering model, and externalising it improves small-model performance by ~2× (Sharma et al. 2026 MemFlow §4.2). In control-theoretic terms, intent routing is the upstream switch in a mixture-of-controllers and is a precondition for specialised composition (Concept 5) to apply at the retrieval or action surface. The same pattern recurs across the 2026 frontier in code generation (Plan-on-Trigger, PaT: plan only on verification failure — Yoon et al. `2605.07248v1`) and multi-agent orchestration (critique-and-route MDP — Fang et al. `2605.08686`), establishing intent routing as a cross-domain primitive rather than a memory-specific trick.

**Primary source:** Chen, Y. et al. (2026). "Route Before Retrieve: A Latent Routing Approach for Retrieval-Augmented Generation." arXiv:2605.10235v2.

**Secondary sources:** Sharma, A. et al. (2026). "MemFlow: Intent-Driven Memory Orchestration for Small Language Models." arXiv:2605.03312v1 (externalising routing yields 2× accuracy on 1.7B SLM). Fang, X. et al. (2026). "Iterative Critique-and-Routing Controller for Multi-Agent Systems with Heterogeneous LLMs." arXiv:2605.08686v1 (routing as finite-horizon MDP). Yoon, S. et al. (2026). "Plan-on-Trigger." arXiv:2605.07248v1 (verification-failure as routing signal in code generation; ~69% inference-cost reduction).

---

## 8. Constraint Drift

**Primary cluster:** AI / SST (Cluster 12)

**Canonical definition.** Constraint drift is the loss, distortion, weakening, or relaxation of declared constraints — most consequentially safety constraints — as they propagate through the operating surfaces of an agent system: memory, delegation, communication, tool use, audit, and optimisation. The Li et al. taxonomy (2026, §2) names six drift channels and demonstrates that prompt-asserted constraints decay along every channel in measurable, reproducible ways. The architectural implication is that constraints must be *maintained as trajectory state* rather than re-asserted at prompt time: a constraint store, propagated across delegation boundaries, validated at each tool invocation, and reconciled at audit, prevents the drift. In control theory the analogue is the invariant of a stabilising controller — a property that must hold across every reachable state, not merely the initial state. In software engineering the analogue is the type system: types are constraints that travel with the value, not assertions checked once at module entry. The 2026 finding is that production multi-agent LLM systems fail at 41-87% rates primarily from coordination defects of which constraint drift is the dominant subclass (Nechepurenko & Shuvalov `2605.03310`), not from base model capability, which makes constraint-drift mitigation a higher-leverage intervention than model upgrades for the operational reliability of agent systems. The cross-domain analogue in code generation is "constraint decay" (Dente et al. `2605.06445v1`): every added non-functional structural constraint costs ~30pp of agent success rate, even when the functional spec is held fixed.

**Primary source:** Li, J. et al. (2026). "Operationalizing Constraint Maintenance in Multi-Agent LLM Systems." arXiv:2605.10481.

**Secondary sources:** Nechepurenko, A. & Shuvalov, K. (2026). "Coordination, Not Capability: A Failure-Mode Taxonomy of Production Multi-Agent LLM Systems." arXiv:2605.03310 (41-87% coordination failure rate). Dente, M., Satriani, A. & Papotti, P. (2026). "Constraint Decay: The Fragility of LLM Agents in Backend Code Generation." arXiv:2605.06445v1 (~30pp accuracy loss per additional non-functional constraint). gsd-skill-creator hooks discipline (`project-claude/hooks/self-mod-guard.js`, `git-add-blocker.js`, `pre-tag-gate.sh`) as the operational anti-drift pattern.

---

## 9. Execution-Grounded Selection

**Primary cluster:** AI / SST (Cluster 12)

**Canonical definition.** Execution-grounded selection is a selection rule for candidate outputs that conditions the choice on *behavioural evidence under diverse inputs* rather than on textual agreement, output-ranking, log-probability, or model-internal scoring. The canonical 2026 instantiation is Semantic Voting (Jiang, Yi & Zhu `2605.08680v1`): sample N candidate programs, execute each on a diverse input set, cluster by behavioural fingerprint, and pick the largest cluster — a 19-52pp improvement over output-majority voting across multiple code-generation benchmarks. The input set itself is a quality signal: sketch-generated inputs derived from the candidate population dominate random fuzz by up to 11.3pp. Once execution evidence is present, the specific aggregation rule (majority, weighted, MBR-Exec) is statistically indistinguishable — execution is the dominant signal, aggregation is the residual. The principle generalises beyond code generation: paired-trace audit in skill design (CTA `2605.11946v1`) uses execution-grounded comparison of with-skill vs. without-skill behaviour; verbal reranking in memory retrieval (`2605.01399v1`) validates retrieval choices via downstream-task success rather than similarity. Execution-grounded selection is the code/agent-domain analogue to the "noise-as-exploration" Rosetta concept (#3): execution diversity is the exploration mechanism, behavioural fingerprint is the equilibrium signal.

**Primary source:** Jiang, Y., Yi, Z. & Zhu, F. (2026). "Semantic Voting: Execution-Grounded Selection for LLM Code Generation." arXiv:2605.08680v1.

**Secondary sources:** Wang, R. et al. (2026). "CTA: Counterfactual Trace Audit for LLM Skills." arXiv:2605.11946v1 (paired-trace audit; 522 behavioural changes invisible to pass-rate). Patel, N. et al. (2026). "Verbal-R3: Reranking via Verbal Justification." arXiv:2605.01399v1 (downstream-success validation of retrieval). Yoon, S. et al. (2026). "Plan-on-Trigger." arXiv:2605.07248v1 (verification failure as the planning trigger).

---

## 10. Memory Consolidation

**Primary cluster:** Science / BHK (Cluster 9)

**Canonical definition.** Memory consolidation is the transformation, over time and offline cycles, of fresh episodic traces into stable, deduplicated, semantically organised engrams. In biological memory, consolidation occurs during sleep-phase activity that replays recent traces, strengthens those activated together, decays those that were not, and migrates them from hippocampus to neocortex (McClelland, McNaughton & O'Reilly 1995). The retrieval-time mirror is *reconsolidation*: a retrieved engram is briefly labile and is re-encoded with the current context, updating its embedding and incrementing its maturation counter (Nader, Schafe & LeDoux 2000). The 2026 finding (Kerestecioglu et al. `2605.08538v1`) is that the same triad — consolidation + interference-based forgetting + reconsolidation — applied to LLM-agent memory delivers a 58% store-size reduction at 97.2% retention precision, validated via a leakage-free synthetic calibration method. In Markov-blanket terms (cross-link to Concept 6), consolidation is the periodic re-encoding of internal states I to reduce surprise on the expected distribution of future sensory states S — fewer, denser engrams cover the same predictive territory. The architectural implication for long-lived agent systems is that *unbounded memory growth is a drift class* (cross-link to Concept 8): without a consolidation pass, retrieval latency degrades and quality drifts as the store fills with near-duplicates and stale traces. Consolidation is therefore the offline half of a two-timescale memory architecture, with retrieval-time reconsolidation as the online half.

**Primary source:** Kerestecioglu, D. et al. (2026). "Human-Inspired Memory Architecture for LLM Agents." arXiv:2605.08538v1. §§3.1-3.4.

**Secondary sources:** McClelland, J. L., McNaughton, B. L. & O'Reilly, R. C. (1995). "Why there are complementary learning systems in the hippocampus and neocortex." *Psychological Review* 102(3):419-457. Nader, K., Schafe, G. E. & LeDoux, J. E. (2000). "Fear memories require protein synthesis in the amygdala for reconsolidation after retrieval." *Nature* 406:722-726. Tonegawa, S. et al. (2015). "Memory engram cells have come of age." *Neuron* 87:918-931.

---

## 11. Knowing-Doing Gap

**Primary cluster:** AI / SST (Cluster 12)

**Canonical definition.** The knowing-doing gap is the observed orthogonality between an LLM's *internal representation* of when an action (typically a tool call) is needed and the *action token actually emitted* at generation time. Three independent May 2026 papers (`2605.14038v1`, `2605.09252v1`, `2605.00737v1`) converge on the same empirical pattern: tool-necessity is linearly decodable from hidden states at AUROC 0.89-0.96, but at generation time the "cognition" probe direction and the "action" probe direction become nearly orthogonal — the model knows but doesn't act, or acts when it knows it shouldn't. The intervention is to externalise the probe: a lightweight Probe&Prefill pass (a single verbalised self-check before tool dispatch) cuts unnecessary tool calls by 48% with only 1.7% accuracy loss (`2605.14038v1`). The pattern generalises beyond tool calls: any time an LLM internally has high confidence about a routing/dispatch/selection question but emits an incongruent action, the same intervention applies. The architectural implication is that for fast-path operations (where tokens-to-action latency matters), externalising the probe via a one-line prompt-level self-check is dominant over expecting the base model to act on its own latent representation. Related to intent routing (Concept 7), where the probe becomes a structured router; related to execution-grounded selection (Concept 9), where the disagreement between cognition and action is detected post-hoc via behavioural evidence.

**Primary source:** Wong, K. et al. (2026). "The Knowing-Doing Gap: Internal Tool-Necessity Representations in LLM Agents." arXiv:2605.14038v1.

**Secondary sources:** Mehta, R. et al. (2026). "Probe&Prefill: A Lightweight Intervention for Cognition-Action Misalignment." arXiv:2605.09252v1. Ostroumov, V. et al. (2026). "When LLMs Stop Following Steps: A Diagnostic Study of Procedural Drift." arXiv:2605.00737v1.

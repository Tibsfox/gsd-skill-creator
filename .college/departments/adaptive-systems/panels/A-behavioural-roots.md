---
title: "Adaptive Systems — Panel A: Behavioural Roots"
department: adaptive-systems
panel: A
status: proposed
concept_tags: [classical-conditioning, operant-conditioning, reinforcement-learning, actor-critic, eligibility-traces, temporal-difference]
language_registers: [Python, Unison, Lisp]
cross_panel_links: [B-control-theoretic-roots, D-biological-roots]
primary_citations:
  - "Pavlov, I. P. (1927). Conditioned Reflexes. Oxford University Press."
  - "Skinner, B. F. (1938). The Behavior of Organisms. Appleton-Century."
  - "Klopf, A. H. (1972). Brain function and adaptive systems — a heterostatic theory. Air Force Cambridge Research Laboratories Technical Report."
  - "Barto, A. G., Sutton, R. S., & Anderson, C. W. (1983). Neuronlike adaptive elements that can solve difficult learning control problems. IEEE Trans. SMC 13(5):834–846."
  - "Sutton, R. S. (1988). Learning to predict by the methods of temporal differences. Machine Learning 3:9–44."
---

# Panel A — Behavioural Roots

## 1. Historical Framing

The engineering science of systems that improve through feedback has its oldest experimental foundation in animal behaviour research. Two experimental traditions, separated by forty years and two continents, defined the phenomena that reinforcement learning would later formalise.

**Classical conditioning (Pavlov 1927).** Ivan Pavlov's work on digestive secretion in dogs produced the conditioned reflex: a neutral stimulus (a bell) repeatedly paired with an unconditioned stimulus (food presentation) eventually produces a conditioned response (salivation) in the absence of food. The mechanistic reading is a parameter update: repeated pairing strengthens a synaptic weight connecting the bell representation to the salivation output. The weight increases proportionally to the co-occurrence of stimulus and response. When pairing stops, the weight decays — extinction. The conditioned reflex is the prototype of supervised association: a target (unconditioned response) drives update of a representation (conditioned stimulus weight).

**Instrumental conditioning (Skinner 1938).** B. F. Skinner's operant conditioning chamber provided a different paradigm: an organism's spontaneously emitted behaviour is selected by its consequences. A lever-pressing rat receives a food pellet; the lever-press response probability increases. The consequence (reinforcer) is contingent on the behaviour (operant). Skinner documented the schedule dependence of reinforcement: fixed-ratio, variable-ratio, fixed-interval, and variable-interval schedules produce characteristic response-rate patterns. The key difference from classical conditioning is that no stimulus-response association is pre-wired; the organism must discover the contingency through exploration. This is the prototype of reinforcement learning: no labelled targets, only evaluative feedback.

**The formalisation gap.** Both Pavlov and Skinner produced rich empirical literatures without a computational theory of how the brain implements the observed learning. A computational bridge was needed. Two intermediate steps preceded the actor-critic synthesis.

Klopf (1972) proposed that individual neurons are goal-seeking elements that maximise local reward signals, anticipating the reinforcement learning idea that credit for future reward should be distributed backward through time. Sutton (1988) formalised this as temporal-difference (TD) learning: instead of waiting until an episode ends to assign credit, TD learning updates the value estimate at each time step based on the discrepancy between successive predictions.

## 2. Core Formalism — Barto, Sutton & Anderson 1983

The Barto, Sutton & Anderson (1983) paper introduced the actor-critic architecture as a solution to a cart-pole balancing problem — a classic unstable control task where the learning agent must discover, through trial and error, a policy that keeps a pole balanced on a cart.

The architecture has two components:

**The Associative Search Element (ASE) — the actor.** The ASE maintains a weight vector w ∈ ℝ^n, one weight per state-action pair. At each time step, the ASE selects an action stochastically: action probability proportional to a Boltzmann softmax over the dot product of the state vector x(t) and the weights. The weight update rule is:

```
w(t+1) = w(t) + α · r̂(t) · ē(t)
```

where α is a step-size, r̂(t) is the reinforcement signal from the ACE, and ē(t) is an eligibility trace — a decaying memory of recent state-action visits. The eligibility trace is the mechanism that solves the temporal credit assignment problem: actions taken several steps ago that are responsible for current reward receive proportional credit through the trace.

**The Adaptive Critic Element (ACE) — the critic.** The ACE maintains a separate weight vector v ∈ ℝ^n that estimates the expected future reinforcement (value function) for each state. The ACE update rule is:

```
v(t+1) = v(t) + β · δ(t) · x(t)
δ(t) = r(t) + γ · p(t) − p(t−1)
p(t) = v(t)^T · x(t)
```

where r(t) is the external reinforcement, γ is a discount factor, p(t) is the ACE's current prediction of expected future reward, and δ(t) is the temporal difference error — the discrepancy between the predicted value at the next state and the predicted value at the current state, adjusted by actual reward received. The ACE's role is to generate an internal reinforcement signal r̂(t) = δ(t) that is more informative than the sparse external reward.

**The actor-critic relationship.** The ACE is an adaptive baseline for the ASE: instead of the ASE updating on raw external reward (which is sparse and delayed), it updates on δ(t), which is available at every step and which improves as the ACE's value estimate improves. This separation — actor learns the policy, critic learns the value function, critic's error drives actor update — is the genesis of the modern actor-critic framework that underlies policy gradient methods including those used in RLHF.

## 3. Eligibility Traces and Credit Assignment

The eligibility trace ē(t) is the Panel A solution to the temporal credit assignment problem: which past actions deserve credit for current reward?

The trace decays exponentially with a time constant λ:

```
ē(t+1) = λ · ē(t) + x(t) · a(t)
```

where x(t) is the current state vector and a(t) is the current action. States and actions visited recently have high eligibility (the trace has not yet decayed); states visited long ago have low eligibility. The trace λ interpolates between two extremes: λ = 0 gives TD(0) — credit assigned only one step back; λ = 1 gives Monte Carlo — credit assigned over the full episode. Sutton (1988) generalised this to the TD(λ) family, unifying TD and Monte Carlo methods.

The eligibility trace is the formal counterpart of Skinner's schedule dependence: a variable-ratio schedule maintains high eligibility for recent responses; a fixed-interval schedule front-loads eligibility at interval boundaries. The trace decay constant λ is the computational parameter that tunes this temporal credit window.

## 4. Connection to Shipped MA-1 and MA-2 Components

The actor-critic architecture of Barto et al. (1983) is the theoretical root of two shipped components in the Living Sensoria stack:

**MA-1 (eligibility traces).** The MA-1 proposal implements the eligibility-trace mechanism from Barto 1983 Eq. 3 as the temporal credit assignment layer of the gsd-skill-creator adaptive learning engine. The trace decay constant τ in MA-1 corresponds directly to the λ parameter in the ASE update rule. MA-1 is the modern instantiation of the Panel A credit-assignment mechanism.

**MA-2 (TD-error channel).** The MA-2 proposal implements the δ channel — the temporal difference error wire connecting the critic's value estimate to the actor's weight update. The MA-2 formula `δ = r + γ·[−F(t)] − [−F(t−1)]` is structurally identical to Barto 1983's ACE update, with the free-energy signal −F(t) serving as the value proxy. MA-2 is the engineering instantiation of the actor-critic wire.

**MA-6 (reinforcement scalar).** MA-6 supplies the r(t) scalar — the external reinforcement signal that the ACE in Barto 1983 Eq. 2 receives. The MA-6 reinforcement taxonomy defines what counts as positive and negative feedback in the gsd-skill-creator context, anchoring the abstract reward signal to developer workflow outcomes.

## 5. Cross-Panel Connections

**→ Panel B (Control-Theoretic Roots).** The actor-critic update law can be derived as a gradient descent on a Lyapunov function (a stability-certificate scalar). The connection explains why well-tuned actor-critic methods converge rather than oscillate: the update law is implicitly Lyapunov-stable. Panel B makes this connection explicit through MRAS theory.

**→ Panel D (Biological Roots).** Friston's free-energy principle (Panel D) is the variational form of the actor-critic objective. The critic's value function V(s) corresponds to the negative expected free energy under the internal model; the actor's policy update corresponds to the active inference A-state selection. The biological and the computational accounts converge on the same parameter-update structure.

## 6. Primary Sources

1. Pavlov, I. P. (1927). *Conditioned Reflexes.* Oxford University Press. — Conditioned reflex phenomenology; extinction; generalisation.
2. Skinner, B. F. (1938). *The Behavior of Organisms: An Experimental Analysis.* Appleton-Century. — Operant contingency; schedules of reinforcement; discriminative stimulus.
3. Klopf, A. H. (1972). Brain function and adaptive systems — a heterostatic theory. Air Force Cambridge Research Laboratories Technical Report AFCRL-72-0164. — Goal-seeking neurons as prototype for temporal credit assignment.
4. Barto, A. G., Sutton, R. S., & Anderson, C. W. (1983). Neuronlike adaptive elements that can solve difficult learning control problems. *IEEE Transactions on Systems, Man, and Cybernetics* SMC-13(5):834–846. — Actor (ASE) and critic (ACE) architecture; cart-pole solution; eligibility trace formalism.
5. Sutton, R. S. (1988). Learning to predict by the methods of temporal differences. *Machine Learning* 3:9–44. — TD(λ) generalisation; formal convergence properties.
6. Shipped MA-1, MA-2, MA-6 proposals — engineering instantiation of Panel A theory in gsd-skill-creator Living Sensoria stack.

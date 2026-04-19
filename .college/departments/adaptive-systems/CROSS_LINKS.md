# Cross-Departmental Links — Adaptive Systems

**Department:** adaptive-systems  
**Status:** Proposed  
**Purpose:** Documents the five cross-departmental bridges from the Adaptive Systems department to other College departments. Each bridge is defined by its link type, the shared conceptual objects, and the pedagogical pathways through which learners traverse the connection.

---

## 1. Mathematics Department

**Link type:** Formal bridge  
**Department path:** `.college/departments/mathematics/`

**Rationale:** Three bodies of mathematical machinery underpin Adaptive Systems theory and live formally in the Mathematics Department. Lyapunov stability theory (Panel B) requires differential calculus and the chain rule for computing dV/dt. Variational free energy (Panel D) requires the calculus of variations (Euler-Lagrange equation). Actor-critic and MRAS convergence analysis (Panels A and B) requires stochastic processes — Markov chains, transition matrices, stationary distributions. The bridge is one-directional in formal dependency: Adaptive Systems presupposes Mathematics; Mathematics does not presuppose Adaptive Systems.

**Shared concepts:**

| Adaptive Systems | Mathematics Department | Shared Object | Notes |
|-----------------|----------------------|---------------|-------|
| adapt-lyapunov-stability (Panel B) | Exponential growth/decay (Calculus wing) | dV/dt along trajectories; chain rule | Lyapunov V-dot is a chain-rule computation |
| adapt-temporal-difference (Panel A) | Exponential growth/decay (Calculus wing) | Discrete-time gradient descent on value function | TD is finite-difference approximation to continuous gradient |
| adapt-free-energy (Panel D) | (future: variational calculus) | Euler-Lagrange equation as basis for F minimisation | Variational calculus not yet present in Math dept |
| adapt-mras (Panel B) | (future: stochastic processes) | Markov chains, transition matrices, stationary distributions | Stochastic processes not yet present in Math dept |
| adapt-ntk (Panel C) | Complex numbers (Complex Analysis wing) | Spectral decomposition of kernel; Fourier/Euler machinery | NTK kernel's spectral structure uses Fourier basis |

**Pedagogical pathway:**  
Arc A learners complete Mathematics Calculus wing before Panel B. Arc D (biological track) learners need no Mathematics prerequisite — Panel D is self-contained at the definition level. When the Mathematics Department adds variational calculus and stochastic processes (a separate proposal), those concepts will be co-requisites for Panels B and D respectively.

---

## 2. Psychology Department

**Link type:** Empirical foundation bridge  
**Department path:** `.college/departments/psychology/`

**Rationale:** The Psychology Department's Behavior & Mental Health wing covers classical conditioning (Pavlov 1927) and operant conditioning / reinforcement schedules (Skinner 1938) as empirical phenomena. The Adaptive Systems department Panel A supplies the mathematical formalisation of those same phenomena. The bridge is bidirectional: Psychology provides the empirical motivation; Adaptive Systems provides the formal machinery. Neither department is formally dependent on the other, but learners who study both gain access to a richer picture than either provides alone.

**Shared concepts:**

| Adaptive Systems | Psychology Department | Shared Domain | Notes |
|-----------------|----------------------|---------------|-------|
| adapt-classical-conditioning (Panel A) | psych-learning-theory | Pavlov's conditioned reflex as parameter update | Psychology treatment is phenomenological; Panel A is formal |
| adapt-instrumental-conditioning (Panel A) | psych-behavior-reinforcement | Skinner's operant contingency as gradient rule on weight vector | ASE is Skinner formalised |
| adapt-eligibility-traces (Panel A) | psych-behavior-reinforcement | Credit assignment over time; schedules of reinforcement | Trace decay constant τ maps to schedule timing |
| adapt-active-inference (Panel D) | psych-perception-construction | Brain as prediction machine; perception as inference | Friston 2010 is a formal theory of psych-perception-construction |
| adapt-temporal-difference (Panel A) | psych-theories-of-emotion | Prediction error as emotional signal (Schultz 1997 dopamine) | TD error has a neural correlate in dopamine dynamics |

**Pedagogical pathway:**  
Arc B learners start in Psychology (`psych-learning-theory` → `psych-behavior-reinforcement`) before moving to Panel A. Psychology learners who reach the limit of the empirical treatment are directed to Adaptive Systems Panel A for the formal extension. Cross-reference note added to Psychology `DEPARTMENT.md`.

---

## 3. Engineering Department

**Link type:** Advanced treatment bridge  
**Department path:** `.college/departments/engineering/`

**Rationale:** The Engineering Department's Mechanisms & Systems wing covers open and closed-loop control, feedback, sensors, actuators, and PID concepts (`engr-control-systems`). PID control is a fixed-gain regulator: the proportional, integral, and derivative gains are set at design time and do not update during operation. Adaptive Systems Panel B extends this directly with MRAS and self-tuning regulators — closed-loop systems where the gain parameters are updated by an outer loop using Lyapunov stability arguments. The Engineering department provides the structural framing (feedback, actuator, sensor); Adaptive Systems provides the update laws that make the gain adaptive rather than fixed.

**Shared concepts:**

| Adaptive Systems | Engineering Department | Shared Domain | Notes |
|-----------------|----------------------|---------------|-------|
| adapt-mras (Panel B) | engr-control-systems | Model-reference adaptive control beyond fixed-gain PID | MRAS is adaptive PID: gains update via Lyapunov law |
| adapt-self-tuning-regulator (Panel B) | engr-control-systems | Online plant identification + controller update | Self-tuner runs system identification in parallel with control |
| adapt-lyapunov-stability (Panel B) | engr-control-systems | Formal stability guarantee replacing engineering rules-of-thumb | Lyapunov provides provable stability, not just empirical tuning |
| adapt-kalman-filtering (Panel B) | engr-testing-methodology | State estimation under noise; sensor fusion | Kalman filter is the MRAS state estimator |
| adapt-exponential-stability (Panel B) | engr-failure-analysis | Bounded disturbance → bounded deviation; robustness margin | Exponential stability theorems bound the failure modes |

**Pedagogical pathway:**  
Engineering learners who complete `engr-control-systems` are directed to Adaptive Systems Panel B for the advanced treatment. Panel B assumes familiarity with feedback-loop terminology (plant, reference, error signal, actuator) — exactly what `engr-control-systems` provides. Cross-reference note added to Engineering `DEPARTMENT.md`.

---

## 4. Culinary Arts Department

**Link type:** Physical analogy bridge  
**Department path:** `.college/departments/culinary-arts/`

**Rationale:** The Culinary Arts Department carries two live connection points to Adaptive Systems theory. First, the Thermodynamics wing (`cook-specific-heat-capacity`, `cook-newtons-cooling`) instantiates the same Gibbs distribution physics that the NTK/noise-as-temperature discussion in Panel C uses — both are systems where temperature governs the probability distribution over states, and both exhibit phase transitions at critical temperatures (Maillard onset at 140°C; neural representation phase transition at critical batch size / learning rate). Second, the seasoning calibration model explicitly invokes the Weber-Fechner logarithmic perception law — the same law that Lanzara (2023, Appendix III) derives mechanistically from two-state receptor kinetics in Panel D. The culinary treatment is the pedagogically accessible instantiation of the same physics and biology.

**Shared concepts:**

| Adaptive Systems | Culinary Arts Department | Shared Domain | Notes |
|-----------------|--------------------------|---------------|-------|
| adapt-noise-as-temperature (Panel C) | cook-specific-heat-capacity (Thermodynamics) | Gibbs distribution over states; temperature controls exploration | Energy per gram per degree ↔ noise magnitude per parameter per step |
| adapt-cooling-schedule (Panel C) | cook-newtons-cooling (Thermodynamics) | Exponential decay; annealing schedule | Newton's cooling law is the physical model for simulated annealing cooling |
| adapt-weber-fechner (Panel D) | Seasoning calibration model (Thermodynamics) | Log-linear perception; just-noticeable-difference | Culinary model uses Weber-Fechner empirically; Panel D derives it mechanistically |
| adapt-net-shift (Panel D) | cook-maillard-reaction (Food Science) | Phase transition at threshold temperature / ligand concentration | Maillard onset at 140°C is a phase transition; receptor saturation is a concentration phase transition |

**Pedagogical pathway:**  
The noise-as-temperature connection is pedagogically valuable precisely because heat-in-cooking is a familiar concept. Arc C learners (physical systems track) can anchor the abstract NTK/Langevin dynamics discussion in the concrete culinary thermodynamics treatment before working toward the formal result. Cross-reference note added to Culinary Arts `DEPARTMENT.md`.

---

## 5. Mind-Body Department

**Link type:** Biological anchor bridge  
**Department path:** `.college/departments/mind-body/`

**Rationale:** The Mind-Body Department covers breath, meditation, yoga, relaxation, and nervous-system concepts. Homeostasis — the body's maintenance of stable internal temperature, blood glucose, pH — is the biological prototype for the Markov-blanket persistence theorem (Kirchhoff et al. 2018): any system that maintains a characteristic internal-state distribution over time has a Markov blanket. The relaxation and nervous-system content in the Mind-Body Relaxation wing is the experiential counterpart to the formal biological-roots treatment in Panel D. Active inference (Friston et al. 2013) was explicitly developed to model interoception — the internal model of the body's state that the brain maintains and minimises prediction error against.

**Shared concepts:**

| Adaptive Systems | Mind-Body Department | Shared Domain | Notes |
|-----------------|---------------------|---------------|-------|
| adapt-markov-blanket (Panel D) | Relaxation wing — nervous system | Boundary between internal and external; homeostasis | Blanket formalism gives mathematical form to the homeostatic regulation process |
| adapt-active-inference (Panel D) | Relaxation wing — nervous system | Interoception; internal model of body state | Active inference models proprioception and interoception as free-energy minimisation |
| adapt-free-energy (Panel D) | Philosophy wing — mindfulness | Prediction-error minimisation as attention mechanism | Mindfulness as active inference: reducing surprise about internal state |
| adapt-net-shift (Panel D) | Breath wing — physiological response to breathing | Receptor adaptation under sustained stimulus | CO2 receptor tachyphylaxis during breath-hold is adapt-net-shift in the respiratory system |

**Pedagogical pathway:**  
Mind-Body learners exploring the mechanistic basis of homeostasis and interoception are directed to Panel D for the formal biological-roots treatment. Panel D assumes no mathematics beyond reading equations as descriptions; the receptor kinetics derivation is self-contained. Cross-reference note added to Mind-Body `DEPARTMENT.md`.

---

## Summary Table

| Department | Link Type | Shared Formal Domain | Primary Panel |
|-----------|----------|---------------------|---------------|
| Mathematics | Formal | Lyapunov theory, variational calculus, Markov chains, stochastic processes | Panel B, Panel D |
| Psychology | Empirical foundation | Classical/instrumental conditioning; Weber-Fechner perception | Panel A, Panel D |
| Engineering | Advanced treatment | MRAS, self-tuning regulators, Lyapunov stability beyond PID | Panel B |
| Culinary Arts | Physical analogy | Heat-as-temperature, Newton's cooling, Weber-Fechner | Panel C, Panel D |
| Mind-Body | Biological anchor | Homeostasis, interoception, active inference, tachyphylaxis | Panel D |

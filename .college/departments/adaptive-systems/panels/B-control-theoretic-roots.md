---
title: "Adaptive Systems — Panel B: Control-Theoretic Roots"
department: adaptive-systems
panel: B
status: proposed
concept_tags: [lyapunov-stability, kalman-filter, mras, self-tuning-regulator, exponential-stability, adaptive-control]
language_registers: [Python, C++, Unison]
cross_panel_links: [A-behavioural-roots, C-physical-systems-roots]
primary_citations:
  - "Lyapunov, A. M. (1892). The general problem of the stability of motion. Translated 1992, Taylor & Francis."
  - "Kalman, R. E. (1960). A new approach to linear filtering and prediction problems. Trans. ASME J. Basic Engineering 82(D):35–45."
  - "Narendra, K. S., & Annaswamy, A. M. (1987). Persistent excitation in adaptive systems. Int. J. Control 45(1):127–160."
  - "Sastry, S., & Bodson, M. (1989). Adaptive Control: Stability, Convergence, and Robustness. Prentice-Hall."
---

# Panel B — Control-Theoretic Roots

## 1. Historical Framing

While Panel A developed the empirical foundations of adaptive systems through animal behaviour research, control engineering developed a parallel formalisation rooted in stability analysis rather than psychology. The two traditions converged in the 1980s, but their starting points are distinct: control theory asks not "what behaviour did the system learn?" but "is the system guaranteed not to diverge?"

**Lyapunov stability (Lyapunov 1892).** Aleksandr Lyapunov's doctoral thesis — published in Russian in 1892 and translated into French in 1907 and English in 1992 — solved the question of system stability without requiring explicit trajectory solutions. The key insight is a scalar energy-like function.

A system dx/dt = f(x) is stable at the equilibrium x = 0 if there exists a function V : ℝ^n → ℝ satisfying:

```
V(0) = 0
V(x) > 0  for all x ≠ 0
dV/dt = (∂V/∂x) · f(x) ≤ 0  along all system trajectories
```

Such a V is called a Lyapunov function. Its existence proves stability without solving the differential equation — a profound result for high-dimensional nonlinear systems where closed-form solutions do not exist. The condition dV/dt ≤ 0 means the "energy" is non-increasing along trajectories; the system cannot escape to infinity if V is radially unbounded.

**Kalman filtering (Kalman 1960).** The Kalman filter is a recursive Bayesian state estimator for linear systems with Gaussian noise. Given a state-space model:

```
x(t+1) = A·x(t) + B·u(t) + w(t),   w ~ N(0, Q)
y(t) = C·x(t) + v(t),               v ~ N(0, R)
```

the Kalman filter computes the minimum-variance linear unbiased estimate x̂(t|t) of the state from the history of observations y(0:t). The filter alternates between a prediction step (propagate the estimate forward using the dynamics model) and an update step (correct the prediction using the current observation). The Kalman gain K(t) weights the correction: high gain when measurement noise R is small relative to process noise Q; low gain otherwise. The Kalman filter is the control-theoretic version of the critic in Panel A: it maintains a running estimate of system state (the value function's analogue) and updates it with each new observation.

## 2. Model-Reference Adaptive Systems (MRAS)

The core framework of Sastry & Bodson (1989) Chapter 3 is the Model-Reference Adaptive System. The setup:

- A **reference model** describes the desired closed-loop behaviour: ẋ_m = A_m · x_m + B_m · r, where r is the command input and A_m is a stable matrix (all eigenvalues in the left half-plane).
- A **plant** has partially unknown parameters: ẋ = A · x + B · u, where A and B may drift over time.
- A **controller** generates the plant input u = θ^T(t) · φ(t), where θ(t) is the adaptive parameter vector and φ(t) is the regression vector (state, input, or both).
- The **tracking error** is e(t) = x(t) − x_m(t).

The MRAS design goal: choose an update law for θ(t) such that e(t) → 0 as t → ∞.

**Lyapunov-based update law.** Sastry & Bodson (1989) Ch. 3 derives the update law from a Lyapunov function. Choose:

```
V(e, θ̃) = e^T P e + θ̃^T Γ^{-1} θ̃
```

where θ̃ = θ − θ* is the parameter error (θ* is the true parameter), P is the positive definite solution to the Lyapunov equation A_m^T P + P A_m = −Q for some positive definite Q, and Γ is a positive definite gain matrix. Computing V̇:

```
V̇ = e^T(A_m^T P + P A_m)e + 2e^T P B(θ̃^T φ) + 2θ̃^T Γ^{-1} θ̇
   = −e^T Q e + 2θ̃^T(Γ^{-1} θ̇ + B^T P e φ^T)
```

Setting the second term to zero gives the update law:

```
θ̇ = −Γ · B^T P e φ^T
```

With this law, V̇ = −e^T Q e ≤ 0: the Lyapunov function is non-increasing. Since V is bounded below by zero and non-increasing, e(t) converges. The update law is not arbitrary: it is the unique update that makes the chosen Lyapunov function monotonically decrease. This is the control-theoretic analogue of Panel A's ASE update: the parameter vector θ plays the role of the actor weights w, the tracking error e plays the role of the TD error δ, and the Lyapunov stability argument is the convergence guarantee that the Panel A analysis lacks at the empirical level.

## 3. Self-Tuning Regulators

Sastry & Bodson (1989) Chapter 5 extends MRAS to the case where the plant parameters are completely unknown. The self-tuning regulator (STR) runs two loops simultaneously:

1. **System identification loop:** Online recursive least squares (RLS) estimates the unknown plant parameters θ̂(t) from the input-output history. The RLS update:
   ```
   θ̂(t) = θ̂(t−1) + L(t)[y(t) − φ^T(t) θ̂(t−1)]
   L(t) = P(t−1)φ(t) / [λ + φ^T(t) P(t−1) φ(t)]
   P(t) = [P(t−1) − L(t)φ^T(t) P(t−1)] / λ
   ```
   where λ ∈ (0,1] is a forgetting factor that discounts older data — useful when the plant parameters drift slowly over time.

2. **Control law update:** The identified parameters θ̂(t) are used to recompute the controller gains at each step. The controller adapts its gains in real time to match the identified plant.

The critical additional requirement is **persistent excitation**: the regression vector φ(t) must excite all modes of the plant — it must not remain confined to a subspace. If persistent excitation fails, the identified parameters can drift without tracking error indicating a problem (Narendra & Annaswamy 1987). In the gsd-skill-creator context, this maps to the question of whether the developer workflow provides sufficient variety of skill-activation scenarios to identify which skills are genuinely useful — a system that only ever uses three skills cannot identify the parameters of a twenty-skill policy.

## 4. Exponential Stability and Robustness

Sastry & Bodson (1989) Chapter 6 provides the robustness theorems that make MRAS practically usable. Two key results:

**Exponential stability:** If the reference model is exponentially stable (all eigenvalues strictly in the left half-plane) and persistent excitation holds, then the closed-loop adaptive system is exponentially stable: |e(t)| ≤ c · exp(−α·t) · |e(0)| for constants c and α. Exponential convergence is stronger than asymptotic convergence — it gives a rate guarantee, not just an asymptotic claim.

**Bounded disturbance → bounded deviation:** If persistent excitation holds and the plant is subject to a bounded disturbance d(t) with |d(t)| ≤ D, then the tracking error satisfies |e(t)| ≤ β · D for some finite β. The system is input-output stable. This is the control-theoretic analogue of the robustness requirement in software engineering: a system that diverges under any bounded noise is not deployable.

**Dead-zone modification (second-wave MB-5 proposal):** The dead-zone modification stops the parameter update when the tracking error is smaller than a noise floor threshold ε: θ̇ = 0 when |e| < ε, and the MRAS update law otherwise. This prevents the system from over-fitting to measurement noise and is the direct engineering implementation of the robustness theorems.

## 5. Connection to Adaptive Control in Broadcasting and Embedded Systems

The self-tuning regulator has two notable engineering instantiations outside classical control:

**Adaptive bitrate streaming (Broadcasting / RBH cluster).** ABR streaming algorithms (e.g., BOLA, MPC-based) select video quality tiers in real time based on network throughput estimates. The system identifies the channel model (throughput distribution) online and adjusts the quality policy to keep the playback buffer non-empty. This is an STR: plant = network channel, output = received throughput, reference = buffer level setpoint, controller = quality-tier selector, identification = throughput estimator.

**Kalman-filter sensor fusion (Electronics / LED cluster).** IMU + GPS fusion for embedded navigation uses the Kalman filter as its MRAS state estimator: the dynamics model is the IMU integration, the measurement model is the GPS fix, the Kalman gain weights the fusion. When GPS is unavailable, the filter propagates forward using the dynamics model alone — the control-theoretic dead-reckoning.

## 6. Cross-Panel Connections

**→ Panel A (Behavioural Roots).** The MRAS update law dθ/dt = −Γ·B^T P e φ^T is structurally identical to the ASE update w(t+1) = w(t) + α · r̂(t) · ē(t): both are gradient descents on a Lyapunov-type function with eligibility/regression as the credit-assignment term. The Panel A update is the stochastic, function-approximated version of the Panel B deterministic, linear update.

**→ Panel C (Physical-Systems Roots).** The Lyapunov function V plays the role of an energy function. In the NTK / mean-field context (Panel C), the loss surface is a Gibbs energy landscape; gradient descent minimises this energy. The Panel B result — that a Lyapunov-derived update law is provably convergent — is the deterministic analogue of Panel C's simulated-annealing convergence guarantee: start from a high-temperature (high learning-rate, high noise) regime and cool to a low-temperature (small step-size, low noise) regime to guarantee convergence to a minimum.

## 7. Primary Sources

1. Lyapunov, A. M. (1892). *The General Problem of the Stability of Motion.* Kharkov Mathematical Society. English translation: Taylor & Francis, 1992. — V(x) stability certificate; dV/dt ≤ 0 condition; foundational theorem.
2. Kalman, R. E. (1960). A new approach to linear filtering and prediction problems. *Trans. ASME J. Basic Engineering* 82(D):35–45. — Recursive state estimator; prediction-update cycle; Kalman gain.
3. Narendra, K. S., & Annaswamy, A. M. (1987). Persistent excitation in adaptive systems. *International Journal of Control* 45(1):127–160. — Persistent excitation condition; parameter convergence vs. tracking convergence.
4. Sastry, S., & Bodson, M. (1989). *Adaptive Control: Stability, Convergence, and Robustness.* Prentice-Hall. Ch. 2 (Lyapunov), Ch. 3 (MRAS), Ch. 5 (self-tuning), Ch. 6 (exponential stability). — Primary reference for Panel B.
5. Shipped MB-1, MB-2, MB-5 proposals — engineering instantiation of Panel B theory in gsd-skill-creator Living Sensoria second-wave stack (MB-1: Lyapunov K_H; MB-2: projection; MB-5: dead-zone).

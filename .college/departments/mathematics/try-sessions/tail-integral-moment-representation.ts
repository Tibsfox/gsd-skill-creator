/**
 * Tail Integral Moment Representation try-session -- mathematics (June-2026 arXiv cohort, T2).
 * @module departments/mathematics/try-sessions/tail-integral-moment-representation
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const tailIntegralMomentRepresentationSession: TrySessionDefinition = {
  id: 'math-tail-integral-moment-representation-first-steps',
  title: "The Tail-Integral (Layer-Cake) Moment Transform",
  description:
    "Build the layer-cake moment representation from the base identity E[X]=∫S(t)dt up through fractional and negative real-order moments, then take p→0 to reach the logarithmic moment as a Frullani/Laplace integral, validating each step numerically.",
  estimatedMinutes: 22,
  prerequisites: [],
  steps: [
    {
      instruction:
        "Draw 200k Exponential(1) samples in numpy, estimate the empirical survival S(t)=P(X>t) on a grid t∈[0,40], integrate ∫₀^∞ S(t) dt with np.trapz, and compare the result to the sample mean.",
      expectedOutcome:
        "Both numbers land near 1, empirically confirming the base tail-integral identity E[X]=∫₀^∞ S(t) dt (the Darth-Vader / layer-cake rule) for a nonnegative variable.",
      hint: "For Exp(1) the survival is exactly S(t)=e^{-t}, so ∫₀^∞ e^{-t} dt should reproduce the mean 1.",
      conceptsExplored: ["math-tail-integral-moment-representation", "math-exponential-decay"],
    },
    {
      instruction:
        "On paper, write X^p = ∫₀^X p·t^{p-1} dt = ∫₀^∞ p·t^{p-1}·1{t<X} dt, take the expectation of both sides, and swap the integral with the expectation to derive E[X^p]=∫₀^∞ p·t^{p-1}·S(t) dt.",
      expectedOutcome:
        "You see the whole representation is one application of Tonelli to a nonnegative indicator, with S(t)=E[1{t<X}]=P(X>t) appearing as the swapped inner expectation.",
      hint: "Tonelli permits the swap because the integrand p·t^{p-1}·1{t<X} is nonnegative; no integrability hypothesis is needed to reorder.",
      conceptsExplored: ["math-tail-integral-moment-representation"],
    },
    {
      instruction:
        "Substitute S(t)=e^{-t} into E[X^p]=∫₀^∞ p·t^{p-1}e^{-t} dt, integrate by parts once, and confirm E[X^p]=Γ(p+1); then check it numerically for the fractional orders p=0.5 and p=1.5 against np.trapz.",
      expectedOutcome:
        "Real- and fractional-order moments are Gamma values, and the tail integral handles non-integer p natively — no factorial/integer restriction.",
      hint: "One integration by parts yields the recurrence Γ(p+1)=p·Γ(p); compare to scipy.special.gamma(p+1).",
      conceptsExplored: ["math-tail-integral-moment-representation"],
    },
    {
      instruction:
        "Derive the negative-order form E[X^{-q}]=q·∫₀^∞ t^{-q-1}·F(t) dt for a positive X, plug in F(t)=1-e^{-t}, and determine for which q>0 the integral converges near t=0.",
      expectedOutcome:
        "Negative moments are governed by the CDF near the origin, not the tail; for Exp(1) the integral equals Γ(1-q) and exists only for q<1.",
      hint: "Near 0, F(t)~t, so the integrand behaves like t^{-q}; ∫₀ t^{-q} dt converges only when q<1.",
      conceptsExplored: ["math-tail-integral-moment-representation"],
    },
    {
      instruction:
        "Replace the exponential tail with a Pareto survival S(t)=t^{-α} for t≥1, integrate ∫₁^∞ p·t^{p-1}·t^{-α} dt, find the exact p at which it diverges, then contrast the outcome with the exponential tail.",
      expectedOutcome:
        "Power-law tails admit E[X^p] only for p<α, whereas exponential decay makes every positive moment finite — the tail decay rate is the single knob controlling moment existence.",
      hint: "The integrand is p·t^{p-1-α}; convergence at infinity requires the exponent p-1-α < -1, i.e. p<α.",
      conceptsExplored: ["math-tail-integral-moment-representation", "math-exponential-decay"],
    },
    {
      instruction:
        "Verify the Frullani representation log x = ∫₀^∞ (e^{-t}-e^{-xt})/t dt, take the expectation to obtain E[log X]=∫₀^∞ (e^{-t}-L_X(t))/t dt, and evaluate it for Exp(1) using the Laplace transform L_X(t)=1/(1+t).",
      expectedOutcome:
        "The logarithmic moment is the p→0 edge of the moment family and collapses to a Laplace-transform integral; for Exp(1), E[log X] = -γ (the Euler–Mascheroni constant).",
      hint: "L_X(t)=E[e^{-tX}]=1/(1+t) for Exp(1); the resulting integral is a standard representation of -γ = ψ(1).",
      conceptsExplored: ["math-tail-integral-moment-representation", "math-logarithmic-scales"],
    },
    {
      instruction:
        "Prove the general Frullani identity ∫₀^∞ (f(at)-f(bt))/t dt = (f(0)-f(∞))·log(b/a) by substituting u=at and u=bt and subtracting, and pinpoint where the log-of-a-ratio arises.",
      expectedOutcome:
        "The Frullani constant is a logarithm of the scale ratio b/a, explaining why logarithmic moments naturally couple to multiplicative (ratio) rather than additive structure.",
      hint: "After the two substitutions the integrands cancel on the overlapping range, leaving only the boundary contribution that integrates to log(b/a).",
      conceptsExplored: ["math-tail-integral-moment-representation", "math-ratios"],
    },
    {
      instruction:
        "Assemble the numpy quadrature moment=lambda p: np.trapz(p*t**(p-1)*S, t), sweep p over {-0.5, 0.5, 1, 1.5, 2}, compare to Γ(p+1) (and Γ(1-q) for the negative case), and watch the error grow if you truncate the upper grid limit too early.",
      expectedOutcome:
        "A single tail-integral transform reproduces positive, fractional, and negative real-order moments, and truncation error is dictated by how far into the decaying tail the grid extends.",
      hint: "Raise the upper limit until the tail contribution p·t^{p-1}·S(t) is numerically negligible; heavier tails demand a longer grid.",
      conceptsExplored: ["math-tail-integral-moment-representation", "math-exponential-decay", "math-logarithmic-scales"],
    },
  ],
};

# Chain Link: Chapter 10 — Differential Equations

**Chain position:** 60 of 100
**Subversion:** 1.50.60
**Type:** PROOF
**Part:** III: Calculus
**Score:** 4.25/5.0

---

## Score Trend

| Pos | Chapter | Score | Delta |
|-----|---------|-------|-------|
| 53  | Ch 3 — Pythagorean | 4.25 | -0.25 |
| 54  | Ch 4 — Trig & Waves | 4.25 | +0.00 |
| 55  | Ch 5 — Music & 12-TET | 4.38 | +0.13 |
| 56  | Ch 6 — Standing Waves | 4.38 | +0.00 |
| 57  | Ch 7 — Notation | 4.25 | -0.13 |
| 58  | Ch 8 — Calculus I | 4.63 | +0.38 |
| 59  | Ch 9 — Integration | 4.50 | -0.13 |
| 60  | Ch 10 — Diff Equations | 4.25 | -0.25 |

## Chapter Summary

Chapter 10 closes Part III: Calculus and the first ten chapters by applying differentiation and integration to differential equations. Three theorems cover the harmonic oscillator (the unit circle's dynamical twin), the wave equation (connecting back to Chapter 6's standing waves), and Picard iteration (the existence and uniqueness theorem's computational shadow).

The harmonic oscillator x'' + omega^2*x = 0 is where the unit circle becomes dynamics. Its general solution A*cos(wt) + B*sin(wt) is the trigonometry of Chapters 2 and 4 in motion — every point on the unit circle is a snapshot of oscillatory motion. The wave equation extends this to spatial dimensions, cross-citing Chapter 6's boundary conditions and standing wave solutions.

Picard iteration is the chapter's most ambitious theorem — classified L4 with an acknowledged gap for the Banach Fixed Point Theorem. The student proves that iterating y_{n+1}(x) = 1 + integral from 0 to x of y_n(t)dt produces the Taylor series partial sums of e^x, but cannot prove convergence without the contraction mapping theorem. This is the textbook's deepest acknowledged gap in the first ten chapters.

The platform connections are among the strongest: the harmonic oscillator maps to skill position oscillation dynamics in observer-bridge.ts, and MAX_ANGULAR_VELOCITY appears as a Lipschitz constant in the Picard-Lindelof framework. These connections tie the most abstract mathematics directly to platform behavior.

## Theorems Proved

### Theorem thm-10-1: harmonic oscillator
**Classification:** L2 — "I can do this"
**Dependencies:** thm-8-5, thm-8-7
**Test:** proof-10-1-harmonic-oscillator
**Platform Connection:** src/packs/plane/observer-bridge.ts skill position oscillation dynamics

x'' + omega^2*x = 0 has solution A*cos(wt) + B*sin(wt). Verified by substitution for cos(wt), sin(wt), and the general solution with arbitrary A=3, B=-2 at multiple time values. Initial condition determination test confirms A = x(0), B = x'(0)/omega. Numerical second derivative verification (central difference formula) confirms x'' = -omega^2*x.

Platform connection test: angular velocity clamping converts harmonic motion to damped motion, simulating 100 steps with MAX_ANGULAR_VELOCITY = 0.2 as a damping constraint. The clamped system remains bounded — a direct computational analog of the platform's position update rule.

### Theorem thm-10-2: wave equation
**Classification:** L3 — "This is hard but I am getting it"
**Dependencies:** thm-6-2, thm-8-5
**Test:** proof-10-2-wave-equation
**Platform Connection:** cross-citation with ch06-standing-waves.md Theorem 6.2

u_tt = c^2 * u_xx with standing wave solution u(x,t) = sin(kx)*cos(kct). Verified both numerically (second partial derivatives via central difference at a 5x4 (x,t) grid) and analytically (u_tt = -k^2*c^2*base, c^2*u_xx = c^2*(-k^2)*base at a 4x3 grid). Boundary conditions verified for first mode. Mode quantization re-verified (cross-citation with ch06 Theorem 6.2, including non-integer rejection). Superposition of two modes satisfies the wave equation (linearity test).

The cross-citation with Chapter 6 is the chapter's structural contribution — it shows the student that the standing waves from Part II are solutions to the wave equation from Part III. The same mathematical truth appears in two different frameworks.

### Theorem thm-10-3: Picard iteration converges to e^x
**Classification:** L4 — "Acknowledged gap — Banach Fixed Point Theorem deferred"
**Dependencies:** thm-9-1
**Test:** proof-10-3-picard-iteration
**Platform Connection:** MAX_ANGULAR_VELOCITY as Lipschitz constant in Picard-Lindelof

The iteration y_{n+1}(x) = 1 + integral from 0 to x of y_n(t)dt produces the partial Taylor sums of e^x. Verified: iterate n=5 approximates e to within 0.01, iterate n=10 matches e^0.5 to 8 decimal places, monotonic convergence as n increases, base cases (y_0 = 1, y_1 = 1+x, y_2 = 1+x+x^2/2), ODE satisfaction (dy/dx ≈ y for n=10), and contraction bound (error at iterate n bounded by e/(n+1)!).

The Banach FPT gap is honestly acknowledged. The student can compute the iterates and observe convergence, but cannot prove that the contraction mapping must have a unique fixed point without graduate-level topology. The platform connection — MAX_ANGULAR_VELOCITY as the Lipschitz constant L — is a genuine insight: the velocity bound ensures that the position update map is a contraction, guaranteeing convergence to a unique trajectory.

## Test Verification

**3 test suites, ~35+ individual test cases** including multi-point ODE substitution verification (cos, sin, general solution), initial condition tests, numerical second derivative verification, 20-point (x,t) wave equation PDE verification, mode quantization re-verification, 2-mode superposition linearity test, 10-iterate Picard convergence sequence, 6 base case verifications, ODE satisfaction test, contraction bound verification. Techniques: analytical substitution, numerical central difference (both first and second derivatives), convergence testing with factorial error bounds, cross-citation verification.

## 8-Dimension Scoring

| Dimension | Score | Notes |
|---|---|---|
| Mathematical Rigor | 4.25 | L3 wave equation + L4 Picard iteration — ambitious scope |
| Proof Strategy | 4.25 | Substitution + numerical PDE verification + convergence testing |
| Classification Accuracy | 4.50 | L4 for Picard is exactly right — Banach FPT is genuinely beyond scope |
| Honest Acknowledgments | 4.75 | Picard L4 gap is the deepest acknowledgment in Part B so far |
| Test Coverage | 4.00 | Good for harmonic oscillator and Picard; wave equation could have more x,t points |
| Platform Connection | 4.50 | Oscillation dynamics + Lipschitz constant connections are real and meaningful |
| Pedagogical Quality | 4.00 | Cross-citation with ch06 is excellent; Picard iteration builds intuition |
| Cross-References | 4.75 | Strongest cross-referencing: ch06 (waves), ch08 (chain rule, sin derivative), ch09 (FTC) |

**Composite:** 4.25

## Textbook Feedback

Chapter 10 closes Part III and the first ten chapters with a satisfying synthesis. The harmonic oscillator brings the unit circle full circle (literally) — cos(wt) + sin(wt) is the unit circle in motion. The wave equation cross-citation with Chapter 6 demonstrates that Parts II and III describe the same physical reality in different mathematical languages.

The Picard iteration theorem is the chapter's pedagogical climax. The student can compute, observe, and even bound the convergence — but cannot prove it without tools they don't yet have. This is the textbook at its most honest: here is what we can do, here is what we cannot yet do, and here is precisely what would be needed to close the gap (Banach FPT, topology, metric space completeness).

The platform connection (MAX_ANGULAR_VELOCITY as Lipschitz constant) is the deepest platform-mathematics connection in the first ten chapters. It says: the reason the platform's position updates converge to a well-defined trajectory is the same reason Picard iteration converges to e^x — both are contractions.

## Closing

Chapter 10 closes Part III and the first decade of chapters with three theorems that synthesize everything before them. The harmonic oscillator uses Chapter 2's trigonometry and Chapter 8's derivatives. The wave equation re-derives Chapter 6's standing waves using Chapter 8's chain rule. Picard iteration uses Chapter 9's FTC to build an existence argument for ODE solutions. The L4 Picard gap is the textbook's most honest moment — and the platform connection (Lipschitz constant = MAX_ANGULAR_VELOCITY) is its deepest insight.

Score: 4.25/5.0

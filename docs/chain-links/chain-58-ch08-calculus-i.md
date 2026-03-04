# Chain Link: Chapter 8 — Calculus I: Derivatives

**Chain position:** 58 of 100
**Subversion:** 1.50.58
**Type:** PROOF
**Part:** III: Calculus
**Score:** 4.63/5.0

---

## Score Trend

| Pos | Chapter | Score | Delta |
|-----|---------|-------|-------|
| 51  | Ch 1 — Numbers | 4.25 | — |
| 52  | Ch 2 — Unit Circle | 4.50 | +0.25 |
| 53  | Ch 3 — Pythagorean | 4.25 | -0.25 |
| 54  | Ch 4 — Trig & Waves | 4.25 | +0.00 |
| 55  | Ch 5 — Music & 12-TET | 4.38 | +0.13 |
| 56  | Ch 6 — Standing Waves | 4.38 | +0.00 |
| 57  | Ch 7 — Notation | 4.25 | -0.13 |
| 58  | Ch 8 — Calculus I | 4.63 | +0.38 |

## Chapter Summary

Chapter 8 is the largest and highest-scoring chapter in the first 10, opening Part III: Calculus with nine theorems covering limits, differentiation rules, and transcendental derivatives. It begins with the epsilon-delta definition (the foundation of rigor in calculus), proceeds through the limit sum law, power rule, product rule, and chain rule, then applies these to transcendental functions: sin(h)/h -> 1 (Squeeze Theorem), d/dx(sin x) = cos x, d/dx(e^x) = e^x, and L'Hopital's rule.

This is where the textbook's difficulty level rises significantly. The chapter contains both L2 and L3 theorems — the limit sum law (thm-8-2) and chain rule (thm-8-5) are classified L3 ("This is hard but I am getting it"), honestly acknowledging the epsilon-delta arguments and auxiliary function constructions required. L'Hopital's rule (thm-8-9) is classified L2 for application but carries an L4 acknowledgment for the rule's proof itself.

Nine theorems with dedicated test IDs, all verified via numerical central difference derivatives and convergence testing. The numericalDerivative helper function is the chapter's workhorse, enabling systematic comparison of analytical and numerical derivatives across multiple test points. The test file is the longest and most methodical in the textbook so far.

## Theorems Proved

### Theorem thm-8-1: epsilon-delta limit definition
**Classification:** L2 — "I can do this"
**Dependencies:** None
**Test:** proof-8-1-epsilon-delta-linear
**Platform Connection:** None

lim_{x->2}(3x-1) = 5 with delta = epsilon/3. Verified at three epsilon values (0.1, 0.01, 0.001) with 100 random x values each within delta of 2. Tightness test: x exactly delta away gives |f-L| exactly epsilon. The linear example is pedagogically correct — it shows the method without the complexity of nonlinear functions.

### Theorem thm-8-2: limit sum law
**Classification:** L3 — "This is hard but I am getting it"
**Dependencies:** thm-8-1
**Test:** proof-8-2-limit-sum-law
**Platform Connection:** None

lim(f+g) = lim f + lim g, verified numerically at three limit points. The L3 classification is honest — the epsilon-delta proof requires the triangle inequality and careful delta selection, which is genuinely harder than the L2 limit definition.

### Theorem thm-8-3: power rule
**Classification:** L2 — "I can do this"
**Dependencies:** thm-8-1
**Test:** proof-8-3-power-rule
**Platform Connection:** None

d/dx(x^n) = n*x^(n-1), verified via numerical central difference for n=1..5 at x=0.5, 1.0, 2.0, 3.0 (20 test points), plus negative x test. The systematic n x x grid is thorough.

### Theorem thm-8-4: product rule
**Classification:** L2 — "I can do this"
**Dependencies:** thm-8-1
**Test:** proof-8-4-product-rule
**Platform Connection:** None

d/dx(fg) = f'g + fg', verified for three function pairs: x^2*sin(x), e^x*cos(x), x^3*e^x. Each tested at 3-5 x values with numerical derivative comparison. The variety of function pairs ensures the rule isn't just verified on simple cases.

### Theorem thm-8-5: chain rule
**Classification:** L3 — "This is hard but I am getting it"
**Dependencies:** thm-8-3, thm-8-4
**Test:** proof-8-5-chain-rule
**Platform Connection:** None

d/dx(f(g(x))) = f'(g(x))*g'(x), verified for sin(x^2), e^(sin x), cos(3x+1). The L3 classification reflects the Q(y) auxiliary function construction required in the proof — genuinely harder than the product rule.

### Theorem thm-8-6: sin(h)/h -> 1 (Squeeze Theorem)
**Classification:** L2 — "I can do this"
**Dependencies:** thm-8-1
**Test:** proof-8-6-sinh-over-h
**Platform Connection:** None

Convergence verified at h = 0.1, 0.01, 0.001, 0.0001 with Taylor error bounds (|sin(h)/h - 1| < h^2/6). Squeeze bounds verified: cos(h) < sin(h)/h < 1 for 6 values of h in (0, pi/2). Monotonic convergence confirmed. The Taylor bound test is clean — it connects the limit to a quantitative error estimate.

### Theorem thm-8-7: d/dx(sin x) = cos x
**Classification:** L2 — "I can do this"
**Dependencies:** thm-8-6
**Test:** proof-8-7-derivative-sin
**Platform Connection:** src/packs/plane/observer-bridge.ts angular velocity as discrete derivative

Numerical derivative at 20 angles matches cos(theta). Also verifies d/dx(cos x) = -sin x at 12 angles. The platform connection is the strongest in the chapter: angular velocity in observer-bridge.ts is the discrete analog of the derivative of position.

### Theorem thm-8-8: d/dx(e^x) = e^x
**Classification:** L2 — "I can do this"
**Dependencies:** thm-8-1
**Test:** proof-8-8-exp-derivative
**Platform Connection:** None

The defining property of e, verified at 7 x values from -2 to 3, plus a fixed-point verification (d/dx(e^x) - e^x ≈ 0). The L5 acknowledgment for uniform convergence of the Taylor series is noted in the registry but doesn't affect the L2 operational classification.

### Theorem thm-8-9: L'Hopital's rule
**Classification:** L2 applied, L4 acknowledged for rule proof
**Dependencies:** thm-8-1
**Test:** proof-8-9-lhopital
**Platform Connection:** None

Four applications: sin(x)/x -> 1, (e^x-1)/x -> 1, (1-cos x)/x^2 -> 1/2 (applied twice), (x-sin x)/x^3 -> 1/6 (applied three times). The L4 acknowledgment for the rule's proof (requires Cauchy's MVT) is honest — the student can apply the rule without proving it.

## Test Verification

**9 test suites, ~80+ individual test cases** including 300 random epsilon-delta evaluations, 20-point power rule grid, multi-function product and chain rule verification, squeeze bound testing, 32 derivative-at-angle checks, 7-point exponential verification, 4 L'Hopital applications. Techniques: numerical central difference (numericalDerivative helper), epsilon-delta random sampling, convergence testing with explicit error bounds, Taylor error bound verification, squeeze inequality bounds.

## 8-Dimension Scoring

| Dimension | Score | Notes |
|---|---|---|
| Mathematical Rigor | 4.75 | L3 theorems (limit sum, chain rule) tackled honestly; 9 complete proofs |
| Proof Strategy | 4.75 | numericalDerivative helper enables systematic verification across the chapter |
| Classification Accuracy | 4.75 | L2/L3 split is precise; L4 acknowledgment for L'Hopital's rule proof |
| Honest Acknowledgments | 4.75 | L4 gap for L'Hopital, L5 for e^x convergence — both noted clearly |
| Test Coverage | 4.75 | 9 theorems, 80+ tests, every theorem has a dedicated test suite |
| Platform Connection | 4.00 | Angular velocity as discrete derivative is real; other connections absent |
| Pedagogical Quality | 4.50 | Good progression from limits to rules to transcendentals |
| Cross-References | 4.75 | Strong dependency chain; thm-8-6 feeds thm-8-7; thm-8-3/4 feed thm-8-5 |

**Composite:** 4.63

## Textbook Feedback

Chapter 8 is the textbook's strongest chapter so far, and the score reflects it. Nine theorems covering the full derivative toolkit — from first principles (epsilon-delta) through differentiation rules to transcendental derivatives — with every theorem computationally verified. The L2/L3 classification split is the right pedagogical signal: most differentiation rules are "I can do this," but the limit sum law and chain rule require genuine effort.

The numericalDerivative helper is an excellent pedagogical tool. It transforms verification from ad hoc calculations into a systematic framework: for any function, compute the central difference, compare to the analytical formula. This pattern repeats across eight theorems, teaching the student that computational verification is a transferable skill, not a one-off exercise.

The L4 acknowledgment for L'Hopital's rule proof is exactly right. The student can and should apply the rule (L2) without needing Cauchy's Mean Value Theorem (L4). The textbook earns trust by being explicit about what it's deferring and why.

## Closing

Chapter 8 opens Part III: Calculus with the textbook's most ambitious chapter — nine theorems, two L3 classifications, two acknowledged gaps (L4 for L'Hopital, L5 for e^x convergence), and 80+ test cases. The systematic use of numerical central difference verification makes every proof computationally grounded. The angular velocity platform connection ties the derivative concept directly to the platform's discrete position tracking. This chapter earns the highest Part B score so far.

Score: 4.63/5.0

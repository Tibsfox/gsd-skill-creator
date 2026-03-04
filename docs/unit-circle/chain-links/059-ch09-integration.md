# Chain Link: Chapter 9 — Integration

**Chain position:** 59 of 100
**Subversion:** 1.50.59
**Type:** PROOF
**Part:** III: Calculus
**Score:** 4.50/5.0

---

## Score Trend

| Pos | Chapter | Score | Delta |
|-----|---------|-------|-------|
| 52  | Ch 2 — Unit Circle | 4.50 | +0.25 |
| 53  | Ch 3 — Pythagorean | 4.25 | -0.25 |
| 54  | Ch 4 — Trig & Waves | 4.25 | +0.00 |
| 55  | Ch 5 — Music & 12-TET | 4.38 | +0.13 |
| 56  | Ch 6 — Standing Waves | 4.38 | +0.00 |
| 57  | Ch 7 — Notation | 4.25 | -0.13 |
| 58  | Ch 8 — Calculus I | 4.63 | +0.38 |
| 59  | Ch 9 — Integration | 4.50 | -0.13 |

## Chapter Summary

Chapter 9 builds the integral calculus counterpart to Chapter 8's differential calculus. The two parts of the Fundamental Theorem of Calculus (FTC) are the chapter's heart — Part 1 shows that differentiation undoes integration, Part 2 shows that definite integrals can be evaluated via antiderivatives. Integration by parts and Simpson's rule complete the toolkit.

Both FTC theorems are classified L3 ("This is hard but I am getting it"), reflecting the genuine difficulty of the Mean Value Theorem argument in Part 1's proof and the cumulative reasoning in Part 2. The IBP theorem at L2 follows directly from the product rule, making it conceptually simpler. Simpson's rule at L2 is a numerical method derived from quadratic interpolation — computation in service of computation.

The test file introduces a riemannSum helper that enables systematic comparison between numerical integration and analytical antiderivatives. The parallel with Chapter 8's numericalDerivative helper is deliberate — both chapters build computational infrastructure for verification, and together they show the student that differentiation and integration are computational inverses.

## Theorems Proved

### Theorem thm-9-1: FTC Part 1 — d/dx(integral from a to x of f(t)dt) = f(x)
**Classification:** L3 — "This is hard but I am getting it"
**Dependencies:** thm-8-1
**Test:** proof-9-1-ftc-part1
**Platform Connection:** src/packs/plane/observer-bridge.ts radius growth as discrete Riemann sum

The numerical derivative of the integral function matches the integrand, verified for three functions: sin, exp, and t^2. The discrete sum convergence test (sum of 1/n for n subdivisions converges to 1 as n grows) connects to the platform's discrete radius growth model. The platform connection is meaningful: observer-bridge.ts increments radius by 0.01 per observation — a discrete Riemann sum that FTC Part 1 validates in the continuous limit.

### Theorem thm-9-2: FTC Part 2 — definite integral via antiderivative
**Classification:** L3 — "This is hard but I am getting it"
**Dependencies:** thm-9-1
**Test:** proof-9-2-ftc-part2
**Platform Connection:** None

Five definite integrals verified by both Riemann sum (100,000 subdivisions) and antiderivative evaluation: integral of sin from 0 to pi = 2, integral of x^2 from 0 to 1 = 1/3, integral of e^x from 0 to 1 = e-1, integral of cos from 0 to pi/2 = 1, integral of 1/x from 1 to 2 = ln(2). Convergence test: Riemann sum accuracy improves monotonically with subdivision count. The five-integral verification is thorough — covering trigonometric, polynomial, exponential, and logarithmic antiderivatives.

### Theorem thm-9-3: integration by parts
**Classification:** L2 — "I can do this"
**Dependencies:** thm-8-4
**Test:** proof-9-3-integration-by-parts
**Platform Connection:** None

Three IBP applications: integral of x*e^x = 1 (single application), integral of x*cos(x) = pi/2 - 1 (single), integral of x^2*e^x = e-2 (IBP applied twice, reduction formula). The product rule derivation test proves IBP is an exact consequence of the product rule — not an approximation — by verifying that the integral of the product rule derivative equals the boundary values.

### Theorem thm-9-4: Simpson's rule
**Classification:** L2 — "I can do this"
**Dependencies:** thm-9-2
**Test:** proof-9-4-simpsons-rule
**Platform Connection:** None

Basic and composite Simpson's rule implementations verified against known integrals. Key tests: exact for polynomials of degree <= 3 (both x^2 and x^3 match to 10 decimal places), composite rule convergence for sin from 0 to pi, and accuracy comparison showing Simpson's beats midpoint rule for smooth functions. The exactness-for-cubics test is the strongest verification — it demonstrates a known theoretical property of Simpson's rule.

## Test Verification

**4 test suites, ~30+ individual test cases** including 100,000-subdivision Riemann sums for 5 definite integrals, numerical derivative of integral functions at 10+ points, 3 IBP applications with both analytical and numerical verification, Simpson's rule exactness and convergence tests. Techniques: midpoint Riemann sum (riemannSum helper), numerical derivative of integral function (FTC Part 1), antiderivative evaluation (FTC Part 2), IBP derivation from product rule, convergence comparison (Riemann vs Simpson vs midpoint).

## 8-Dimension Scoring

| Dimension | Score | Notes |
|---|---|---|
| Mathematical Rigor | 4.50 | Two L3 theorems (FTC Part 1 & 2) handled well; L2 proofs clean |
| Proof Strategy | 4.75 | riemannSum helper parallels ch08's numericalDerivative; good architecture |
| Classification Accuracy | 4.75 | L3 for FTC (correct — MVT needed), L2 for IBP/Simpson's (correct) |
| Honest Acknowledgments | 4.25 | No explicit gaps, but FTC proofs could note Riemann integrability |
| Test Coverage | 4.50 | 5 definite integrals, 3 IBP cases, convergence and exactness tests |
| Platform Connection | 4.25 | Radius growth as Riemann sum is a real connection; others absent |
| Pedagogical Quality | 4.50 | Good parallel with ch08; FTC unifies derivative and integral |
| Cross-References | 4.50 | Depends on ch08 (limit definition, product rule); feeds ch10 (ODE solutions) |

**Composite:** 4.50

## Textbook Feedback

Chapter 9 mirrors Chapter 8 in structure and quality. Where Chapter 8 built differentiation from limits, Chapter 9 builds integration from Riemann sums and connects the two via the FTC. The riemannSum helper is the chapter's infrastructure contribution — it makes numerical integration as systematic as the numericalDerivative helper made numerical differentiation.

The five-integral FTC Part 2 verification is exemplary: trigonometric (sin), polynomial (x^2), exponential (e^x), trigonometric again (cos), and logarithmic (1/x). This breadth ensures the FTC isn't just verified on one type of function — it works across the major function families. The IBP product rule derivation test is a nice touch, showing the student that IBP isn't a separate technique but a direct consequence of something they already know.

Simpson's rule provides a practical coda: here is how you actually compute integrals numerically when antiderivatives aren't available. The exactness-for-cubics test is the right pedagogical emphasis — it gives the student a concrete reason to prefer Simpson's over simpler methods.

## Closing

Chapter 9 completes the differentiation-integration duality with four theorems and 30+ tests. The two L3 FTC theorems are the chapter's weight — they connect every derivative from Chapter 8 to a corresponding integral. The platform connection (radius growth as discrete Riemann sum) grounds the abstract theory in the platform's actual behavior. A strong second entry in Part III.

Score: 4.50/5.0

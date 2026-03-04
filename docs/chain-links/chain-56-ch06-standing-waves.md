# Chain Link: Chapter 6 — Standing Waves

**Chain position:** 56 of 100
**Subversion:** 1.50.56
**Type:** PROOF
**Part:** II: Hearing
**Score:** 4.38/5.0

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

## Chapter Summary

Chapter 6 is the most physically rich chapter in Part II, moving from wave superposition to boundary-condition quantization to Fourier series convergence. It answers the question: why are musical notes discrete? Boundary conditions on a vibrating string force wavelengths to be integer fractions of the string length, quantizing the continuous wave equation into discrete normal modes.

The chapter contains the textbook's first acknowledged gap — Fourier series convergence (thm-6-4) at L4, requiring measure theory (Riemann-Lebesgue lemma) that is beyond scope. This is honest pedagogy: the chapter proves what it can (numerical convergence) and acknowledges what it cannot (L2 convergence in the measure-theoretic sense). The Fourier coefficient decay test (1/k for odd harmonics) provides the computational evidence for a claim whose full proof requires graduate-level analysis.

The platform connections include a HIGH CONSEQUENCE theorem: boundary conditions in thm-6-2 map directly to velocity clamping in observer-bridge.ts. Just as a vibrating string can only sustain quantized modes, the platform's angular velocity is bounded by MAX_ANGULAR_VELOCITY.

## Theorems Proved

### Theorem thm-6-1: standing wave from superposition of traveling waves
**Classification:** L1 — "I see it"
**Dependencies:** None
**Test:** proof-6-1-standing-wave-superposition
**Platform Connection:** None

A*sin(kx - wt) + A*sin(kx + wt) = 2A*sin(kx)*cos(wt), verified at t=0 for multiple x values, then exhaustively across four (k, omega, A) parameter sets with 7 time steps and 7 spatial positions (~200 evaluations). The node persistence test confirms that standing wave zeros are fixed in space across all time values.

### Theorem thm-6-2: boundary conditions quantize normal modes
**Classification:** L2 — "I can do this"
**Dependencies:** thm-6-1
**Test:** proof-6-2-boundary-conditions
**Platform Connection:** src/packs/plane/observer-bridge.ts velocity clamping (HIGH CONSEQUENCE)

The chapter's key insight: sin(k_n * L) = 0 requires k_n = n*pi/L for integer n. Verified for modes 1-10 at both endpoints, with node position calculation for mode 4, frequency integer-multiple verification, and crucially, non-integer mode rejection tests (n=1.5, n=2.3 shown to violate boundary conditions). The non-integer rejection tests are the strongest evidence that quantization is real, not an artifact.

Platform connection test: angular velocity clamping analog simulates 50 steps with random velocities clamped to MAX_ANGULAR_VELOCITY, confirming bounded position changes.

### Theorem thm-6-4: Fourier series convergence
**Classification:** L4 — "Acknowledged gap — requires measure theory"
**Dependencies:** thm-6-1
**Test:** proof-6-4-fourier-convergence
**Platform Connection:** src/packs/plane/signal-classification.ts classifySignals (Fourier to signal decomposition)

The textbook's first L4 theorem. The full proof of L2 convergence requires the Riemann-Lebesgue lemma and measure theory — acknowledged as beyond scope. What IS verified: square wave Fourier partial sums converge to +1 at x=pi/2 (within 5% at 100 terms), convergence to midpoint at jump discontinuity (Gibbs phenomenon noted), and 1/k coefficient decay for odd harmonics. The signal-classification.ts connection (Fourier to signal decomposition) is structurally significant.

## Test Verification

**3 test suites, ~30+ individual test cases** including ~200 superposition evaluations across parameter space, 10-mode boundary condition checks, 2 non-integer rejection tests, 50-step velocity clamping simulation, Fourier convergence at 6 partial sum depths, coefficient decay verification. Techniques: exhaustive parametric sweep (k, omega, A grid), constructive verification (node positions), counter-example testing (non-integer modes), convergence testing (increasing Fourier terms), and platform analog simulation.

## 8-Dimension Scoring

| Dimension | Score | Notes |
|---|---|---|
| Mathematical Rigor | 4.00 | L1/L2 clean; L4 gap honestly acknowledged |
| Proof Strategy | 4.50 | Non-integer rejection tests are excellent; convergence testing well-designed |
| Classification Accuracy | 4.75 | L4 for Fourier convergence is exactly right |
| Honest Acknowledgments | 5.00 | Best in the textbook so far — L4 gap acknowledged with precise reason |
| Test Coverage | 4.25 | Strong for thm-6-1 and thm-6-2; thm-6-4 has appropriate partial coverage |
| Platform Connection | 4.50 | HIGH CONSEQUENCE boundary/clamping connection + Fourier/signal decomposition |
| Pedagogical Quality | 4.00 | Physical intuition (vibrating string) grounds abstract math |
| Cross-References | 4.00 | Forward reference to ch10 wave equation; depends on ch04 addition formulas |

**Composite:** 4.38

## Textbook Feedback

Chapter 6 is where the textbook confronts its first real mathematical boundary. The Fourier convergence theorem at L4 is not a failure — it's the chapter's most important pedagogical moment. The student learns that some proofs require tools they don't yet have, and that acknowledging this gap honestly IS mathematical rigor. The numerical evidence (convergence testing, coefficient decay) shows the student what the theorem claims, even when the proof must wait.

The non-integer mode rejection tests in thm-6-2 are outstanding. It's one thing to show that integer modes satisfy boundary conditions; it's another to show that non-integer modes violate them. This computational counter-example makes the quantization feel necessary rather than arbitrary — the physics demands it.

## Closing

Chapter 6 completes Part II's wave content with three theorems spanning L1 to L4. The standing wave superposition and boundary condition quantization are fully proved and thoroughly tested. The Fourier convergence gap at L4 is the textbook's most honest moment — acknowledged with precision, supported with numerical evidence, and deferred with clarity. The HIGH CONSEQUENCE platform connection (velocity clamping as boundary condition) gives the chapter practical weight.

Score: 4.38/5.0

# Chain Link: Chapter 4 — Trigonometry and Waves

**Chain position:** 54 of 100
**Subversion:** 1.50.54
**Type:** PROOF
**Part:** II: Hearing
**Score:** 4.25/5.0

---

## Score Trend

| Pos | Chapter | Score | Delta |
|-----|---------|-------|-------|
| 51  | Ch 1 — Numbers | 4.25 | — |
| 52  | Ch 2 — Unit Circle | 4.50 | +0.25 |
| 53  | Ch 3 — Pythagorean | 4.25 | -0.25 |
| 54  | Ch 4 — Trig & Waves | 4.25 | +0.00 |

## Chapter Summary

Chapter 4 opens Part II: Hearing by extending the unit circle's trigonometric functions into the wave domain. The addition formulas for cosine and sine are the chapter's backbone — from them flow the double-angle formulas (a direct corollary) and the sum-to-product identity that produces beat frequencies. The chapter moves from static geometry (what are the trig functions?) to dynamic behavior (what happens when you combine them?).

This is the first chapter where sound becomes visible. The beat frequency theorem (thm-4-6) shows how two slightly detuned frequencies produce an audible pulse — the sum-to-product identity turned into a physical phenomenon. The platform connection is HIGH CONSEQUENCE: src/packs/plane/signal-classification.ts uses beat-frequency sensitivity for signal classification.

The chapter has four theorems but tests them exhaustively: an 8x8 angle grid (64 pairs) for each addition formula, 20-angle sweeps for double-angle formulas, and 100 random pairs for beat frequency. The computational verification density is high.

## Theorems Proved

### Theorem thm-4-1: cosine addition formula
**Classification:** L2 — "I can do this"
**Dependencies:** thm-2-1
**Test:** proof-4-1-cos-addition
**Platform Connection:** src/packs/plane/arithmetic.ts angular addition

cos(alpha + beta) = cos(alpha)cos(beta) - sin(alpha)sin(beta), verified on an 8x8 grid of evenly-spaced angles (64 test cases). Every pair confirms the identity to 10 decimal places. The angular addition in platform arithmetic is a direct application.

### Theorem thm-4-2: sine addition formula
**Classification:** L2 — "I can do this"
**Dependencies:** thm-2-1
**Test:** proof-4-2-sin-addition
**Platform Connection:** src/packs/plane/arithmetic.ts angular addition

sin(alpha + beta) = sin(alpha)cos(beta) + cos(alpha)sin(beta), same 8x8 grid verification. The parallel treatment with thm-4-1 — same test structure, same precision — is clean pedagogy.

### Theorem thm-4-3: double-angle formulas
**Classification:** L1 — "I see it"
**Dependencies:** thm-4-1, thm-4-2
**Test:** proof-4-3-double-angle
**Platform Connection:** None

Direct corollary: set beta = alpha in the addition formulas. Verified at 20 angles for cos(2theta) = cos^2 - sin^2, sin(2theta) = 2sin*cos, and the alternate form cos(2theta) = 1 - 2sin^2. The L1 classification is correct — once you see the addition formulas, the double-angle identities are immediate.

### Theorem thm-4-6: beat frequency — sum-to-product identity
**Classification:** L2 — "I can do this"
**Dependencies:** thm-4-1, thm-4-2
**Test:** proof-4-6-beat-frequency
**Platform Connection:** src/packs/plane/signal-classification.ts beat-frequency sensitivity (HIGH CONSEQUENCE)

cos(A) - cos(B) = -2sin((A+B)/2)sin((A-B)/2), verified with 100 random angle pairs, a beat period calculation using A4 = 440Hz with 2Hz detuning, and the zero-beat case (A = B). The HIGH CONSEQUENCE label reflects the platform's use of beat-frequency sensitivity in signal classification.

## Test Verification

**4 test suites, ~200+ individual test cases** (two 64-pair grids, three 20-angle sweeps, 100 random pairs, beat period calculation, 20 zero-beat checks). Techniques: exhaustive grid evaluation (8x8 angle pairs), property testing with random sampling (100 pairs for beat frequency), physical parameter verification (440Hz A4, 2Hz detuning), degenerate case testing (A = B zero beat). The 8x8 grid approach is the chapter's signature — it ensures systematic coverage rather than relying solely on random sampling.

## 8-Dimension Scoring

| Dimension | Score | Notes |
|---|---|---|
| Mathematical Rigor | 4.00 | L1/L2 proofs clean; addition formulas well-verified |
| Proof Strategy | 4.50 | 8x8 systematic grid is excellent; beat frequency adds physical context |
| Classification Accuracy | 4.50 | L1 for double-angle (correct — immediate corollary), L2 for the rest |
| Honest Acknowledgments | 4.00 | No gaps to acknowledge at this level |
| Test Coverage | 4.75 | 200+ test cases; exhaustive grid coverage for core identities |
| Platform Connection | 4.25 | Beat frequency HIGH CONSEQUENCE connection; angular addition structural |
| Pedagogical Quality | 4.00 | Good transition from geometry to waves; beat frequency motivates sound |
| Cross-References | 4.00 | Clean dependency chain from ch02 Pythagorean identity |

**Composite:** 4.25

## Textbook Feedback

Chapter 4 makes the transition from seeing to hearing. The addition formulas are the algebraic machinery; the beat frequency theorem is the physical payoff. The pedagogical arc — from identity (cos addition) to corollary (double angle) to application (beat frequency) — is well-designed. The 8x8 grid testing pattern is the right choice for these identities: systematic coverage over a representative domain, not just random spot checks.

The beat frequency test with A4 = 440Hz and 2Hz detuning is a particularly nice touch — it grounds the abstract identity in a sound the student can imagine hearing. The zero-beat degenerate case (A = B gives cos(A) - cos(A) = 0) completes the picture: no frequency difference, no beating.

## Closing

Chapter 4 launches Part II by turning trigonometric identities into wave behavior. Four theorems, all computationally verified with systematic grid and random sampling approaches, establish the addition formulas that underpin everything from standing waves (Ch 6) to Fourier analysis (Ch 6, Ch 9). The beat frequency HIGH CONSEQUENCE connection to signal-classification.ts anchors the chapter in platform reality.

Score: 4.25/5.0

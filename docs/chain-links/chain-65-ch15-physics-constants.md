# Chain Link: Chapter 15 — Physics Constants and Dimensional Analysis

**Chain position:** 65 of 100
**Subversion:** 1.50.66
**Type:** PROOF
**Part:** V: Grounding
**Score:** 4.25/5.0

---

## Score Trend

```
Pos  Ch   Score  Delta
 57   7   4.25  -0.13
 58   8   4.63  +0.38
 59   9   4.50  -0.13
 60  10   4.25  -0.25
 61  11   4.25  +0.00
 62  12   4.50  +0.25
 63  13   4.38  -0.12
 64  14   4.63  +0.25
 65  15   4.25  -0.38
rolling(8): 4.42 | part-b-avg: 4.38
```

## Chapter Summary

Chapter 15 opens Part V (Grounding) by applying the mathematical machinery of Parts I-IV to physics. The central theorem is the Buckingham Pi theorem, which uses rank-nullity from linear algebra (Chapter 12) to determine how many independent dimensionless groups exist in a physical system. For the simple pendulum with variables T, L, m, g and three base dimensions M, L, T, the dimensional matrix has rank 3, so there is exactly one dimensionless Pi group: T*sqrt(g/L).

The chapter then proves that natural units (where F = ma with coefficient 1) are invariant under consistent rescaling, and that the fine structure constant alpha = 1/137 is dimensionless — its value is the same regardless of the unit system. These are mathematical consequences of dimensional algebra, not physical claims.

The transition from pure mathematics to physics grounding is pedagogically important. The chapter is careful to test the mathematical model, not physical truth: the Buckingham Pi theorem is a theorem of linear algebra, and dimensional invariance is a theorem of algebraic structure.

## Theorems Proved

### Theorem 15.1: Buckingham Pi theorem — rank-nullity gives 1 dimensionless group
**Classification:** L3 — "This is hard but I am getting it"
**Dependencies:** thm-12-1
**Test:** proof-15-1-buckingham-pi
**Platform Connection:** Rank-nullity theorem from linear algebra determines how many dimensionless groups exist

The constructive proof builds the dimensional matrix D for the simple pendulum (rows = M, L, T; columns = T, L, m, g), computes its rank via Gaussian elimination with partial pivoting, and applies rank-nullity: dim(null(D)) = 4 - 3 = 1. The test verifies rank 3 and null space dimension 1, then constructs the Pi group explicitly. L3 because the connection between null spaces and dimensional analysis is non-obvious.

### Theorem 15.2: Natural units — F/(ma) = 1 is invariant under consistent rescaling
**Classification:** L2 — "I can do this"
**Dependencies:** thm-15-1
**Test:** proof-15-2-natural-units
**Platform Connection:** src/packs/plane/types.ts radius in [0,1] is natural units normalization — max skill strength = 1

The invariance of dimensionless ratios under unit changes. If you rescale length by alpha, mass by beta, and time by gamma, then F/(ma) remains 1 because each factor transforms consistently. Tests verify invariance under multiple rescaling factors. The platform connection is direct: normalizing radius to [0,1] is exactly natural units normalization.

### Theorem 15.3: Fine structure constant alpha = 1/137 is dimensionless and unit-invariant
**Classification:** L2 — "I can do this"
**Dependencies:** thm-15-1
**Test:** proof-15-3-fine-structure
**Platform Connection:** MATURITY_THRESHOLD/MAX_ANGULAR_VELOCITY ratio is a dimensionless platform constant analogous to alpha

Alpha = e^2 / (4*pi*epsilon_0*hbar*c) is shown to be dimensionless by verifying that all dimensions cancel in the expression. The test verifies dimensional cancellation symbolically and numerically. The platform analogy: the ratio of MATURITY_THRESHOLD to MAX_ANGULAR_VELOCITY is a dimensionless constant that characterizes the platform's learning dynamics, just as alpha characterizes electromagnetic coupling.

## Test Verification

**Test count:** 17
**Test file:** test/proofs/part-v-grounding/ch15-physics-constants.test.ts (336 lines)

The test infrastructure includes Gaussian elimination with partial pivoting for rank computation and null space dimension. Key verification techniques:
- Matrix rank computation verified against known dimensional matrices
- Null space dimension verified via rank-nullity formula
- Unit rescaling invariance tested with multiple scale factors
- Dimensional cancellation verified symbolically
- Cross-checks with multiple physical systems beyond pendulum

## 8-Dimension Scoring

| Dimension | Score | Notes |
|---|---|---|
| Mathematical Rigor | 4.25 | Buckingham Pi correctly proved via rank-nullity; other proofs simpler |
| Proof Strategy | 4.25 | Good use of linear algebra toolkit from Ch12 |
| Classification Accuracy | 4.25 | L3 for Buckingham Pi appropriate; L2 for unit invariance correct |
| Honest Acknowledgments | 4.50 | Clear separation of math model vs physical truth |
| Test Coverage | 4.00 | 17 tests adequate; could use more dimensional matrices |
| Platform Connection | 4.00 | Structural analogies rather than identity-level connections |
| Pedagogical Quality | 4.25 | Good Part V opener; dimensional analysis is a useful skill |
| Cross-References | 4.25 | Clean dependency on rank-nullity (Ch12); forward to Ch16-17 |
**Composite:** 4.25

## Textbook Feedback

A solid chapter that does its job as the Part V opener. The Buckingham Pi theorem is a genuine application of linear algebra, and the rank-nullity connection is well-made. The careful distinction between testing mathematical models vs physical truth is commendable and sets the right tone for the physics chapters. The platform connections are structural rather than identity-level — the natural units normalization is a good parallel but not as tight as the Euler's formula connections in Part IV.

## Closing

Score: 4.25/5.0

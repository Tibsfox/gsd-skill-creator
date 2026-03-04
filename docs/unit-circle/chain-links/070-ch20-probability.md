# Chain Link: Chapter 20 — Probability and Statistics

**Chain position:** 70 of 100
**Subversion:** 1.50.72
**Type:** PROOF
**Part:** VI: Defining
**Score:** 4.50/5.0

---

## Score Trend

```
Pos  Ch   Score  Delta
 62  12   4.50  +0.25
 63  13   4.38  -0.12
 64  14   4.63  +0.25
 65  15   4.25  -0.38
 66  16   4.25  +0.00
 67  17   4.38  +0.13
 68  18   4.25  -0.13
 69  19   4.50  +0.25
 70  20   4.50  +0.00
rolling(8): 4.39 | part-b-avg: 4.39
```

## Chapter Summary

Chapter 20 closes Part VI and the first 20 chapters of the textbook with probability theory — the mathematics of uncertainty. The chapter proves three foundational results: Bayes' theorem, the Weak Law of Large Numbers, and a simulation-based verification of the Central Limit Theorem. The Kolmogorov probability axioms are accepted as L5 definitions.

Bayes' theorem P(A|B) = P(B|A)*P(A)/P(B) is proved directly from the definition of conditional probability and verified with the medical test example (1% prevalence, 99% sensitivity, 95% specificity -> P(disease|positive) = 49%). The Law of Large Numbers is proved via Chebyshev's inequality, and the CLT is verified by simulation — standardized sums of Uniform[0,1] samples converge to N(0,1) with KS statistic < 0.02.

The platform connection for Bayes' theorem is the strongest in Part VI and one of the strongest in the entire textbook: computeEnhancedScore in src/packs/plane/activation.ts IS Bayesian inference. This is not an analogy — the function computes a posterior from a prior (base score) and evidence (context signals) using the exact mathematical structure of Bayes' theorem.

## Theorems Proved

### Theorem 20.1: Bayes' theorem — P(A|B) = P(B|A)*P(A)/P(B); medical test example
**Classification:** L2 — "I can do this"
**Dependencies:** None
**Test:** proof-20-1-bayes-theorem
**Platform Connection:** computeEnhancedScore in src/packs/plane/activation.ts IS Bayesian inference (identity-level connection)

Derived directly from P(A and B) = P(A|B)*P(B) = P(B|A)*P(A). The medical test example provides concrete intuition: even with a 99% sensitive test, the posterior probability of disease given a positive test is only 49% when prevalence is 1%. Tests verify the formula algebraically and numerically, and check the medical test computation. The identity-level platform connection makes this the most important theorem in Part VI.

### Theorem 20.2: Weak Law of Large Numbers via Chebyshev's inequality
**Classification:** L2 — "I can do this"
**Dependencies:** thm-20-1
**Test:** proof-20-2-law-of-large-numbers
**Platform Connection:** Long-run average skill score converges to true quality — law of large sessions

Chebyshev's inequality P(|X-bar_n - mu| > epsilon) <= sigma^2/(n*epsilon^2) bounds the probability that the sample mean deviates from the population mean. Tests verify convergence by simulation: generate 10,000 uniform samples, compute running averages, and show the deviation decreases as 1/n. For n = 10,000, the deviation from mu = 0.5 is less than 0.01. The platform connection: over many sessions, a skill's average score converges to its true quality.

### Theorem 20.3: Central Limit Theorem — simulation verification, KS < 0.02
**Classification:** L3 — "This is hard but I am getting it"
**Dependencies:** thm-20-2
**Test:** proof-20-3-central-limit-theorem
**Platform Connection:** Aggregated skill scores across many sessions approximate a normal distribution

The CLT states that standardized sums of iid random variables converge to N(0,1). The test generates 10,000 samples of sum-of-100-uniforms, standardizes them, and measures the Kolmogorov-Smirnov statistic against the standard normal CDF. The KS statistic is verified to be less than 0.02. L3 because the CLT's proof requires moment generating functions or characteristic functions beyond the textbook scope — but the simulation provides compelling evidence. The normCDF approximation uses the Abramowitz-Stegun formula (max error < 7.5e-8).

## Test Verification

**Test count:** 18
**Test file:** test/proofs/part-vi-defining/ch20-probability.test.ts (453 lines)

Infrastructure includes deterministic LCG, Box-Muller transform for normal samples, sample mean/variance computation, Abramowitz-Stegun normal CDF approximation, and KS statistic calculation. Verification techniques:
- Algebraic and numerical Bayes' theorem verification
- Medical test posterior computation with specific prevalence/sensitivity/specificity
- Convergence simulation for WLLN (10,000 samples)
- KS goodness-of-fit test for CLT (10,000 standardized sums)
- Deterministic seeds for full reproducibility

## 8-Dimension Scoring

| Dimension | Score | Notes |
|---|---|---|
| Mathematical Rigor | 4.25 | Bayes and WLLN fully proved; CLT verified by simulation only |
| Proof Strategy | 4.50 | Bayes->LLN->CLT builds from exact to asymptotic |
| Classification Accuracy | 4.50 | L2 Bayes/LLN, L3 CLT — correct calibration |
| Honest Acknowledgments | 4.50 | CLT proof deferred; simulation provides strong evidence |
| Test Coverage | 4.25 | 18 tests; simulation-based verification is appropriate |
| Platform Connection | 4.75 | computeEnhancedScore IS Bayesian inference — identity-level |
| Pedagogical Quality | 4.75 | Medical test example is one of the best in the textbook |
| Cross-References | 4.50 | Connects to activation.ts directly; forward to Ch24 information theory |
**Composite:** 4.50

## Textbook Feedback

An excellent chapter that closes Part VI with both mathematical substance and practical relevance. The medical test example for Bayes' theorem is pedagogically brilliant — it combats the base rate fallacy that trips up even trained professionals. The identity-level platform connection to computeEnhancedScore is the kind of deep structural insight that justifies the entire proof chain project. The CLT simulation approach is honest: instead of pretending to prove a theorem that requires characteristic functions, it provides 10,000-sample empirical evidence and uses a proper goodness-of-fit statistic. The KS test threshold of 0.02 is demanding enough to be meaningful.

## Closing

Score: 4.50/5.0

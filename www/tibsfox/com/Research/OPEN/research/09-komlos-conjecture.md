# The Komlos Conjecture

> **Problem ID:** OPEN-P9
> **Domain:** Discrepancy Theory
> **Status:** Open since 1981
> **Through-line:** *Given a collection of unit vectors, can you always assign them signs +1 or -1 so that the signed sum is bounded by an absolute constant? This is the load balancing problem in its purest mathematical form: distribute tasks across agents so that no agent is overloaded, regardless of how the tasks are structured. If the conjecture is true, perfect balance is always achievable.*

---

## Table of Contents

1. [Formal Problem Statement](#1-formal-problem-statement)
2. [History](#2-history)
3. [Current State of the Art](#3-current-state-of-the-art)
4. [Connection to Our Work](#4-connection-to-our-work)
5. [Open Questions](#5-open-questions)
6. [References](#6-references)

---

## 1. Formal Problem Statement

Let `v_1, v_2, ..., v_n` be vectors in `R^d` with `||v_i||_2 <= 1` for all `i`. The **Komlos conjecture** states:

> There exist signs `epsilon_1, ..., epsilon_n in {-1, +1}` such that `||sum_{i=1}^{n} epsilon_i * v_i||_infinity <= C` for some absolute constant `C` independent of `n` and `d`.

Here `||x||_infinity = max_j |x_j|` is the L-infinity norm (maximum coordinate), and the claim is that `C` does not depend on the dimension `d` or the number of vectors `n`.

**Equivalent matrix formulation.** Let `A` be a `d x n` matrix with columns `v_1, ..., v_n`, where each column has Euclidean norm at most 1. The conjecture states:

```
min_{epsilon in {-1,+1}^n} ||A * epsilon||_infinity <= C
```

for an absolute constant `C`.

**Context in discrepancy theory.** The **discrepancy** of a matrix `A` is `disc(A) = min_{epsilon in {-1,+1}^n} ||A * epsilon||_infinity`. The Komlos conjecture asserts that the discrepancy of any matrix with unit-norm columns is O(1). This is a statement about how well one can "balance" a set of vectors by choosing their signs.

## 2. History

**1981:** Janos Komlos proposes the conjecture, motivated by problems in combinatorics and probability. The conjecture is a natural strengthening of earlier results in discrepancy theory by Spencer (1985, "Six Standard Deviations Suffice") and Beck & Fiala (1981).

**1985:** Joel Spencer proves the "Six Standard Deviations Suffice" theorem: for any `n x n` matrix with entries in `{0, 1}` and column sums at most `t`, the discrepancy is `O(sqrt(t * log n))`. This is a powerful result but applies to `{0,1}` matrices, not arbitrary unit-norm-column matrices.

**1998:** Wojciech Banaszczyk proves the best known bound for the Komlos conjecture: `disc(A) <= O(sqrt(log d))` for any `d x n` matrix with unit-norm columns. The proof uses convex geometry (Gaussian measures on convex bodies) and is non-constructive. The bound `sqrt(log d)` is tantalizingly close to the conjectured `O(1)` but has resisted improvement for over 25 years.

**2010:** Nikhil Bansal gives the first algorithmic proof of Spencer's theorem, using semidefinite programming to find the signs. This was a breakthrough in making discrepancy results constructive.

**2012:** Bansal uses Banaszczyk's convex body technique algorithmically, giving an efficient algorithm to achieve the `O(sqrt(log d))` bound.

**2015-2020:** Levy, Ramadas, and Rothvoss make incremental progress on special cases (sparse matrices, structured column sets). The Gram-Schmidt walk algorithm (Bansal & Dadush, 2019) provides a new algorithmic framework that achieves Banaszczyk's bound through a random walk on the hypercube.

**2023-present:** Connection to the Beck-Fiala conjecture (another major open problem in discrepancy theory) is clarified. Progress on Beck-Fiala by Bansal et al. (2023) reaches `O(sqrt(log n) * log log n)`, approaching but not reaching the conjectured `O(sqrt(t))` bound.

## 3. Current State of the Art

**Banaszczyk's bound `O(sqrt(log d))` remains the best known.** All attempts to remove the `sqrt(log d)` factor have failed. The barrier appears to be the Gaussian concentration inequality used in the proof -- it inherently introduces a logarithmic factor.

**Algorithmic progress.** The Gram-Schmidt walk (Bansal & Dadush, 2019) and its extensions provide efficient algorithms matching the `O(sqrt(log d))` bound. These algorithms are randomized and run in polynomial time. For the special case of `d = O(1)` (fixed dimension), the conjecture is trivially true -- the open case is when `d` grows with `n`.

**Partial results.** The conjecture is known to hold for:
- Vectors in `R^2` (Steinitz lemma gives O(1))
- Vectors that are sparse (few nonzero coordinates per vector)
- Random vectors (with high probability, random unit vectors satisfy the conjecture)
- Structured vectors arising from combinatorial set systems

**Connections.** The Komlos conjecture implies the Beck-Fiala conjecture (with constant discrepancy), which would have profound consequences for combinatorial optimization, approximation algorithms, and computational geometry.

## 4. Connection to Our Work

**Load balancing in the convoy model.** The Komlos conjecture is the mathematical formulation of load balancing. In the convoy model, tasks are "vectors" (each task has a multi-dimensional resource profile: CPU time, memory, file I/O, model API calls) and agents are "coordinates." Assigning tasks to agents (with +1 meaning "assign to this wave" and -1 meaning "assign to the next wave") should balance the load across waves. If the Komlos conjecture is true, there always exists an assignment that keeps the maximum per-wave load bounded by a constant, regardless of how many tasks and how many resource dimensions there are.

**Agent assignment optimization.** The current GSD executor assigns tasks to agents using a simple round-robin or dependency-based strategy. A Banaszczyk-style algorithm (Gram-Schmidt walk) could provide near-optimal assignments that minimize the maximum load imbalance. The `O(sqrt(log d))` bound means that with 10 resource dimensions, the imbalance factor is at most `sqrt(log 10) ~ 1.5` -- nearly optimal.

**Discrepancy in test distribution.** When distributing 21,298 tests across parallel runners, the question "can we balance test execution time across runners?" is a discrepancy problem. Each test has a runtime vector, and we want to minimize the maximum total runtime across runners. The Komlos conjecture says the balance should be achievable to within a constant factor.

**Sign-assignment as binary decision.** The +1/-1 assignment in the Komlos conjecture maps to binary decisions throughout the system: approve/reject (trust system), include/exclude (skill activation), pass/fail (test execution). The conjecture suggests that for any set of multi-dimensional assessments, there exists a binary assignment that is nearly balanced.

## 5. Open Questions

- **Can the Gram-Schmidt walk algorithm be implemented as a GSD task scheduler?** The algorithm takes a matrix of task-resource profiles and outputs a near-optimal sign assignment. Implementing it as a convoy scheduler plugin would provide provably balanced wave assignments.
- **Does the `sqrt(log d)` factor matter in practice?** For typical convoy model parameters (`d` = 5-10 resource dimensions, `n` = 10-50 tasks), the Banaszczyk bound gives excellent balance. The theoretical gap (O(sqrt(log d)) vs. O(1)) may be practically irrelevant for our problem sizes.
- **Can discrepancy theory inform the trust system's multi-criteria balancing?** Trust scores incorporate multiple criteria (accuracy, calibration, latency, cost). The Komlos conjecture suggests that a balanced weighting always exists, even when criteria conflict.

## 6. References

- Banaszczyk, W. (1998). "Balancing Vectors and Gaussian Measures of n-Dimensional Convex Bodies." *Random Structures & Algorithms*, 12(4), 351-360.
- Spencer, J. (1985). "Six Standard Deviations Suffice." *Transactions of the AMS*, 289(2), 679-706.
- Beck, J. & Fiala, T. (1981). "Integer-Making Theorems." *Discrete Applied Mathematics*, 3(1), 1-8.
- Bansal, N. (2010). "Constructive Algorithms for Discrepancy Minimization." *FOCS 2010*. [arXiv:1002.2259](https://arxiv.org/abs/1002.2259)
- Bansal, N. & Dadush, D. (2019). "The Gram-Schmidt Walk: A Cure for the Banaszczyk Blues." *STOC 2019*. [arXiv:1708.01079](https://arxiv.org/abs/1708.01079)
- Bansal, N., et al. (2023). "Improved Bounds for the Beck-Fiala Conjecture." [arXiv:2305.05617](https://arxiv.org/abs/2305.05617)
- Matousek, J. (1999). *Geometric Discrepancy: An Illustrated Guide*. Springer.
- Chazelle, B. (2000). *The Discrepancy Method: Randomness and Complexity*. Cambridge University Press.

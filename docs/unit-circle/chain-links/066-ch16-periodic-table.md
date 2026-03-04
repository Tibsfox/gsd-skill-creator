# Chain Link: Chapter 16 — Periodic Table and Atomic Structure

**Chain position:** 66 of 100
**Subversion:** 1.50.67
**Type:** PROOF
**Part:** V: Grounding
**Score:** 4.25/5.0

---

## Score Trend

```
Pos  Ch   Score  Delta
 58   8   4.63  +0.38
 59   9   4.50  -0.13
 60  10   4.25  -0.25
 61  11   4.25  +0.00
 62  12   4.50  +0.25
 63  13   4.38  -0.12
 64  14   4.63  +0.25
 65  15   4.25  -0.38
 66  16   4.25  +0.00
rolling(8): 4.41 | part-b-avg: 4.37
```

## Chapter Summary

Chapter 16 proves two combinatorial theorems about atomic structure: the shell capacity formula 2n^2 and the periodicity of the Aufbau filling sequence. Both proofs accept quantum mechanical postulates (Pauli exclusion, quantum number rules, Aufbau ordering) as L5 axioms and derive their mathematical consequences. This is not physics — it is combinatorics constrained by quantum rules.

The shell capacity proof is elegant: for principal quantum number n, the angular quantum number l ranges from 0 to n-1, each subshell has capacity 2(2l+1) electrons, and summing gives 2 * sum(2l+1, l=0..n-1) = 2n^2. This is a finite series identity. The periodicity proof traces the Aufbau filling order and shows that noble gas configurations occur at Z = 2, 10, 18, 36, 54, 86, generating period lengths [2, 8, 8, 18, 18, 32].

With only 2 theorems, this is the most compact chapter in the review chain. The proofs are correct and the L2 classifications are appropriate — both are straightforward combinatorial computations. The platform connections are structural: PROMOTION_REGIONS as discrete angular sectors parallel the discrete shell structure.

## Theorems Proved

### Theorem 16.1: Shell capacity = 2n^2 via subshell summation
**Classification:** L2 — "I can do this"
**Dependencies:** None (quantum number rules accepted as L5 axioms)
**Test:** proof-16-1-shell-filling
**Platform Connection:** Discrete levels with increasing capacity mirror shell capacity sequence

The proof sums subshell capacities 2(2l+1) for l = 0 to n-1. The sum of odd numbers 1 + 3 + 5 + ... + (2n-1) = n^2 is a well-known identity, and multiplying by 2 gives 2n^2. Tests verify the formula for n = 1 through 5, producing the sequence 2, 8, 18, 32, 50. Individual subshell capacities 2, 6, 10, 14 (s, p, d, f) are verified against the formula 2(2l+1).

### Theorem 16.2: Periodicity — Aufbau recurrence generates period lengths [2,8,8,18,18,32]
**Classification:** L2 — "I can do this"
**Dependencies:** thm-16-1
**Test:** proof-16-2-periodicity
**Platform Connection:** PROMOTION_REGIONS as discrete angular sectors — both systems partition space into discrete levels

The Aufbau filling order (accepted as empirical axiom) fills subshells in a specific sequence: 1s, 2s, 2p, 3s, 3p, 4s, 3d, 4p, 5s, 4d, 5p, 6s, 4f, 5d, 6p. Noble gas configurations mark period boundaries. The proof traces cumulative electron counts and identifies the noble gas atomic numbers, then computes period lengths by successive differences. The test suite implements the full Aufbau ordering with 15 subshell entries and verifies all 6 noble gas positions.

## Test Verification

**Test count:** 16
**Test file:** test/proofs/part-v-grounding/ch16-periodic-table.test.ts (240 lines)

Helper functions implement shell capacity computation, subshell capacity formula, Aufbau filling order (15 entries), and orbital filling simulation. Verification techniques:
- Direct formula verification for n = 1 through 5
- Individual subshell capacity checks (s, p, d, f orbitals)
- Noble gas atomic number verification against known values
- Period length computation by successive differences
- Full Aufbau sequence tracing for elements up to Z = 86 (Radon)

## 8-Dimension Scoring

| Dimension | Score | Notes |
|---|---|---|
| Mathematical Rigor | 4.25 | Clean combinatorial proofs; correct but elementary |
| Proof Strategy | 4.00 | Direct computation; no sophisticated strategy needed |
| Classification Accuracy | 4.50 | Both at L2 is correct — these are counting arguments |
| Honest Acknowledgments | 4.50 | Quantum axioms clearly labeled as L5; Aufbau ordering as empirical |
| Test Coverage | 4.25 | 16 tests for 2 theorems; thorough coverage |
| Platform Connection | 3.75 | Structural parallel only — discrete levels mirror shells |
| Pedagogical Quality | 4.25 | Good example of mathematical consequences from physical axioms |
| Cross-References | 4.00 | Minimal backward references; forward to Ch17 quantum mechanics |
**Composite:** 4.25

## Textbook Feedback

A compact, well-scoped chapter. The strength is the clear separation between the quantum axioms (accepted as L5) and their combinatorial consequences (proved at L2). The shell capacity formula is a satisfying sum-of-odd-numbers identity, and the periodicity proof is a nice exercise in tracing a filling sequence. The chapter is intentionally brief — with only 2 theorems, there is no padding. The platform connections are the weakest in Part V, being structural parallels rather than mathematical identities.

## Closing

Score: 4.25/5.0

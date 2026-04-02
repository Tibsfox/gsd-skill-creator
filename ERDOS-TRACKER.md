# Erdős Problem Tracker — Artemis II Research

Active tracking of prize-eligible Erdős problems with computational approaches.
Database: [erdosproblems.com](https://www.erdosproblems.com) | [GitHub](https://github.com/teorth/erdosproblems)
Prizes administered by Combinatorics Foundation (Steve Butler). Requires journal publication.

**Stats:** 1,183 problems total | 640 open | 105 with prizes | $53,117 total prize pool | $19,200 claimed

---

## TIER 1 — HIGH PRIZE, OPEN, SIM-TRACTABLE

### #142 — $10,000 (OPEN)
**Field:** Additive combinatorics, arithmetic progressions
**Statement:** Erdős-Turán conjecture on additive bases. If A is an asymptotic basis of order 2, must the representation function be unbounded?
**Approach:** Computational search for bases with bounded representation. GPU enumeration of additive bases. Could find counterexample or push verification bounds.
**Hardware:** RTX 4060 Ti — enumerate candidate sets, check representation counts
**Difficulty:** Very hard. The $10K price tag is Erdős saying "I don't think this is true but prove me wrong."

### #3 — $5,000 (OPEN)
**Field:** Number theory, additive combinatorics, arithmetic progressions
**Statement:** If A ⊆ ℕ has Σ(1/n) = ∞ for n ∈ A, must A contain arbitrarily long arithmetic progressions?
**Approach:** This is the Erdős conjecture on arithmetic progressions. Related to Green-Tao theorem (primes contain arbitrary APs). Computational: search for dense sets avoiding long APs, push bounds on what's possible.
**Hardware:** GPU-parallel AP search in dense subsets
**Difficulty:** Extremely hard. Generalizes Szemerédi's theorem.

### #30 — $1,000 (OPEN)
**Field:** Number theory, Sidon sets, additive combinatorics
**Statement:** Concerns Sidon sets (B₂ sets) — sets where all pairwise sums are distinct. What is the maximum size of a Sidon set in {1,...,n}?
**Approach:** GPU exhaustive search for large Sidon sets. Known bound: ~√n. Can we find constructions that beat current records?
**Hardware:** Perfect for GPU — pairwise sum checking is embarrassingly parallel
**Difficulty:** Medium-hard. Active research area, incremental progress possible.

### #20 — $1,000 (OPEN)
**Field:** Combinatorics
**Statement:** Sunflower lemma bounds. Related to the Δ-system (sunflower) problem.
**Approach:** Recent breakthrough by Alweiss-Lovett-Wu-Zhang improved bounds. Computational verification of new constructions.
**Hardware:** Combinatorial search, moderate memory
**Difficulty:** Medium. Recent progress means low-hanging fruit may remain.

### #64 — $1,000 (FALSIFIABLE)
**Field:** Graph theory, cycles
**Statement:** A falsifiable problem about cycle lengths in graphs.
**Approach:** Graph enumeration — build graphs, check cycle structure, look for counterexamples.
**Hardware:** GPU graph algorithms
**Difficulty:** Medium. "Falsifiable" means a counterexample would solve it.

---

## TIER 2 — $500 PRIZE, OPEN, BEST ODDS

### #1 — $500 (OPEN)
**Field:** Number theory, additive combinatorics
**Statement:** Related to sum-free sets and density conditions.
**Approach:** Enumerate sum-free sets, check density bounds computationally.
**Hardware:** Integer arithmetic, GPU parallel
**Difficulty:** Medium

### #19 — $500 (DECIDABLE → NEARLY RESOLVED)
**Field:** Graph theory, hypergraph chromatic index
**Statement:** Erdős-Faber-Lovász conjecture (1972): If n complete graphs, each of size n, share at most one vertex pairwise, then the union can be properly edge-colored with n colors. Equivalently: χ'(H) ≤ n for any linear hypergraph on n vertices.
**Status UPDATE (2026-04-01):** Kang-Kelly-Kühn-Methuku-Osthus proved it for all sufficiently large n (arXiv:2101.04698, Annals of Mathematics 2023). Hindman (1981) verified computationally for L ≤ 10. The GAP is small n: the proof threshold n₀ is not explicit. A GPU computation verifying all n up to the implicit threshold would CLOSE THE PROBLEM COMPLETELY.
**Approach:** Determine the implicit n₀ from the proof constants. Enumerate all linear hypergraphs for n = 11 through n₀ and verify χ' ≤ n. This is embarrassingly parallel — each n is independent.
**Hardware:** RTX 4060 Ti. Hypergraph enumeration + coloring checks. Memory-bound for large n but the threshold may be manageable.
**Difficulty:** Medium-hard. Need to extract explicit constants from the proof first (82-page paper). The computation itself is well-defined once n₀ is known.
**Prize status:** $500 from Erdős. Kahn received $100 consolation for asymptotic result. Full resolution for ALL n would claim the remaining prize.

### #28 — $500 (OPEN)
**Field:** Number theory, additive basis
**Statement:** Additive basis question.
**Approach:** Enumerate bases, check properties.
**Hardware:** GPU integer arithmetic
**Difficulty:** Medium

### #39 — $500 (OPEN)
**Field:** Number theory, Sidon sets, additive combinatorics
**Statement:** Related to Sidon sets (see also #30).
**Approach:** Same GPU Sidon set machinery as #30.
**Hardware:** Parallel pairwise sum verification
**Difficulty:** Medium

### #40 — $500 (OPEN)
**Field:** Number theory, additive basis
**Statement:** Additive basis problem.
**Approach:** Computational enumeration
**Hardware:** GPU parallel
**Difficulty:** Medium

### #41 — $500 (OPEN)
**Field:** Number theory, Sidon sets, additive combinatorics
**Statement:** Another Sidon set question.
**Approach:** GPU Sidon machinery — build once, attack #30, #39, #41 together
**Hardware:** Same toolkit
**Difficulty:** Medium

### #66 — $500 (OPEN)
**Field:** Number theory, additive basis
**Statement:** Additive basis.
**Approach:** Computational
**Hardware:** GPU
**Difficulty:** Medium

### #74 — $500 (OPEN)
**Field:** Graph theory, chromatic number, cycles
**Statement:** Chromatic number + cycle structure.
**Approach:** Graph enumeration + coloring
**Hardware:** GPU graph algorithms
**Difficulty:** Medium

### #89 — $500 (OPEN)
**Field:** Geometry, distances
**Statement:** Distinct distances problem variant.
**Approach:** Point set enumeration, distance computation. GPU-friendly.
**Hardware:** Floating point geometry on GPU
**Difficulty:** Medium

### #90 — $500 (OPEN)
**Field:** Geometry, distances
**Statement:** Another distance problem.
**Approach:** Same geometric toolkit as #89
**Hardware:** GPU geometry
**Difficulty:** Medium

### #92 — $500 (OPEN)
**Field:** Geometry, distances
**Statement:** Distance problem.
**Approach:** Same toolkit
**Hardware:** GPU
**Difficulty:** Medium

### #107 — $500 (FALSIFIABLE)
**Field:** Geometry, convex
**Statement:** Convex geometry question. Falsifiable = counterexample search.
**Approach:** Generate convex point configurations, check property.
**Hardware:** GPU geometry
**Difficulty:** Medium. Falsifiable is good — we're looking for a single counterexample.

### #138 — $500 (OPEN)
**Field:** Additive combinatorics
**Statement:** Additive combinatorics question.
**Approach:** Computational
**Hardware:** GPU
**Difficulty:** Medium

### #143 — $500 (OPEN)
**Field:** Primitive sets
**Statement:** Primitive set question. Related to #220 (proved) and Lichtman's 2022 work.
**Approach:** Recent progress on primitive sets. May be close to falling.
**Hardware:** Number theoretic computation
**Difficulty:** Medium — related problems recently solved

### #146 — $500 (OPEN)
**Field:** Graph theory, Turán number
**Statement:** Extremal graph theory.
**Approach:** Graph construction + counting
**Hardware:** GPU graph enumeration
**Difficulty:** Medium

### #161 — $500 (OPEN)
**Field:** Combinatorics, Ramsey theory, discrepancy
**Statement:** Combines Ramsey theory and discrepancy.
**Approach:** Computational search for colorings. Related to Tao's discrepancy work.
**Hardware:** GPU combinatorial search
**Difficulty:** Medium-hard

---

## TIER 3 — $100-$250 PRIZE, OPEN

### #43 — $100 (OPEN) — Sidon sets
### #50 — $250 (OPEN) — Number theory
### #52 — $250 (OPEN) — Additive combinatorics
### #77 — $250 (OPEN) — Ramsey theory
### #78 — $100 (OPEN) — Ramsey theory
### #86 — $100 (OPEN) — Graph theory
### #99 — $100 (OPEN) — Geometry, distances
### #101 — $100 (OPEN) — Geometry
### #104 — $100 (OPEN) — Geometry
### #119 — $100 (OPEN) — Analysis, polynomials
### #120 — $100 (OPEN) — Combinatorics
### #123 — $250 (OPEN) — Number theory
### #126 — $250 (OPEN) — Number theory
### #132 — $100 (OPEN) — Distances
### #165 — $250 (OPEN) — Ramsey theory
### #183 — $250 (OPEN) — Ramsey theory
### #241 — $100 (OPEN) — Sidon sets
### #470 — $10 (OPEN) — Number theory, divisors

---

## PRIORITY TARGETS (sorted by reward/difficulty ratio)

1. **#19 ($500, DECIDABLE)** — Best odds. Finite computation. GPU graph coloring.
2. **#107 ($500, FALSIFIABLE)** — Counterexample search in convex geometry. GPU.
3. **#64 ($1000, FALSIFIABLE)** — Counterexample search in graph cycles. GPU.
4. **#30 ($1000, OPEN)** — Sidon sets. Active area, GPU-perfect workload.
5. **#143 ($500, OPEN)** — Primitive sets. Related problems recently solved.
6. **#20 ($1000, OPEN)** — Sunflowers. Recent breakthrough, may have low-hanging fruit.
7. **#89/90/92 ($500 each, OPEN)** — Distance problems. Same GPU toolkit, triple payout.

## RECENTLY SOLVED (for TSPB textbook)

| # | Prize | Year | Solver | Method |
|---|-------|------|--------|--------|
| #4 | $10,000 | 2014 | Ford, Green, Konyagin, Tao + Maynard | Prime gaps |
| #139 | $1,000 | — | — | Arithmetic progressions |
| #21 | $500 | — | — | Intersecting families |
| #67 | $500 | 2015 | Terence Tao | Discrepancy |
| #83 | $500 | — | — | Combinatorics |
| #95 | $500 | — | — | Convex distances |
| #140 | $500 | — | — | Arithmetic progressions |
| #220 | $500 | — | — | Number theory |
| #728 | — | 2026 | GPT-5.2 (AI) | AI-assisted |
| #729 | — | 2026 | GPT-5.2 (AI) | AI-assisted |
| #397 | — | 2026 | GPT-5.2 (AI) | AI-assisted, verified by Tao |
| #347 | — | 2026 | Barschkis | Number theory |
| #1026 | — | 2025 | Alexeev via Aristotle AI | Lean formalization |

## ALSO TRACKING: RIEMANN HYPOTHESIS ($1M Clay Prize)

Not an Erdős problem but connected via:
- Arbitrary precision arithmetic (GPU mpmath) — same tooling as Sidon/AP problems
- Fractal geometry connection through spectral zeta functions
- Zero verification extends known results (currently verified to ~10^13)
- GPU-accelerated zeta function evaluation is a published technique
- Even partial results (new zero-free regions) are publishable

**Our angle:** Build GPU arbitrary precision library. Use it for both Erdős problems AND Riemann zero verification. The tooling pays for itself across multiple problems.

---

## COMPUTATIONAL TOOLKIT (to build)

1. **GPU Sidon Set Searcher** — attacks #30, #39, #41, #241 simultaneously
2. **GPU Graph Coloring Engine** — attacks #19, #74, #64
3. **GPU Distance Geometry** — attacks #89, #90, #92, #99, #132
4. **GPU Additive Basis Enumerator** — attacks #28, #40, #66, #138, #142
5. **GPU Arbitrary Precision** — attacks Riemann + supports all of the above
6. **Convex Hull / Point Config Generator** — attacks #107, #101, #104

---

*Last updated: 2026-04-01 05:00 PDT — Artemis II launch day*
*Source: erdosproblems.com, GitHub teorth/erdosproblems, OEIS A051635*

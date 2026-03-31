# Chromatic Number of the Plane

> **Problem ID:** OPEN-P8
> **Domain:** Combinatorial Geometry
> **Status:** Open since 1950
> **Through-line:** *How many colors do you need to paint the infinite plane so that no two points exactly one unit apart share a color? The answer is 5, 6, or 7. That we cannot narrow it further after 75 years reveals something deep about the limits of combinatorial argument. The graph coloring structure maps directly to resource allocation in distributed systems: agents that conflict cannot share a resource, and the minimum number of resource classes is the chromatic number of the conflict graph.*

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

Define the **unit distance graph** `G = (V, E)` where:
- `V = R^2` (all points of the Euclidean plane)
- `E = { {p, q} : |p - q| = 1 }` (edges connect points at Euclidean distance exactly 1)

The **chromatic number of the plane**, denoted `chi(R^2)`, is the chromatic number of `G`:

```
chi(R^2) = min { k : there exists a coloring c: R^2 -> {1,...,k}
                  such that |p - q| = 1 implies c(p) != c(q) }
```

This is the **Hadwiger-Nelson problem**: what is `chi(R^2)`?

Known bounds:

```
5 <= chi(R^2) <= 7
```

The lower bound 5 was established by de Grey (2018). The upper bound 7 comes from a hexagonal tiling coloring due to Isbell (1950).

The problem generalizes to higher dimensions. In `R^d`, let `chi(R^d)` be the chromatic number of the unit distance graph on `R^d`. Known: `chi(R^1) = 2` (trivially color alternating intervals of length < 1). For `d >= 2`, the problem is open.

## 2. History

**1950:** Edward Nelson poses the problem (first documented by Martin Gardner, 1960). The lower bound `chi(R^2) >= 4` is established by the Moser spindle -- a graph of 7 vertices and 11 edges, all unit distances, requiring 4 colors. The upper bound `chi(R^2) <= 7` is established by John Isbell using a hexagonal tiling with hexagon diameter slightly less than 1, colored with 7 colors such that no two same-colored hexagons contain points at distance 1.

**1961:** The Moser brothers (Leo and William) independently discover the Moser spindle and publish in the *Canadian Mathematical Bulletin*.

**1970s-2000s:** Extensive work on the fractional chromatic number (Scheinerman & Ullman, 1997) establishes `chi_f(R^2) >= 3.5` using Fourier-analytic methods. Work on the measurable chromatic number (Falconer, 1981) shows that if the coloring must be Lebesgue-measurable, then at least 5 colors are needed.

**2018:** Aubrey de Grey publishes "The Chromatic Number of the Plane Is at Least 5," constructing a unit-distance graph on 1,581 vertices (later reduced to 509 by Heule, 2018) that requires 5 colors. This is the first improvement to the lower bound in 68 years. The construction uses a computer-assisted search based on Minkowski sums of smaller unit-distance graphs.

**2018-present:** The Polymath16 project (a massively collaborative mathematics effort) works to reduce the size of the 5-chromatic unit-distance graph and explore approaches to proving `chi(R^2) >= 6`. The smallest known 5-chromatic unit-distance graph has 509 vertices (Heule, 2018).

## 3. Current State of the Art

**Lower bound: 5.** de Grey's construction and its optimizations by Heule (SAT solver-based minimization) establish the lower bound. The approach: construct finite unit-distance graphs that require 5 colors, which immediately implies the infinite graph requires at least 5. No finite graph requiring 6 colors is known.

**Upper bound: 7.** Isbell's hexagonal tiling remains the best known. No coloring of the plane with 6 colors (meeting the unit-distance constraint) has been found, but no proof that 6 colors are insufficient either.

**Computational approaches.** SAT solvers (Heule, 2018) have been applied to find small 5-chromatic unit-distance graphs and to search for 6-chromatic examples. The search space grows combinatorially, and current hardware has explored only a fraction of possible constructions. GPU-accelerated SAT solving (using architectures like the RTX 4060 Ti) could extend the search.

**Analytic approaches.** Fourier analysis on `R^2` (Bachoc et al., 2014) provides bounds on the independence number of the unit distance graph, which constrains the chromatic number from below. These methods give `chi(R^2) >= 4 + epsilon` for a small `epsilon`, but do not reach 5 without the combinatorial construction.

**Connections to Ramsey theory.** The chromatic number problem is related to the density Hales-Jewett theorem and to Euclidean Ramsey theory. A coloring avoiding monochromatic unit distances is equivalent to partitioning the plane into sets, each avoiding distance 1 -- a Ramsey-type condition.

## 4. Connection to Our Work

**Graph coloring as resource allocation.** In the convoy model, agents that modify the same files cannot execute simultaneously (they conflict). The conflict graph -- agents as vertices, edges between conflicting pairs -- must be colored to find the minimum number of execution waves. This is exactly the graph coloring problem. The wave structure of GSD plans is an approximate coloring of the task conflict graph.

**The gap between 5 and 7 as a complexity measure.** The fact that we cannot narrow the bounds after 75 years of effort suggests fundamental limitations in combinatorial reasoning. Similarly, the gap between "the convoy works well in practice" and "the convoy is provably correct" may be a fundamental gap that no amount of testing will close (see P5).

**SAT solving infrastructure.** The Heule approach to chromatic number (encoding graph coloring as a SAT instance and using industrial-strength SAT solvers) is directly applicable to other combinatorial problems in the gsd-skill-creator: optimal task scheduling, minimum-wave decomposition of dependency graphs, and conflict resolution in multi-agent file access.

**Hexagonal tiling as spatial partitioning.** The hexagonal tiling that achieves the 7-color upper bound is a spatial partition with local constraints. The gsd-skill-creator's skill organization (34 skills in `.claude/skills/`) uses a partitioning scheme (each skill has a domain, skills with overlapping domains must be coordinated). The chromatic number of the skill overlap graph determines the minimum number of "independence groups" needed for conflict-free skill activation.

## 5. Open Questions

- **Can SAT solver techniques be applied to GSD task scheduling?** Encode the task dependency graph as a coloring problem, find the chromatic number, and use it to compute the minimum number of waves needed for a plan.
- **Does the de Grey construction technique (Minkowski sums of smaller graphs) generalize to constructing hard test cases for multi-agent systems?** Small conflict patterns, composed via Minkowski-like operations, might produce larger conflict structures that are hard for the convoy scheduler to handle efficiently.
- **Is there a measurable-coloring analogue for agent scheduling?** The measurable chromatic number (at least 5) is higher than the general chromatic number might be. In agent scheduling, "measurable" corresponds to "the scheduling algorithm must be computable" -- which is always the case. Does this constraint tighten the scheduling bounds?

## 6. References

- de Grey, A.D.N.J. (2018). "The Chromatic Number of the Plane Is at Least 5." *Geombinatorics*, 28, 18-31. [arXiv:1804.02385](https://arxiv.org/abs/1804.02385)
- Heule, M.J.H. (2018). "Computing Small Unit-Distance Graphs with Chromatic Number 5." *Geombinatorics*, 28, 32-50.
- Soifer, A. (2009). *The Mathematical Coloring Book: Mathematics of Coloring and the Colorful Life of Its Creators*. Springer.
- Bachoc, C., et al. (2014). "New Upper Bounds for the Chromatic Number of the Euclidean Space." *Discrete & Computational Geometry*, 51(2), 258-284.
- Scheinerman, E. & Ullman, D. (1997). *Fractional Graph Theory*. Wiley.
- Falconer, K.J. (1981). "The Realization of Distances in Measurable Subsets Covering R^n." *Journal of Combinatorial Theory, Series A*, 31(2), 184-189.
- Polymath16 (2018-present). "The Chromatic Number of the Plane." [polymathprojects.org](https://polymathprojects.org/)
- Gardner, M. (1960). "Mathematical Games." *Scientific American*, October 1960.

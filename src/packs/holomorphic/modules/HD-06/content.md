---
module: HD-06
title: "Topology of the Complex Plane"
textbook_chapters: []
textbook_chapters_note: "No confirmed chapter-level identity connection. HD-06 educates on topological properties (connectedness, Riemann sphere, conformal maps) but src/holomorphic/ does not export topological predicates as functions. Closest textbook territory is Part VI: Foundations (Ch 18–21), but the relationship is educational dependency, not identity. See Gaps Found in docs/foundations/curriculum-alignment.md."
---

# HD-06: Topology of the Complex Plane

## Overview

Topology provides the language for describing what dynamical systems can and
cannot do. Before we can rigorously discuss Julia sets, the Mandelbrot set,
or convergence of orbits, we need the foundational concepts of point-set
topology — the mathematical framework developed at the University of Toronto's
MAT327 and courses worldwide.

## Topological Spaces and Continuity

A **topological space** is a set X equipped with a collection of **open sets**
satisfying three axioms: the empty set and X are open, arbitrary unions of open
sets are open, and finite intersections of open sets are open. A function
f: X -> Y is **continuous** if the preimage of every open set is open.

The complex plane C with its standard metric is a topological space. Every
holomorphic function is continuous, but continuity is a weaker condition that
lets us study dynamics in greater generality.

## The Hausdorff Property

A topological space is **Hausdorff** if any two distinct points have disjoint
open neighborhoods. The complex plane is Hausdorff, and so is the Riemann
sphere (the one-point compactification of C). This property guarantees that
limits, when they exist, are unique — essential for defining convergence of
orbits.

## Compactness

A space is **compact** if every open cover has a finite subcover. Compactness
is the topological generalization of "closed and bounded" in R^n (the
Heine-Borel theorem). Key facts for holomorphic dynamics:

- **Julia sets are compact** subsets of the Riemann sphere. Since the Riemann
  sphere is compact and Julia sets are closed subsets, they inherit compactness.
- Compact sets have extrema: continuous functions on compact sets attain their
  maximum and minimum (the extreme value theorem).

## Connectedness and the Mandelbrot Set

A space is **connected** if it cannot be written as the union of two disjoint
non-empty open sets. The **Mandelbrot set is connected** — this is the
celebrated Douady-Hubbard theorem (1982). They proved it by constructing a
conformal isomorphism from the complement of M to the complement of the
closed unit disk, showing M has no "holes" or separate pieces.

Connectedness of the Mandelbrot set has a profound dynamical consequence:
c is in M if and only if the Julia set J_c is connected. When c is outside M,
J_c is a Cantor set (totally disconnected).

## The Inscribed Rectangle Problem and Jordan Curves

A **Jordan curve** is a non-self-intersecting continuous closed curve in R^2.
Two remarkable recent results connect topology to geometry:

### Meyerson Table Theorem

The **Meyerson conjecture** (1981) asks: does every Jordan curve in R^2
inscribe a rectangle? In 2020, Greene and Lobb resolved this affirmatively.
Every continuous Jordan curve contains four points forming the vertices of
an inscribed rectangle. The proof uses Mobius strips and intersection theory
in a beautiful application of algebraic topology.

### Greene-Lobb Rectangular Peg Theorem

Going further, Greene and Lobb proved that every **smooth** Jordan curve
inscribes rectangles of **every aspect ratio**. This is a strictly stronger
result: not just one rectangle, but a continuous family parametrized by
aspect ratio. The proof uses **symplectic geometry** and **Lagrangian Floer
homology**, published in the Annals of Mathematics 194(2), 2021.

## Connection to Dynamics

Topology constrains what dynamical systems can do:

- **Brouwer's fixed point theorem**: every continuous map from a disk to itself
  has a fixed point — guaranteeing fixed points for polynomial maps on bounded regions.
- **Compactness of Julia sets** ensures that the dynamics on J_c is well-behaved
  enough to study with measure theory and ergodic theory.
- **Connectedness** determines the global structure of parameter space (the Mandelbrot set)
  and phase space (Julia sets).

Understanding these topological foundations transforms holomorphic dynamics from
a collection of pretty pictures into a rigorous mathematical discipline.

## Prerequisites

- Basic set theory (unions, intersections, complements)
- Familiarity with open and closed intervals in R
- MAT327 or equivalent introduction to point-set topology recommended

## Further Reading

- Munkres, *Topology* (2nd ed.) — standard reference for point-set topology
- Douady & Hubbard, "Itération des polynômes quadratiques complexes" (1982)
- Greene & Lobb, "The rectangular peg problem," Annals of Mathematics 194(2), 2021

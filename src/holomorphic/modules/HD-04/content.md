---
module: HD-04
title: "Julia Sets and Fatou Sets"
textbook_chapters: [29]
textbook_chapters_confidence: medium
textbook_chapters_note: "Julia Sets and Fatou Sets IS the emergent dynamical-plane partition (Ch 29, Part IX: Emergence). renderJulia() IS the Julia set — the emergent partition of the complex plane into chaotic and stable regions for a fixed parameter."
---

# HD-04: Julia Sets and Fatou Sets

## Overview

Every polynomial (or rational map) f: C -> C partitions the complex plane into
two complementary sets: the **Julia set** J(f) where dynamics are chaotic, and
the **Fatou set** F(f) where dynamics are tame. Understanding this dichotomy is
the central organizing principle of holomorphic dynamics.

## The Julia Set

The **Julia set** J(f) is the boundary of the set of points whose orbits remain
bounded under iteration of f. Equivalently, J(f) is the set of points where
arbitrarily small perturbations can lead to dramatically different long-term
behavior. For the quadratic family f_c(z) = z^2 + c, the Julia set J_c
separates points that escape to infinity from those that do not.

Key properties of the Julia set:

- **Closed**: J(f) is always a closed subset of the Riemann sphere
- **Completely invariant**: f(J) = J and f^{-1}(J) = J
- **Perfect set**: every point of J is an accumulation point (no isolated points)
- **Sensitive dependence**: nearby points on J diverge under iteration

## The Fatou Set and Normal Families

The **Fatou set** F(f) is the complement of J(f) in the Riemann sphere. It is
the largest open set on which the iterates {f^n} form a **normal family** in
the sense of Montel. A family of functions is normal (equicontinuous) if every
sequence has a locally uniformly convergent subsequence.

In plain language: on the Fatou set, nearby points have similar long-term
behavior. The Fatou set decomposes into connected components called **Fatou
components**, each of which is mapped to another Fatou component by f.

## Connected vs Disconnected Julia Sets

For f_c(z) = z^2 + c, the topology of the Julia set depends entirely on
the orbit of the **critical point** z = 0:

- **Connected**: If the critical orbit remains bounded (i.e. c is in the
  Mandelbrot set M), then J_c is a connected set.
- **Disconnected (Cantor dust)**: If the critical orbit escapes to infinity
  (i.e. c is not in M), then J_c is totally disconnected — a Cantor set,
  sometimes called **Cantor dust**.

This is the **fundamental dichotomy** for quadratic polynomials, proved by
Douady and Hubbard: c in M if and only if J_c is connected.

## Famous Julia Sets

Several parameter values produce Julia sets with distinctive shapes:

| Parameter c          | Name           | Shape                              |
|----------------------|----------------|------------------------------------|
| c = -1               | Basilica       | Two large lobes joined at a point  |
| c = -0.123 + 0.745i | Douady rabbit  | Three-lobed "rabbit" with ears     |
| c = i                | Dendrite       | Tree-like branching structure      |
| c = -2               | Segment        | The interval [-2, 2] on real axis  |
| c = 0.25             | Cauliflower    | Parabolic point with fractal cusps |

## The Mandelbrot-Julia Connection

The Mandelbrot set M is the "parameter space atlas" of all Julia sets:

- Each point c in M corresponds to a connected Julia set J_c
- Points outside M correspond to Cantor-dust Julia sets
- The boundary of M has the same Hausdorff dimension (2) as the most
  complicated Julia sets
- Zooming into M near a point c reveals structure that mirrors J_c

## Try It

Use the interactive session to render the Douady rabbit Julia set and
experiment with different values of c to see the transition from connected
to disconnected Julia sets.

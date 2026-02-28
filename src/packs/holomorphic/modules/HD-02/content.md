# HD-02: Fixed Points and Stability

## What Is a Fixed Point?

A **fixed point** of a function f is a value z* such that:

    f(z*) = z*

Under iteration, the orbit of z* is simply {z*, z*, z*, ...} — it
never moves. Fixed points are the simplest possible dynamical behavior
and the key to understanding all other behaviors.

For the quadratic map f(z) = z^2 + c, fixed points satisfy z = z^2 + c,
which gives us z^2 - z + c = 0. By the quadratic formula:

    z* = (1 +/- sqrt(1 - 4c)) / 2

So every quadratic map has exactly two fixed points (counted with
multiplicity) in the complex plane.

## The Multiplier

The **multiplier** of a fixed point z* is the derivative of f evaluated
at z*:

    lambda = f'(z*)

For f(z) = z^2 + c, f'(z) = 2z, so the multiplier at a fixed point z*
is lambda = 2z*.

The multiplier determines stability: it tells us whether nearby orbits
are pulled toward z* or pushed away.

## The Five Classifications

The magnitude |lambda| of the multiplier classifies the fixed point:

### Superattracting (|lambda| = 0)

The multiplier vanishes. Nearby orbits converge to z* extremely fast
(faster than exponential). Example: z = 0 is a superattracting fixed
point of f(z) = z^2 (here c = 0, and lambda = 2 * 0 = 0).

### Attracting (0 < |lambda| < 1)

Nearby orbits spiral or slide toward z* exponentially. The smaller
|lambda|, the faster the convergence. Example: f(z) = z^2 + 0.25
has an attracting fixed point at z = 0.5 with lambda = 1.0... wait,
that is the boundary case. For c = 0.2, the fixed point near 0.276
has |lambda| ~ 0.553 — attracting.

### Repelling (|lambda| > 1)

Nearby orbits are pushed away from z*. Though repelling fixed points
cannot be seen by forward iteration, they form the skeleton of the
Julia set. Most fixed points we encounter are repelling.

### Rationally Indifferent (|lambda| = 1, rational angle)

The multiplier lies on the unit circle at a rational angle: lambda =
e^(2*pi*i*p/q) for integers p, q. These create **parabolic** fixed
points with delicate petal-like basins of attraction. The classic
example is c = 1/4, where the two fixed points merge with lambda = 1.

### Irrationally Indifferent (|lambda| = 1, irrational angle)

The multiplier lies on the unit circle at an irrational angle. These
are the most mysterious fixed points. Depending on number-theoretic
properties of the angle, the fixed point may have a Siegel disk
(a region of quasi-periodic orbits) or be a Cremer point (with no
neighborhood of stable behavior).

## Classification Summary

| Classification          | |lambda|  | Behavior              |
|-------------------------|----------|-----------------------|
| Superattracting         | = 0      | Ultra-fast convergence|
| Attracting              | < 1      | Exponential convergence|
| Repelling               | > 1      | Orbits diverge        |
| Rationally indifferent  | = 1, rational | Parabolic petals |
| Irrationally indifferent| = 1, irrational | Siegel/Cremer   |

## Connection to Julia Sets

The classification of fixed points directly determines Julia set
structure. When a quadratic map has an attracting fixed point, the
Julia set is a simple closed curve. When both fixed points are
repelling, the Julia set can be a fractal dust or a dendrite.

The transition between these regimes — as c moves through parameter
space — is the deep story of the Mandelbrot set (HD-03).

## Try It

See `try-session.ts` in this module to compute multipliers and
classify fixed points for several quadratic maps.

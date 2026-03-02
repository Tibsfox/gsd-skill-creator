---
module: HD-03
title: "The Mandelbrot Set"
textbook_chapters: [28]
textbook_chapters_confidence: medium
textbook_chapters_note: "The Mandelbrot Set IS emergent structure from iteration (Ch 28, Part IX: Emergence). renderMandelbrot() IS the parameter-space visualization of emergent classification: which c-values produce bounded vs escaping orbits."
---

# HD-03: The Mandelbrot Set

## Parameter Space

In HD-01 we fixed a parameter c and asked: "what happens when we
iterate f(z) = z^2 + c starting from z_0 = 0?" Now we flip the
question: "for which values of c does the orbit of 0 stay bounded?"

The set of all such c values is the **Mandelbrot set**:

    M = { c in C : the orbit of 0 under z^2 + c does not escape }

This is a map of **parameter space** — each point c represents an
entire dynamical system z^2 + c, and its color tells us whether that
system has a bounded critical orbit.

## Why the Orbit of Zero?

Zero is the **critical point** of f(z) = z^2 + c (where f'(z) = 2z = 0).
A deep theorem in holomorphic dynamics says: the critical orbit determines
the global dynamics. If the critical orbit escapes, the Julia set is a
Cantor set (disconnected dust). If the critical orbit stays bounded, the
Julia set is connected.

## The Main Cardioid

The largest region of the Mandelbrot set is the **main cardioid**,
parametrized by:

    c = (1/2)e^(i*theta) - (1/4)e^(2i*theta)

for theta in [0, 2*pi). Every c in the main cardioid has an attracting
fixed point. As you move along the cardioid boundary, the multiplier
lambda traces the unit circle — and at rational angles p/q, a period-q
bulb buds off.

## The Period-2 Bulb

The prominent circle tangent to the main cardioid at c = -3/4 is the
**period-2 bulb**. For c values in this disk, the orbit of 0 settles
into an attracting 2-cycle instead of a fixed point. Its center is
c = -1, where the 2-cycle {0, -1} is superattracting.

## Connectedness and Julia Sets

The Mandelbrot set encodes the topology of every Julia set in the family:

- **c inside M** => the Julia set J_c is connected (a single piece)
- **c outside M** => the Julia set J_c is totally disconnected (Cantor dust)

This is the **Mandelbrot-Julia correspondence**: M is the map that tells
you where connected Julia sets live. The boundary of M is where the
transition from connected to disconnected happens — and this boundary is
where the most intricate fractal structure appears.

## Boundary and Self-Similarity

The boundary of the Mandelbrot set has Hausdorff dimension 2 (the same
as the plane itself!) — it is extraordinarily intricate. Zooming into
the boundary reveals:

- **Mini-Mandelbrot copies**: exact (conformally distorted) copies of M
  appear at every scale, connected to the main body by thin filaments
- **Misiurewicz points**: pre-periodic parameters where the boundary is
  locally similar to a Julia set
- **Antenna and dendrites**: the real axis segment [-2, 1/4] and the
  branching filaments that extend into the plane

## Escape-Time Coloring

The images we see of the Mandelbrot set use **escape-time coloring**:

1. For each pixel c, iterate z_{n+1} = z_n^2 + c starting from z_0 = 0
2. Count how many iterations n before |z_n| > 2 (the escape radius)
3. Map n to a color (e.g., via a smooth gradient)
4. Points that never escape (within the iteration budget) are colored black

The color bands outside M represent level sets of the escape-time
function — they are smooth curves that approach the M-set boundary with
increasing iteration count.

## What Comes Next

In HD-04 we will explore the other side of the coin: Julia sets. While
M lives in parameter space, Julia sets live in dynamical space — and
together they form the complete picture of the quadratic family.

## Try It

See `try-session.ts` in this module to render a small Mandelbrot grid
and test whether specific parameter values lie inside M.

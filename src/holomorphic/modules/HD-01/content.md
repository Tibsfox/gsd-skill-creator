# HD-01: Iteration on the Complex Plane

## What Is Iteration?

Iteration means applying the same function over and over. Given a function
f and a starting point z_0, we compute:

    z_1 = f(z_0)
    z_2 = f(z_1)
    z_3 = f(z_2)
    ...

Each z_{n+1} = f(z_n). The sequence {z_0, z_1, z_2, ...} is the **orbit**
of z_0 under f.

## The Quadratic Family

The most important family of iterated maps in holomorphic dynamics is the
quadratic map:

    f(z) = z^2 + c

where c is a complex parameter. Despite its simplicity, this single formula
generates the Mandelbrot set, Julia sets, and an extraordinary zoo of
dynamical behaviors.

## Orbits in the Complex Plane

Starting from z_0 = 0 and iterating f(z) = z² + c:

- **c = 0**: The orbit is 0 -> 0 -> 0 -> ... (fixed point)
- **c = -1**: The orbit is 0 -> -1 -> 0 -> -1 -> ... (period 2)
- **c = i**: The orbit is 0 -> i -> -1+i -> -i -> -1+i -> ... (period 2)
- **c = 1**: The orbit is 0 -> 1 -> 2 -> 5 -> 26 -> ... (escapes to infinity)

These four examples illustrate the fundamental orbit behaviors:
**converging**, **periodic**, **chaotic**, and **escaping**.

## The Escape Radius

A key theorem tells us: if |z_n| > 2 for the quadratic map z^2 + c
(assuming |c| <= 2), then the orbit escapes to infinity. We call
R = 2 the **escape radius**.

More precisely, once |z_n| > max(|c|, 2), the magnitudes |z_{n+k}|
grow without bound. This gives us a practical stopping criterion:
rather than iterating forever, we stop when |z_n| > R and declare
the orbit "escaped."

## Escape Time

The **escape time** of a starting point z_0 is the number of iterations
needed before |z_n| exceeds the escape radius. Points that never escape
(within our iteration budget) are candidates for membership in the
Mandelbrot or Julia set.

Escape time is the foundation of fractal rendering. By mapping escape
time to colors, we create the familiar psychedelic images of
the Mandelbrot set.

## Different Orbit Behaviors

| Behavior    | Description                                  | Example (z^2 + c) |
|-------------|----------------------------------------------|--------------------|
| Escaping    | |z_n| grows beyond the escape radius         | c = 1              |
| Converging  | z_n approaches a single fixed point          | c = 0              |
| Periodic    | z_n eventually repeats with some period p    | c = -1 (period 2)  |
| Chaotic     | z_n wanders without repeating or escaping    | c at M-set boundary |

## Why This Matters

Iteration is the computational engine behind everything in holomorphic
dynamics. The Mandelbrot set is defined by which values of c produce
bounded orbits. Julia sets are defined by which starting points z_0
produce bounded orbits for a fixed c. Escape time gives us a way to
visualize both.

In the next module (HD-02), we will zoom in on what happens when an
orbit converges: the theory of fixed points and their stability.

## Try It

See `try-session.ts` in this module to compute an orbit and observe
escape behavior interactively.

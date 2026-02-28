# HD-05: Cycles and Period Doubling

## Overview

In holomorphic dynamics, the simplest long-term behavior is convergence to a
fixed point. The next simplest is a **periodic orbit** (cycle) where points
visit a finite sequence of values and then repeat. As parameters change,
stable behavior can undergo **bifurcation** — a qualitative change in
dynamics — most famously through the period-doubling cascade that leads to
chaos.

## Periodic Orbits

A **periodic orbit** of period n for f is a set of distinct points
{z_0, z_1, ..., z_{n-1}} such that:

    z_1 = f(z_0),  z_2 = f(z_1),  ...,  z_0 = f(z_{n-1})

Equivalently, z_0 is a fixed point of the n-th iterate f^n(z) = f(f(...f(z)...)).
A **cycle** of period n visits exactly n distinct points before returning to
the start.

## The Multiplier of a Cycle

The stability of a period-n cycle is determined by its **multiplier**:

    lambda = f'(z_0) * f'(z_1) * ... * f'(z_{n-1})

This is the derivative of f^n evaluated at any point of the cycle (the chain
rule guarantees the same value at each cycle point). The classification mirrors
that of fixed points:

| |lambda|     | Classification          | Behavior                    |
|--------------|-------------------------|-----------------------------|
| = 0          | Superattracting         | Converges very rapidly       |
| < 1          | Attracting              | Nearby orbits spiral in      |
| > 1          | Repelling               | Nearby orbits diverge        |
| = 1          | Indifferent (parabolic) | Borderline stability         |

## Bifurcation

A **bifurcation** occurs when a small change in parameter causes a qualitative
change in the dynamics. The most important type for quadratic maps is the
**period-doubling bifurcation**:

1. A stable fixed point loses stability as |lambda| crosses 1
2. Simultaneously, a new stable period-2 cycle is born
3. As the parameter continues to change, the period-2 cycle doubles to period-4
4. Then period-4 to period-8, period-8 to period-16, ...
5. The cascade accumulates at a finite parameter value, beyond which the
   dynamics become **chaotic**

For the logistic map x_{n+1} = r * x * (1 - x), the period-doubling cascade
begins at r = 3 (loss of the fixed-point attractor) and accumulates at
r ~ 3.5699... (the onset of chaos).

## The Feigenbaum Constant

Mitchell Feigenbaum discovered a remarkable universality in the period-doubling
cascade. Let r_n be the parameter value where period 2^n first appears. The
ratios of successive bifurcation intervals converge:

    delta = lim (r_n - r_{n-1}) / (r_{n+1} - r_n) = 4.669201609...

This **Feigenbaum constant** delta ~ 4.669 is universal: it appears in every
one-dimensional map undergoing period-doubling, regardless of the specific
formula. It also governs the self-similar scaling of the Mandelbrot set along
the real axis.

## Connection to the Mandelbrot Set

The bulbs attached to the main cardioid of the Mandelbrot set correspond to
periodic windows:

- The **main cardioid** contains parameters with an attracting fixed point
- The **period-2 bulb** (the large disk to the left) contains parameters with
  an attracting period-2 cycle
- Smaller bulbs correspond to higher periods
- The "antenna" along the negative real axis traces the period-doubling cascade
- At the tip of the antenna (c ~ -1.401...), infinite period-doubling leads to
  the onset of chaos

## Try It

Use the interactive session to render a bifurcation diagram for the logistic
map and detect the period of orbits at specific parameter values. Watch how
period doubles as you move along the cascade.

# HD-08: Skill-Creator as a Dynamical System

## Overview

The skill-creator system — observation, classification, scoring, positioning —
is itself a dynamical system on the complex plane. This module makes the
mapping precise: every concept from holomorphic dynamics has an operational
counterpart in skill lifecycle management.

## The Observation Pipeline as Iteration

Each observation cycle is one iteration of a discrete dynamical system:

```
z_{n+1} = f(z_n) = observe -> classify -> score -> position
```

A skill lives at position z = r * exp(i*theta) on the complex plane, where:
- **theta** (angle) encodes the skill's domain — its type and category
- **r** (radius) encodes the skill's maturity — distance from the origin

Each observation updates the position: the pipeline function f maps the
current position to a new one based on what was observed.

## Bounded Learning as Angular Velocity Clamping

The skill-creator enforces a hard constraint: no more than 20% content change
per refinement cycle. In dynamical terms, this is **angular velocity clamping**:

```
|delta_theta| <= 0.2 * 2*pi  (bounded derivative)
```

This prevents a single noisy observation from catastrophically repositioning
a skill. It is the dynamical equivalent of a Lipschitz condition on f — the
iteration cannot move too far in one step.

## Skills as Fixed Points

A mature skill converges to a **fixed point** z* where f(z*) = z*. The
multiplier lambda = f'(z*) determines the skill's stability:

- **|lambda| < 1 (attracting)**: The skill absorbs nearby observations and
  returns to its stable position. Most production skills are attracting.
- **|lambda| = 0 (superattracting)**: A compiled skill — it activates
  instantly with zero overhead. The derivative vanishes because the skill
  is perfectly calibrated.
- **|lambda| > 1 (repelling)**: An unstable skill — small perturbations
  drive it away from its current position. These are skills in early
  development or undergoing major revision.

## Fatou and Julia: Stable vs Boundary Skills

The **Fatou set** consists of positions where the dynamics are stable and
predictable. Skills in the Fatou domain have consistent activation patterns.
Nearby initial conditions produce similar long-term behavior.

The **Julia set** consists of positions at phase boundaries where the dynamics
are sensitive to observation noise. A skill on the Julia boundary might
activate or not depending on tiny variations in input — it is at the edge
between two activation domains.

**Mapping:**
- Fatou domain = stable, reliable skills (predictable activation)
- Julia boundary = skills in transition between categories (sensitive behavior)
- Basin of attraction = the set of initial observations that converge to a given skill

## Promotion as Convergence to the Real Axis

When a skill is **promoted** — elevated from candidate to production status —
its position converges toward the real axis (theta -> 0 or theta -> pi). On
the real axis, the imaginary component vanishes: the skill has maximum real
activation weight and zero uncertainty.

Convergence to the real axis is the dynamical signature of a successful
learning trajectory: the skill has been refined by enough observations that
its angular uncertainty has collapsed.

## Operational Example

```typescript
import { computeOrbit, classifyFixedPoint, computeMultiplier } from '../../index';
import type { ComplexNumber } from '../../types';

// Skill evolution: z_{n+1} = 0.8z + 0.1 (contractive map = learning)
const learnStep = (z: ComplexNumber): ComplexNumber => ({
  re: 0.8 * z.re + 0.1,
  im: 0.8 * z.im,
});

// Start from initial observation at (0, 1)
const orbit = computeOrbit({ re: 0, im: 1 }, learnStep, 50, 100);
// orbit converges to z* = 0.5 + 0i (the real axis!)

// Compute the multiplier at the fixed point
const mult = computeMultiplier(learnStep, { re: 0.5, im: 0 });
// |mult| = 0.8 < 1, so the fixed point is attracting
const cls = classifyFixedPoint(mult);
// cls = 'attracting' — the skill converges reliably
```

## Summary of the Mapping

| Dynamics Concept       | Skill-Creator Concept                    |
|------------------------|------------------------------------------|
| Iteration f(z)         | Observation pipeline cycle               |
| Fixed point z*         | Mature, stable skill                     |
| Attracting (|f'|<1)    | Reliable skill (absorbs noise)           |
| Superattracting (f'=0) | Compiled skill (instant activation)      |
| Repelling (|f'|>1)     | Unstable/developing skill                |
| Fatou set              | Stable skill domain                      |
| Julia set              | Phase boundary (sensitive to noise)      |
| Angular velocity       | Rate of skill repositioning per cycle    |
| Convergence to R       | Promotion to production status           |
| Basin of attraction    | Set of observations that train one skill |

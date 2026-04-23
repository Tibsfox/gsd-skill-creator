/**
 * Blow-Up Dynamics try-session -- first hands-on contact with finite-time singularities.
 *
 * Walk a learner from the ODE prototype y' = y^2 (blows up at t = 1/y_0) to the
 * quantized L^2-critical NLS blow-up of Merle-Raphaël.
 *
 * @module departments/mathematics/try-sessions/blow-up-dynamics
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const blowUpDynamicsSession: TrySessionDefinition = {
  id: 'math-blow-up-dynamics-first-steps',
  title: 'Blow-Up Dynamics: When Solutions Break',
  description:
    'A guided first pass through blow-up: start from an ODE whose solution blows up, climb to ' +
    'PDE blow-up with quantized mass, and read the type-I / type-II classification.',
  estimatedMinutes: 20,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Solve the ODE y\'(t) = y(t)^2 with y(0) = 1 analytically. Write down the solution y(t) = 1 / (1 - t). At what time does this solution cease to exist? Plot y(t) for t in [0, 0.99].',
      expectedOutcome:
        'You derive the closed form 1 / (1 - t), identify T* = 1 as the blow-up time, and see the vertical asymptote on the plot.',
      hint: 'Separation of variables: dy / y^2 = dt. Integrate both sides.',
      conceptsExplored: ['math-blow-up-dynamics', 'math-exponential-decay'],
    },
    {
      instruction:
        'Now ask a harder question: for the L^2-critical focusing NLS in 2D, why can "critical mass" solutions blow up at all? Read the conservation of mass: the L^2 norm of psi(x, t) is conserved in time. Why does conservation not prevent blow-up?',
      expectedOutcome:
        'You understand that mass is conserved globally but concentration is not -- a critical-mass solution can pile all its mass into a shrinking region, producing a pointwise singularity.',
      hint: 'Conservation is a single number. Blow-up is a local concentration. The two coexist.',
      conceptsExplored: ['math-blow-up-dynamics', 'math-scale-critical-equations'],
    },
    {
      instruction:
        'Read the Merle-Raphaël blow-up rate for L^2-critical NLS: lambda(t) ~ sqrt((T*-t) / |log(T*-t)|). What does this mean in words? How does the log-correction distinguish it from self-similar (algebraic) rates?',
      expectedOutcome:
        'You can state that the inverse length-scale lambda(t) tends to infinity as t -> T*, but slower than 1 / sqrt(T*-t) would be (log correction). This puts the L^2-critical rate at the boundary between algebraic and non-algebraic blow-up.',
      hint: 'The log correction is the signature of the critical regime -- it says blow-up is not quite self-similar.',
      conceptsExplored: ['math-blow-up-dynamics', 'math-scale-critical-equations'],
    },
    {
      instruction:
        'Read the mass-quantization theorem: for L^2-critical NLS blow-up, the blow-up part of the solution accumulates an exact multiple of the ground-state mass ||Q||_{L^2}. What does "quantization" mean here, and why is it surprising?',
      expectedOutcome:
        'You can explain quantization: the concentrated mass is an integer times a fixed unit, like charge in physics. It is surprising because PDE singularities generally allow continuous mass distributions.',
      hint: 'Quantization says the mass does not slide continuously; it lands on a discrete ladder.',
      conceptsExplored: ['math-blow-up-dynamics', 'math-scale-critical-equations'],
    },
    {
      instruction:
        'Distinguish type-I (self-similar, rate 1 / sqrt(T*-t)) from type-II (non-self-similar, rate slower than self-similar). Which type is 3D Euler / compressible Navier-Stokes implosion, per Merle-Raphaël-Rodnianski-Szeftel 2019?',
      expectedOutcome:
        'You recognize MRRS implosion as type-II: the blow-up is driven by compressible-fluid implosion from smooth finite-energy data, and the rate does not match the self-similar scaling.',
      hint: 'Type-II blow-up leaves a non-trivial profile behind in the rescaled frame.',
      conceptsExplored: ['math-blow-up-dynamics', 'math-solitons'],
    },
    {
      instruction:
        'Read the Martel-Merle-Raphaël near-soliton trichotomy for critical gKdV: three possible fates near the soliton manifold. Name them.',
      expectedOutcome:
        'You can list: (a) soliton survives (stability), (b) soliton blows up in finite time (type-II), (c) exit toward dispersive radiation. The trichotomy is exhaustive.',
      hint: 'The three fates correspond to three topologically distinct basins around the soliton manifold.',
      conceptsExplored: ['math-blow-up-dynamics', 'math-solitons'],
    },
    {
      instruction:
        'Close the session by writing one sentence explaining why the blow-up-dynamics concept sits high on the "abstract" radius of the complex plane (radius ~0.90) in our department mapping.',
      expectedOutcome:
        'You articulate that blow-up is an analytic singularity phenomenon requiring PDE technology and modulation analysis, placing it near the peak of the abstract ring.',
      hint: 'The complexPlanePosition of math-blow-up-dynamics: theta = 2pi/19, radius = 0.90 -- one step inward from the canonical soliton anchor.',
      conceptsExplored: ['math-blow-up-dynamics'],
    },
  ],
};

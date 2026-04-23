/**
 * Solitons try-session -- first hands-on contact with coherent nonlinear waves.
 *
 * Walk a learner from the visual intuition of a travelling pulse to the
 * algebraic decomposition implied by the soliton-resolution conjecture.
 *
 * @module departments/mathematics/try-sessions/solitons
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const solitonsSession: TrySessionDefinition = {
  id: 'math-solitons-first-steps',
  title: 'Solitons: Coherent Waves in a Nonlinear Medium',
  description:
    'A guided first pass through solitons as physical + mathematical objects: watch one travel, ' +
    'locate its analytic signature, and read the soliton-resolution conjecture as a decomposition rule.',
  estimatedMinutes: 22,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Open a video of a canal soliton (the 1834 Russell report or any modern shallow-water recreation). Watch a single pulse travel down a narrow channel without spreading for several lengths. What two properties set it apart from a dispersive wave packet?',
      expectedOutcome:
        'You can name coherence (shape is preserved) and propagation at constant speed as the two defining observable properties, and distinguish them from a linear wave packet that spreads.',
      hint: 'A Gaussian wave packet in a dispersive medium spreads by O(sqrt(t)). A soliton does not.',
      conceptsExplored: ['math-solitons', 'math-exponential-decay'],
    },
    {
      instruction:
        'Plot the single-soliton solution of the focusing NLS on paper or in a notebook: psi(x, t) = sech(x - c t) * exp(i (c/2) x - i (c^2/4 - 1) t). Sketch |psi(x, 0)| and |psi(x, 1)|. What happens to the amplitude? What happens to the phase?',
      expectedOutcome:
        'You see the amplitude envelope translate rigidly while the phase winds forward. The soliton is amplitude-coherent and phase-modulated.',
      hint: 'The sech profile is the amplitude. The complex exponential is the phase. The two move at different speeds.',
      conceptsExplored: ['math-solitons', 'math-complex-numbers'],
    },
    {
      instruction:
        'Compute the tail decay. For |x| large, sech(x) ~ 2 exp(-|x|). Fit an exponential to the numerical tails of your plot. What is the decay rate? How does this connect to the exponential-decay concept already in the mathematics department?',
      expectedOutcome:
        'You identify the tail decay rate as 1 (for unit-speed soliton) and recognize it as the canonical exponential-decay envelope shared with heat equations and radioactive decay.',
      hint: 'sech(x) = 2 / (e^x + e^-x). For large |x|, the larger exponential dominates.',
      conceptsExplored: ['math-solitons', 'math-exponential-decay'],
    },
    {
      instruction:
        'Now superpose two solitons with different speeds c1 != c2 and watch them collide. Numerically integrate NLS (split-step Fourier, or trust a published animation). What do you see after the collision?',
      expectedOutcome:
        'You see the two solitons emerge intact, each with its original shape and speed, only phase-shifted. This is the elastic-scattering signature.',
      hint: 'Elastic scattering means the shape survives. Only the phase records the encounter.',
      conceptsExplored: ['math-solitons', 'math-complex-numbers'],
    },
    {
      instruction:
        'Read the statement of the soliton-resolution conjecture (informal form): any bounded long-time solution of a nonlinear dispersive equation decomposes asymptotically into a finite sum of modulated solitons plus a dispersive remainder. What is the object playing the role of "finite sum"? What is the "remainder"?',
      expectedOutcome:
        'You can articulate the decomposition as psi(x, t) -> sum_{k=1..N} soliton_k(x - c_k t, ...) + eta(x, t), where eta is the dispersive part that radiates to infinity.',
      hint: 'The solitons are the particle-like pieces. The dispersive remainder is the wave-like residue.',
      conceptsExplored: ['math-solitons'],
    },
    {
      instruction:
        'Read the Merle-Duyckaerts-Kenig "channels of energy" theorem statement (energy-critical wave equation, radial data). What is the quantitative object the method tracks over time?',
      expectedOutcome:
        'You can state that channels of energy are lower bounds on the energy that flows out to infinity along specific light-cone channels, which force the dispersive remainder to decay.',
      hint: 'The channels are an energy-accounting device: you prove a minimum amount of energy must escape, so what remains must be a finite sum of solitons.',
      conceptsExplored: ['math-solitons'],
    },
    {
      instruction:
        'Close the session by writing one sentence in your own words that connects solitons to the complex-plane position the mathematics department assigns this concept (abstract, nonlinear-wave radius).',
      expectedOutcome:
        'You articulate why solitons live near the abstract edge of the complex plane (they are analytic objects, not everyday arithmetic) and near the nonlinear-wave region (their defining property is nonlinearity balancing dispersion).',
      hint: 'The complexPlanePosition of math-solitons: radius ~0.85, theta = 0 (the canonical abstract start of the 19-concept ring).',
      conceptsExplored: ['math-solitons', 'math-complex-numbers'],
    },
  ],
};

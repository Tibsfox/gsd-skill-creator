/**
 * Scale-Critical Equations try-session -- first hands-on contact with scale invariance.
 *
 * Walk a learner from the rescaling of a Gaussian to the delicate L^2-critical regime
 * where mass conservation and scale invariance coexist.
 *
 * @module departments/mathematics/try-sessions/scale-critical-equations
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const scaleCriticalEquationsSession: TrySessionDefinition = {
  id: 'math-scale-critical-equations-first-steps',
  title: 'Scale-Critical Equations: When Rescaling Leaves Nothing Behind',
  description:
    'A guided first pass through scale-criticality: derive the critical exponent from a ' +
    'conserved norm, see subcritical/critical/supercritical as three regimes, and find the ' +
    'L^2-critical NLS as the canonical delicate case.',
  estimatedMinutes: 22,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Take the NLS in R^d with power nonlinearity: i d_t psi + Delta psi + |psi|^(p-1) psi = 0. Apply the rescaling psi_mu(x, t) = mu^alpha psi(mu x, mu^2 t). Find the exponent alpha that makes psi_mu also solve NLS.',
      expectedOutcome:
        'You derive alpha = 2 / (p - 1). The rescaling is not free -- the equation forces a specific relationship between amplitude-scaling and length-scaling.',
      hint: 'Plug psi_mu into the equation. Balance the powers of mu on each term.',
      conceptsExplored: ['math-scale-critical-equations', 'math-complex-numbers'],
    },
    {
      instruction:
        'Now compute how a conserved norm scales. The L^2 norm of psi_mu is mu^(alpha - d/2) times the L^2 norm of psi. For which exponent p is the L^2 norm scale-invariant?',
      expectedOutcome:
        'You find p = 1 + 4/d. For d = 2 this is p = 3 (the cubic NLS is L^2-critical in 2D). For d = 1 it is p = 5 (quintic NLS).',
      hint: 'Set alpha - d/2 = 0 and solve for p using alpha = 2 / (p - 1).',
      conceptsExplored: ['math-scale-critical-equations'],
    },
    {
      instruction:
        'Below the critical exponent (p < 1 + 4/d), rescaling LOSES mass; above (p > 1 + 4/d), it GAINS mass. Interpret this in words: what does it mean for the well-posedness theory?',
      expectedOutcome:
        'You see that subcritical = small-data globally good (a rescaling argument can make data arbitrarily small), supercritical = small-data may not save you (high-frequency data gains mass under rescaling), critical = borderline / most delicate.',
      hint: 'Rescaling is the tool. Norm invariance says the tool is sharp exactly at criticality.',
      conceptsExplored: ['math-scale-critical-equations', 'math-blow-up-dynamics'],
    },
    {
      instruction:
        'Name three scale-critical equations beyond NLS. For each, state which conserved quantity is rescaling-invariant.',
      expectedOutcome:
        'You can list: (a) L^2-critical NLS (mass), (b) energy-critical wave equation (energy, i.e., H^1 norm), (c) energy-critical Navier-Stokes in 3D (a different norm, actually the BMO^{-1} scaling). Each has its own conserved quantity.',
      hint: 'Not all scale-critical equations use the same norm. The physically meaningful conserved quantity varies with the PDE.',
      conceptsExplored: ['math-scale-critical-equations'],
    },
    {
      instruction:
        'Read the modulation-decomposition toolkit (Merle et al.): for a critical-mass blow-up, write psi(x, t) = (1 / lambda(t)^alpha) Q((x - x(t)) / lambda(t)) e^(i gamma(t)) + eta(x, t). What are the four modulation parameters?',
      expectedOutcome:
        'You name lambda (scale), x (position), gamma (phase), and the implicit amplitude / exponent alpha. The eta is the error the modulation absorbs.',
      hint: 'Each modulation parameter corresponds to a symmetry group action: dilation, translation, phase.',
      conceptsExplored: ['math-scale-critical-equations', 'math-blow-up-dynamics'],
    },
    {
      instruction:
        'Reflect on why scale-criticality is called "the unifying analytic framework": what does it let you prove once and apply many times?',
      expectedOutcome:
        'You can articulate that the modulation-decomposition toolkit transfers across PDEs (NLS, wave, KdV) because the analytic structure depends on the exponent p = critical, not on the specific equation.',
      hint: 'The critical exponent is a meta-parameter. Theorems that hold at criticality are portable.',
      conceptsExplored: ['math-scale-critical-equations'],
    },
    {
      instruction:
        'Close the session by writing one sentence explaining why this concept sits at the peak abstraction radius (0.95) in the department complex-plane mapping.',
      expectedOutcome:
        'You articulate that scale-criticality is a meta-theory about PDEs, not a PDE itself, which is why it lives at the highest abstraction radius in the ring.',
      hint: 'Meta-theories sit above the objects they classify. Scale-criticality is the classifier.',
      conceptsExplored: ['math-scale-critical-equations'],
    },
  ],
};

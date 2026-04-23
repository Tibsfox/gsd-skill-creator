/**
 * Vorticity Stretching try-session -- the 3D-only mechanism that separates
 * 2D global regularity from the 3D Millennium problem.
 *
 * Walk a learner from the definition of curl through the vortex-stretching
 * term (omega . grad) u to the Beale-Kato-Majda criterion.
 *
 * @module departments/physics/try-sessions/vorticity-stretching
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const vorticityStretchingSession: TrySessionDefinition = {
  id: 'physics-vorticity-stretching-first-steps',
  title: 'Vorticity Stretching: Why 3D Fluid Flow Is Still Open',
  description:
    'A guided first pass through the vortex-stretching term -- the single ' +
    'nonlinear interaction that makes 3D Navier-Stokes a Clay Millennium problem ' +
    'while 2D is globally regular.',
  estimatedMinutes: 22,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Stir a cup of coffee with a spoon. Observe the swirl that forms after you remove the spoon -- a coherent vortex. Now hold a spinning object (a pen) and rotate its axis: feel the gyroscopic resistance. Both are manifestations of vorticity omega = curl(u).',
      expectedOutcome:
        'You have an intuitive sense of vorticity as a rotation vector pointing along the axis of spin, with magnitude equal to twice the angular speed.',
      hint: 'Vorticity is a vector field: direction = rotation axis, magnitude = 2 * angular speed. A still fluid has omega = 0.',
      conceptsExplored: ['physics-vorticity-stretching'],
    },
    {
      instruction:
        'Write the vorticity equation for incompressible flow: D_omega/Dt = (omega . grad) u + nu * laplacian(omega). Three terms: advection (left side, hidden in the material derivative), stretching ((omega . grad) u), diffusion (nu * laplacian). Which term is new compared to the Navier-Stokes velocity equation?',
      expectedOutcome:
        'You identify (omega . grad) u as the new term -- it has no counterpart in the velocity formulation. It is the vortex-stretching (and tilting) term.',
      hint: 'Take curl of Navier-Stokes to derive the vorticity equation. The pressure term drops out, and a new stretching term emerges.',
      conceptsExplored: ['physics-vorticity-stretching', 'math-trig-functions'],
    },
    {
      instruction:
        'Now reduce to 2D: the flow is in the (x, y) plane, and omega points in the z direction. Compute (omega . grad) u. In 2D, omega = (0, 0, omega_z) and u = (u_x, u_y, 0), so grad u has only (x, y) derivatives. What happens to (omega . grad) u?',
      expectedOutcome:
        'You see that (omega . grad) u = omega_z * d_z u -- but u has no z-component and no z-dependence in 2D, so this term vanishes identically. 2D loses vortex stretching.',
      hint: 'In 2D vortex lines are perpendicular to the flow plane; they do not stretch because u does not vary along them.',
      conceptsExplored: ['physics-vorticity-stretching'],
    },
    {
      instruction:
        'In 3D, (omega . grad) u is generically non-zero. Picture a vortex tube (imagine a smoke ring). If neighboring fluid elements along the tube move at different speeds, the tube stretches. Stretching a tube conserves angular momentum -- so the vorticity magnitude grows. What does this do to energy and enstrophy?',
      expectedOutcome:
        'You articulate: stretching concentrates vorticity into smaller spatial regions, driving enstrophy to grow without bound unless dissipation keeps pace. This is the mechanism behind the 3D blowup question.',
      hint: 'Enstrophy = integral of |omega|^2. In 2D it is bounded; in 3D stretching can drive it up.',
      conceptsExplored: ['physics-vorticity-stretching', 'physics-reynolds-similarity'],
    },
    {
      instruction:
        'Read the Beale-Kato-Majda (1984) criterion statement: a solution stays classically regular on [0, T] if and only if the integral of sup_x |omega(x, t)| over [0, T] is finite. What does this criterion tell us about blowup?',
      expectedOutcome:
        'You can state that blowup is equivalent to vorticity becoming L^1([0, T]; L^infty) unbounded. The vorticity has to concentrate without integrable bound for the solution to break down.',
      hint: 'BKM is a necessary and sufficient condition. The integral of sup-norm vorticity is the quantitative indicator.',
      conceptsExplored: ['physics-vorticity-stretching'],
    },
    {
      instruction:
        'Read the 2D Ladyzhenskaya result: in 2D Navier-Stokes, the vorticity is bounded for all time given smooth initial data. Contrast with 3D where the Clay problem asks whether a similar bound holds. Why is the asymmetry between 2D and 3D the central open question?',
      expectedOutcome:
        'You can articulate that the stretching term is the lone obstruction to a 2D-style regularity proof in 3D. Solve the stretching question and you solve Navier-Stokes regularity.',
      hint: 'Ladyzhenskaya 1969 proved 2D global regularity. The Clay Institute\'s $1M problem asks the 3D analog.',
      conceptsExplored: ['physics-vorticity-stretching'],
    },
    {
      instruction:
        'Close the session by stating the connection between vorticity stretching, the complex-plane position of this concept (radius ~0.70, theta ~4*2pi/19), and why the Nonlinear Frontier milestone seeds vorticity-stretching as a full dedicated concept.',
      expectedOutcome:
        'You explain that vortex stretching is the single mechanism that makes 3D incompressible flow hard, and its complex-plane radius reflects a concept that is more abstract than Reynolds similarity but more concrete than pure soliton resolution.',
      hint: 'Radius 0.70 puts vorticity stretching between engineering practice (Re ~ 0.55) and pure analysis (solitons ~ 0.85).',
      conceptsExplored: ['physics-vorticity-stretching', 'physics-reynolds-similarity'],
    },
  ],
};

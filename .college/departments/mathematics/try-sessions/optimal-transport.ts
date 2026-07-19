/**
 * Optimal Transport try-session -- first hands-on contact with moving mass at minimal cost.
 *
 * Walk a learner from the pile-of-sand picture to the Kantorovich dual and the
 * Wasserstein gradient flow that turns transport into the heat equation.
 *
 * @module departments/mathematics/try-sessions/optimal-transport
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const optimalTransportSession: TrySessionDefinition = {
  id: 'math-optimal-transport-first-steps',
  title: 'Optimal Transport: Moving a Distribution at Minimal Cost',
  description:
    'A guided first pass through optimal transport: pose Monge\'s problem, relax it the way ' +
    'Kantorovich did, read the minimum cost as a distance, and watch a gradient flow in that ' +
    'distance become the heat equation.',
  estimatedMinutes: 23,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Draw two piles of sand on a line: a source pile of mass 1 and a target pile of mass 1 at a different location and shape. Monge\'s question: assign every grain of the source to a spot in the target so the total distance moved is smallest. Try to write down such an assignment by hand for three source points and three target points.',
      expectedOutcome:
        'You state Monge\'s problem as finding a map T that pushes the source measure onto the target while minimising the summed transport cost, and you notice a map must send each source point somewhere definite.',
      hint: 'Cost = sum over grains of (mass) x (distance moved). A map cannot split a single grain.',
      conceptsExplored: ['math-optimal-transport'],
    },
    {
      instruction:
        'Now allow a grain to be split across several destinations. Replace the map by a coupling: a non-negative matrix P[i,j] whose row sums are the source weights and column sums are the target weights. This is Kantorovich\'s relaxation. Why is finding the best P always solvable when finding the best map may not be?',
      expectedOutcome:
        'You recognise the coupling as a linear program over a convex polytope (the transport polytope), so a minimiser always exists, whereas a deterministic map can fail to exist (e.g. splitting one atom onto two).',
      hint: 'Row/column-sum constraints + non-negativity define a convex set; a linear objective on it attains its minimum at a vertex.',
      conceptsExplored: ['math-optimal-transport', 'math-ratios'],
    },
    {
      instruction:
        'Build a 3x3 cost matrix C[i,j] = |x_i - y_j| for your points and solve the assignment with scipy.optimize.linear_sum_assignment (or by inspection). Then read off the total cost. This number is the Wasserstein-1 distance between the two distributions. Change one target location and watch the distance change.',
      expectedOutcome:
        'You compute an optimal plan and its cost, and you see that the cost behaves like a distance: zero when the distributions coincide, growing as they separate.',
      hint: 'linear_sum_assignment returns the row/column indices of the optimal one-to-one matching; sum C at those indices.',
      conceptsExplored: ['math-optimal-transport'],
    },
    {
      instruction:
        'Add entropic regularisation: instead of the exact plan, run a few Sinkhorn iterations — alternately rescale rows to match source weights and columns to match target weights, starting from the kernel exp(-C/epsilon). Watch the plan converge. What does epsilon control?',
      expectedOutcome:
        'You see Sinkhorn produce a smooth near-optimal plan in a handful of matrix-vector rescalings, and you identify epsilon as the blur/temperature: small epsilon approaches the sharp optimal plan, large epsilon spreads mass out.',
      hint: 'Sinkhorn = repeated row-normalise then column-normalise of a positive matrix. It converges geometrically.',
      conceptsExplored: ['math-optimal-transport', 'math-exponential-decay'],
    },
    {
      instruction:
        'State the Kantorovich dual: the minimum transport cost equals a maximum over pairs of potential functions (f, g) with f(x) + g(y) <= C(x, y). For the Wasserstein-1 cost this collapses to a single 1-Lipschitz potential. What is the dual telling you about the transport plan?',
      expectedOutcome:
        'You articulate duality: the potentials price each location so that the optimal plan only moves mass along pairs where the pricing is tight (f(x) + g(y) = C(x,y)), the transport analogue of complementary slackness.',
      hint: 'Where the plan puts mass, the dual constraint is active. The potentials are shadow prices on the marginal constraints.',
      conceptsExplored: ['math-optimal-transport'],
    },
    {
      instruction:
        'Read the JKO scheme statement: the heat equation is the steepest-descent (gradient) flow of entropy in the Wasserstein metric — repeatedly take a small step that trades off staying close in Wasserstein distance against decreasing entropy. Simulate two or three JKO steps on your discrete distribution and compare to a plain heat-equation blur.',
      expectedOutcome:
        'You connect optimal transport to the department\'s PDE concepts: a gradient flow in transport geometry reproduces diffusion, so the heat/Fokker-Planck equations are downhill motion in Wasserstein space.',
      hint: 'JKO step: minimise (1/2 tau) W2(rho, rho_prev)^2 + Entropy(rho). As tau -> 0 the iterates trace the heat equation.',
      conceptsExplored: ['math-optimal-transport', 'math-scale-critical-equations'],
    },
    {
      instruction:
        'Close by connecting transport to a neighbour concept: Ollivier-Ricci curvature calls a graph edge positively curved when the two endpoints\' one-step random-walk measures are cheaper to transport into each other than the endpoints are to move. Compute the Wasserstein-1 cost between two neighbours\' walk measures on a small graph and read its sign relative to the edge length.',
      expectedOutcome:
        'You see optimal transport as the engine underneath a curvature notion the department already teaches, and can explain Ollivier-Ricci curvature as a transport-cost comparison.',
      hint: 'Ollivier: kappa(u,v) = 1 - W1(m_u, m_v) / d(u,v), where m_u is the lazy random walk from u.',
      conceptsExplored: ['math-optimal-transport'],
    },
  ],
};

/**
 * Bakry-Émery Curvature-Dimension try-session -- first hands-on contact with graph curvature
 * measured through the Bochner/Gamma-calculus of the Laplacian instead of optimal transport.
 *
 * Walk a learner from the carre du champ Gamma, up to its iterate Gamma_2, into the
 * CD(K,N) inequality, and out to what non-negative curvature forces on a graph.
 *
 * @module departments/mathematics/try-sessions/bakry-emery-curvature-dimension
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const bakryEmeryCurvatureDimensionSession: TrySessionDefinition = {
  id: 'math-bakry-emery-curvature-dimension-first-steps',
  title: 'Bakry-Émery Curvature-Dimension: Ricci Curvature from the Laplacian',
  description:
    'A guided first pass through the Bakry-Émery condition CD(K,N): build the carre du champ from a ' +
    'graph Laplacian, iterate it into a discrete Bochner term, read the curvature-dimension inequality, ' +
    'and see why non-negative curvature caps volume growth and contracts the heat semigroup.',
  estimatedMinutes: 22,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Take a small graph -- a 6-cycle is ideal -- and write its Laplacian L, where (Lf)(x) = sum over neighbours y of (f(x) - f(y)). Pick a function f on the six vertices and compute the carre du champ Gamma(f,f)(x) = 0.5*(L(f^2) - 2f*Lf)(x) at each vertex by hand. Note that Gamma is non-negative and behaves like a squared gradient.',
      expectedOutcome:
        'You compute Gamma(f) vertex by vertex and recognise it as a discrete |grad f|^2: it measures how much f varies across each vertex\'s edges, vanishing exactly where f is locally constant.',
      hint: 'Gamma(f,g) = 0.5*(L(fg) - f*Lg - g*Lf). For f=g the fL(f) terms combine into 2f*Lf. On a graph this reduces to 0.5*sum_y (f(x)-f(y))^2.',
      conceptsExplored: ['math-bakry-emery-curvature-dimension'],
    },
    {
      instruction:
        'Iterate the operator: compute the second carre du champ Gamma_2(f) = 0.5*(L*Gamma(f) - 2*Gamma(f, Lf)) on the same graph and function. This is the discrete analogue of applying the Laplacian to |grad f|^2. Watch how Gamma_2 mixes second-order behaviour of f with the graph geometry around each vertex.',
      expectedOutcome:
        'You produce Gamma_2(f) and see that, unlike Gamma, it can be negative and depends on how neighbours-of-neighbours are wired -- it is the object that will carry the curvature information.',
      hint: 'Reuse the Gamma from step 1: feed Gamma(f) back through L, and separately form Gamma(f, Lf). Gamma_2 is the same bilinear recipe applied one level up.',
      conceptsExplored: ['math-bakry-emery-curvature-dimension'],
    },
    {
      instruction:
        'State the Bakry-Émery curvature-dimension condition: the graph satisfies CD(K,N) if Gamma_2(f) >= K*Gamma(f) + (1/N)(Lf)^2 holds for every function f, at every vertex. Read K as the curvature lower bound and N as an effective dimension (N can be infinity, dropping the last term). Explain, in words, what the inequality is comparing.',
      expectedOutcome:
        'You articulate CD(K,N) as: the curved second-order term Gamma_2 must dominate K copies of the gradient energy plus a dimensional Laplacian term -- so K bounds curvature from below and 1/N charges for the graph acting like an N-dimensional space.',
      hint: 'CD(K,infinity) is just Gamma_2 >= K*Gamma. Finite N tightens it by the extra (1/N)(Lf)^2, which is the price of pretending the graph has dimension N.',
      conceptsExplored: ['math-bakry-emery-curvature-dimension'],
    },
    {
      instruction:
        'Ground the inequality in continuous geometry: on a Riemannian manifold the Bochner formula gives Gamma_2(f) = |Hess f|^2 + Ric(grad f, grad f), and Cauchy-Schwarz gives |Hess f|^2 >= (1/n)(Laplacian f)^2. Line these two facts up against CD(K,N) and identify which manifold quantity K and N are standing in for.',
      expectedOutcome:
        'You see that CD(K,N) is exactly the Bochner formula in disguise: K is a lower bound on Ricci curvature and N plays the role of the manifold dimension n, so the discrete inequality transports a Ricci bound to a graph with no metric or geodesics.',
      hint: 'Substitute the Bochner identity and the Cauchy-Schwarz bound into Gamma_2: you recover Gamma_2 >= Ric*Gamma + (1/n)(Lf)^2, which is CD(Ric-lower-bound, n).',
      conceptsExplored: ['math-bakry-emery-curvature-dimension'],
    },
    {
      instruction:
        'Compute a curvature value: on your 6-cycle, find the largest K for which CD(K,infinity) holds by testing Gamma_2(f) - K*Gamma(f) >= 0 over basis functions (an indicator at one vertex is a good probe). Compare the sign of K on the cycle against a graph you expect to be more negatively curved, such as an infinite binary tree.',
      expectedOutcome:
        'You extract a concrete curvature bound: the cycle comes out flat or slightly non-negative, while the tree forces K negative -- confirming that CD(K,N) ranks graphs by how "curved" their local wiring is, just as Ricci ranks manifolds.',
      hint: 'The best K is the smallest generalised eigenvalue of Gamma_2 relative to Gamma over test functions. A vertex indicator localises the computation to one neighbourhood.',
      conceptsExplored: ['math-bakry-emery-curvature-dimension'],
    },
    {
      instruction:
        'See what non-negative curvature buys you. Assume CD(0,N) and read the two headline consequences: a heat-semigroup gradient estimate Gamma(P_t f) <= P_t Gamma(f) (curvature contracts gradients under diffusion), and polynomial -- not exponential -- growth of ball volumes, a discrete Bishop-Gromov bound. Contrast this with the tree, whose balls grow exponentially.',
      expectedOutcome:
        'You connect Bakry-Émery to the department\'s decay concepts: non-negative curvature makes the heat semigroup P_t = e^{tL} contract gradient energy and caps volume growth at polynomial order, so exponential-type relaxation and volume bounds follow from the sign of K.',
      hint: 'CD(0,infinity) already gives Gamma(P_t f) <= P_t Gamma(f); positive K sharpens it to Gamma(P_t f) <= e^{-2Kt} P_t Gamma(f), an explicit exponential contraction rate.',
      conceptsExplored: ['math-bakry-emery-curvature-dimension', 'math-exponential-decay'],
    },
    {
      instruction:
        'Close by contrasting the two discrete Ricci curvatures on the same edge. Bakry-Émery, which you just computed, measures curvature through the Laplacian and Gamma_2. Ollivier-Ricci instead sets kappa(u,v) = 1 - W1(m_u, m_v)/d(u,v), the optimal-transport cost between the two endpoints\' random-walk measures. Compute Ollivier kappa on one edge of your graph and note where the two notions agree in sign and where they can diverge.',
      expectedOutcome:
        'You can name two independent routes to discrete Ricci curvature -- Bakry-Émery via the Bochner/Gamma-calculus of the Laplacian, Ollivier-Ricci via optimal transport of random walks -- and explain that both formalise the same intuition while measuring it through different machinery.',
      hint: 'Ollivier needs a Wasserstein-1 transport between lazy random walks; Bakry-Émery needs only L and its iterates. They usually agree on sign for nice graphs but weight neighbourhoods differently.',
      conceptsExplored: ['math-bakry-emery-curvature-dimension', 'mathematics-ollivier-ricci-curvature', 'math-optimal-transport'],
    },
  ],
};

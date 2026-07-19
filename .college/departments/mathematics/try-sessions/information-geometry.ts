/**
 * Information Geometry try-session -- first hands-on contact with distributions as a curved manifold.
 *
 * Walk a learner from the probability simplex to the Fisher information metric,
 * the dually-flat e-/m-connections, and the totally-umbilical submanifolds that
 * carry surface-theory geometry into statistics.
 *
 * @module departments/mathematics/try-sessions/information-geometry
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const informationGeometrySession: TrySessionDefinition = {
  id: 'math-information-geometry-first-steps',
  title: 'Information Geometry: A Family of Distributions as a Curved Manifold',
  description:
    'A guided first pass through information geometry: place a probability distribution on the ' +
    'simplex, measure it with the Fisher information metric, meet the dually-flat exponential and ' +
    'mixture connections, and see totally-umbilical submanifolds carry surface geometry into statistics.',
  estimatedMinutes: 21,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Write a distribution over three outcomes as a point (p1, p2, p3) with p1 + p2 + p3 = 1 and each p_i > 0. That constraint carves out the 2-simplex -- a triangle of distributions. Plot a few points and convince yourself that "the set of all 3-outcome distributions" is a 2-dimensional surface, not a flat sheet of free coordinates.',
      expectedOutcome:
        'You see a parametric family of probability distributions as a manifold: a smooth space whose points are distributions and whose dimension is the number of free parameters, here 2 because the weights must sum to 1.',
      hint: 'One coordinate is redundant: p3 = 1 - p1 - p2, so only two numbers move freely inside the simplex.',
      conceptsExplored: ['math-information-geometry'],
    },
    {
      instruction:
        'Pick a one-parameter family, say Bernoulli(theta). Compute the score d/dtheta log p(x; theta) for x in {0, 1}, then form the Fisher information g(theta) = E[score^2]. Do it by hand for Bernoulli and read off g(theta) = 1 / (theta (1 - theta)). Notice the metric blows up near theta = 0 and theta = 1.',
      expectedOutcome:
        'You compute the Fisher information metric as the expected square of the score and recognise it as a Riemannian metric on the parameter space -- distances measured in units of statistical distinguishability, stretching where distributions are easy to tell apart.',
      hint: 'For Bernoulli, log p = x log theta + (1 - x) log(1 - theta); differentiate, square, take the expectation over x ~ Bernoulli(theta).',
      conceptsExplored: ['math-information-geometry'],
    },
    {
      instruction:
        'Use that metric to measure length. The Fisher-Rao distance between theta_a and theta_b is the integral of sqrt(g(theta)) dtheta along the family. For Bernoulli this integrates to an arcsine change of variables (2 arcsin(sqrt(theta))). Compare the Fisher-Rao distance between theta = 0.01 and 0.02 against 0.50 and 0.51 -- same Euclidean gap, very different statistical distance.',
      expectedOutcome:
        'You see that Fisher-Rao distance is not Euclidean distance in parameter space: equal coordinate steps cost different amounts, and geodesics of the Fisher metric are the natural shortest paths between distributions.',
      hint: 'Integrate sqrt(1 / (theta (1 - theta))) dtheta; the substitution theta = sin^2(u) turns it into a plain 2 du.',
      conceptsExplored: ['math-information-geometry'],
    },
    {
      instruction:
        'Now meet the canonical divergence. Compute the Kullback-Leibler divergence KL(p || q) = sum p log(p/q) between two nearby distributions and expand it to second order in the gap. The leading term is (1/2) dtheta^T g dtheta -- half the Fisher metric. Then state the Pythagorean theorem: for the e-geodesic and m-geodesic legs of a right divergence-triangle, KL(p||r) = KL(p||q) + KL(q||r).',
      expectedOutcome:
        'You connect KL divergence to the Fisher metric (its infinitesimal form) and to the dually-flat structure via the information-geometric Pythagorean theorem, the tool behind projection, EM, and maximum-likelihood estimation.',
      hint: 'KL is asymmetric, so it is a divergence, not a distance -- but its second-order Taylor term is symmetric and equals the Fisher metric.',
      conceptsExplored: ['math-information-geometry'],
    },
    {
      instruction:
        'Rewrite an exponential-family density p(x; eta) = exp(eta . T(x) - A(eta)) and identify eta as the natural (canonical) parameter. Verify that A(eta) is convex and that the Fisher metric equals its Hessian, so eta gives flat coordinates for the e-connection while the expectation mu = grad A(eta) gives flat coordinates for the m-connection. These two flat charts are dual through the Legendre transform.',
      expectedOutcome:
        'You identify exponential families as the dually-flat coordinates of information geometry: the natural parameters straighten the e-connection, the mean parameters straighten the m-connection, and the exponential map organises the e-geodesics.',
      hint: 'Convex A(eta) plus its Legendre dual give two coordinate systems for one manifold; the Fisher metric is the Hessian of A, tying the exponential map to the e-connection.',
      conceptsExplored: ['math-information-geometry', 'math-exponential-decay'],
    },
    {
      instruction:
        'Read the paper\'s object: a totally-umbilical submanifold. In classical surface theory a sphere sitting in Euclidean space has second fundamental form proportional to its metric -- it curves the same in every tangent direction. Transfer that to a statistical manifold: a submanifold whose embedding curvature is a scalar multiple of the Fisher metric. Sketch why this is the statistical analogue of "a sphere inside flat space".',
      expectedOutcome:
        'You see the study\'s contribution: surface-theory notions (second fundamental form, umbilicity) transfer to statistical manifolds, so classifying totally-umbilical statistical submanifolds is the information-geometric echo of classifying spheres in Euclidean geometry.',
      hint: 'Umbilical = the shape operator is a scalar times the identity; every direction bends equally, exactly the defining property of a round sphere.',
      conceptsExplored: ['math-information-geometry'],
    },
    {
      instruction:
        'Close by placing information geometry among its neighbours. On the same space of probability measures, contrast the Fisher-Rao metric you just built with the Wasserstein metric of optimal transport -- one measures distinguishability, the other the cost of moving mass. Then recall Ollivier-Ricci curvature as the discrete curvature of a probabilistic graph, and name which geometry each notion belongs to.',
      expectedOutcome:
        'You situate information geometry against optimal transport (a second, transport-based geometry on distributions) and Ollivier-Ricci curvature (a discrete curvature analogue), and can explain that the same measure space supports several distinct geometries chosen to fit the question.',
      hint: 'Fisher-Rao answers "how distinguishable?"; Wasserstein answers "how much work to move mass?"; Ollivier-Ricci ports Ricci curvature to graphs via transport of random-walk measures.',
      conceptsExplored: ['math-information-geometry', 'math-optimal-transport', 'mathematics-ollivier-ricci-curvature'],
    },
  ],
};

/**
 * Cramér-Wold Slicing concept — projection-based characterization of distributions.
 *
 * The classical Cramér-Wold theorem (1936) states that two ℝ^d-valued random vectors
 * agree in distribution iff all their one-dimensional projections along every unit
 * direction agree. LeJEPA (Balestriero & LeCun 2025) adapts this (Lemma 3) to the
 * hyperspherical case and (Theorem 2) promotes it into a valid asymptotic statistical
 * test: sampling M random unit directions from S^{K-1} suffices to drive embedding
 * distributions to their target. This is the mathematical hinge that lets SIGReg
 * reduce a K-dim distribution-matching problem to M cheap univariate problems,
 * avoiding the curse of dimensionality in practice.
 *
 * @module departments/mathematics/concepts/cramer-wold-slicing
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~2*2pi/23, radius ~0.93 (mathematical-foundation ring, high purity)
const theta = 2 * 2 * Math.PI / 23;
const radius = 0.93;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const cramerWoldSlicing: RosettaConcept = {
  id: 'mathematics-cramer-wold-slicing',
  name: 'Cramér-Wold Slicing',
  domain: 'mathematics',
  description: 'The Cramér-Wold theorem (Cramér & Wold, 1936) is a classical result ' +
    'in probability theory: two ℝ^d-valued random vectors X and Y agree in ' +
    'distribution if and only if all their one-dimensional projections <u, X> and ' +
    '<u, Y> along every unit direction u ∈ S^{d-1} agree. The result is the ' +
    'foundation for projection-based characterization of multivariate distributions ' +
    'and appears throughout classical probability, but its computational payoff in ' +
    'modern machine learning is recent: LeJEPA (Balestriero & LeCun 2025) uses the ' +
    'Hyperspherical Cramér-Wold variant (Lemma 3) to reduce K-dimensional embedding ' +
    'distribution-matching to M cheap univariate goodness-of-fit tests, and promotes ' +
    'the classical equivalence into a valid asymptotic statistical test via Theorem ' +
    '2 (sufficiency of directional tests). The sampling-based instantiation avoids ' +
    'the curse of dimensionality because the target (isotropic Gaussian) is smooth ' +
    'in the Sobolev sense; Figure 6 of the paper shows M=10, N=100 suffices to ' +
    'recover a 1024-dim Gaussian with a 2-coordinate perturbation. The concept has ' +
    'a natural home in The Space Between (Tibsfox): when d=2, the unit directions ' +
    'sweep the unit circle itself, making the theorem a statement about planar ' +
    'distributions agreeing iff their directional projections agree — the unit-circle ' +
    'layer of classical probability.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-isotropic-embedding',
      description: 'Cramér-Wold slicing is the mechanism by which isotropy becomes measurable — projection-based characterization avoids the curse of dimensionality',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-characteristic-function-test',
      description: 'Cramér-Wold reduces multivariate matching to univariate; the empirical characteristic function test then solves each univariate subproblem',
    },
    {
      type: 'dependency',
      targetId: 'data-science-heuristics-free-ssl',
      description: 'SIGReg is Cramér-Wold slicing + Epps-Pulley ECF; both ingredients are needed to turn heuristics-free SSL into a ~50-LOC regularizer',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

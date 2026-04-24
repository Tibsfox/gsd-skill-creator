/**
 * Characteristic Function Test concept — the Epps-Pulley ECF normality test.
 *
 * T. W. Epps and L. B. Pulley (1983, Biometrika) introduced a univariate normality
 * test based on the empirical characteristic function φ̂_X(t) = (1/n) Σ e^{i t X_j},
 * comparing it to the target characteristic function under a Gaussian weight. The
 * test has three load-bearing properties that LeJEPA (2025) reports as the reason
 * SIGReg works where moment-based and CDF-based alternatives fail: (1) linear O(N)
 * time and memory; (2) naturally differentiable (no order statistics, no sorting);
 * (3) multi-GPU friendly (ECF is an average, aggregates via a single all_reduce).
 * Crucially, characteristic functions uniquely determine distributions, so matching
 * them gives full distributional identity — not just finite-moment matching.
 *
 * @module departments/ai-computation/concepts/characteristic-function-test
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~4*2pi/23, radius ~0.82 (practical/implementable, architectural-adjacent)
const theta = 4 * 2 * Math.PI / 23;
const radius = 0.82;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const characteristicFunctionTest: RosettaConcept = {
  id: 'ai-computation-characteristic-function-test',
  name: 'Characteristic Function Test (Epps-Pulley)',
  domain: 'ai-computation',
  description: 'T. W. Epps and L. B. Pulley (1983, Biometrika) introduced a ' +
    'univariate normality test comparing the empirical characteristic function ' +
    '(ECF) of a sample to the target distribution\'s characteristic function under ' +
    'a Gaussian weight. LeJEPA (Balestriero & LeCun 2025) settles on this test as ' +
    'the univariate inner loop of SIGReg after §4.2.1 rejects moment-based tests ' +
    '(non-identifiability from finite moments per Carleman\'s 1926 condition; O(k) ' +
    'gradient scaling; O(k²·m_{2(k-1)}) Monte-Carlo variance) and §4.2.2 rejects ' +
    'CDF-based tests (sorting breaks embarrassing parallelism; order statistics are ' +
    'non-differentiable; Kolmogorov-Smirnov\'s ℓ_∞ supremum produces sparse ' +
    'gradients). The ECF test has linear time and memory, is naturally ' +
    'differentiable because it is a sum of smooth functions of the samples, and is ' +
    'multi-GPU friendly because it is an average that aggregates via a single ' +
    'all_reduce. Crucially, characteristic functions uniquely determine ' +
    'distributions — matching ECFs gives full distributional identity, not just ' +
    'finite-moment matching. The computational shape of the Epps-Pulley test is ' +
    'precisely what modern SGD wants; that alignment is why SIGReg ends up as ~50 ' +
    'lines of PyTorch rather than a lattice of relaxations and hyperparameters.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mathematics-cramer-wold-slicing',
      description: 'Cramér-Wold reduces multivariate matching to univariate; the Epps-Pulley ECF test then solves each univariate subproblem',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-isotropic-embedding',
      description: 'The ECF test is the computational instrument that makes the isotropic-Gaussian target practically enforceable inside SGD',
    },
    {
      type: 'dependency',
      targetId: 'data-science-heuristics-free-ssl',
      description: 'SIGReg\'s heuristics-free self-supervised learning requires a univariate test with linear complexity, differentiability, and all_reduce friendliness — all three Epps-Pulley properties',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

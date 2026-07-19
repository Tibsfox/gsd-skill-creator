/**
 * Sequential Testing by Betting concept -- anytime-valid inference via test martingales.
 *
 * Statistical Inference wing: game-theoretic hypothesis testing.
 * Instead of a fixed-sample p-value, you bet against the null through a
 * test martingale (an e-process): unit starting wealth, reinvested each
 * observation via a betting factor that pays off when the null is false.
 * Ville's inequality bounds the chance the wealth ever crosses 1/alpha,
 * so you may monitor the stream continuously and stop at any data-dependent
 * time with guaranteed false-alarm control. Surfaced for the College from
 * the June-2026 arXiv survey arXiv:2606.20859, which frames betting as the
 * common backbone of anytime-valid testing, change detection, and conformal
 * inference.
 *
 * @module departments/data-science/concepts/sequential-testing-by-betting
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta = 9 * 2pi/29 ~ 1.95 rad (advanced / research backbone), radius ~0.84
const theta = 9 * 2 * Math.PI / 29;
const radius = 0.84;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const sequentialTestingByBetting: RosettaConcept = {
  id: 'data-science-sequential-testing-by-betting',
  name: 'Sequential Testing by Betting',
  domain: 'data-science',
  description: 'Anytime-valid sequential testing that bets against a null ' +
    'hypothesis instead of computing a fixed-sample p-value. A test ' +
    'martingale starts with unit wealth and, at ' +
    'each observation, reinvests through a betting factor that pays off ' +
    'exactly when the null is false; under the null its expectation stays ' +
    '<= 1, so by Ville\'s inequality the probability it EVER exceeds 1/alpha ' +
    'is at most alpha. (The more general object is an e-process -- a ' +
    'nonnegative process bounded above by a supermartingale under every ' +
    'distribution in a composite null, hence <= 1 in expectation at any ' +
    'stopping time; every test martingale is an e-process, but not ' +
    'conversely.) The running wealth is an e-value: you may monitor it ' +
    'continuously, stop at any data-dependent time, and reject when it ' +
    'crosses 1/alpha without inflating the type-I error. Betting rules -- ' +
    'the online Newton step, mixtures, and the growth-rate-optimal (GRO) ' +
    'bet -- trade detection speed against robustness, and the same ' +
    'machinery drives sequential change/drift detection and conformal ' +
    'inference (arXiv:2606.20859, 2026).',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'In numpy idiom the test martingale is a running np.cumprod of per-step betting factors: bets = 1 + lam*(payoff - 1); wealth = np.cumprod(bets). You reject at the first index where wealth >= 1/alpha (Ville), so any list-comprehension over stopping times needs no correction. scipy.optimize tunes lam to the GRO bet; a sklearn classifier supplies the two-sample payoff. ' +
        'See Ramdas et al. 2023.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ streams the e-process through one preallocated Eigen::VectorXd of log-wealth so no allocation happens in the online loop; an RAII BettingState owns the capital and updates logWealth += std::log1p(lambda*(payoff - 1)) per step. A templated Strategy functor swaps online-Newton, mixture, or GRO rules, and the contiguous buffer makes Ville crossing one branch. ' +
        'See Ramdas et al. 2023.',
    }],
    ['unison', {
      panelId: 'unison',
      explanation: 'Unison expresses each betting rule -- online-Newton, mixture, GRO -- as a content-addressed function whose hash pins it; the test martingale is a left fold over immutable wealth values, and observation intake is a typed Stream ability so effects stay tracked. The whole e-process forms a Merkle-DAG where every rejection is reproducible from its input hashes. ' +
        'See Ramdas et al. 2023.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'data-hypothesis-testing',
      description: 'Anytime-valid testing replaces the fixed-sample p-value with a test martingale / e-value that can be monitored continuously and stopped at any data-dependent time without inflating the type-I error',
    },
    {
      type: 'cross-reference',
      targetId: 'data-science-drift-detection',
      description: 'The test-martingale betting process is the engine behind sequential change- and drift-detectors such as Page-Hinkley and ADWIN, which alarm the moment accumulated wealth crosses the threshold',
    },
    {
      type: 'cross-reference',
      targetId: 'data-science-conformal-prediction',
      description: 'e-values and conformal p-values share the exchangeability / martingale machinery that underlies their common anytime-valid guarantees',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

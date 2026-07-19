/**
 * Density Evolution concept -- a dataset as a scale-indexed path of densities.
 *
 * Exploratory Analysis wing: Gaussian kernel density estimation is heat flow
 * started from the empirical measure. As the bandwidth h grows, the sum of
 * point masses diffuses toward a single Gaussian bump; tracking modes,
 * level-set topology, and feature lifetimes across the smoothing scale
 * separates genuine structure from sampling noise (the SiZer / mode-tree
 * reading). Surfaced for the College from arXiv:2606.00233 (2026).
 *
 * @module departments/data-science/concepts/density-evolution
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta = 6 * 2pi/29 ~ 1.30 rad (exploratory, multiscale), radius ~0.78
const theta = 6 * 2 * Math.PI / 29;
const radius = 0.78;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const densityEvolution: RosettaConcept = {
  id: 'data-science-density-evolution',
  name: 'Density Evolution',
  domain: 'data-science',
  description: 'A dataset read not as one fixed distribution but as a ' +
    'scale-indexed path of densities. Gaussian kernel density estimation ' +
    'with bandwidth h is exactly heat flow started from the empirical ' +
    'measure (the sum of point masses): as h grows the density diffuses, ' +
    'and modes merge, toward a single Gaussian bump. Sweeping the smoothing ' +
    'scale and tracking the modes, the level-set topology, and each ' +
    'feature\'s lifetime separates real structure from sampling noise -- ' +
    'modes born fine and persisting coarse are genuine, short-lived ones ' +
    'are noise. This is the SiZer / mode-tree reading of a sample, a ' +
    'persistence-style multiscale view surfaced for the College from ' +
    'arXiv:2606.00233 (2026).',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'In numpy idiom, density evolution is a list comprehension over bandwidths: [gaussian_kde(x, bw_method=h) for h in scales] turns the empirical sample into a scale-indexed stack of smoothed densities, each a heat-flow diffusion of the sum-of-deltas. ' +
        'sklearn KernelDensity scores a grid; modes are sign changes of np.gradient, and SiZer maps which survive as h grows. ' +
        'See Chaudhuri & Marron 1999.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ holds the sample in a contiguous Eigen::VectorXd and owns each scale\'s evaluation grid through an RAII KdeState handle; a templated Kernel functor fills a row-major density buffer with no allocation inside the bandwidth loop. ' +
        'Convolving the empirical measure with a widening Gaussian is heat flow; mode counts fall out of one sign-change pass over the gradient. ' +
        'See Chaudhuri & Marron 1999.',
    }],
    ['unison', {
      panelId: 'unison',
      explanation: 'Unison expresses each smoothing scale as a content-addressed function: kdeAt h hashes to a unique id, so the density is an immutable value keyed by the hash of (sample, kernel, h). ' +
        'The scale-indexed path of densities forms a Merkle-DAG; an ability-tracked Sampler effect keeps ingest deterministic, so every mode-lifetime diagram replays from its input hashes. ' +
        'See Chaudhuri & Marron 1999.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'data-distributions',
      description: 'Density evolution is a multiscale view of a distribution: the KDE bandwidth is a smoothing scale, and the mode structure surviving at each scale reveals the distribution\'s underlying shape',
    },
    {
      type: 'cross-reference',
      targetId: 'data-measures-of-spread',
      description: 'The KDE bandwidth is a scale/spread parameter; sweeping it from fine to coarse separates genuine modes from sampling noise',
    },
    {
      type: 'cross-reference',
      targetId: 'math-optimal-transport',
      description: 'KDE-as-heat-flow is the same diffusion that optimal transport realises as the Wasserstein gradient flow of entropy, smoothing the empirical measure toward equilibrium',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

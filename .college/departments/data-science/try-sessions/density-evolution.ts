/**
 * Density Evolution try-session -- a dataset as a scale-indexed path of densities.
 *
 * Walk a learner from a single histogram, through Gaussian KDE as heat flow
 * off the empirical measure, the mode tree over bandwidth, feature lifetimes,
 * SiZer significance, and level-set topology, to why the whole picture is the
 * Wasserstein gradient flow of entropy.
 *
 * @module departments/data-science/try-sessions/density-evolution
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const densityEvolutionSession: TrySessionDefinition = {
  id: 'data-science-density-evolution-first-steps',
  title: 'Density Evolution: A Dataset as a Path of Densities Across Scale',
  description:
    'A guided first pass through density evolution -- from a single ' +
    'histogram, through Gaussian KDE as heat flow off the empirical ' +
    'measure, the mode tree over bandwidth, feature lifetimes, SiZer ' +
    'significance, and level-set topology, to why the whole picture is the ' +
    'Wasserstein gradient flow of entropy smoothing the sample toward one bump.',
  estimatedMinutes: 21,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Draw 400 points from a known bimodal mixture, e.g. 0.5*N(-2,1) + 0.5*N(2,1). Plot a histogram, then overlay scipy.stats.gaussian_kde at a tiny bandwidth and at a huge one. Watch the tiny-h curve turn spiky (one wiggle per point) and the huge-h curve collapse to a single hump. What is the bandwidth h actually controlling?',
      expectedOutcome:
        'You see that h is a smoothing knob: too small over-fits the sample (spurious modes at every point), too large over-smooths (the two true modes merge into one). The right answer is not a single h -- it is the whole family of densities indexed by h. A dataset is not one distribution but a path of them.',
      hint: 'Try scales like h = 0.05, 0.3, 2.0 on the same axes. The number of bumps you count changes with h -- that instability IS the phenomenon, not a bug.',
      conceptsExplored: ['data-science-density-evolution', 'data-distributions'],
    },
    {
      instruction:
        'Now make the heat-flow connection explicit. Start from the empirical measure -- the sum of 400 Dirac spikes at your sample points -- and convolve it with a Gaussian of width h. Increase h in steps and animate the result. Which classical PDE is running as h increases?',
      expectedOutcome:
        'You recognise Gaussian KDE as the heat equation: convolving the sum-of-deltas with a widening Gaussian is exactly diffusion, with h^2 playing the role of diffusion time t. As t grows the density spreads and flattens, and in the limit every empirical measure relaxes to a single broad Gaussian bump -- the equilibrium of the flow.',
      hint: 'The Gaussian kernel is the heat-equation Green function. KDE at bandwidth h = initial delta-sum diffused for time proportional to h^2.',
      conceptsExplored: ['data-science-density-evolution', 'math-optimal-transport'],
    },
    {
      instruction:
        'Sweep h over a fine geometric grid (say 60 values from 0.02 to 3). At each h, evaluate the KDE on a dense x-grid and count local maxima (sign changes of the numerical derivative, np.diff(np.sign(np.gradient(f)))). Plot mode-count versus h. What shape does the curve have?',
      expectedOutcome:
        'You get a decreasing staircase: many modes at small h collapsing step-by-step down toward exactly 1 mode at large h. Each downward step is a mode-merging event. For your bimodal mixture there is a wide plateau at mode-count = 2 -- the scale band where the estimator correctly reports the true structure.',
      hint: 'This staircase is the mode tree read off along the bandwidth axis. A long flat plateau at a given mode-count is strong evidence that that count is real.',
      conceptsExplored: ['data-science-density-evolution', 'data-measures-of-spread'],
    },
    {
      instruction:
        'Turn the mode-count staircase into a lifetime diagram. For each mode, record the bandwidth at which it is born (appears) and the bandwidth at which it dies (merges away). Plot each mode as a horizontal bar spanning [birth, death] in scale. Which bars are long and which are short?',
      expectedOutcome:
        'You see two long-lived bars (your two true modes, persisting across a wide scale band) and a scatter of very short bars near small h (noise modes that appear and vanish within a narrow scale range). Lifetime across scale is the persistence signal: long life = real feature, short life = sampling noise.',
      hint: 'This is a persistence-diagram reading of density. Rank modes by scale-lifetime and the true structure sorts itself to the top.',
      conceptsExplored: ['data-science-density-evolution'],
    },
    {
      instruction:
        'Add significance in the SiZer spirit (Chaudhuri & Marron 1999). Bootstrap-resample the data ~200 times, recompute the KDE derivative at each (x, h), and at each location mark whether the derivative is significantly positive, significantly negative, or indistinguishable from zero. Render this as a color map over the (x, h) plane. What do you look for?',
      expectedOutcome:
        'You read the SiZer map: a genuine mode is a location where the derivative is significantly positive to its left and significantly negative to its right, and that signed pair persists over a band of h. Noise wiggles show no significant sign structure. You now have a hypothesis test for "is this bump real at scale h?", not just an eyeball call.',
      hint: 'SiZer = SIgnificant ZERo crossings of the derivative. Blue-then-red across a mode, stable over a range of h, means the feature is statistically real at that scale.',
      conceptsExplored: ['data-science-density-evolution', 'data-measures-of-spread'],
    },
    {
      instruction:
        'Now look at topology instead of modes. Fix a density threshold c and form the super-level set {x : f_h(x) > c}. At small h it is a fragmented union of many little intervals; sweep h upward and watch components merge into fewer, wider intervals. How does the level-set component count relate to what you found in step 3?',
      expectedOutcome:
        'You see that level-set topology and the mode tree are two faces of the same object: connected components of the super-level set correspond to modes above threshold, and both counts drop monotonically as h increases and diffusion merges features. Density evolution can be tracked through modes, through level sets, or through persistence -- they agree.',
      hint: 'Vary c as well as h. The pair (c, h) traces out the full topological evolution; a mode that dominates over a wide c-range and h-range is unambiguously real.',
      conceptsExplored: ['data-science-density-evolution', 'data-distributions'],
    },
    {
      instruction:
        'Close by placing density evolution on the complex plane of experience: a medium-concreteness, high-complexity exploratory concept sitting where nonparametric statistics meets diffusion geometry. State one line that captures why viewing a sample as a path of densities is more honest than reporting a single KDE.',
      expectedOutcome:
        'You state something like: "A sample is not one density but a scale-indexed path -- Gaussian KDE is heat flow off the empirical measure, the same diffusion optimal transport calls the Wasserstein gradient flow of entropy. Reading modes, level sets, and feature lifetimes across bandwidth, rather than fixing one h, is what separates genuine structure from sampling noise."',
      hint: 'The single most honest deliverable is not a curve but the mode-lifetime / SiZer summary: which features survive across scale, and over what band of h.',
      conceptsExplored: ['data-science-density-evolution', 'math-optimal-transport'],
    },
  ],
};

/**
 * Aperiodic Wang Tiles try-session -- first hands-on contact with order that never repeats.
 *
 * Walk a learner from the edge-matching rule of a single Wang tile to the forcing
 * argument that pins a tile set's stripe density to a quadratic irrational, and on
 * to the 24-tile Penrose encoding and its kinship with fractal self-similarity.
 *
 * @module departments/mathematics/try-sessions/aperiodic-wang-tiles
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const aperiodicWangTilesSession: TrySessionDefinition = {
  id: 'math-aperiodic-wang-tiles-first-steps',
  title: 'Aperiodic Wang Tiles: Tiling the Plane Without Ever Repeating',
  description:
    'A guided first pass through aperiodic order: match colored tile edges, separate ' +
    'periodic from aperiodic tilings, force a stripe density to a quadratic irrational ' +
    'via a quadrilateral circumscribed to a parabola, and meet the 24-tile Penrose encoding.',
  estimatedMinutes: 21,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Draw a few Wang tiles: unit squares with a color painted on each of the four edges (North, East, South, West). Place them on a grid without rotating or reflecting them, with the single rule that two tiles may touch only if their shared edge carries the same color. Hand-tile a 3x3 patch from a small set of your own tiles.',
      expectedOutcome:
        'You state the Wang matching rule -- edge colors must agree across every shared boundary, with tiles in fixed orientation -- and you see that a tiling is just an assignment of tiles to grid cells that satisfies every edge constraint at once.',
      hint: 'Think of each edge color as a jigsaw notch: East must equal the neighbour\'s West, North must equal the neighbour\'s South. No rotation allowed.',
      conceptsExplored: ['math-aperiodic-wang-tiles'],
    },
    {
      instruction:
        'Design a tile set that DOES admit a periodic tiling: find a small rectangular block of placed tiles that, when translated in two independent directions, tiles the whole plane. Mark the two translation vectors. This is a fundamental domain that repeats.',
      expectedOutcome:
        'You recognise a periodic tiling as one invariant under a rank-2 lattice of translations, so the entire plane is determined by one repeating block. Most easy tile sets are periodic in exactly this sense.',
      hint: 'Periodicity = a pair of independent shift vectors that map the tiling onto itself. The repeating block is its fundamental domain.',
      conceptsExplored: ['math-aperiodic-wang-tiles', 'mathematics-tonnetz-lattice'],
    },
    {
      instruction:
        'Now aim for the opposite: a tile set that tiles the plane but where NO tiling is periodic. Suppose some tiling had a period vector; follow how the matching rule forces the tiles along a row, and argue that a forced propagation eventually contradicts any assumed shift. This is what "aperiodic set" means.',
      expectedOutcome:
        'You articulate aperiodicity: the set can cover the plane, yet every valid tiling lacks any translational symmetry, because local matching rules force a global structure that no finite shift can preserve.',
      hint: 'Aperiodic is stronger than "this one tiling happens not to repeat" -- it means NONE of the set\'s tilings can be periodic.',
      conceptsExplored: ['math-aperiodic-wang-tiles'],
    },
    {
      instruction:
        'Introduce stripe densities: color certain rows or columns as "stripes" and, along a long strip of a forced tiling, tally the running fraction of stripe cells. Watch that fraction settle toward a limiting value instead of a simple repeating ratio like 1/2 or 2/3.',
      expectedOutcome:
        'You see that the matching rules force a definite limiting stripe density, and that when this density is irrational the tiling can never close up into a period -- density becomes the obstruction to periodicity.',
      hint: 'A periodic tiling forces a rational density (repeat length / period). An irrational limiting density rules periodicity out immediately.',
      conceptsExplored: ['math-aperiodic-wang-tiles', 'math-ratios'],
    },
    {
      instruction:
        'Read the central claim of arXiv:2606.24693: for each quadratic irrational you can build a FINITE Wang tile set whose forced vertical/horizontal stripe densities equal that number. Pick the golden ratio phi = (1 + sqrt 5)/2 and describe, in words, how a substitution (deflation) rule could generate its Fibonacci-like stripe sequence.',
      expectedOutcome:
        'You connect a specific quadratic irrational to a specific finite aperiodic tile set, and you see the substitution rule as the engine that manufactures the irrational density -- each quadratic irrational gets its own encoding.',
      hint: 'phi satisfies x^2 = x + 1; its continued fraction is all 1s. A substitution that replaces a wide stripe by (wide, narrow) mimics the Fibonacci recurrence.',
      conceptsExplored: ['math-aperiodic-wang-tiles', 'math-ratios'],
    },
    {
      instruction:
        'Meet the headline example: the Penrose tilings can be encoded in just 24 Wang tiles. Sketch how a self-similar inflation rule -- subdividing each tile into smaller copies that reassemble into the same set -- produces the Penrose pattern, and why that self-similarity leaves no room for a period.',
      expectedOutcome:
        'You see the 24-tile encoding as a compact witness that aperiodic order is achievable with a small finite alphabet, and you identify inflation/self-similarity as the mechanism behind both the tiling and its aperiodicity.',
      hint: 'Inflation maps the tiling to a scaled copy of itself. A tiling that is its own rescaling cannot also be invariant under a fixed translation.',
      conceptsExplored: ['math-aperiodic-wang-tiles', 'math-fractal-geometry'],
    },
    {
      instruction:
        'Close by comparing two kinds of order. A fractal repeats by SELF-SIMILARITY across scales; an aperiodic tiling repeats only LOCALLY, its matching rules forbidding any global period. State how the Penrose inflation makes a single tiling belong to both stories, and what distinguishes scale-invariant order from translation-forbidding order.',
      expectedOutcome:
        'You can explain aperiodic tilings as order without periodicity and place them beside fractal self-similarity: both refuse the naive "one block, repeated" picture, but one is invariant under rescaling while the other is pinned by local edge rules to an irrational density.',
      hint: 'Fractal = invariant under zoom; aperiodic tiling = pinned by local rules to a non-repeating (irrational-density) global arrangement. Penrose inflation sits at the overlap.',
      conceptsExplored: ['math-aperiodic-wang-tiles', 'math-fractal-geometry'],
    },
  ],
};

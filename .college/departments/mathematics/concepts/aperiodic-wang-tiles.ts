/**
 * Aperiodic Wang Tiles concept -- tile sets that cover the plane only non-periodically.
 *
 * Geometry wing: aperiodic order enforced by local edge-matching rules.
 * Wang tiles are unit squares with colored edges placed edge-to-edge, without
 * rotation, so abutting colors agree; a set is aperiodic when it tiles the whole
 * plane yet admits no periodic tiling. Surfaced for the College from the June-2026
 * arXiv survey arXiv:2606.24693, which forces the vertical/horizontal stripe
 * densities to be quadratic irrationals, tying each quadratic irrational to a
 * finite aperiodic tile set and encoding the Penrose tilings in 24 tiles.
 *
 * @module departments/mathematics/concepts/aperiodic-wang-tiles
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta = 6 * 2pi/31 ~ 1.22 rad (Geometry wing: abstract structure, aperiodic order), radius ~0.85
const theta = 6 * 2 * Math.PI / 31;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const aperiodicWangTiles: RosettaConcept = {
  id: 'math-aperiodic-wang-tiles',
  name: 'Aperiodic Wang Tiles',
  domain: 'mathematics',
  description: 'Wang tiles are unit squares with colored edges that must abut like-colored ' +
    'neighbours, placed without rotation; a tile set is aperiodic when it tiles the whole ' +
    'plane yet admits no periodic tiling. Building on the classical aperiodic sets ' +
    '(Berger 1966), arXiv:2606.24693 (2026) forces the density of vertical and horizontal ' +
    'colored stripes to equal a fixed quadratic irrational, pinning each quadratic irrational ' +
    'to a finite aperiodic tile set and encoding the Penrose tilings in just 24 tiles. ' +
    'Order without repetition is enforced entirely by local edge-matching rules.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'In numpy idiom a Wang tile is a length-4 row of edge colors (N,E,S,W); a tile set is an int array of shape (T,4) and a placement is a 2-D grid of tile indices. Legality is a vectorised np.roll check that each right neighbour\'s W equals this tile\'s E and each lower neighbour\'s N equals its S. Stripe densities tallied by list comprehension converge to a quadratic irrational. ' +
        'See Grünbaum & Shephard 1987.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ stores the tile set as a contiguous std::vector<Tile>, each Tile a POD struct of four uint8_t edge colors, and holds the plane as a row-major grid buffer owned by an RAII Tiling handle. A backtracking placer templated on the color type extends the frontier only where a cell\'s west matches its left neighbour\'s east and its north the cell above, so no allocation occurs in the recursion. ' +
        'See Grünbaum & Shephard 1987.',
    }],
    ['lisp', {
      panelId: 'lisp',
      explanation: '(tile n e s w) is an s-expression and a tile set is a quoted list of them; homoiconicity lets (with-matching-rules grid ...) expand the edge-compatibility predicate into (and (eq (east a) (west b)) (eq (south a) (north b))) at macro-expansion time. Substitution (deflation) is a symbolic rewrite, so forcing a quadratic-irrational stripe density is a combinator transform, not a runtime search. ' +
        'See Grünbaum & Shephard 1987.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'math-fractal-geometry',
      description: 'Both are order without periodicity: fractal geometry repeats by self-similarity across scales, while an aperiodic tiling repeats only locally, its matching rules forbidding any global translational period',
    },
    {
      type: 'cross-reference',
      targetId: 'mathematics-tonnetz-lattice',
      description: 'Both are read on a lattice: the Tonnetz is a periodic pitch lattice that shifts onto itself, whereas Wang tiles force a tiling of the integer lattice that no shift can fix -- an aperiodic one',
    },
    {
      type: 'dependency',
      targetId: 'math-ratios',
      description: 'The forced non-periodicity is pinned to quadratic-irrational stripe densities -- irrational proportions such as the golden ratio that no finite integer period can ever match',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

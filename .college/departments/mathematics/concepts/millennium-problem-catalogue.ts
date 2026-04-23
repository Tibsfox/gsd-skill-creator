/**
 * Millennium Problem Catalogue concept -- 7 Clay prize problems, 1 solved.
 *
 * Mathematics at the frontier: the seven Clay Millennium Prize Problems.
 * Announced May 2000 with $1M each, only Poincaré has been resolved
 * (Perelman 2003, declined 2010); Navier-Stokes, RH, P vs NP, Yang-Mills,
 * BSD, and Hodge remain open as of April 2026.
 *
 * @module departments/mathematics/concepts/millennium-problem-catalogue
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~18*2pi/19, radius ~0.85
const theta = 18 * 2 * Math.PI / 19;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const millenniumProblemCatalogue: RosettaConcept = {
  id: 'math-millennium-problem-catalogue',
  name: 'Millennium Problem Catalogue',
  domain: 'mathematics',
  description: 'The seven Clay Mathematics Institute Millennium Prize Problems, ' +
    'announced May 24, 2000 in Paris at a ceremony chaired by John Tate and ' +
    'Michael Atiyah, each carrying a US$1,000,000 purse. One is solved: the ' +
    'Poincaré Conjecture, resolved by Grigori Perelman via Hamilton\'s Ricci ' +
    'flow with surgery (arXiv preprints 2002-2003); Perelman declined both the ' +
    '2010 Clay prize and the 2006 Fields Medal. Six remain open as of April ' +
    '2026: the Riemann Hypothesis, P vs NP, Navier-Stokes existence and ' +
    'smoothness, Yang-Mills existence and mass gap, Birch and Swinnerton-Dyer, ' +
    'and the Hodge Conjecture. Charles Fefferman wrote the official Navier-' +
    'Stokes problem description with four formal conjectures (A, B on ℝ³; ' +
    'C, D on the three-torus).',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Python models the catalogue as a typed dict list of seven entries: [{"id": "rh", "status": "open", "prize_usd": 1_000_000, "solver": None}, ...], with Poincaré as the sole entry whose solver == "Perelman" and year == 2003. ' +
        'Jupyter pairs each problem with a LaTeX-rendered statement and arXiv hyperlinks. ' +
        'numpy sub-arrays capture the conjecture-A-through-D structure of the Navier-Stokes statement. ' +
        'See Fefferman 2006.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ uses std::array<MillenniumProblem, 7> with compile-time-constant size, static constexpr prizes, and strong enum types for status (Open, Solved). ' +
        'The header exposes a view-only API (begin/end/find_by_id); the .cpp source owns any live metadata scrape and program-scope ownership suffices because the catalogue never grows past seven. ' +
        'Template specialisations render statements to LaTeX, text, or JSON. ' +
        'See Fefferman 2006.',
    }],
    ['lisp', {
      panelId: 'lisp',
      explanation: '(defparameter *millennium* ((poincare solved 2003 perelman) (riemann open nil nil) (navier-stokes open nil nil) ...)) makes the catalogue a quoted list the reader can walk. ' +
        'Macro (defproblem name status year solver ...) expands to canonical tuples, and progress updates are cons-cell surgery on *millennium*. ' +
        'Code-as-data matches the Clay Institute pattern: canonical, small, structured, revisable only by authoritative edits. ' +
        'See Fefferman 2006.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'math-erdos-problem-index',
      description: 'Both catalogues are Linnaean-precision indices of open mathematical problems, maintained by authoritative curators',
    },
    {
      type: 'dependency',
      targetId: 'math-complex-numbers',
      description: 'The Riemann Hypothesis concerns zeros of ζ(s) in the complex plane; complex analysis is foundational across the catalogue',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

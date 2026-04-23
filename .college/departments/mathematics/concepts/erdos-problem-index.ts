/**
 * Erdős Problem Index concept -- the canonical open-problem database.
 *
 * Problem-curation mathematics: machine-actionable open-problem metadata.
 * erdosproblems.com (launched May 2023 by Thomas Bloom, co-maintained
 * by Terence Tao) is a structured registry of 1,100+ Erdős problems
 * with difficulty tiers, prize amounts, status flags, and cross-references.
 *
 * @module departments/mathematics/concepts/erdos-problem-index
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~16*2pi/19, radius ~0.75
const theta = 16 * 2 * Math.PI / 19;
const radius = 0.75;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const erdosProblemIndex: RosettaConcept = {
  id: 'math-erdos-problem-index',
  name: 'Erdős Problem Index',
  domain: 'mathematics',
  description: 'The canonical open-problem database at erdosproblems.com, launched ' +
    'May 2023 by number theorist Thomas Bloom "to collect Paul Erdős\'s ' +
    'problems and keep track of progress on them," with a companion GitHub ' +
    'repository github.com/teorth/erdosproblems co-maintained by Fields ' +
    'Medalist Terence Tao. Every entry carries a stable numeric identifier, ' +
    'a precise formal statement, known partial results, historical context, ' +
    'cross-references, and a status flag. By April 2026 the catalogue exceeds ' +
    '1,100 problems with roughly 41% flagged solved. In August 2025 Bloom ' +
    'added a forum component, and a crowdsourced project now links entries ' +
    'to OEIS sequences. A dedicated wiki page tracks every logged AI attempt, ' +
    'making it the live registry for ML-assisted contributions to mathematics.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'A Python client models the index as a pandas.DataFrame indexed by problem-id, with columns for statement, status, prize, references, and ai_attempted. ' +
        'requests + BeautifulSoup scrapes entries and numpy boolean masks drive status-filter queries. ' +
        'Jupyter renders the solved-vs-open frontier as a heatmap over (year-posed, difficulty-tier), exposing where AI contributions cluster. ' +
        'See Bloom 2026 erdosproblems.com.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ declares struct ErdosProblem { uint32_t id; std::string statement; Status status; uint64_t prize; std::vector<uint32_t> crossRefs; } stored in a std::unordered_map<uint32_t, ErdosProblem> for cache-friendly scans. ' +
        'The header exposes enum Status (Open, Partial, Solved) and the query API; the .cpp source owns the HTTP fetch + parser. ' +
        'Constexpr fnv1a hashes lookup #1196 in O(1). ' +
        'See Bloom 2026 erdosproblems.com.',
    }],
    ['lisp', {
      panelId: 'lisp',
      explanation: 'The catalogue is an association list: (("#1196" (statement . "...") (status . solved-by-ai) (prize . 0)) ...); (assoc id *erdos*) drives the whole query layer and macro (define-problem id ...) expands into canonical list form. ' +
        'Homoiconicity means the database IS code: a new problem is a cons cell appended to *erdos*. ' +
        'The MIT tradition matches the wiki-style maintenance Bloom and Tao run. ' +
        'See Bloom 2026 erdosproblems.com.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'math-euler-formula',
      description: 'Prime-counting and zeta-function problems in the index use Euler formula-adjacent identities heuristically',
    },
    {
      type: 'dependency',
      targetId: 'math-logarithmic-scales',
      description: 'Many Erdős problems involve log-density bounds and log-scale asymptotics (e.g. ∑ 1/(a log a) in #1196)',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

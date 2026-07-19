/**
 * D-Separation concept -- the graphical criterion for conditional independence.
 *
 * Statistical Inference wing: reading independence off causal structure.
 * d-separation (Pearl 1988; Verma & Pearl 1990) is a purely topological test
 * on a directed acyclic graph that certifies which conditional-independence
 * relations must hold in every distribution factorizing over the graph. It
 * bridges causal graph structure, the semi-graphoid axioms, and Bayesian
 * conditioning. Surfaced for the College from the June-2026 arXiv survey
 * arXiv:2606.20351, which re-derives soundness and the graphoid laws on a
 * finite DAG.
 *
 * @module departments/data-science/concepts/d-separation
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta = 12 * 2pi/29 ~ 2.60 rad (abstract graphical criterion, research backbone), radius ~0.88
const theta = 12 * 2 * Math.PI / 29;
const radius = 0.88;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const dSeparation: RosettaConcept = {
  id: 'data-science-d-separation',
  name: 'D-Separation',
  domain: 'data-science',
  description: 'A purely graphical criterion on a finite directed acyclic graph ' +
    'that reads conditional-independence relations off the topology without ' +
    'touching the numbers. A path is blocked by a conditioning set Z when it ' +
    'runs through a chain (A -> B -> C) or fork (A <- B -> C) whose middle node ' +
    'lies in Z, or a collider (A -> B <- C) whose middle node and all of its ' +
    'descendants lie outside Z; two variable sets X and Y are d-separated by Z ' +
    'when every path between them is blocked. Soundness guarantees that ' +
    'd-separation implies conditional independence in every distribution that ' +
    'factorizes over the DAG, so the graph alone certifies X ⫫ Y | Z. ' +
    'Completeness runs the other way: whenever a path stays open -- X and Y ' +
    'are d-CONNECTED given Z -- some distribution factorizing over the DAG ' +
    'makes them dependent given Z, so the graph captures exactly the ' +
    'conditional independencies shared by every distribution it admits and ' +
    'asserts none that are merely coincidental. The ' +
    'criterion is a graphoid -- it obeys the semi-graphoid axioms (symmetry, ' +
    'decomposition, weak union, contraction) -- turning Bayesian conditioning ' +
    'into a matter of tracing open trails rather than integrating ' +
    '(arXiv:2606.20351, 2026).',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Python reaches for networkx and pgmpy: encode the DAG as a DiGraph, then nx.is_d_separator(G, X, Y, Z) walks every trail, blocking chains and forks whose middle node is in Z and colliders with no descendant in Z. ' +
        'A comprehension [p for p in nx.all_simple_paths(G, x, y) if is_open(p, Z)] lists the open paths, and a scipy partial-correlation confirms the independence numerically. ' +
        'See Pearl 2009.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ keeps the DAG as CSR adjacency in one contiguous int32 buffer owned through an RAII Graph handle, so no node outlives the arena. Reachability runs as a templated Bayes-Ball BFS over a preallocated visited bitset -- no allocation inside the frontier loop -- opening a collider only when its node or a descendant sits in Z. ' +
        'Eigen holds the covariance for the numeric check. ' +
        'See Pearl 2009.',
    }],
    ['unison', {
      panelId: 'unison',
      explanation: 'In Unison every node and edge is a content-addressed value, so the whole DAG hashes to one identifier and a d-separation query is a pure, deterministic function of that hash: same graph, same set Z, same verdict every run. ' +
        'Ability handlers keep the trail-search effects typed, and the immutable Merkle-DAG lets each result be cached and re-derived from its input hashes. ' +
        'See Pearl 2009.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'data-correlation',
      description: 'd-separation makes "correlation is not causation" rigorous: it reads the conditional independencies implied by a causal DAG off the graph structure rather than inferring them from the observed data',
    },
    {
      type: 'dependency',
      targetId: 'data-probability-basics',
      description: 'd-separation is a graphical shortcut for conditional independence, so it presupposes conditional probability and statistical independence as its underlying semantics',
    },
    {
      type: "cross-reference",
      targetId: "data-science-causal-density-ratio",
      description: "Causal density ratio invokes d-separation to decide which conditioning sets license the q(x)/p(x) reweighting; adding the back-link closes the causal-cluster edge so a learner on d-separation can follow forward into how blocked/unblocked paths govern change-of-measure validity.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

/**
 * Run Dependency Graph concept — agent-systems integration-evaluation wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.22741 (2026).
 *
 * @module departments/agent-systems/concepts/integration-evaluation/run-dependency-graph
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 11 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const runDependencyGraph: RosettaConcept = {
  id: 'agent-run-dependency-graph',
  name: 'Run Dependency Graph',
  domain: 'agent-systems',
  description: 'A run dependency graph models one LLM agent run as a single graph over its step nodes carrying two distinct edge layers. The execution layer records what ran in what order and is recovered from the trace essentially for free, since traces already log which step fired when. The dependency layer records what each step actually relied on — the state it read, the results it reused, the prior outputs it consumed — which traces almost never capture; GRADE (arXiv:2606.22741 (2026)) recovers this missing layer and grades every dependency edge by its provenance — one of four ways it is established: directly known, observed, declared by the tool contract, or inferred. The paper\'s finding across six corpora spanning tool use, coding, and web agents is a division of labor between the layers: the dependency layer predicts failure precisely where crude run-size features are weak, and under leave-one-corpus-out transfer it stays above chance on every held-out class while run size collapses; meanwhile the execution layer localizes the faulting step inside a failed multi-agent run. It also shows that generic graph neural networks may misread the dependency layer where a feature-based reader does not. Distinct from the Silent-Failure Taxonomy, which enumerates categories of undetected failure post hoc: this is a structural, provenance-graded representation that both predicts a run will fail and points at where, rather than labeling failures after the fact. For building agent systems, it argues that observability should not stop at logging execution order — the higher-value signal is a reconstructed, provenance-typed dependency graph, and instrumenting tool contracts to declare their reads and reuses turns cheap traces into a substrate for failure diagnosis, efficiency tuning, and robustness analysis at scale.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-silent-failure-taxonomy',
      description: 'Both target undetected agent failure, but the run dependency graph is a predictive structural representation whereas the taxonomy is a post-hoc classification of failure modes; the graph can surface silent failures the taxonomy only names.',
    },
    {
      type: 'dependency',
      targetId: 'agent-intervention-error-attribution',
      description: 'The execution layer\'s ability to localize the faulting step in a failed multi-agent run feeds error-attribution: dependency-graded edges scope which upstream step an observed failure can be traced back to.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-artifact-provenance-gap',
      description: 'The dependency layer\'s per-edge provenance grading (observed, declared, inferred) directly instruments the artifact-provenance gap, recording which reads and reuses are actually known versus merely assumed.',
    },
    {
      type: 'analogy',
      targetId: 'agent-paired-trace-audit',
      description: 'Both extract structure a raw trace omits; the paired-trace audit compares two traces to expose behavioral divergence, while the run dependency graph augments a single trace with a recovered dependency layer.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

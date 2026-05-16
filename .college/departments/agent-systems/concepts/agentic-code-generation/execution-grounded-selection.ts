import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const executionGroundedSelection: RosettaConcept = {
  id: 'agent-execution-grounded-selection',
  name: 'Execution-Grounded Selection',
  domain: 'agent-systems',
  description:
    'Pick among candidate outputs by RUNNING them on diverse inputs and clustering by behavioural fingerprint, rather ' +
    'than by textual aggregation, log-probability, or output-majority voting. The 2026 finding (Semantic Voting, arxiv ' +
    "`2605.08680v1`) is that ANY execution-based selector dominates output-majority voting by 19-52pp, and that " +
    'sketch-generated inputs beat random fuzz by 11.3pp. The pattern is the strongest single signal in the May 2026 ' +
    'agentic-code corpus: when an executor returns multiple plausible candidates, behavioural disambiguation under ' +
    'diverse inputs is what produces the right pick. Generalises beyond code to any output that can be probed under ' +
    'inputs the model did not see at generation time. Anchored at the rosetta-core level as Concept 9.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'rosetta-execution-grounded-selection',
      description: 'Anchored at the rosetta-core level as concept #9',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-paired-trace-audit',
      description: 'Paired-trace audit is execution-grounded selection applied to skills (vs. to code outputs)',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-harness-as-substrate',
      description: 'The execution substrate that makes this possible is the harness itself',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.25 + 0.16),
    angle: Math.atan2(0.4, 0.5),
  },
};

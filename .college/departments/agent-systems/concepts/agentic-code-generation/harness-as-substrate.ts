import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const harnessAsSubstrate: RosettaConcept = {
  id: 'agent-harness-as-substrate',
  name: 'Harness as Substrate',
  domain: 'agent-systems',
  description:
    'The runtime substrate (task spec, context selection, tool access, project memory, task state, observability, ' +
    'failure attribution, verification, permissions, entropy auditing, intervention recording) that mediates between a ' +
    'foundation-model agent and its environment. Software-engineering capability emerges from the *model-harness-' +
    'environment* system rather than from the model alone (Zhong & Zhu, arxiv 2605.13357v1). The H0-H3 ladder is the ' +
    "canonical taxonomy: H0 is bare model, H3 is full agentic harness with all eleven responsibilities. The empirical " +
    'finding is that structural constraints from the harness, not functional correctness, dominate failure modes — moving up ' +
    'the ladder buys more capability than a base-model upgrade at the same compute budget. Agent-systems analogue of the ' +
    '"boundary condition" Rosetta concept (rosetta-core #6): the harness is the engineered Markov blanket between the ' +
    "agent's generative model and the project environment.",
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'sci-boundary-condition',
      description: 'Harness as substrate is the agent-systems instantiation of the boundary-condition Rosetta concept (Markov blanket)',
    },
    {
      type: 'dependency',
      targetId: 'agent-episode-package',
      description: 'The harness emits an episode package per run — the canonical artifact for offline analysis',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-execution-grounded-selection',
      description: 'Execution-grounded selection runs INSIDE the harness; the harness provides the execution substrate',
    },
  ],
  complexPlanePosition: {
    real: -0.3,
    imaginary: -0.5,
    magnitude: Math.sqrt(0.09 + 0.25),
    angle: Math.atan2(-0.5, -0.3),
  },
};

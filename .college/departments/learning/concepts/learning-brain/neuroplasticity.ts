import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const neuroplasticity: RosettaConcept = {
  id: 'learn-neuroplasticity',
  name: 'Neuroplasticity',
  domain: 'learning',
  description:
    'Neuroplasticity is the brain\'s ability to reorganize its structure and function in response ' +
    'to experience, learning, and injury. Synaptic plasticity — strengthening (long-term potentiation) ' +
    'or weakening (long-term depression) of connections between neurons — is the cellular basis of ' +
    'learning and memory. Hebbian learning: "neurons that fire together wire together" — co-activation ' +
    'strengthens synaptic connections. Structural plasticity: new synapses form (synaptogenesis), ' +
    'unused ones are pruned (synaptic pruning), and new neurons can form in specific regions ' +
    '(adult neurogenesis in the hippocampus). Critical periods in development show heightened ' +
    'plasticity for specific skills (language acquisition before puberty, binocular vision in early ' +
    'childhood). Adult neuroplasticity is more constrained but lifelong: skill practice produces ' +
    'measurable cortical map changes (London taxi drivers\' enlarged hippocampal areas). ' +
    'Implications for learners: consistent practice changes brain structure; the brain is not ' +
    'fixed at birth; learning difficulty is often a signal to change approach, not evidence of ' +
    'permanent limitation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'learn-memory-science',
      description: 'Neuroplasticity is the biological mechanism underlying memory formation and consolidation',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.16 + 0.36),
    angle: Math.atan2(0.6, 0.4),
  },
};

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const distributedExpertise: RosettaConcept = {
  id: 'prob-distributed-expertise',
  name: 'Distributed Expertise',
  domain: 'problem-solving',
  description:
    'Complex problems often require knowledge from multiple domains. Distributed expertise means deliberately ' +
    'assembling teams where different members contribute different specialist knowledge. ' +
    'The challenge is integration: how do non-experts understand enough to use specialists\' contributions? ' +
    'Techniques include boundary objects (shared representations bridging expertise), ' +
    'and T-shaped skills (depth in one area, breadth across many).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'prob-group-problem-solving',
      description: 'Distributed expertise is the primary advantage of group over individual problem solving',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.2025 + 0.5625),
    angle: Math.atan2(0.75, 0.45),
  },
};

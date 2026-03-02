import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const systemsEngineering: RosettaConcept = {
  id: 'engr-systems-engineering',
  name: 'Systems Engineering',
  domain: 'engineering',
  description:
    'Systems engineering manages the complexity of large technical systems where components interact. ' +
    'Core principle: a system is more than the sum of its parts — emergent behaviors arise from component interactions. ' +
    'Systems engineering focuses on interfaces, integration, failure modes analysis (FMEA), and lifecycle management. ' +
    'It is essential for aerospace, defense, infrastructure, and complex product development where subsystem ' +
    'optimization can suboptimize the whole.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'engr-requirements-specifications',
      description: 'Systems engineering decomposes top-level requirements into subsystem requirements and manages their integration',
    },
    {
      type: 'cross-reference',
      targetId: 'prob-systems-thinking',
      description: 'Systems engineering is the engineering discipline application of systems thinking',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.8,
    magnitude: Math.sqrt(0.16 + 0.64),
    angle: Math.atan2(0.8, 0.4),
  },
};

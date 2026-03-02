import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const materialInnovation: RosettaConcept = {
  id: 'mfab-material-innovation',
  name: 'Material Innovation & Future Materials',
  domain: 'materials',
  description:
    'Material innovation drives technological progress — from stone tools to silicon chips, new materials enable new capabilities. ' +
    'Current frontiers: graphene (exceptional electrical and mechanical properties), ' +
    'high-entropy alloys (multiple principal elements, novel properties), ' +
    'biomimetic materials (inspired by natural structures like nacre and spider silk), ' +
    'and self-healing materials (autonomously repair damage). ' +
    'Materials informatics uses machine learning and materials databases to accelerate discovery.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mfab-advanced-materials',
      description: 'Material innovation builds on advanced materials science to push beyond current performance limits',
    },
    {
      type: 'dependency',
      targetId: 'mfab-circular-economy',
      description: 'Future material innovation must incorporate circular economy principles at the design stage',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.9,
    magnitude: Math.sqrt(0.09 + 0.81),
    angle: Math.atan2(0.9, 0.3),
  },
};

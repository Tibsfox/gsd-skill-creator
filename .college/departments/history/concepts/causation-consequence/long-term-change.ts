import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const longTermChange: RosettaConcept = {
  id: 'hist-long-term-change',
  name: 'Long-Term Change & Trends',
  domain: 'history',
  description:
    'Some historical changes unfold over centuries — the spread of agriculture, the rise of capitalism, ' +
    'the decline of empires, demographic transitions. These structural, slow-moving changes are often harder ' +
    'to see than dramatic events but exert more durable influence. Recognizing long-term trends requires ' +
    'zooming out from individual events to see patterns across generations and understanding historians\' ' +
    'debates about periodization.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'hist-historical-causation',
      description: 'Long-term trends represent cumulative causation rather than single pivotal causes',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.2025 + 0.49),
    angle: Math.atan2(0.7, 0.45),
  },
};

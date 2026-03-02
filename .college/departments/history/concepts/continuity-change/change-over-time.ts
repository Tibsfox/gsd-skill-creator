import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const changeOverTime: RosettaConcept = {
  id: 'hist-change-over-time',
  name: 'Change Over Time',
  domain: 'history',
  description:
    'Change over time analysis examines how a phenomenon evolved across a historical period. ' +
    'Historians ask: What changed? What stayed the same? How fast was the change? Was it linear or cyclical? ' +
    'Was the change driven by internal dynamics or external pressure? ' +
    'This analysis skill is central to AP-style essay writing and helps students escape the error of ' +
    'treating history as a static "before and after" snapshot.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'hist-periodization',
      description: 'Change-over-time analysis requires a framework of periods to track change across',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.4225 + 0.2025),
    angle: Math.atan2(0.45, 0.65),
  },
};

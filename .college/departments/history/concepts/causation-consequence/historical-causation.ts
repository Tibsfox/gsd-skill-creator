import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const historicalCausation: RosettaConcept = {
  id: 'hist-historical-causation',
  name: 'Historical Causation',
  domain: 'history',
  description:
    'Historical causation examines why events happened. Historians distinguish immediate causes (the triggering event) ' +
    'from underlying causes (long-term structural factors) and contributing causes (factors that made outcomes more likely). ' +
    'Causation in history is always multiple, contested, and interpreted through theory. ' +
    'Debating historical causes builds analytical thinking and challenges overly simple narratives.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'hist-historical-context',
      description: 'Identifying causes requires understanding the context in which those causes operated',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, 0.6),
  },
};

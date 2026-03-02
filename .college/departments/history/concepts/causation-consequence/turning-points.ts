import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const turningPoints: RosettaConcept = {
  id: 'hist-turning-points',
  name: 'Historical Turning Points',
  domain: 'history',
  description:
    'A turning point is a moment when historical momentum shifted decisively in a new direction. ' +
    'Identifying turning points is a key historical skill requiring judgment about which events were truly ' +
    'decisive versus merely dramatic. The Battle of Midway, the invention of the printing press, and the ' +
    'fall of Constantinople are debated as turning points — but historians disagree on which events qualify ' +
    'and why. This debate itself illuminates historical causation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'hist-historical-causation',
      description: 'Turning points are defined by their causal weight — they are causes with disproportionate effects',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.3025 + 0.36),
    angle: Math.atan2(0.6, 0.55),
  },
};

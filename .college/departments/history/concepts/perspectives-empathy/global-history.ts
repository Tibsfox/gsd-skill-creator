import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const globalHistory: RosettaConcept = {
  id: 'hist-global-history',
  name: 'Global & World History Perspectives',
  domain: 'history',
  description:
    'Global history examines cross-cultural interactions, trade networks, disease spread, and shared processes ' +
    'across civilizations. It challenges Eurocentric narratives by centering exchanges — the Silk Road, the ' +
    'Columbian Exchange, Indian Ocean trade — rather than single national stories. ' +
    'Global perspective reveals that most "purely national" developments were deeply shaped by international forces, ' +
    'making it essential for understanding the interconnected modern world.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'hist-comparative-history',
      description: 'Global history extends comparative method to cross-civilizational scales',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.16 + 0.5625),
    angle: Math.atan2(0.75, 0.4),
  },
};

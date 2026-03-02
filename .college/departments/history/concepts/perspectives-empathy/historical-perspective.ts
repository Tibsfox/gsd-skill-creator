import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const historicalPerspective: RosettaConcept = {
  id: 'hist-historical-perspective',
  name: 'Historical Perspective-Taking',
  domain: 'history',
  description:
    'Historical perspective-taking is the disciplined attempt to understand events as participants experienced them, ' +
    'without importing modern knowledge or values. It requires asking: What did people at the time know, believe, ' +
    'and fear? What options did they perceive as available? How did their social position shape their experience? ' +
    'Perspective-taking is not sympathy for all past actors, but the analytical effort to explain rather than condemn.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'hist-historical-context',
      description: 'Perspective-taking requires full immersion in historical context to avoid anachronism',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.3025 + 0.36),
    angle: Math.atan2(0.6, 0.55),
  },
};

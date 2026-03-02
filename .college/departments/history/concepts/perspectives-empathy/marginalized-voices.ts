import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const marginalizedVoices: RosettaConcept = {
  id: 'hist-marginalized-voices',
  name: 'Marginalized Voices in History',
  domain: 'history',
  description:
    'Traditional history centered the experiences of political and military elites — mostly wealthy men. ' +
    'Modern historical practice deliberately recovers the experiences of enslaved people, women, colonized ' +
    'populations, workers, and other marginalized groups. These perspectives often require different sources ' +
    '(oral histories, material culture, indirect evidence) and different interpretive frameworks. ' +
    'Including marginalized voices produces a more accurate, complete, and honest historical picture.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'hist-primary-secondary-sources',
      description: 'Recovering marginalized voices requires identifying and analyzing unconventional primary sources',
    },
    {
      type: 'dependency',
      targetId: 'hist-historical-perspective',
      description: 'Perspective-taking is especially challenging and important when subjects left few written records',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.2025 + 0.49),
    angle: Math.atan2(0.7, 0.45),
  },
};

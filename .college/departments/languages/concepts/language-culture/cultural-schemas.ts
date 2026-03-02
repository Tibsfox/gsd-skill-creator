import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const culturalSchemas: RosettaConcept = {
  id: 'lang-cultural-schemas',
  name: 'Cultural Schemas and World Knowledge',
  domain: 'languages',
  description: 'Language is embedded in cultural knowledge -- fluency requires understanding the schemas native speakers share. ' +
    'Schema theory: mental frameworks organize knowledge and guide comprehension. "She ordered coffee and left a tip" activates a restaurant schema. ' +
    'Cultural schemas vary: what a "university" involves differs between the US, Germany, and Japan. ' +
    'Background knowledge effects: texts about culturally unfamiliar topics are harder to comprehend even with full vocabulary knowledge. ' +
    'Implication: language learning is inseparable from cultural learning. ' +
    'Allusions and references: idioms ("hit a home run"), cultural references ("Waterloo"), proverbs encode culture compactly. ' +
    'Culture shock and reverse culture shock: entering and leaving the L2 cultural environment causes predictable adjustment cycles. ' +
    'Intercultural competence: the ability to interpret and relate to members of other cultures effectively -- goes beyond language ability alone.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'writ-historical-context',
      description: 'Historical and cultural context shapes literary meaning -- the same skill applied to canonical texts applies to cultural schema building',
    },
    {
      type: 'cross-reference',
      targetId: 'psych-social-cognition',
      description: 'Cultural schemas are socially distributed mental models -- social psychology explains how they are acquired and maintained',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.16 + 0.49),
    angle: Math.atan2(0.7, 0.4),
  },
};

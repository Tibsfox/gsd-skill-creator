import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const historicalContext: RosettaConcept = {
  id: 'writ-historical-context',
  name: 'Historical & Cultural Context',
  domain: 'writing',
  description: 'A text is shaped by when and where it was written. ' +
    'Historical context: the events, conditions, and debates of the time. ' +
    '1984 is a product of Stalinist terror and postwar disillusionment -- ' +
    'reading it without context misses half its meaning. ' +
    'Cultural context: the values, assumptions, and prejudices of the culture. ' +
    'Many classics reflect racism, sexism, or colonialism -- contextualizing does not excuse, ' +
    'but helps us understand how these texts functioned in their time. ' +
    'Intertextuality: texts in dialogue with other texts -- understanding allusions requires context. ' +
    'New Historicism: texts and history are mutually constitutive -- ' +
    'texts both reflect and shape the culture that produced them.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'lang-language-culture-link',
      description: 'Language and literature are embedded in cultural context -- reading across cultures requires awareness of both',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.16 + 0.5625),
    angle: Math.atan2(0.75, 0.4),
  },
};

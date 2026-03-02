import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const poetryForms: RosettaConcept = {
  id: 'writ-poetry-forms',
  name: 'Poetry Forms',
  domain: 'writing',
  description: 'Poetic forms are containers that shape what can be said and how. ' +
    'Haiku: 5-7-5 syllable structure, present moment observation, seasonal reference (kigo). ' +
    'Sonnet: 14 lines, iambic pentameter (10 syllables, alternating stress). ' +
    'Shakespearean (ABAB CDCD EFEF GG): three quatrains build an argument, couplet resolves. ' +
    'Petrarchan (octave + sestet): poses a problem, then turns to resolve it. ' +
    'Villanelle: 19 lines, two refrains that return obsessively ("Do not go gentle into that good night"). ' +
    'Free verse: no required meter or rhyme -- but still has rhythm, line breaks, and structure. ' +
    'Form as meaning: a constrained form can create tension or beauty through what the rules demand. ' +
    'The ghazal, the pantoum, the sestina -- exploring forms teaches the range of poetic architecture.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'writ-sound-devices',
      description: 'Formal poetry relies on sound devices -- meter, rhyme, and rhythm are the formal constraints',
    },
    {
      type: 'cross-reference',
      targetId: 'lang-phoneme-inventory',
      description: 'Poetry\'s sound effects depend on phonetics -- the same sounds that distinguish words in language',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.25 + 0.36),
    angle: Math.atan2(0.6, 0.5),
  },
};

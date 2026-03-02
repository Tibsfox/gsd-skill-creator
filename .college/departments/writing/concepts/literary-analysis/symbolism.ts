import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const symbolism: RosettaConcept = {
  id: 'writ-symbolism',
  name: 'Symbolism',
  domain: 'writing',
  description: 'A symbol carries meaning beyond its literal function within the story. ' +
    'Conventional symbols: the green light in The Great Gatsby (hope, the American Dream). ' +
    'Natural symbols: fire, water, darkness carry universal associations. ' +
    'Private symbols: meanings specific to a particular text or author. ' +
    'How to identify symbols: look for objects described with unusual attention, ' +
    'that appear at significant moments, that the narrator dwells on. ' +
    'The danger of over-symbolizing: not everything is a symbol. ' +
    '"Sometimes a cigar is just a cigar" (attributed to Freud). ' +
    'Symbol vs. allegory: symbols have indeterminate meaning; allegory has one-to-one correspondence ' +
    '(Animal Farm\'s animals each represent a specific historical figure).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'writ-thematic-analysis',
      description: 'Symbols carry themes -- finding symbols helps identify what a work is about',
    },
    {
      type: 'cross-reference',
      targetId: 'lang-language-culture-link',
      description: 'Symbols are culturally embedded -- what the color white symbolizes differs across cultures',
    },
  ],
  complexPlanePosition: {
    real: 0.35,
    imaginary: 0.8,
    magnitude: Math.sqrt(0.1225 + 0.64),
    angle: Math.atan2(0.8, 0.35),
  },
};

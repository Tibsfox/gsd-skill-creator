import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const lexicalAcquisition: RosettaConcept = {
  id: 'lang-lexical-acquisition',
  name: 'Lexical Acquisition Strategies',
  domain: 'languages',
  description: 'Vocabulary acquisition is the core challenge of language learning -- most researchers estimate 10,000+ word families for fluency. ' +
    'Spaced repetition: reviewing words at increasing intervals (1 day, 3 days, 1 week, 3 weeks) exploits the spacing effect. ' +
    'The keyword method (mnemonic linking): connect new word to a familiar word via sound and image (Russian "stol" [table] → "stool"). ' +
    'Word frequency lists: the top 2,000 words cover ~95% of most texts -- learn high-frequency words first. ' +
    'Morpheme analysis: knowing roots, prefixes, suffixes lets you decode unfamiliar words (bio- + -logy = study of life). ' +
    'Contextual acquisition: extensive reading in the target language provides incidental vocabulary learning. ' +
    'Depth vs. breadth: knowing a word fully (collocations, register, derivatives) vs. knowing many words shallowly. ' +
    'Active vs. passive vocabulary: recognition vocabulary (can understand) is always larger than production vocabulary (can use).',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'psych-memory-consolidation',
      description: 'Spaced repetition works because memory consolidation during sleep strengthens recently activated vocabulary',
    },
    {
      type: 'cross-reference',
      targetId: 'lang-morphology',
      description: 'Morphological analysis is a key vocabulary strategy -- knowing morphemes accelerates word learning',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.4225 + 0.2025),
    angle: Math.atan2(0.45, 0.65),
  },
};

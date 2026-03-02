import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const collocationsChunks: RosettaConcept = {
  id: 'lang-collocations-chunks',
  name: 'Collocations and Lexical Chunks',
  domain: 'languages',
  description: 'Natural language use is not purely rule-generated -- much of it is stored as memorized chunks. ' +
    'Collocations: words that habitually appear together ("make a decision", NOT "do a decision"; "heavy rain", NOT "strong rain"). ' +
    'Lexical chunks: multi-word units stored and retrieved as wholes ("as a matter of fact", "by the way"). ' +
    'Native speakers rely heavily on chunks for fluency -- production is not word-by-word assembly. ' +
    'The Lexical Approach (Lewis, 1993): language is primarily lexical, not grammatical. ' +
    'Concordance tools: search corpora to find how words are actually used together in authentic texts. ' +
    'Errors from bad collocations sound unnatural even if grammatically correct -- a major source of "foreign accent" in writing. ' +
    'Learning target: not just word meanings but the company a word keeps (its typical collocates).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'lang-lexical-acquisition',
      description: 'Collocation knowledge is a depth dimension of vocabulary acquisition -- knowing how words co-occur, not just meanings',
    },
    {
      type: 'cross-reference',
      targetId: 'writ-voice-development',
      description: 'Voice in writing depends partly on collocation choices -- unusual collocations create distinctive style',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, 0.6),
  },
};

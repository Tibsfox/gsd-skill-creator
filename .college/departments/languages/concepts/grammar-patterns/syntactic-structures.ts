import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const syntacticStructures: RosettaConcept = {
  id: 'lang-syntactic-structures',
  name: 'Syntactic Structures and Phrase Building',
  domain: 'languages',
  description: 'Syntax is the rule system for combining words into phrases and sentences. ' +
    'Phrase structure: every sentence can be broken into nested constituents (NP, VP, PP). ' +
    '"The old man with a cane [slowly] [crossed the street]" -- VP contains adverb + nested VP. ' +
    'Recursion: sentences can embed within sentences infinitely -- "She said that he thought that they knew...". ' +
    'Chomsky\'s generative grammar: a finite set of rules generates an infinite set of sentences. ' +
    'Dependency grammar: words depend on other words (head + dependent relationships) -- useful for NLP. ' +
    'Ambiguity: "I saw the man with the telescope" (who has the telescope?) -- structural ambiguity comes from multiple parse trees. ' +
    'Universal Grammar hypothesis: all human languages share deep structural properties (disputed). ' +
    'Practical application: understanding phrase structure helps predict where to place modifiers in target language.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'lang-word-order-typology',
      description: 'Phrase structure rules encode word order constraints -- syntax explains why word order typology works the way it does',
    },
    {
      type: 'cross-reference',
      targetId: 'code-control-flow',
      description: 'Parsing code and parsing sentences use similar algorithms -- recursive descent parsing mirrors syntactic phrase structure',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.16 + 0.49),
    angle: Math.atan2(0.7, 0.4),
  },
};

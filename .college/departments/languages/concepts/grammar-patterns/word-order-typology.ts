import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const wordOrderTypology: RosettaConcept = {
  id: 'lang-word-order-typology',
  name: 'Word Order Typology',
  domain: 'languages',
  description: 'Languages organize subject, verb, and object in different orders -- these patterns are not arbitrary. ' +
    'SVO (Subject-Verb-Object): English ("The cat ate the fish"), Mandarin, French -- ~45% of languages. ' +
    'SOV (Subject-Object-Verb): Japanese ("The cat fish ate"), Turkish, Hindi -- ~45% of languages. ' +
    'VSO: Arabic, Welsh ("Ate the cat the fish"). ' +
    'Rigid word order (English) vs. flexible order (Russian, Latin) -- inflected languages use case endings to signal roles, so order is freer. ' +
    'Head-first (English: noun phrases put the head noun first, relative clauses follow) vs. head-last (Japanese: modifiers precede head). ' +
    'Universal tendencies: if a language is SOV, it is likely postpositional (e.g., Japanese "Tokyo ni" = "to Tokyo"). ' +
    'Understanding typology explains why some structures feel impossible to calque directly.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'lang-morphology',
      description: 'Case morphology and word order are inversely related -- more morphology often allows freer word order',
    },
    {
      type: 'cross-reference',
      targetId: 'log-propositional-logic',
      description: 'Predicate logic has its own order conventions -- comparing linguistic and formal ordering reveals shared structure',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, 0.6),
  },
};

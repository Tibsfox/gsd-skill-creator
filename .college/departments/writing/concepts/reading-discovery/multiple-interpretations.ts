import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const multipleInterpretations: RosettaConcept = {
  id: 'writ-multiple-interpretations',
  name: 'Multiple Interpretations',
  domain: 'writing',
  description: 'Literary texts are constitutively ambiguous -- they support multiple readings simultaneously. ' +
    'The intentional fallacy (Wimsatt and Beardsley): the author\'s intended meaning is not the final arbiter -- ' +
    'texts mean what they make possible, not only what the author intended. ' +
    'The death of the author (Barthes): once published, the text belongs to readers. ' +
    'Interpretive frameworks generate different readings of the same text: ' +
    'feminist reading of Hamlet sees Ophelia\'s silencing; ' +
    'psychoanalytic reading sees Oedipal dynamics; ' +
    'postcolonial reading sees colonialism\'s shadows in The Tempest. ' +
    'Not all interpretations are equally valid -- they must be supported by textual evidence -- ' +
    'but multiple valid interpretations can coexist.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'writ-textual-evidence',
      description: 'All interpretations must be grounded in textual evidence to be valid',
    },
    {
      type: 'cross-reference',
      targetId: 'log-informal-fallacies',
      description: 'Recognizing that texts support multiple readings guards against the false dichotomy fallacy in literary argument',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.8,
    magnitude: Math.sqrt(0.09 + 0.64),
    angle: Math.atan2(0.8, 0.3),
  },
};

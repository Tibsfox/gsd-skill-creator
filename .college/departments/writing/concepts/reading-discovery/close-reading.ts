import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const closeReading: RosettaConcept = {
  id: 'writ-close-reading',
  name: 'Close Reading',
  domain: 'writing',
  description: 'Reading slowly, carefully, and attentively -- attending to how as much as what. ' +
    'Close reading asks: Why this word and not another? Why this sentence structure? ' +
    'What does the white space do? How does this line break affect the meaning? ' +
    'Annotation practices: underlining striking passages, circling recurring words, ' +
    'writing questions in margins, marking connections between passages. ' +
    'The central insight: literary texts reward rereading. ' +
    'You cannot notice everything on a first read; close reading is iterative. ' +
    'Reader response: your emotional and intellectual reactions are data -- ' +
    'they tell you what the author achieved. ' +
    'The goal is not to decode a hidden message but to notice how meaning is made.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'writ-textual-evidence',
      description: 'Close reading generates the evidence that textual analysis requires',
    },
    {
      type: 'cross-reference',
      targetId: 'lang-listening-comprehension',
      description: 'Close listening in language learning is the audio equivalent of close reading -- the same attentive noticing',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.36 + 0.16),
    angle: Math.atan2(0.4, 0.6),
  },
};

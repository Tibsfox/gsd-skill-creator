import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const wordChoiceConnotation: RosettaConcept = {
  id: 'writ-word-choice-connotation',
  name: 'Word Choice & Connotation',
  domain: 'writing',
  description: 'Denotation is a word\'s dictionary definition; connotation is its emotional and cultural associations. ' +
    '"Home" and "residence" have the same denotation but different connotations. ' +
    '"Slender" and "scrawny" both mean thin -- but one implies elegance, the other implies unpleasantness. ' +
    'Great writers make precise choices: Hemingway uses short, Anglo-Saxon words for immediacy; ' +
    'James uses long, Latinate words for complexity. ' +
    'Connotation is culturally and historically embedded -- words gain and lose associations. ' +
    '"Queer" has been reclaimed; many words have become slurs. ' +
    'Exercise: take any sentence and replace each content word with a synonym. ' +
    'How does the feel of the sentence change even when the meaning stays the same?',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'writ-close-reading',
      description: 'Close reading attends to word choice -- every word was chosen; ask why',
    },
    {
      type: 'cross-reference',
      targetId: 'lang-high-frequency-words',
      description: 'Vocabulary depth in language learning parallels connotation awareness in literary reading',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.36 + 0.2025),
    angle: Math.atan2(0.45, 0.6),
  },
};

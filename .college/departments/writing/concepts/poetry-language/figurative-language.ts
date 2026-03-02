import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const figurativeLanguage: RosettaConcept = {
  id: 'writ-figurative-language',
  name: 'Figurative Language',
  domain: 'writing',
  description: 'Language that creates meaning beyond literal denotation. ' +
    'Simile: explicit comparison using "like" or "as" ("My love is like a red, red rose"). ' +
    'Metaphor: implicit comparison asserting identity ("The world is a stage"). ' +
    'Extended metaphor: a metaphor developed across multiple lines or stanzas. ' +
    'Personification: giving human attributes to non-human things ("The sun smiled down"). ' +
    'Synecdoche: part stands for whole ("All hands on deck" -- hands = sailors). ' +
    'Metonymy: associated thing stands for another ("The crown decided" -- crown = monarch). ' +
    'Irony: saying one thing, meaning another. ' +
    'Good figurative language does not merely decorate -- it illuminates. ' +
    'A fresh metaphor makes the reader see something familiar in a new way. ' +
    'A dead metaphor has been used so often it is invisible ("legs of a table").',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'writ-word-choice-connotation',
      description: 'Figurative language relies on connotation -- metaphors work because of the associations words carry',
    },
    {
      type: 'cross-reference',
      targetId: 'lang-language-culture-link',
      description: 'Metaphors encode cultural worldviews -- Lakoff and Johnson showed metaphors structure how we think',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.16 + 0.49),
    angle: Math.atan2(0.7, 0.4),
  },
};

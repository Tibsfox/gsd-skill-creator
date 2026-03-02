import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const characterDevelopment: RosettaConcept = {
  id: 'writ-character-development',
  name: 'Character Development',
  domain: 'writing',
  description: 'How characters change (or resist change) over a narrative arc. ' +
    'Static characters do not change -- they reveal who they are but do not grow (Inspector Lestrade). ' +
    'Dynamic characters change fundamentally through the story\'s events (Ebenezer Scrooge). ' +
    'Round characters have complexity and contradictions (Hamlet). ' +
    'Flat characters serve a single function (minor characters, sometimes villains). ' +
    'Character motivation must be coherent: readers need to believe why characters do what they do. ' +
    'Showing character through action and dialogue rather than telling through description ' +
    '(dramatize, do not summarize). ' +
    'The character arc: who is the character at the beginning? What forces change them? ' +
    'Who are they at the end?',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'writ-conflict-types',
      description: 'Conflict is the engine of character development -- pressure reveals and changes who people are',
    },
    {
      type: 'cross-reference',
      targetId: 'psych-developmental-stages',
      description: 'Character development in fiction follows psychological development patterns -- Erikson\'s identity stages inform character arcs',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.36 + 0.2025),
    angle: Math.atan2(0.45, 0.6),
  },
};

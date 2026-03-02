import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const interpretiveFrameworks: RosettaConcept = {
  id: 'writ-interpretive-frameworks',
  name: 'Interpretive Frameworks',
  domain: 'writing',
  description: 'Literary theory provides lenses that illuminate different aspects of texts. ' +
    'Feminist criticism: how does the text construct gender? Whose voices are centered? ' +
    'Postcolonial criticism: what are the power relations between colonizers and colonized? ' +
    'Reader-response: meaning is created in the transaction between text and reader. ' +
    'Psychoanalytic: what does the text reveal about unconscious desires and anxieties? ' +
    'Marxist/materialist: what does the text reveal about class, economic power, and labor? ' +
    'Ecocriticism: what is the text\'s relationship to the natural world? ' +
    'No single framework captures everything. ' +
    'Each illuminates and obscures. ' +
    'Literary scholars often use multiple frameworks to triangulate on complex texts.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'writ-multiple-interpretations',
      description: 'Interpretive frameworks are the tools for generating multiple valid readings',
    },
    {
      type: 'cross-reference',
      targetId: 'log-analogical-reasoning',
      description: 'Applying a theoretical framework to a text is analogical reasoning -- seeing structure through a lens',
    },
  ],
  complexPlanePosition: {
    real: 0.25,
    imaginary: 0.9,
    magnitude: Math.sqrt(0.0625 + 0.81),
    angle: Math.atan2(0.9, 0.25),
  },
};

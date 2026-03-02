import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const thematicAnalysis: RosettaConcept = {
  id: 'writ-thematic-analysis',
  name: 'Thematic Analysis',
  domain: 'writing',
  description: 'Theme is the central insight or question a work explores -- not the moral or lesson, ' +
    'but the territory of meaning. ' +
    '"Love conquers all" is a moral; "the nature of obsessive love" is a theme. ' +
    'Themes are not stated but dramatized. ' +
    'Identifying themes: what recurring images, words, or situations appear? ' +
    'What is at stake in the central conflict? What does the ending reveal about the human condition? ' +
    'Great works contain multiple interlocking themes -- ' +
    'King Lear is about power, age, ingratitude, blindness (literal and figurative), and nature. ' +
    'Thesis-driven literary analysis: state your interpretation of a theme, support with evidence, ' +
    'address counter-evidence.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'writ-close-reading',
      description: 'Themes are identified through close reading -- you find recurring patterns through attentive reading',
    },
    {
      type: 'cross-reference',
      targetId: 'data-data-storytelling',
      description: 'Both thematic analysis and data storytelling identify the central insight and structure argument around it',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.85,
    magnitude: Math.sqrt(0.09 + 0.7225),
    angle: Math.atan2(0.85, 0.3),
  },
};

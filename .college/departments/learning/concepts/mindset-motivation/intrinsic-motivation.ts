import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const intrinsicMotivation: RosettaConcept = {
  id: 'learn-intrinsic-motivation',
  name: 'Intrinsic Motivation',
  domain: 'learning',
  description:
    'Intrinsic motivation — doing something for its inherent interest and satisfaction rather than ' +
    'external rewards — produces deeper engagement, persistence, and creativity than extrinsic ' +
    'motivation. Self-Determination Theory (Deci & Ryan) identifies three core psychological needs ' +
    'that fuel intrinsic motivation: autonomy (choice over what and how to learn), competence ' +
    '(experiencing growth and mastery), and relatedness (connection to others in the learning ' +
    'community). The overjustification effect: introducing external rewards for already-intrinsically ' +
    'motivated activities reduces intrinsic interest (paying children to read can undermine the ' +
    'love of reading). Optimal challenge (Csikszentmihalyi\'s flow): tasks slightly beyond current ' +
    'skill produce engagement; too easy → boredom; too hard → anxiety. Classroom structures that ' +
    'support intrinsic motivation: choice in topics and methods, meaningful project goals, ' +
    'formative feedback focused on growth rather than judgment, and cooperative rather than ' +
    'competitive grading.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'learn-growth-mindset',
      description: 'Intrinsic motivation and growth mindset reinforce each other: believing ability grows sustains motivation; motivation drives the practice that develops ability',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.16 + 0.36),
    angle: Math.atan2(0.6, 0.4),
  },
};

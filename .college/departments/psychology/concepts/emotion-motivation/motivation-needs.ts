import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const motivationNeeds: RosettaConcept = {
  id: 'psych-motivation-needs',
  name: 'Motivation and Human Needs',
  domain: 'psychology',
  description: 'Motivation is the force that initiates, directs, and sustains goal-directed behavior. ' +
    'Maslow\'s hierarchy: physiological → safety → belonging → esteem → self-actualization. Not strictly hierarchical but captures need priority under scarcity. ' +
    'Intrinsic motivation: doing something for inherent satisfaction (curiosity, mastery, autonomy). ' +
    'Extrinsic motivation: doing something for external rewards or to avoid punishment. ' +
    'Overjustification effect: adding external rewards to intrinsically motivated behavior can undermine intrinsic motivation. ' +
    'Self-determination theory (Deci & Ryan): three basic psychological needs -- autonomy, competence, and relatedness. Satisfying these supports intrinsic motivation. ' +
    'Flow (Csikszentmihalyi): optimal experience when challenge matches skill -- intrinsically motivating and associated with high performance. ' +
    'Goal-setting theory: specific, challenging goals outperform vague or easy goals. SMART goals. ' +
    'Temporal discounting: future rewards are valued less than immediate rewards -- explains procrastination and self-control challenges.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'psych-basic-emotions',
      description: 'Emotions signal what matters and direct motivation -- you pursue what generates positive affect and avoid what generates negative affect',
    },
    {
      type: 'cross-reference',
      targetId: 'econ-marginal-thinking',
      description: 'Economists model motivation through incentives; psychologists add intrinsic motivation -- both frameworks are needed to understand human behavior',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.3025 + 0.36),
    angle: Math.atan2(0.6, 0.55),
  },
};

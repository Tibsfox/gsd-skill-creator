import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const misinformationTactics: RosettaConcept = {
  id: 'diglit-misinformation-tactics',
  name: 'Misinformation & Disinformation Tactics',
  domain: 'digital-literacy',
  description: 'Misinformation is false information spread without intent to deceive. ' +
    'Disinformation is false information spread with intent to deceive. ' +
    'Common tactics: false context (real image, fake caption), ' +
    'impersonation (fake accounts mimicking real people), ' +
    'emotional manipulation (outrage drives sharing before reflection), ' +
    'bot amplification (coordinated inauthentic accounts making fringe seem mainstream), ' +
    'cherry-picking (citing real data selectively to mislead), ' +
    'false balance (treating fringe views as equivalent to expert consensus). ' +
    'Prebunking: learning about tactics makes you more resistant to them. ' +
    'Inoculation theory: exposure to weakened misinformation arguments builds resistance ' +
    '(like a vaccine against false beliefs).',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'log-informal-fallacies',
      description: 'Many misinformation tactics are informal fallacies deployed at scale through media',
    },
    {
      type: 'cross-reference',
      targetId: 'psych-cognitive-biases',
      description: 'Misinformation tactics exploit cognitive biases -- confirmation bias, availability heuristic, anchoring',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.16 + 0.49),
    angle: Math.atan2(0.7, 0.4),
  },
};

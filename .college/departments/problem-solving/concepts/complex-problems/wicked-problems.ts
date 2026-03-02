import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const wickedProblems: RosettaConcept = {
  id: 'prob-wicked-problems',
  name: 'Wicked Problems',
  domain: 'problem-solving',
  description:
    'Wicked problems (Rittel & Webber) are problems with no definitive formulation, no stopping rule, ' +
    'no test of correctness, and no opportunity to learn by trial-and-error. Every solution changes the problem. ' +
    'Examples: poverty, climate change, healthcare reform, education. Wicked problems require political and ' +
    'ethical judgment, not just technical solutions. Recognizing a problem as wicked prevents false confidence ' +
    'in simplistic solutions.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'prob-systems-thinking',
      description: 'Wicked problems are defined by systemic complexity — they cannot be solved without systems thinking',
    },
  ],
  complexPlanePosition: {
    real: 0.25,
    imaginary: 0.92,
    magnitude: Math.sqrt(0.0625 + 0.8464),
    angle: Math.atan2(0.92, 0.25),
  },
};

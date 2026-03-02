import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const unintendedConsequences: RosettaConcept = {
  id: 'hist-unintended-consequences',
  name: 'Unintended Consequences',
  domain: 'history',
  description:
    'Historical actors rarely produce the outcomes they intend. Unintended consequences arise from complexity, ' +
    'incomplete information, resistance from others, and the unpredictability of human systems. ' +
    'Examples: the Prohibition era spawning organized crime; the printing press enabling both the Reformation ' +
    'and a century of religious wars. Studying unintended consequences develops humility about human agency ' +
    'and caution about overconfident predictions.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'hist-historical-causation',
      description: 'Unintended consequences are a category of causal outcome — effects that no actor specifically sought',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.25 + 0.4225),
    angle: Math.atan2(0.65, 0.5),
  },
};

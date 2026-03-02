import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const trialError: RosettaConcept = {
  id: 'prob-trial-error',
  name: 'Trial and Error',
  domain: 'problem-solving',
  description:
    'Trial and error is the systematic exploration of candidate solutions by trying, evaluating, and revising. ' +
    'It is not random — effective trial-and-error is guided by feedback from each attempt. ' +
    'It is the natural learning strategy and often the only viable approach when analytical methods are unavailable. ' +
    'Key discipline: learning from each failure rather than repeating the same trial hoping for different results.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'prob-problem-definition',
      description: 'Clear success criteria (from problem definition) are needed to know when a trial has succeeded or failed',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};

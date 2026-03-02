import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const failureModes: RosettaConcept = {
  id: 'engr-failure-modes',
  name: 'Failure Modes & Safety',
  domain: 'engineering',
  description:
    'Failure mode and effects analysis (FMEA) systematically identifies how components can fail and what ' +
    'the consequences are. Failure modes include yielding, buckling, fatigue (cyclic loading), fracture, ' +
    'corrosion, and creep (slow deformation under sustained load). ' +
    'The Challenger disaster, I-35W bridge collapse, and Tacoma Narrows bridge failure illustrate how ' +
    'unanalyzed failure modes lead to catastrophic outcomes. ' +
    'Safe design always considers failure, not just normal operation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'engr-material-properties',
      description: 'Failure mode predictions require understanding material behavior at and beyond yield and fracture points',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.25 + 0.49),
    angle: Math.atan2(0.7, 0.5),
  },
};

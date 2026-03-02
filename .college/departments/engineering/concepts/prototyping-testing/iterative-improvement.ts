import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const iterativeImprovement: RosettaConcept = {
  id: 'engr-iterative-improvement',
  name: 'Iterative Improvement',
  domain: 'engineering',
  description:
    'Iterative improvement is the disciplined cycle of test → analyze results → identify root causes → ' +
    'modify design → retest. Root cause analysis tools (fishbone diagrams, 5 Whys, fault tree analysis) ' +
    'identify underlying causes rather than symptoms. ' +
    'Design review processes (peer review, design for manufacturability checks) build in collaborative improvement. ' +
    'The most successful engineering products evolve through many improvement iterations.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'engr-testing-validation',
      description: 'Iterative improvement is driven by testing results — each test cycle provides data for the next iteration',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.25 + 0.49),
    angle: Math.atan2(0.7, 0.5),
  },
};

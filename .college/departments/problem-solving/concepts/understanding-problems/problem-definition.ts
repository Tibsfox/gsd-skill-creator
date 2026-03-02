import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const problemDefinition: RosettaConcept = {
  id: 'prob-problem-definition',
  name: 'Problem Definition',
  domain: 'problem-solving',
  description:
    'Problem definition is identifying what the actual problem is — not the surface symptom, but the root cause. ' +
    '"We need a faster horse" defines the problem as horse speed; "we need to travel faster" opens the solution space. ' +
    'Techniques include the "5 Whys" (repeatedly asking why to find root causes) and problem reframing. ' +
    'A well-defined problem is half-solved: vague problem statements generate vague solutions.',
  panels: new Map(),
  relationships: [],
  complexPlanePosition: {
    real: 0.85,
    imaginary: 0.15,
    magnitude: Math.sqrt(0.7225 + 0.0225),
    angle: Math.atan2(0.15, 0.85),
  },
};

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const newtonsLaws: RosettaConcept = {
  id: 'phys-newtons-laws',
  name: "Newton's Laws of Motion",
  domain: 'physics',
  description:
    "Newton's three laws form the foundation of classical mechanics. First law: objects continue in their " +
    'state of motion unless acted on by a net force (inertia). Second law: net force equals mass times ' +
    'acceleration (F=ma). Third law: every action has an equal and opposite reaction. Together they explain ' +
    'and predict the motion of objects under any combination of forces.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'phys-motion-kinematics',
      description: 'Newton\'s laws explain the accelerations that kinematics measures and describes',
    },
    {
      type: 'dependency',
      targetId: 'phys-work-power',
      description: 'Work and energy concepts build directly on the force-displacement relationship from Newton\'s second law',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.5625 + 0.09),
    angle: Math.atan2(0.3, 0.75),
  },
};

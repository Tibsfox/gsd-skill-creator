import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const motionKinematics: RosettaConcept = {
  id: 'phys-motion-kinematics',
  name: 'Motion & Kinematics',
  domain: 'physics',
  description:
    'Kinematics describes motion without asking what causes it. Position, displacement, velocity (rate of ' +
    'change of position), and acceleration (rate of change of velocity) are the core quantities. ' +
    'Kinematic equations relate these for constant acceleration, enabling prediction of projectile range, ' +
    'stopping distance, and free-fall time.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'phys-newtons-laws',
      description: 'Newton\'s laws explain what causes the accelerations that kinematics describes',
    },
    {
      type: 'cross-reference',
      targetId: 'math-functions',
      description: 'Position, velocity, and acceleration are functions of time -- graphical analysis uses function concepts',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};

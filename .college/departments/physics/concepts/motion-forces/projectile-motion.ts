import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const projectileMotion: RosettaConcept = {
  id: 'phys-projectile-motion',
  name: 'Projectile Motion',
  domain: 'physics',
  description:
    'Projectile motion is two-dimensional motion under gravity alone. The key insight is that horizontal ' +
    'and vertical motions are independent: horizontal velocity is constant (no air resistance), while ' +
    'vertical motion follows free-fall kinematics. This decomposition allows calculation of range, maximum ' +
    'height, and time of flight for any launch angle and speed.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'phys-motion-kinematics',
      description: 'Projectile motion applies 1D kinematics independently to horizontal and vertical components',
    },
    {
      type: 'dependency',
      targetId: 'phys-newtons-laws',
      description: 'Gravity provides the net force that causes the vertical acceleration of a projectile',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};

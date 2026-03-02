import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const locomotorSkills: RosettaConcept = {
  id: 'pe-locomotor-skills',
  name: 'Locomotor Skills',
  domain: 'physical-education',
  description:
    'Locomotor skills are movements that transport the body through space: walking, running, ' +
    'jumping, hopping, skipping, galloping, sliding, and leaping. These are foundational movement ' +
    'patterns that underpin sports and physical activity. Running mechanics include foot strike ' +
    '(heel vs. midfoot vs. forefoot), arm swing (forward-back, not cross-body), cadence, and ' +
    'posture (slight forward lean from ankles). Jumping requires takeoff mechanics (hip-knee-ankle ' +
    'triple extension), flight phase control, and safe landing (absorb force by flexing joints). ' +
    'Skipping (step-hop alternating feet) and galloping (leading foot stays in front) are asymmetric ' +
    'patterns building toward sport-specific actions. Mastery is assessed through smoothness, ' +
    'consistency, and efficiency — not just whether the child can perform the action but whether ' +
    'the mature pattern is present. Unmastered locomotor skills limit athletic potential and ' +
    'predict lower physical activity participation in adolescence.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'pe-fundamental-movement',
      description: 'Locomotor skills are a primary category within fundamental movement skill development',
    },
    {
      type: 'analogy',
      targetId: 'pe-balance-coordination',
      description: 'Both locomotor skills and balance-coordination are foundational movement capacities built in early physical education',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};

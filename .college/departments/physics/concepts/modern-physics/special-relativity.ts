import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const specialRelativity: RosettaConcept = {
  id: 'phys-special-relativity',
  name: 'Special Relativity',
  domain: 'physics',
  description:
    'Einstein\'s special theory of relativity rests on two postulates: the laws of physics are the same ' +
    'in all inertial frames, and the speed of light is constant for all observers. Consequences include ' +
    'time dilation (moving clocks run slower), length contraction, and the mass-energy equivalence (E=mc²). ' +
    'These effects are measurable in particle accelerators and GPS satellite corrections.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'phys-motion-kinematics',
      description: 'Special relativity reframes classical kinematics for objects moving near the speed of light',
    },
    {
      type: 'dependency',
      targetId: 'phys-quantum-basics',
      description: 'Both special relativity and quantum mechanics are pillars of modern physics beyond classical mechanics',
    },
  ],
  complexPlanePosition: {
    real: 0.25,
    imaginary: 0.9,
    magnitude: Math.sqrt(0.0625 + 0.81),
    angle: Math.atan2(0.9, 0.25),
  },
};

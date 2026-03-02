import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const balanceCoordination: RosettaConcept = {
  id: 'pe-balance-coordination',
  name: 'Balance & Coordination',
  domain: 'physical-education',
  description:
    'Balance is the ability to maintain the body\'s center of gravity over its base of support, ' +
    'while coordination is the smooth integration of movement sequences from multiple body parts. ' +
    'Static balance (holding a position) depends on vestibular input (inner ear), proprioception ' +
    '(joint position sensors), and vision. Dynamic balance (maintaining control through movement) ' +
    'is more demanding and sports-specific. Coordination develops through practice of multi-limb ' +
    'patterns: bilateral coordination (both sides together, then alternating), hand-eye coordination ' +
    '(catching, throwing, striking), and foot-eye coordination (dribbling, kicking). Single-leg ' +
    'balance drills, balance boards, and stability training improve proprioceptive awareness and ' +
    'reduce injury risk. Coordination challenges such as juggling, agility ladders, and reaction ' +
    'drills build neural efficiency in movement programming. Both skills decline with age and are ' +
    'predictors of fall risk in older adults — making early development crucial.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'pe-fundamental-movement',
      description: 'Balance and coordination are prerequisites for refining fundamental movement skills',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};

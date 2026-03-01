import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * The Powerhouse Concept
 *
 * The foundational anatomical concept in Pilates -- a cylinder of
 * muscular support around the torso that all movement radiates from.
 * Joseph Pilates called this the "powerhouse" or "girdle of strength."
 */
export const powerhouseConcept: RosettaConcept = {
  id: 'mb-pilates-powerhouse',
  name: 'The Powerhouse',
  domain: 'mind-body',
  description:
    'The Powerhouse is the foundational anatomical concept in Pilates -- a cylinder of muscular ' +
    'support around the torso from which all movement radiates. Joseph Pilates called this the ' +
    '"girdle of strength." It encompasses: ' +
    'Deep abdominals (transversus abdominis) -- the deepest abdominal layer that wraps around ' +
    'the torso like a corset. Pelvic floor muscles -- the base of the cylinder, supporting the ' +
    'organs and providing upward lift. Spinal stabilizers (multifidus) -- small muscles along ' +
    'the spine that provide segmental stability. Diaphragm -- the ceiling of the core cylinder, ' +
    'coordinating breath with movement. Internal and external obliques -- the side walls that ' +
    'resist rotation and provide lateral support. Rectus abdominis -- the "six-pack" muscles, ' +
    'which flex the spine forward. ' +
    'This is a broader definition than the popular notion of "abs." The Powerhouse is not a ' +
    'single muscle but an integrated system of muscles that creates a stable foundation for ' +
    'all limb movement. Every Pilates exercise begins with Powerhouse activation. ' +
    'Developed by Joseph Pilates (Germany/United States, early 20th century) as part of his ' +
    'method originally called "Contrology." Per the Pilates Method Alliance (PMA) standards.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-pilates-six-principles',
      description: 'Centering -- the third of the six Pilates principles -- directs all movement to originate from the Powerhouse',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-yoga-mountain-tadasana',
      description: 'Both the Powerhouse concept and Tadasana teach awareness of core engagement and neutral alignment',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-pilates-neutral-spine',
      description: 'Powerhouse activation supports neutral spine alignment -- the stabilizers maintain natural curves under load',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.36 + 0.16),
    angle: Math.atan2(0.4, 0.6),
  },
};

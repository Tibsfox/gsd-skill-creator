import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * The Teaser
 *
 * The signature advanced Pilates mat exercise -- a V-sit balance
 * combining core strength, spinal articulation, and total body
 * coordination.
 */
export const teaser: RosettaConcept = {
  id: 'mb-pilates-teaser',
  name: 'The Teaser',
  domain: 'mind-body',
  description:
    'The Teaser is the signature advanced Pilates mat exercise -- a V-sit balance that demands ' +
    'core strength, spinal articulation, and total body coordination. Lie flat on the back, ' +
    'arms overhead, legs extended at approximately 45 degrees from the floor. In one smooth ' +
    'movement, roll up through the spine while the legs remain at 45 degrees, reaching the ' +
    'arms toward the toes to create a V shape balanced on the sit bones. Hold the balance, ' +
    'then roll back down with control, one vertebra at a time. ' +
    'The Teaser integrates every Pilates principle: concentration (intense focus required), ' +
    'control (no momentum), centering (pure Powerhouse work), precision (exact V angle), ' +
    'breath (exhale to rise, inhale at top, exhale to descend), and flow (continuous movement ' +
    'through the full arc). ' +
    'Beginner modification: start with bent knees (feet on the floor) and roll up to a seated ' +
    'position; progress to one leg extended; finally both legs extended. Use a strap behind ' +
    'the thighs for assistance. The Teaser is an aspirational exercise -- building toward it ' +
    'is the practice. ' +
    'Developed by Joseph Pilates as part of the classical mat sequence.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-pilates-powerhouse',
      description: 'The Teaser is the ultimate Powerhouse challenge -- core strength alone must lift and hold the body in a V balance',
    },
    {
      type: 'dependency',
      targetId: 'mb-pilates-roll-up',
      description: 'The Roll-Up teaches the spinal articulation that the Teaser demands while adding the challenge of simultaneous leg control',
    },
    {
      type: 'dependency',
      targetId: 'mb-pilates-six-principles',
      description: 'The Teaser integrates all six Pilates principles in a single exercise -- it is the embodiment of the method',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.25 + 0.36),
    angle: Math.atan2(0.6, 0.5),
  },
};

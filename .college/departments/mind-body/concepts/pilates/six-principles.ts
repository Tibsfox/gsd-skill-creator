import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * The Six Principles of Pilates
 *
 * Concentration, Control, Centering, Precision, Breath, and Flow --
 * the six governing principles that define how every Pilates exercise
 * is performed.
 */
export const sixPrinciples: RosettaConcept = {
  id: 'mb-pilates-six-principles',
  name: 'The Six Principles of Pilates',
  domain: 'mind-body',
  description:
    'The six principles define how every Pilates exercise is performed, distinguishing Pilates ' +
    'from generic exercise. Per classical Pilates instruction and PMA (Pilates Method Alliance) ' +
    'educational standards: ' +
    '1. Concentration -- every movement requires focused mental attention. You are not going ' +
    'through motions; you are directing each movement consciously. The mind drives the body. ' +
    '2. Control -- every movement is performed with muscular control. No throwing limbs or ' +
    'using momentum. Joseph Pilates originally named his method "Contrology" because control ' +
    'was the defining characteristic. ' +
    '3. Centering -- all movement radiates from the center of the body, the Powerhouse. Before ' +
    'an arm moves, the core engages. Before a leg extends, the pelvis stabilizes. ' +
    '4. Precision -- each movement has a specific form. Close enough is not good enough. ' +
    'Quality over quantity -- ten precise repetitions surpass fifty sloppy ones. ' +
    '5. Breath -- specific breathing patterns coordinate with movement. Pilates uses lateral ' +
    'thoracic breathing (ribs expand sideways, not belly pushing up) to maintain abdominal ' +
    'engagement while allowing full lung expansion. Exhale on exertion. ' +
    '6. Flow -- movements connect smoothly from one to the next. The practice should have a ' +
    'continuous, rhythmic quality, not a series of disconnected exercises. ' +
    'Developed by Joseph Pilates (Germany/United States, early 20th century). Originally ' +
    'called "Contrology" -- the art of controlled movement.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-pilates-powerhouse',
      description: 'The Centering principle specifically refers to the Powerhouse as the origin point for all movement',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-yoga-breath-movement-linking',
      description: 'The Pilates Breath principle (exhale on exertion) is a specific application of the broader breath-movement linking concept',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-meditation-concentration',
      description: 'The Concentration principle transforms physical exercise into a mind-body practice through focused attention',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.25 + 0.25),
    angle: Math.atan2(0.5, 0.5),
  },
};

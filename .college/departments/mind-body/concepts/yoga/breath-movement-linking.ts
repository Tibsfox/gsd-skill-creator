import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Breath-Movement Linking (The Vinyasa Principle)
 *
 * The fundamental principle connecting breath to movement:
 * inhale opens the body, exhale folds or contracts. This is
 * the organizing pattern of all flow-based yoga.
 *
 * Sanskrit: Vinyasa -- vi = in a special way, nyasa = to place.
 */
export const breathMovementLinking: RosettaConcept = {
  id: 'mb-yoga-breath-movement-linking',
  name: 'Breath-Movement Linking (Vinyasa Principle)',
  domain: 'mind-body',
  description:
    'The vinyasa principle is the foundational concept linking breath to movement in yoga: ' +
    'inhale opens the body (backbends, arms rising, chest expanding), exhale folds or contracts ' +
    'the body (forward bends, lowering, compression). This pattern appears across all ' +
    'vinyasa-based yoga styles and is the organizing logic of sequences like the Sun Salutation. ' +
    'Vinyasa literally means "to place in a special way" -- each movement is deliberately ' +
    'placed on a specific phase of the breath. The breath initiates the movement, not the ' +
    'other way around. If the breath becomes ragged or strained, you have exceeded your capacity ' +
    'and should simplify the movement. ' +
    'The breath-movement link transforms physical exercise into a moving meditation. When ' +
    'breath and movement synchronize, the mind focuses on the coordination rather than ' +
    'wandering, producing a state of absorbed attention similar to seated meditation. ' +
    'This principle extends beyond yoga: tai chi coordinates movement with breath, Pilates ' +
    'uses exhale on exertion, and martial arts time strikes to sharp exhalations. ' +
    'Safety modifications: if synchronizing breath with movement causes anxiety or ' +
    'lightheadedness, breathe naturally and add the coordination gradually over time. ' +
    'From the Vedic/Yoga Tradition. Sanskrit: Vinyasa -- vi = in a special way, nyasa = to place.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-breath-diaphragmatic',
      description: 'Diaphragmatic breathing is the foundation that vinyasa builds upon -- without breath awareness, breath-movement linking cannot develop',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-taichi-continuous-flow',
      description: 'Tai chi coordinates breath with slow, continuous movement using the same breath-movement linking principle',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-pilates-six-principles',
      description: 'The Pilates principle of Breath (exhale on exertion) is a specific application of breath-movement linking',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.25 + 0.25),
    angle: Math.atan2(0.5, 0.5),
  },
};

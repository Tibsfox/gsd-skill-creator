import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Bow Stance (Gong Bu)
 *
 * The forward-weighted stance used in most striking techniques. Trains
 * forward power generation, hip alignment, and weight distribution.
 * Fundamental to most martial arts traditions.
 *
 * Cultural attribution: Chinese martial arts tradition.
 * Original term: 弓步 (gōng bù) -- "bow step/stance"
 */
export const bowStance: RosettaConcept = {
  id: 'mb-ma-bow-stance',
  name: 'Bow Stance',
  domain: 'mind-body',
  description:
    'The bow stance, 弓步 (gōng bù, "bow step"), is the primary forward stance in Chinese martial arts, ' +
    'named because the front leg bends like a drawn bow. It appears across traditions: zenkutsu-dachi ' +
    'in Karate, ap seogi in Taekwondo, and in virtually every system that delivers forward strikes. ' +
    'Solo practice alignment cues: From a natural standing position, step one foot forward wider than ' +
    'shoulder width. The front knee bends until it is directly over the ankle -- never allowing the knee ' +
    'to travel past the toes, which protects the knee joint. The back leg remains straight but not locked, ' +
    'with the back foot flat on the ground and turned outward approximately 45 degrees. Both feet maintain ' +
    'full contact with the floor. The torso stays upright over the hips. Weight distribution is approximately ' +
    '60% on the front leg and 40% on the back leg. ' +
    'What it trains: Forward power generation (the stance provides a stable base for delivering force ' +
    'in the forward direction), hip alignment (keeping both hips facing forward while the feet are ' +
    'staggered develops hip flexibility and awareness), and the ability to shift weight forward and ' +
    'backward smoothly -- essential for transitioning between techniques. ' +
    'Progression: Practice stepping into the stance from natural standing, holding for 5 breaths, ' +
    'then stepping back. Alternate leading legs. As strength builds, practice transitioning between ' +
    'bow stance, horse stance, and cat stance in flowing combinations. ' +
    'Training note: This is a solo body mechanics exercise for developing structural alignment and leg strength.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-ma-horse-stance',
      description: 'Horse stance trains lateral stability while bow stance trains forward power -- they complement each other',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-ma-basic-strikes',
      description: 'Most forward striking techniques are delivered from bow stance, which provides the stable base for power generation',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-ma-simple-form',
      description: 'The simple form links bow stance with strikes and blocks in choreographed sequences',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.1,
    magnitude: Math.sqrt(0.49 + 0.01),
    angle: Math.atan2(0.1, 0.7),
  },
};

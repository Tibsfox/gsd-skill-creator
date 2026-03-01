import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Cat Stance (Xu Bu)
 *
 * The light-footed, back-weighted stance used for quick transitions and
 * defensive readiness. Trains balance, weight shifting, and the ability
 * to move without telegraphing intention.
 *
 * Cultural attribution: Chinese martial arts tradition.
 * Original term: 虛步 (xū bù) -- "empty step/stance"
 */
export const catStance: RosettaConcept = {
  id: 'mb-ma-cat-stance',
  name: 'Cat Stance',
  domain: 'mind-body',
  description:
    'The cat stance, 虛步 (xū bù, "empty step"), places nearly all weight on the back leg ' +
    'with the front foot touching the ground lightly -- like a cat testing the surface before committing. ' +
    'It appears as neko-ashi-dachi in Karate, beom seogi in Taekwondo, and is prominent in internal arts ' +
    'like Tai Chi and Bagua Zhang where continuous weight shifting is fundamental. ' +
    'Solo practice alignment cues: Stand with feet shoulder-width apart. Shift all weight onto the back ' +
    'leg, bending the back knee slightly. The front foot comes forward with only the toe or ball of the ' +
    'foot touching the ground -- it bears almost no weight (approximately 90% back leg, 10% front). ' +
    'The back knee remains aligned over the back foot, not collapsing inward. The torso stays upright, ' +
    'centered over the back hip. The front knee is slightly bent and relaxed. ' +
    'What it trains: Balance (supporting the entire body on one leg while maintaining controlled posture), ' +
    'weight shifting awareness (learning to feel precisely where the body weight is distributed), and ' +
    'the quality of "emptiness" in the front leg -- the ability to move the front foot freely because ' +
    'it carries no weight. This emptiness is the key to quick transitions: a foot that bears no weight ' +
    'can step, kick, or retreat without first having to shift weight off it. ' +
    'Progression: Begin by holding cat stance for 10 seconds each side. Build to 30 seconds, then one minute. ' +
    'Practice transitioning smoothly between cat stance and bow stance -- this develops the ability to shift ' +
    'from defensive readiness (cat) to forward commitment (bow) fluidly. ' +
    'Training note: This is a solo balance and body mechanics exercise for developing weight awareness.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-ma-horse-stance',
      description: 'Cat stance is the lightest stance (one-leg weighted) while horse stance is the most grounded (both legs equally weighted)',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-tc-tai-chi-principles',
      description: 'The "empty" and "full" leg concept in cat stance directly embodies the tai chi principle of substantial and insubstantial',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-ma-basic-blocks',
      description: 'Cat stance is commonly paired with blocking techniques because the back-weighted position allows quick defensive responses',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.36 + 0.04),
    angle: Math.atan2(0.2, 0.6),
  },
};

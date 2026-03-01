import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Basic Strikes -- Solo Body Mechanics
 *
 * Fundamental striking techniques taught as body mechanics and kinetic chain
 * exercises. Emphasis on structural alignment and power generation from the
 * ground through the hips -- physics lessons expressed through movement.
 *
 * Cultural attribution: Cross-tradition fundamentals found in Chinese,
 * Japanese, and Korean martial arts.
 *
 * SAFETY: Solo practice only. These are body mechanics exercises,
 * not combat techniques.
 */
export const basicStrikes: RosettaConcept = {
  id: 'mb-ma-basic-strikes',
  name: 'Basic Strikes',
  domain: 'mind-body',
  description:
    'Basic strikes are body mechanics exercises that teach the kinetic chain -- how force travels ' +
    'from the ground through the legs, through hip rotation, through the torso, and out through the arm. ' +
    'Understanding this chain transforms a strike from an arm movement into a whole-body coordination exercise. ' +
    'Straight Punch (solo drill): From a ready position with fists held at the waist and elbows drawn back, ' +
    'extend one fist forward while retracting the other. The punching fist rotates from palm-up at the waist ' +
    'to palm-down at full extension. The critical insight is that power comes from the ground: the back foot ' +
    'pushes into the floor, the legs drive the hip forward, the hip rotation accelerates the shoulder, and the ' +
    'arm extends along the path the body has already created. The arm is the last link in the chain, not the ' +
    'source of power. Practice slowly, feeling each link of the chain engage in sequence. ' +
    'Palm Strike (solo drill): Similar mechanics to the punch but delivered with an open palm, fingers pulled ' +
    'back, striking surface is the heel of the palm. The palm strike is prominent in Tai Chi, Wing Chun, ' +
    'and many internal styles. It requires less wrist conditioning than a closed-fist strike and teaches ' +
    'the same kinetic chain principles. ' +
    'Knife Hand (solo drill): An open-hand technique with fingers together, thumb tucked against the palm, ' +
    'striking with the outer edge of the hand. Known as shuto in Japanese arts, sudo in Korean arts. ' +
    'It develops wrist strength, hand alignment, and the ability to deliver force through a narrow contact surface. ' +
    'All strikes emphasize structure over power: correct alignment allows the skeletal structure to support ' +
    'the force, reducing strain on muscles and joints. Practice in the air (shadow training) to develop form ' +
    'before any consideration of impact. ' +
    'Training note: These are solo body mechanics exercises for understanding kinetic chain principles.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-ma-bow-stance',
      description: 'Strikes are typically delivered from bow stance, which provides the forward-facing stable base for power generation',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-ma-simple-form',
      description: 'The simple form sequences strikes with stances and blocks into choreographed patterns',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-breath-martial',
      description: 'Martial breath (kiai/kihap) coordinates sharp exhalation with strike execution for core engagement and timing',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.1,
    magnitude: Math.sqrt(0.64 + 0.01),
    angle: Math.atan2(0.1, 0.8),
  },
};

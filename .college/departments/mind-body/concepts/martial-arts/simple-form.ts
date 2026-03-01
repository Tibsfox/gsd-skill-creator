import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * A Simple Form -- Solo Choreographed Sequence
 *
 * A beginner-friendly form (kata/taolu) that links stances, strikes, and
 * blocks into a flowing solo practice pattern. 10 named movements designed
 * for safe individual practice without a partner.
 *
 * Cultural attribution: Synthesized from Chinese martial arts (taolu) and
 * Japanese martial arts (kata) traditions.
 *
 * SAFETY: This is a solo practice movement sequence. It is NOT a combat
 * routine and does not include any partner-based applications.
 */
export const simpleForm: RosettaConcept = {
  id: 'mb-ma-simple-form',
  name: 'A Simple Form',
  domain: 'mind-body',
  description:
    'A form (套路, tàolù in Chinese; kata in Japanese; poomsae in Korean) is a choreographed sequence ' +
    'of movements practiced solo. Forms are the textbooks of martial arts -- each movement encodes body ' +
    'mechanics, coordination patterns, and aesthetic principles into a repeatable practice. This simple ' +
    'form of 10 named movements links the stances, strikes, and blocks into a flowing solo sequence. ' +
    'The Solo Practice Form -- 10 movements: ' +
    '1. Opening Salute: Stand at attention, feet together, hands at sides. Bring fists to waist. ' +
    'Bow from the waist. This marks the beginning of intentional practice. ' +
    '2. Horse Stance Ready: Step left into horse stance. Both fists at waist. Hold for three breaths, ' +
    'feeling the connection to the ground. ' +
    '3. Left Bow Stance Punch: Turn left into bow stance. Execute a straight punch with the left fist ' +
    'while the right retracts to the waist. Feel the hip rotation drive the punch forward. ' +
    '4. Middle Block Turn: Pivot 180 degrees to face the opposite direction. Land in right bow stance. ' +
    'Execute a middle block with the right forearm. ' +
    '5. Right Bow Stance Punch: From the middle block position, extend a right straight punch. ' +
    'The block flows into the strike without pause. ' +
    '6. Cat Stance Low Block: Shift weight back into cat stance (left foot forward, light). ' +
    'Execute a low block with the left arm, sweeping downward. ' +
    '7. Front Stepping Palm Strike: Step forward with the left foot into bow stance. Deliver a palm ' +
    'strike with the left hand, fingers pulled back, heel of palm forward. ' +
    '8. Horse Stance Double Block: Step into horse stance facing the side. Execute simultaneous ' +
    'high block (left arm) and low block (right arm), covering both zones. ' +
    '9. Bow Stance Knife Hand: Turn right into bow stance. Execute a knife hand strike with the ' +
    'right hand, fingers together, striking edge of hand forward. ' +
    '10. Closing Salute: Return to natural standing. Bring feet together. Fists to waist. Bow. ' +
    'This marks the end of practice. ' +
    'Practice guidance: Learn each movement individually before linking them. Start at slow speed, ' +
    'focusing on correct alignment and breathing. Each movement should flow into the next without ' +
    'stopping. Breathe out on each strike and block, in during transitions. The form should take ' +
    'approximately 60-90 seconds when performed at moderate pace. Repeat 3-5 times per session. ' +
    'This is a solo practice movement sequence for developing coordination, memory, and flowing movement.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-ma-horse-stance',
      description: 'The form uses horse stance as its base ready position and lateral stance',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-ma-basic-strikes',
      description: 'The form integrates straight punch, palm strike, and knife hand into a flowing sequence',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-tc-beijing-24-form',
      description: 'The simple martial arts form and the Beijing 24 tai chi form both use choreographed solo sequences as primary training methods',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.36 + 0.16),
    angle: Math.atan2(0.4, 0.6),
  },
};

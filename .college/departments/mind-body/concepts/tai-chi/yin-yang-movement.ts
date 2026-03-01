import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Yin-Yang in Movement
 *
 * The principle of complementary opposites expressed through every tai chi
 * movement: forward/backward, rising/sinking, expanding/gathering, substantial/
 * insubstantial. The philosophical core made physical.
 *
 * Cultural attribution: Taoist philosophy as expressed through Chinese
 * martial arts tradition.
 */
export const yinYangMovement: RosettaConcept = {
  id: 'mb-tc-yin-yang-movement',
  name: 'Yin-Yang in Movement',
  domain: 'mind-body',
  description:
    'The yin-yang principle (阴阳) is not merely a philosophical concept in tai chi -- it is the ' +
    'organizing principle of every movement. Tai chi makes the abstract idea of complementary opposites ' +
    'tangible through the body. ' +
    'Forward and Backward: Every step forward contains the possibility of stepping back. When the weight ' +
    'moves forward into bow stance, the back leg maintains connection to the ground, ready to receive ' +
    'the weight back. There is no fully committed forward without retained awareness of return. This is ' +
    'not hesitation -- it is completeness. ' +
    'Rising and Sinking: As the arms rise, the body sinks slightly through the legs. As the body rises ' +
    'from a low posture, the intention sinks deeper into the earth. In the Commencing Form, the arms ' +
    'float upward while the knees soften and the weight settles -- rising above, sinking below, ' +
    'simultaneously. ' +
    'Expanding and Gathering: The arms open wide, but the center draws inward. The body gathers inward, ' +
    'but the awareness expands outward. In "White Crane Spreads Its Wings," one arm rises and opens while ' +
    'the other descends and draws close -- expansion and gathering in a single posture. ' +
    'Substantial and Insubstantial: At any moment, one leg carries the majority of weight (substantial, ' +
    'yang) while the other is light and free to move (insubstantial, yin). The tai chi form is a ' +
    'continuous alternation between these states -- weight flows from one leg to the other in an unbroken ' +
    'wave. A leg that is fully substantial can become fully insubstantial and vice versa, but the ' +
    'transition is gradual, never sudden. ' +
    'Inhaling and Exhaling: The breath itself follows yin-yang patterning. Inhalation (yin -- receiving, ' +
    'gathering) accompanies movements that draw inward or rise. Exhalation (yang -- expressing, releasing) ' +
    'accompanies movements that extend outward or settle. The breath is never forced -- it follows the ' +
    'movement naturally, and the movement follows the breath. ' +
    'The deeper teaching: Yin and yang are not opposing forces but complementary aspects of a single ' +
    'reality. Neither can exist without the other. A movement that is purely yang (all force, no ' +
    'sensitivity) is brittle. A movement that is purely yin (all yielding, no structure) is empty. ' +
    'The art is in finding the dynamic balance point where both are present simultaneously -- and ' +
    'this is what the slow practice of the tai chi form trains the body to discover.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-tc-tai-chi-principles',
      description: 'Yin-yang interplay is one of the five core tai chi principles, permeating all aspects of practice',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-ma-hard-soft-distinction',
      description: 'The hard/soft distinction in martial arts is an expression of yang/yin applied to training methodology',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-tc-beijing-24-form',
      description: 'Every movement in the Beijing 24 Form embodies yin-yang complementarity in weight, direction, and breath',
    },
  ],
  complexPlanePosition: {
    real: -0.4,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.16 + 0.36),
    angle: Math.atan2(0.6, -0.4),
  },
};

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Stretching Protocols -- Static, Dynamic, and PNF
 *
 * Three distinct stretching approaches, each with a specific use case
 * and timing relative to practice. Evidence-based guidelines for when
 * to use each type and critical safety guidance.
 *
 * Evidence basis: ACSM (American College of Sports Medicine) guidelines
 * recommend static stretching after activity and dynamic stretching before.
 * PNF (proprioceptive neuromuscular facilitation) research demonstrates
 * superior gains in range of motion compared to static stretching alone.
 *
 * @module departments/mind-body/concepts/relaxation/stretching-protocols
 */

export const stretchingProtocols: RosettaConcept = {
  id: 'mb-relax-stretching',
  name: 'Stretching Protocols',
  domain: 'mind-body',
  description:
    'Three distinct stretching approaches serve different purposes in mind-body practice. ' +
    'Static stretching involves holding a position at the end range of motion for 15-60 ' +
    'seconds, allowing muscles to gradually lengthen -- best performed after practice when ' +
    'muscles are warm, as static stretching before activity can temporarily reduce force ' +
    'production. Dynamic stretching moves the body through its range of motion with ' +
    'controlled, rhythmic movements (leg swings, arm circles, walking lunges) -- ideal ' +
    'before practice to increase blood flow, raise tissue temperature, and prepare joints ' +
    'for movement. PNF (proprioceptive neuromuscular facilitation) stretching uses a ' +
    'contract-relax cycle: stretch to end range, contract the target muscle isometrically ' +
    'for 5-10 seconds against resistance, relax, then move deeper into the stretch. PNF ' +
    'research demonstrates superior range-of-motion gains compared to static stretching ' +
    'alone, making it valuable for targeted flexibility work. Critical safety guidance: ' +
    'never bounce (ballistic stretching increases injury risk), breathe steadily throughout, ' +
    'stretch to the point of mild tension but never sharp pain, and warm up before any ' +
    'stretching. This summary follows ACSM (American College of Sports Medicine) guidelines ' +
    'and is intended as practical knowledge -- individuals with specific flexibility ' +
    'limitations should consult qualified movement professionals.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-relax-myofascial',
      description:
        'Myofascial release before stretching can improve range of motion by reducing tissue restrictions',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-yoga-poses',
      description:
        'Many yoga postures are sustained stretches -- understanding static stretching principles deepens yoga practice',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-martial-arts-stances',
      description:
        'Martial arts require significant hip, hamstring, and shoulder flexibility -- dynamic stretching prepares for training',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-tai-chi-principles',
      description:
        'Tai chi movements incorporate gentle dynamic stretching through their continuous, flowing range of motion',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: -0.2,
    magnitude: Math.sqrt(0.36 + 0.04),
    angle: Math.atan2(-0.2, 0.6),
  },
};

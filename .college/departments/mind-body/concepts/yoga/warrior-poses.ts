import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Warrior Poses / Virabhadrasana I & II
 *
 * The warrior series builds leg strength, hip flexibility, and
 * focused attention. Named after the mythological warrior Virabhadra.
 *
 * Sanskrit: Virabhadrasana (warrior pose) --
 * vira = hero/warrior, bhadra = auspicious/blessed, asana = pose.
 */
export const warriorPoses: RosettaConcept = {
  id: 'mb-yoga-warrior-poses',
  name: 'Warrior Poses (Virabhadrasana I & II)',
  domain: 'mind-body',
  description:
    'Virabhadrasana (warrior pose) is a family of standing poses named after the mythological ' +
    'warrior Virabhadra. ' +
    'Warrior I (Virabhadrasana I): From standing, step one foot back 3-4 feet. Front knee ' +
    'bends to approximately 90 degrees (knee over ankle, not past toes). Back foot turns out ' +
    '45 degrees, back leg straight. Hips face forward (square to front). Arms reach overhead, ' +
    'palms face each other or touch. Hold 5 breaths each side. Teaches leg strength, hip ' +
    'flexibility, and upward extension. ' +
    'Warrior II (Virabhadrasana II): From Warrior I, open hips and torso to the side. Arms ' +
    'extend horizontally -- front arm forward, back arm back. Gaze over front fingertips ' +
    '(drishti). Front knee still over ankle; back leg strong and straight. Hold 5 breaths ' +
    'each side. Teaches hip opening, leg endurance, and focused gaze. ' +
    'Safety modifications: shorter stance for knee sensitivity; hands on hips to reduce ' +
    'shoulder strain; higher stance (less knee bend) for building strength gradually. ' +
    'Common mistakes: front knee collapsing inward, leaning the torso forward over the front ' +
    'leg, or letting the back foot lift. ' +
    'From the Vedic/Yoga Tradition. Sanskrit: Virabhadrasana -- ' +
    'vira = hero, bhadra = blessed.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'mb-yoga-tree-vrksasana',
      description: 'Both warrior poses and tree pose build single-leg stability and focused attention through drishti (gaze point)',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-pilates-powerhouse',
      description: 'Core engagement (the Pilates Powerhouse) supports the torso in Warrior poses, preventing collapse under load',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};

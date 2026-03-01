import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Hard and Soft Styles in Martial Arts
 *
 * The fundamental classification of martial arts into hard (external force,
 * direct power) and soft (redirection, yielding, using the opponent's force)
 * traditions. Most complete systems incorporate both elements.
 *
 * Cultural attribution: Classification system used across Chinese, Japanese,
 * and Korean martial traditions.
 */
export const hardSoftDistinction: RosettaConcept = {
  id: 'mb-ma-hard-soft-distinction',
  name: 'Hard and Soft Styles',
  domain: 'mind-body',
  description:
    'Martial arts traditions are often classified along a hard-soft spectrum. ' +
    '"Hard" styles (剛, gāng) emphasize direct force, linear power, and muscular strength. ' +
    'Examples include Shaolin Kung Fu, Karate (particularly Shotokan), and Taekwondo. These systems ' +
    'train practitioners to generate maximum force through structural alignment, speed, and conditioning. ' +
    'A hard-style block meets force with force; a hard-style strike delivers power in a straight line. ' +
    '"Soft" styles (柔, róu) emphasize redirection, yielding, and using incoming force against itself. ' +
    'Examples include Tai Chi (太極拳), Aikido, and Bagua Zhang (八卦掌). Rather than meeting force ' +
    'with opposing force, soft-style practitioners learn to receive, redirect, and return energy. ' +
    'A soft-style response to a push is not to push back but to turn, allowing the attacker\'s momentum ' +
    'to carry them past their point of balance. ' +
    'The distinction is a spectrum, not a binary. Most mature martial arts systems incorporate both ' +
    'elements: Goju-Ryu Karate (剛柔流, literally "hard-soft school") explicitly trains both qualities. ' +
    'Wing Chun is considered a "bridge" art, combining soft redirection principles with direct striking. ' +
    'The principle extends beyond combat into body mechanics: hard approaches build bone density and ' +
    'muscular strength through impact and resistance training, while soft approaches develop proprioception, ' +
    'joint mobility, and the ability to remain relaxed under pressure. ' +
    'Solo practice insight: Practicing stances and forms slowly (soft quality) and then with power (hard quality) ' +
    'develops both aspects within a single training session.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-ma-internal-external',
      description: 'The hard/soft distinction overlaps with but differs from the internal/external classification',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-tc-yin-yang-movement',
      description: 'The hard/soft duality directly mirrors the yin-yang principle at the heart of tai chi',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-ma-style-overview',
      description: 'Individual styles can be placed along the hard-soft spectrum to understand their character',
    },
  ],
  complexPlanePosition: {
    real: -0.2,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.04 + 0.25),
    angle: Math.atan2(0.5, -0.2),
  },
};

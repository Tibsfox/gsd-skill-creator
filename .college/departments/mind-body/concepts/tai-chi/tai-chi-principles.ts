import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Tai Chi Principles
 *
 * The five core principles that define tai chi practice: relaxation (song),
 * rootedness (zhan), central equilibrium (zhong ding), continuous flow,
 * and yin-yang interplay. Each principle is defined with its Chinese term
 * and practical application.
 *
 * Cultural attribution: Chinese martial arts and Taoist tradition.
 * 太極拳 (Taiji Quan) -- "Supreme Ultimate Fist"
 */
export const taiChiPrinciples: RosettaConcept = {
  id: 'mb-tc-tai-chi-principles',
  name: 'Tai Chi Principles',
  domain: 'mind-body',
  description:
    'Tai Chi (太極拳, Taiji Quan -- "Supreme Ultimate Fist") is built on five interlocking principles ' +
    'that distinguish it from other movement practices. These principles operate simultaneously in every ' +
    'moment of practice. ' +
    'Song (松, Relaxation): Not limpness or collapse, but a quality of released tension where the body ' +
    'is engaged but not tight. Imagine the difference between a stiff, rigid arm and one that is alive, ' +
    'responsive, and ready to move in any direction. Song is the latter -- relaxed readiness. In practice, ' +
    'song means continuously releasing unnecessary muscular tension while maintaining structural integrity. ' +
    'The shoulders drop, the jaw softens, the breath deepens, but the posture remains upright and organized. ' +
    'Zhan (站, Rootedness): The feeling of connection to the ground through the feet. A rooted stance is ' +
    'stable not because of muscular rigidity but because weight drops naturally through the skeletal ' +
    'structure into the earth. Root develops through standing practice (Zhan Zhuang) and the slow weight ' +
    'shifts of the tai chi form. ' +
    'Zhong Ding (中定, Central Equilibrium): Maintaining balance through the central axis of the body -- ' +
    'an imaginary vertical line running from the crown of the head through the torso to the point between ' +
    'the feet. Every tai chi movement preserves this central equilibrium: when stepping forward, the axis ' +
    'does not lean; when turning, it rotates but remains vertical. ' +
    'Continuous Flow (连绵不断): No stopping, no pausing. One movement flows into the next like water in a ' +
    'stream. There are no discrete "positions" to hit -- only continuous, unbroken movement. The transitions ' +
    'between movements are as important as the movements themselves. ' +
    'Yin-Yang Interplay (阴阳): Every movement contains both yielding and expressing. Every weight shift ' +
    'moves between substantial (weighted, yang) and insubstantial (empty, yin). The arms open and close, ' +
    'the body rises and sinks, weight shifts forward and backward -- always in complementary pairs. ' +
    'Note: Martial arts skill requires in-person instruction with a qualified teacher. ' +
    'These principles guide solo practice and study.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-tc-zhan-zhuang',
      description: 'Zhan Zhuang standing meditation is the foundational practice for developing the tai chi principles of song, root, and central equilibrium',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-ma-internal-external',
      description: 'Tai chi is the most widely practiced internal art, training mind and intention first before expressing through movement',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-tc-yin-yang-movement',
      description: 'The yin-yang principle is explored in depth as complementary opposites expressed through every tai chi movement',
    },
  ],
  complexPlanePosition: {
    real: -0.2,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.04 + 0.36),
    angle: Math.atan2(0.6, -0.2),
  },
};

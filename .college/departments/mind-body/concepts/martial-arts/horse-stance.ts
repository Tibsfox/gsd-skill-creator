import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Horse Stance (Ma Bu)
 *
 * The foundational wide stance of Chinese martial arts. Trains leg strength,
 * root/stability, and mental endurance through sustained isometric hold.
 * One of the most universal training positions across martial traditions.
 *
 * Cultural attribution: Chinese martial arts tradition.
 * Original term: 馬步 (mǎ bù) -- "horse step/stance"
 */
export const horseStance: RosettaConcept = {
  id: 'mb-ma-horse-stance',
  name: 'Horse Stance',
  domain: 'mind-body',
  description:
    'The horse stance, 馬步 (mǎ bù, "horse step"), is the most fundamental training position ' +
    'in Chinese martial arts and one of the most universal stances across global traditions. ' +
    'It appears in Karate (kiba-dachi), Taekwondo (juchum seogi), and virtually every kung fu system. ' +
    'Solo practice alignment cues: Stand with feet approximately double shoulder-width apart. ' +
    'Toes point forward or turn slightly outward (no more than 15 degrees). Sink the hips downward ' +
    'as if sitting in an invisible chair, working toward thighs parallel to the ground over time. ' +
    'Keep the back upright -- do not lean forward. The tailbone drops straight down, maintaining the ' +
    'natural curve of the lumbar spine. Hands form fists held at the waist with elbows drawn back, ' +
    'or extend forward at shoulder height for additional challenge. ' +
    'What it trains: Leg strength (quadriceps, adductors, and gluteal muscles work isometrically), ' +
    'root and stability (the wide base and low center of gravity develop the feeling of being ' +
    '"rooted" to the ground), and mental endurance (maintaining the stance through discomfort ' +
    'builds the discipline to continue when practice becomes difficult). ' +
    'Progression: Begin holding for 30 seconds. Build gradually to 2 minutes, then 5 minutes. ' +
    'Traditional training builds to 20+ minutes, but significant benefit comes from consistent ' +
    'practice at any duration. When the legs shake, breathe deeply and maintain alignment -- ' +
    'the shaking indicates the muscles are working at their current capacity. ' +
    'Training note: This is a solo body mechanics exercise for developing leg strength and stability.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-ma-bow-stance',
      description: 'Horse stance and bow stance are the two primary stances -- horse for lateral stability, bow for forward power',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-tc-zhan-zhuang',
      description: 'Horse stance and Zhan Zhuang share the principle of building strength and awareness through sustained static holds',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-breath-diaphragmatic',
      description: 'Deep diaphragmatic breathing during horse stance training develops the martial breath connection',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.1,
    magnitude: Math.sqrt(0.49 + 0.01),
    angle: Math.atan2(0.1, 0.7),
  },
};

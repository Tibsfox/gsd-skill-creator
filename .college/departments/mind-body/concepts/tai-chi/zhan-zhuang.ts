import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Zhan Zhuang -- Standing Meditation
 *
 * "Standing like a tree" -- the foundational qigong practice of holding
 * a standing posture for extended periods. Builds leg strength, proprioception,
 * and the ability to maintain relaxation under effort.
 *
 * Cultural attribution: Chinese martial arts and qigong tradition.
 * Original term: 站桩 (Zhan Zhuang) -- "standing post/stake"
 */
export const zhanZhuang: RosettaConcept = {
  id: 'mb-tc-zhan-zhuang',
  name: 'Zhan Zhuang Standing Meditation',
  domain: 'mind-body',
  description:
    'Zhan Zhuang (站桩, "standing post" or "standing like a tree") is the foundational qigong practice ' +
    'shared across all internal martial arts: Tai Chi, Bagua Zhang, and Xing Yi Quan. It is the simplest ' +
    'and most demanding practice in the internal arts tradition -- simply stand still, in a specific posture, ' +
    'for an extended period. ' +
    'Solo practice instruction: Stand with feet shoulder-width apart, toes pointing forward. Allow the ' +
    'knees to soften -- not deeply bent, just unlocked. The pelvis drops slightly, as if beginning to sit ' +
    'but stopping almost immediately. The spine remains upright, crown of the head reaching gently upward ' +
    'as if suspended from above by a thread. Raise the arms to approximately chest height, elbows below ' +
    'the wrists, as if hugging a large tree trunk or holding a beach ball against the chest. The shoulders ' +
    'drop away from the ears. The fingers relax with small spaces between them. The jaw softens. The eyes ' +
    'can be closed or gaze softly forward. Breathe naturally through the nose -- do not force or control ' +
    'the breath. ' +
    'What happens during practice: In the first minutes, the mind generates a stream of objections -- arms ' +
    'ache, legs tremble, shoulders climb toward the ears, the urge to fidget becomes intense. This is the ' +
    'practice: noticing these sensations without reacting, releasing the tension that causes them, and ' +
    'continuing to stand. The shaking and burning in the legs and shoulders are the muscles working at their ' +
    'current capacity. Over weeks of practice, the shaking diminishes as strength builds. What remains is a ' +
    'quality of settled stability -- alert but calm, strong but relaxed. ' +
    'Duration progression: Start with 2 minutes. This is harder than it sounds. Build gradually to 5 minutes, ' +
    'then 10, then 20 or more. Traditional practitioners stand for 30-60 minutes, but significant benefit ' +
    'comes from consistent daily practice at any duration. ' +
    'What it trains: Leg strength (quadriceps and postural muscles work isometrically), proprioception ' +
    '(awareness of the body in space without visual reference), the ability to maintain relaxation (song) ' +
    'under sustained effort, and attentional stability -- the mind becomes still when the body becomes still. ' +
    'This is a solo standing meditation practice.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-tc-tai-chi-principles',
      description: 'Zhan Zhuang develops the foundational tai chi principles of song (relaxation), root, and central equilibrium through direct experience',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-ma-horse-stance',
      description: 'Zhan Zhuang and horse stance share the principle of building strength through sustained static holds, though with different postures and intentions',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-meditation-mindfulness',
      description: 'Zhan Zhuang is standing meditation -- it develops the same attentional qualities as seated mindfulness but through a physically demanding posture',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.25 + 0.09),
    angle: Math.atan2(0.3, 0.5),
  },
};

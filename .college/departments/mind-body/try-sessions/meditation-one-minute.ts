/**
 * One Minute, One Breath -- the meditation entry point.
 *
 * The simplest possible meditation. One minute. One breath focus.
 * No posture rules, no mantras, no spiritual framing. Just sit
 * and notice breathing. The wandering IS the practice.
 *
 * @module departments/mind-body/try-sessions/meditation-one-minute
 */

import type { TrySessionDefinition, TryStep } from '../../../college/try-session-runner.js';

const steps: TryStep[] = [
  {
    instruction:
      'Sit anywhere comfortable -- a chair, a cushion, the floor, the edge of your bed. ' +
      'It does not matter where. Rest your hands wherever they naturally fall. If you ' +
      'are comfortable closing your eyes, close them. Otherwise, let your gaze rest ' +
      'softly on a spot a few feet in front of you.',
    expectedOutcome: 'You are sitting in a stable, comfortable position.',
    hint: 'There is no special posture required. If you are comfortable and still, you are ready.',
    conceptsExplored: ['mb-med-vipassana'],
  },
  {
    instruction:
      'Set a timer for one minute. You can use a phone, a watch, or just estimate. ' +
      'Now bring your attention to the tip of your nose. Notice the air coming in -- ' +
      'it feels slightly cool. Notice the air going out -- it feels slightly warm. ' +
      'That is all you need to focus on. Cool air in. Warm air out.',
    expectedOutcome: 'You noticed the sensation of air at your nostrils.',
    hint: 'You do not need to change your breathing. Just notice it exactly as it is.',
    conceptsExplored: ['mb-med-vipassana', 'mb-breath-diaphragmatic'],
  },
  {
    instruction:
      'Your mind will wander. It might take five seconds. It might take ten. You ' +
      'will suddenly realize you are thinking about lunch, or a conversation, or ' +
      'what you need to do later. This is completely normal. This is not failure. ' +
      'When you notice your mind has wandered, gently return your attention to ' +
      'the breath at your nostrils. Cool in. Warm out.',
    expectedOutcome: 'You noticed your mind wandering and brought your attention back to the breath.',
    hint:
      'The moment you notice you wandered IS the practice. That noticing is mindfulness. ' +
      'You did not fail -- you succeeded.',
    conceptsExplored: ['mb-med-vipassana', 'mb-med-samatha'],
  },
  {
    instruction:
      'When the timer sounds, take one more natural breath. Then open your eyes ' +
      'if they were closed. Notice how you feel. You just meditated. It does not ' +
      'matter if your mind wandered twenty times in that one minute -- every single ' +
      'return to the breath was a repetition, like a bicep curl for your attention.',
    expectedOutcome: 'You completed one minute of breath-focused meditation.',
    hint:
      'If it felt hard, that is normal. If it felt easy, that is also normal. ' +
      'There is no wrong experience.',
    conceptsExplored: ['mb-med-vipassana'],
  },
];

export const meditationOneMinute: TrySessionDefinition = {
  id: 'mb-try-meditation-one-minute',
  title: 'One Minute, One Breath',
  description:
    'The simplest possible meditation. Sit for one minute and focus on the sensation ' +
    'of breath at your nostrils -- cool air in, warm air out. When your mind wanders ' +
    '(it will), gently return. The wandering is not failure. The returning is the practice.',
  estimatedMinutes: 1,
  prerequisites: [],
  steps,
};

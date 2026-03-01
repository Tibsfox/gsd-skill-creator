/**
 * Commencement -- the tai chi entry point.
 *
 * The opening movement of virtually every tai chi form. Arms rise and fall
 * with the breath. Yin and yang in miniature: rising/falling, opening/closing,
 * inhaling/exhaling. Three repetitions. One minute.
 *
 * @module departments/mind-body/try-sessions/tai-chi-commencement
 */

import type { TrySessionDefinition, TryStep } from '../../../college/try-session-runner.js';

const steps: TryStep[] = [
  {
    instruction:
      'Stand naturally with your feet shoulder-width apart. Let your arms hang at your ' +
      'sides. Relax your shoulders. Soften your knees just slightly -- not bending, just ' +
      'not locked. Take one easy breath to settle.',
    expectedOutcome: 'You are standing in a relaxed, natural position with soft knees.',
    hint:
      'Think of standing the way you would if you were waiting for a friend -- relaxed, ' +
      'balanced, not rigid. That is the starting position.',
    conceptsExplored: ['mb-tc-principles', 'mb-tc-zhan-zhuang'],
  },
  {
    instruction:
      'Breathe in slowly through your nose. As you inhale, raise both arms in front ' +
      'of you to shoulder height, palms facing down. Move slowly -- the arms float up as ' +
      'if they are resting on the surface of water. The inhale and the arm raise should ' +
      'finish at the same time.',
    expectedOutcome: 'Your arms are at shoulder height with palms down, synchronized with your inhale.',
    hint:
      'There is no correct speed. Match the arms to your breath, not the other way around. ' +
      'If your breath is short, the arms move faster. If your breath is long, they move slower.',
    conceptsExplored: ['mb-tc-principles', 'mb-tc-yin-yang', 'mb-breath-diaphragmatic'],
  },
  {
    instruction:
      'Breathe out slowly through your mouth. As you exhale, lower both arms back to ' +
      'your sides while softening your knees a little deeper. The arms sink as the breath ' +
      'leaves, like slowly deflating. When your arms reach your sides, your knees are ' +
      'slightly more bent than when you started.',
    expectedOutcome: 'Your arms lowered in sync with your exhale, knees softened.',
    hint:
      'The knee bend is gentle -- an inch or two at most. You should feel grounded, ' +
      'not like you are doing a squat.',
    conceptsExplored: ['mb-tc-principles', 'mb-tc-yin-yang', 'mb-breath-diaphragmatic'],
  },
  {
    instruction:
      'Repeat this two more times. Breathe in, arms float up to shoulder height. ' +
      'Breathe out, arms sink down, knees soften. Three repetitions total. Move as ' +
      'slowly as your breath allows. Each time, see if you can make the movement ' +
      'slightly smoother.',
    expectedOutcome: 'You completed three repetitions of the Commencement movement.',
    hint:
      'If one repetition felt rushed, slow down the next one. Tai chi is sometimes called ' +
      '"meditation in motion" -- the slowness is the point.',
    conceptsExplored: ['mb-tc-principles', 'mb-tc-beijing-24', 'mb-tc-yin-yang'],
  },
  {
    instruction:
      'After the third repetition, stand still for a moment. Notice your feet on the ' +
      'ground. Notice your breathing. You just performed the opening movement of the ' +
      'Beijing 24 Form -- the most widely practiced tai chi form in the world. The ' +
      'rising and falling of your arms contained the yin-yang principle in miniature: ' +
      'up and down, open and close, in and out.',
    expectedOutcome: 'You completed Commencement and noticed the rising/falling pattern.',
    hint:
      'If this single movement felt interesting or calming, tai chi may be your discipline. ' +
      'Every tai chi form is just this principle -- rising and falling -- expressed in ' +
      'increasingly beautiful patterns.',
    conceptsExplored: ['mb-tc-principles', 'mb-tc-yin-yang', 'mb-tc-beijing-24'],
  },
];

export const taiChiCommencement: TrySessionDefinition = {
  id: 'mb-try-tai-chi-commencement',
  title: 'Commencement',
  description:
    'The opening movement of virtually every tai chi form. Stand naturally, breathe in ' +
    'while raising arms to shoulder height, breathe out while lowering arms and softening ' +
    'knees. Three times. One minute. The yin-yang principle in miniature.',
  estimatedMinutes: 1,
  prerequisites: [],
  steps,
};

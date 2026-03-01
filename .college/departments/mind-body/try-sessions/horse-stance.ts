/**
 * Horse Stance, Three Breaths -- the martial arts entry point.
 *
 * The oldest and most fundamental training exercise in Chinese martial arts.
 * Requires nothing but gravity and willpower. If your legs are shaking,
 * you are doing it right.
 *
 * @module departments/mind-body/try-sessions/horse-stance
 */

import type { TrySessionDefinition, TryStep } from '../../../college/try-session-runner.js';

const steps: TryStep[] = [
  {
    instruction:
      'Stand with your feet wider than shoulder width -- about one and a half times ' +
      'the width of your shoulders. Point your toes straight forward. Stand up straight ' +
      'with your arms at your sides. Feel the floor under both feet evenly.',
    expectedOutcome: 'You are standing in a wide stance with toes pointing forward.',
    hint:
      'If you are not sure about the width, take a comfortable step out to each side ' +
      'from a normal standing position. That is close enough.',
    conceptsExplored: ['mb-ma-horse-stance'],
  },
  {
    instruction:
      'Bend your knees and sink your hips downward, as if you are sitting on an invisible ' +
      'horse. Go as low as your body allows today -- your thighs do not need to be parallel ' +
      'to the ground. Even a slight bend counts. Keep your back straight and your weight ' +
      'centered between both feet. Do not let your knees cave inward -- they should track ' +
      'over your toes.',
    expectedOutcome: 'You are in a bent-knee wide stance with your back straight.',
    hint:
      'If your knees feel uncomfortable, do not go as low. The goal is to feel your thigh ' +
      'muscles (quadriceps) working, not to feel pain in your joints. Any amount of bend is valid.',
    conceptsExplored: ['mb-ma-horse-stance', 'mb-ma-martial-virtues'],
  },
  {
    instruction:
      'Make fists with both hands and bring them to your hips, knuckles facing down, ' +
      'elbows pulled back. This is the traditional ready position in many Chinese martial ' +
      'arts systems. Your fists are chambered -- stored energy waiting to be released. ' +
      'Now hold this position and take three slow breaths.',
    expectedOutcome: 'You are holding horse stance with fists at your hips for three breaths.',
    hint:
      'Your legs may start shaking. This is completely normal and actually means you are ' +
      'working the right muscles. Breathe through it. Three breaths is all you need.',
    conceptsExplored: ['mb-ma-horse-stance', 'mb-breath-diaphragmatic', 'mb-ma-martial-virtues'],
  },
  {
    instruction:
      'After three breaths, straighten your legs and stand up. Let your fists relax. ' +
      'Shake out your legs gently if they feel tired. Notice what you feel. You just ' +
      'practiced the most fundamental training exercise in Chinese martial arts -- the ' +
      'same stance that Shaolin monks, Wing Chun practitioners, and karate students ' +
      'all train from day one.',
    expectedOutcome: 'You completed horse stance and noticed the physical sensation.',
    hint:
      'If your legs are burning, that is the exercise working. If you felt nothing, try ' +
      'going a little lower next time. Both experiences are completely valid for a first attempt.',
    conceptsExplored: ['mb-ma-horse-stance', 'mb-ma-history-philosophy'],
  },
];

export const horseStance: TrySessionDefinition = {
  id: 'mb-try-horse-stance',
  title: 'Horse Stance, Three Breaths',
  description:
    'The oldest and most fundamental training exercise in Chinese martial arts. Stand wide, ' +
    'bend knees, fists at hips, hold for three breaths. Requires nothing but gravity and ' +
    'willpower. If your legs are shaking, you are doing it right.',
  estimatedMinutes: 2,
  prerequisites: [],
  steps,
};

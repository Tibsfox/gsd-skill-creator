/**
 * The 3-Minute Reset -- the relaxation entry point.
 *
 * A complete nervous system reset: tense everything, release everything,
 * then breathe with extended exhales to trigger the parasympathetic
 * response. Works anywhere, anytime, takes less time than checking
 * social media.
 *
 * @module departments/mind-body/try-sessions/three-minute-reset
 */

import type { TrySessionDefinition, TryStep } from '../../../college/try-session-runner.js';

const steps: TryStep[] = [
  {
    instruction:
      'Find any position -- lying down, sitting, or standing. This works in all three. ' +
      'Close your eyes if you are comfortable doing so. Take one normal breath to begin.',
    expectedOutcome: 'You are in a comfortable position and ready to begin.',
    hint:
      'Lying down is ideal but not required. This technique was designed to work ' +
      'in an office chair, on a bus, or anywhere you happen to be.',
    conceptsExplored: ['mb-relax-pmr', 'mb-relax-nervous-system'],
  },
  {
    instruction:
      'Tense everything in your body at once. Make fists. Scrunch your face. Squeeze ' +
      'your legs together. Curl your toes. Tighten your belly. Clench your jaw. Hold ' +
      'all of this tension for 5 seconds. One... two... three... four... five.',
    expectedOutcome: 'You held full-body tension for approximately 5 seconds.',
    hint:
      'You do not need to tense at maximum effort. About 70-80% of your maximum is ' +
      'enough. The point is the contrast between tension and release.',
    conceptsExplored: ['mb-relax-pmr'],
  },
  {
    instruction:
      'Release everything at once. Let every muscle go limp simultaneously. Feel the ' +
      'wave of relaxation that follows the release. Notice the contrast between tension ' +
      'and relief. Stay here for a few seconds and just feel.',
    expectedOutcome: 'You released all tension and noticed the wave of relaxation.',
    hint:
      'The relaxation you feel after releasing is your parasympathetic nervous system ' +
      'activating. This is the mechanism behind progressive muscle relaxation -- tension ' +
      'followed by release creates deeper relaxation than relaxation alone.',
    conceptsExplored: ['mb-relax-pmr', 'mb-relax-nervous-system'],
  },
  {
    instruction:
      'Repeat the tense-and-release cycle two more times. Tense everything for 5 seconds, ' +
      'then release completely. Three rounds total. Each time, notice whether the release ' +
      'feels deeper.',
    expectedOutcome: 'You completed three rounds of tense-and-release.',
    hint:
      'Most people find the third release feels noticeably deeper than the first. ' +
      'The body learns the pattern quickly.',
    conceptsExplored: ['mb-relax-pmr'],
  },
  {
    instruction:
      'Now take 10 slow breaths. Breathe in through your nose for a count of 4. Breathe ' +
      'out through your mouth for a count of 8. The exhale is deliberately twice as long ' +
      'as the inhale. This extended exhale directly activates your parasympathetic nervous ' +
      'system -- the branch responsible for rest, digestion, and recovery.',
    expectedOutcome: 'You completed 10 breaths with a 4-count inhale and 8-count exhale.',
    hint:
      'If an 8-count exhale feels too long, try 4-in, 6-out. The key is that the exhale ' +
      'is longer than the inhale, not the exact counts.',
    conceptsExplored: ['mb-relax-nervous-system', 'mb-breath-diaphragmatic'],
  },
  {
    instruction:
      'Open your eyes. Move your fingers and toes. Take one natural breath. You just ' +
      'completed a full nervous system reset. This technique works because the tense-release ' +
      'cycles discharge stored physical tension, and the extended exhales shift your nervous ' +
      'system from sympathetic (fight or flight) to parasympathetic (rest and recover).',
    expectedOutcome: 'You completed the reset and are re-oriented to your surroundings.',
    hint:
      'You can use this technique before a meeting, after a stressful event, before sleep, ' +
      'or anytime you need to reset. Three minutes. No equipment. No special space.',
    conceptsExplored: ['mb-relax-nervous-system', 'mb-relax-pmr'],
  },
];

export const threeMinuteReset: TrySessionDefinition = {
  id: 'mb-try-three-minute-reset',
  title: 'The 3-Minute Reset',
  description:
    'A complete nervous system reset. Three rounds of tense-everything-then-release, ' +
    'followed by 10 breaths with extended exhales. Works anywhere, anytime, in any ' +
    'position. Takes less time than checking social media.',
  estimatedMinutes: 3,
  prerequisites: [],
  steps,
};

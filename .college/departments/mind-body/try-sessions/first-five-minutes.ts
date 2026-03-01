/**
 * Your First Five Minutes -- the mind-body entry point.
 *
 * The critical first-contact Try Session for the Mind-Body department.
 * No philosophy, no jargon, no pressure. Just breathe and notice.
 * Completable in under 2 minutes. Zero assumed knowledge.
 *
 * @module departments/mind-body/try-sessions/first-five-minutes
 */

import type { TrySessionDefinition, TryStep } from '../../../college/try-session-runner.js';

const steps: TryStep[] = [
  {
    instruction:
      'Find a comfortable position. You can sit in a chair, sit on the floor, or lie ' +
      'down -- whatever feels natural. If you are comfortable closing your eyes, close ' +
      'them. If not, let your gaze rest softly on a spot in front of you.',
    expectedOutcome: 'You are settled in a position where you can stay still for a few minutes.',
    hint: 'There is no wrong position. If you are comfortable, you are doing it right.',
    conceptsExplored: ['mb-breath-diaphragmatic'],
  },
  {
    instruction:
      'Breathe in through your nose for 4 counts. Let your belly expand as the air ' +
      'comes in -- not your chest. Imagine filling a balloon in your belly. ' +
      'One... two... three... four.',
    expectedOutcome: 'You felt your belly rise as you inhaled slowly through your nose.',
    hint: 'Put a hand on your belly if it helps. You should feel it push outward.',
    conceptsExplored: ['mb-breath-diaphragmatic'],
  },
  {
    instruction:
      'Now breathe out through your mouth for 6 counts. Let the air flow out slowly ' +
      'and steadily, like you are blowing on hot soup. One... two... three... four... ' +
      'five... six.',
    expectedOutcome: 'You exhaled slowly and felt your belly lower.',
    hint: 'The exhale is longer than the inhale on purpose. This activates your body\'s calming response.',
    conceptsExplored: ['mb-breath-diaphragmatic'],
  },
  {
    instruction:
      'Continue this pattern for 5 rounds. Breathe in through your nose for 4 counts. ' +
      'Out through your mouth for 6 counts. If you lose count, just start the round ' +
      'over. There is no way to fail at this.',
    expectedOutcome: 'You completed approximately 5 rounds of 4-in, 6-out breathing.',
    hint: 'If your mind wanders, that is completely normal. Just come back to the counting.',
    conceptsExplored: ['mb-breath-diaphragmatic', 'mb-breath-counting'],
  },
  {
    instruction:
      'Take one more natural breath. Then notice: how do you feel right now compared ' +
      'to when you started? You do not need to feel anything specific. Just notice ' +
      'whatever is there. That is it. You just practiced.',
    expectedOutcome: 'You paused to notice your current state. Any observation is valid.',
    hint: 'Some people feel calmer. Some feel the same. Some notice their heart rate. All of that is fine.',
    conceptsExplored: ['mb-med-vipassana'],
  },
];

export const firstFiveMinutes: TrySessionDefinition = {
  id: 'mb-try-first-five-minutes',
  title: 'Your First Five Minutes',
  description:
    'Your very first mind-body practice. No experience needed, no equipment needed, ' +
    'no philosophy required. Just a few minutes of breathing and noticing. This is ' +
    'the starting point for everything else in this department.',
  estimatedMinutes: 5,
  prerequisites: [],
  steps,
};

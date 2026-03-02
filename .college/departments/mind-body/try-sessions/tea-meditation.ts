/**
 * The Tea Meditation -- the philosophy entry point.
 *
 * Make a cup of tea with complete presence. The most ordinary act in the
 * world, done with full attention. That is the entire teaching of Zen,
 * compressed into a cup of tea.
 *
 * @module departments/mind-body/try-sessions/tea-meditation
 */

import type { TrySessionDefinition, TryStep } from '../../../college/try-session-runner.js';

const steps: TryStep[] = [
  {
    instruction:
      'Choose a beverage to make -- tea, coffee, hot water, or anything that requires ' +
      'a few minutes of preparation. Put your phone down. Turn off or step away from ' +
      'any screens. For the next few minutes, you will do only this one thing.',
    expectedOutcome: 'You have chosen your beverage and set aside distractions.',
    hint:
      'Any beverage works. The practice is about presence, not about tea specifically. ' +
      'Even a glass of water from the tap is fine.',
    conceptsExplored: ['mb-phil-zen', 'mb-phil-mindfulness-daily'],
  },
  {
    instruction:
      'Begin preparing your beverage. As you fill the kettle or pot, feel its weight ' +
      'change as the water enters. Listen to the sound of the water. Watch it flow. ' +
      'You are not thinking about the water -- you are experiencing it directly.',
    expectedOutcome: 'You noticed the sensory details of filling the kettle.',
    hint:
      'If your mind jumps to something else, that is fine. Gently bring your attention ' +
      'back to what your hands are doing. This is the same returning as in meditation.',
    conceptsExplored: ['mb-phil-zen', 'mb-phil-mindfulness-daily', 'mb-med-vipassana'],
  },
  {
    instruction:
      'Wait for the water to heat. Instead of reaching for your phone or doing something ' +
      'else, just wait. Listen to the water heating. Watch for steam. Feel the warmth ' +
      'if you hold your hand near the kettle. Notice the urge to check something, to ' +
      'multitask, to fill the time. Notice it without acting on it.',
    expectedOutcome: 'You waited with presence, noticing the urge to fill the time.',
    hint:
      'The urge to do something else IS the practice moment. Zen calls this "just sitting" ' +
      'or "just waiting." It is harder than it sounds.',
    conceptsExplored: ['mb-phil-zen', 'mb-phil-shoshin', 'mb-med-vipassana'],
  },
  {
    instruction:
      'Pour the water and prepare your drink. Watch the color change if using tea or ' +
      'coffee. Smell the aroma. Feel the warmth of the cup through your hands. Hold ' +
      'the cup with both hands if you can. Let the warmth be the only thing you notice.',
    expectedOutcome: 'You prepared your beverage while staying present with the sensory details.',
    hint:
      'Using both hands to hold the cup is a practice from Japanese tea ceremony. ' +
      'It naturally focuses attention because both hands are occupied.',
    conceptsExplored: ['mb-phil-zen', 'mb-phil-mindfulness-daily'],
  },
  {
    instruction:
      'Take your first sip with full attention. Notice the temperature. The taste. ' +
      'The sensation as the liquid moves through your mouth. The warmth as you swallow. ' +
      'One sip. That is all. The most ordinary act in the world, done with complete ' +
      'presence. That is the entire teaching of Zen, compressed into a cup of tea.',
    expectedOutcome: 'You took one fully attentive sip and noticed multiple sensory details.',
    hint:
      'If it tasted better than usual, that is what attention does. We miss most of ' +
      'our sensory experience because we are somewhere else mentally. Presence is the ' +
      'simplest and most profound practice in all of philosophy.',
    conceptsExplored: ['mb-phil-zen', 'mb-phil-mindfulness-daily', 'mb-phil-shoshin'],
  },
];

export const teaMeditation: TrySessionDefinition = {
  id: 'mb-try-tea-meditation',
  title: 'The Tea Meditation',
  description:
    'Make a cup of tea (or coffee, or water) with complete presence. Feel the weight of ' +
    'the kettle. Listen to the water heating. Hold the warm cup. Take the first sip with ' +
    'full attention. The most ordinary act in the world, done with complete presence.',
  estimatedMinutes: 5,
  prerequisites: [],
  steps,
};

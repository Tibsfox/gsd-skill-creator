/**
 * The Pilates Breath -- the pilates entry point.
 *
 * Lateral thoracic breathing: ribs expand sideways, not belly pushing up.
 * A distinctly different breath pattern from diaphragmatic breathing,
 * giving the user two tools in their toolkit. Ten breaths. Five minutes.
 *
 * @module departments/mind-body/try-sessions/pilates-breath
 */

import type { TrySessionDefinition, TryStep } from '../../../college/try-session-runner.js';

const steps: TryStep[] = [
  {
    instruction:
      'Lie on your back with your knees bent and feet flat on the floor. If you do not ' +
      'have a comfortable floor space, you can do this on a bed or even seated in a chair ' +
      'with your back supported. The key is that your spine is in a neutral position -- ' +
      'not flattened, not arched.',
    expectedOutcome: 'You are lying down or seated with your spine in a comfortable neutral position.',
    hint:
      'Neutral spine means you have a small natural curve in your lower back. ' +
      'You should be able to slide your fingers under the small of your back.',
    conceptsExplored: ['mb-pilates-neutral-spine', 'mb-pilates-powerhouse'],
  },
  {
    instruction:
      'Place your hands on the sides of your lower ribs, fingers pointing toward your ' +
      'belly button. Your hands are going to be your feedback tool -- they will tell ' +
      'you if you are breathing into the right place.',
    expectedOutcome: 'Your hands are positioned on the sides of your lower ribcage.',
    hint: 'Wrap your fingers slightly around the ribs so you can feel movement in all directions.',
    conceptsExplored: ['mb-pilates-powerhouse'],
  },
  {
    instruction:
      'Breathe in through your nose. Instead of letting your belly push upward (like in ' +
      'diaphragmatic breathing), direct the breath into your ribs. You should feel your ' +
      'ribs expand sideways into your hands, like an accordion opening. Your belly stays ' +
      'relatively still.',
    expectedOutcome: 'You felt your ribs expand laterally into your hands while inhaling.',
    hint:
      'This might feel unusual at first. Think about breathing into the sides of your body ' +
      'rather than the front. The belly will move a little -- that is fine. The goal is ' +
      'that the ribs are the primary movement.',
    conceptsExplored: ['mb-pilates-powerhouse', 'mb-pilates-six-principles'],
  },
  {
    instruction:
      'Breathe out through your mouth. As the air leaves, feel your ribs draw together ' +
      'and downward. Notice a gentle tightening deep in your abdomen -- below your navel. ' +
      'This is your deep abdominal wall (the transversus abdominis) engaging. You are not ' +
      'crunching or flexing. It is a subtle drawing inward.',
    expectedOutcome: 'You felt your ribs close together on the exhale and noticed a deep abdominal engagement.',
    hint:
      'Imagine your ribs are closing like a book. The abdominal engagement should feel ' +
      'like gently zipping up a tight pair of pants -- subtle, not forceful.',
    conceptsExplored: ['mb-pilates-powerhouse', 'mb-pilates-six-principles'],
  },
  {
    instruction:
      'Continue this pattern for ten breaths. Inhale -- ribs expand sideways. Exhale -- ' +
      'ribs draw together, deep abs gently engage. Keep your shoulders relaxed and away ' +
      'from your ears. There is no rush. Each breath can take 5-8 seconds.',
    expectedOutcome: 'You completed ten rounds of lateral thoracic breathing.',
    hint:
      'If you lose the rib expansion and start belly-breathing, that is fine. Just ' +
      'redirect on the next breath. Both patterns are valid -- you are learning a new one.',
    conceptsExplored: ['mb-pilates-powerhouse', 'mb-pilates-six-principles', 'mb-breath-diaphragmatic'],
  },
  {
    instruction:
      'After your tenth breath, let your hands rest at your sides. Take two natural ' +
      'breaths without trying to control anything. Notice the difference between the ' +
      'Pilates breath (ribs sideways) and the belly breath from Module 1. You now have ' +
      'two distinct breathing tools -- one for relaxation, one for core activation.',
    expectedOutcome: 'You noticed the difference between lateral thoracic and diaphragmatic breathing.',
    hint:
      'Diaphragmatic breathing (belly breathing) activates the calming response. ' +
      'Pilates breathing (rib breathing) activates your core stability muscles. ' +
      'Both are useful. Neither is better.',
    conceptsExplored: ['mb-pilates-six-principles', 'mb-breath-diaphragmatic'],
  },
];

export const pilatesBreath: TrySessionDefinition = {
  id: 'mb-try-pilates-breath',
  title: 'The Pilates Breath',
  description:
    'Lateral thoracic breathing -- the signature breath pattern of Pilates. Lie on your ' +
    'back, hands on ribs, and learn to breathe sideways into the ribcage instead of into ' +
    'the belly. Ten breaths. A different tool from the diaphragmatic breathing in Module 1.',
  estimatedMinutes: 5,
  prerequisites: [],
  steps,
};

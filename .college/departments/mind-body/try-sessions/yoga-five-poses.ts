/**
 * Five Poses, Five Breaths -- the yoga entry point.
 *
 * A standing micro-sequence that teaches breath-movement synchronization.
 * Mountain to Forward Fold to Halfway Lift and back. No mat required.
 * No flexibility required. One breath per transition.
 *
 * @module departments/mind-body/try-sessions/yoga-five-poses
 */

import type { TrySessionDefinition, TryStep } from '../../../college/try-session-runner.js';

const steps: TryStep[] = [
  {
    instruction:
      'Stand with your feet hip-width apart. Let your arms hang naturally at your sides. ' +
      'Spread your toes and feel the floor beneath all four corners of each foot -- ' +
      'big toe, little toe, inner heel, outer heel. Stand tall but not stiff. ' +
      'This is Mountain Pose (Tadasana in Sanskrit). Take one full breath here.',
    expectedOutcome: 'You are standing balanced with weight evenly distributed across both feet.',
    hint: 'If you feel wobbly, bring your feet slightly closer together. Stability first.',
    conceptsExplored: ['mb-yoga-tadasana', 'mb-breath-diaphragmatic'],
  },
  {
    instruction:
      'As you breathe out, slowly fold forward from your hips. Let your arms and head ' +
      'hang heavy. Bend your knees as much as you need -- this is not about touching ' +
      'your toes. Let gravity do the work. Your hands might reach your shins, your ' +
      'knees, or the floor. All of those are correct. This is Forward Fold ' +
      '(Uttanasana).',
    expectedOutcome: 'You folded forward with bent or straight knees, letting your upper body hang.',
    hint:
      'Bend your knees generously. This is about the fold at the hips, not straight legs. ' +
      'There is zero benefit to forcing straight legs.',
    conceptsExplored: ['mb-yoga-forward-fold', 'mb-yoga-breath-movement'],
  },
  {
    instruction:
      'As you breathe in, place your fingertips on your shins (or thighs if that is ' +
      'more comfortable). Lift your chest until your back is flat like a tabletop. ' +
      'Look slightly forward. This is Halfway Lift (Ardha Uttanasana). Your back ' +
      'should feel long, not rounded.',
    expectedOutcome: 'You lifted your torso to a flat-back position while inhaling.',
    hint:
      'Think about lengthening your spine rather than lifting high. Hands on thighs ' +
      'is perfectly fine.',
    conceptsExplored: ['mb-yoga-forward-fold', 'mb-yoga-breath-movement'],
  },
  {
    instruction:
      'As you breathe out, fold forward again. Release your hands. Let your head hang. ' +
      'Same Forward Fold as before. Notice if it feels any different the second time.',
    expectedOutcome: 'You returned to Forward Fold with an exhale.',
    hint: 'No need to go deeper. Just return to where you were.',
    conceptsExplored: ['mb-yoga-forward-fold', 'mb-yoga-breath-movement'],
  },
  {
    instruction:
      'As you breathe in, slowly roll up to standing one vertebra at a time, head ' +
      'coming up last. Return to Mountain Pose. Stand for one breath and notice how ' +
      'your body feels compared to when you started. You just completed a yoga sequence.',
    expectedOutcome: 'You returned to standing and noticed the effect of the sequence.',
    hint:
      'Roll up slowly. If you get dizzy, pause halfway with a slight knee bend. ' +
      'This is completely normal.',
    conceptsExplored: ['mb-yoga-tadasana', 'mb-yoga-breath-movement'],
  },
];

export const yogaFivePoses: TrySessionDefinition = {
  id: 'mb-try-yoga-five-poses',
  title: 'Five Poses, Five Breaths',
  description:
    'A standing micro-sequence: Mountain, Forward Fold, Halfway Lift, Forward Fold, ' +
    'Mountain. One breath per transition. Five minutes. No equipment needed. Teaches the ' +
    'fundamental yoga principle of synchronizing breath with movement.',
  estimatedMinutes: 5,
  prerequisites: [],
  steps,
};

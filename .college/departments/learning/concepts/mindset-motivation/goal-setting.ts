import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const goalSetting: RosettaConcept = {
  id: 'learn-goal-setting',
  name: 'Goal Setting',
  domain: 'learning',
  description:
    'Effective goal setting translates motivation into directed action with measurable outcomes. ' +
    'SMART criteria: Specific (what exactly will be learned/produced), Measurable (how will you ' +
    'know you\'ve succeeded), Achievable (within current capacity with effort), Relevant (connected ' +
    'to larger purposes), Time-bound (deadline or review schedule). Learning goals vs. performance ' +
    'goals: learning goals ("understand Chapter 4 well enough to explain it") produce more adaptive ' +
    'behavior under difficulty than performance goals ("score above 90%"), particularly for ' +
    'challenging new material. Implementation intentions (if-then plans): "When I sit down at my ' +
    'desk at 7pm, I will do 25 minutes of Spanish vocabulary practice" dramatically improve ' +
    'follow-through vs. intentions alone. Progress tracking: externalizing progress (habit trackers, ' +
    'checklists, learning logs) provides feedback and creates satisfaction from visible progress. ' +
    'Proximal goals (this week) sustain motivation better than distal goals (this semester) alone.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'learn-growth-mindset',
      description: 'Effective goal setting requires a growth mindset — fixed mindset learners avoid challenging goals that risk "exposing" low ability',
    },
    {
      type: 'analogy',
      targetId: 'learn-intrinsic-motivation',
      description: 'Goal setting translates intrinsic motivation into structured action — autonomy in goal selection is itself motivating',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.36 + 0.16),
    angle: Math.atan2(0.4, 0.6),
  },
};

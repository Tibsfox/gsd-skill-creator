import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const spacedRepetition: RosettaConcept = {
  id: 'learn-spaced-repetition',
  name: 'Spaced Repetition',
  domain: 'learning',
  description:
    'Spaced repetition schedules review sessions at increasing time intervals to beat ' +
    'the forgetting curve (Ebbinghaus, 1885). The forgetting curve shows exponential ' +
    'decay of memory without review: ~70% forgotten within 24 hours, ~90% within a week. ' +
    'Each retrieval practice session resets the forgetting curve at a higher level and ' +
    'lengthens the time before the next review is needed. ' +
    'Spaced repetition algorithm (SuperMemo SM-2, used by Anki): easy items are reviewed ' +
    'after days to weeks; difficult items after hours to days. The result is optimal ' +
    'efficiency -- you study each item at exactly the moment it\'s about to be forgotten. ' +
    'Comparison: a student who reviews all their material one night before an exam ' +
    'will likely pass but forget 90% within a month. A student using spaced repetition ' +
    'retains 80-90% at 30 days with less total study time. Medical students using Anki ' +
    'consistently outperform those using traditional study on long-term knowledge retention tests.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'learn-retrieval-practice',
      description: 'Spaced repetition schedules when to do retrieval practice for maximum efficiency',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.36 + 0.09),
    angle: Math.atan2(0.3, 0.6),
  },
};

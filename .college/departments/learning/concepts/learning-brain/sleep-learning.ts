import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const sleepLearning: RosettaConcept = {
  id: 'learn-sleep-learning',
  name: 'Sleep & Learning',
  domain: 'learning',
  description:
    'Sleep plays an indispensable role in memory consolidation — the process of transferring ' +
    'information from fragile short-term to stable long-term memory. During slow-wave (deep) sleep, ' +
    'the hippocampus "replays" recent experiences and transfers them to neocortical storage ' +
    '(systems consolidation). REM sleep supports procedural memory consolidation (motor skills, ' +
    'creative connections) and emotional memory processing. Sleep spindles (bursts of neural ' +
    'activity during Stage 2) correlate with declarative memory improvement. The research ' +
    'implication for learners: studying before sleep rather than early morning maximizes ' +
    'consolidation; pulling all-nighters before exams impairs memory, not enhances it. Sleep ' +
    'deprivation degrades attention, working memory capacity, and emotional regulation — all ' +
    'critical for learning. Naps (10-20 min) provide cognitive restoration without sleep inertia. ' +
    'Teen sleep biology: circadian rhythm shifts toward later sleep-wake cycles (biological, not ' +
    'behavioral) — early school start times conflict with optimal learning windows.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'learn-memory-science',
      description: 'Sleep is the primary physiological process supporting memory consolidation described in memory science',
    },
    {
      type: 'analogy',
      targetId: 'learn-neuroplasticity',
      description: 'Both sleep and neuroplasticity involve structural brain changes that consolidate learning experiences',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.25 + 0.25),
    angle: Math.atan2(0.5, 0.5),
  },
};

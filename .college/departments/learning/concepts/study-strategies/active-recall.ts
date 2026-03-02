import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const activeRecall: RosettaConcept = {
  id: 'learn-active-recall',
  name: 'Active Recall',
  domain: 'learning',
  description:
    'Active recall is the practice of generating information from memory rather than passively ' +
    're-reading or reviewing it. The testing effect (Roediger & Karpicke): retrieving information ' +
    'from memory produces greater long-term retention than equivalent re-study time — even when ' +
    'retrieval is difficult and produces errors. Mechanisms: retrieval practice strengthens memory ' +
    'traces (desirable difficulty), elaborates connections during reconstruction, and improves ' +
    'metacognitive accuracy about what is and isn\'t known. Implementation methods: blank page ' +
    'recall (write everything you know about a topic without notes), flashcard self-testing ' +
    '(flip only after generating an answer), practice problem completion (before checking ' +
    'solutions), teaching-back (explain the material to someone), and elaborative interrogation ' +
    '(ask "why is this true?" and generate an answer). Contrast with passive study: highlighting, ' +
    'rereading, and watching explanatory videos may feel productive but produce poor long-term ' +
    'retention. Active recall is cognitively effortful — that difficulty is the signal of effective ' +
    'encoding, not a sign to seek an easier method.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'learn-retrieval-practice',
      description: 'Active recall is the broader learning principle; retrieval practice is the systematic application of that principle',
    },
    {
      type: 'analogy',
      targetId: 'learn-spaced-repetition',
      description: 'Active recall and spaced repetition are complementary principles — what to do during each practice session and when to schedule sessions',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const retrievalPractice: RosettaConcept = {
  id: 'learn-retrieval-practice',
  name: 'Retrieval Practice',
  domain: 'learning',
  description:
    'Retrieval practice (the testing effect) is the most evidence-backed learning strategy ' +
    'in cognitive psychology. When you recall information from memory, you strengthen that ' +
    'memory more than when you re-read the same material. The key mechanism: retrieval ' +
    'practice forces reconstruction of the memory trace, which strengthens the pathways. ' +
    'Re-reading creates fluency illusion -- the text feels familiar but the memory is not stronger. ' +
    'Implementation: after reading or learning, close the book and write everything you remember. ' +
    'Flashcards (paper or Anki) are the most common retrieval practice tool; the act of producing ' +
    'the answer matters more than checking it. ' +
    'The spacing effect compounds retrieval practice: retrieving something at increasing intervals ' +
    '(spaced repetition) builds dramatically more durable memory than massed practice. ' +
    'Testing yourself before studying new material (pre-testing) also improves later learning, ' +
    'even when you answer incorrectly -- the error creates a learning desirable difficulty.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'learn-memory-science',
      description: 'Retrieval practice works because of how memory encoding and consolidation function',
    },
    {
      type: 'dependency',
      targetId: 'learn-spaced-repetition',
      description: 'Retrieval practice combined with spaced repetition is the most powerful study system',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.49 + 0.04),
    angle: Math.atan2(0.2, 0.7),
  },
};

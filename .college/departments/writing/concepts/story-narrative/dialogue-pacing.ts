import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const dialoguePacing: RosettaConcept = {
  id: 'writ-dialogue-pacing',
  name: 'Dialogue & Pacing',
  domain: 'writing',
  description: 'Dialogue reveals character, advances plot, and controls pacing. ' +
    'Good dialogue sounds like people talking but is more efficient -- real conversation is repetitive and vague. ' +
    'Each speaker should sound distinctive -- readers should be able to identify speakers without attribution. ' +
    'Subtext: what characters mean but do not say directly (Hemingway\'s iceberg theory). ' +
    'Dialogue punctuation: "I\'m leaving," she said. (comma before closing quote, lowercase said). ' +
    'Pacing controls experience of time: ' +
    'Short sentences speed up. Long sentences stretch out time and create a sense of deliberation, ' +
    'inviting the reader to slow down and notice the accumulation of detail. ' +
    'Scene (dramatized, detailed) alternates with summary (compressed, told) to vary pace.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'writ-character-development',
      description: 'Dialogue is the primary way characters reveal themselves in fiction',
    },
    {
      type: 'cross-reference',
      targetId: 'lang-conversation-strategies',
      description: 'Real conversation strategies (turn-taking, repair) inform realistic fictional dialogue',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.49 + 0.1225),
    angle: Math.atan2(0.35, 0.7),
  },
};

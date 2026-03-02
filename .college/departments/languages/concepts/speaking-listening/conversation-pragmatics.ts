import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const conversationPragmatics: RosettaConcept = {
  id: 'lang-conversation-pragmatics',
  name: 'Conversation and Pragmatics',
  domain: 'languages',
  description: 'Pragmatics studies how context shapes meaning beyond literal word definitions. ' +
    'Speech acts: utterances do things -- promises, requests, apologies, refusals. "Can you open the window?" is a request, not a yes/no question. ' +
    'Grice\'s maxims: cooperative conversation follows (usually) quantity, quality, relation, and manner. Violations create implicature. ' +
    'Turn-taking: different cultures have different rules for turn-taking -- overlapping speech is rude in some cultures, expected in others. ' +
    'Politeness strategies (Brown & Levinson): positive politeness (solidarity), negative politeness (deference), indirect speech acts. ' +
    'Requests: English uses indirection ("I wonder if you could..."). Japanese has grammaticalized politeness. Spanish varies by region. ' +
    'Pragmatic failure: understanding words but not what was meant -- often more offensive than grammatical errors. ' +
    'Conversation repair: strategies for fixing communication breakdowns (repetition, paraphrase, explicit checking).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'lang-fluency-accuracy',
      description: 'Pragmatic competence requires enough fluency to handle real-time conversational demands',
    },
    {
      type: 'cross-reference',
      targetId: 'lang-language-culture',
      description: 'Pragmatic norms are culturally embedded -- politeness strategies differ systematically across language communities',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.2025 + 0.4225),
    angle: Math.atan2(0.65, 0.45),
  },
};

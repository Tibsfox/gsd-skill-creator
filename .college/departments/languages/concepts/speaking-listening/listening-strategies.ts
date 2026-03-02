import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const listeningStrategies: RosettaConcept = {
  id: 'lang-listening-strategies',
  name: 'Listening Comprehension Strategies',
  domain: 'languages',
  description: 'Listening is the most frequently used language skill but often receives the least explicit instruction. ' +
    'Bottom-up processing: parsing individual sounds, words, and grammatical forms from the speech stream. ' +
    'Top-down processing: using context, background knowledge, and discourse structure to predict and interpret. ' +
    'The cocktail party effect: selective attention allows tuning in on one conversation in a noisy room -- this is trainable. ' +
    'Connected speech phenomena: native speakers reduce, link, and delete sounds. "Did you eat yet?" → "Dijeat?". ' +
    'Schema-building: building rich world knowledge improves listening because comprehension is partly inference. ' +
    'Subvocalization: some learners translate internally before understanding -- overcoming this is a key fluency breakthrough. ' +
    'Active listening strategies: predicting, monitoring comprehension, clarifying, summarizing, inferring from context. ' +
    'Extensive listening: large volumes of comprehensible audio (podcasts, films with subtitles) builds automatic processing.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'lang-ear-training',
      description: 'Listening comprehension rests on phoneme perception -- ear training is the foundation of listening strategy',
    },
    {
      type: 'cross-reference',
      targetId: 'psych-attention-memory',
      description: 'Selective attention and working memory capacity determine how much of the speech stream can be processed simultaneously',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.4225 + 0.16),
    angle: Math.atan2(0.4, 0.65),
  },
};

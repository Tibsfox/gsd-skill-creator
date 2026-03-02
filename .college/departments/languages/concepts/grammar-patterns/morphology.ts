import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const morphology: RosettaConcept = {
  id: 'lang-morphology',
  name: 'Morphology and Word Formation',
  domain: 'languages',
  description: 'Morphology studies how words are built from smaller meaningful units called morphemes. ' +
    'Free morphemes stand alone ("cat", "run"). Bound morphemes attach to others ("-ing", "-un", "-ed"). ' +
    'Agglutinative languages (Turkish, Finnish): stack morphemes transparently -- Turkish "evlerinizden" = "from your houses" (house+plural+your+from). ' +
    'Fusional languages (Spanish, Russian): morphemes fuse -- Spanish "hablo" encodes first person + singular + present + indicative in one ending. ' +
    'Isolating languages (Mandarin): minimal morphology, meaning conveyed by word order and particles. ' +
    'Derivational morphology creates new words (teach → teacher → teachable). ' +
    'Inflectional morphology marks grammatical categories: number, tense, case, gender, person. ' +
    'Knowing morpheme patterns lets you decode unfamiliar words and build vocabulary systematically.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'lang-word-order-typology',
      description: 'Morphological type predicts word order patterns -- agglutinative languages tend to be SOV',
    },
    {
      type: 'cross-reference',
      targetId: 'code-syntax-style',
      description: 'Programming languages also have morphology -- suffixes like -ing, -able in natural language parallel type suffixes and naming conventions in code',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.3025 + 0.3025),
    angle: Math.atan2(0.55, 0.55),
  },
};

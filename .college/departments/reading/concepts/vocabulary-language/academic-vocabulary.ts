import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const academicVocabulary: RosettaConcept = {
  id: 'read-academic-vocabulary',
  name: 'Academic Vocabulary',
  domain: 'reading',
  description: 'Tier 2 words (analyze, contrast, significant) appear across content areas and are rarely taught explicitly. Tier 3 words (photosynthesis, denominator) are domain-specific technical terms. Strong academic vocabulary predicts reading comprehension, writing quality, and academic success. Explicit, rich vocabulary instruction with multiple exposures is more effective than incidental learning alone.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'read-morphology', description: 'Academic vocabulary often has Latin/Greek origins accessible through morphological analysis' },
    { type: 'analogy', targetId: 'read-reading-across-curriculum', description: 'Academic vocabulary bridges all content areas where discipline-specific language appears' },
  ],
  complexPlanePosition: { real: 0.6, imaginary: 0.5, magnitude: Math.sqrt(0.36 + 0.25), angle: Math.atan2(0.5, 0.6) },
};

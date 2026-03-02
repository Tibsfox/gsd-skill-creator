import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const morphology: RosettaConcept = {
  id: 'read-morphology',
  name: 'Morphology: Roots, Prefixes & Suffixes',
  domain: 'reading',
  description: 'Morphology is the study of word structure. Morphemes are the smallest meaningful units: free morphemes (stand-alone words) and bound morphemes (prefixes, suffixes, roots). Knowing Greek and Latin roots (port = carry, dict = say, graph = write) and common affixes provides a powerful toolkit for inferring the meaning of unfamiliar words across all subjects.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'read-word-learning-strategies', description: 'Morphological analysis is a core word-learning strategy' },
    { type: 'dependency', targetId: 'read-academic-vocabulary', description: 'Academic vocabulary often derives from Latin and Greek roots accessible through morphological analysis' },
  ],
  complexPlanePosition: { real: 0.65, imaginary: 0.4, magnitude: Math.sqrt(0.4225 + 0.16), angle: Math.atan2(0.4, 0.65) },
};

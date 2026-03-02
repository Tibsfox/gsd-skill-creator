import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const evaluatingBias: RosettaConcept = {
  id: 'read-evaluating-bias',
  name: 'Recognizing Bias in Texts',
  domain: 'reading',
  description: 'All texts reflect the perspectives and assumptions of their authors. Bias can appear in word choice (loaded language), selective evidence, omission of opposing views, and framing. Recognizing bias does not mean dismissing a text but understanding how perspective shapes content. Comparing multiple sources on the same topic helps reveal individual biases.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'read-author-purpose-perspective', description: 'Bias detection begins with identifying the author\'s perspective and purpose' },
    { type: 'cross-reference', targetId: 'crit-confirmation-bias', description: 'Reader bias (favoring texts that confirm beliefs) parallels the cognitive bias identified in critical thinking' },
  ],
  complexPlanePosition: { real: 0.45, imaginary: 0.7, magnitude: Math.sqrt(0.2025 + 0.49), angle: Math.atan2(0.7, 0.45) },
};

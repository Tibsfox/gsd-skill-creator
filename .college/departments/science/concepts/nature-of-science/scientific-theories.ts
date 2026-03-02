import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const scientificTheories: RosettaConcept = {
  id: 'sci-scientific-theories',
  name: 'Scientific Theories & Laws',
  domain: 'science',
  description:
    'A scientific theory is a well-substantiated explanation for a broad range of phenomena, supported ' +
    'by extensive evidence. It is not a guess -- theories like evolution, plate tectonics, and atomic ' +
    'theory are among the most thoroughly tested explanations in all of human knowledge. A scientific ' +
    'law describes a pattern (e.g., Newton\'s laws of motion) without explaining why. Both are important ' +
    'and distinct from everyday usage of "theory."',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'sci-paradigm-shifts',
      description: 'Theories are occasionally overturned or refined through paradigm shifts in scientific understanding',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.8,
    magnitude: Math.sqrt(0.09 + 0.64),
    angle: Math.atan2(0.8, 0.3),
  },
};

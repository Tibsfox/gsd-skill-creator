import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const reverseEngineering: RosettaConcept = {
  id: 'tech-reverse-engineering',
  name: 'Reverse Engineering',
  domain: 'technology',
  description:
    'Reverse engineering disassembles and analyzes an existing product to understand how it was designed and made. ' +
    'It reveals design decisions, material choices, manufacturing processes, tolerances, and failure points. ' +
    'Learning by reverse engineering is one of the most effective ways to develop design and fabrication skills. ' +
    'Industrial applications: competitive analysis, legacy part reproduction, failure investigation, and interoperability. ' +
    'Legal and ethical considerations: reverse engineering for study is generally permitted; for copying trademarks is not.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'tech-product-design',
      description: 'Reverse engineering works backwards from the product to reconstruct the design decisions that produced it',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.3025 + 0.4225),
    angle: Math.atan2(0.65, 0.55),
  },
};

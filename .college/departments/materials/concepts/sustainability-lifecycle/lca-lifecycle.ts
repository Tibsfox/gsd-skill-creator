import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const lcaLifecycle: RosettaConcept = {
  id: 'mfab-lca-lifecycle',
  name: 'Life Cycle Assessment',
  domain: 'materials',
  description:
    'Life cycle assessment (LCA) quantifies the environmental impacts of a product from cradle to grave: ' +
    'raw material extraction → processing → manufacturing → distribution → use → end-of-life. ' +
    'Impact categories include global warming potential, energy consumption, water use, and toxicity. ' +
    'LCA reveals where in the lifecycle the greatest impacts occur, enabling targeted improvements. ' +
    'It is increasingly required for environmental product declarations and sustainable procurement decisions.',
  panels: new Map(),
  relationships: [],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.3025 + 0.4225),
    angle: Math.atan2(0.65, 0.55),
  },
};

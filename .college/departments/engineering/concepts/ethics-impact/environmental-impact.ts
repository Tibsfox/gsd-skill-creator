import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const environmentalImpact: RosettaConcept = {
  id: 'engr-environmental-impact',
  name: 'Environmental Impact Assessment',
  domain: 'engineering',
  description:
    'Environmental impact assessment (EIA) evaluates the environmental consequences of proposed engineering projects ' +
    'before they proceed. It covers air and water quality, biodiversity, noise, waste generation, and land use. ' +
    'Life cycle assessment (LCA) quantifies environmental impacts across the product\'s full life: ' +
    'raw material extraction, manufacturing, use, and end-of-life disposal. ' +
    'Engineers increasingly incorporate environmental criteria as design requirements, not just constraints to minimize.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'engr-engineering-ethics',
      description: 'Environmental responsibility is an extension of the engineer\'s ethical obligation to public welfare',
    },
  ],
  complexPlanePosition: {
    real: 0.35,
    imaginary: 0.85,
    magnitude: Math.sqrt(0.1225 + 0.7225),
    angle: Math.atan2(0.85, 0.35),
  },
};

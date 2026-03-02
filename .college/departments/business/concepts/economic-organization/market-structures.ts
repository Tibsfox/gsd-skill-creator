import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const marketStructures: RosettaConcept = {
  id: 'bus-market-structures',
  name: 'Market Structures',
  domain: 'business',
  description:
    'Market structure describes the competitive environment in which firms operate. ' +
    'Four types: perfect competition (many firms, identical products, no market power), ' +
    'monopolistic competition (many firms, differentiated products), ' +
    'oligopoly (few dominant firms, interdependent decisions), ' +
    'monopoly (single seller with pricing power). ' +
    'Structure determines pricing power, profit potential, entry barriers, and innovation incentives.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'bus-supply-demand',
      description: 'Market structures modify the basic supply-demand model by introducing varying degrees of market power',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};

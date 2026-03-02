import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const greenChemistry: RosettaConcept = {
  id: 'chem-green-chemistry',
  name: 'Green Chemistry',
  domain: 'chemistry',
  description: 'Green chemistry aims to design chemical processes that reduce or eliminate hazardous substances. The 12 principles include atom economy (maximizing incorporation of starting materials into product), preventing waste, using renewable feedstocks, and designing for degradation. Green chemistry is both environmentally motivated and economically advantageous.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'chem-balancing-equations', description: 'Atom economy is calculated from the balanced equation for the desired reaction' },
    { type: 'cross-reference', targetId: 'mfab-circular-economy', description: 'Green chemistry and the circular economy share the goal of closing material loops' },
  ],
  complexPlanePosition: { real: 0.4, imaginary: 0.75, magnitude: Math.sqrt(0.16 + 0.5625), angle: Math.atan2(0.75, 0.4) },
};

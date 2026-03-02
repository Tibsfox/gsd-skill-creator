import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const polymers: RosettaConcept = {
  id: 'chem-polymers',
  name: 'Polymers',
  domain: 'chemistry',
  description: 'Polymers are long chain molecules formed by linking small repeating units (monomers). Natural polymers include proteins, DNA, and cellulose; synthetic polymers include polyethylene, nylon, and rubber. Polymer properties depend on monomer chemistry, chain length, and branching. Addition and condensation polymerization are the two main synthetic routes.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'chem-covalent-bonding', description: 'Polymer chains are held together by covalent bonds between monomers' },
    { type: 'cross-reference', targetId: 'mfab-polymers', description: 'Materials science studies polymer structure-property relationships for engineering applications' },
  ],
  complexPlanePosition: { real: 0.7, imaginary: 0.4, magnitude: Math.sqrt(0.49 + 0.16), angle: Math.atan2(0.4, 0.7) },
};

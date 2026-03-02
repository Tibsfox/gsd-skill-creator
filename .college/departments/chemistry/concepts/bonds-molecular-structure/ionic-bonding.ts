import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const ionicBonding: RosettaConcept = {
  id: 'chem-ionic-bonding',
  name: 'Ionic Bonding',
  domain: 'chemistry',
  description: 'Ionic bonds form when electrons transfer from a metal to a nonmetal, creating oppositely charged ions that attract electrostatically. The resulting ionic compounds form crystal lattices with high melting points, electrical conductivity when dissolved, and brittleness. Examples include table salt (NaCl) and calcium fluoride (CaF₂).',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'chem-periodic-trends', description: 'Electronegativity differences > 1.7 between atoms predict ionic bonding' },
    { type: 'analogy', targetId: 'chem-covalent-bonding', description: 'Ionic and covalent bonding represent the two extremes of electron sharing vs. transfer' },
  ],
  complexPlanePosition: { real: 0.65, imaginary: 0.45, magnitude: Math.sqrt(0.4225 + 0.2025), angle: Math.atan2(0.45, 0.65) },
};

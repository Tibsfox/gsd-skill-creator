import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const periodicTrends: RosettaConcept = {
  id: 'chem-periodic-trends',
  name: 'Periodic Trends',
  domain: 'chemistry',
  description: 'Atomic radius decreases across a period (more protons pull electrons in) and increases down a group (more electron shells). Electronegativity (tendency to attract electrons) increases across periods and decreases down groups. Ionization energy (energy to remove an electron) follows the same pattern as electronegativity. These trends enable prediction of bonding and reactivity without memorization.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'chem-periodic-table-organization', description: 'Trends are patterns within the periodic table structure' },
    { type: 'dependency', targetId: 'chem-ionic-bonding', description: 'Electronegativity differences predict whether bonding will be ionic or covalent' },
  ],
  complexPlanePosition: { real: 0.55, imaginary: 0.55, magnitude: Math.sqrt(0.3025 + 0.3025), angle: Math.atan2(0.55, 0.55) },
};

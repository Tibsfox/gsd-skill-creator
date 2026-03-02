import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const periodicTableOrganization: RosettaConcept = {
  id: 'chem-periodic-table-organization',
  name: 'Periodic Table Organization',
  domain: 'chemistry',
  description: 'The periodic table arranges elements by increasing atomic number in rows (periods) and groups (columns) of similar chemical behavior. Metals occupy the left and center; nonmetals the right; metalloids form a diagonal boundary. Groups share valence electron counts and similar reactivity. Periods indicate the highest energy electron shell in use.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'chem-atomic-structure', description: 'The periodic table structure emerges from electron configuration patterns' },
    { type: 'dependency', targetId: 'chem-periodic-trends', description: 'The table organizes the trends in atomic properties as a predictive tool' },
  ],
  complexPlanePosition: { real: 0.7, imaginary: 0.35, magnitude: Math.sqrt(0.49 + 0.1225), angle: Math.atan2(0.35, 0.7) },
};

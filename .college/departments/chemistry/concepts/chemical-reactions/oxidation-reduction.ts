import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const oxidationReduction: RosettaConcept = {
  id: 'chem-oxidation-reduction',
  name: 'Oxidation-Reduction (Redox)',
  domain: 'chemistry',
  description: 'Redox reactions involve electron transfer: the species losing electrons is oxidized; the species gaining electrons is reduced (OIL RIG: Oxidation Is Loss, Reduction Is Gain). Electrochemistry converts chemical energy to electrical energy (galvanic cells/batteries) or vice versa (electrolytic cells). Oxidation states track electron distribution in molecules.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'chem-reaction-types', description: 'Redox reactions are a major category overlapping multiple reaction types' },
    { type: 'cross-reference', targetId: 'phys-electromagnetic-induction', description: 'Batteries and fuel cells convert chemical redox energy to electrical energy' },
  ],
  complexPlanePosition: { real: 0.55, imaginary: 0.6, magnitude: Math.sqrt(0.3025 + 0.36), angle: Math.atan2(0.6, 0.55) },
};

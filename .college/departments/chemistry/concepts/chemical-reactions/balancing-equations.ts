import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const balancingEquations: RosettaConcept = {
  id: 'chem-balancing-equations',
  name: 'Balancing Chemical Equations',
  domain: 'chemistry',
  description: 'Chemical equations represent reactions using formulas and symbols. Balancing ensures the number of each type of atom is equal on both sides (law of conservation of mass). Coefficients (not subscripts) are adjusted to balance. Balanced equations enable stoichiometry: calculating amounts of reactants needed and products formed in a given reaction.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'chem-reaction-types', description: 'Each type of chemical reaction has characteristic patterns that guide balancing' },
  ],
  complexPlanePosition: { real: 0.75, imaginary: 0.25, magnitude: Math.sqrt(0.5625 + 0.0625), angle: Math.atan2(0.25, 0.75) },
};

import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const thermochemistry: RosettaConcept = {
  id: 'chem-thermochemistry',
  name: 'Thermochemistry',
  domain: 'chemistry',
  description: 'Thermochemistry studies heat changes in chemical reactions. Exothermic reactions release heat (negative enthalpy change); endothermic reactions absorb heat. Hess\'s law allows calculation of enthalpy changes for reactions that cannot be measured directly. Bond energies quantify the energy stored in chemical bonds and consumed or released when bonds break and form.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'chem-reaction-types', description: 'All chemical reactions involve enthalpy changes that thermochemistry quantifies' },
    { type: 'cross-reference', targetId: 'phys-thermodynamics', description: 'Thermochemistry applies the first law of thermodynamics to chemical systems' },
  ],
  complexPlanePosition: { real: 0.4, imaginary: 0.75, magnitude: Math.sqrt(0.16 + 0.5625), angle: Math.atan2(0.75, 0.4) },
};

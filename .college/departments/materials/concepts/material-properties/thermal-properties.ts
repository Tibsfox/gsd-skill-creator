import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const thermalProperties: RosettaConcept = {
  id: 'mfab-thermal-properties',
  name: 'Thermal Properties',
  domain: 'materials',
  description:
    'Thermal properties determine how materials behave under temperature changes. ' +
    'Thermal conductivity (rate of heat flow), thermal expansion coefficient (dimensional change per degree), ' +
    'melting point, and heat capacity (energy needed to raise temperature) are key parameters. ' +
    'Thermal fatigue from repeated heating and cooling cycles causes failure in engines and electronics. ' +
    'Material selection for thermal applications requires matching all these properties to the use environment.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mfab-mechanical-properties',
      description: 'Many materials lose mechanical properties (strength, stiffness) significantly at elevated temperatures',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.5625 + 0.1225),
    angle: Math.atan2(0.35, 0.75),
  },
};

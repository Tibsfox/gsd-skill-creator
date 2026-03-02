import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const density: RosettaConcept = {
  id: 'chem-density',
  name: 'Density',
  domain: 'chemistry',
  description:
    'Density (mass per unit volume) is an intensive property -- it does not change with the amount of substance. ' +
    'It is used to identify substances, explain why objects float or sink, and separate mixtures by centrifugation. ' +
    'Density is temperature-dependent (liquids generally decrease in density with temperature) and explains ' +
    'many phenomena from ocean stratification to hot-air balloons.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'chem-physical-chemical-properties', description: 'Density is a key physical property used to identify and characterize substances' },
    { type: 'cross-reference', targetId: 'phys-work-power', description: 'Density plays a role in buoyancy calculations using Archimedes\' principle' },
  ],
  complexPlanePosition: { real: 0.85, imaginary: 0.15, magnitude: Math.sqrt(0.7225 + 0.0225), angle: Math.atan2(0.15, 0.85) },
};

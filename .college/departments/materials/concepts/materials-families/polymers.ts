import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const polymers: RosettaConcept = {
  id: 'mfab-polymers',
  name: 'Polymers & Plastics',
  domain: 'materials',
  description:
    'Polymers are long-chain molecules built from repeating monomer units. ' +
    'Thermoplastics (polyethylene, PVC, nylon) soften on heating and can be reprocessed. ' +
    'Thermosets (epoxy, polyester) cure irreversibly and cannot be remelted. ' +
    'Elastomers (rubber) have large reversible elastic deformation. ' +
    'Polymers offer low density, easy processability, chemical resistance, and electrical insulation at low cost, ' +
    'but generally lower strength, stiffness, and temperature resistance than metals.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mfab-mechanical-properties',
      description: 'Polymer selection requires comparing mechanical properties against metals and ceramics for the application',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};

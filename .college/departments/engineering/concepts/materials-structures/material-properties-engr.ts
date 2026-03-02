import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const materialPropertiesEngr: RosettaConcept = {
  id: 'engr-material-properties',
  name: 'Material Properties for Engineering',
  domain: 'engineering',
  description:
    'Engineers select materials based on mechanical properties relevant to the application. ' +
    'Stress-strain curves characterize elastic (reversible) and plastic (permanent) deformation. ' +
    'Young\'s modulus (stiffness), yield strength (onset of permanent deformation), ultimate tensile strength, ' +
    'and fracture toughness are critical parameters. ' +
    'Safety factors account for uncertainty: actual strength must exceed design load by a margin.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'engr-structural-loads',
      description: 'Material selection requires matching material strength properties to the calculated structural loads',
    },
  ],
  complexPlanePosition: {
    real: 0.72,
    imaginary: 0.38,
    magnitude: Math.sqrt(0.5184 + 0.1444),
    angle: Math.atan2(0.38, 0.72),
  },
};

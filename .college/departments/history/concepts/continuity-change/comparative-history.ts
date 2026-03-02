import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const comparativeHistory: RosettaConcept = {
  id: 'hist-comparative-history',
  name: 'Comparative History',
  domain: 'history',
  description:
    'Comparative history examines similarities and differences across different societies, regions, or time periods. ' +
    'Why did capitalism emerge in Europe but not China? Why do some revolutions succeed and others fail? ' +
    'Comparison enables generalizations beyond single cases and reveals which factors are essential versus ' +
    'accidental. It prevents the parochialism of studying only one nation\'s history as if it were universal.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'hist-historical-causation',
      description: 'Comparative history isolates causal variables by holding context constant across different cases',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.2025 + 0.49),
    angle: Math.atan2(0.7, 0.45),
  },
};

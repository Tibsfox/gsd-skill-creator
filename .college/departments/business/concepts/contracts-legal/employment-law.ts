import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const employmentLaw: RosettaConcept = {
  id: 'bus-employment-law',
  name: 'Employment Law',
  domain: 'business',
  description:
    'Employment law governs the relationship between employers and employees. ' +
    'Key areas: at-will employment (most US states allow termination without cause), ' +
    'anti-discrimination law (Title VII, ADA, ADEA), wage and hour laws (FLSA — minimum wage, overtime), ' +
    'workplace safety (OSHA), and leave entitlements (FMLA). ' +
    'Employers must understand these frameworks to avoid costly claims and create legally compliant workplaces.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'bus-contract-basics',
      description: 'Employment agreements are a specialized form of contract with additional statutory overlay',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.36 + 0.36),
    angle: Math.atan2(0.6, 0.6),
  },
};

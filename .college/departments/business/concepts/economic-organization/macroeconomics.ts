import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const macroeconomics: RosettaConcept = {
  id: 'bus-macroeconomics',
  name: 'Macroeconomics',
  domain: 'business',
  description:
    'Macroeconomics studies the economy as a whole: GDP growth, inflation, unemployment, trade balances, ' +
    'and monetary and fiscal policy. Key institutions: central banks (set interest rates, money supply) and ' +
    'governments (taxing and spending). Business cycles — expansions, recessions, recovery — affect all firms. ' +
    'Understanding macro context helps businesses plan for demand changes and managers interpret economic news.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'bus-supply-demand',
      description: 'Macroeconomics aggregates individual supply and demand decisions into economy-wide models',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.3025 + 0.36),
    angle: Math.atan2(0.6, 0.55),
  },
};

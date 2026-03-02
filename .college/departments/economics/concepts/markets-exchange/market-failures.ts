import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const marketFailures: RosettaConcept = {
  id: 'econ-market-failures',
  name: 'Market Failures and Externalities',
  domain: 'economics',
  description: 'Market failures occur when free markets do not produce efficient outcomes -- the cases for government intervention. ' +
    'Externalities: costs or benefits that fall on third parties not in the transaction. ' +
    'Negative externalities (pollution): producers do not bear full social cost -- they overproduce. Pigouvian tax corrects this. ' +
    'Positive externalities (education): producers cannot capture full social benefit -- they underproduce. Subsidies correct this. ' +
    'Public goods: non-excludable and non-rival (national defense, clean air) -- free-rider problem leads to underprovision by markets. ' +
    'Common resources: rival but non-excludable -- "tragedy of the commons" (overfishing, overgrazing). ' +
    'Information asymmetry: one party knows more than the other. Akerlof\'s "market for lemons" -- used car market where sellers know quality, buyers don\'t. ' +
    'Moral hazard: insured parties take more risk because they bear less of the cost. ' +
    'Adverse selection: high-risk individuals are more likely to buy insurance -- drives up prices, drives out low-risk buyers.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'econ-supply-demand',
      description: 'Market failures are deviations from the efficient supply-demand equilibrium -- you need the baseline model to understand the failure',
    },
    {
      type: 'cross-reference',
      targetId: 'envr-human-impacts',
      description: 'Environmental degradation is the largest negative externality -- pollution, deforestation, and carbon emissions are market failures at scale',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.25 + 0.4225),
    angle: Math.atan2(0.65, 0.5),
  },
};

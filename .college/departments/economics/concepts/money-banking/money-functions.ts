import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const moneyFunctions: RosettaConcept = {
  id: 'econ-money-functions',
  name: 'Functions of Money',
  domain: 'economics',
  description: 'Money solves the double coincidence of wants problem in barter economies. ' +
    'Three functions of money: medium of exchange (avoid barter), store of value (save purchasing power over time), unit of account (common measure of value). ' +
    'Commodity money: has intrinsic value (gold, silver, shells). Fiat money: valuable only because government declares it legal tender. ' +
    'M1, M2 money supply: M1 = currency + demand deposits; M2 = M1 + savings deposits + small time deposits. ' +
    'Inflation: too much money chasing too few goods -- the price level rises, money loses purchasing power. ' +
    'Hyperinflation: extreme inflation renders currency worthless -- Weimar Germany (1923), Zimbabwe (2008). ' +
    'Deflation: falling prices -- sounds good but discourages spending (why buy today if cheaper tomorrow?), causes economic contraction. ' +
    'The Fisher equation: MV = PQ (money supply × velocity = price level × real output) -- quantity theory of money.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'econ-supply-demand',
      description: 'Money markets work like any other market -- supply and demand for money determine the interest rate (price of money)',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.49 + 0.1225),
    angle: Math.atan2(0.35, 0.7),
  },
};

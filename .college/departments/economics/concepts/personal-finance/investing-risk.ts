import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const investingRisk: RosettaConcept = {
  id: 'econ-investing-risk',
  name: 'Investing and Risk',
  domain: 'economics',
  description: 'Investing is putting money to work to generate returns -- with returns come risk. ' +
    'Asset classes: stocks (equity in companies), bonds (debt), real estate, commodities, cash. Different risk/return profiles. ' +
    'Risk-return relationship: higher expected returns require bearing higher risk -- no free lunch. ' +
    'Diversification: spreading investments across uncorrelated assets reduces portfolio risk without reducing expected return. ' +
    'Systematic risk (market risk): affects all investments (recessions, interest rate changes) -- cannot be diversified away. ' +
    'Unsystematic risk (idiosyncratic): affects specific companies or sectors -- can be eliminated through diversification. ' +
    'Index funds: low-cost funds holding a broad market index -- beat most actively managed funds over long periods. ' +
    'Dollar-cost averaging: investing a fixed amount regularly regardless of price -- reduces timing risk. ' +
    'Time horizon: longer horizons can take more risk -- short-term volatility smooths out over decades.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'econ-budgeting-saving',
      description: 'Investing requires capital to invest -- saving is the prerequisite for investing',
    },
    {
      type: 'cross-reference',
      targetId: 'data-probability-basics',
      description: 'Investment risk is measured probabilistically -- variance and standard deviation of returns are the core risk metrics',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.4225 + 0.2025),
    angle: Math.atan2(0.45, 0.65),
  },
};
